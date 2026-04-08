import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Check, X, Star, MessageCircle, Users, Heart, Eye, Clock } from 'lucide-react';

const tabKeys = ['biz.newApps', 'biz.underReview', 'biz.shortlisted', 'biz.appAccepted', 'biz.appRejected'] as const;

const mockApps: Record<string, Array<{
  name: string; username: string; niche: string; followers: string; engagement: string; campaign: string; date: string; score: number; avatar: string;
}>> = {
  'biz.newApps': [
    { name: 'سارا احمدی', username: '@sara_beauty', niche: 'زیبایی', followers: '۴۵K', engagement: '۵.۲%', campaign: 'کمپین زیبایی', date: '۲ ساعت پیش', score: 92, avatar: 'S' },
    { name: 'رضا فودی', username: '@reza_food', niche: 'غذا', followers: '۳۵K', engagement: '۴.۵%', campaign: 'کمپین غذا', date: '۵ ساعت پیش', score: 78, avatar: 'ر' },
  ],
  'biz.underReview': [
    { name: 'مینا فشن', username: '@mina_fashion', niche: 'مد', followers: '۱۲۰K', engagement: '۶.۱%', campaign: 'فشن پاییزه', date: 'دیروز', score: 95, avatar: 'م' },
  ],
  'biz.shortlisted': [
    { name: 'علی تکنولوژی', username: '@tech_ali', niche: 'تکنولوژی', followers: '۸۰K', engagement: '۳.۸%', campaign: 'تکنولوژی', date: '۲ روز پیش', score: 88, avatar: 'ع' },
  ],
  'biz.appAccepted': [],
  'biz.appRejected': [],
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const BizApplications = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('biz.newApps');

  const apps = mockApps[activeTab] || [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.h1 variants={item} className="text-2xl font-bold gradient-text">{t('biz.applications')}</motion.h1>

      <motion.div variants={item} className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4">
        {tabKeys.map(tab => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            whileTap={{ scale: 0.95 }}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
              activeTab === tab ? 'gradient-bg text-primary-foreground shadow-lg shadow-primary/20' : 'glass'
            }`}
          >
            {t(tab)} ({(mockApps[tab] || []).length})
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
          {apps.length === 0 ? (
            <div className="glass rounded-3xl p-8 text-center">
              <Clock size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">{t('dash.noData')}</p>
            </div>
          ) : (
            apps.map((a, i) => (
              <motion.div key={i} className="glass rounded-3xl p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center text-lg font-bold text-primary-foreground shrink-0">
                    {a.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold">{a.name}</h3>
                      <div className="flex items-center gap-1 text-xs">
                        <Star size={12} className="text-primary" />
                        <span className="font-bold">{a.score}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.username} · {a.niche}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Users size={10} /> {a.followers}</span>
                      <span className="flex items-center gap-0.5"><Heart size={10} /> {a.engagement}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{a.campaign}</span>
                      <span className="text-[10px] text-muted-foreground">{a.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <motion.button whileTap={{ scale: 0.95 }} className="flex-1 gradient-bg text-primary-foreground text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1">
                    <Check size={12} /> {t('dash.accept')}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} className="flex-1 glass text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1 hover:bg-destructive/10 hover:text-destructive transition-all">
                    <X size={12} /> {t('dash.decline')}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} className="glass text-xs py-2 px-3 rounded-xl"><Eye size={14} /></motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} className="glass text-xs py-2 px-3 rounded-xl"><MessageCircle size={14} /></motion.button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default BizApplications;
