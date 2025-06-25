import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/AuthProvider';
import { profileService, ProfileWithInterests } from '@/services/profileService';
import { UserProfile } from '@/store/profile';

interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  hasProfile: boolean;
  loadProfile: () => Promise<void>;
  saveProfile: (profileData: UserProfile) => Promise<void>;
  deleteProfile: () => Promise<void>;
}

export const useProfile = (): UseProfileReturn => {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

  const loadProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const profileData = await profileService.getUserProfile(user.id);
      
      if (profileData) {
        const userProfile = profileService.convertToUserProfile(profileData);
        setProfile(userProfile);
        setHasProfile(true);
      } else {
        setProfile(null);
        setHasProfile(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
      console.error('Load profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (profileData: UserProfile) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      // Add user email to profile data
      const profileWithEmail = {
        ...profileData,
        email: user.email || profileData.email,
      };

      await profileService.saveCompleteProfile(user.id, profileWithEmail);
      
      // Reload profile to get updated data
      await loadProfile();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save profile';
      setError(errorMessage);
      console.error('Save profile error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProfile = async () => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      await profileService.deleteUserProfile(user.id);
      setProfile(null);
      setHasProfile(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete profile';
      setError(errorMessage);
      console.error('Delete profile error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Load profile when user changes
  useEffect(() => {
    if (user?.id) {
      loadProfile();
    } else {
      setProfile(null);
      setHasProfile(false);
    }
  }, [user?.id]);

  return {
    profile,
    loading,
    error,
    hasProfile,
    loadProfile,
    saveProfile,
    deleteProfile,
  };
};