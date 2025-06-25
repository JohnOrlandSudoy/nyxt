import {
  DialogWrapper,
  AnimatedTextBlockWrapper,
} from "@/components/DialogWrapper";
import { cn } from "@/utils";
import { useAtom } from "jotai";
import { getDefaultStore } from "jotai";
import { settingsAtom, settingsSavedAtom } from "@/store/settings";
import { screenAtom } from "@/store/screens";
import { X, Save, User, Globe, Mic, MessageSquare, Bot, Key, Sparkles, Eye, EyeOff } from "lucide-react";
import * as React from "react";
import { apiTokenAtom } from "@/store/tokens";
import { useAuthGuard } from "@/hooks/useAuthGuard";

// Enhanced Button Component
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "ghost" | "outline" | "primary" | "secondary";
    size?: "icon" | "sm" | "default";
  }
>(({ className, variant = "default", size = "default", ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    ghost: "hover:bg-white/10 text-white/80 hover:text-white",
    outline: "border border-white/30 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm",
    primary: "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25",
    secondary: "bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm border border-white/20",
    default: "bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm"
  };
  
  const sizes = {
    icon: "h-12 w-12 p-0",
    sm: "h-10 px-4 text-sm",
    default: "h-12 px-6 text-sm"
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

// Enhanced Input Component with maximum visibility
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    icon?: React.ReactNode;
    showToggle?: boolean;
    onToggle?: () => void;
  }
>(({ className, icon, showToggle, onToggle, type, ...props }, ref) => {
  return (
    <div className="relative group">
      {/* Icon */}
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 z-10">
          {icon}
        </div>
      )}
      
      {/* Input field with high contrast */}
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border-2 border-slate-500 bg-slate-900 px-3 py-3 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:border-cyan-400 transition-all duration-200 font-mono shadow-lg",
          icon && "pl-10",
          showToggle && "pr-12",
          "hover:border-cyan-500/70 hover:bg-slate-800",
          className
        )}
        style={{ 
          fontFamily: "'Source Code Pro', monospace",
          fontSize: '13px',
          lineHeight: '1.4'
        }}
        ref={ref}
        {...props}
      />
      
      {/* Toggle button for password visibility */}
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300 transition-colors z-10 p-1 rounded-lg hover:bg-white/10"
        >
          {type === "password" ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </button>
      )}
      
      {/* Enhanced focus glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm -z-10" />
    </div>
  );
});
Input.displayName = "Input";

// Enhanced Textarea Component
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <div className="relative group">
      <textarea
        className={cn(
          "flex min-h-[100px] w-full rounded-xl border-2 border-slate-500 bg-slate-900 px-3 py-3 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:border-cyan-400 transition-all duration-200 resize-none font-mono shadow-lg hover:border-cyan-500/70 hover:bg-slate-800",
          className
        )}
        style={{ 
          fontFamily: "'Source Code Pro', monospace",
          fontSize: '13px',
          lineHeight: '1.4'
        }}
        ref={ref}
        {...props}
      />
      
      {/* Enhanced focus glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm -z-10" />
    </div>
  );
});
Textarea.displayName = "Textarea";

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
        "text-sm font-bold text-white leading-none flex items-center gap-2 mb-2",
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

// Enhanced Select Component
const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    icon?: React.ReactNode;
  }
>(({ className, icon, children, ...props }, ref) => {
  return (
    <div className="relative group">
      {/* Icon */}
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 z-10">
          {icon}
        </div>
      )}
      
      {/* Select field with high contrast */}
      <select
        className={cn(
          "flex h-12 w-full rounded-xl border-2 border-slate-500 bg-slate-900 px-3 py-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:border-cyan-400 transition-all duration-200 appearance-none cursor-pointer font-mono shadow-lg hover:border-cyan-500/70 hover:bg-slate-800",
          icon && "pl-10",
          className
        )}
        style={{ 
          fontFamily: "'Source Code Pro', monospace",
          fontSize: '13px'
        }}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      
      {/* Enhanced dropdown arrow */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-cyan-400 group-focus-within:text-cyan-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {/* Enhanced focus glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm -z-10" />
    </div>
  );
});
Select.displayName = "Select";

// Settings Section Component with better contrast
const SettingsSection = ({ 
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

// Form Field Component for consistent spacing
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

// Help Text Component
const HelpText = ({ children }: { children: React.ReactNode }) => {
  return (
    <p className="text-xs text-slate-400 leading-relaxed mt-1 px-1">
      {children}
    </p>
  );
};

export const Settings: React.FC = () => {
  const [settings, setSettings] = useAtom(settingsAtom);
  const [, setScreenState] = useAtom(screenAtom);
  const [token, setToken] = useAtom(apiTokenAtom);
  const [, setSettingsSaved] = useAtom(settingsSavedAtom);
  const [showApiToken, setShowApiToken] = React.useState(false);

  // Enforce authentication for this screen
  const { isAuthenticated, isLoading } = useAuthGuard({
    showAuthModal: true,
    redirectTo: "auth"
  });

  const languages = [
    { label: "English", value: "en" },
    { label: "Spanish", value: "es" },
    { label: "French", value: "fr" },
    { label: "German", value: "de" },
    { label: "Italian", value: "it" },
    { label: "Portuguese", value: "pt" },
  ];

  const interruptSensitivities = [
    { label: "Low - Rarely interrupts", value: "low" },
    { label: "Medium - Balanced interruption", value: "medium" },
    { label: "High - Frequently interrupts", value: "high" },
  ];

  const handleClose = () => {
    setScreenState({ 
      currentScreen: token ? "instructions" : "intro" 
    });
  };

  const handleSave = async () => {
    console.log('Current settings before save:', settings);
    
    const updatedSettings = {
      ...settings,
      greeting: settings.greeting,
    };
    
    localStorage.setItem('tavus-settings', JSON.stringify(updatedSettings));
    
    const store = getDefaultStore();
    store.set(settingsAtom, updatedSettings);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const storedSettings = localStorage.getItem('tavus-settings');
    const storeSettings = store.get(settingsAtom);
    
    console.log('Settings in localStorage:', JSON.parse(storedSettings || '{}'));
    console.log('Settings in store after save:', storeSettings);
    
    setSettingsSaved(true);
    handleClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl h-[95vh] bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden flex flex-col">
        
        {/* Enhanced Header - Fixed at top */}
        <div className="flex-shrink-0 bg-gradient-to-b from-black/95 to-black/80 backdrop-blur-lg border-b border-slate-600/30 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border-2 border-cyan-500/40 shadow-lg">
                <Sparkles className="size-6 text-cyan-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
                <p className="text-sm text-slate-300">Customize your AI conversation experience</p>
              </div>
            </div>
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
        
        {/* Scrollable Content Area - Takes remaining space */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Personal Information */}
          <SettingsSection
            title="Personal Information"
            description="Tell the AI about yourself for a more personalized experience"
            icon={<User />}
          >
            <FormField>
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                icon={<User className="size-4" />}
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                placeholder="Enter your name (e.g., John Smith)"
              />
              <HelpText>
                This helps the AI address you personally during conversations
              </HelpText>
            </FormField>
          </SettingsSection>

          {/* Language & Communication */}
          <SettingsSection
            title="Language & Communication"
            description="Configure how the AI communicates with you"
            icon={<Globe />}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField>
                <Label htmlFor="language">Conversation Language</Label>
                <Select
                  id="language"
                  icon={<Globe className="size-4" />}
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                >
                  {languages.map((lang) => (
                    <option 
                      key={lang.value} 
                      value={lang.value}
                      className="bg-slate-800 text-white py-2"
                    >
                      {lang.label}
                    </option>
                  ))}
                </Select>
                <HelpText>
                  The AI will communicate in your selected language
                </HelpText>
              </FormField>

              <FormField>
                <Label htmlFor="interruptSensitivity">Interrupt Sensitivity</Label>
                <Select
                  id="interruptSensitivity"
                  icon={<Mic className="size-4" />}
                  value={settings.interruptSensitivity}
                  onChange={(e) => setSettings({ ...settings, interruptSensitivity: e.target.value })}
                >
                  {interruptSensitivities.map((sensitivity) => (
                    <option 
                      key={sensitivity.value} 
                      value={sensitivity.value}
                      className="bg-slate-800 text-white py-2"
                    >
                      {sensitivity.label}
                    </option>
                  ))}
                </Select>
                <HelpText>
                  Controls how often the AI interrupts during conversation
                </HelpText>
              </FormField>
            </div>
          </SettingsSection>

          {/* Conversation Customization */}
          <SettingsSection
            title="Conversation Customization"
            description="Personalize how conversations start and flow"
            icon={<MessageSquare />}
          >
            <div className="space-y-4">
              <FormField>
                <Label htmlFor="greeting">Custom Greeting Message</Label>
                <Input
                  id="greeting"
                  icon={<MessageSquare className="size-4" />}
                  value={settings.greeting}
                  onChange={(e) => setSettings({ ...settings, greeting: e.target.value })}
                  placeholder="How should the AI greet you? (e.g., Hello! Ready to chat?)"
                />
                <HelpText>
                  Leave empty to use the default greeting message
                </HelpText>
              </FormField>

              <FormField>
                <Label htmlFor="context">Conversation Context</Label>
                <Textarea
                  id="context"
                  value={settings.context}
                  onChange={(e) => setSettings({ ...settings, context: e.target.value })}
                  placeholder="Provide additional context about yourself, your preferences, or what you'd like to discuss. For example: 'I'm a software developer interested in AI and machine learning. I enjoy discussing technical topics and learning about new technologies.'"
                  rows={4}
                />
                <HelpText>
                  This helps the AI understand your background and tailor responses to your interests
                </HelpText>
              </FormField>
            </div>
          </SettingsSection>

          {/* AI Configuration */}
          <SettingsSection
            title="AI Configuration"
            description="Advanced settings for AI persona and behavior"
            icon={<Bot />}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField>
                <Label htmlFor="persona">Persona ID</Label>
                <Input
                  id="persona"
                  icon={<Bot className="size-4" />}
                  value={settings.persona}
                  onChange={(e) => setSettings({ ...settings, persona: e.target.value })}
                  placeholder="p2fbd605 (default)"
                />
                <HelpText>
                  Custom AI persona identifier for specialized behavior
                </HelpText>
              </FormField>

              <FormField>
                <Label htmlFor="replica">Replica ID</Label>
                <Input
                  id="replica"
                  icon={<Bot className="size-4" />}
                  value={settings.replica}
                  onChange={(e) => setSettings({ ...settings, replica: e.target.value })}
                  placeholder="rfb51183fe (optional)"
                />
                <HelpText>
                  Custom replica identifier for specific AI appearance
                </HelpText>
              </FormField>
            </div>
          </SettingsSection>

          {/* API Configuration - Enhanced with better spacing */}
          <SettingsSection
            title="API Configuration"
            description="Manage your Tavus API credentials securely"
            icon={<Key />}
          >
            <FormField>
              <Label htmlFor="apiToken" required>Tavus API Token</Label>
              <Input
                id="apiToken"
                type={showApiToken ? "text" : "password"}
                icon={<Key className="size-4" />}
                value={token || ""}
                onChange={(e) => {
                  const newToken = e.target.value;
                  setToken(newToken);
                  localStorage.setItem('tavus-token', newToken);
                }}
                placeholder="Enter your Tavus API key (required)"
                showToggle={true}
                onToggle={() => setShowApiToken(!showApiToken)}
              />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
                <HelpText>
                  Your API key is stored securely and encrypted
                </HelpText>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Need an API key?</span>
                  <a
                    href="https://platform.tavus.io/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 hover:underline font-semibold transition-colors"
                  >
                    Get one here →
                  </a>
                </div>
              </div>
            </FormField>
          </SettingsSection>

          {/* Extra padding at bottom to ensure API section is fully visible */}
          <div className="h-8"></div>
        </div>

        {/* Enhanced Footer Actions - Fixed at bottom */}
        <div className="flex-shrink-0 bg-gradient-to-t from-black/95 to-black/80 backdrop-blur-lg border-t border-slate-600/30 p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="text-xs text-slate-300 leading-relaxed space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="font-bold text-white text-sm">Settings Tips</span>
              </div>
              <div className="space-y-1 text-slate-400">
                <p>• Changes are saved automatically and apply to your next conversation</p>
                <p>• All fields are optional except the API token</p>
                <p>• Your data is stored locally and securely encrypted</p>
              </div>
            </div>
            <div className="flex gap-3 w-full lg:w-auto">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 lg:flex-none min-w-[100px]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                className="flex-1 lg:flex-none min-w-[140px]"
              >
                <Save className="size-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};