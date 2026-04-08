import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Home, Search, Megaphone, FileCheck, MessageCircle, BarChart3, User } from 'lucide-react';
import BizHome from './BizHome';
import BizDiscover from './BizDiscover';
import BizCampaigns from './BizCampaigns';
import BizApplications from './BizApplications';
import BizMessages from './BizMessages';
import BizAnalytics from './BizAnalytics';
import BizProfile from './BizProfile';

const tabs = [
  { id: 'home', icon: Home, key: 'biz.home' },
  { id: 'discover', icon: Search, key: 'biz.discover' },
  { id: 'campaigns', icon: Megaphone, key: 'biz.campaigns' },
  { id: 'applications', icon: FileCheck, key: 'biz.applications' },
  { id: 'messages', icon: MessageCircle, key: 'biz.messages' },
  { id: 'analytics', icon: BarChart3, key: 'biz.analytics' },
  { id: 'profile', icon: User, key: 'biz.profile' },
] as const;

type TabId = typeof tabs[number]['id'];

const BusinessDashboardLayout = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>('home');

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <BizHome />;
      case 'discover': return <BizDiscover />;
      case 'campaigns': return <BizCampaigns />;
      case 'applications': return <BizApplications />;
      case 'messages': return <BizMessages />;
      case 'analytics': return <BizAnalytics />;
      case 'profile': return <BizProfile />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {renderTab()}
      </div>

      {/* Bottom Navigation - scrollable on mobile for 7 tabs */}
      <div className="fixed bottom-4 inset-x-4 z-50 flex justify-center">
        <motion.nav
          className="glass-strong rounded-2xl px-1 py-2 flex items-center gap-0.5 max-w-lg w-full justify-around overflow-x-auto scrollbar-none"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        >
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-300 min-w-[44px] ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="bizActiveTab"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
                <tab.icon size={18} className="relative z-10" />
                <span className="text-[9px] font-medium relative z-10 whitespace-nowrap">{t(tab.key)}</span>
                {isActive && (
                  <motion.div
                    layoutId="bizActiveGlow"
                    className="absolute -top-1 w-6 h-0.5 rounded-full gradient-bg"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
              </button>
            );
          })}
        </motion.nav>
      </div>
    </div>
  );
};

export default BusinessDashboardLayout;
