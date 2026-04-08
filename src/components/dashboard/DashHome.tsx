import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, Clock, Check, X, Eye, Mail, CheckCircle, Star, TrendingUp, Users, Heart, Award, ChevronLeft, ChevronRight, Bookmark, Zap } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const quickStats = [
  { key: 'dash.invitations', color: 'status-purple', icon: Mail, count: 3, textColor: 'text-purple-400' },
  { key: 'dash.toConfirm', color: 'status-blue', icon: CheckCircle, count: 1, textColor: 'text-blue-400' },
  { key: 'dash.toVisit', color: 'status-orange', icon: Eye, count: 2, textColor: 'text-orange-400' },
  { key: 'dash.completed', color: 'status-green', icon: Star, count: 5, textColor: 'text-green-400' },
];

const featured = [
  { title: 'کمپین زیبایی لوکس', brand: 'Glow Beauty', reward: '۵M تومان', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=200&fit=crop', category: 'زیبایی' },
  { title: 'فشن استریت استایل', brand: 'UrbanWear', reward: '۳M تومان', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=200&fit=crop', category: 'مد' },
  { title: 'تکنولوژی آینده', brand: 'TechVision', reward: '۸M تومان', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=200&fit=crop', category: 'تکنولوژی' },
];

const metrics = [
  { key: 'dash.followers', value: '۱۲.۵K', icon: Users, change: '+۲.۱%' },
  { key: 'dash.engagement', value: '۴.۸%', icon: Heart, change: '+۰.۳%' },
  { key: 'dash.responseRate', value: '۹۲%', icon: Zap, change: '+۵%' },
  { key: 'dash.profileScore', value: '۸۵', icon: Award, change: '+۳' },
];

const DashHome = () => {
  const { t, lang } = useLanguage();
  const Chevron = lang === 'fa' ? ChevronLeft : ChevronRight;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Greeting */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t('dash.greeting')} <span className="gradient-text">بلاگر</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('dash.welcomeMsg')}</p>
        </div>
        <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-bold text-sm">
          B
        </div>
      </motion.div>

      {/* Current Invite Card */}
      <motion.div
        variants={item}
        className="relative rounded-3xl overflow-hidden glass-gold p-6"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
            {t('dash.currentInvite')}
          </span>
          <h3 className="text-lg font-bold mt-3 mb-2">کمپین معرفی محصول جدید</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
            <span className="flex items-center gap-1"><Clock size={14} /> ۱۵ تیر ۱۴۰۴</span>
            <span className="flex items-center gap-1"><MapPin size={14} /> تهران</span>
          </div>
          <div className="text-sm font-medium text-primary mb-4">پاداش: ۱۰M تومان</div>
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex-1 gradient-bg text-primary-foreground font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all text-sm shadow-lg shadow-primary/20"
            >
              <Check size={16} /> {t('dash.accept')}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex-1 glass font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-destructive/10 hover:text-destructive transition-all text-sm"
            >
              <X size={16} /> {t('dash.decline')}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="px-4 glass font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-muted/50 transition-all text-sm"
            >
              <Eye size={16} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Quick Status Cards */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">
        {quickStats.map((action, i) => (
          <motion.button
            key={i}
            className={`relative rounded-2xl p-4 overflow-hidden text-start group ${action.color}`}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative z-10">
              <action.icon size={20} className={`mb-2 ${action.textColor}`} />
              <div className="text-2xl font-bold">{action.count}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t(action.key)}</div>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Performance Snapshot */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">{t('dash.performance')}</h2>
          <TrendingUp size={16} className="text-primary" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m, i) => (
            <div key={i} className="glass rounded-2xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <m.icon size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{t(m.key)}</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-xl font-bold">{m.value}</span>
                <span className="text-xs text-green-400 mb-0.5">{m.change}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Featured Campaigns */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">{t('dash.featured')}</h2>
          <Chevron size={16} className="text-muted-foreground" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
          {featured.map((c, i) => (
            <motion.div
              key={i}
              className="flex-shrink-0 w-56 glass rounded-2xl overflow-hidden group cursor-pointer"
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="h-32 overflow-hidden relative">
                <img src={c.image} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <button className="absolute top-2 end-2 p-1.5 rounded-lg glass text-primary-foreground/80 hover:text-primary transition-colors">
                  <Bookmark size={14} />
                </button>
                <span className="absolute bottom-2 start-2 text-[10px] font-medium bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full">{c.category}</span>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-bold truncate">{c.title}</h3>
                <p className="text-xs text-muted-foreground">{c.brand}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-bold text-primary">{c.reward}</span>
                  <span className="text-[10px] text-muted-foreground">{t('dash.applyNow')}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashHome;
