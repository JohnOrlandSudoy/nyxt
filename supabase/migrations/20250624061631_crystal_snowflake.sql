/*
  # Create Comprehensive Profile System

  1. New Tables
    - `user_profiles` - Main profile table with all user information
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, user email)
      - `profile_photo` (text, base64 or URL)
      - `cover_photo` (text, base64 or URL)
      - `full_name` (text, user's full name)
      - `birthday` (date, user's birthday)
      - `bio` (text, user biography)
      - `job` (text, profession/job title)
      - `fashion` (text, fashion style preference)
      - `age` (integer, user's age)
      - `relationship_status` (text, relationship status)
      - `location` (text, user's location)
      - `website` (text, personal website/portfolio)
      - `phone` (text, phone number)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_interests` - User interests/hobbies table
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `interest` (text, interest/hobby name)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
    - Ensure data privacy and security

  3. Functions
    - Auto-update timestamp function
    - Profile creation helper functions

  4. Indexes
    - Performance optimization indexes
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email text NOT NULL,
  profile_photo text,
  cover_photo text,
  full_name text NOT NULL,
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

-- Create user_interests table
CREATE TABLE IF NOT EXISTS user_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  interest text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, interest)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

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

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_profiles updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_interest ON user_interests(interest);

-- Create function to get user profile with interests
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

-- Create function to upsert user profile
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

-- Create function to manage user interests
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

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user_profile_creation()
RETURNS trigger AS $$
BEGIN
  -- Create a basic profile for new users
  INSERT INTO user_profiles (
    user_id,
    email,
    full_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created_profile_system ON auth.users;
CREATE TRIGGER on_auth_user_created_profile_system
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_profile_creation();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_interests TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile_with_interests(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_profile(uuid, text, text, text, text, date, text, text, text, integer, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_interests(uuid, text[]) TO authenticated;