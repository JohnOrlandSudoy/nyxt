import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/components/AuthProvider';
import { chatService, ChatRoom, ChatMessage } from '@/services/chatService';
import { v4 as uuidv4 } from 'uuid';
import { useProfile } from './useProfile';

interface UseChatReturn {
  // Chat rooms
  chatRooms: ChatRoom[];
  loadingRooms: boolean;
  errorRooms: string | null;
  loadChatRooms: () => Promise<void>;
  
  // Current room
  currentRoomId: string | null;
  currentRoomMessages: ChatMessage[];
  loadingMessages: boolean;
  errorMessages: string | null;
  
  // Actions
  setCurrentRoom: (roomId: string | null) => void;
  sendMessage: (content: string, messageType?: 'text' | 'image' | 'file' | 'code', replyTo?: string) => Promise<void>;
  createDirectMessage: (userId: string) => Promise<string>;
  createGroupChat: (name: string, description?: string, isPrivate?: boolean) => Promise<string>;
  markAsRead: () => Promise<void>;
  
  // Real-time
  isConnected: boolean;
  typingUsers: string[];
  sendTyping: (isTyping: boolean) => void;
}

export const useChat = (): UseChatReturn => {
  const { user } = useAuthContext();
  const { profile } = useProfile();
  
  // State
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [errorRooms, setErrorRooms] = useState<string | null>(null);
  
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [currentRoomMessages, setCurrentRoomMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Load chat rooms
  const loadChatRooms = useCallback(async () => {
    if (!user) return;

    setLoadingRooms(true);
    setErrorRooms(null);

    try {
      const rooms = await chatService.getUserChatRooms();
      setChatRooms(rooms);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load chat rooms';
      setErrorRooms(errorMessage);
      console.error('Load chat rooms error:', error);
    } finally {
      setLoadingRooms(false);
    }
  }, [user]);

  // Load messages for current room
  const loadMessages = useCallback(async (roomId: string) => {
    setLoadingMessages(true);
    setErrorMessages(null);

    try {
      const messages = await chatService.getRoomMessages(roomId);
      setCurrentRoomMessages(messages);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load messages';
      setErrorMessages(errorMessage);
      console.error('Load messages error:', error);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Set current room and load messages
  const setCurrentRoom = useCallback(async (roomId: string | null) => {
    setCurrentRoomId(roomId);
    setCurrentRoomMessages([]);
    
    if (roomId) {
      await loadMessages(roomId);
      await chatService.markMessagesAsRead(roomId);
      await loadChatRooms();
      await chatService.updateUserPresence('online', roomId);
    } else {
      await chatService.updateUserPresence('online');
    }
  }, [loadMessages, loadChatRooms]);

  // Send message with optimistic update
  const sendMessage = useCallback(async (
    content: string,
    messageType: 'text' | 'image' | 'file' | 'code' = 'text',
    replyTo?: string
  ) => {
    if (!currentRoomId || !content.trim() || !user) return;

    const optimisticId = uuidv4();
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      room_id: currentRoomId,
      sender_id: user.id,
      sender_name: profile?.fullName || user.email || 'Me',
      sender_photo: profile?.profilePhoto || '',
      content: content.trim(),
      message_type: messageType,
      created_at: new Date().toISOString(),
      status: 'sending',
    };

    // Optimistically add to UI
    setCurrentRoomMessages(prev => [...prev, optimisticMessage]);

    try {
      await chatService.sendMessage(currentRoomId, content.trim(), messageType, replyTo, optimisticId);
      // The real-time subscription will update the message status to 'sent'
    } catch (error) {
      console.error('Send message error:', error);
      // Update message status to 'failed'
      setCurrentRoomMessages(prev =>
        prev.map(msg =>
          msg.id === optimisticId ? { ...msg, status: 'failed' } : msg
        )
      );
      throw error;
    }
  }, [currentRoomId, user, profile]);

  // Create direct message
  const createDirectMessage = useCallback(async (userId: string): Promise<string> => {
    try {
      const roomId = await chatService.createDirectMessageRoom(userId);
      await loadChatRooms(); // Refresh rooms list
      return roomId;
    } catch (error) {
      console.error('Create DM error:', error);
      throw error;
    }
  }, [loadChatRooms]);

  // Create group chat
  const createGroupChat = useCallback(async (
    name: string,
    description?: string,
    isPrivate: boolean = true
  ): Promise<string> => {
    try {
      const roomId = await chatService.createGroupChatRoom(name, description, isPrivate);
      await loadChatRooms(); // Refresh rooms list
      return roomId;
    } catch (error) {
      console.error('Create group chat error:', error);
      throw error;
    }
  }, [loadChatRooms]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!currentRoomId) return;

    try {
      await chatService.markMessagesAsRead(currentRoomId);
      await loadChatRooms(); // Refresh to update unread counts
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  }, [currentRoomId, loadChatRooms]);

  // Send typing indicator
  const sendTyping = useCallback((isTyping: boolean) => {
    if (currentRoomId) {
      chatService.sendTypingIndicator(currentRoomId, isTyping);
    }
  }, [currentRoomId]);

  // Set up real-time subscriptions with duplicate check
  useEffect(() => {
    if (!currentRoomId) return;

    setIsConnected(false);

    const unsubscribe = chatService.subscribeToRoom(currentRoomId, {
      onMessage: (message) => {
        setCurrentRoomMessages(prev => {
          // If message is an update to an optimistic one
          if (prev.some(m => m.id === message.id && m.status === 'sending')) {
            return prev.map(m => m.id === message.id ? message : m);
          }
          // If message is new
          if (!prev.some(m => m.id === message.id)) {
            return [...prev, message];
          }
          // Already exists, do nothing
          return prev;
        });
        setIsConnected(true);
      },
      onTyping: (userId, isTyping) => {
        if (userId === user?.id) return; // Ignore own typing

        setTypingUsers(prev => {
          if (isTyping) {
            return prev.includes(userId) ? prev : [...prev, userId];
          } else {
            return prev.filter(id => id !== userId);
          }
        });
      },
    });

    // Set connected after a short delay
    const connectTimer = setTimeout(() => setIsConnected(true), 1000);

    return () => {
      clearTimeout(connectTimer);
      unsubscribe();
      setIsConnected(false);
      setTypingUsers([]);
    };
  }, [currentRoomId, user?.id]);

  // Load chat rooms on mount
  useEffect(() => {
    if (user) {
      loadChatRooms();
      chatService.updateUserPresence('online');
    }
  }, [user, loadChatRooms]);

  // Update presence to offline on unmount
  useEffect(() => {
    return () => {
      if (user) {
        chatService.updateUserPresence('offline');
        chatService.cleanup();
      }
    };
  }, [user]);

  return {
    // Chat rooms
    chatRooms,
    loadingRooms,
    errorRooms,
    loadChatRooms,
    
    // Current room
    currentRoomId,
    currentRoomMessages,
    loadingMessages,
    errorMessages,
    
    // Actions
    setCurrentRoom,
    sendMessage,
    createDirectMessage,
    createGroupChat,
    markAsRead,
    
    // Real-time
    isConnected,
    typingUsers,
    sendTyping,
  };
};