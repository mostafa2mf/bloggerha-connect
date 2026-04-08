import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, Clock, Check, X, Eye, Mail, CheckCircle, Star, TrendingUp, Users, Heart, Award, Bookmark, Zap } from 'lucide-react';

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
  const { t } = useLanguage();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Row 1: Welcome + Profile Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={item} className="lg:col-span-2 relative rounded-3xl overflow-hidden glass-gold p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-1">
              {t('dash.greeting')} <span className="gradient-text">بلاگر</span>
            </h1>
            <p className="text-sm text-muted-foreground mb-4">{t('dash.welcomeMsg')}</p>
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
              {t('dash.currentInvite')}
            </span>
            <h3 className="text-lg font-bold mt-3 mb-2">کمپین معرفی محصول جدید</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <span className="flex items-center gap-1"><Clock size={14} /> ۱۴۰۵/۰۱/۱۵</span>
              <span className="flex items-center gap-1"><MapPin size={14} /> تهران</span>
            </div>
            <div className="text-sm font-medium text-primary mb-4">پاداش: ۱۰M تومان</div>
            <div className="flex gap-3">
              <motion.button whileTap={{ scale: 0.95 }} className="gradient-bg text-primary-foreground font-medium py-2 px-5 rounded-xl flex items-center gap-2 hover:opacity-90 transition-all text-sm shadow-lg shadow-primary/20">
                <Check size={16} /> {t('dash.accept')}
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} className="glass font-medium py-2 px-5 rounded-xl flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive transition-all text-sm">
                <X size={16} /> {t('dash.decline')}
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} className="px-4 glass font-medium py-2 rounded-xl flex items-center gap-2 hover:bg-muted/50 transition-all text-sm">
                <Eye size={16} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass rounded-3xl p-5 flex flex-col">
          <h3 className="font-bold mb-3">{t('dash.profileHealth')}</h3>
          <div className="w-full h-2 rounded-full bg-muted mb-4 overflow-hidden">
            <motion.div className="h-full rounded-full gradient-bg" initial={{ width: 0 }} animate={{ width: '67%' }} transition={{ duration: 1, delay: 0.3 }} />
          </div>
          <div className="text-3xl font-bold text-primary mb-1">67%</div>
          <p className="text-xs text-muted-foreground flex-1">برای تکمیل پروفایل نمونه محتوا و مدیا کیت خود را آپلود کنید</p>
          <motion.button whileTap={{ scale: 0.95 }} className="mt-3 w-full glass rounded-xl py-2 text-sm font-medium hover:glow-border transition-all">
            {t('dash.editProfile')}
          </motion.button>
        </motion.div>
      </div>

      {/* Row 2: Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickStats.map((s, i) => (
          <motion.button key={i} className={`relative rounded-2xl p-4 overflow-hidden text-start group ${s.color}`} whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}>
            <s.icon size={20} className={`mb-2 ${s.textColor}`} />
            <div className="text-2xl font-bold">{s.count}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{t(s.key)}</div>
          </motion.button>
        ))}
      </motion.div>

      {/* Row 3: Performance + Featured side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

        <motion.div variants={item}>
          <h2 className="text-lg font-bold mb-3">{t('dash.featured')}</h2>
          <div className="space-y-3">
            {featured.map((c, i) => (
              <motion.div key={i} className="glass rounded-2xl overflow-hidden flex group cursor-pointer hover:glow-border transition-all" whileTap={{ scale: 0.98 }}>
                <div className="w-24 h-24 shrink-0 overflow-hidden">
                  <img src={c.image} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-3 flex-1 min-w-0">
                  <h3 className="text-sm font-bold truncate">{c.title}</h3>
                  <p className="text-xs text-muted-foreground">{c.brand}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-bold text-primary">{c.reward}</span>
                    <Bookmark size={14} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashHome;
