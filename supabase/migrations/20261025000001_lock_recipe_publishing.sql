-- Stop signed-in users (including guests) from publishing into the public catalog.
--
-- 1. The recipes INSERT policy was `with check (true)`, so any authenticated
--    user could insert a row with any created_by. Scope it to the caller.
-- 2. Owners could set is_public on insert or flip it via UPDATE (the owner
--    UPDATE policy covers every column). RLS can't restrict columns, so use
--    column-level grants: users may only write the columns the app writes
--    (create_recipe / replace_recipe RPCs, both SECURITY INVOKER).
--    is_public, id and created_at fall back to defaults on insert and are
--    read-only afterwards. service_role / postgres (dashboard, SQL editor)
--    keep full access and are now the only way to make a recipe public.
-- SELECT and DELETE are unchanged.

drop policy if exists "Enable insert for authenticated users only" on "public"."recipes";

create policy "Enable insert for recipe owner only"
  on "public"."recipes"
  as permissive
  for insert
  to authenticated
  with check (created_by = (select auth.uid()));

revoke insert, update on table "public"."recipes" from "anon", "authenticated";

grant insert (name, steps, servings, image_url, created_by)
  on table "public"."recipes" to "authenticated";

grant update (name, steps, servings, image_url)
  on table "public"."recipes" to "authenticated";
