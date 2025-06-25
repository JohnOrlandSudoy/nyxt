/*
  # Fix Storage Policies Syntax Error

  1. Storage Setup
    - Drop existing policies with syntax errors
    - Create corrected storage policies with proper syntax
    - Ensure proper folder-based access control

  2. Security
    - Users can only access their own folders
    - Public read access for profile display
    - Proper file type and size restrictions
*/

-- Drop existing policies that might have syntax errors
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for user uploads" ON storage.objects;

-- Create the storage bucket for user uploads (if not exists)
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

-- Policy: Users can upload files to their own profile-photos folder
CREATE POLICY "Users can upload profile photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy: Users can upload files to their own cover-photos folder
CREATE POLICY "Users can upload cover photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'cover-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy: Users can view their own profile photos
CREATE POLICY "Users can view own profile photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy: Users can view their own cover photos
CREATE POLICY "Users can view own cover photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'cover-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy: Users can update their own profile photos
CREATE POLICY "Users can update own profile photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy: Users can update their own cover photos
CREATE POLICY "Users can update own cover photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'cover-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy: Users can delete their own profile photos
CREATE POLICY "Users can delete own profile photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy: Users can delete their own cover photos
CREATE POLICY "Users can delete own cover photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'cover-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
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