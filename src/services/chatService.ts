import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatRoom {
  id: string;
  name?: string;
  type: 'direct' | 'group' | 'collaboration';
  isPrivate: boolean;
  participantCount: number;
  latestMessage?: {
    content: string;
    createdAt: string;
    senderName: string;
  };
  unreadCount: number;
  lastReadAt: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  sender_photo?: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'code' | 'system';
  created_at: string;
  updated_at?: string;
  edited_at?: string;
  reply_to?: string;
  reply_content?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: any;
}

export interface UserForCollaboration {
  userId: string;
  fullName: string;
  email: string;
  bio: string;
  profilePhoto?: string;
  location?: string;
  interests: string[];
  connectionStatus: 'none' | 'pending' | 'accepted' | 'blocked' | 'declined' | 'received';
  connectionId?: string;
  lastSeen: string;
  presenceStatus: 'online' | 'away' | 'busy' | 'offline';
}

export interface UserConnection {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto?: string;
  connectionType: 'friend' | 'follow' | 'collaborate';
  status: 'pending' | 'accepted' | 'blocked' | 'declined';
  isRequester: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CollaborationSession {
  id: string;
  roomId: string;
  title: string;
  description?: string;
  sessionType: 'general' | 'coding' | 'design' | 'brainstorm' | 'meeting';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  hostId: string;
  maxParticipants: number;
  sessionData?: any;
  startedAt: string;
  endedAt?: string;
}

export interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: string;
  currentRoomId?: string;
}

class ChatService {
  private realtimeChannels: Map<string, RealtimeChannel> = new Map();

  // Get user's chat rooms with error handling
  async getUserChatRooms(): Promise<ChatRoom[]> {
    try {
      console.log('Fetching user chat rooms...');
      
      const { data, error } = await supabase
        .rpc('get_user_chat_rooms');

      if (error) {
        console.error('Error fetching chat rooms:', error);
        throw new Error(`Failed to fetch chat rooms: ${error.message}`);
      }

      console.log('Chat rooms data received:', data);

      return data?.map((room: any) => {
        const latestMessage = room.latest_message_content ? {
          content: room.latest_message_content,
          createdAt: room.latest_message_created_at ? new Date(room.latest_message_created_at.replace(' ', 'T')).toISOString() : new Date().toISOString(),
          senderName: room.latest_message_sender_name,
        } : undefined;

        return {
          id: room.room_id,
          name: room.room_name,
          type: room.room_type,
          isPrivate: room.is_private,
          participantCount: room.participant_count,
          latestMessage: latestMessage,
          unreadCount: room.unread_count || 0,
          lastReadAt: room.last_read_at,
        };
      }) || [];
    } catch (error) {
      console.error('Get chat rooms failed:', error);
      throw error;
    }
  }

  // Create direct message room with improved error handling
  async createDirectMessageRoom(otherUserId: string): Promise<string> {
    try {
      console.log('Creating DM room with user:', otherUserId);
      
      const { data, error } = await supabase
        .rpc('create_direct_message_room', { other_user_id: otherUserId });

      if (error) {
        console.error('Error creating DM room:', error);
        throw new Error(`Failed to create direct message room: ${error.message}`);
      }

      console.log('DM room created:', data);
      return data;
    } catch (error) {
      console.error('Create DM room failed:', error);
      throw error;
    }
  }

  // Create group chat room
  async createGroupChatRoom(name: string, description?: string, isPrivate: boolean = true): Promise<string> {
    try {
      console.log('Creating group chat room:', { name, description, isPrivate });
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          name,
          description,
          type: 'group',
          is_private: isPrivate,
          created_by: user.user.id,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating group room:', error);
        throw new Error(`Failed to create group room: ${error.message}`);
      }

      // Add creator as owner using the new function
      await supabase.rpc('join_chat_room', {
        room_id_param: data.id,
        target_user_id: user.user.id
      });

      console.log('Group chat room created:', data.id);
      return data.id;
    } catch (error) {
      console.error('Create group room failed:', error);
      throw error;
    }
  }

  // Get room messages with improved error handling
  async getRoomMessages(roomId: string, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    try {
      console.log('Fetching messages for room:', roomId);
      
      const { data, error } = await supabase
        .rpc('get_room_messages', {
          room_id_param: roomId,
          limit_count: limit,
          offset_count: offset,
        });

      if (error) {
        console.error('Error fetching messages:', error);
        throw new Error(`Failed to fetch messages: ${error.message}`);
      }

      console.log('Messages data received:', data?.length || 0, 'messages');

      return data?.map((msg: any) => ({
        id: msg.message_id,
        room_id: msg.room_id,
        content: msg.content,
        message_type: msg.message_type,
        sender_id: msg.sender_id,
        sender_name: msg.sender_name,
        sender_photo: msg.sender_photo,
        reply_to: msg.reply_to,
        reply_content: msg.reply_content,
        metadata: msg.metadata,
        created_at: msg.created_at ? new Date(msg.created_at.replace(' ', 'T')).toISOString() : new Date().toISOString(),
        edited_at: msg.edited_at ? new Date(msg.edited_at.replace(' ', 'T')).toISOString() : undefined,
      })).reverse() || []; // Reverse to show oldest first
    } catch (error) {
      console.error('Get messages failed:', error);
      throw error;
    }
  }

  // Send message using the new security definer function
  async sendMessage(
    roomId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' | 'code' = 'text',
    replyTo?: string,
    metadata?: any
  ): Promise<string> {
    try {
      console.log('Sending message to room:', roomId);
      
      const { data, error } = await supabase
        .rpc('send_chat_message', {
          room_id_param: roomId,
          content_param: content,
          message_type_param: messageType,
          reply_to_param: replyTo,
          metadata_param: metadata || {}
        });

      if (error) {
        console.error('Error sending message:', error);
        throw new Error(`Failed to send message: ${error.message}`);
      }

      console.log('Message sent:', data);
      return data;
    } catch (error) {
      console.error('Send message failed:', error);
      throw error;
    }
  }

  // Search users for collaboration with improved error handling
  async searchUsersForCollaboration(searchTerm: string = '', limit: number = 20): Promise<UserForCollaboration[]> {
    try {
      console.log('Searching users for collaboration:', { searchTerm, limit });
      
      const { data, error } = await supabase
        .rpc('search_users_for_collaboration', {
          search_term: searchTerm,
          limit_count: limit,
        });

      if (error) {
        console.error('Error searching users:', error);
        throw new Error(`Failed to search users: ${error.message}`);
      }

      console.log('User search results:', data?.length || 0, 'users found');

      return data?.map((user: any) => {
        let connectionStatus = user.connection_status || 'none';
        // If the request is pending and the current user is NOT the one who sent it,
        // it's a request they have received.
        if (connectionStatus === 'pending' && !user.is_requester) {
          connectionStatus = 'received';
        }
        
        return {
          userId: user.user_id,
          fullName: user.full_name,
          email: user.email,
          bio: user.bio,
          profilePhoto: user.profile_photo,
          location: user.location,
          interests: user.interests || [],
          connectionStatus: connectionStatus,
          connectionId: user.connection_id,
          lastSeen: user.last_seen,
          presenceStatus: user.presence_status || 'offline',
        };
      }) || [];
    } catch (error) {
      console.error('Search users failed:', error);
      throw error;
    }
  }

  // Send connection request with improved error handling
  async sendConnectionRequest(userId: string, type: 'friend' | 'follow' | 'collaborate' = 'friend'): Promise<string> {
    try {
      console.log('Sending connection request:', { userId, type });
      
      const { data, error } = await supabase
        .rpc('send_connection_request', {
          addressee_id_param: userId,
          connection_type_param: type,
        });

      if (error) {
        console.error('Error sending connection request:', error);
        throw new Error(`Failed to send connection request: ${error.message}`);
      }

      console.log('Connection request sent:', data);
      return data;
    } catch (error) {
      console.error('Send connection request failed:', error);
      throw error;
    }
  }

  // Cancel a connection request sent by the current user
  async cancelConnectionRequest(connectionId: string): Promise<void> {
    try {
      console.log('Cancelling connection request:', { connectionId });
      
      const { error } = await supabase
        .rpc('cancel_connection_request', {
          connection_id_param: connectionId,
        });

      if (error) {
        console.error('Error cancelling connection request:', error);
        throw new Error(`Failed to cancel connection request: ${error.message}`);
      }

      console.log('Connection request cancelled');
    } catch (error) {
      console.error('Cancel connection request failed:', error);
      throw error;
    }
  }

  // Respond to connection request
  async respondToConnectionRequest(connectionId: string, response: 'accepted' | 'declined' | 'blocked'): Promise<void> {
    try {
      console.log('Responding to connection request:', { connectionId, response });
      
      const { error } = await supabase
        .rpc('respond_to_connection_request', {
          connection_id_param: connectionId,
          response_param: response,
        });

      if (error) {
        console.error('Error responding to connection request:', error);
        throw new Error(`Failed to respond to connection request: ${error.message}`);
      }

      console.log('Connection request response sent');
    } catch (error) {
      console.error('Respond to connection request failed:', error);
      throw error;
    }
  }

  // Get user connections
  async getUserConnections(statusFilter?: string): Promise<UserConnection[]> {
    try {
      console.log('Fetching user connections:', { statusFilter });
      
      const { data, error } = await supabase
        .rpc('get_user_connections', {
          status_filter: statusFilter,
        });

      if (error) {
        console.error('Error fetching connections:', error);
        throw new Error(`Failed to fetch connections: ${error.message}`);
      }

      console.log('User connections:', data?.length || 0, 'connections');

      return data?.map((conn: any) => ({
        id: conn.connection_id,
        otherUserId: conn.other_user_id,
        otherUserName: conn.other_user_name,
        otherUserPhoto: conn.other_user_photo,
        connectionType: conn.connection_type,
        status: conn.status,
        isRequester: conn.is_requester,
        createdAt: conn.created_at,
        updatedAt: conn.updated_at,
      })) || [];
    } catch (error) {
      console.error('Get connections failed:', error);
      throw error;
    }
  }

  // Get connection status between current user and another user
  async getConnectionStatus(otherUserId: string): Promise<{ status: string; connectionType: string; isRequester: boolean } | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .rpc('get_connection_status', {
          user1_id: user.user.id,
          user2_id: otherUserId,
        });

      if (error) {
        console.error('Error getting connection status:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Get connection status failed:', error);
      return null;
    }
  }

  // Update user presence
  async updateUserPresence(status: 'online' | 'away' | 'busy' | 'offline', roomId?: string): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('update_user_presence', {
          status_param: status,
          room_id_param: roomId,
        });

      if (error) {
        console.error('Error updating presence:', error);
        throw new Error(`Failed to update presence: ${error.message}`);
      }
    } catch (error) {
      console.error('Update presence failed:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(roomId: string): Promise<void> {
    try {
      console.log('Marking messages as read for room:', roomId);
      
      const { error } = await supabase
        .rpc('mark_messages_as_read', {
          room_id_param: roomId,
        });

      if (error) {
        console.error('Error marking messages as read:', error);
        throw new Error(`Failed to mark messages as read: ${error.message}`);
      }

      console.log('Messages marked as read');
    } catch (error) {
      console.error('Mark messages as read failed:', error);
      throw error;
    }
  }

  // Check if user can message another user (are they connected?)
  async canMessageUser(otherUserId: string): Promise<boolean> {
    try {
      const connectionStatus = await this.getConnectionStatus(otherUserId);
      return connectionStatus?.status === 'accepted';
    } catch (error) {
      console.error('Error checking if user can message:', error);
      return false;
    }
  }

  // Get or create DM room (only if users are connected)
  async getOrCreateDMRoom(otherUserId: string): Promise<string> {
    try {
      // First check if users are connected
      const canMessage = await this.canMessageUser(otherUserId);
      if (!canMessage) {
        throw new Error('You must be connected with this user to send messages. Please send a connection request first.');
      }

      // Create or get existing DM room
      return await this.createDirectMessageRoom(otherUserId);
    } catch (error) {
      console.error('Error getting/creating DM room:', error);
      throw error;
    }
  }

  // Debug function to check room access
  async debugRoomAccess(roomId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('debug_room_access', { room_id_param: roomId });

      if (error) {
        console.error('Debug room access error:', error);
        return null;
      }

      console.log('Room access debug info:', data);
      return data;
    } catch (error) {
      console.error('Debug room access failed:', error);
      return null;
    }
  }

  // Subscribe to real-time updates for a room
  subscribeToRoom(roomId: string, callbacks: {
    onMessage?: (message: ChatMessage) => void;
    onPresenceUpdate?: (presence: UserPresence) => void;
    onTyping?: (userId: string, isTyping: boolean) => void;
  }): () => void {
    const channelName = `room:${roomId}`;
    
    console.log('Subscribing to room:', roomId);
    
    // Remove existing channel if it exists
    if (this.realtimeChannels.has(channelName)) {
      this.realtimeChannels.get(channelName)?.unsubscribe();
      this.realtimeChannels.delete(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          console.log('New message received:', payload);
          
          if (callbacks.onMessage) {
            // Fetch the complete message with sender info
            try {
              const { data } = await supabase
                .rpc('get_room_messages', {
                  room_id_param: roomId,
                  limit_count: 1,
                  offset_count: 0,
                });

              if (data && data.length > 0) {
                const msg = data[0];
                const newMessage: ChatMessage = {
                  id: msg.message_id,
                  room_id: msg.room_id,
                  content: msg.content,
                  message_type: msg.message_type,
                  sender_id: msg.sender_id,
                  sender_name: msg.sender_name,
                  sender_photo: msg.sender_photo,
                  reply_to: msg.reply_to,
                  reply_content: msg.reply_content,
                  metadata: msg.metadata,
                  created_at: msg.created_at,
                  edited_at: msg.edited_at,
                };
                callbacks.onMessage(newMessage);
              }
            } catch (error) {
              console.error('Error fetching new message details:', error);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
        },
        (payload) => {
          console.log('Presence update:', payload);
          
          if (callbacks.onPresenceUpdate && payload.new && typeof payload.new === 'object' && 'user_id' in payload.new) {
            callbacks.onPresenceUpdate({
              userId: payload.new.user_id,
              status: payload.new.status,
              lastSeen: payload.new.last_seen,
              currentRoomId: payload.new.current_room_id,
            });
          }
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        console.log('Typing indicator:', payload);
        
        if (callbacks.onTyping) {
          callbacks.onTyping(payload.payload.userId, payload.payload.isTyping);
        }
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    this.realtimeChannels.set(channelName, channel);

    // Return unsubscribe function
    return () => {
      console.log('Unsubscribing from room:', roomId);
      channel.unsubscribe();
      this.realtimeChannels.delete(channelName);
    };
  }

  // Send typing indicator
  async sendTypingIndicator(roomId: string, isTyping: boolean): Promise<void> {
    const channelName = `room:${roomId}`;
    const channel = this.realtimeChannels.get(channelName);
    
    if (channel) {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          await channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: {
              userId: user.user.id,
              isTyping,
            },
          });
        }
      } catch (error) {
        console.error('Error sending typing indicator:', error);
      }
    }
  }

  // Cleanup all subscriptions
  cleanup(): void {
    console.log('Cleaning up chat service subscriptions');
    this.realtimeChannels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.realtimeChannels.clear();
  }
}

export const chatService = new ChatService();