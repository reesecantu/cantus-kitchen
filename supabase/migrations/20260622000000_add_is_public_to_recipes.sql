-- Replace the sentinel-account pattern (hardcoded created_by UUID) with an
-- explicit is_public flag. The public catalog account's recipes are backfilled
-- as public; all other existing and future user-created recipes default to
-- private. The UUID is removed from both the RLS policy and application code.

alter table "public"."recipes"
  add column "is_public" boolean not null default false;

-- Backfill: every recipe owned by the public catalog account becomes public.
update "public"."recipes"
  set is_public = true
  where created_by = '6e0258f5-c980-47d2-a7ee-981e76e56333';

-- Partial index — only public rows need to be scanned for the catalog query.
create index "recipes_is_public_idx" on "public"."recipes" (is_public)
  where is_public = true;

-- Replace the hardcoded-UUID SELECT policy with one that reads is_public.
drop policy if exists "Enable read for public catalog and own recipes" on "public"."recipes";

create policy "Enable read for public catalog and own recipes"
  on "public"."recipes"
  as permissive
  for select
  to public
  using (
    is_public = true
    or created_by = (select auth.uid())
  );
