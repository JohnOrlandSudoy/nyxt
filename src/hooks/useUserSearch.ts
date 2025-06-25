import { useState, useCallback, useEffect } from 'react';
import { chatService, UserForCollaboration } from '@/services/chatService';

interface UseUserSearchReturn {
  users: UserForCollaboration[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchUsers: (term?: string) => Promise<void>;
  sendConnectionRequest: (userId: string, type?: 'friend' | 'follow' | 'collaborate') => Promise<void>;
  createDirectMessage: (userId: string) => Promise<string>;
}

export const useUserSearch = (): UseUserSearchReturn => {
  const [users, setUsers] = useState<UserForCollaboration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Search users
  const searchUsers = useCallback(async (term?: string) => {
    const searchQuery = term !== undefined ? term : searchTerm;
    
    setLoading(true);
    setError(null);

    try {
      const results = await chatService.searchUsersForCollaboration(searchQuery);
      setUsers(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search users';
      setError(errorMessage);
      console.error('Search users error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // Send connection request
  const sendConnectionRequest = useCallback(async (
    userId: string,
    type: 'friend' | 'follow' | 'collaborate' = 'friend'
  ) => {
    try {
      await chatService.sendConnectionRequest(userId, type);
      
      // Update the user's connection status in the local state
      setUsers(prev => prev.map(user => 
        user.userId === userId 
          ? { ...user, connectionStatus: 'pending' }
          : user
      ));
    } catch (error) {
      console.error('Send connection request error:', error);
      throw error;
    }
  }, []);

  // Create direct message
  const createDirectMessage = useCallback(async (userId: string): Promise<string> => {
    try {
      return await chatService.createDirectMessageRoom(userId);
    } catch (error) {
      console.error('Create DM error:', error);
      throw error;
    }
  }, []);

  // Auto-search when component mounts (to show all users initially)
  useEffect(() => {
    searchUsers('');
  }, []);

  // Debounced search when search term changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        searchUsers(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchUsers]);

  return {
    users,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    searchUsers,
    sendConnectionRequest,
    createDirectMessage,
  };
};