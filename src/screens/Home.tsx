import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { screenAtom } from "@/store/screens";
import { ArrowRight, Sparkles, Play, Zap, Brain, Video, MessageCircle, Star, Users, Shield, Globe } from "lucide-react";
import AudioButton from "@/components/AudioButton";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import gloriaVideo from "@/assets/video/gloria.mp4";

// Premium Feature Card Component
const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  delay = 0,
  isMobile = false
}: { 
  icon: any; 
  title: string; 
  description: string; 
  delay?: number;
  isMobile?: boolean;
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay }}
      className={`group relative rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-cyan-400/30 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 ${isMobile ? 'p-3' : 'p-4 sm:p-6'}`}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Icon container */}
      <div className="relative mb-3 sm:mb-4">
        <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'} rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`${isMobile ? 'size-4' : 'size-5 sm:size-6'} text-cyan-400 group-hover:text-cyan-300 transition-colors`} />
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <h3 className={`${isMobile ? 'text-sm' : 'text-sm sm:text-base lg:text-lg'} font-semibold text-white mb-2 group-hover:text-cyan-100 transition-colors leading-tight`}>
          {title}
        </h3>
        <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} leading-relaxed group-hover:text-gray-300 transition-colors`}>
          {description}
        </p>
      </div>
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
    </motion.div>
  );
};

// Premium Stats Component
const StatItem = ({ 
  value, 
  label, 
  delay = 0,
  isMobile = false
}: { 
  value: string; 
  label: string; 
  delay?: number;
  isMobile?: boolean;
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5, delay }}
      className="text-center"
    >
      <div className={`${isMobile ? 'text-xl' : 'text-xl sm:text-2xl lg:text-3xl'} font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-1`}>
        {value}
      </div>
      <div className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} text-gray-400 font-medium`}>{label}</div>
    </motion.div>
  );
};

// Floating Particles Component
const FloatingParticles = ({ isMobile = false }: { isMobile?: boolean }) => {
  const particleCount = isMobile ? 10 : 20;
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(particleCount)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0.2, 0.8, 0.2],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
};

// Scroll Indicator Component
const ScrollIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 2 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
    >
      <span className="text-xs text-white/60 font-medium">Scroll to explore</span>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
      >
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-1 h-3 bg-white/60 rounded-full mt-2"
        />
      </motion.div>
    </motion.div>
  );
};

export const Home: React.FC = () => {
  const [, setScreenState] = useAtom(screenAtom);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 100]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleGetStarted = () => {
    setScreenState({ currentScreen: "intro" });
  };

  // Mouse tracking for interactive effects (disabled on mobile)
  useEffect(() => {
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile]);

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-black overflow-hidden">
      {/* Enhanced Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          src={gloriaVideo}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Multi-layered overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-cyan-900/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(6,182,212,0.15),transparent_50%)]" />
      </div>

      {/* Floating Particles */}
      <FloatingParticles isMobile={isMobile} />

      {/* Premium Border Animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 z-10 pointer-events-none"
      >
        <div className="absolute inset-0 border-2 border-transparent bg-gradient-to-r from-cyan-500/20 via-transparent to-purple-500/20 rounded-none" 
             style={{ 
               backgroundClip: 'padding-box',
               mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
               maskComposite: 'xor'
             }} 
        />
      </motion.div>

      {/* Interactive cursor glow (desktop only) */}
      {!isMobile && (
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-3xl pointer-events-none z-5"
          style={{
            left: `${(mousePosition.x + 1) * 50}%`,
            top: `${(mousePosition.y + 1) * 50}%`,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Main Content Container */}
      <main className="relative z-20 flex flex-col min-h-screen">
        
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-20 text-center">
          
          {/* Logo and Brand */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center gap-4 sm:gap-6 mb-6 sm:mb-8 lg:mb-12"
          >
            {/* Premium Logo */}
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/30 to-purple-500/30 blur-2xl animate-pulse" />
              <img 
                src="/images/logo.svg" 
                alt="NyxtGen Logo" 
                className={`relative drop-shadow-2xl ${isMobile ? 'w-12 h-12' : 'w-16 h-16 sm:w-20 sm:h-20'}`}
              />
            </div>
            
            {/* Brand Name with Premium Typography */}
            <div className="space-y-2">
              <h1 
                className={`${isMobile ? 'text-3xl' : 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl'} font-black bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent tracking-tight leading-none`}
                style={{ 
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 900,
                  letterSpacing: '-0.04em'
                }}
              >
                NyxtGen
              </h1>
              
              {/* Premium Tagline */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className={`flex items-center justify-center gap-2 sm:gap-3 text-cyan-300 ${isMobile ? 'text-sm' : 'text-base sm:text-lg lg:text-xl'} font-semibold`}
              >
                <Sparkles className={`${isMobile ? 'size-3' : 'size-4 sm:size-5 lg:size-6'} animate-pulse`} />
                <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                  Next-Generation AI Platform
                </span>
                <Sparkles className={`${isMobile ? 'size-3' : 'size-4 sm:size-5 lg:size-6'} animate-pulse`} />
              </motion.div>
            </div>
          </motion.div>

          {/* Hero Headlines */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={`space-y-3 sm:space-y-4 lg:space-y-6 mb-6 sm:mb-8 lg:mb-12 max-w-5xl ${isMobile ? 'px-2' : ''}`}
          >
            <h2 className={`${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl'} font-bold text-white/95 leading-tight`}>
              Experience the{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Future
              </span>{" "}
              of Human–AI Conversation
            </h2>
            
            <p className={`${isMobile ? 'text-sm' : 'text-base sm:text-lg md:text-xl lg:text-2xl'} text-gray-300 leading-relaxed font-light max-w-4xl mx-auto`}>
              Immersive, real-time video conversations with intelligent, lifelike AI personas. 
              Step into a new era of digital interaction powered by cutting-edge technology.
            </p>
          </motion.div>

          {/* Premium CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className={`flex ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'} items-center justify-center gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12 lg:mb-16 w-full max-w-md sm:max-w-none`}
          >
            {/* Primary CTA */}
            <AudioButton
              onClick={handleGetStarted}
              className={`group relative overflow-hidden ${isMobile ? 'w-full' : ''} px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-6 ${isMobile ? 'text-base' : 'text-lg sm:text-xl'} font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-2xl shadow-2xl shadow-cyan-500/25 hover:shadow-3xl hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105 border border-cyan-400/20`}
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <span className="relative z-10 flex items-center gap-2 sm:gap-3 justify-center">
                <Play className={`${isMobile ? 'size-4' : 'size-5 sm:size-6'} fill-current`} />
                Start Experience
                <ArrowRight className={`${isMobile ? 'size-4' : 'size-5 sm:size-6'} group-hover:translate-x-1 transition-transform`} />
              </span>
              
              {/* Shine effect */}
              <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </AudioButton>

            {/* Secondary CTA */}
            <a
              href="https://docs.tavus.io/sections/conversational-video-interface/cvi-overview"
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center gap-2 sm:gap-3 ${isMobile ? 'w-full justify-center' : ''} px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 ${isMobile ? 'text-sm' : 'text-base sm:text-lg'} font-semibold text-cyan-300 hover:text-white border border-cyan-400/30 hover:border-cyan-400/60 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20`}
            >
              <Brain className="size-4 sm:size-5" />
              How it Works
              <ArrowRight className="size-3 sm:size-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          {/* Premium Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className={`flex items-center justify-center ${isMobile ? 'gap-6' : 'gap-8 sm:gap-12'} mb-8 sm:mb-12 lg:mb-16 p-3 sm:p-4 lg:p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 max-w-md sm:max-w-none`}
          >
            <StatItem value="99.9%" label="Uptime" delay={0.9} isMobile={isMobile} />
            <div className="w-px h-6 sm:h-8 lg:h-12 bg-white/20" />
            <StatItem value="<50ms" label="Latency" delay={1.0} isMobile={isMobile} />
            <div className="w-px h-6 sm:h-8 lg:h-12 bg-white/20" />
            <StatItem value="24/7" label="Available" delay={1.1} isMobile={isMobile} />
          </motion.div>

          {/* Scroll Indicator (desktop only) */}
          {!isMobile && <ScrollIndicator />}
        </div>

        {/* Features Section */}
        <motion.div 
          style={{ y: y1 }}
          className="px-4 sm:px-6 py-12 sm:py-16 bg-gradient-to-t from-black/80 to-transparent"
        >
          <div className="max-w-7xl mx-auto">
            
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="text-center mb-8 sm:mb-12 lg:mb-16"
            >
              <h3 className={`${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl lg:text-4xl'} font-bold text-white mb-3 sm:mb-4`}>
                Powered by{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Advanced AI
                </span>
              </h3>
              <p className={`${isMobile ? 'text-sm' : 'text-base sm:text-lg lg:text-xl'} text-gray-400 max-w-3xl mx-auto`}>
                Experience cutting-edge conversational AI technology that feels remarkably human
              </p>
            </motion.div>

            {/* Feature Grid */}
            <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'}`}>
              <FeatureCard
                icon={Video}
                title="Real-time Video"
                description="High-quality video conversations with lifelike AI personas"
                delay={0.1}
                isMobile={isMobile}
              />
              <FeatureCard
                icon={MessageCircle}
                title="Natural Dialog"
                description="Fluid, contextual conversations that feel genuinely human"
                delay={0.2}
                isMobile={isMobile}
              />
              <FeatureCard
                icon={Brain}
                title="Advanced AI"
                description="Powered by state-of-the-art language models and neural networks"
                delay={0.3}
                isMobile={isMobile}
              />
              <FeatureCard
                icon={Zap}
                title="Lightning Fast"
                description="Ultra-low latency responses for seamless interactions"
                delay={0.4}
                isMobile={isMobile}
              />
            </div>
          </div>
        </motion.div>

        {/* Additional Features Section */}
        <motion.div 
          style={{ y: y2 }}
          className="px-4 sm:px-6 py-12 sm:py-16"
        >
          <div className="max-w-7xl mx-auto">
            <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'}`}>
              <FeatureCard
                icon={Users}
                title="Collaboration Hub"
                description="Connect and collaborate with other users in real-time"
                delay={0.1}
                isMobile={isMobile}
              />
              <FeatureCard
                icon={Shield}
                title="Secure & Private"
                description="Enterprise-grade security with end-to-end encryption"
                delay={0.2}
                isMobile={isMobile}
              />
              <FeatureCard
                icon={Globe}
                title="Global Access"
                description="Available worldwide with multi-language support"
                delay={0.3}
                isMobile={isMobile}
              />
            </div>
          </div>
        </motion.div>

        {/* Bottom Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center py-8 sm:py-12 px-4 sm:px-6"
        >
          <div className="flex items-center justify-center gap-1 sm:gap-2 mb-3 sm:mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`${isMobile ? 'size-3' : 'size-4 sm:size-5'} text-yellow-400 fill-current`} />
            ))}
          </div>
          <blockquote className={`${isMobile ? 'text-base' : 'text-lg sm:text-xl lg:text-2xl'} font-light text-gray-300 italic max-w-4xl mx-auto leading-relaxed`}>
            "Conversational AI, reimagined for the next generation of human-computer interaction."
          </blockquote>
        </motion.div>
      </main>
    </div>
  );
};

export default Home;