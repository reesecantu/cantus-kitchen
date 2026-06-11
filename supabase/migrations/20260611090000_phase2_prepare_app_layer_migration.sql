-- Phase 2 preparation for moving grocery-list business logic into the app
-- layer (React Router server on Vercel).
--
-- 1. replace_generated_grocery_list_items: a deliberately dumb, atomic write
--    primitive. The aggregation/unit-selection logic that used to live in
--    regenerate_grocery_list_items moves to TypeScript; this wrapper only
--    exists because PostgREST has no cross-statement transactions, and the
--    delete + bulk-insert must not be observable half-done.
--    SECURITY INVOKER so RLS still authorizes the caller — users can only
--    rewrite items in lists they own.
--
-- 2. Lock down delete_old_anonymous_users: it is SECURITY DEFINER and was
--    executable by anon/authenticated, meaning any visitor could purge
--    anonymous users via RPC. It will instead be invoked by a server-side
--    cron with the service-role key.

CREATE OR REPLACE FUNCTION "public"."replace_generated_grocery_list_items"(
  "p_list_id" "uuid",
  "p_items" "jsonb"
) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY INVOKER
    AS $$
BEGIN
  -- Serialize concurrent regenerations of the same list so interleaved
  -- delete/insert pairs can't produce duplicate rows
  PERFORM pg_advisory_xact_lock(hashtextextended(p_list_id::text, 0));

  DELETE FROM grocery_list_items
  WHERE grocery_list_id = p_list_id AND is_manual = false;

  INSERT INTO grocery_list_items (
    grocery_list_id, ingredient_id, quantity, unit_id, notes, is_manual, source_recipes
  )
  SELECT p_list_id, x.ingredient_id, x.quantity, x.unit_id, x.notes, false, x.source_recipes
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

ALTER FUNCTION "public"."replace_generated_grocery_list_items"("p_list_id" "uuid", "p_items" "jsonb") OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."replace_generated_grocery_list_items"("p_list_id" "uuid", "p_items" "jsonb") FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."replace_generated_grocery_list_items"("p_list_id" "uuid", "p_items" "jsonb") FROM "anon";
GRANT EXECUTE ON FUNCTION "public"."replace_generated_grocery_list_items"("p_list_id" "uuid", "p_items" "jsonb") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."replace_generated_grocery_list_items"("p_list_id" "uuid", "p_items" "jsonb") TO "service_role";

REVOKE EXECUTE ON FUNCTION "public"."delete_old_anonymous_users"() FROM "anon";
REVOKE EXECUTE ON FUNCTION "public"."delete_old_anonymous_users"() FROM "authenticated";
