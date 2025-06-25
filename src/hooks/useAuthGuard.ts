import { useEffect } from 'react';
import { useAuthContext } from '@/components/AuthProvider';
import { useAtom } from 'jotai';
import { screenAtom } from '@/store/screens';

interface UseAuthGuardOptions {
  redirectTo?: string;
  showAuthModal?: boolean;
  onUnauthorized?: () => void;
}

export const useAuthGuard = (options: UseAuthGuardOptions = {}) => {
  const { 
    redirectTo = "auth", 
    showAuthModal = true,
    onUnauthorized 
  } = options;
  
  const { user, loading } = useAuthContext();
  const [, setScreenState] = useAtom(screenAtom);

  useEffect(() => {
    // Only redirect if we're not loading and there's no user
    // Add a small delay to prevent flashing during rapid auth state changes
    if (!loading && !user) {
      const timeoutId = setTimeout(() => {
        if (onUnauthorized) {
          onUnauthorized();
        } else if (showAuthModal) {
          setScreenState({ currentScreen: "auth" });
        } else {
          setScreenState({ currentScreen: redirectTo as any });
        }
      }, 100); // Small delay to prevent flashing

      return () => clearTimeout(timeoutId);
    }
  }, [user, loading, redirectTo, showAuthModal, onUnauthorized, setScreenState]);

  return {
    isAuthenticated: !!user,
    isLoading: loading,
    user
  };
};