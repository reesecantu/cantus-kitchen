-- Scope recipe_ingredients SELECT to recipes the caller can see.
-- The original "Enable read access for all users" policy used USING (true), so
-- ingredients (and notes) of private recipes were readable by anyone, including
-- the anon key. The recipes table's own SELECT RLS applies inside the subquery,
-- so ingredient visibility now matches the parent recipe exactly.
drop policy if exists "Enable read access for all users" on "public"."recipe_ingredients";

create policy "Enable read for ingredients of visible recipes"
  on "public"."recipe_ingredients"
  as permissive
  for select
  to public
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_ingredients.recipe_id
    )
  );
