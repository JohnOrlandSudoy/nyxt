import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAtom } from 'jotai';
import { screenAtom } from '@/store/screens';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useChat } from '@/hooks/useChat';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useAuthContext } from '@/components/AuthProvider';
import {
  MessageCircle,
  Send,
  Search,
  Users,
  Plus,
  Settings,
  X,
  UserPlus,
  MessageSquare,
  Clock,
  CheckCircle,
  Circle,
  Loader2,
  ArrowLeft,
  Hash,
  Lock,
  Globe,
  Crown,
  Shield,
  Star,
  Heart,
  Code,
  Image as ImageIcon,
  File,
  Zap,
  Coffee,
  Briefcase,
  MapPin,
  Calendar,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  AlertCircle,
  Check,
  Menu,
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Maximize2,
  Smile,
  MoreVertical,
  User
} from 'lucide-react';
import { cn } from '@/utils';
import { ChatMessage, ChatRoom, UserForCollaboration, UserConnection } from '@/services/chatService';
import { chatService } from '@/services/chatService';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

const DEFAULT_AVATAR = '/public/images/robot.svg';

// Enhanced Button Component with better mobile touch targets
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "ghost" | "outline" | "primary" | "secondary" | "danger" | "success";
    size?: "icon" | "sm" | "default" | "lg" | "xs";
    loading?: boolean;
    fullWidth?: boolean;
  }
>(({ className, variant = "default", size = "default", loading = false, fullWidth = false, children, disabled, ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none active:scale-95 touch-manipulation";
  
  const variants: { [key: string]: string } = {
    ghost: "hover:bg-white/10 text-white/80 hover:text-white",
    outline: "border border-white/30 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm",
    primary: "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25",
    secondary: "bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm border border-white/20",
    danger: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white shadow-lg shadow-red-500/25",
    success: "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white shadow-lg shadow-green-500/25",
    default: "bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm"
  };
  
  const sizes: { [key: string]: string } = {
    xs: "h-8 px-2 text-xs min-w-[32px]",
    icon: "h-10 w-10 p-0 min-w-[44px]", // Increased for better mobile touch
    sm: "h-9 px-3 text-sm min-w-[44px]",
    default: "h-11 px-4 text-sm min-w-[44px]", // Increased height for mobile
    lg: "h-12 px-6 text-base min-w-[48px]"
  };

  return (
    <button
      className={cn(
        baseStyles, 
        variants[variant], 
        sizes[size], 
        fullWidth && "w-full",
        className
      )}
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

// Enhanced Input Component with better mobile experience
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    icon?: React.ReactNode;
    error?: string;
    fullWidth?: boolean;
  }
>(({ className, icon, error, fullWidth = false, type, ...props }, ref) => {
  return (
    <div className={cn("relative group", fullWidth && "w-full")}>
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 z-10">
          {icon}
        </div>
      )}
      
      <input
        type={type}
        className={cn(
          "flex w-full rounded-xl border-2 border-slate-500 bg-slate-900 px-3 py-3 text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:border-cyan-400 transition-all duration-200 shadow-lg",
          icon && "pl-10",
          "hover:border-cyan-500/70 hover:bg-slate-800",
          "touch-manipulation", // Better mobile touch handling
          "text-base", // Prevent zoom on iOS
          "h-12 md:h-11", // Larger on mobile
          error && "border-red-500/50 focus-visible:border-red-500 focus-visible:ring-red-500/50",
          className
        )}
        style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px' }} // Prevent iOS zoom
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

// Profile View Modal Component
const ProfileViewModal = ({ 
  user, 
  isOpen, 
  onClose 
}: { 
  user: UserForCollaboration | null; 
  isOpen: boolean; 
  onClose: () => void; 
}) => {
  if (!isOpen || !user) return null;

  const getStatusColor = () => {
    switch (user.presenceStatus) {
      case 'online':
        return 'bg-green-500 shadow-green-500/50';
      case 'away':
        return 'bg-yellow-500 shadow-yellow-500/50';
      case 'busy':
        return 'bg-red-500 shadow-red-500/50';
      default:
        return 'bg-slate-500';
    }
  };

  const getConnectionStatusBadge = () => {
    switch (user.connectionStatus) {
      case 'accepted':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
            <UserCheck className="size-4 text-green-400" />
            <span className="text-green-300 text-sm font-medium">Connected</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/30">
            <Clock className="size-4 text-yellow-400" />
            <span className="text-yellow-300 text-sm font-medium">Pending</span>
          </div>
        );
      case 'blocked':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
            <UserX className="size-4 text-red-400" />
            <span className="text-red-300 text-sm font-medium">Blocked</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/20 border border-slate-500/30">
            <User className="size-4 text-slate-400" />
            <span className="text-slate-300 text-sm font-medium">Not Connected</span>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-md bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <X className="size-5" />
          </button>

          {/* Cover Photo Area */}
          <div className="relative h-32 bg-gradient-to-r from-cyan-500/20 to-purple-500/20">
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            
            {/* Profile Picture */}
            <div className="absolute -bottom-12 left-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-slate-900 shadow-xl overflow-hidden">
                  {user.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt={user.fullName + "'s avatar"}
                      className="w-full h-full object-cover rounded-full"
                      onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR; }}
                    />
                  ) : (
                    <img
                      src={DEFAULT_AVATAR}
                      alt="Default avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                  )}
                </div>
                {/* Status Indicator */}
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-slate-900",
                  getStatusColor()
                )} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="pt-16 p-6 space-y-6">
            {/* User Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{user.fullName}</h2>
                  <p className="text-slate-400 text-sm">{user.email}</p>
                </div>
                {getConnectionStatusBadge()}
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 text-sm">
                <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
                <span className="text-slate-300 capitalize">{user.presenceStatus}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">
                  Last seen {new Date(user.lastSeen).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white">About</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{user.bio}</p>
              </div>
            )}

            {/* Location */}
            {user.location && (
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-slate-400" />
                <span className="text-slate-300 text-sm">{user.location}</span>
              </div>
            )}

            {/* Interests */}
            {user.interests.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-medium border border-cyan-500/30"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-700/50">
              <Button variant="primary" className="flex-1">
                <MessageSquare className="size-4 mr-2" />
                Message
              </Button>
              <Button variant="outline" className="flex-1">
                <UserPlus className="size-4 mr-2" />
                Connect
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Mobile-optimized Chat Room Item Component
const ChatRoomItem = ({ 
  room, 
  isActive, 
  onClick,
  isMobile = false
}: { 
  room: ChatRoom; 
  isActive: boolean; 
  onClick: () => void;
  isMobile?: boolean;
}) => {
  const getTypeIcon = () => {
    switch (room.type) {
      case 'direct':
        return <MessageCircle className="size-4" />;
      case 'group':
        return <Users className="size-4" />;
      case 'collaboration':
        return <Code className="size-4" />;
      default:
        return <MessageCircle className="size-4" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <motion.div
      whileHover={{ scale: isMobile ? 1 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl cursor-pointer transition-all duration-200 touch-manipulation",
        isMobile ? "p-4 min-h-[72px]" : "p-3", // Larger touch targets on mobile
        isActive 
          ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30" 
          : "hover:bg-white/10 border border-transparent"
      )}
    >
      {/* Room Icon */}
      <div className={cn(
        "flex items-center justify-center rounded-xl flex-shrink-0",
        isMobile ? "w-12 h-12" : "w-10 h-10",
        isActive ? "bg-cyan-500/30" : "bg-white/10"
      )}>
        {getTypeIcon()}
      </div>

      {/* Room Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className={cn(
            "font-semibold text-white truncate",
            isMobile ? "text-base" : "text-sm"
          )}>
            {room.name || 'Direct Message'}
          </h3>
          {room.latestMessage && (
            <span className={cn(
              "text-slate-400 flex-shrink-0 ml-2",
              isMobile ? "text-xs" : "text-xs"
            )}>
              {formatTime(room.latestMessage.createdAt)}
            </span>
          )}
        </div>
        
        {room.latestMessage && (
          <p className={cn(
            "text-slate-400 truncate",
            isMobile ? "text-sm mt-1" : "text-xs"
          )}>
            <span className="font-medium">{room.latestMessage.senderName}:</span> {room.latestMessage.content}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            {!room.isPrivate && <Globe className="size-3 text-slate-500" />}
            {room.isPrivate && <Lock className="size-3 text-slate-500" />}
            <span className="text-xs text-slate-500">
              {room.participantCount} member{room.participantCount !== 1 ? 's' : ''}
            </span>
          </div>
          
          {room.unreadCount > 0 && (
            <div className={cn(
              "bg-cyan-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-medium",
              isMobile && "min-w-[24px] h-6"
            )}>
              {room.unreadCount > 99 ? '99+' : room.unreadCount}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Mobile-optimized Message Component with real-time animations - UPDATED: No background for text messages
const MessageItem = ({ 
  message, 
  isOwn, 
  showSender = true,
  isMobile = false,
  isNew = false,
  onAvatarClick
}: { 
  message: ChatMessage; 
  isOwn: boolean; 
  showSender?: boolean;
  isMobile?: boolean;
  isNew?: boolean;
  onAvatarClick?: () => void;
}) => {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageTypeIcon = () => {
    switch (message.messageType) {
      case 'image':
        return <ImageIcon className="size-3" />;
      case 'file':
        return <File className="size-3" />;
      case 'code':
        return <Code className="size-3" />;
      case 'system':
        return <Settings className="size-3" />;
      default:
        return null;
    }
  };

  if (message.messageType === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-white/10 text-slate-300 text-sm px-4 py-2 rounded-full flex items-center gap-2 max-w-[85%] text-center">
          <Settings className="size-3 flex-shrink-0" />
          <span className="break-words">{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 20, scale: 0.95 } : { opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: isNew ? 0.4 : 0,
        ease: "easeOut",
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className={cn(
        "flex mb-6 animate-message-slide-in",
        isOwn ? "flex-row-reverse" : "flex-row",
        isMobile ? "gap-3 px-2" : "gap-4"
      )}
    >
      {/* Avatar */}
      {showSender && !isOwn && (
        <button
          onClick={onAvatarClick}
          className={cn(
            "rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 hover:scale-110 transition-transform duration-200 cursor-pointer bg-gradient-to-r from-cyan-500 to-blue-500",
            isMobile ? "w-10 h-10" : "w-10 h-10"
          )}
          style={{ padding: 0, overflow: 'hidden' }}
          aria-label={`View profile of ${message.senderName}`}
        >
          {message.senderPhoto ? (
            <img
              src={message.senderPhoto}
              alt={message.senderName + "'s avatar"}
              className="w-full h-full object-cover rounded-full"
              onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR; }}
            />
          ) : (
            <img
              src={DEFAULT_AVATAR}
              alt="Default avatar"
              className="w-full h-full object-cover rounded-full"
            />
          )}
        </button>
      )}

      {/* Message Content */}
      <div className={cn(
        "space-y-2",
        isMobile ? "max-w-[85%]" : "max-w-[75%]",
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Sender Name */}
        {showSender && !isOwn && (
          <button
            onClick={onAvatarClick}
            className="text-sm text-slate-400 font-medium px-1 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            {message.senderName}
          </button>
        )}

        {/* Reply Context */}
        {message.replyTo && message.replyContent && (
          <div className="bg-white/5 border-l-2 border-cyan-500 pl-3 py-2 rounded-r-lg max-w-full">
            <p className="text-xs text-slate-400 truncate">
              {message.replyContent}
            </p>
          </div>
        )}

        {/* Message Content - UPDATED: No background, just white text */}
        <motion.div 
          initial={isNew ? { scale: 0.9 } : { scale: 1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: isNew ? 0.1 : 0 }}
          className={cn(
            "break-words message-bubble",
            isMobile ? "py-2 text-base leading-relaxed" : "py-2 text-sm",
            // Removed all background styling - just text now
            isOwn ? "text-right" : "text-left"
          )}
        >
          <div className={cn(
            "flex items-start gap-2",
            isOwn ? "justify-end" : "justify-start"
          )}>
            {!isOwn && getMessageTypeIcon()}
            <p className={cn(
              "break-words flex-1 whitespace-pre-wrap chat-message text-white",
              isOwn ? "text-right" : "text-left"
            )}>
              {message.content}
            </p>
            {isOwn && getMessageTypeIcon()}
          </div>
        </motion.div>

        {/* Message Time */}
        <div className={cn(
          "text-xs text-slate-500 flex items-center gap-1 px-1",
          isOwn ? "justify-end" : "justify-start"
        )}>
          <span>{formatTime(message.createdAt)}</span>
          {message.editedAt && (
            <span className="text-slate-600">(edited)</span>
          )}
          {isOwn && (
            <CheckCircle className="size-3 text-cyan-400" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Mobile-optimized User Search Item Component
const UserSearchItem = ({ 
  user, 
  onConnect, 
  onMessage,
  onConnectionResponse,
  onProfileClick,
  isMobile = false
}: { 
  user: UserForCollaboration; 
  onConnect: () => void; 
  onMessage: () => void;
  onConnectionResponse?: (response: 'accepted' | 'declined') => void;
  onProfileClick?: () => void;
  isMobile?: boolean;
}) => {
  const getStatusColor = () => {
    switch (user.presenceStatus) {
      case 'online':
        return 'bg-green-500 connection-status-online';
      case 'away':
        return 'bg-yellow-500 connection-status-away';
      case 'busy':
        return 'bg-red-500 connection-status-busy';
      default:
        return 'bg-slate-500 connection-status-offline';
    }
  };

  const getConnectionButton = () => {
    switch (user.connectionStatus) {
      case 'none':
        return (
          <Button size={isMobile ? "sm" : "xs"} variant="primary" onClick={onConnect}>
            <UserPlus className="size-4 mr-1" />
            {!isMobile && "Connect"}
          </Button>
        );
      case 'pending':
        return (
          <div className="flex gap-1">
            {onConnectionResponse && (
              <>
                <Button size="xs" variant="success" onClick={() => onConnectionResponse('accepted')}>
                  <Check className="size-4" />
                </Button>
                <Button size="xs" variant="danger" onClick={() => onConnectionResponse('declined')}>
                  <X className="size-4" />
                </Button>
              </>
            )}
            <Button size={isMobile ? "sm" : "xs"} variant="secondary" disabled>
              <Clock className="size-4 mr-1" />
              {!isMobile && "Pending"}
            </Button>
          </div>
        );
      case 'accepted':
        return (
          <Button size={isMobile ? "sm" : "xs"} variant="success" disabled>
            <UserCheck className="size-4 mr-1" />
            {!isMobile && "Connected"}
          </Button>
        );
      case 'declined':
        return (
          <Button size={isMobile ? "sm" : "xs"} variant="outline" onClick={onConnect}>
            <UserPlus className="size-4 mr-1" />
            {!isMobile && "Retry"}
          </Button>
        );
      case 'blocked':
        return (
          <Button size={isMobile ? "sm" : "xs"} variant="danger" disabled>
            <UserX className="size-4 mr-1" />
            {!isMobile && "Blocked"}
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 touch-manipulation interactive-hover",
        isMobile ? "p-4 min-h-[80px]" : "p-4"
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <button
          onClick={onProfileClick}
          className={cn(
            "rounded-full flex items-center justify-center text-white font-semibold hover:scale-110 transition-transform duration-200 cursor-pointer bg-gradient-to-r from-cyan-500 to-blue-500",
            isMobile ? "w-14 h-14 text-lg" : "w-12 h-12"
          )}
          style={{ padding: 0, overflow: 'hidden' }}
          aria-label={`View profile of ${user.fullName}`}
        >
          {user.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt={user.fullName + "'s avatar"}
              className="w-full h-full object-cover rounded-full"
              onError={e => { (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR; }}
            />
          ) : (
            <img
              src={DEFAULT_AVATAR}
              alt="Default avatar"
              className="w-full h-full object-cover rounded-full"
            />
          )}
        </button>
        <div className={cn(
          "absolute -bottom-1 -right-1 rounded-full border-2 border-slate-900",
          isMobile ? "w-5 h-5" : "w-4 h-4",
          getStatusColor()
        )} />
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <button
          onClick={onProfileClick}
          className={cn(
            "font-semibold text-white truncate hover:text-cyan-400 transition-colors cursor-pointer text-left block",
            isMobile ? "text-lg" : "text-base"
          )}
        >
          {user.fullName}
        </button>
        <p className={cn(
          "text-slate-400 truncate",
          isMobile ? "text-sm" : "text-xs"
        )}>
          {user.bio}
        </p>
        
        <div className={cn(
          "flex items-center gap-4 mt-2 text-slate-500",
          isMobile ? "text-sm" : "text-xs"
        )}>
          {user.location && (
            <div className="flex items-center gap-1">
              <MapPin className="size-3" />
              <span className="truncate max-w-[100px]">{user.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="size-3" />
            <span className="capitalize">{user.presenceStatus}</span>
          </div>
        </div>

        {/* Interests */}
        {user.interests.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {user.interests.slice(0, isMobile ? 2 : 3).map((interest, index) => (
              <span
                key={index}
                className={cn(
                  "px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded-full",
                  isMobile ? "text-xs" : "text-xs"
                )}
              >
                {interest}
              </span>
            ))}
            {user.interests.length > (isMobile ? 2 : 3) && (
              <span className={cn(
                "px-2 py-1 bg-slate-500/20 text-slate-400 rounded-full",
                isMobile ? "text-xs" : "text-xs"
              )}>
                +{user.interests.length - (isMobile ? 2 : 3)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={cn(
        "flex gap-2 flex-shrink-0",
        isMobile ? "flex-col" : "flex-row"
      )}>
        {user.connectionStatus === 'accepted' && (
          <Button size={isMobile ? "sm" : "xs"} variant="outline" onClick={onMessage}>
            <MessageSquare className="size-4" />
          </Button>
        )}
        {getConnectionButton()}
      </div>
    </motion.div>
  );
};

// Mobile-optimized Connection Item Component
const ConnectionItem = ({ 
  connection, 
  onMessage, 
  onRespond,
  isMobile = false
}: { 
  connection: UserConnection; 
  onMessage: () => void; 
  onRespond?: (response: 'accepted' | 'declined') => void;
  isMobile?: boolean;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 touch-manipulation interactive-hover",
        isMobile ? "p-4 min-h-[80px]" : "p-4"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0",
        isMobile ? "w-14 h-14 text-lg" : "w-12 h-12"
      )}>
        {connection.otherUserName.charAt(0).toUpperCase()}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          "font-semibold text-white truncate",
          isMobile ? "text-lg" : "text-base"
        )}>
          {connection.otherUserName}
        </h3>
        <div className={cn(
          "flex items-center gap-2 text-slate-400",
          isMobile ? "text-sm" : "text-xs"
        )}>
          <span className="capitalize">{connection.connectionType}</span>
          <span>•</span>
          <span className="capitalize">{connection.status}</span>
          {!connection.isRequester && connection.status === 'pending' && (
            <>
              <span>•</span>
              <span className="text-cyan-400">Wants to connect</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={cn(
        "flex gap-2 flex-shrink-0",
        isMobile ? "flex-col" : "flex-row"
      )}>
        {connection.status === 'accepted' && (
          <Button size={isMobile ? "sm" : "xs"} variant="outline" onClick={onMessage}>
            <MessageSquare className="size-4" />
          </Button>
        )}
        
        {!connection.isRequester && connection.status === 'pending' && onRespond && (
          <>
            <Button size={isMobile ? "sm" : "xs"} variant="success" onClick={() => onRespond('accepted')}>
              <Check className="size-4" />
            </Button>
            <Button size={isMobile ? "sm" : "xs"} variant="danger" onClick={() => onRespond('declined')}>
              <X className="size-4" />
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
};

// Enhanced Typing Indicator Component
const TypingIndicator = ({ typingUsers, isMobile = false }: { typingUsers: string[]; isMobile?: boolean }) => {
  if (typingUsers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cn("px-4 pb-2", isMobile && "px-3")}
    >
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-cyan-400 rounded-full typing-dot" />
          <div className="w-2 h-2 bg-cyan-400 rounded-full typing-dot" />
          <div className="w-2 h-2 bg-cyan-400 rounded-full typing-dot" />
        </div>
        <span>
          {typingUsers.length === 1 
            ? `${typingUsers[0]} is typing...`
            : `${typingUsers.length} users are typing...`
          }
        </span>
      </div>
    </motion.div>
  );
};

// Main Chat Component with enhanced real-time messaging
export const Chat: React.FC = () => {
  const [, setScreenState] = useAtom(screenAtom);
  const [activeTab, setActiveTab] = useState<'chats' | 'users' | 'connections'>('chats');
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<UserForCollaboration | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Hooks
  const { isAuthenticated, isLoading } = useAuthGuard({
    showAuthModal: true,
    redirectTo: "auth"
  });

  const {
    chatRooms,
    loadingRooms,
    errorRooms,
    currentRoomId,
    currentRoomMessages,
    loadingMessages,
    errorMessages,
    setCurrentRoom,
    sendMessage,
    createDirectMessage,
    createGroupChat,
    markAsRead,
    isConnected,
    typingUsers,
    sendTyping,
    loadChatRooms,
  } = useChat();

  const {
    users,
    loading: loadingUsers,
    error: errorUsers,
    searchTerm,
    setSearchTerm,
    sendConnectionRequest,
    createDirectMessage: createDMFromSearch,
  } = useUserSearch();

  const { user } = useAuthContext();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load connections
  const loadConnections = async () => {
    setLoadingConnections(true);
    try {
      const userConnections = await chatService.getUserConnections();
      setConnections(userConnections);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoadingConnections(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive with smooth animation
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [currentRoomMessages]);

  // Track new messages for animation
  useEffect(() => {
    if (currentRoomMessages.length > 0) {
      const latestMessage = currentRoomMessages[currentRoomMessages.length - 1];
      const messageAge = Date.now() - new Date(latestMessage.createdAt).getTime();
      
      // Consider messages newer than 5 seconds as "new"
      if (messageAge < 5000) {
        setNewMessageIds(prev => new Set([...prev, latestMessage.id]));
        
        // Remove from new messages after animation
        setTimeout(() => {
          setNewMessageIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(latestMessage.id);
            return newSet;
          });
        }, 1000);
      }
    }
  }, [currentRoomMessages]);

  // Load connections when tab changes
  useEffect(() => {
    if (activeTab === 'connections') {
      loadConnections();
    }
  }, [activeTab]);

  // Close sidebar on mobile when room is selected
  useEffect(() => {
    if (isMobile && currentRoomId) {
      setIsSidebarOpen(false);
    }
  }, [currentRoomId, isMobile]);

  // Handle typing indicators with debouncing
  useEffect(() => {
    if (isTyping) {
      sendTyping(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTyping(false);
      }, 1000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, sendTyping]);

  // Handle message input change with typing detection
  const handleMessageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
    } else if (isTyping && e.target.value.length === 0) {
      setIsTyping(false);
      sendTyping(false);
    }
  };

  // Enhanced send message with optimistic updates
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !currentRoomId) return;

    const messageContent = messageInput.trim();
    
    // Clear input immediately for better UX
    setMessageInput('');
    setIsTyping(false);
    sendTyping(false);

    try {
      await sendMessage(messageContent);
      messageInputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message on error
      setMessageInput(messageContent);
      alert(error instanceof Error ? error.message : 'Failed to send message');
    }
  };

  // Handle user connection
  const handleConnectUser = async (user: UserForCollaboration) => {
    try {
      await sendConnectionRequest(user.userId, 'collaborate');
    } catch (error) {
      console.error('Failed to send connection request:', error);
      alert(error instanceof Error ? error.message : 'Failed to send connection request');
    }
  };

  // Handle create DM from user search
  const handleMessageUser = async (user: UserForCollaboration) => {
    try {
      const roomId = await chatService.getOrCreateDMRoom(user.userId);
      setCurrentRoom(roomId);
      setActiveTab('chats');
      await loadChatRooms();
    } catch (error) {
      console.error('Failed to create DM:', error);
      alert(error instanceof Error ? error.message : 'Failed to create chat');
    }
  };

  // Handle connection response
  const handleConnectionResponse = async (connectionId: string, response: 'accepted' | 'declined') => {
    try {
      await chatService.respondToConnectionRequest(connectionId, response);
      await loadConnections();
      await loadChatRooms();
    } catch (error) {
      console.error('Failed to respond to connection:', error);
      alert(error instanceof Error ? error.message : 'Failed to respond to connection');
    }
  };

  // Handle message connection
  const handleMessageConnection = async (connection: UserConnection) => {
    try {
      const roomId = await chatService.getOrCreateDMRoom(connection.otherUserId);
      setCurrentRoom(roomId);
      setActiveTab('chats');
      await loadChatRooms();
    } catch (error) {
      console.error('Failed to create DM:', error);
      alert(error instanceof Error ? error.message : 'Failed to create chat');
    }
  };

  // Handle profile view
  const handleProfileClick = (user: UserForCollaboration) => {
    setSelectedUser(user);
    setIsProfileModalOpen(true);
  };

  // Handle close chat
  const handleClose = () => {
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm chat-container">
      <div className="flex h-full max-w-7xl mx-auto relative">
        
        {/* Mobile Overlay */}
        {isMobile && isSidebarOpen && (
          <div 
            className="absolute inset-0 bg-black/50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={cn(
          "bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-r border-slate-700/50 flex flex-col transition-all duration-300 z-50 chat-sidebar",
          isMobile 
            ? cn(
                "absolute left-0 top-0 h-full",
                isSidebarOpen ? "w-80 translate-x-0" : "w-0 -translate-x-full"
              )
            : "w-80 relative"
        )}>
          
          {/* Header */}
          <div className="p-4 border-b border-slate-700/50 flex-shrink-0 chat-header">
            <div className="flex items-center justify-between mb-4">
              <h1 className={cn(
                "font-bold text-white",
                isMobile ? "text-lg" : "text-xl"
              )}>
                Collaboration Hub
              </h1>
              {/* Close button for mobile sidebar */}
              {isMobile && (
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="flex-shrink-0">
                  <X className="size-5" />
                </Button>
              )}
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-white/10 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('chats')}
                className={cn(
                  "flex-1 py-2 px-2 rounded-lg font-medium transition-all duration-200 text-center",
                  isMobile ? "text-xs" : "text-sm",
                  activeTab === 'chats'
                    ? "bg-cyan-500 text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <MessageCircle className="size-4 inline mr-1" />
                Chats
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={cn(
                  "flex-1 py-2 px-2 rounded-lg font-medium transition-all duration-200 text-center",
                  isMobile ? "text-xs" : "text-sm",
                  activeTab === 'users'
                    ? "bg-cyan-500 text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Users className="size-4 inline mr-1" />
                Users
              </button>
              <button
                onClick={() => setActiveTab('connections')}
                className={cn(
                  "flex-1 py-2 px-2 rounded-lg font-medium transition-all duration-200 text-center",
                  isMobile ? "text-xs" : "text-sm",
                  activeTab === 'connections'
                    ? "bg-cyan-500 text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <UserCheck className="size-4 inline mr-1" />
                Connect
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'chats' ? (
                <motion.div
                  key="chats"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex flex-col"
                >
                  {/* Search */}
                  <div className="p-4 flex-shrink-0">
                    <Input
                      placeholder="Search chats..."
                      icon={<Search className="size-4" />}
                      fullWidth
                    />
                  </div>

                  {/* Chat Rooms List */}
                  <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4 hide-scrollbar">
                    {loadingRooms ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="size-6 animate-spin text-cyan-400" />
                      </div>
                    ) : errorRooms ? (
                      <div className="text-center py-8 text-red-400">
                        <AlertCircle className="size-6 mx-auto mb-2" />
                        <p className="text-sm">{errorRooms}</p>
                      </div>
                    ) : chatRooms.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <MessageCircle className="size-12 mx-auto mb-4 opacity-50" />
                        <p className={isMobile ? "text-base" : "text-sm"}>No chats yet</p>
                        <p className={isMobile ? "text-sm" : "text-xs"}>Start by connecting with users!</p>
                      </div>
                    ) : (
                      chatRooms.map((room) => (
                        <ChatRoomItem
                          key={room.id}
                          room={room}
                          isActive={currentRoomId === room.id}
                          onClick={() => setCurrentRoom(room.id)}
                          isMobile={isMobile}
                        />
                      ))
                    )}
                  </div>
                </motion.div>
              ) : activeTab === 'users' ? (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="h-full flex flex-col"
                >
                  {/* Search */}
                  <div className="p-4 flex-shrink-0">
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      icon={<Search className="size-4" />}
                      fullWidth
                    />
                  </div>

                  {/* Users List */}
                  <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4 hide-scrollbar">
                    {loadingUsers ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="size-6 animate-spin text-cyan-400" />
                      </div>
                    ) : errorUsers ? (
                      <div className="text-center py-8 text-red-400">
                        <AlertCircle className="size-6 mx-auto mb-2" />
                        <p className="text-sm">{errorUsers}</p>
                      </div>
                    ) : users.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <Users className="size-12 mx-auto mb-4 opacity-50" />
                        <p className={isMobile ? "text-base" : "text-sm"}>No users found</p>
                        <p className={isMobile ? "text-sm" : "text-xs"}>Try a different search term</p>
                      </div>
                    ) : (
                      users.map((user) => (
                        <UserSearchItem
                          key={user.userId}
                          user={user}
                          onConnect={() => handleConnectUser(user)}
                          onMessage={() => handleMessageUser(user)}
                          onProfileClick={() => handleProfileClick(user)}
                          isMobile={isMobile}
                        />
                      ))
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="connections"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="h-full flex flex-col"
                >
                  {/* Header */}
                  <div className="p-4 flex-shrink-0">
                    <h2 className={cn(
                      "font-semibold text-white mb-2",
                      isMobile ? "text-base" : "text-lg"
                    )}>
                      Your Connections
                    </h2>
                    <p className={cn(
                      "text-slate-400",
                      isMobile ? "text-xs" : "text-sm"
                    )}>
                      Manage your connections and requests
                    </p>
                  </div>

                  {/* Connections List */}
                  <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4 hide-scrollbar">
                    {loadingConnections ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="size-6 animate-spin text-cyan-400" />
                      </div>
                    ) : connections.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <UserCheck className="size-12 mx-auto mb-4 opacity-50" />
                        <p className={isMobile ? "text-base" : "text-sm"}>No connections yet</p>
                        <p className={isMobile ? "text-sm" : "text-xs"}>Start connecting with users!</p>
                      </div>
                    ) : (
                      connections.map((connection) => (
                        <ConnectionItem
                          key={connection.id}
                          connection={connection}
                          onMessage={() => handleMessageConnection(connection)}
                          onRespond={(response) => handleConnectionResponse(connection.id, response)}
                          isMobile={isMobile}
                        />
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl">
          
          {/* Persistent Main Chat Header */}
          <div className="sticky top-0 z-30 p-4 border-b border-slate-700/50 flex items-center justify-between flex-shrink-0 chat-header bg-slate-900/95 backdrop-blur shadow-md min-h-[64px]">
            {currentRoomId ? (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                  <MessageCircle className="size-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2
                    className="font-semibold text-white truncate max-w-xs md:max-w-md lg:max-w-xl"
                    title={chatRooms.find(r => r.id === currentRoomId)?.name || 'Chat Room'}
                  >
                    {chatRooms.find(r => r.id === currentRoomId)?.name || 'Chat Room'}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isConnected ? "bg-green-500" : "bg-red-500"
                    )} />
                    {isConnected ? 'Connected' : 'Connecting...'}
                    {typingUsers.length > 0 && (
                      <span className="text-cyan-400">
                        • {typingUsers.length} typing...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                  <MessageCircle className="size-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-white truncate max-w-xs md:max-w-md lg:max-w-xl" title="Collaboration Hub">
                    Collaboration Hub
                  </h2>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              {currentRoomId && (
                <Button variant="ghost" size="icon" aria-label="More options">
                  <MoreVertical className="size-5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Close chat">
                <X className="size-5" />
              </Button>
            </div>
          </div>
          
          {currentRoomId ? (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-cyan-400" />
                  </div>
                ) : errorMessages ? (
                  <div className="text-center py-8 text-red-400">
                    <AlertCircle className="size-6 mx-auto mb-2" />
                    <p className="text-sm">{errorMessages}</p>
                  </div>
                ) : currentRoomMessages.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <MessageCircle className="size-12 mx-auto mb-4 opacity-50" />
                    <p className={isMobile ? "text-base" : "text-sm"}>No messages yet</p>
                    <p className={isMobile ? "text-sm" : "text-xs"}>Start the conversation!</p>
                  </div>
                ) : (
                  <List
                    height={window.innerHeight - 300}
                    itemCount={currentRoomMessages.length}
                    itemSize={72}
                    width={'100%'}
                    itemData={{
                      messages: currentRoomMessages,
                      user,
                      newMessageIds,
                      isMobile,
                      handleProfileClick,
                    }}
                    overscanCount={5}
                  >
                    {(props: ListChildComponentProps) => {
                      const { index, style, data } = props;
                      const { messages, user, newMessageIds, isMobile, handleProfileClick } = data;
                      const message = messages[index];
                      const isOwn = user && message.senderId === user.id;
                      const showSender = index === 0 || messages[index - 1].senderId !== message.senderId;
                      const isNew = newMessageIds.has(message.id);
                      return (
                        <div style={style} key={message.id}>
                          <MessageItem
                            message={message}
                            isOwn={isOwn}
                            showSender={showSender}
                            isMobile={isMobile}
                            isNew={isNew}
                            onAvatarClick={() => {
                              const userObj: UserForCollaboration = {
                                userId: message.senderId,
                                fullName: message.senderName,
                                email: '',
                                bio: '',
                                profilePhoto: message.senderPhoto,
                                location: '',
                                interests: [],
                                connectionStatus: 'none',
                                lastSeen: message.createdAt,
                                presenceStatus: 'offline',
                              };
                              handleProfileClick(userObj);
                            }}
                          />
                        </div>
                      );
                    }}
                  </List>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing Indicator */}
              <AnimatePresence>
                {typingUsers.length > 0 && (
                  <TypingIndicator typingUsers={typingUsers} isMobile={isMobile} />
                )}
              </AnimatePresence>

              {/* Enhanced Message Input */}
              <div className={cn(
                "border-t border-slate-700/50 flex-shrink-0 safe-area-inset-bottom message-input-container",
                isMobile ? "p-3" : "p-4"
              )}>
                <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                  <div className="flex-1 relative">
                    <Input
                      ref={messageInputRef}
                      value={messageInput}
                      onChange={handleMessageInputChange}
                      placeholder="Type a message..."
                      className={cn(
                        "pr-12 resize-none message-input",
                        isMobile && "min-h-[48px]" // Larger on mobile
                      )}
                      fullWidth
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                    >
                      <Smile className="size-4" />
                    </Button>
                  </div>
                  
                  {/* Send Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="icon"
                    disabled={!messageInput.trim()}
                    className="flex-shrink-0"
                  >
                    <Send className="size-5" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            /* No Chat Selected */
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center space-y-4 max-w-md">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto">
                  <MessageCircle className="size-12 text-cyan-400" />
                </div>
                <div>
                  <h2 className={cn(
                    "font-bold text-white mb-2",
                    isMobile ? "text-xl" : "text-2xl"
                  )}>
                    Welcome to Collaboration Hub
                  </h2>
                  <p className={cn(
                    "text-slate-400",
                    isMobile ? "text-sm" : "text-base"
                  )}>
                    Select a chat to start messaging, or discover new users to collaborate with.
                  </p>
                </div>
                <div className={cn(
                  "flex gap-3 justify-center",
                  isMobile ? "flex-col" : "flex-row"
                )}>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setActiveTab('users');
                      if (isMobile) setIsSidebarOpen(true);
                    }}
                    fullWidth={isMobile}
                  >
                    <Users className="size-4 mr-2" />
                    Find Users
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveTab('chats');
                      if (isMobile) setIsSidebarOpen(true);
                    }}
                    fullWidth={isMobile}
                  >
                    <MessageCircle className="size-4 mr-2" />
                    View Chats
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile View Modal */}
      <ProfileViewModal
        user={selectedUser}
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
};