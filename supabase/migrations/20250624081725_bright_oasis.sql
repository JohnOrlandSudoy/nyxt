/*
  # Fix Chat System SQL Errors and Improve Functionality

  1. Database Fixes
    - Fix ambiguous column references in SQL functions
    - Improve RPC functions with proper table aliases
    - Add better error handling and validation
    - Fix connection status logic

  2. Enhanced Features
    - Better user search functionality
    - Improved connection management
    - Fixed chat room retrieval
    - Enhanced message handling

  3. Security
    - Maintain all existing RLS policies
    - Add additional validation for connections
    - Ensure proper access control
*/

-- Fix the get_user_chat_rooms function with proper aliases
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
        JOIN chat_participants cp_inner ON up.user_id = cp_inner.user_id
        WHERE cp_inner.room_id = cr.id AND cp_inner.user_id != user_id_param
        LIMIT 1
      )
      ELSE cr.name
    END as room_name,
    cr.type as room_type,
    cr.is_private,
    (SELECT COUNT(*) FROM chat_participants cp_count WHERE cp_count.room_id = cr.id) as participant_count,
    latest_msg.content as latest_message_content,
    latest_msg.created_at as latest_message_created_at,
    latest_sender.full_name as latest_message_sender_name,
    COALESCE(unread.unread_count, 0) as unread_count,
    cp.last_read_at
  FROM chat_rooms cr
  JOIN chat_participants cp ON cr.id = cp.room_id
  LEFT JOIN LATERAL (
    SELECT cm.content, cm.created_at, cm.sender_id
    FROM chat_messages cm
    WHERE cm.room_id = cr.id
    ORDER BY cm.created_at DESC
    LIMIT 1
  ) latest_msg ON true
  LEFT JOIN user_profiles latest_sender ON latest_msg.sender_id = latest_sender.user_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as unread_count
    FROM chat_messages cm_unread
    WHERE cm_unread.room_id = cr.id 
      AND cm_unread.created_at > cp.last_read_at
      AND cm_unread.sender_id != user_id_param
  ) unread ON true
  WHERE cp.user_id = user_id_param
  ORDER BY COALESCE(latest_msg.created_at, cr.created_at) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the search_users_for_collaboration function
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
    CASE 
      WHEN uc_req.status IS NOT NULL AND uc_req.requester_id = current_user_id THEN uc_req.status
      WHEN uc_addr.status IS NOT NULL AND uc_addr.addressee_id = current_user_id THEN uc_addr.status
      ELSE 'none'
    END as connection_status,
    COALESCE(pres.last_seen, up.created_at) as last_seen,
    COALESCE(pres.status, 'offline') as presence_status
  FROM user_profiles up
  LEFT JOIN user_connections uc_req ON (
    uc_req.requester_id = current_user_id AND uc_req.addressee_id = up.user_id
  )
  LEFT JOIN user_connections uc_addr ON (
    uc_addr.requester_id = up.user_id AND uc_addr.addressee_id = current_user_id
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
    CASE 
      WHEN uc_req.status = 'accepted' OR uc_addr.status = 'accepted' THEN 1 
      ELSE 2 
    END,
    pres.last_seen DESC NULLS LAST,
    up.full_name
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the get_room_messages function with proper aliases
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
    SELECT 1 FROM chat_participants cp_access
    WHERE cp_access.room_id = room_id_param AND cp_access.user_id = auth.uid()
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

-- Enhanced function to handle connection requests with better logic
CREATE OR REPLACE FUNCTION send_connection_request(
  addressee_id_param uuid,
  connection_type_param text DEFAULT 'friend'
)
RETURNS uuid AS $$
DECLARE
  connection_id uuid;
  current_user_id uuid := auth.uid();
  existing_connection RECORD;
BEGIN
  -- Check if any connection already exists between these users
  SELECT * INTO existing_connection
  FROM user_connections 
  WHERE (
    (requester_id = current_user_id AND addressee_id = addressee_id_param) OR
    (requester_id = addressee_id_param AND addressee_id = current_user_id)
  )
  AND connection_type = connection_type_param;

  -- If connection exists, handle based on status
  IF existing_connection.id IS NOT NULL THEN
    CASE existing_connection.status
      WHEN 'pending' THEN
        RAISE EXCEPTION 'Connection request already pending between these users';
      WHEN 'accepted' THEN
        RAISE EXCEPTION 'Users are already connected';
      WHEN 'blocked' THEN
        RAISE EXCEPTION 'Connection is blocked';
      WHEN 'declined' THEN
        -- Allow re-sending after decline, update existing record
        UPDATE user_connections 
        SET status = 'pending', updated_at = now()
        WHERE id = existing_connection.id
        RETURNING id INTO connection_id;
        
        RETURN connection_id;
    END CASE;
  END IF;

  -- Create new connection request
  INSERT INTO user_connections (requester_id, addressee_id, connection_type, status)
  VALUES (current_user_id, addressee_id_param, connection_type_param, 'pending')
  RETURNING id INTO connection_id;

  RETURN connection_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced function to respond to connection requests
CREATE OR REPLACE FUNCTION respond_to_connection_request(
  connection_id_param uuid,
  response_param text -- 'accepted', 'declined', 'blocked'
)
RETURNS void AS $$
DECLARE
  current_user_id uuid := auth.uid();
  connection_record RECORD;
BEGIN
  -- Get the connection record
  SELECT * INTO connection_record
  FROM user_connections 
  WHERE id = connection_id_param;

  -- Validate the connection exists
  IF connection_record.id IS NULL THEN
    RAISE EXCEPTION 'Connection request not found';
  END IF;

  -- Check if current user is the addressee or if it's their own request
  IF connection_record.addressee_id != current_user_id AND connection_record.requester_id != current_user_id THEN
    RAISE EXCEPTION 'Not authorized to respond to this connection request';
  END IF;

  -- Check if connection is still pending
  IF connection_record.status != 'pending' THEN
    RAISE EXCEPTION 'Connection request is no longer pending';
  END IF;

  -- Update the connection status
  UPDATE user_connections 
  SET status = response_param, updated_at = now()
  WHERE id = connection_id_param;

  -- If accepted, create a direct message room
  IF response_param = 'accepted' THEN
    PERFORM create_direct_message_room(
      CASE 
        WHEN connection_record.requester_id = current_user_id 
        THEN connection_record.addressee_id 
        ELSE connection_record.requester_id 
      END
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user connections with detailed info
CREATE OR REPLACE FUNCTION get_user_connections(
  user_id_param uuid DEFAULT auth.uid(),
  status_filter text DEFAULT NULL
)
RETURNS TABLE(
  connection_id uuid,
  other_user_id uuid,
  other_user_name text,
  other_user_photo text,
  connection_type text,
  status text,
  is_requester boolean,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uc.id as connection_id,
    CASE 
      WHEN uc.requester_id = user_id_param THEN uc.addressee_id
      ELSE uc.requester_id
    END as other_user_id,
    up.full_name as other_user_name,
    up.profile_photo as other_user_photo,
    uc.connection_type,
    uc.status,
    (uc.requester_id = user_id_param) as is_requester,
    uc.created_at,
    uc.updated_at
  FROM user_connections uc
  JOIN user_profiles up ON (
    CASE 
      WHEN uc.requester_id = user_id_param THEN up.user_id = uc.addressee_id
      ELSE up.user_id = uc.requester_id
    END
  )
  WHERE (uc.requester_id = user_id_param OR uc.addressee_id = user_id_param)
    AND (status_filter IS NULL OR uc.status = status_filter)
  ORDER BY uc.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get connection status between two users
CREATE OR REPLACE FUNCTION get_connection_status(
  user1_id uuid,
  user2_id uuid
)
RETURNS TABLE(
  status text,
  connection_type text,
  is_requester boolean
) AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  -- Ensure current user is one of the users in the query
  IF current_user_id != user1_id AND current_user_id != user2_id THEN
    RAISE EXCEPTION 'Not authorized to check this connection status';
  END IF;

  RETURN QUERY
  SELECT 
    uc.status,
    uc.connection_type,
    (uc.requester_id = current_user_id) as is_requester
  FROM user_connections uc
  WHERE (
    (uc.requester_id = user1_id AND uc.addressee_id = user2_id) OR
    (uc.requester_id = user2_id AND uc.addressee_id = user1_id)
  )
  ORDER BY uc.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  room_id_param uuid
)
RETURNS void AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  -- Check if user is participant in the room
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants cp_check
    WHERE cp_check.room_id = room_id_param AND cp_check.user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Access denied to this chat room';
  END IF;

  -- Update last_read_at timestamp
  UPDATE chat_participants 
  SET last_read_at = now()
  WHERE room_id = room_id_param AND user_id = current_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION get_user_connections(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_connection_status(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(uuid) TO authenticated;

-- Create indexes for better performance on connection queries
CREATE INDEX IF NOT EXISTS idx_user_connections_requester_status ON user_connections(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_user_connections_addressee_status ON user_connections(addressee_id, status);
CREATE INDEX IF NOT EXISTS idx_user_connections_type_status ON user_connections(connection_type, status);

-- Add constraint to prevent duplicate connection requests of same type
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_connections_unique_pair 
ON user_connections(
  LEAST(requester_id, addressee_id), 
  GREATEST(requester_id, addressee_id), 
  connection_type
);

-- Function to clean up old declined connections (optional)
CREATE OR REPLACE FUNCTION cleanup_old_declined_connections()
RETURNS void AS $$
BEGIN
  DELETE FROM user_connections 
  WHERE status = 'declined' 
    AND updated_at < (now() - interval '30 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION cleanup_old_declined_connections() TO authenticated;