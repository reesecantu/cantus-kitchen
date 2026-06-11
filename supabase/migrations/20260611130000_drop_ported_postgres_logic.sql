-- Migration B: remove the Postgres business logic that has been ported to
-- TypeScript (src/server/) and is no longer called by the deployed app.
--
-- !! Apply only AFTER the React Router app is live on Vercel and verified —
-- !! clients running pre-migration bundles call these RPCs and will break.
--
-- Kept intentionally:
--   - handle_new_anonymous_user + its auth.users trigger (tiny, auth-bound)
--   - delete_old_anonymous_users (invoked by the Vercel cron via service role)
--   - replace_generated_grocery_list_items (atomic write primitive for the
--     TypeScript regeneration path)

-- Triggers first (their functions can't be dropped while referenced)
DROP TRIGGER IF EXISTS "grocery_list_recipes_change_trigger" ON "public"."grocery_list_recipes";
DROP TRIGGER IF EXISTS "trg_enqueue_recipe_photo_delete" ON "public"."recipes";

-- Grocery-list aggregation engine → src/server/grocery-aggregation.ts
DROP FUNCTION IF EXISTS "public"."trigger_regenerate_grocery_list"();
DROP FUNCTION IF EXISTS "public"."regenerate_grocery_list_items"("uuid");
DROP FUNCTION IF EXISTS "public"."find_best_unit_for_quantity"(numeric, "text", "text");

-- Mutation RPCs → resource routes + src/server/grocery-lists.server.ts
DROP FUNCTION IF EXISTS "public"."add_recipe_to_grocery_list"("uuid", "uuid", numeric);
DROP FUNCTION IF EXISTS "public"."add_manual_item_to_grocery_list"("uuid", "text", numeric, "text", "text");
-- Dead code: referenced a nonexistent table, never callable successfully
DROP FUNCTION IF EXISTS "public"."remove_recipe_from_grocery_list"("uuid", bigint);

-- Visibility RPCs → plain selects in src/features/recipes/api.ts
DROP FUNCTION IF EXISTS "public"."get_public_recipes"();
DROP FUNCTION IF EXISTS "public"."get_public_and_user_recipes"();

-- Photo cleanup queue → direct Storage delete in src/server/recipes.server.ts
-- (nothing ever drained this queue)
DROP FUNCTION IF EXISTS "public"."enqueue_recipe_photo_delete"();
DROP TABLE IF EXISTS "public"."storage_delete_jobs";

-- Unused helpers (the anon-user trigger inlines its own name generation;
-- the SECURITY DEFINER cron wrapper is replaced by the Vercel cron route)
DROP FUNCTION IF EXISTS "public"."generate_simple_anonymous_username"();
DROP FUNCTION IF EXISTS "public"."trigger_delete_old_anonymous_users"();

-- Leftover backup table from the January unit-conversion fix
DROP TABLE IF EXISTS "public"."units_backup_before_fix";
