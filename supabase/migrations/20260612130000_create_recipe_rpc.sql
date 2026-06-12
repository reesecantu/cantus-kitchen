-- Atomic recipe creation: insert the recipe row and its ingredients in a
-- single transaction so a failed ingredient insert cannot leave an orphaned
-- recipe row (mirrors replace_recipe for the edit path).
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
    recipe_id, ingredient_id, unit_id, unit_amount, note
  )
  SELECT v_recipe_id, x.ingredient_id, x.unit_id, x.unit_amount, x.note
  FROM jsonb_to_recordset(p_ingredients) AS x(
    ingredient_id bigint,
    unit_id uuid,
    unit_amount numeric,
    note text
  );

  RETURN v_recipe_id;
END;
$$;

ALTER FUNCTION "public"."create_recipe"("p_name" "text", "p_steps" "text"[], "p_servings" bigint, "p_image_url" "text", "p_created_by" "uuid", "p_ingredients" "jsonb") OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."create_recipe"("p_name" "text", "p_steps" "text"[], "p_servings" bigint, "p_image_url" "text", "p_created_by" "uuid", "p_ingredients" "jsonb") FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."create_recipe"("p_name" "text", "p_steps" "text"[], "p_servings" bigint, "p_image_url" "text", "p_created_by" "uuid", "p_ingredients" "jsonb") FROM "anon";
GRANT EXECUTE ON FUNCTION "public"."create_recipe"("p_name" "text", "p_steps" "text"[], "p_servings" bigint, "p_image_url" "text", "p_created_by" "uuid", "p_ingredients" "jsonb") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."create_recipe"("p_name" "text", "p_steps" "text"[], "p_servings" bigint, "p_image_url" "text", "p_created_by" "uuid", "p_ingredients" "jsonb") TO "service_role";
