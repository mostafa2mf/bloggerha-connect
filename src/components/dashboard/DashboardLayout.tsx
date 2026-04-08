import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Home, Compass, Calendar, User } from 'lucide-react';
import DashHome from './DashHome';
import DashExplore from './DashExplore';
import DashCampaigns from './DashCampaigns';
import DashProfile from './DashProfile';

const tabs = [
  { id: 'home', icon: Home, key: 'dash.home' },
  { id: 'explore', icon: Compass, key: 'dash.explore' },
  { id: 'campaigns', icon: Calendar, key: 'dash.campaigns' },
  { id: 'profile', icon: User, key: 'dash.profile' },
] as const;

type TabId = typeof tabs[number]['id'];

const DashboardLayout = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>('home');

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Content */}
      <div className="max-w-lg mx-auto px-4 pt-6">
        {activeTab === 'home' && <DashHome />}
        {activeTab === 'explore' && <DashExplore />}
        {activeTab === 'campaigns' && <DashCampaigns />}
        {activeTab === 'profile' && <DashProfile />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-4 inset-x-4 z-50 flex justify-center">
        <motion.nav
          className="glass-strong rounded-2xl px-2 py-2 flex items-center gap-1 max-w-md w-full justify-around"
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
                className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
                <tab.icon size={20} className="relative z-10" />
                <span className="text-[10px] font-medium relative z-10">{t(tab.key)}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeGlow"
                    className="absolute -top-1 w-8 h-1 rounded-full gradient-bg"
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

export default DashboardLayout;
