-- Create storage bucket for map images
-- Private bucket with user-specific access via RLS policies

-- Create the bucket (private by default)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'map-images',
  'map-images',
  false, -- Private bucket
  5242880, -- 5MB limit (compressed JPEG should be well under this)
  array['image/jpeg', 'image/jpg', 'image/png']
)
on conflict (id) do nothing;

-- Policy: Users can upload their own map images
create policy "Users can upload their own map images"
on storage.objects for insert
with check (
  bucket_id = 'map-images' and
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own map images
create policy "Users can view their own map images"
on storage.objects for select
using (
  bucket_id = 'map-images' and
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own map images
create policy "Users can delete their own map images"
on storage.objects for delete
using (
  bucket_id = 'map-images' and
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Note: Service role client (used in server-side code) bypasses RLS automatically,
-- so no separate policy is needed for server-side uploads

