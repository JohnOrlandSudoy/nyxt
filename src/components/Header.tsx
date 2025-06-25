import { memo } from "react";
import { Button } from "./ui/button";
import { Settings, Check, LogOut, UserCircle, MessageCircle, Menu, X } from "lucide-react";
import { useAtom } from "jotai";
import { screenAtom } from "@/store/screens";
import { conversationAtom } from "@/store/conversation";
import { settingsSavedAtom } from "@/store/settings";
import { profileSavedAtom } from "@/store/profile";
import { useAuthContext } from "./AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { profileService } from "@/services/profileService";

const DEFAULT_AVATAR = '/public/images/robot.svg';

// Enhanced NyxtGen Logo Component with responsive design
const NyxtGenLogo = ({ className = "", isMobile = false }: { className?: string; isMobile?: boolean }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Premium Logo Icon */}
      <div className="relative">
        {/* Outer glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/30 to-purple-500/30 blur-lg animate-pulse" />
        
        {/* Main logo container */}
        <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}`}>
          {/* Inner gradient overlay */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/20 via-transparent to-purple-500/20" />
          
          {/* Logo symbol - stylized "N" */}
          <div className="relative z-10">
            <svg 
              width={isMobile ? "20" : "24"} 
              height={isMobile ? "20" : "24"} 
              viewBox="0 0 24 24" 
              fill="none" 
              className="drop-shadow-lg"
            >
              {/* Gradient definitions */}
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <linearGradient id="logoGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f0f9ff" />
                  <stop offset="100%" stopColor="#e0e7ff" />
                </linearGradient>
              </defs>
              
              {/* Stylized "N" with modern geometric design */}
              <path 
                d="M4 20V4h3l8 12V4h3v16h-3L7 8v12H4z" 
                fill="url(#logoGradient)"
                className="drop-shadow-sm"
              />
              
              {/* Accent dot for premium feel */}
              <circle 
                cx="19" 
                cy="5" 
                r="2" 
                fill="url(#logoGradient2)"
                className="animate-pulse"
              />
            </svg>
          </div>
          
          {/* Subtle inner border */}
          <div className="absolute inset-0 rounded-xl border border-white/10" />
        </div>
      </div>
      
      {/* Logo Text - Hide on very small screens */}
      {!isMobile && (
        <div className="flex flex-col">
          <h1 
            className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent tracking-tight leading-none"
            style={{ 
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              letterSpacing: '-0.02em'
            }}
          >
            NyxtGen
          </h1>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="w-8 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full opacity-60" />
            <span 
              className="text-xs text-slate-400 font-medium tracking-wide uppercase"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px' }}
            >
              AI Platform
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Mobile Menu Component
const MobileMenu = ({ 
  isOpen, 
  onClose, 
  user, 
  onSignOut, 
  onSettings, 
  onProfile, 
  onChat,
  settingsSaved,
  profileSaved,
  profilePhoto
}: {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSignOut: () => void;
  onSettings: () => void;
  onProfile: () => void;
  onChat: () => void;
  settingsSaved: boolean;
  profileSaved: boolean;
  profilePhoto?: string;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Menu Panel */}
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-80 bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-l border-slate-700/50 shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Menu</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="size-5" />
                </Button>
              </div>
            </div>

            {/* User Info */}
            {user && (
              <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center justify-center overflow-hidden">
                    <img
                      src={profilePhoto || DEFAULT_AVATAR}
                      alt="User avatar"
                      className="w-full h-full object-cover rounded-full"
                      onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{user.email}</p>
                    <p className="text-emerald-300 text-xs">Authenticated</p>
                  </div>
                </div>
              </div>
            )}

            {/* Menu Items */}
            <div className="p-6 space-y-4">
              {/* Chat */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { onChat(); onClose(); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <MessageCircle className="size-5 text-cyan-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">Chat</p>
                  <p className="text-slate-400 text-sm">Collaborate with others</p>
                </div>
              </motion.button>

              {/* Profile */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { onProfile(); onClose(); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 transition-all duration-200 relative"
              >
                {profileSaved && (
                  <div className="absolute top-2 right-2 rounded-full bg-emerald-500 p-1">
                    <Check className="size-3 text-white" />
                  </div>
                )}
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <UserCircle className="size-5 text-purple-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">Profile</p>
                  <p className="text-slate-400 text-sm">Manage your profile</p>
                </div>
              </motion.button>

              {/* Settings */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { onSettings(); onClose(); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 transition-all duration-200 relative"
              >
                {settingsSaved && (
                  <div className="absolute top-2 right-2 rounded-full bg-emerald-500 p-1">
                    <Check className="size-3 text-white" />
                  </div>
                )}
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Settings className="size-5 text-cyan-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">Settings</p>
                  <p className="text-slate-400 text-sm">Configure your experience</p>
                </div>
              </motion.button>

              {/* Sign Out */}
              {user && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { onSignOut(); onClose(); }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all duration-200 border border-red-500/30"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <LogOut className="size-5 text-red-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-red-300 font-medium">Sign Out</p>
                    <p className="text-red-400/70 text-sm">End your session</p>
                  </div>
                </motion.button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Premium User Info Component for Desktop Header
const HeaderUserInfo = ({ user, onSignOut, profilePhoto }: { user: any; onSignOut: () => void; profilePhoto?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="hidden lg:flex items-center gap-3"
    >
      {/* User Avatar and Info */}
      <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center justify-center overflow-hidden">
          <img
            src={profilePhoto || DEFAULT_AVATAR}
            alt="User avatar"
            className="w-full h-full object-cover rounded-full"
            onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR; }}
          />
        </div>
        <div className="hidden xl:block">
          <p className="text-white font-medium text-sm leading-none">{user.email}</p>
          <p className="text-emerald-300 text-xs mt-0.5">Authenticated</p>
        </div>
      </div>

      {/* Sign Out Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={onSignOut}
        className="relative size-10 border-red-500/30 bg-red-500/10 hover:bg-red-500/20 backdrop-blur-sm transition-all duration-200 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/20"
      >
        <LogOut className="size-4 text-red-300 hover:text-red-200 transition-colors" />
      </Button>
    </motion.div>
  );
};

export const Header = memo(() => {
  const [, setScreenState] = useAtom(screenAtom);
  const [conversation] = useAtom(conversationAtom);
  const [settingsSaved] = useAtom(settingsSavedAtom);
  const [profileSaved] = useAtom(profileSavedAtom);
  const { user, signOut } = useAuthContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(undefined);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch user profile photo
  useEffect(() => {
    let isMounted = true;
    async function fetchProfilePhoto() {
      if (user?.id) {
        try {
          const dbProfile = await profileService.getUserProfile(user.id);
          let photo: string | undefined = undefined;
          if (dbProfile) {
            const userProfile = profileService.convertToUserProfile(dbProfile);
            photo = userProfile.profilePhoto;
          }
          if (isMounted) setProfilePhoto(photo);
        } catch {
          if (isMounted) setProfilePhoto(undefined);
        }
      } else {
        setProfilePhoto(undefined);
      }
    }
    fetchProfilePhoto();
    return () => { isMounted = false; };
  }, [user]);

  const handleSettings = () => {
    if (!conversation) {
      setScreenState({ currentScreen: "settings" });
    }
  };

  const handleProfile = () => {
    if (!conversation) {
      setScreenState({ currentScreen: "profile" });
    }
  };

  const handleChat = () => {
    if (!conversation) {
      setScreenState({ currentScreen: "chat" });
    }
  };

  const handleSignOut = async () => {
    try {
      // Immediately redirect to home for instant feedback
      setScreenState({ currentScreen: "home" });
      
      // Then perform the actual sign out in the background
      await signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if sign out fails, we've already redirected to home
    }
  };

  return (
    <>
      <header className="flex w-full items-center justify-between p-4 lg:p-0" style={{ fontFamily: 'Inter, sans-serif' }}>
        <NyxtGenLogo isMobile={isMobile} />
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-4">
          {/* User Info (if authenticated) */}
          {user && <HeaderUserInfo user={user} onSignOut={handleSignOut} profilePhoto={profilePhoto} />}
          
          {/* Navigation Buttons */}
          <div className="flex items-center gap-3">
            {/* Chat Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleChat}
              className="relative size-10 border-slate-700/50 bg-slate-900/50 hover:bg-slate-800/70 backdrop-blur-sm transition-all duration-200 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20"
            >
              <MessageCircle className="size-4 text-slate-300 hover:text-cyan-400 transition-colors" />
            </Button>
            
            {/* Profile Button */}
            <div className="relative">
              {profileSaved && (
                <div className="absolute -top-2 -right-2 z-20 rounded-full bg-emerald-500 p-1 animate-fade-in shadow-lg shadow-emerald-500/50">
                  <Check className="size-3 text-white" />
                </div>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={handleProfile}
                className="relative size-10 border-slate-700/50 bg-slate-900/50 hover:bg-slate-800/70 backdrop-blur-sm transition-all duration-200 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20"
              >
                <UserCircle className="size-4 text-slate-300 hover:text-purple-400 transition-colors" />
              </Button>
            </div>
            
            {/* Settings Button */}
            <div className="relative">
              {settingsSaved && (
                <div className="absolute -top-2 -right-2 z-20 rounded-full bg-emerald-500 p-1 animate-fade-in shadow-lg shadow-emerald-500/50">
                  <Check className="size-3 text-white" />
                </div>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={handleSettings}
                className="relative size-10 border-slate-700/50 bg-slate-900/50 hover:bg-slate-800/70 backdrop-blur-sm transition-all duration-200 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20"
              >
                <Settings className="size-4 text-slate-300 hover:text-cyan-400 transition-colors" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
            className="relative size-10 border-slate-700/50 bg-slate-900/50 hover:bg-slate-800/70 backdrop-blur-sm transition-all duration-200"
          >
            <Menu className="size-5 text-slate-300" />
          </Button>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        onSignOut={handleSignOut}
        onSettings={handleSettings}
        onProfile={handleProfile}
        onChat={handleChat}
        settingsSaved={settingsSaved}
        profileSaved={profileSaved}
        profilePhoto={profilePhoto}
      />
    </>
  );
});