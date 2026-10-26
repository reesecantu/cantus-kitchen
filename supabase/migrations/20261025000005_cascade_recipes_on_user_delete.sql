-- Guest (anonymous) users are purged daily by delete_old_anonymous_users(),
-- but recipes.created_by had no foreign key to auth.users, so their recipes
-- were left behind forever: private, ownerless, and invisible to everyone.
--
-- 1. Remove the private recipes whose owner no longer exists. Public catalog
--    recipes are never deleted here: if one is orphaned, step 2 fails and the
--    whole migration aborts, which is the intended safe failure.
-- 2. Cascade recipe deletion from auth.users (recipe_ingredients and
--    grocery_list_recipes already cascade from recipes).
-- 3. Match anonymous users on is_anonymous instead of email IS NULL, so
--    non-anonymous accounts without an email (e.g. phone sign-in) are kept.

delete from public.recipes r
where r.is_public = false
  and not exists (select 1 from auth.users u where u.id = r.created_by);

alter table "public"."recipes"
  add constraint "recipes_created_by_fkey"
  foreign key (created_by) references auth.users(id) on delete cascade;

-- CREATE OR REPLACE keeps the existing owner and EXECUTE grants (revoked from
-- anon/authenticated/PUBLIC in earlier migrations).
CREATE OR REPLACE FUNCTION public.delete_old_anonymous_users()
 RETURNS TABLE(deleted_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
    total_deleted INTEGER;
BEGIN
    -- Delete anonymous users older than 24 hours from auth.users
    WITH deleted_users AS (
        DELETE FROM auth.users
        WHERE
            is_anonymous = true
            AND created_at < NOW() - INTERVAL '24 hours'
        RETURNING id
    )
    SELECT COUNT(*) INTO total_deleted FROM deleted_users;

    RETURN QUERY SELECT total_deleted;
END;$function$
;
