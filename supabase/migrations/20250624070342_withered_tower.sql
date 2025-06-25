/*
  # Setup Storage for User Profile Photos

  1. Storage Setup
    - Create user-uploads bucket for profile and cover photos
    - Set up proper RLS policies for secure access
    - Configure public access for uploaded photos

  2. Security
    - Users can only upload to their own folders
    - Public read access for profile photos
    - Proper file type and size restrictions
*/

-- Create the storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
) OR (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'cover-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy: Users can view their own files
CREATE POLICY "Users can view own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (
    (storage.foldername(name))[1] = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[2]
  ) OR (
    (storage.foldername(name))[1] = 'cover-photos' AND
    auth.uid()::text = (storage.foldername(name))[2]
  )
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (
    (storage.foldername(name))[1] = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[2]
  ) OR (
    (storage.foldername(name))[1] = 'cover-photos' AND
    auth.uid()::text = (storage.foldername(name))[2]
  )
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (
    (storage.foldername(name))[1] = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[2]
  ) OR (
    (storage.foldername(name))[1] = 'cover-photos' AND
    auth.uid()::text = (storage.foldername(name))[2]
  )
);

-- Policy: Public read access for all uploaded photos (for profile display)
CREATE POLICY "Public read access for user uploads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-uploads');

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO public;