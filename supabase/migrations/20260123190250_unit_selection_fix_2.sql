-- Migration: Use cooking_priority column in unit selection
-- Prerequisite: units table already has cooking_priority column

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
BEGIN
  SELECT u.id INTO best_unit_id
  FROM units u
  WHERE u.type = p_unit_type
    AND u.base_conversion_factor IS NOT NULL
    AND u.base_conversion_factor > 0
    AND u.system = p_preferred_system
    AND (p_base_quantity / u.base_conversion_factor) BETWEEN 0.125 AND 48
  ORDER BY
    -- FIRST: Prefer quantities in natural cooking ranges
    CASE
      WHEN (p_base_quantity / u.base_conversion_factor) BETWEEN 1 AND 8 THEN 0
      WHEN (p_base_quantity / u.base_conversion_factor) BETWEEN 0.5 AND 1 THEN 1
      WHEN (p_base_quantity / u.base_conversion_factor) BETWEEN 8 AND 16 THEN 1
      WHEN (p_base_quantity / u.base_conversion_factor) BETWEEN 0.25 AND 0.5 THEN 2
      WHEN (p_base_quantity / u.base_conversion_factor) BETWEEN 16 AND 32 THEN 2
      ELSE 3
    END ASC,

    -- SECOND: Use cooking_priority to prefer common units (cups over pints)
    -- Lower priority number = more preferred
    COALESCE(u.cooking_priority, 10) ASC,

    u.base_conversion_factor DESC
  LIMIT 1;

  -- Fallback 1: Any unit giving at least 0.125
  IF best_unit_id IS NULL THEN
    SELECT u.id INTO best_unit_id
    FROM units u
    WHERE u.type = p_unit_type
      AND u.base_conversion_factor IS NOT NULL
      AND u.base_conversion_factor > 0
      AND u.system = p_preferred_system
      AND (p_base_quantity / u.base_conversion_factor) >= 0.125
    ORDER BY
      COALESCE(u.cooking_priority, 10) ASC,
      u.base_conversion_factor DESC
    LIMIT 1;
  END IF;

  -- Fallback 2: Just pick any unit of the right type
  IF best_unit_id IS NULL THEN
    SELECT u.id INTO best_unit_id
    FROM units u
    WHERE u.type = p_unit_type
      AND u.system = p_preferred_system
    ORDER BY
      COALESCE(u.cooking_priority, 10) ASC
    LIMIT 1;
  END IF;

  RETURN best_unit_id;
END;
$function$;