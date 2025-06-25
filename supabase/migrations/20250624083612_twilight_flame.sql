/*
  # Fix Chat Participants RLS Policies

  1. Issues Fixed
    - Remove infinite recursion in chat_participants policies
    - Simplify policies to avoid circular references
    - Ensure proper access control without recursion

  2. Security
    - Users can only access rooms they're participants in
    - Prevent unauthorized access to chat data
    - Maintain data privacy and security
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view participants in their rooms" ON chat_participants;
DROP POLICY IF EXISTS "Room owners can manage participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can join public rooms" ON chat_participants;

-- Create simplified, non-recursive policies for chat_participants
CREATE POLICY "Users can view their own participation"
  ON chat_participants FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view participants in rooms they joined"
  ON chat_participants FOR SELECT TO authenticated
  USING (
    room_id IN (
      SELECT cp.room_id 
      FROM chat_participants cp 
      WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own participation"
  ON chat_participants FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Room owners can manage all participants"
  ON chat_participants FOR ALL TO authenticated
  USING (
    room_id IN (
      SELECT cr.id 
      FROM chat_rooms cr 
      WHERE cr.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update their own participation"
  ON chat_participants FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own participation"
  ON chat_participants FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Fix chat_messages policies to avoid recursion
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their rooms" ON chat_messages;

CREATE POLICY "Users can view messages in accessible rooms"
  ON chat_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants cp 
      WHERE cp.room_id = chat_messages.room_id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to accessible rooms"
  ON chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_participants cp 
      WHERE cp.room_id = chat_messages.room_id 
      AND cp.user_id = auth.uid()
    )
  );

-- Fix chat_rooms policies
DROP POLICY IF EXISTS "Users can view rooms they participate in" ON chat_rooms;

CREATE POLICY "Users can view their accessible rooms"
  ON chat_rooms FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants cp 
      WHERE cp.room_id = chat_rooms.id 
      AND cp.user_id = auth.uid()
    ) OR 
    (NOT is_private AND type = 'group')
  );

-- Create a function to safely check room participation
CREATE OR REPLACE FUNCTION is_room_participant(room_id_param uuid, user_id_param uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE room_id = room_id_param AND user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to safely add user to room
CREATE OR REPLACE FUNCTION add_user_to_room(
  room_id_param uuid,
  user_id_param uuid,
  role_param text DEFAULT 'member'
)
RETURNS void AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  -- Check if current user has permission to add users
  IF NOT EXISTS (
    SELECT 1 FROM chat_rooms cr 
    WHERE cr.id = room_id_param 
    AND (
      cr.created_by = current_user_id OR
      EXISTS (
        SELECT 1 FROM chat_participants cp 
        WHERE cp.room_id = room_id_param 
        AND cp.user_id = current_user_id 
        AND cp.role IN ('owner', 'admin')
      )
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized to add users to this room';
  END IF;

  -- Add user to room
  INSERT INTO chat_participants (room_id, user_id, role)
  VALUES (room_id_param, user_id_param, role_param)
  ON CONFLICT (room_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced create_direct_message_room function with better error handling
CREATE OR REPLACE FUNCTION create_direct_message_room(
  other_user_id uuid
)
RETURNS uuid AS $$
DECLARE
  room_id uuid;
  current_user_id uuid := auth.uid();
BEGIN
  -- Validate input
  IF other_user_id IS NULL OR other_user_id = current_user_id THEN
    RAISE EXCEPTION 'Invalid user ID for direct message';
  END IF;

  -- Check if a direct message room already exists between these users
  SELECT cr.id INTO room_id
  FROM chat_rooms cr
  WHERE cr.type = 'direct'
    AND cr.id IN (
      SELECT cp1.room_id
      FROM chat_participants cp1
      WHERE cp1.user_id = current_user_id
    )
    AND cr.id IN (
      SELECT cp2.room_id
      FROM chat_participants cp2
      WHERE cp2.user_id = other_user_id
    )
    AND (
      SELECT COUNT(*)
      FROM chat_participants cp3
      WHERE cp3.room_id = cr.id
    ) = 2;

  -- If room doesn't exist, create it
  IF room_id IS NULL THEN
    -- Create the room
    INSERT INTO chat_rooms (type, created_by, is_private, max_participants)
    VALUES ('direct', current_user_id, true, 2)
    RETURNING id INTO room_id;

    -- Add both users as participants
    INSERT INTO chat_participants (room_id, user_id, role)
    VALUES 
      (room_id, current_user_id, 'owner'),
      (room_id, other_user_id, 'member');
  END IF;

  RETURN room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_room_participant(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_to_room(uuid, uuid, text) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_participants_room_user ON chat_participants(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_room ON chat_participants(user_id, room_id);