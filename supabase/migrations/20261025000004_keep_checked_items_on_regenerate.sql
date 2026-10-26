-- Keep checkmarks when a grocery list is regenerated.
--
-- replace_generated_grocery_list_items deletes and reinserts every generated
-- item, so is_checked reset to false on every add/remove/edit of a recipe.
-- Remember which ingredients were checked before the delete and carry the
-- check over to the reinserted row for the same ingredient. Manual items are
-- not touched by this function. CREATE OR REPLACE keeps the existing grants.

CREATE OR REPLACE FUNCTION "public"."replace_generated_grocery_list_items"(
  "p_list_id" "uuid",
  "p_items" "jsonb"
) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY INVOKER
    AS $$
DECLARE
  v_checked bigint[];
BEGIN
  -- Serialize concurrent regenerations of the same list so interleaved
  -- delete/insert pairs can't produce duplicate rows
  PERFORM pg_advisory_xact_lock(hashtextextended(p_list_id::text, 0));

  -- ARRAY(...) yields '{}' rather than NULL when nothing is checked
  v_checked := ARRAY(
    SELECT ingredient_id FROM grocery_list_items
    WHERE grocery_list_id = p_list_id AND is_manual = false AND is_checked
  );

  DELETE FROM grocery_list_items
  WHERE grocery_list_id = p_list_id AND is_manual = false;

  INSERT INTO grocery_list_items (
    grocery_list_id, ingredient_id, quantity, unit_id, notes, is_manual, source_recipes, is_checked
  )
  SELECT p_list_id, x.ingredient_id, x.quantity, x.unit_id, x.notes, false, x.source_recipes,
         x.ingredient_id = ANY(v_checked)
  FROM jsonb_to_recordset(p_items) AS x(
    ingredient_id bigint,
    quantity numeric,
    unit_id uuid,
    notes text,
    source_recipes uuid[]
  );

  UPDATE grocery_lists SET updated_at = now() WHERE id = p_list_id;
END;
$$;
