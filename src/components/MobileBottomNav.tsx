import { useAtom } from 'jotai';
import { screenAtom } from '@/store/screens';
import { cn } from '@/utils';
import { MessageCircle, Users, UserCheck } from 'lucide-react';
import { chatTabAtom } from '@/store/chat';

// Mobile Bottom Navigation
const MobileBottomNav = () => {
  const [activeTab, setActiveTab] = useAtom(chatTabAtom);
  const [, setScreen] = useAtom(screenAtom);

  const navItems = [
    { id: 'chats', label: 'Chats', icon: MessageCircle },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'connections', label: 'Connect', icon: UserCheck },
  ];

  const handleTabClick = (tab: 'chats' | 'users' | 'connections') => {
    setActiveTab(tab);
    setScreen({ currentScreen: 'chat' });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-slate-900/80 backdrop-blur-lg border-t border-slate-700/50 z-[60] lg:hidden safe-area-inset-bottom">
      <div className="flex justify-around items-center h-full max-w-7xl mx-auto px-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id as 'chats' | 'users' | 'connections')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-24 h-full rounded-lg transition-all duration-200",
              activeTab === item.id ? "text-cyan-400" : "text-slate-400 hover:bg-white/5"
            )}
            aria-label={item.label}
          >
            <item.icon className="size-6 mb-0.5" />
            <span className={cn(
              "text-xs font-medium tracking-tight",
              activeTab === item.id && "font-bold"
            )}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileBottomNav; 