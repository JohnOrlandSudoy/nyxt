import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAtom } from "jotai";
import { getDefaultStore } from "jotai";
import { userProfileAtom, profileSavedAtom, UserProfile } from "@/store/profile";
import { screenAtom } from "@/store/screens";
import { useAuthContext } from "@/components/AuthProvider";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useProfile } from "@/hooks/useProfile";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { profileService } from "@/services/profileService";
import {
  X,
  Save,
  User,
  Camera,
  Calendar,
  Briefcase,
  Heart,
  MapPin,
  Globe,
  Phone,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Edit3,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Bug
} from "lucide-react";
import { cn } from "@/utils";

// Enhanced Button Component
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "ghost" | "outline" | "primary" | "secondary" | "danger";
    size?: "icon" | "sm" | "default";
    loading?: boolean;
  }
>(({ className, variant = "default", size = "default", loading = false, children, disabled, ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants: { [key: string]: string } = {
    ghost: "hover:bg-white/10 text-white/80 hover:text-white",
    outline: "border border-white/30 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm",
    primary: "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25",
    secondary: "bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm border border-white/20",
    danger: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white shadow-lg shadow-red-500/25",
    default: "bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm"
  };
  
  const sizes: { [key: string]: string } = {
    icon: "h-10 w-10 p-0",
    sm: "h-9 px-3 text-sm",
    default: "h-11 px-5 text-sm"
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      ref={ref}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
});
Button.displayName = "Button";

// Enhanced Input Component
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    icon?: React.ReactNode;
    error?: string;
  }
>(({ className, icon, error, type, ...props }, ref) => {
  return (
    <div className="relative group">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 z-10">
          {icon}
        </div>
      )}
      
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border-2 border-slate-500 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:border-cyan-400 transition-all duration-200 shadow-lg",
          icon && "pl-10",
          "hover:border-cyan-500/70 hover:bg-slate-800",
          error && "border-red-500/50 focus-visible:border-red-500 focus-visible:ring-red-500/50",
          className
        )}
        style={{ fontFamily: "'Inter', sans-serif" }}
        ref={ref}
        {...props}
      />
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-xs mt-1 px-1"
        >
          {error}
        </motion.p>
      )}
      
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm -z-10" />
    </div>
  );
});
Input.displayName = "Input";

// Enhanced Textarea Component
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    error?: string;
  }
>(({ className, error, ...props }, ref) => {
  return (
    <div className="relative group">
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border-2 border-slate-500 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:border-cyan-400 transition-all duration-200 resize-none shadow-lg hover:border-cyan-500/70 hover:bg-slate-800",
          error && "border-red-500/50 focus-visible:border-red-500 focus-visible:ring-red-500/50",
          className
        )}
        style={{ fontFamily: "'Inter', sans-serif" }}
        ref={ref}
        {...props}
      />
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-xs mt-1 px-1"
        >
          {error}
        </motion.p>
      )}
      
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm -z-10" />
    </div>
  );
});
Textarea.displayName = "Textarea";

// Enhanced Select Component
const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    icon?: React.ReactNode;
    error?: string;
  }
>(({ className, icon, error, children, ...props }, ref) => {
  return (
    <div className="relative group">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 z-10">
          {icon}
        </div>
      )}
      
      <select
        className={cn(
          "flex h-11 w-full rounded-xl border-2 border-slate-500 bg-slate-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:border-cyan-400 transition-all duration-200 appearance-none cursor-pointer shadow-lg hover:border-cyan-500/70 hover:bg-slate-800",
          icon && "pl-10",
          error && "border-red-500/50 focus-visible:border-red-500 focus-visible:ring-red-500/50",
          className
        )}
        style={{ fontFamily: "'Inter', sans-serif" }}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-cyan-400 group-focus-within:text-cyan-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-xs mt-1 px-1"
        >
          {error}
        </motion.p>
      )}
      
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm -z-10" />
    </div>
  );
});
Select.displayName = "Select";

// Enhanced Label Component
const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & {
    required?: boolean;
  }
>(({ className, required, children, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        "text-sm font-semibold text-white leading-none flex items-center gap-2 mb-2",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-red-400 text-sm">*</span>}
    </label>
  );
});
Label.displayName = "Label";

// FIXED: Photo Upload Component with proper file validation
const PhotoUpload = ({ 
  label, 
  currentPhoto, 
  onPhotoChange, 
  aspectRatio = "square",
  icon = Camera,
  loading = false,
  showDebugInfo = false
}: {
  label: string;
  currentPhoto?: string;
  onPhotoChange: (photo: string | File) => void;
  aspectRatio?: "square" | "cover";
  icon?: any;
  loading?: boolean;
  showDebugInfo?: boolean;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.type, file.size);
      
      // FIXED: Validate file type properly
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        console.error('Invalid file type:', file.type, 'Allowed:', allowedTypes);
        alert(`Invalid file type: ${file.type}. Please select a JPEG, PNG, WebP, or GIF image.`);
        return;
      }
      
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        console.error('File too large:', file.size, 'Max:', maxSize);
        alert('File size too large. Please select an image smaller than 5MB.');
        return;
      }
      
      // Convert to base64 for immediate preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log('File converted to base64, length:', result.length);
        
        // FIXED: Validate the base64 data before using it
        if (profileService.validateImageData(result)) {
          onPhotoChange(result);
        } else {
          console.error('Generated base64 data is invalid');
          alert('Failed to process the image. Please try a different file.');
        }
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        alert('Failed to read the file. Please try again.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    onPhotoChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRetryPhoto = () => {
    // Trigger file input again
    fileInputRef.current?.click();
  };

  const IconComponent = icon;

  console.log('PhotoUpload render:', { label, currentPhoto: currentPhoto?.substring(0, 50) + '...', loading });

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      <div className={cn(
        "relative group rounded-xl border-2 border-dashed border-slate-600 hover:border-cyan-500/50 transition-all duration-200 overflow-hidden",
        aspectRatio === "square" ? "aspect-square" : "aspect-[3/1]"
      )}>
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <div className="text-center">
              <Loader2 className="size-6 animate-spin text-cyan-400 mx-auto mb-2" />
              <p className="text-white text-sm">Processing image...</p>
            </div>
          </div>
        )}
        
        {currentPhoto ? (
          <>
            <ImageWithFallback
              src={currentPhoto}
              alt={label}
              className="w-full h-full"
              errorMessage="Failed to load image"
              onRetry={handleRetryPhoto}
              showDebugInfo={showDebugInfo}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <Edit3 className="size-4 mr-1" />
                Change
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={handleRemovePhoto}
                disabled={loading}
              >
                <Trash2 className="size-4 mr-1" />
                Remove
              </Button>
            </div>
          </>
        ) : (
          <div 
            className="w-full h-full flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="p-3 rounded-full bg-cyan-500/20 border border-cyan-500/30">
              <IconComponent className="size-6 text-cyan-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium text-sm">Upload {label}</p>
              <p className="text-slate-400 text-xs">Click to browse files</p>
              <p className="text-slate-500 text-xs mt-1">JPEG, PNG, WebP, GIF (max 5MB)</p>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
          disabled={loading}
        />
      </div>
    </div>
  );
};

// Interest Tags Component
const InterestTags = ({ 
  interests, 
  onInterestsChange 
}: { 
  interests: string[]; 
  onInterestsChange: (interests: string[]) => void; 
}) => {
  const [newInterest, setNewInterest] = useState("");

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      onInterestsChange([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    onInterestsChange(interests.filter(i => i !== interest));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addInterest();
    }
  };

  return (
    <div className="space-y-3">
      <Label>Interests & Hobbies</Label>
      
      {/* Add new interest */}
      <div className="flex gap-2">
        <Input
          value={newInterest}
          onChange={(e) => setNewInterest(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add an interest (e.g., Photography, Travel, Music)"
          className="flex-1"
        />
        <Button
          type="button"
          size="sm"
          onClick={addInterest}
          disabled={!newInterest.trim()}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      
      {/* Display interests */}
      {interests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {interests.map((interest, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-sm"
            >
              <span>{interest}</span>
              <button
                type="button"
                onClick={() => removeInterest(interest)}
                className="hover:text-red-400 transition-colors"
              >
                <X className="size-3" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// Profile Section Component
const ProfileSection = ({ 
  title, 
  description, 
  icon, 
  children 
}: { 
  title: string; 
  description?: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
}) => {
  return (
    <div className="space-y-4 p-5 rounded-2xl bg-slate-800/60 backdrop-blur-sm border-2 border-slate-600/50 hover:border-slate-500/70 transition-all duration-200 shadow-xl">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border-2 border-cyan-500/40 flex-shrink-0 shadow-lg">
          <div className="text-cyan-300">
            {React.cloneElement(icon as React.ReactElement, { className: "size-5" })}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

// Form Field Component
const FormField = ({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
    </div>
  );
};

// Error Message Component
const ErrorMessage = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm"
  >
    <AlertCircle className="size-5 text-red-400 flex-shrink-0" />
    <div className="flex-1">
      <p className="text-red-300 text-sm font-medium">{message}</p>
    </div>
    {onRetry && (
      <Button size="sm" variant="outline" onClick={onRetry}>
        <RefreshCw className="size-4 mr-1" />
        Retry
      </Button>
    )}
  </motion.div>
);

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

const DEFAULT_AVATAR = '/public/images/robot.svg';
const DEFAULT_COVER = '/public/images/layer.png';

export const Profile: React.FC = () => {
  const [localProfile, setLocalProfile] = useAtom(userProfileAtom);
  const [, setScreenState] = useAtom(screenAtom);
  const [, setProfileSaved] = useAtom(profileSavedAtom);
  const { user } = useAuthContext();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [photoUploading, setPhotoUploading] = useState<{
    profile: boolean;
    cover: boolean;
  }>({ profile: false, cover: false });
  const [debugMode, setDebugMode] = useState(false);

  // Use the profile hook for database operations
  const { 
    profile: dbProfile, 
    loading: profileLoading, 
    error: profileError, 
    loadProfile, 
    saveProfile 
  } = useProfile();

  // Enforce authentication for this screen
  const { isAuthenticated, isLoading } = useAuthGuard({
    showAuthModal: true,
    redirectTo: "auth"
  });

  // Initialize local profile from database profile
  useEffect(() => {
    if (dbProfile) {
      console.log('Initializing local profile from database:', dbProfile);
      setLocalProfile(dbProfile);
    }
  }, [dbProfile, setLocalProfile]);

  const relationshipOptions = [
    { label: "Prefer not to say", value: "prefer-not-to-say" },
    { label: "Single", value: "single" },
    { label: "In a relationship", value: "relationship" },
    { label: "Married", value: "married" },
    { label: "It's complicated", value: "complicated" },
  ];

  const fashionStyles = [
    "Casual", "Formal", "Streetwear", "Vintage", "Minimalist", 
    "Bohemian", "Sporty", "Elegant", "Edgy", "Classic"
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!localProfile.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (localProfile.age && (localProfile.age < 13 || localProfile.age > 120)) {
      newErrors.age = "Please enter a valid age";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    setScreenState({ currentScreen: "intro" });
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage('');

    try {
      console.log('Saving profile:', localProfile);
      await saveProfile(localProfile);
      
      setSuccessMessage('Profile saved successfully!');
      setProfileSaved(true);
      
      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    console.log('Updating profile with:', updates);
    setLocalProfile(prev => ({ ...prev, ...updates }));
    // Clear related errors
    Object.keys(updates).forEach(key => {
      if (errors[key]) {
        setErrors(prev => ({ ...prev, [key]: '' }));
      }
    });
  };

  const handlePhotoChange = async (field: 'profilePhoto' | 'coverPhoto', photoData: string | File) => {
    console.log('Photo change requested:', field, typeof photoData);
    
    if (!photoData) {
      updateProfile({ [field]: '' });
      return;
    }

    // If it's a string (base64), validate and use it directly for immediate preview
    if (typeof photoData === 'string') {
      console.log('Setting photo data directly:', field, photoData.substring(0, 50) + '...');
      
      // FIXED: Validate the image data before setting it
      if (profileService.validateImageData(photoData)) {
        updateProfile({ [field]: photoData });
      } else {
        console.error('Invalid image data provided:', photoData.substring(0, 100));
        setErrors(prev => ({ ...prev, [field]: 'Invalid image data. Please try a different file.' }));
      }
    } else {
      // If it's a File object, convert to base64 for preview
      setPhotoUploading(prev => ({ ...prev, [field === 'profilePhoto' ? 'profile' : 'cover']: true }));
      
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          console.log('File converted to base64 for preview:', field, result.substring(0, 50) + '...');
          
          // FIXED: Validate the converted base64 data
          if (profileService.validateImageData(result)) {
            updateProfile({ [field]: result });
          } else {
            console.error('Invalid base64 data generated from file');
            setErrors(prev => ({ ...prev, [field]: 'Failed to process the image. Please try a different file.' }));
          }
          
          setPhotoUploading(prev => ({ ...prev, [field === 'profilePhoto' ? 'profile' : 'cover']: false }));
        };
        reader.onerror = (error) => {
          console.error('Error reading file:', error);
          setErrors(prev => ({ ...prev, [field]: 'Failed to read the file. Please try again.' }));
          setPhotoUploading(prev => ({ ...prev, [field === 'profilePhoto' ? 'profile' : 'cover']: false }));
        };
        reader.readAsDataURL(photoData);
      } catch (error) {
        console.error('Error processing file:', error);
        setErrors(prev => ({ ...prev, [field]: 'Error processing the file. Please try again.' }));
        setPhotoUploading(prev => ({ ...prev, [field === 'profilePhoto' ? 'profile' : 'cover']: false }));
      }
    }
  };

  const handleDebugStorage = async () => {
    console.log('Running storage debug...');
    await profileService.debugStorageBucket();
  };

  // Show loading while checking authentication
  if (isLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white text-lg">
            {isLoading ? "Verifying access..." : "Loading profile..."}
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, this will be handled by useAuthGuard
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl h-[95vh] bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden flex flex-col">
        
        {/* Header - Fixed at top */}
        <div className="flex-shrink-0 bg-gradient-to-b from-black/95 to-black/80 backdrop-blur-lg border-b border-slate-600/30 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border-2 border-cyan-500/40 shadow-lg">
                <User className="size-6 text-cyan-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Create Your Profile</h1>
                <p className="text-sm text-slate-300">Tell us about yourself to personalize your AI experience</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Debug toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDebugMode(!debugMode)}
                className="hover:bg-yellow-500/20 hover:text-yellow-400"
                title="Toggle debug mode"
              >
                <Bug className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="hover:bg-red-500/20 hover:text-red-400 border-2 border-transparent hover:border-red-500/30"
              >
                <X className="size-6" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Debug Panel */}
          {debugMode && (
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Bug className="size-5 text-yellow-400" />
                <h3 className="text-yellow-400 font-semibold">Debug Mode</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-yellow-300">Profile Photo: {localProfile.profilePhoto ? 'Set' : 'Not set'}</p>
                <p className="text-yellow-300">Cover Photo: {localProfile.coverPhoto ? 'Set' : 'Not set'}</p>
                <p className="text-yellow-300">Profile Photo Valid: {localProfile.profilePhoto ? profileService.validateImageData(localProfile.profilePhoto).toString() : 'N/A'}</p>
                <p className="text-yellow-300">Cover Photo Valid: {localProfile.coverPhoto ? profileService.validateImageData(localProfile.coverPhoto).toString() : 'N/A'}</p>
                <Button size="sm" variant="outline" onClick={handleDebugStorage}>
                  Test Storage
                </Button>
              </div>
            </div>
          )}
          
          {/* Error/Success Messages */}
          {profileError && (
            <ErrorMessage message={profileError} onRetry={loadProfile} />
          )}
          
          {errors.submit && (
            <ErrorMessage message={errors.submit} />
          )}
          
          {errors.profilePhoto && (
            <ErrorMessage message={`Profile Photo: ${errors.profilePhoto}`} />
          )}
          
          {errors.coverPhoto && (
            <ErrorMessage message={`Cover Photo: ${errors.coverPhoto}`} />
          )}
          
          {successMessage && (
            <SuccessMessage message={successMessage} />
          )}
          
          {/* Photos Section */}
          <ProfileSection
            title="Photos"
            description="Add photos to personalize your profile"
            icon={<Camera />}
          >
            <div className="relative w-full max-w-2xl mx-auto mb-8">
              {/* Cover Photo */}
              <div className="relative w-full h-40 md:h-56 rounded-2xl overflow-hidden shadow-lg group bg-slate-800">
                <img
                  src={localProfile.coverPhoto || DEFAULT_COVER}
                  alt="Cover"
                  className="w-full h-full object-cover object-center transition-all duration-300 group-hover:brightness-75"
                  onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_COVER; }}
                />
                {/* Overlay for edit/remove */}
                <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => document.getElementById('cover-photo-input')?.click()}
                    aria-label="Change cover photo"
                  >
                    <Edit3 className="size-4 mr-1" /> Change
                  </Button>
                  {localProfile.coverPhoto && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handlePhotoChange('coverPhoto', '')}
                      aria-label="Remove cover photo"
                    >
                      <Trash2 className="size-4 mr-1" /> Remove
                    </Button>
                  )}
                </div>
                {/* Loading spinner */}
                {photoUploading.cover && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                    <Loader2 className="size-8 animate-spin text-cyan-400" />
                  </div>
                )}
                <input
                  id="cover-photo-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoChange('coverPhoto', file);
                  }}
                  className="hidden"
                  disabled={photoUploading.cover}
                  aria-label="Upload cover photo"
                />
              </div>
              {/* Profile Photo - overlaps cover */}
              <div className="absolute left-1/2 -bottom-12 md:-bottom-16 transform -translate-x-1/2 z-20 group">
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-900">
                  <img
                    src={localProfile.profilePhoto || DEFAULT_AVATAR}
                    alt="Profile"
                    className="w-full h-full object-cover object-center transition-all duration-300 group-hover:brightness-75"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR; }}
                  />
                  {/* Overlay for edit/remove */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => document.getElementById('profile-photo-input')?.click()}
                      aria-label="Change profile photo"
                    >
                      <Edit3 className="size-4 mr-1" />
                    </Button>
                    {localProfile.profilePhoto && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handlePhotoChange('profilePhoto', '')}
                        aria-label="Remove profile photo"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                  {/* Loading spinner */}
                  {photoUploading.profile && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                      <Loader2 className="size-8 animate-spin text-cyan-400" />
                    </div>
                  )}
                  <input
                    id="profile-photo-input"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoChange('profilePhoto', file);
                    }}
                    className="hidden"
                    disabled={photoUploading.profile}
                    aria-label="Upload profile photo"
                  />
                </div>
              </div>
              {/* Spacer for profile photo overlap */}
              <div className="h-16 md:h-20" />
            </div>
          </ProfileSection>

          {/* Basic Information */}
          <ProfileSection
            title="Basic Information"
            description="Essential details about yourself"
            icon={<User />}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField>
                <Label htmlFor="fullName" required>Full Name</Label>
                <Input
                  id="fullName"
                  icon={<User className="size-4" />}
                  value={localProfile.fullName}
                  onChange={(e) => updateProfile({ fullName: e.target.value })}
                  placeholder="Enter your full name"
                  error={errors.fullName}
                />
              </FormField>

              <FormField>
                <Label htmlFor="birthday">Birthday</Label>
                <Input
                  id="birthday"
                  type="date"
                  icon={<Calendar className="size-4" />}
                  value={localProfile.birthday || ""}
                  onChange={(e) => updateProfile({ birthday: e.target.value })}
                />
              </FormField>

              <FormField>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="13"
                  max="120"
                  icon={<User className="size-4" />}
                  value={localProfile.age || ""}
                  onChange={(e) => updateProfile({ age: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Enter your age"
                  error={errors.age}
                />
              </FormField>

              <FormField>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  icon={<MapPin className="size-4" />}
                  value={localProfile.location || ""}
                  onChange={(e) => updateProfile({ location: e.target.value })}
                  placeholder="City, Country"
                />
              </FormField>
            </div>

            <FormField>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={localProfile.bio}
                onChange={(e) => updateProfile({ bio: e.target.value })}
                placeholder="Tell us about yourself, your interests, and what makes you unique..."
                rows={4}
              />
            </FormField>
          </ProfileSection>

          {/* Professional & Lifestyle */}
          <ProfileSection
            title="Professional & Lifestyle"
            description="Your work and style preferences"
            icon={<Briefcase />}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField>
                <Label htmlFor="job">Job/Profession</Label>
                <Input
                  id="job"
                  icon={<Briefcase className="size-4" />}
                  value={localProfile.job}
                  onChange={(e) => updateProfile({ job: e.target.value })}
                  placeholder="What do you do for work?"
                />
              </FormField>

              <FormField>
                <Label htmlFor="fashion">Fashion Style</Label>
                <Select
                  id="fashion"
                  icon={<Sparkles className="size-4" />}
                  value={localProfile.fashion}
                  onChange={(e) => updateProfile({ fashion: e.target.value })}
                >
                  <option value="">Select your style</option>
                  {fashionStyles.map((style) => (
                    <option key={style} value={style.toLowerCase()} className="bg-slate-800 text-white">
                      {style}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField>
                <Label htmlFor="relationshipStatus">Relationship Status</Label>
                <Select
                  id="relationshipStatus"
                  icon={<Heart className="size-4" />}
                  value={localProfile.relationshipStatus}
                  onChange={(e) => updateProfile({ relationshipStatus: e.target.value })}
                >
                  {relationshipOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-800 text-white">
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField>
                <Label htmlFor="website">Website/Portfolio</Label>
                <Input
                  id="website"
                  type="url"
                  icon={<Globe className="size-4" />}
                  value={localProfile.website || ""}
                  onChange={(e) => updateProfile({ website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              </FormField>
            </div>
          </ProfileSection>

          {/* Interests & Contact */}
          <ProfileSection
            title="Interests & Contact"
            description="Your hobbies and how to reach you"
            icon={<Sparkles />}
          >
            <div className="space-y-4">
              <InterestTags
                interests={localProfile.interests || []}
                onInterestsChange={(interests) => updateProfile({ interests })}
              />

              <FormField>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  icon={<Phone className="size-4" />}
                  value={localProfile.phone || ""}
                  onChange={(e) => updateProfile({ phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </FormField>
            </div>
          </ProfileSection>

          {/* Extra padding at bottom */}
          <div className="h-8"></div>
        </div>

        {/* Footer Actions - Fixed at bottom */}
        <div className="flex-shrink-0 bg-gradient-to-t from-black/95 to-black/80 backdrop-blur-lg border-t border-slate-600/30 p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="text-xs text-slate-300 leading-relaxed space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="font-bold text-white text-sm">Profile Tips</span>
              </div>
              <div className="space-y-1 text-slate-400">
                <p>• All fields are optional except your name</p>
                <p>• Your profile helps personalize AI conversations</p>
                <p>• Data is stored securely in the cloud</p>
                {debugMode && <p className="text-yellow-400">• Debug mode is enabled - check console for logs</p>}
              </div>
            </div>
            <div className="flex gap-3 w-full lg:w-auto">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 lg:flex-none min-w-[100px]"
                disabled={isSubmitting}
              >
                Skip for Now
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                className="flex-1 lg:flex-none min-w-[140px]"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                <Save className="size-4 mr-2" />
                Save Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};