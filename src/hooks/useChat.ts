import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/components/AuthProvider';
import { chatService, ChatRoom, ChatMessage, UserForCollaboration } from '@/services/chatService';

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
      await chatService.updateUserPresence('online', roomId);
    } else {
      await chatService.updateUserPresence('online');
    }
  }, [loadMessages]);

  // Send message
  const sendMessage = useCallback(async (
    content: string,
    messageType: 'text' | 'image' | 'file' | 'code' = 'text',
    replyTo?: string
  ) => {
    if (!currentRoomId || !content.trim()) return;

    try {
      await chatService.sendMessage(currentRoomId, content.trim(), messageType, replyTo);
      // Message will be added via real-time subscription
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }, [currentRoomId]);

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

  // Set up real-time subscriptions for current room
  useEffect(() => {
    if (!currentRoomId) return;

    setIsConnected(false);

    const unsubscribe = chatService.subscribeToRoom(currentRoomId, {
      onMessage: (message) => {
        setCurrentRoomMessages(prev => [...prev, message]);
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