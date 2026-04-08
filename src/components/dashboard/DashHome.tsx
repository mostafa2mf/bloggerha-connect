import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Clock, Check, X, Mail, CheckCircle, Eye, Star } from 'lucide-react';

const quickActions = [
  { key: 'dash.invitations', color: 'from-purple-500 to-purple-700', icon: Mail, count: 3 },
  { key: 'dash.toConfirm', color: 'from-blue-500 to-blue-700', icon: CheckCircle, count: 1 },
  { key: 'dash.toVisit', color: 'from-orange-500 to-orange-700', icon: Eye, count: 2 },
  { key: 'dash.completed', color: 'from-green-500 to-green-700', icon: Star, count: 5 },
];

const featuredCampaigns = [
  { title: 'کمپین زیبایی لوکس', brand: 'Glow Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=200&fit=crop' },
  { title: 'فشن استریت استایل', brand: 'UrbanWear', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=200&fit=crop' },
  { title: 'تکنولوژی آینده', brand: 'TechVision', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=200&fit=crop' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const DashHome = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const username = user?.user_metadata?.username || 'کاربر';

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Greeting */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold">
          {t('dash.greeting')} <span className="gradient-text">{username}</span>
        </h1>
      </motion.div>

      {/* Current Invite Card */}
      <motion.div
        variants={item}
        className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/20 p-6"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none" />
        <div className="relative z-10">
          <span className="text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">
            {t('dash.currentInvite')}
          </span>
          <h3 className="text-lg font-bold mt-3 mb-2">کمپین معرفی محصول جدید</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1"><Clock size={14} /> ۱۵ تیر ۱۴۰۴</span>
            <span className="flex items-center gap-1"><MapPin size={14} /> تهران</span>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 gradient-bg text-primary-foreground font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-sm">
              <Check size={16} /> {t('dash.accept')}
            </button>
            <button className="flex-1 glass font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-destructive/10 hover:text-destructive transition-colors text-sm border border-border">
              <X size={16} /> {t('dash.decline')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">
        {quickActions.map((action, i) => (
          <motion.button
            key={i}
            className={`relative rounded-2xl p-4 overflow-hidden text-start group`}
            whileTap={{ scale: 0.97 }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-15 group-hover:opacity-25 transition-opacity`} />
            <div className="relative z-10">
              <action.icon size={20} className="mb-2 opacity-80" />
              <div className="text-2xl font-bold">{action.count}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t(action.key)}</div>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Featured Campaigns */}
      <motion.div variants={item}>
        <h2 className="text-lg font-bold mb-3">{t('dash.featured')}</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
          {featuredCampaigns.map((campaign, i) => (
            <div key={i} className="flex-shrink-0 w-56 glass rounded-2xl overflow-hidden group cursor-pointer">
              <div className="h-32 overflow-hidden">
                <img
                  src={campaign.image}
                  alt={campaign.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-3">
                <h3 className="text-sm font-bold truncate">{campaign.title}</h3>
                <p className="text-xs text-muted-foreground">{campaign.brand}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashHome;
