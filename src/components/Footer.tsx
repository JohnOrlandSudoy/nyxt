import { ExternalLink, Zap, Sparkles, ArrowRight, Twitter, Linkedin, Facebook, Globe } from "lucide-react";
import { motion } from "framer-motion";

// Premium Bolt.new Logo Component
const BoltLogo = ({ className = "", isMobile = false }: { className?: string; isMobile?: boolean }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Bolt Icon with premium styling */}
      <div className="relative">
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-400/30 to-orange-500/30 blur-md animate-pulse" />
        
        {/* Main icon container */}
        <div className={`relative flex items-center justify-center rounded-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}>
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-yellow-500/20 via-transparent to-orange-500/20" />
          <Zap className={`${isMobile ? 'size-3' : 'size-4'} text-yellow-400 relative z-10 drop-shadow-sm`} fill="currentColor" />
          <div className="absolute inset-0 rounded-lg border border-white/10" />
        </div>
      </div>
      
      {/* Bolt.new Text */}
      <div className="flex items-center gap-1">
        <span 
          className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold bg-gradient-to-r from-white via-yellow-100 to-orange-200 bg-clip-text text-transparent tracking-tight`}
          style={{ 
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            letterSpacing: '-0.01em'
          }}
        >
          Bolt
        </span>
        <span className={`text-yellow-400 font-bold ${isMobile ? 'text-sm' : 'text-lg'}`}>.</span>
        <span 
          className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold bg-gradient-to-r from-yellow-100 to-orange-200 bg-clip-text text-transparent tracking-tight`}
          style={{ 
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            letterSpacing: '-0.01em'
          }}
        >
          new
        </span>
      </div>
    </div>
  );
};

// Premium Action Button Component
const PremiumButton = ({ 
  children, 
  href, 
  variant = "primary",
  size = "default",
  className = "",
  ...props 
}: {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary";
  size?: "sm" | "default";
  className?: string;
  [key: string]: any;
}) => {
  const baseStyles = "relative group inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-300 overflow-hidden touch-manipulation";
  
  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-105",
    secondary: "border border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm hover:border-white/30"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    default: "px-6 py-3 text-sm"
  };

  const Component = href ? "a" : "button";
  
  return (
    <Component
      href={href}
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {/* Animated background gradient */}
      {variant === "primary" && (
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      
      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
      
      {/* Shine effect */}
      <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
    </Component>
  );
};

export const Footer = () => {
  return (
    <footer className="relative w-full">
      {/* Premium background with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent backdrop-blur-sm" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(6,182,212,0.1),transparent_50%)]" />
      {/* Main footer content */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 p-6 border-t border-white/10">
        {/* Left side - Built with Bolt.new and CTAs */}
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full md:w-auto">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <span className="text-sm text-white/70 font-medium">Built with</span>
            <BoltLogo />
          </div>
          <div className="hidden lg:flex items-center gap-1">
            <Sparkles className="size-4 text-cyan-400/60 animate-pulse" />
            <span className="text-xs text-white/50 font-medium">Lightning Fast Development</span>
          </div>
          <div className="flex items-center gap-2 mt-2 md:mt-0">
            <PremiumButton
              variant="secondary"
              href="https://docs.tavus.io/sections/conversational-video-interface/cvi-overview"
              className="hidden sm:inline-flex"
            >
              How it works
              <ExternalLink className="size-4" />
            </PremiumButton>
            <PremiumButton
              variant="primary"
              href="https://bolt.new"
            >
              <Zap className="size-4" fill="currentColor" />
              Try Bolt.new
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </PremiumButton>
          </div>
        </div>
        {/* Right side - Social and portfolio links */}
        <div className="flex flex-wrap items-center justify-center gap-4 w-full md:w-auto mt-4 md:mt-0">
          <a href="https://www.facebook.com/johnorland.sudoy.1" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-cyan-400 transition-colors">
            <Facebook className="size-5" />
          </a>
          <a href="https://www.linkedin.com/in/john-orland-sudoy-75580a31b/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-cyan-400 transition-colors">
            <Linkedin className="size-5" />
          </a>
          <a href="https://x.com/JohnSudoy" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="hover:text-cyan-400 transition-colors">
            <Twitter className="size-5" />
          </a>
          <a href="https://orlandiv.vercel.app" target="_blank" rel="noopener noreferrer" aria-label="Portfolio" className="hover:text-cyan-400 transition-colors">
            <Globe className="size-5" />
          </a>
        </div>
      </div>
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
            style={{
              left: `${20 + i * 30}%`,
              top: `${20 + i * 20}%`,
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      {/* Copyright */}
      <div className="relative z-10 text-xs text-slate-400 text-center py-2">
        © {new Date().getFullYear()} NyxtGen. All rights reserved.
      </div>
    </footer>
  );
};