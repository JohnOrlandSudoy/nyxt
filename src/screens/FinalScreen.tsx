import { DialogWrapper, AnimatedTextBlockWrapper } from "@/components/DialogWrapper";
import React from "react";
import { useAtom } from "jotai";
import { screenAtom } from "@/store/screens";
import { Button } from "@/components/ui/button";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export const FinalScreen: React.FC = () => {
  const [, setScreenState] = useAtom(screenAtom);

  // Enforce authentication for this screen
  const { isAuthenticated, isLoading } = useAuthGuard({
    showAuthModal: true,
    redirectTo: "auth"
  });

  const handleReturnToHome = () => {
    setScreenState({ currentScreen: "home" });
  };

  const handleReturnToIntro = () => {
    setScreenState({ currentScreen: "intro" });
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white text-lg">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, this will be handled by useAuthGuard
  if (!isAuthenticated) {
    return null;
  }

  return (
    <DialogWrapper>
      <AnimatedTextBlockWrapper>
        <div className="flex flex-col items-center justify-center gap-6 py-12">
          <h1 className="text-3xl font-bold text-white mb-4 text-center">Thank you for your conversation!</h1>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button
              onClick={handleReturnToHome}
              className="relative z-20 flex items-center justify-center gap-2 rounded-3xl border border-[rgba(255,255,255,0.3)] px-6 py-3 text-base text-white transition-all duration-200 hover:text-primary disabled:opacity-50"
              style={{
                height: '48px',
                transition: 'all 0.2s ease-in-out',
                backgroundColor: 'rgba(0,0,0,0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 15px rgba(34, 197, 254, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Return to Home
            </Button>
            <Button
              onClick={handleReturnToIntro}
              variant="outline"
              className="relative z-20 flex items-center justify-center gap-2 rounded-3xl border border-[rgba(255,255,255,0.3)] px-6 py-3 text-base text-white transition-all duration-200 hover:text-primary disabled:opacity-50"
              style={{
                height: '48px',
                transition: 'all 0.2s ease-in-out',
                backgroundColor: 'rgba(0,0,0,0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 15px rgba(34, 197, 254, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Start New Chat
            </Button>
          </div>
        </div>
      </AnimatedTextBlockWrapper>
    </DialogWrapper>
  );
};