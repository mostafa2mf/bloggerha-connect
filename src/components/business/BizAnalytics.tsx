import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrendingUp, Users, Eye, CheckCircle, BarChart3, Award } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const metrics = [
  { key: 'biz.totalReach', value: '۲.۵M', icon: Eye, change: '+۱۲%' },
  { key: 'biz.responseRate', value: '۷۸%', icon: TrendingUp, change: '+۵%' },
  { key: 'biz.acceptanceRate', value: '۶۵%', icon: CheckCircle, change: '+۳%' },
  { key: 'biz.completionRate', value: '۹۲%', icon: Award, change: '+۲%' },
];

const topCategories = [
  { name: 'زیبایی', campaigns: 8, reach: '۸۵۰K', pct: 85 },
  { name: 'مد', campaigns: 5, reach: '۶۲۰K', pct: 62 },
  { name: 'تکنولوژی', campaigns: 3, reach: '۴۵۰K', pct: 45 },
  { name: 'غذا', campaigns: 2, reach: '۲۸۰K', pct: 28 },
];

const topBloggers = [
  { name: 'مینا فشن', performance: '۹۸%', campaigns: 5, avatar: 'م' },
  { name: 'سارا احمدی', performance: '۹۵%', campaigns: 4, avatar: 'S' },
  { name: 'علی تکنولوژی', performance: '۹۱%', campaigns: 3, avatar: 'ع' },
];

const BizAnalytics = () => {
  const { t } = useLanguage();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center gap-2">
        <BarChart3 size={20} className="text-primary" />
        <h1 className="text-2xl font-bold gradient-text">{t('biz.analytics')}</h1>
      </motion.div>

      {/* Key Metrics */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">
        {metrics.map((m, i) => (
          <div key={i} className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <m.icon size={16} className="text-primary" />
              <span className="text-xs text-muted-foreground">{t(m.key)}</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold">{m.value}</span>
              <span className="text-xs text-green-400 mb-1">{m.change}</span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Top Categories */}
      <motion.div variants={item} className="glass rounded-3xl p-5">
        <h2 className="font-bold mb-4">{t('biz.topCategories')}</h2>
        <div className="space-y-3">
          {topCategories.map((c, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.campaigns} کمپین · {c.reach}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full gradient-bg"
                  initial={{ width: 0 }}
                  animate={{ width: `${c.pct}%` }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Top Bloggers */}
      <motion.div variants={item} className="glass rounded-3xl p-5">
        <h2 className="font-bold mb-4">{t('biz.topBloggers')}</h2>
        <div className="space-y-3">
          {topBloggers.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
              <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center font-bold text-primary-foreground text-sm">
                {b.avatar}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{b.name}</div>
                <div className="text-[10px] text-muted-foreground">{b.campaigns} همکاری</div>
              </div>
              <span className="text-sm font-bold text-primary">{b.performance}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BizAnalytics;
