-- Fix lost updates between concurrent grocery-list regenerations.
--
-- Regeneration (src/server/grocery-lists.server.ts) reads a list's recipe
-- links and ingredients over PostgREST, aggregates in TypeScript, then
-- replaces the generated items. Two concurrent mutations (e.g. two members
-- adding different recipes) could commit their replaces out of order, so the
-- later write came from the older snapshot and silently dropped a recipe.
--
-- Fix: every regeneration takes a ticket from a global sequence AFTER its
-- mutation commits and BEFORE it reads inputs; the replace skips its write if
-- a regeneration with a later ticket already wrote the list (its inputs are at
-- least as new). The latest-ticketed regeneration therefore always writes, and
-- it read after every mutation that preceded it.

create sequence public.grocery_list_regeneration_seq;

-- Last ticket written per list. No policies: only the service-role
-- regeneration path touches it.
create table public.grocery_list_generations (
  grocery_list_id uuid primary key references public.grocery_lists(id) on delete cascade,
  generation bigint not null
);
alter table public.grocery_list_generations enable row level security;
revoke all on public.grocery_list_generations from anon, authenticated;
grant all on public.grocery_list_generations to service_role;

create function public.begin_grocery_list_regeneration() returns bigint
language sql volatile set search_path = '' as $$
  select nextval('public.grocery_list_regeneration_seq');
$$;
alter function public.begin_grocery_list_regeneration() owner to postgres;
revoke all on function public.begin_grocery_list_regeneration() from public, anon, authenticated;
grant execute on function public.begin_grocery_list_regeneration() to service_role;
revoke all on sequence public.grocery_list_regeneration_seq from public, anon, authenticated;
grant usage on sequence public.grocery_list_regeneration_seq to service_role;

-- The 2-arg replace_generated_grocery_list_items(uuid, jsonb) is left as is:
-- the currently deployed app calls it with the user's client, so dropping it
-- would break add/remove between `db push` and the deploy. It skips the
-- ticket check (today's racy behavior), stays executable by authenticated
-- (no new capability: members can already write items directly under RLS),
-- and nothing in this app calls it any more. Push this migration before
-- deploying the app: the new code needs the ticket function. shortcut: legacy overload kept for the rollout, drop it in a follow-up
-- migration once this app version is deployed.

-- Returns false when skipped: the list is gone, or a later regeneration
-- already wrote.
create function public.replace_generated_grocery_list_items(
  p_list_id uuid,
  p_items jsonb,
  p_generation bigint
) returns boolean
language plpgsql security invoker set search_path = '' as $$
begin
  -- Serialize concurrent regenerations of the same list so interleaved
  -- delete/insert pairs can't produce duplicate rows
  perform pg_advisory_xact_lock(hashtextextended(p_list_id::text, 0));

  -- Key-share lock holds off a concurrent list delete; a deleted list is a
  -- no-op, not an FK error.
  perform 1 from public.grocery_lists where id = p_list_id for key share;
  if not found then
    return false;
  end if;

  insert into public.grocery_list_generations (grocery_list_id, generation)
  values (p_list_id, p_generation)
  on conflict (grocery_list_id) do update set generation = excluded.generation
    where public.grocery_list_generations.generation < excluded.generation;
  if not found then
    return false;
  end if;

  delete from public.grocery_list_items
  where grocery_list_id = p_list_id and is_manual = false;

  insert into public.grocery_list_items (
    grocery_list_id, ingredient_id, quantity, unit_id, notes, is_manual, source_recipes
  )
  select p_list_id, x.ingredient_id, x.quantity, x.unit_id, x.notes, false, x.source_recipes
  from jsonb_to_recordset(p_items) as x(
    ingredient_id bigint,
    quantity numeric,
    unit_id uuid,
    notes text,
    source_recipes uuid[]
  );

  update public.grocery_lists set updated_at = now() where id = p_list_id;
  return true;
end $$;
alter function public.replace_generated_grocery_list_items(uuid, jsonb, bigint) owner to postgres;
-- Regeneration always runs on the admin client; users never call this directly.
revoke all on function public.replace_generated_grocery_list_items(uuid, jsonb, bigint) from public, anon, authenticated;
grant execute on function public.replace_generated_grocery_list_items(uuid, jsonb, bigint) to service_role;
