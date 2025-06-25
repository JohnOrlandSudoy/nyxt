/*
  # Fix Profile Creation Issues

  1. Database Changes
    - Ensure user_profiles table exists with correct structure
    - Fix automatic profile creation trigger
    - Add better error handling for profile creation
    - Ensure RPC functions work correctly

  2. Security
    - Maintain RLS policies
    - Ensure proper permissions

  3. Debugging
    - Add logging for profile creation attempts
    - Better error handling
*/

-- First, let's make sure the user_profiles table exists with the correct structure
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email text NOT NULL,
  profile_photo text,
  cover_photo text,
  full_name text NOT NULL DEFAULT '',
  birthday date,
  bio text DEFAULT '',
  job text DEFAULT '',
  fashion text DEFAULT '',
  age integer CHECK (age >= 13 AND age <= 120),
  relationship_status text DEFAULT 'prefer-not-to-say' CHECK (
    relationship_status IN ('prefer-not-to-say', 'single', 'relationship', 'married', 'complicated')
  ),
  location text,
  website text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure user_interests table exists
CREATE TABLE IF NOT EXISTS user_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  interest text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, interest)
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;

DROP POLICY IF EXISTS "Users can view own interests" ON user_interests;
DROP POLICY IF EXISTS "Users can insert own interests" ON user_interests;
DROP POLICY IF EXISTS "Users can update own interests" ON user_interests;
DROP POLICY IF EXISTS "Users can delete own interests" ON user_interests;

-- Create policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for user_interests
CREATE POLICY "Users can view own interests"
  ON user_interests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interests"
  ON user_interests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interests"
  ON user_interests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interests"
  ON user_interests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create or replace the automatic profile creation function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user_profile_creation()
RETURNS trigger AS $$
BEGIN
  -- Log the attempt
  RAISE LOG 'Creating profile for new user: %', NEW.id;
  
  BEGIN
    -- Create a basic profile for new users
    INSERT INTO user_profiles (
      user_id,
      email,
      full_name
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    
    RAISE LOG 'Profile created successfully for user: %', NEW.id;
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, this is okay
      RAISE LOG 'Profile already exists for user: %', NEW.id;
    WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      RAISE LOG 'Failed to create profile for user %, error: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created_profile_system ON auth.users;
CREATE TRIGGER on_auth_user_created_profile_system
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_profile_creation();

-- Create or replace the RPC function for getting profile with interests
CREATE OR REPLACE FUNCTION get_user_profile_with_interests(profile_user_id uuid)
RETURNS json AS $$
DECLARE
  profile_data json;
  interests_array json;
BEGIN
  -- Get profile data
  SELECT to_json(up.*) INTO profile_data
  FROM user_profiles up
  WHERE up.user_id = profile_user_id;
  
  -- Get interests array
  SELECT json_agg(ui.interest) INTO interests_array
  FROM user_interests ui
  WHERE ui.user_id = profile_user_id;
  
  -- Combine profile data with interests
  IF profile_data IS NOT NULL THEN
    SELECT json_build_object(
      'profile', profile_data,
      'interests', COALESCE(interests_array, '[]'::json)
    ) INTO profile_data;
  END IF;
  
  RETURN profile_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the RPC function for upserting profiles
CREATE OR REPLACE FUNCTION upsert_user_profile(
  profile_user_id uuid,
  profile_email text,
  profile_photo text DEFAULT NULL,
  cover_photo text DEFAULT NULL,
  full_name text DEFAULT '',
  birthday date DEFAULT NULL,
  bio text DEFAULT '',
  job text DEFAULT '',
  fashion text DEFAULT '',
  age integer DEFAULT NULL,
  relationship_status text DEFAULT 'prefer-not-to-say',
  location text DEFAULT NULL,
  website text DEFAULT NULL,
  phone text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  profile_id uuid;
BEGIN
  -- Insert or update profile
  INSERT INTO user_profiles (
    user_id, email, profile_photo, cover_photo, full_name, birthday,
    bio, job, fashion, age, relationship_status, location, website, phone
  )
  VALUES (
    profile_user_id, profile_email, profile_photo, cover_photo, full_name, birthday,
    bio, job, fashion, age, relationship_status, location, website, phone
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    email = EXCLUDED.email,
    profile_photo = COALESCE(EXCLUDED.profile_photo, user_profiles.profile_photo),
    cover_photo = COALESCE(EXCLUDED.cover_photo, user_profiles.cover_photo),
    full_name = EXCLUDED.full_name,
    birthday = EXCLUDED.birthday,
    bio = EXCLUDED.bio,
    job = EXCLUDED.job,
    fashion = EXCLUDED.fashion,
    age = EXCLUDED.age,
    relationship_status = EXCLUDED.relationship_status,
    location = EXCLUDED.location,
    website = EXCLUDED.website,
    phone = EXCLUDED.phone,
    updated_at = now()
  RETURNING id INTO profile_id;
  
  RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the RPC function for managing interests
CREATE OR REPLACE FUNCTION upsert_user_interests(
  profile_user_id uuid,
  interests_array text[]
)
RETURNS void AS $$
BEGIN
  -- Delete existing interests
  DELETE FROM user_interests WHERE user_id = profile_user_id;
  
  -- Insert new interests
  IF interests_array IS NOT NULL AND array_length(interests_array, 1) > 0 THEN
    INSERT INTO user_interests (user_id, interest)
    SELECT profile_user_id, unnest(interests_array);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_interest ON user_interests(interest);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_interests TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile_with_interests(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_profile(uuid, text, text, text, text, date, text, text, text, integer, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_interests(uuid, text[]) TO authenticated;

-- Create a function to manually create profiles for existing users who don't have one
CREATE OR REPLACE FUNCTION create_missing_profiles()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  profile_count INTEGER;
BEGIN
  -- Loop through all users who don't have a profile
  FOR user_record IN 
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE up.user_id IS NULL
  LOOP
    BEGIN
      INSERT INTO user_profiles (
        user_id,
        email,
        full_name
      )
      VALUES (
        user_record.id,
        COALESCE(user_record.email, ''),
        COALESCE(user_record.raw_user_meta_data->>'full_name', '')
      );
      
      RAISE LOG 'Created missing profile for user: %', user_record.id;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Failed to create missing profile for user %, error: %', user_record.id, SQLERRM;
    END;
  END LOOP;
  
  -- Count total profiles created
  SELECT COUNT(*) INTO profile_count FROM user_profiles;
  RAISE LOG 'Total profiles in database: %', profile_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function to create missing profiles for existing users
SELECT create_missing_profiles();

-- Create a function to check profile creation status
CREATE OR REPLACE FUNCTION check_profile_status()
RETURNS TABLE(
  total_users bigint,
  total_profiles bigint,
  users_without_profiles bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM user_profiles) as total_profiles,
    (SELECT COUNT(*) 
     FROM auth.users u 
     LEFT JOIN user_profiles up ON u.id = up.user_id 
     WHERE up.user_id IS NULL) as users_without_profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on utility functions
GRANT EXECUTE ON FUNCTION create_missing_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION check_profile_status() TO authenticated;