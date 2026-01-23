-- Migration: Fix unit selection to prefer human-readable quantities
-- Problem: Current logic picks units based on frequency of use, not readability
-- Example: "56 tablespoons" should become "3.5 cups"

-- ============================================================================
-- STEP 1: Update the helper function that finds the best unit for a quantity
-- ============================================================================

CREATE OR REPLACE FUNCTION public.find_best_unit_for_quantity(
  p_base_quantity numeric,
  p_unit_type text,
  p_preferred_system text DEFAULT 'imperial'::text
)
RETURNS uuid
LANGUAGE plpgsql
AS $function$
DECLARE
  best_unit_id uuid;
  converted_qty numeric;
BEGIN
  -- ==========================================================================
  -- STRATEGY: Find a unit that produces a "nice" quantity for cooking
  --
  -- What makes a quantity "nice"?
  --   - Between 0.25 and 12 is ideal (you'd never say "0.1 cups" or "50 cups")
  --   - Quantities like 1, 2, 3, 4 are better than 17 or 0.3
  --   - When multiple units work, prefer larger units (cups over tablespoons)
  --
  -- HOW IT WORKS:
  --   1. Convert base quantity to each possible unit
  --   2. Score each unit based on how "readable" the result is
  --   3. Pick the best scoring unit
  -- ==========================================================================

  SELECT u.id INTO best_unit_id
  FROM units u
  WHERE u.type = p_unit_type
    AND u.base_conversion_factor IS NOT NULL
    AND u.base_conversion_factor > 0
    AND u.system = p_preferred_system
    -- Only consider units that produce quantities in a reasonable range
    -- This filters out results like "0.01 gallons" or "500 teaspoons"
    AND (p_base_quantity / u.base_conversion_factor) BETWEEN 0.125 AND 48
  ORDER BY
    -- PRIMARY SORT: Prefer quantities in the most natural cooking ranges
    -- We use CASE to create "tiers" of preference
    CASE
      -- Tier 0 (best): Quantities between 0.5 and 8
      -- Examples: "2 cups", "1.5 tsp", "4 oz"
      WHEN (p_base_quantity / u.base_conversion_factor) BETWEEN 0.5 AND 8 THEN 0

      -- Tier 1: Quantities between 0.25-0.5 or 8-16
      -- Examples: "0.25 cups" (1/4 cup), "12 oz"
      WHEN (p_base_quantity / u.base_conversion_factor) BETWEEN 0.25 AND 0.5 THEN 1
      WHEN (p_base_quantity / u.base_conversion_factor) BETWEEN 8 AND 16 THEN 1

      -- Tier 2: Acceptable but not ideal (16-48 or 0.125-0.25)
      -- Examples: "24 oz", "0.125 cups" (1/8 cup)
      ELSE 2
    END ASC,

    -- SECONDARY SORT: Among units in the same tier, prefer larger units
    -- This is done by sorting by base_conversion_factor in DESCENDING order
    -- Larger units have larger conversion factors (1 cup = 236ml vs 1 tsp = 5ml)
    -- So "cups" sorts before "tablespoons" which sorts before "teaspoons"
    u.base_conversion_factor DESC
  LIMIT 1;

  -- ==========================================================================
  -- FALLBACK 1: If no unit produced a quantity in our ideal range,
  -- find any unit that gives us at least 0.125 (1/8)
  -- ==========================================================================
  IF best_unit_id IS NULL THEN
    SELECT u.id INTO best_unit_id
    FROM units u
    WHERE u.type = p_unit_type
      AND u.base_conversion_factor IS NOT NULL
      AND u.base_conversion_factor > 0
      AND u.system = p_preferred_system
      AND (p_base_quantity / u.base_conversion_factor) >= 0.125
    ORDER BY
      -- Pick the largest unit that doesn't give us a tiny decimal
      u.base_conversion_factor DESC
    LIMIT 1;
  END IF;

  -- ==========================================================================
  -- FALLBACK 2: If we still have nothing (very small quantity?),
  -- just pick the smallest unit of the right type
  -- ==========================================================================
  IF best_unit_id IS NULL THEN
    SELECT u.id INTO best_unit_id
    FROM units u
    WHERE u.type = p_unit_type
      AND u.system = p_preferred_system
    ORDER BY
      u.base_conversion_factor ASC NULLS LAST
    LIMIT 1;
  END IF;

  RETURN best_unit_id;
END;
$function$;

-- Add a comment explaining what this function does
COMMENT ON FUNCTION public.find_best_unit_for_quantity IS 
'Finds the most human-readable unit for displaying a quantity. 
Takes a quantity in base units (ml for volume, g for weight) and returns 
the unit ID that produces the most readable converted quantity.
Example: 828ml -> returns cup ID (gives 3.5 cups instead of 56 tbsp)';


-- ============================================================================
-- STEP 2: Update the grocery list regeneration function to USE our helper
-- ============================================================================

CREATE OR REPLACE FUNCTION public.regenerate_grocery_list_items(list_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  recipe_record RECORD;
  ingredient_record RECORD;
  existing_item RECORD;
  total_base_quantity decimal;
  preferred_unit_id uuid;
  converted_quantity decimal;
BEGIN
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
$function$;

-- Add a comment for documentation
COMMENT ON FUNCTION public.regenerate_grocery_list_items IS 
'Regenerates all non-manual items in a grocery list by aggregating ingredients 
from all linked recipes. Handles unit conversion to display human-readable quantities.';