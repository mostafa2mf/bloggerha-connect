import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Megaphone, Users, CheckCircle, Clock, TrendingUp, Plus, Eye, MessageCircle, FileText, Bell } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const kpis = [
  { key: 'biz.activeCampaigns', value: '۴', icon: Megaphone, color: 'status-purple' },
  { key: 'biz.totalApplicants', value: '۲۸', icon: Users, color: 'status-blue' },
  { key: 'biz.accepted', value: '۱۲', icon: CheckCircle, color: 'status-green' },
  { key: 'biz.pendingReview', value: '۸', icon: Clock, color: 'status-orange' },
];

const quickActions = [
  { key: 'biz.createCampaign', icon: Plus },
  { key: 'biz.reviewApps', icon: Eye },
  { key: 'biz.discoverBloggers', icon: Users },
  { key: 'biz.viewReports', icon: TrendingUp },
];

const recentActivity = [
  { text: 'درخواست جدید از @sara_beauty برای کمپین زیبایی', time: '۵ دقیقه پیش', icon: Bell },
  { text: 'کمپین فشن پاییزه تأیید شد', time: '۱ ساعت پیش', icon: CheckCircle },
  { text: 'پیام جدید از @tech_ali', time: '۳ ساعت پیش', icon: MessageCircle },
  { text: 'گزارش هفتگی آماده شد', time: 'دیروز', icon: FileText },
];

const BizHome = () => {
  const { t } = useLanguage();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Greeting */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t('dash.greeting')} <span className="gradient-gold">برند نمونه</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('biz.welcomeMsg')}</p>
        </div>
        <div className="w-10 h-10 rounded-full gradient-bg-gold flex items-center justify-center text-primary-foreground font-bold text-sm">
          B
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            className={`rounded-2xl p-4 ${kpi.color}`}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
          >
            <kpi.icon size={20} className="mb-2 opacity-80" />
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{t(kpi.key)}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <h2 className="text-lg font-bold mb-3">{t('biz.quickActions')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((a, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              className="glass rounded-2xl p-4 text-start hover:glow-border transition-all duration-300"
            >
              <a.icon size={20} className="text-primary mb-2" />
              <div className="text-sm font-medium">{t(a.key)}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={item}>
        <h2 className="text-lg font-bold mb-3">{t('biz.recentActivity')}</h2>
        <div className="space-y-2">
          {recentActivity.map((a, i) => (
            <motion.div
              key={i}
              className="glass rounded-2xl p-3 flex items-start gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <a.icon size={14} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed">{a.text}</p>
                <span className="text-[10px] text-muted-foreground">{a.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BizHome;
