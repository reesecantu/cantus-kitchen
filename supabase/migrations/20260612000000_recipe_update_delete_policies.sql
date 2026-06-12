-- Enable full CRUD on recipes by their owners.
--
-- The original schema only ever granted INSERT + SELECT on `recipes` and
-- `recipe_ingredients`, so with RLS enabled an UPDATE or DELETE from the
-- user-scoped client silently affects zero rows. That left the delete endpoint
-- (deleteRecipe) quietly broken and made editing impossible. These policies add
-- the missing authorization, scoped to the recipe owner.
--
-- `replace_recipe` is the edit write primitive: PostgREST has no cross-statement
-- transactions, but a recipe edit is update-row + delete-ingredients +
-- reinsert-ingredients, which must not be observable half-done. Like
-- `replace_generated_grocery_list_items`, it is SECURITY INVOKER so RLS still
-- authorizes the caller — the function adds only atomicity and an advisory lock,
-- not a second auth path. Grocery-list regeneration and Storage photo cleanup
-- are not SQL / are cross-user, so they stay in the app layer after this commits.

-- recipes: owners can UPDATE their own rows
create policy "Enable update for recipe owners"
  on "public"."recipes"
  as permissive
  for update
  to authenticated
  using (( SELECT auth.uid() ) = created_by)
  with check (( SELECT auth.uid() ) = created_by);

-- recipes: owners can DELETE their own rows (also repairs the latent delete bug)
create policy "Enable delete for recipe owners"
  on "public"."recipes"
  as permissive
  for delete
  to authenticated
  using (( SELECT auth.uid() ) = created_by);

-- recipe_ingredients: owners can DELETE rows of a recipe they own (for replace).
-- INSERT is already permitted by the existing authenticated insert policy.
create policy "Enable delete for parent recipe owners"
  on "public"."recipe_ingredients"
  as permissive
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_ingredients.recipe_id
        and r.created_by = ( SELECT auth.uid() )
    )
  );

CREATE OR REPLACE FUNCTION "public"."replace_recipe"(
  "p_recipe_id" "uuid",
  "p_name" "text",
  "p_steps" "text"[],
  "p_servings" bigint,
  "p_image_url" "text",
  "p_ingredients" "jsonb"
) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY INVOKER
    AS $$
BEGIN
  -- Serialize concurrent edits of the same recipe so interleaved
  -- delete/insert pairs on recipe_ingredients can't produce duplicate rows
  PERFORM pg_advisory_xact_lock(hashtextextended(p_recipe_id::text, 0));

  UPDATE recipes
  SET name = p_name,
      steps = p_steps,
      servings = p_servings,
      image_url = p_image_url
  WHERE id = p_recipe_id;

  -- RLS hides the UPDATE from non-owners (zero rows). Treat that as not-found
  -- so the whole transaction rolls back instead of wiping ingredients.
  IF NOT FOUND THEN
    RAISE EXCEPTION 'recipe not found or not owned'
      USING ERRCODE = 'no_data_found';
  END IF;

  DELETE FROM recipe_ingredients WHERE recipe_id = p_recipe_id;

  INSERT INTO recipe_ingredients (
    recipe_id, ingredient_id, unit_id, unit_amount, note
  )
  SELECT p_recipe_id, x.ingredient_id, x.unit_id, x.unit_amount, x.note
  FROM jsonb_to_recordset(p_ingredients) AS x(
    ingredient_id bigint,
    unit_id uuid,
    unit_amount numeric,
    note text
  );
END;
$$;

ALTER FUNCTION "public"."replace_recipe"("p_recipe_id" "uuid", "p_name" "text", "p_steps" "text"[], "p_servings" bigint, "p_image_url" "text", "p_ingredients" "jsonb") OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."replace_recipe"("p_recipe_id" "uuid", "p_name" "text", "p_steps" "text"[], "p_servings" bigint, "p_image_url" "text", "p_ingredients" "jsonb") FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."replace_recipe"("p_recipe_id" "uuid", "p_name" "text", "p_steps" "text"[], "p_servings" bigint, "p_image_url" "text", "p_ingredients" "jsonb") FROM "anon";
GRANT EXECUTE ON FUNCTION "public"."replace_recipe"("p_recipe_id" "uuid", "p_name" "text", "p_steps" "text"[], "p_servings" bigint, "p_image_url" "text", "p_ingredients" "jsonb") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."replace_recipe"("p_recipe_id" "uuid", "p_name" "text", "p_steps" "text"[], "p_servings" bigint, "p_image_url" "text", "p_ingredients" "jsonb") TO "service_role";
