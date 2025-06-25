import { createConversation } from "@/api";
import {
  DialogWrapper,
  AnimatedTextBlockWrapper,
} from "@/components/DialogWrapper";
import { screenAtom } from "@/store/screens";
import { conversationAtom } from "@/store/conversation";
import React, { useMemo, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { Mic, Video, Play, Shield, Zap, Brain, Eye, Sparkles, CheckCircle, Lock, X } from "lucide-react";
import { useDevices } from "@daily-co/daily-react";
import { ConversationError } from "./ConversationError";
import zoomSound from "@/assets/sounds/zoom.mp3";
import { Button } from "@/components/ui/button";
import { apiTokenAtom } from "@/store/tokens";
import { quantum } from 'ldrs';
import gloriaVideo from "@/assets/video/gloria.mp4";
import { motion } from "framer-motion";
import { useAuthGuard } from "@/hooks/useAuthGuard";

// Register the quantum loader
quantum.register();

// Premium Feature Badge Component
const FeatureBadge = ({ 
  icon: Icon, 
  text, 
  variant = "default",
  delay = 0 
}: { 
  icon: any; 
  text: string; 
  variant?: "default" | "required" | "secure";
  delay?: number;
}) => {
  const variants = {
    default: "bg-white/5 border-white/20 text-white/80",
    required: "bg-red-500/10 border-red-500/30 text-red-300",
    secure: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm ${variants[variant]}`}
    >
      <Icon className="size-5 flex-shrink-0" />
      <span className="text-sm font-medium">{text}</span>
    </motion.div>
  );
};

// Premium Loading Component
const PremiumLoader = ({ message = "Initializing..." }: { message?: string }) => {
  return (
    <DialogWrapper>
      <div className="absolute inset-0 z-0">
        <video
          src={gloriaVideo}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-cyan-900/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.15),transparent_70%)]" />
      </div>
      
      <AnimatedTextBlockWrapper>
        <div className="flex flex-col items-center justify-center gap-8">
          {/* Premium loader */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/30 to-purple-500/30 blur-xl animate-pulse" />
            <l-quantum
              size="60"
              speed="1.75"
              color="#06b6d4"
            ></l-quantum>
          </div>
          
          {/* Loading message */}
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold text-white">{message}</h3>
            <p className="text-cyan-300 text-sm font-medium">Preparing your AI experience...</p>
          </div>
          
          {/* Progress indicators */}
          <div className="flex items-center gap-2">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-cyan-400 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </div>
      </AnimatedTextBlockWrapper>
    </DialogWrapper>
  );
};

const useCreateConversationMutation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setScreenState] = useAtom(screenAtom);
  const [, setConversation] = useAtom(conversationAtom);
  const token = useAtomValue(apiTokenAtom);

  const createConversationRequest = async () => {
    try {
      if (!token) {
        throw new Error("Token is required");
      }
      const conversation = await createConversation(token);
      setConversation(conversation);
      setScreenState({ currentScreen: "conversation" });
    } catch (error) {
      setError(error as string);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    createConversationRequest,
  };
};

export default function Instructions() {
  const { currentMic } = useDevices();
  const { createConversationRequest } = useCreateConversationMutation();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [error, setError] = useState(false);
  const audio = useMemo(() => {
    const audioObj = new Audio(zoomSound);
    audioObj.volume = 0.7;
    return audioObj;
  }, []);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [, setScreenState] = useAtom(screenAtom);

  // Enforce authentication for this screen
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard({
    showAuthModal: true,
    redirectTo: "auth"
  });

  const handleClick = async () => {
    // Double-check authentication before proceeding
    if (!isAuthenticated) {
      return;
    }

    try {
      setIsLoading(true);
      setIsPlayingSound(true);
      
      audio.currentTime = 0;
      await audio.play();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsPlayingSound(false);
      setIsLoadingConversation(true);
      
      let micDeviceId = currentMic?.device?.deviceId;
      if (micDeviceId) {
        await createConversationRequest();
      } else {
        setError(true);
      }
    } catch (error) {
      console.error(error);
      setError(true);
    } finally {
      setIsLoading(false);
      setIsLoadingConversation(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return <PremiumLoader message="Verifying access..." />;
  }

  // If not authenticated, this will be handled by useAuthGuard
  if (!isAuthenticated) {
    return null;
  }

  if (isPlayingSound) {
    return <PremiumLoader message="Launching Experience..." />;
  }

  if (isLoadingConversation) {
    return <PremiumLoader message="Connecting to AI..." />;
  }

  if (error) {
    return <ConversationError onClick={handleClick} />;
  }

  // Premium modal layout
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
      <div className="relative w-full max-w-3xl bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 border border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => setScreenState({ currentScreen: "intro" })}
          className="absolute top-5 right-5 z-20 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-200"
          aria-label="Close instructions"
        >
          <X className="size-6" />
        </button>
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            src={gloriaVideo}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-cyan-900/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.15),transparent_70%)]" />
        </div>
        {/* Main Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 md:p-12 space-y-8">
          {/* Header */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative mx-auto w-20 h-20 mb-2">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/30 to-purple-500/30 blur-2xl animate-pulse" />
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/20 via-transparent to-purple-500/20" />
                <Eye className="size-10 text-cyan-400 relative z-10 drop-shadow-lg" />
                <div className="absolute inset-0 rounded-full border border-white/10" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white text-center leading-tight">
              <span>See AI?</span> <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">Act Natural.</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 text-center max-w-2xl mx-auto font-light">
              Experience face-to-face conversations with AI so advanced, it feels genuinely human—an intelligent agent ready to listen, respond, and engage across countless scenarios.
            </p>
          </div>
          {/* Auth Status */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm">
            <CheckCircle className="size-4 text-emerald-400" />
            <span className="text-emerald-300 text-sm font-medium">Authenticated & Ready</span>
          </div>
          {/* CTA Button */}
          <div className="w-full flex justify-center">
            <Button
              onClick={handleClick}
              disabled={isLoading}
              className="group relative overflow-hidden px-12 py-6 text-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-2xl shadow-2xl shadow-cyan-500/25 hover:shadow-3xl hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105 border border-cyan-400/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
                  <Play className="size-5 fill-current ml-0.5" />
                </div>
                Start Video Experience
                <Sparkles className="size-6 group-hover:animate-spin" />
              </span>
              <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Button>
          </div>
          {/* Requirements & Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mt-4">
            <FeatureBadge icon={Mic} text="Microphone access required" variant="required" delay={0.6} />
            <FeatureBadge icon={Video} text="Camera access required" variant="required" delay={0.7} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-4">
            <FeatureBadge icon={Brain} text="Advanced AI Intelligence" delay={0.8} />
            <FeatureBadge icon={Zap} text="Real-time Responses" delay={0.9} />
            <FeatureBadge icon={Shield} text="Secure & Private" variant="secure" delay={1.0} />
          </div>
          {/* Legal Notice */}
          <div className="text-center max-w-2xl mt-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Lock className="size-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Secure Experience</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              By starting a conversation, you accept our {" "}
              <a href="#" className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium transition-colors">Terms of Use</a> and acknowledge our {" "}
              <a href="#" className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium transition-colors">Privacy Policy</a>. Your conversations are encrypted and secure.
            </p>
          </div>
          {/* Premium Stats */}
          <div className="flex items-center justify-center gap-8 pt-8">
            <div className="text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{"<50ms"}</div>
              <div className="text-xs text-gray-500 font-medium">Latency</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">4K</div>
              <div className="text-xs text-gray-500 font-medium">Quality</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">24/7</div>
              <div className="text-xs text-gray-500 font-medium">Available</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const PositiveFeedback: React.FC = () => {
  return (
    <DialogWrapper>
      <AnimatedTextBlockWrapper>
        <div className="flex flex-col items-center justify-center gap-6 py-12">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/30 to-green-500/30 blur-2xl animate-pulse" />
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 shadow-2xl">
              <CheckCircle className="size-10 text-white" />
            </div>
          </div>
          
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
              Great Conversation!
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl">
              Thanks for the engaging discussion. Feel free to come back anytime for another chat!
            </p>
          </div>
        </div>
      </AnimatedTextBlockWrapper>
    </DialogWrapper>
  );
};