import React from 'react';
import { useAuthContext } from './AuthProvider';
import { useAtom } from 'jotai';
import { screenAtom } from '@/store/screens';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallbackScreen?: string;
  showAuthModal?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallbackScreen = "home",
  showAuthModal = true 
}) => {
  const { user, loading } = useAuthContext();
  const [, setScreenState] = useAtom(screenAtom);

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to auth or fallback screen
  if (!user) {
    if (showAuthModal) {
      setScreenState({ currentScreen: "auth" });
    } else {
      setScreenState({ currentScreen: fallbackScreen as any });
    }
    return null;
  }

  // User is authenticated, render children
  return <>{children}</>;
};

// Higher-order component for protecting screens
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallbackScreen?: string;
    showAuthModal?: boolean;
  }
) => {
  return (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );
};