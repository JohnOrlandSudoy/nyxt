import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { screenAtom } from "@/store/screens";
import { Unlock, Key, Shield, Sparkles, ArrowRight, Eye, EyeOff } from "lucide-react";
import AudioButton from "@/components/AudioButton";
import { apiTokenAtom } from "@/store/tokens";
import { motion } from "framer-motion";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import gloriaVideo from "@/assets/video/gloria.mp4";

// Premium NyxtGen Logo Component
const PremiumLogo = ({ isMobile = false }: { isMobile?: boolean }) => {
  return (
    <div className="flex items-center gap-3 mb-4">
      {/* Premium Logo Icon */}
      <div className="relative">
        {/* Outer glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/40 to-purple-500/40 blur-lg animate-pulse" />
        
        {/* Main logo container */}
        <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}`}>
          {/* Inner gradient overlay */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/20 via-transparent to-purple-500/20" />
          
          {/* Logo symbol */}
          <div className="relative z-10">
            <svg 
              width={isMobile ? "20" : "24"} 
              height={isMobile ? "20" : "24"} 
              viewBox="0 0 24 24" 
              fill="none" 
              className="drop-shadow-lg"
            >
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
              
              <path 
                d="M4 20V4h3l8 12V4h3v16h-3L7 8v12H4z" 
                fill="url(#logoGradient)"
                className="drop-shadow-sm"
              />
              
              <circle 
                cx="19" 
                cy="5" 
                r="2" 
                fill="url(#logoGradient2)"
                className="animate-pulse"
              />
            </svg>
          </div>
          
          <div className="absolute inset-0 rounded-xl border border-white/10" />
        </div>
      </div>
      
      {/* Logo Text */}
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
          <div className="flex items-center gap-2 mt-1">
            <div className="w-8 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full opacity-70" />
            <span 
              className="text-xs text-slate-300 font-medium tracking-wide uppercase"
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

// Premium Input Component
const PremiumInput = ({ 
  value, 
  onChange, 
  placeholder, 
  type = "text",
  icon,
  showToggle = false,
  onToggle,
  isMobile = false
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: string;
  icon?: React.ReactNode;
  showToggle?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
}) => {
  return (
    <div className="relative group">
      {/* Input field */}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400 transition-colors z-10">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${isMobile ? 'h-12 text-base' : 'h-12'} px-4 pl-12 pr-12 rounded-2xl bg-slate-900/50 border border-slate-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 backdrop-blur-sm transition-all duration-200 font-mono text-sm`}
          style={{ fontFamily: "'Source Code Pro', monospace" }}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors z-10"
          >
            {type === "password" ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </button>
        )}
      </div>
      
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm -z-10" />
    </div>
  );
};

export const Intro: React.FC = () => {
  const [, setScreenState] = useAtom(screenAtom);
  const [token, setToken] = useAtom(apiTokenAtom);
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Enforce authentication for this screen with optimized loading
  const { isAuthenticated, isLoading } = useAuthGuard({
    showAuthModal: true,
    redirectTo: "auth"
  });

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleClick = () => {
    if (!isAuthenticated) {
      setScreenState({ currentScreen: "auth" });
      return;
    }
    
    if (!token) {
      // Show error message or focus on token input
      return;
    }
    
    setScreenState({ currentScreen: "instructions" });
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newToken = e.target.value;
    setToken(newToken);
    localStorage.setItem('tavus-token', newToken);
  };

  // Show minimal loading only for initial authentication check
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, this will be handled by useAuthGuard
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex size-full flex-col items-center justify-center relative min-h-0 overflow-hidden">
      {/* Enhanced Video Background */}
      <video
        src={gloriaVideo}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
      
      {/* Multi-layered overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-slate-900/70" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_70%)]" />

      {/* Premium Card Container - Responsive */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`relative z-10 w-full mx-4 flex items-center justify-center min-h-0 ${isMobile ? 'max-w-sm' : 'max-w-md'}`}
        style={{ maxHeight: 'calc(100vh - 100px)' }}
      >
        {/* Main Card */}
        <div className={`relative rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 shadow-2xl w-full max-h-full overflow-y-auto ${isMobile ? 'p-4' : 'p-6'}`}>
          
          {/* Animated background gradient */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 animate-pulse" />
          
          {/* Premium border glow */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-transparent to-purple-500/20 blur-xl opacity-50" />
          
          {/* Content */}
          <div className={`relative z-10 space-y-4 ${isMobile ? 'space-y-4' : 'space-y-5'}`}>
            
            {/* Logo and Title */}
            <div className="text-center">
              <PremiumLogo isMobile={isMobile} />
              
              <div className="space-y-2">
                <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-white`}>
                  Ready to Begin
                </h2>
                <p className={`text-slate-400 ${isMobile ? 'text-xs' : 'text-sm'} leading-relaxed`}>
                  Enter your API key to unlock premium AI conversations
                </p>
              </div>
            </div>

            {/* API Key Input Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-slate-300`}>
                  <Key className="size-4 text-cyan-400" />
                  Tavus API Key
                  <span className="text-red-400">*</span>
                </label>
                
                <PremiumInput
                  value={token || ""}
                  onChange={handleTokenChange}
                  placeholder="Enter your API key (required)"
                  type={showPassword ? "text" : "password"}
                  icon={<Shield className="size-4" />}
                  showToggle={true}
                  onToggle={() => setShowPassword(!showPassword)}
                  isMobile={isMobile}
                />
              </div>

              {/* Help Text */}
              <div className={`flex ${isMobile ? 'flex-col gap-1' : 'items-center justify-center gap-2'} ${isMobile ? 'text-xs' : 'text-sm'}`}>
                <span className="text-slate-500">Don't have a key?</span>
                <a
                  href="https://platform.tavus.io/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline transition-colors flex items-center gap-1"
                >
                  Create account
                  <ArrowRight className="size-3" />
                </a>
              </div>
            </div>

            {/* Premium CTA Button */}
            <div className="pt-2">
              <AudioButton 
                onClick={handleClick}
                disabled={!token}
                className={`group relative w-full ${isMobile ? 'h-12 text-base' : 'h-12'} rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40 disabled:shadow-none transition-all duration-300 hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed border-0 overflow-hidden`}
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Content */}
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <Unlock className={`${isMobile ? 'size-4' : 'size-5'}`} />
                  {token ? "Start AI Experience" : "Enter API Key Required"}
                  <Sparkles className={`${isMobile ? 'size-3' : 'size-4'} group-hover:animate-spin`} />
                </span>
                
                {/* Shine effect */}
                <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </AudioButton>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 ${isMobile ? 'text-xs' : ''}`}>
                <Shield className="size-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Authenticated & Secure</span>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse opacity-60" />
          <div className="absolute bottom-4 left-4 w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-40" />
        </div>

        {/* Floating particles around card */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(isMobile ? 3 : 6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
              style={{
                left: `${10 + (i * 15)}%`,
                top: `${20 + (i * 10)}%`,
              }}
              animate={{
                y: [-10, 10, -10],
                opacity: [0.3, 0.8, 0.3],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3 + (i * 0.5),
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Intro;