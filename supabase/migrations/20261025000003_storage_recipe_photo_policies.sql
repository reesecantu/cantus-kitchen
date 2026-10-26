-- Lock Storage down to recipe photos and make photo cleanup actually work.
--
-- Before: the only storage.objects policy let any authenticated user (guests
-- included) INSERT anything into any bucket, and the 5 MB / image-only check
-- lived only in the browser. With no DELETE policy, the photo cleanup in
-- src/server/recipes.server.ts (caller's cookie client) silently removed
-- nothing.
--
-- Cleanup stays on the caller's client on purpose: image_url is
-- client-controlled, so a service-role delete would let a user delete anyone's
-- photo. Storage sets owner_id to the uploader, so ownership is the check.
-- Safe to re-run: every policy is dropped first.

-- 1. Uploads: recipe-photos bucket only.
drop policy if exists "Allow INSERT for authenticated users only" on "storage"."objects";
create policy "Allow INSERT for authenticated users only"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (bucket_id = 'recipe-photos');

-- 2. Deletes: only your own recipe photos. Storage's remove() deletes with
-- RETURNING, so it also needs SELECT on the same rows; public URL reads go
-- through the public bucket endpoint and are unaffected.
drop policy if exists "Allow DELETE of own recipe photos" on "storage"."objects";
create policy "Allow DELETE of own recipe photos"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (bucket_id = 'recipe-photos' and owner_id = (select auth.uid())::text);

drop policy if exists "Allow SELECT of own recipe photos" on "storage"."objects";
create policy "Allow SELECT of own recipe photos"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (bucket_id = 'recipe-photos' and owner_id = (select auth.uid())::text);

-- 3. Server-side size/type limits matching src/components/ImageUpload.tsx
-- (5 MB, common image types).
update "storage"."buckets"
  set file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  where id = 'recipe-photos';
