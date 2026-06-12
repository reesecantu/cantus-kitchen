-- 1. Actually lock down anonymous-user deletion. The previous revoke of
--    anon/authenticated on delete_old_anonymous_users() was ineffective:
--    the function's default EXECUTE grant to PUBLIC was never revoked, and
--    the SECURITY DEFINER wrapper trigger_delete_old_anonymous_users()
--    remained granted to anon/authenticated — either path let any visitor
--    purge all anonymous users via PostgREST RPC. Close both.
REVOKE ALL ON FUNCTION "public"."delete_old_anonymous_users"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."trigger_delete_old_anonymous_users"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."trigger_delete_old_anonymous_users"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."trigger_delete_old_anonymous_users"() FROM "authenticated";

-- 2. Make the legacy trigger regeneration take the same per-list advisory
--    lock as replace_generated_grocery_list_items. Without it, the trigger's
--    unlocked delete+insert can interleave with the locked app-layer replace
--    under concurrency, committing duplicate generated items. Both writers
--    now serialize on the same lock key. (Function is otherwise identical to
--    the 20260611110000 version and is still slated for removal after the
--    soak period.)

CREATE OR REPLACE FUNCTION "public"."regenerate_grocery_list_items"("list_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  recipe_record RECORD;
  ingredient_record RECORD;
  existing_item RECORD;
  total_base_quantity decimal;
  preferred_unit_id uuid;
  converted_quantity decimal;
BEGIN
  -- Serialize against replace_generated_grocery_list_items (same lock key)
  PERFORM pg_advisory_xact_lock(hashtextextended(list_id::text, 0));
  -- Re-runnable within one transaction (e.g. per-row trigger on cascade delete)
  DROP TABLE IF EXISTS temp_ingredient_aggregation;
  DROP TABLE IF EXISTS temp_ingredient_no_conversion;
  DROP TABLE IF EXISTS temp_null_quantity_ingredients;
  -- Delete all non-manual items first (manual items are user-added, keep those)
  DELETE FROM grocery_list_items 
  WHERE grocery_list_id = list_id AND is_manual = false;
  
  -- For ingredients where units HAVE base conversion factors (can be aggregated)
  CREATE TEMP TABLE temp_ingredient_aggregation (
    ingredient_id bigint,
    total_base_quantity decimal,
    unit_type text,
    source_recipes uuid[],
    notes text,
    PRIMARY KEY (ingredient_id, unit_type)
  ) ON COMMIT DROP;
  
  -- For ingredients where units DON'T have conversion factors (can't convert)
  -- These get grouped by exact unit instead
  CREATE TEMP TABLE temp_ingredient_no_conversion (
    ingredient_id bigint,
    unit_id uuid,
    total_quantity decimal,
    unit_type text,
    source_recipes uuid[],
    notes text,
    PRIMARY KEY (ingredient_id, unit_id)
  ) ON COMMIT DROP;
  
  -- For ingredients with NULL quantities (like "salt to taste")
  CREATE TEMP TABLE temp_null_quantity_ingredients (
    ingredient_id bigint,
    unit_id uuid,
    source_recipes uuid[],
    notes text,
    PRIMARY KEY (ingredient_id)
  ) ON COMMIT DROP;
  
  -- ============================================================================
  -- PHASE 1: Loop through all recipes and aggregate ingredients
  -- ============================================================================
  FOR recipe_record IN 
    SELECT glr.recipe_id, glr.servings_multiplier, r.servings as original_servings
    FROM grocery_list_recipes glr
    JOIN recipes r ON glr.recipe_id = r.id
    WHERE glr.grocery_list_id = list_id
  LOOP
    DECLARE
      -- Calculate scaling factor: if recipe serves 4 but user wants 8, scale = 2
      scale_factor decimal := recipe_record.servings_multiplier / recipe_record.original_servings;
    BEGIN
      -- Loop through each ingredient in this recipe
      FOR ingredient_record IN
        SELECT 
          ri.ingredient_id,
          CASE 
            WHEN ri.unit_amount IS NOT NULL THEN ri.unit_amount * scale_factor 
            ELSE NULL 
          END as scaled_quantity,
          ri.unit_id,
          ri.note as notes,
          u.base_conversion_factor,
          u.type as unit_type,
          ri.unit_amount IS NULL as is_null_quantity
        FROM recipe_ingredients ri
        LEFT JOIN units u ON ri.unit_id = u.id
        WHERE ri.recipe_id = recipe_record.recipe_id
      LOOP
        
        -- CASE A: Ingredient has no quantity (like "salt to taste")
        IF ingredient_record.is_null_quantity THEN
          INSERT INTO temp_null_quantity_ingredients (
            ingredient_id, unit_id, source_recipes, notes
          )
          VALUES (
            ingredient_record.ingredient_id,
            ingredient_record.unit_id,
            ARRAY[recipe_record.recipe_id],
            ingredient_record.notes
          )
          ON CONFLICT (ingredient_id) DO UPDATE
          SET 
            source_recipes = array_cat(
              temp_null_quantity_ingredients.source_recipes, 
              EXCLUDED.source_recipes
            ),
            notes = CASE 
              WHEN temp_null_quantity_ingredients.notes IS NULL THEN EXCLUDED.notes
              WHEN EXCLUDED.notes IS NULL THEN temp_null_quantity_ingredients.notes
              WHEN temp_null_quantity_ingredients.notes = EXCLUDED.notes 
                THEN temp_null_quantity_ingredients.notes
              ELSE temp_null_quantity_ingredients.notes || '; ' || EXCLUDED.notes
            END;
            
        -- CASE B: Unit has no conversion factor (can't aggregate across units)
        ELSIF ingredient_record.base_conversion_factor IS NULL THEN
          INSERT INTO temp_ingredient_no_conversion (
            ingredient_id, unit_id, total_quantity, unit_type, source_recipes, notes
          )
          VALUES (
            ingredient_record.ingredient_id,
            ingredient_record.unit_id,
            ingredient_record.scaled_quantity,
            ingredient_record.unit_type,
            ARRAY[recipe_record.recipe_id],
            ingredient_record.notes
          )
          ON CONFLICT (ingredient_id, unit_id) DO UPDATE
          SET 
            total_quantity = temp_ingredient_no_conversion.total_quantity + EXCLUDED.total_quantity,
            source_recipes = array_cat(
              temp_ingredient_no_conversion.source_recipes, 
              EXCLUDED.source_recipes
            ),
            notes = CASE 
              WHEN temp_ingredient_no_conversion.notes IS NULL THEN EXCLUDED.notes
              WHEN EXCLUDED.notes IS NULL THEN temp_ingredient_no_conversion.notes
              WHEN temp_ingredient_no_conversion.notes = EXCLUDED.notes 
                THEN temp_ingredient_no_conversion.notes
              ELSE temp_ingredient_no_conversion.notes || '; ' || EXCLUDED.notes
            END;
            
        -- CASE C: Normal ingredient with convertible unit
        ELSE
          DECLARE
            -- Convert to base units for aggregation
            -- Example: 2 cups * 236.6 ml/cup = 473.2 ml
            base_quantity decimal := ingredient_record.scaled_quantity * ingredient_record.base_conversion_factor;
          BEGIN
            INSERT INTO temp_ingredient_aggregation (
              ingredient_id, total_base_quantity, unit_type, source_recipes, notes
            )
            VALUES (
              ingredient_record.ingredient_id,
              base_quantity,
              ingredient_record.unit_type,
              ARRAY[recipe_record.recipe_id],
              ingredient_record.notes
            )
            ON CONFLICT (ingredient_id, unit_type) DO UPDATE
            SET 
              total_base_quantity = temp_ingredient_aggregation.total_base_quantity + EXCLUDED.total_base_quantity,
              source_recipes = array_cat(
                temp_ingredient_aggregation.source_recipes, 
                EXCLUDED.source_recipes
              ),
              notes = CASE 
                WHEN temp_ingredient_aggregation.notes IS NULL THEN EXCLUDED.notes
                WHEN EXCLUDED.notes IS NULL THEN temp_ingredient_aggregation.notes
                WHEN temp_ingredient_aggregation.notes = EXCLUDED.notes 
                  THEN temp_ingredient_aggregation.notes
                ELSE temp_ingredient_aggregation.notes || '; ' || EXCLUDED.notes
              END;
          END;
        END IF;
      END LOOP;
    END;
  END LOOP;
  
  -- ============================================================================
  -- PHASE 2: Convert aggregated base quantities back to display units
  -- ============================================================================
  FOR ingredient_record IN
    SELECT * FROM temp_ingredient_aggregation
  LOOP
    -- *** THE KEY CHANGE: Use our helper function instead of frequency-based selection ***
    preferred_unit_id := find_best_unit_for_quantity(
      ingredient_record.total_base_quantity,
      ingredient_record.unit_type,
      'imperial'  -- TODO: Could make this a user preference
    );
    
    -- Convert from base units back to the chosen display unit
    SELECT 
      CASE 
        WHEN u.base_conversion_factor IS NOT NULL AND u.base_conversion_factor > 0 THEN
          ingredient_record.total_base_quantity / u.base_conversion_factor
        ELSE
          ingredient_record.total_base_quantity
      END INTO converted_quantity
    FROM units u
    WHERE u.id = preferred_unit_id;
    
    -- Insert the final grocery list item
    INSERT INTO grocery_list_items (
      grocery_list_id,
      ingredient_id,
      quantity,
      unit_id,
      notes,
      is_manual,
      source_recipes
    ) VALUES (
      list_id,
      ingredient_record.ingredient_id,
      ROUND(converted_quantity, 2),  -- Round for cleaner display
      preferred_unit_id,
      ingredient_record.notes,
      false,
      ingredient_record.source_recipes
    );
  END LOOP;
  
  -- ============================================================================
  -- PHASE 3: Handle ingredients that couldn't be converted (no conversion factor)
  -- ============================================================================
  FOR ingredient_record IN
    SELECT * FROM temp_ingredient_no_conversion
  LOOP
    INSERT INTO grocery_list_items (
      grocery_list_id, ingredient_id, quantity, unit_id, notes, is_manual, source_recipes
    ) VALUES (
      list_id,
      ingredient_record.ingredient_id,
      ROUND(ingredient_record.total_quantity, 2),
      ingredient_record.unit_id,
      ingredient_record.notes,
      false,
      ingredient_record.source_recipes
    );
  END LOOP;
  
  -- ============================================================================
  -- PHASE 4: Handle "to taste" ingredients (null quantities)
  -- ============================================================================
  FOR ingredient_record IN
    SELECT * FROM temp_null_quantity_ingredients
  LOOP
    INSERT INTO grocery_list_items (
      grocery_list_id, ingredient_id, quantity, unit_id, notes, is_manual, source_recipes
    ) VALUES (
      list_id,
      ingredient_record.ingredient_id,
      NULL,  -- Keep as NULL
      ingredient_record.unit_id,
      ingredient_record.notes,
      false,
      ingredient_record.source_recipes
    );
  END LOOP;

  -- Temp tables are automatically dropped due to ON COMMIT DROP
  
  -- Update the grocery list's timestamp
  UPDATE grocery_lists SET updated_at = now() WHERE id = list_id;
END;
$$;
