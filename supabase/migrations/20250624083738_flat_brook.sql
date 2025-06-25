/*
  # Final Fix for Infinite Recursion in Chat Policies

  1. Problem Analysis
    - The infinite recursion occurs because policies reference the same table they protect
    - Even with EXISTS clauses, PostgreSQL detects circular dependencies
    - Need to completely eliminate self-referencing policies

  2. Solution
    - Remove all recursive policies on chat_participants
    - Use security definer functions for complex access control
    - Implement simple, direct policies without table self-references
    - Create helper functions that bypass RLS for internal checks

  3. Security Model
    - Users can only see their own participation records directly
    - All complex room access logic moved to security definer functions
    - Functions handle authorization internally without triggering RLS
*/

-- First, disable RLS temporarily to clean up
ALTER TABLE chat_participants DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on chat_participants to start fresh
DROP POLICY IF EXISTS "Users can view their own participation" ON chat_participants;
DROP POLICY IF EXISTS "Users can view participants in rooms they joined" ON chat_participants;
DROP POLICY IF EXISTS "Users can insert their own participation" ON chat_participants;
DROP POLICY IF EXISTS "Room owners can manage all participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON chat_participants;
DROP POLICY IF EXISTS "Users can delete their own participation" ON chat_participants;
DROP POLICY IF EXISTS "Users can view participants in their rooms" ON chat_participants;
DROP POLICY IF EXISTS "Room owners can manage participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can join public rooms" ON chat_participants;

-- Re-enable RLS
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;

-- Create ONLY simple, non-recursive policies
CREATE POLICY "Users can view own participation only"
  ON chat_participants FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own participation only"
  ON chat_participants FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own participation only"
  ON chat_participants FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own participation only"
  ON chat_participants FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Fix chat_messages policies to use security definer functions
DROP POLICY IF EXISTS "Users can view messages in accessible rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages to accessible rooms" ON chat_messages;

-- Create security definer function to check room access (bypasses RLS)
CREATE OR REPLACE FUNCTION user_has_room_access(room_id_param uuid, user_id_param uuid)
RETURNS boolean AS $$
DECLARE
  has_access boolean := false;
BEGIN
  -- This function runs with definer rights, bypassing RLS
  SELECT EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE room_id = room_id_param AND user_id = user_id_param
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple message policies using the security definer function
CREATE POLICY "Users can view messages with room access"
  ON chat_messages FOR SELECT TO authenticated
  USING (user_has_room_access(room_id, auth.uid()));

CREATE POLICY "Users can send messages with room access"
  ON chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND 
    user_has_room_access(room_id, auth.uid())
  );

-- Fix chat_rooms policy
DROP POLICY IF EXISTS "Users can view their accessible rooms" ON chat_rooms;

CREATE POLICY "Users can view accessible rooms"
  ON chat_rooms FOR SELECT TO authenticated
  USING (
    user_has_room_access(id, auth.uid()) OR 
    (NOT is_private AND type = 'group')
  );

-- Enhanced function to get room participants (security definer)
CREATE OR REPLACE FUNCTION get_room_participants(room_id_param uuid)
RETURNS TABLE(
  user_id uuid,
  user_name text,
  user_photo text,
  role text,
  joined_at timestamptz,
  last_read_at timestamptz
) AS $$
BEGIN
  -- Check if current user has access to this room
  IF NOT user_has_room_access(room_id_param, auth.uid()) THEN
    RAISE EXCEPTION 'Access denied to this chat room';
  END IF;

  RETURN QUERY
  SELECT 
    cp.user_id,
    COALESCE(up.full_name, 'Unknown User') as user_name,
    up.profile_photo as user_photo,
    cp.role,
    cp.joined_at,
    cp.last_read_at
  FROM chat_participants cp
  LEFT JOIN user_profiles up ON cp.user_id = up.user_id
  WHERE cp.room_id = room_id_param
  ORDER BY cp.joined_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced function to safely join room
CREATE OR REPLACE FUNCTION join_chat_room(
  room_id_param uuid,
  target_user_id uuid DEFAULT auth.uid()
)
RETURNS void AS $$
DECLARE
  current_user_id uuid := auth.uid();
  room_info RECORD;
BEGIN
  -- Get room information
  SELECT * INTO room_info
  FROM chat_rooms 
  WHERE id = room_id_param;

  IF room_info.id IS NULL THEN
    RAISE EXCEPTION 'Chat room not found';
  END IF;

  -- Check permissions
  IF target_user_id != current_user_id THEN
    -- Only room owners/admins can add other users
    IF NOT EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE room_id = room_id_param 
      AND user_id = current_user_id 
      AND role IN ('owner', 'admin')
    ) AND room_info.created_by != current_user_id THEN
      RAISE EXCEPTION 'Not authorized to add users to this room';
    END IF;
  END IF;

  -- Check if room is public or user has permission
  IF room_info.is_private AND target_user_id = current_user_id THEN
    -- For private rooms, user needs invitation (this would be handled by invitation system)
    -- For now, we'll allow if room is not full
    IF (SELECT COUNT(*) FROM chat_participants WHERE room_id = room_id_param) >= room_info.max_participants THEN
      RAISE EXCEPTION 'Room is full';
    END IF;
  END IF;

  -- Add user to room
  INSERT INTO chat_participants (room_id, user_id, role)
  VALUES (room_id_param, target_user_id, 'member')
  ON CONFLICT (room_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced function to leave room
CREATE OR REPLACE FUNCTION leave_chat_room(room_id_param uuid)
RETURNS void AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  -- Remove user from room
  DELETE FROM chat_participants 
  WHERE room_id = room_id_param AND user_id = current_user_id;
  
  -- If this was the last participant and room is direct message, we can keep it
  -- If it's a group and no participants left, could delete room (optional)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced send message function that bypasses RLS issues
CREATE OR REPLACE FUNCTION send_chat_message(
  room_id_param uuid,
  content_param text,
  message_type_param text DEFAULT 'text',
  reply_to_param uuid DEFAULT NULL,
  metadata_param jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  message_id uuid;
  current_user_id uuid := auth.uid();
BEGIN
  -- Check if user has access to room
  IF NOT user_has_room_access(room_id_param, current_user_id) THEN
    RAISE EXCEPTION 'You are not a participant in this chat room';
  END IF;

  -- Insert message
  INSERT INTO chat_messages (
    room_id, 
    sender_id, 
    content, 
    message_type, 
    reply_to, 
    metadata
  )
  VALUES (
    room_id_param,
    current_user_id,
    content_param,
    message_type_param,
    reply_to_param,
    metadata_param
  )
  RETURNING id INTO message_id;

  RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the create_direct_message_room function to use new approach
CREATE OR REPLACE FUNCTION create_direct_message_room(
  other_user_id uuid
)
RETURNS uuid AS $$
DECLARE
  room_id uuid;
  current_user_id uuid := auth.uid();
  existing_room_id uuid;
BEGIN
  -- Validate input
  IF other_user_id IS NULL OR other_user_id = current_user_id THEN
    RAISE EXCEPTION 'Invalid user ID for direct message';
  END IF;

  -- Check if a direct message room already exists
  -- Use a more direct approach to avoid RLS issues
  SELECT cr.id INTO existing_room_id
  FROM chat_rooms cr
  WHERE cr.type = 'direct'
    AND cr.id IN (
      SELECT cp1.room_id FROM chat_participants cp1 WHERE cp1.user_id = current_user_id
    )
    AND cr.id IN (
      SELECT cp2.room_id FROM chat_participants cp2 WHERE cp2.user_id = other_user_id
    )
    AND (
      SELECT COUNT(*) FROM chat_participants cp3 WHERE cp3.room_id = cr.id
    ) = 2
  LIMIT 1;

  IF existing_room_id IS NOT NULL THEN
    RETURN existing_room_id;
  END IF;

  -- Create new room
  INSERT INTO chat_rooms (type, created_by, is_private, max_participants)
  VALUES ('direct', current_user_id, true, 2)
  RETURNING id INTO room_id;

  -- Add both users as participants
  INSERT INTO chat_participants (room_id, user_id, role)
  VALUES 
    (room_id, current_user_id, 'owner'),
    (room_id, other_user_id, 'member');

  RETURN room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION user_has_room_access(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_room_participants(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION join_chat_room(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION leave_chat_room(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION send_chat_message(uuid, text, text, uuid, jsonb) TO authenticated;

-- Update the chatService to use the new send_chat_message function
-- This will be handled in the TypeScript code

-- Create a function to check current user's room access (for debugging)
CREATE OR REPLACE FUNCTION debug_room_access(room_id_param uuid)
RETURNS TABLE(
  has_access boolean,
  participant_count bigint,
  user_is_participant boolean,
  room_exists boolean
) AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  RETURN QUERY
  SELECT 
    user_has_room_access(room_id_param, current_user_id) as has_access,
    (SELECT COUNT(*) FROM chat_participants WHERE room_id = room_id_param) as participant_count,
    EXISTS(SELECT 1 FROM chat_participants WHERE room_id = room_id_param AND user_id = current_user_id) as user_is_participant,
    EXISTS(SELECT 1 FROM chat_rooms WHERE id = room_id_param) as room_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION debug_room_access(uuid) TO authenticated;

-- Add some helpful indexes
CREATE INDEX IF NOT EXISTS idx_chat_participants_room_user_unique ON chat_participants(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_id, created_at DESC);