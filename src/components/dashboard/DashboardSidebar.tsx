import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Home, Compass, Calendar, User, Settings, MessageCircle, LogOut, ChevronRight, ChevronLeft, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

const tabs = [
  { id: 'home', icon: Home, key: 'dash.home' },
  { id: 'explore', icon: Compass, key: 'dash.explore' },
  { id: 'campaigns', icon: Calendar, key: 'dash.campaigns' },
  { id: 'upload-review', icon: Upload, labelFa: 'بازبینی محتوا', labelEn: 'Upload Review' },
  { id: 'messages', icon: MessageCircle, key: 'biz.messages' },
  { id: 'profile', icon: User, key: 'dash.profile' },
  { id: 'settings', icon: Settings, key: 'dash.settings' },
] as const;

export type BloggerTabId = typeof tabs[number]['id'];

interface Props {
  activeTab: BloggerTabId;
  onTabChange: (tab: BloggerTabId) => void;
}

const DashboardSidebar = ({ activeTab, onTabChange }: Props) => {
  const { t, lang } = useLanguage();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    toast.success(lang === 'fa' ? 'با موفقیت خارج شدید' : 'Logged out successfully');
    navigate('/');
  };

  const getLabel = (tab: typeof tabs[number]) => {
    if ('key' in tab && tab.key) return t(tab.key);
    if (lang === 'fa' && 'labelFa' in tab) return tab.labelFa;
    if ('labelEn' in tab) return tab.labelEn;
    return '';
  };

  const CollapseIcon = lang === 'fa' ? (collapsed ? ChevronLeft : ChevronRight) : (collapsed ? ChevronRight : ChevronLeft);

  return (
    <motion.aside
      className={`sticky top-16 h-[calc(100vh-4rem)] glass-strong border-e border-border/50 flex flex-col transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[220px]'}`}
      initial={false}
      animate={{ width: collapsed ? 72 : 220 }}
    >
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileTap={{ scale: 0.97 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebarActive"
                  className="absolute inset-y-1 start-0 w-1 rounded-full gradient-bg"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              <tab.icon size={20} className="shrink-0" />
              {!collapsed && <span className="text-sm font-medium truncate">{getLabel(tab)}</span>}
            </motion.button>
          );
        })}
      </div>

      <div className="px-2 pb-4 space-y-1">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 disabled:opacity-50"
        >
          {loggingOut ? <Loader2 size={20} className="shrink-0 animate-spin" /> : <LogOut size={20} className="shrink-0" />}
          {!collapsed && <span className="text-sm font-medium">{loggingOut ? '...' : t('auth.logout')}</span>}
        </motion.button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <CollapseIcon size={18} />
        </button>
      </div>
    </motion.aside>
  );
};

export default DashboardSidebar;
