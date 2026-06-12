-- Fix 1: Scope recipe_ingredients INSERT to the recipe owner only (IDOR fix).
-- The previous policy was with check (true), letting any authenticated user insert
-- ingredient rows into any recipe. This replaces it with an ownership check so only
-- the recipe's creator can add ingredients to it.
drop policy if exists "Enable insert for authenticated users only" on "public"."recipe_ingredients";

create policy "Enable insert for recipe owner only"
  on "public"."recipe_ingredients"
  as permissive
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_ingredients.recipe_id
        and r.created_by = (select auth.uid())
    )
  );


-- Fix 2: Scope recipes SELECT to the public catalog account + the signed-in user's own recipes.
-- The previous "Enable read access for all users" policy used USING(true), making every
-- recipe from every user world-readable. The redundant per-owner policy is also dropped
-- since the new policy covers both cases.
drop policy if exists "Enable read access for all users" on "public"."recipes";
drop policy if exists "Enable users to view their own data only" on "public"."recipes";

create policy "Enable read for public catalog and own recipes"
  on "public"."recipes"
  as permissive
  for select
  to public
  using (
    created_by = '6e0258f5-c980-47d2-a7ee-981e76e56333'
    or created_by = (select auth.uid())
  );
