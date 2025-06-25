import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAtom } from 'jotai';
import { screenAtom } from '@/store/screens';
import { useAuthContext } from '@/components/AuthProvider';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Info
} from 'lucide-react';
import gloriaVideo from '@/assets/video/gloria.mp4';

// Premium Input Component
const PremiumInput = ({ 
  value, 
  onChange, 
  placeholder, 
  type = "text",
  icon,
  showToggle = false,
  onToggle,
  error,
  disabled = false
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: string;
  icon?: React.ReactNode;
  showToggle?: boolean;
  onToggle?: () => void;
  error?: string;
  disabled?: boolean;
}) => {
  return (
    <div className="relative group">
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
          disabled={disabled}
          className={`w-full h-14 px-4 pl-12 pr-12 rounded-2xl bg-slate-900/70 border-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 backdrop-blur-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            error 
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50' 
              : 'border-slate-700/50 hover:border-slate-600/70'
          }`}
          style={{ fontFamily: "'Inter', sans-serif" }}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors z-10 disabled:opacity-50"
          >
            {type === "password" ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </button>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mt-2 text-red-400 text-sm"
        >
          <AlertCircle className="size-4" />
          {error}
        </motion.div>
      )}
      
      {/* Focus glow effect */}
      <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 blur-sm -z-10 ${
        error 
          ? 'bg-gradient-to-r from-red-500/20 to-red-500/20 opacity-0 group-focus-within:opacity-100'
          : 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100'
      }`} />
    </div>
  );
};

// Premium Button Component
const PremiumButton = ({ 
  children, 
  onClick, 
  disabled = false,
  loading = false,
  variant = "primary",
  className = "",
  ...props 
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  [key: string]: any;
}) => {
  const baseStyles = "relative group overflow-hidden w-full h-14 rounded-2xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-[1.02] disabled:hover:scale-100",
    secondary: "border-2 border-white/30 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm hover:border-white/50",
    ghost: "text-cyan-400 hover:text-cyan-300 hover:bg-white/10"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {/* Animated background for primary variant */}
      {variant === "primary" && (
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-3">
        {loading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          children
        )}
      </span>
      
      {/* Shine effect for primary variant */}
      {variant === "primary" && (
        <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      )}
    </button>
  );
};

// Success Message Component
const SuccessMessage = ({ message }: { message: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm"
  >
    <CheckCircle className="size-5 text-emerald-400 flex-shrink-0" />
    <p className="text-emerald-300 text-sm font-medium">{message}</p>
  </motion.div>
);

// Error Message Component
const ErrorMessage = ({ message }: { message: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm"
  >
    <AlertCircle className="size-5 text-red-400 flex-shrink-0" />
    <p className="text-red-300 text-sm font-medium">{message}</p>
  </motion.div>
);

// Info Message Component
const InfoMessage = ({ message }: { message: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 backdrop-blur-sm"
  >
    <Info className="size-5 text-blue-400 flex-shrink-0" />
    <p className="text-blue-300 text-sm font-medium">{message}</p>
  </motion.div>
);

export const Auth: React.FC = () => {
  const [, setScreenState] = useAtom(screenAtom);
  const { signIn, signUp, user } = useAuthContext();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-redirect if user becomes authenticated
  useEffect(() => {
    if (user && !isSubmitting) {
      // Immediate redirect when user is authenticated
      setScreenState({ currentScreen: "intro" });
    }
  }, [user, setScreenState, isSubmitting]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Sign up specific validations
    if (isSignUp) {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage('');
    setInfoMessage('');

    try {
      if (isSignUp) {
        const { user, error } = await signUp(formData.email, formData.password, formData.fullName);
        
        if (error) {
          // Handle specific error cases
          if (error.message.includes('User already registered')) {
            setErrors({ submit: 'An account with this email already exists. Please sign in instead.' });
          } else if (error.message.includes('Database error') || error.message.includes('Profile setup can be completed later')) {
            // User was created but profile creation failed - this is okay
            setInfoMessage('Account created successfully! You can now use the app. Profile setup can be completed later.');
            // The useEffect will handle the redirect when user state updates
          } else {
            setErrors({ submit: error.message });
          }
        } else if (user) {
          setSuccessMessage('Account created successfully! Redirecting...');
          // The useEffect will handle the redirect when user state updates
        }
      } else {
        const { user, error } = await signIn(formData.email, formData.password);
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrors({ submit: 'Invalid email or password. Please check your credentials and try again.' });
          } else {
            setErrors({ submit: error.message });
          }
        } else if (user) {
          setSuccessMessage('Welcome back! Redirecting...');
          // The useEffect will handle the redirect when user state updates
        }
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleClose = () => {
    setScreenState({ currentScreen: "home" });
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({ email: '', password: '', fullName: '', confirmPassword: '' });
    setErrors({});
    setSuccessMessage('');
    setInfoMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
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
        <div className="absolute inset-0 bg-gradient-to-br from-black/95 via-black/90 to-slate-900/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_70%)]" />
      </div>

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md my-8"
      >
        {/* Main Card */}
        <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl max-h-[90vh] overflow-y-auto">
          
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <X className="size-5" />
          </button>

          {/* Animated background gradient */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 animate-pulse" />
          
          {/* Premium border glow */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-transparent to-purple-500/20 blur-xl opacity-50" />
          
          {/* Content */}
          <div className="relative z-10 space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-4">
              {/* Logo */}
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/30 to-purple-500/30 blur-xl animate-pulse" />
                <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-transparent to-purple-500/20" />
                  <Shield className="size-8 text-cyan-400 relative z-10 drop-shadow-lg" />
                  <div className="absolute inset-0 rounded-2xl border border-white/10" />
                </div>
              </div>

              {/* Title and Description */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {isSignUp 
                    ? 'Join NyxtGen and start experiencing AI conversations instantly'
                    : 'Sign in to continue your AI journey'
                  }
                </p>
              </div>
            </div>

            {/* Success/Error/Info Messages */}
            <AnimatePresence mode="wait">
              {successMessage && (
                <SuccessMessage message={successMessage} />
              )}
              {infoMessage && (
                <InfoMessage message={infoMessage} />
              )}
              {errors.submit && (
                <ErrorMessage message={errors.submit} />
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name (Sign Up Only) */}
              <AnimatePresence>
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PremiumInput
                      value={formData.fullName}
                      onChange={handleInputChange('fullName')}
                      placeholder="Enter your full name"
                      icon={<User className="size-4" />}
                      error={errors.fullName}
                      disabled={isSubmitting}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <PremiumInput
                value={formData.email}
                onChange={handleInputChange('email')}
                placeholder="Enter your email address"
                type="email"
                icon={<Mail className="size-4" />}
                error={errors.email}
                disabled={isSubmitting}
              />

              {/* Password */}
              <PremiumInput
                value={formData.password}
                onChange={handleInputChange('password')}
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                icon={<Lock className="size-4" />}
                showToggle={true}
                onToggle={() => setShowPassword(!showPassword)}
                error={errors.password}
                disabled={isSubmitting}
              />

              {/* Confirm Password (Sign Up Only) */}
              <AnimatePresence>
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PremiumInput
                      value={formData.confirmPassword}
                      onChange={handleInputChange('confirmPassword')}
                      placeholder="Confirm your password"
                      type={showPassword ? "text" : "password"}
                      icon={<Lock className="size-4" />}
                      error={errors.confirmPassword}
                      disabled={isSubmitting}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <div className="pt-2">
                <PremiumButton
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    isSignUp ? 'Creating Account...' : 'Signing In...'
                  ) : (
                    <>
                      {isSignUp ? 'Create Account' : 'Sign In'}
                      <ArrowRight className="size-5" />
                      <Sparkles className="size-4" />
                    </>
                  )}
                </PremiumButton>
              </div>
            </form>

            {/* Switch Mode */}
            <div className="text-center pt-4 border-t border-slate-700/50">
              <p className="text-slate-400 text-sm mb-3">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </p>
              <PremiumButton
                variant="ghost"
                onClick={switchMode}
                disabled={isSubmitting}
              >
                {isSignUp ? 'Sign In Instead' : 'Create Account'}
              </PremiumButton>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Shield className="size-3 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">Instant Access - No Email Verification</span>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-4 left-4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse opacity-60" />
          <div className="absolute bottom-4 right-4 w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-40" />
        </div>

        {/* Floating particles around modal */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
              style={{
                left: `${10 + (i * 12)}%`,
                top: `${15 + (i * 8)}%`,
              }}
              animate={{
                y: [-10, 10, -10],
                opacity: [0.3, 0.8, 0.3],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3 + (i * 0.3),
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