-- Shareable grocery lists (schema + RLS).
--
-- A list owner can set share_token; anyone holding the token joins via
-- join_grocery_list() and becomes a row in grocery_list_members. Members get
-- full edit on a list's recipes and items and may toggle is_completed, but
-- only the owner can rename, edit the description, manage the token, or
-- delete the list. Leaving = deleting your own membership row.

alter table public.grocery_lists
  add column share_token text unique
  constraint grocery_lists_share_token_length check (share_token is null or length(share_token) >= 32);

create table public.grocery_list_members (
  grocery_list_id uuid not null references public.grocery_lists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (grocery_list_id, user_id)
);
create index grocery_list_members_user_id_idx on public.grocery_list_members (user_id);
alter table public.grocery_list_members enable row level security;

-- Remote may carry legacy default privileges; joins go only through the RPC.
revoke all on public.grocery_list_members from anon, authenticated;
grant select, delete on public.grocery_list_members to authenticated;
grant all on public.grocery_list_members to service_role;

-- Ids of lists the caller owns or has joined. SECURITY DEFINER so policies on
-- grocery_lists can use it without recursing into their own RLS. Policies call
-- it as `id in (select ...)` so it runs once per statement, not once per row.
create function public.accessible_grocery_list_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select id from public.grocery_lists where user_id = (select auth.uid())
  union all
  select grocery_list_id from public.grocery_list_members where user_id = (select auth.uid());
$$;
alter function public.accessible_grocery_list_ids() owner to postgres;
revoke all on function public.accessible_grocery_list_ids() from public, anon;
grant execute on function public.accessible_grocery_list_ids() to authenticated, service_role;

-- grocery_lists: the owner FOR ALL policy stays. Members may select and
-- update; there is deliberately no member DELETE policy.
create policy "Members can view grocery lists" on public.grocery_lists
  for select to authenticated using (id in (select public.accessible_grocery_list_ids()));
create policy "Members can update grocery lists" on public.grocery_lists
  for update to authenticated
  using (id in (select public.accessible_grocery_list_ids()))
  with check (id in (select public.accessible_grocery_list_ids()));

-- Column-level rules RLS can't express. auth.uid() is null for service_role
-- and internal callers, which skip both checks.
create function public.guard_grocery_list_owner_columns() returns trigger
language plpgsql set search_path = '' as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  -- Nobody (owner included) may hand a list to another user.
  if new.user_id is distinct from old.user_id then
    raise exception 'Grocery list owner cannot be changed' using errcode = '42501';
  end if;
  if auth.uid() <> old.user_id then
    -- Members may only touch is_completed and bump updated_at (regen does).
    if (to_jsonb(new) - 'is_completed' - 'updated_at')
       is distinct from (to_jsonb(old) - 'is_completed' - 'updated_at') then
      raise exception 'Only the list owner can change this' using errcode = '42501';
    end if;
    if new.updated_at is distinct from old.updated_at then
      new.updated_at := now();
    end if;
  end if;
  return new;
end $$;
create trigger guard_grocery_list_owner_columns before update on public.grocery_lists
  for each row execute function public.guard_grocery_list_owner_columns();

-- grocery_list_recipes / grocery_list_items: owner or member, full edit.
drop policy "Users can manage own grocery list recipes" on public.grocery_list_recipes;
create policy "Owners and members can manage grocery list recipes" on public.grocery_list_recipes
  for all to authenticated
  using (grocery_list_id in (select public.accessible_grocery_list_ids()))
  with check (grocery_list_id in (select public.accessible_grocery_list_ids()));
-- New links must point at a recipe the caller can see (recipes RLS). Insert
-- only, so plain UPDATE/DELETE still work on rows for a member's private
-- recipe; an upsert re-checks this, which is fine since its caller names the recipe.
create policy "Only visible recipes can be added to grocery lists" on public.grocery_list_recipes
  as restrictive for insert to authenticated
  with check (exists (select 1 from public.recipes r where r.id = grocery_list_recipes.recipe_id));
-- ...and an update can't repoint a link at another recipe or list, which
-- would bypass that insert check.
create function public.guard_grocery_list_recipe_link() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (new.grocery_list_id, new.recipe_id) is distinct from (old.grocery_list_id, old.recipe_id) then
    raise exception 'A grocery list recipe link cannot be repointed' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger guard_grocery_list_recipe_link before update on public.grocery_list_recipes
  for each row execute function public.guard_grocery_list_recipe_link();

drop policy "Users can manage own grocery list items" on public.grocery_list_items;
create policy "Owners and members can manage grocery list items" on public.grocery_list_items
  for all to authenticated
  using (grocery_list_id in (select public.accessible_grocery_list_ids()))
  with check (grocery_list_id in (select public.accessible_grocery_list_ids()));

-- grocery_list_members: no INSERT policy (join only via join_grocery_list).
create policy "Users can view own memberships" on public.grocery_list_members
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Owners can view list members" on public.grocery_list_members
  for select to authenticated using (
    exists (select 1 from public.grocery_lists gl
            where gl.id = grocery_list_id and gl.user_id = (select auth.uid()))
  );
create policy "Users can leave lists" on public.grocery_list_members
  for delete to authenticated using (user_id = (select auth.uid()));

-- Returns the list id, or null for an unknown/revoked token. Idempotent; the
-- owner opening their own link gets the id without a membership row.
create function public.join_grocery_list(p_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_list_id uuid;
  v_owner uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  select id, user_id into v_list_id, v_owner from public.grocery_lists where share_token = p_token;
  if v_list_id is null then
    return null;
  end if;
  if v_owner <> auth.uid() then
    insert into public.grocery_list_members (grocery_list_id, user_id)
    values (v_list_id, auth.uid())
    on conflict do nothing;
  end if;
  return v_list_id;
end $$;
alter function public.join_grocery_list(text) owner to postgres;
revoke all on function public.join_grocery_list(text) from public, anon;
grant execute on function public.join_grocery_list(text) to authenticated, service_role;

-- Recipe names for a list the caller can access, including recipes recipes
-- RLS hides from them (e.g. another member's private recipe). recipe_visible
-- tells the UI whether the full recipe page will open for this caller; keep it
-- in sync with the recipes SELECT policy (20260622000000_add_is_public_to_recipes.sql).
create function public.get_grocery_list_recipe_names(p_list_id uuid)
returns table (recipe_id uuid, name text, recipe_visible boolean)
language sql stable security definer set search_path = '' as $$
  select r.id, r.name, r.is_public or coalesce(r.created_by = (select auth.uid()), false)
  from public.grocery_list_recipes glr
  join public.recipes r on r.id = glr.recipe_id
  where glr.grocery_list_id = p_list_id and p_list_id in (select public.accessible_grocery_list_ids());
$$;
alter function public.get_grocery_list_recipe_names(uuid) owner to postgres;
revoke all on function public.get_grocery_list_recipe_names(uuid) from public, anon;
grant execute on function public.get_grocery_list_recipe_names(uuid) to authenticated, service_role;
