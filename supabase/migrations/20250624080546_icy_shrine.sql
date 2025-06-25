/*
  # Advanced Chat and Collaboration System

  1. New Tables
    - `chat_rooms` - Chat rooms for conversations
    - `chat_messages` - Individual messages in chat rooms
    - `chat_participants` - Users participating in chat rooms
    - `user_connections` - Friend/connection system
    - `collaboration_sessions` - Active collaboration sessions
    - `user_presence` - Real-time user presence tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Ensure users can only access authorized chats

  3. Features
    - Real-time messaging
    - User discovery and profiles
    - Friend/connection system
    - Collaboration sessions
    - Presence tracking
*/

-- Chat Rooms Table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  type text NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'collaboration')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_private boolean DEFAULT true,
  max_participants integer DEFAULT 50,
  room_settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'code', 'ai_response')),
  metadata jsonb DEFAULT '{}',
  reply_to uuid REFERENCES chat_messages(id) ON DELETE SET NULL,
  edited_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Chat Participants Table
CREATE TABLE IF NOT EXISTS chat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz DEFAULT now(),
  is_muted boolean DEFAULT false,
  UNIQUE(room_id, user_id)
);

-- User Connections Table (Friends/Followers system)
CREATE TABLE IF NOT EXISTS user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  addressee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked', 'declined')),
  connection_type text DEFAULT 'friend' CHECK (connection_type IN ('friend', 'follow', 'collaborate')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(requester_id, addressee_id, connection_type),
  CHECK (requester_id != addressee_id)
);

-- Collaboration Sessions Table
CREATE TABLE IF NOT EXISTS collaboration_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  session_type text DEFAULT 'general' CHECK (session_type IN ('general', 'coding', 'design', 'brainstorm', 'meeting')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  host_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  max_participants integer DEFAULT 10,
  session_data jsonb DEFAULT '{}',
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- User Presence Table
CREATE TABLE IF NOT EXISTS user_presence (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen timestamptz DEFAULT now(),
  current_room_id uuid REFERENCES chat_rooms(id) ON DELETE SET NULL,
  device_info jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Policies for chat_rooms
CREATE POLICY "Users can view rooms they participate in"
  ON chat_rooms FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT room_id FROM chat_participants WHERE user_id = auth.uid()
    ) OR 
    (NOT is_private AND type = 'group')
  );

CREATE POLICY "Users can create rooms"
  ON chat_rooms FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Room creators and admins can update rooms"
  ON chat_rooms FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() OR
    id IN (
      SELECT room_id FROM chat_participants 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policies for chat_messages
CREATE POLICY "Users can view messages in their rooms"
  ON chat_messages FOR SELECT TO authenticated
  USING (
    room_id IN (
      SELECT room_id FROM chat_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their rooms"
  ON chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    room_id IN (
      SELECT room_id FROM chat_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON chat_messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid());

-- Policies for chat_participants
CREATE POLICY "Users can view participants in their rooms"
  ON chat_participants FOR SELECT TO authenticated
  USING (
    room_id IN (
      SELECT room_id FROM chat_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Room owners can manage participants"
  ON chat_participants FOR ALL TO authenticated
  USING (
    room_id IN (
      SELECT room_id FROM chat_participants 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can join public rooms"
  ON chat_participants FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (
      room_id IN (
        SELECT id FROM chat_rooms WHERE NOT is_private
      ) OR
      room_id IN (
        SELECT room_id FROM chat_participants 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- Policies for user_connections
CREATE POLICY "Users can view their connections"
  ON user_connections FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "Users can create connection requests"
  ON user_connections FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update their connection requests"
  ON user_connections FOR UPDATE TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Policies for collaboration_sessions
CREATE POLICY "Users can view sessions in their rooms"
  ON collaboration_sessions FOR SELECT TO authenticated
  USING (
    room_id IN (
      SELECT room_id FROM chat_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Room participants can create sessions"
  ON collaboration_sessions FOR INSERT TO authenticated
  WITH CHECK (
    host_id = auth.uid() AND
    room_id IN (
      SELECT room_id FROM chat_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Session hosts can update sessions"
  ON collaboration_sessions FOR UPDATE TO authenticated
  USING (host_id = auth.uid());

-- Policies for user_presence
CREATE POLICY "Users can view all user presence"
  ON user_presence FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update their own presence"
  ON user_presence FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON chat_rooms(type);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON chat_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_at ON chat_rooms(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_id, created_at);

CREATE INDEX IF NOT EXISTS idx_chat_participants_room_id ON chat_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_role ON chat_participants(role);

CREATE INDEX IF NOT EXISTS idx_user_connections_requester ON user_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_addressee ON user_connections(addressee_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON user_connections(status);

CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_room_id ON collaboration_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_host_id ON collaboration_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_status ON collaboration_sessions(status);

CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);

-- Function to create a direct message room between two users
CREATE OR REPLACE FUNCTION create_direct_message_room(
  other_user_id uuid
)
RETURNS uuid AS $$
DECLARE
  room_id uuid;
  current_user_id uuid := auth.uid();
BEGIN
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

-- Function to get user's chat rooms with latest message
CREATE OR REPLACE FUNCTION get_user_chat_rooms(user_id_param uuid DEFAULT auth.uid())
RETURNS TABLE(
  room_id uuid,
  room_name text,
  room_type text,
  is_private boolean,
  participant_count bigint,
  latest_message_content text,
  latest_message_created_at timestamptz,
  latest_message_sender_name text,
  unread_count bigint,
  last_read_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id as room_id,
    CASE 
      WHEN cr.type = 'direct' THEN (
        SELECT up.full_name 
        FROM user_profiles up
        JOIN chat_participants cp ON up.user_id = cp.user_id
        WHERE cp.room_id = cr.id AND cp.user_id != user_id_param
        LIMIT 1
      )
      ELSE cr.name
    END as room_name,
    cr.type as room_type,
    cr.is_private,
    (SELECT COUNT(*) FROM chat_participants WHERE room_id = cr.id) as participant_count,
    latest_msg.content as latest_message_content,
    latest_msg.created_at as latest_message_created_at,
    latest_sender.full_name as latest_message_sender_name,
    COALESCE(unread.unread_count, 0) as unread_count,
    cp.last_read_at
  FROM chat_rooms cr
  JOIN chat_participants cp ON cr.id = cp.room_id
  LEFT JOIN LATERAL (
    SELECT content, created_at, sender_id
    FROM chat_messages cm
    WHERE cm.room_id = cr.id
    ORDER BY cm.created_at DESC
    LIMIT 1
  ) latest_msg ON true
  LEFT JOIN user_profiles latest_sender ON latest_msg.sender_id = latest_sender.user_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as unread_count
    FROM chat_messages cm
    WHERE cm.room_id = cr.id 
      AND cm.created_at > cp.last_read_at
      AND cm.sender_id != user_id_param
  ) unread ON true
  WHERE cp.user_id = user_id_param
  ORDER BY COALESCE(latest_msg.created_at, cr.created_at) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search users for collaboration
CREATE OR REPLACE FUNCTION search_users_for_collaboration(
  search_term text DEFAULT '',
  limit_count integer DEFAULT 20
)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  email text,
  bio text,
  profile_photo text,
  location text,
  interests text[],
  connection_status text,
  last_seen timestamptz,
  presence_status text
) AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  RETURN QUERY
  SELECT 
    up.user_id,
    up.full_name,
    up.email,
    up.bio,
    up.profile_photo,
    up.location,
    COALESCE(
      ARRAY(
        SELECT ui.interest 
        FROM user_interests ui 
        WHERE ui.user_id = up.user_id
      ), 
      ARRAY[]::text[]
    ) as interests,
    COALESCE(uc.status, 'none') as connection_status,
    COALESCE(pres.last_seen, up.created_at) as last_seen,
    COALESCE(pres.status, 'offline') as presence_status
  FROM user_profiles up
  LEFT JOIN user_connections uc ON (
    (uc.requester_id = current_user_id AND uc.addressee_id = up.user_id) OR
    (uc.requester_id = up.user_id AND uc.addressee_id = current_user_id)
  )
  LEFT JOIN user_presence pres ON pres.user_id = up.user_id
  WHERE up.user_id != current_user_id
    AND (
      search_term = '' OR
      up.full_name ILIKE '%' || search_term || '%' OR
      up.bio ILIKE '%' || search_term || '%' OR
      up.location ILIKE '%' || search_term || '%' OR
      EXISTS (
        SELECT 1 FROM user_interests ui 
        WHERE ui.user_id = up.user_id 
        AND ui.interest ILIKE '%' || search_term || '%'
      )
    )
  ORDER BY 
    CASE WHEN uc.status = 'accepted' THEN 1 ELSE 2 END,
    pres.last_seen DESC NULLS LAST,
    up.full_name
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get room messages with pagination
CREATE OR REPLACE FUNCTION get_room_messages(
  room_id_param uuid,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  message_id uuid,
  content text,
  message_type text,
  sender_id uuid,
  sender_name text,
  sender_photo text,
  reply_to uuid,
  reply_content text,
  metadata jsonb,
  created_at timestamptz,
  edited_at timestamptz
) AS $$
BEGIN
  -- Check if user has access to this room
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE room_id = room_id_param AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied to this chat room';
  END IF;

  RETURN QUERY
  SELECT 
    cm.id as message_id,
    cm.content,
    cm.message_type,
    cm.sender_id,
    COALESCE(up.full_name, 'Unknown User') as sender_name,
    up.profile_photo as sender_photo,
    cm.reply_to,
    reply_msg.content as reply_content,
    cm.metadata,
    cm.created_at,
    cm.edited_at
  FROM chat_messages cm
  LEFT JOIN user_profiles up ON cm.sender_id = up.user_id
  LEFT JOIN chat_messages reply_msg ON cm.reply_to = reply_msg.id
  WHERE cm.room_id = room_id_param
  ORDER BY cm.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(
  status_param text DEFAULT 'online',
  room_id_param uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  INSERT INTO user_presence (user_id, status, current_room_id, last_seen, updated_at)
  VALUES (current_user_id, status_param, room_id_param, now(), now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    status = status_param,
    current_room_id = room_id_param,
    last_seen = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send a connection request
CREATE OR REPLACE FUNCTION send_connection_request(
  addressee_id_param uuid,
  connection_type_param text DEFAULT 'friend'
)
RETURNS uuid AS $$
DECLARE
  connection_id uuid;
  current_user_id uuid := auth.uid();
BEGIN
  -- Check if connection already exists
  IF EXISTS (
    SELECT 1 FROM user_connections 
    WHERE (requester_id = current_user_id AND addressee_id = addressee_id_param)
       OR (requester_id = addressee_id_param AND addressee_id = current_user_id)
  ) THEN
    RAISE EXCEPTION 'Connection already exists between these users';
  END IF;

  INSERT INTO user_connections (requester_id, addressee_id, connection_type, status)
  VALUES (current_user_id, addressee_id_param, connection_type_param, 'pending')
  RETURNING id INTO connection_id;

  RETURN connection_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to respond to connection request
CREATE OR REPLACE FUNCTION respond_to_connection_request(
  connection_id_param uuid,
  response_param text -- 'accepted', 'declined', 'blocked'
)
RETURNS void AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  UPDATE user_connections 
  SET status = response_param, updated_at = now()
  WHERE id = connection_id_param 
    AND addressee_id = current_user_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Connection request not found or not authorized';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create collaboration session
CREATE OR REPLACE FUNCTION create_collaboration_session(
  room_id_param uuid,
  title_param text,
  description_param text DEFAULT '',
  session_type_param text DEFAULT 'general'
)
RETURNS uuid AS $$
DECLARE
  session_id uuid;
  current_user_id uuid := auth.uid();
BEGIN
  -- Check if user is participant in the room
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE room_id = room_id_param AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Access denied to this chat room';
  END IF;

  INSERT INTO collaboration_sessions (
    room_id, title, description, session_type, host_id
  )
  VALUES (
    room_id_param, title_param, description_param, session_type_param, current_user_id
  )
  RETURNING id INTO session_id;

  -- Send system message about session creation
  INSERT INTO chat_messages (room_id, sender_id, content, message_type, metadata)
  VALUES (
    room_id_param,
    current_user_id,
    'Started a collaboration session: ' || title_param,
    'system',
    jsonb_build_object('session_id', session_id, 'action', 'session_created')
  );

  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION create_direct_message_room(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_chat_rooms(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION search_users_for_collaboration(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_room_messages(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_presence(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION send_connection_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION respond_to_connection_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_collaboration_session(uuid, text, text, text) TO authenticated;

-- Grant table permissions
GRANT ALL ON chat_rooms TO authenticated;
GRANT ALL ON chat_messages TO authenticated;
GRANT ALL ON chat_participants TO authenticated;
GRANT ALL ON user_connections TO authenticated;
GRANT ALL ON collaboration_sessions TO authenticated;
GRANT ALL ON user_presence TO authenticated;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_rooms_updated_at
  BEFORE UPDATE ON chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_connections_updated_at
  BEFORE UPDATE ON user_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();