-- Ingredient groups + explicit ordering.
--
-- Recipes can now organize ingredients into labeled sections (e.g. "Cane's
-- Sauce", "Slaw") and list the same ingredient more than once across different
-- sections. To support that — plus user-controlled reordering and moving — each
-- recipe_ingredients row gains:
--   * group_label: the section it belongs to (NULL/'' = ungrouped). Sections are
--     reconstructed on read from contiguous runs of equal label, ordered by
--     position. No new table; this mirrors the atomic replace-everything RPCs.
--   * position: explicit display order within the recipe (0-based). Existing
--     rows default to 0; they render as a flat, ungrouped list as before.
--
-- No unique constraint on (recipe_id, ingredient_id): duplicates are intentional.
-- Grocery aggregation is unaffected — it keys by ingredient_id and already sums
-- duplicate rows, and does not select these columns.

ALTER TABLE "public"."recipe_ingredients"
  ADD COLUMN IF NOT EXISTS "group_label" "text",
  ADD COLUMN IF NOT EXISTS "position" integer NOT NULL DEFAULT 0;

-- Thread group_label + position through both ingredient-writing RPCs. The rest
-- of each function is unchanged.

CREATE OR REPLACE FUNCTION "public"."create_recipe"(
  "p_name" "text",
  "p_steps" "text"[],
  "p_servings" bigint,
  "p_image_url" "text",
  "p_created_by" "uuid",
  "p_ingredients" "jsonb"
) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY INVOKER
    AS $$
DECLARE
  v_recipe_id uuid;
BEGIN
  INSERT INTO recipes (name, steps, servings, image_url, created_by)
  VALUES (p_name, p_steps, p_servings, p_image_url, p_created_by)
  RETURNING id INTO v_recipe_id;

  INSERT INTO recipe_ingredients (
    recipe_id, ingredient_id, unit_id, unit_amount, note, group_label, position
  )
  SELECT v_recipe_id, x.ingredient_id, x.unit_id, x.unit_amount, x.note,
         x.group_label, x.position
  FROM jsonb_to_recordset(p_ingredients) AS x(
    ingredient_id bigint,
    unit_id uuid,
    unit_amount numeric,
    note text,
    group_label text,
    position int
  );

  RETURN v_recipe_id;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."replace_recipe"(
  "p_recipe_id" "uuid",
  "p_name" "text",
  "p_steps" "text"[],
  "p_servings" bigint,
  "p_image_url" "text",
  "p_ingredients" "jsonb"
) RETURNS "void"
    LANGUAGE "plpgsql"
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
    recipe_id, ingredient_id, unit_id, unit_amount, note, group_label, position
  )
  SELECT p_recipe_id, x.ingredient_id, x.unit_id, x.unit_amount, x.note,
         x.group_label, x.position
  FROM jsonb_to_recordset(p_ingredients) AS x(
    ingredient_id bigint,
    unit_id uuid,
    unit_amount numeric,
    note text,
    group_label text,
    position int
  );
END;
$$;
