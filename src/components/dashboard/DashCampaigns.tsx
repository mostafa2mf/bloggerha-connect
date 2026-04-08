import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, Check, X, MapPin } from 'lucide-react';

type Tab = 'pending' | 'accepted' | 'completed';

const mockCampaigns = {
  pending: [
    { title: 'کمپین معرفی محصول جدید', brand: 'BrandX', date: '۱۵ تیر', location: 'تهران' },
    { title: 'همکاری با برند آرایشی', brand: 'GlowUp', date: '۲۰ تیر', location: 'مشهد' },
  ],
  accepted: [
    { title: 'فشن ویک تهران', brand: 'UrbanWear', date: '۱۰ تیر', location: 'تهران' },
  ],
  completed: [
    { title: 'کمپین تابستانی', brand: 'SunBrand', date: '۱ خرداد', location: 'کیش' },
    { title: 'معرفی اپ جدید', brand: 'AppStudio', date: '۱۵ اردیبهشت', location: 'آنلاین' },
  ],
};

const tabColors: Record<Tab, string> = {
  pending: 'from-orange-500/20 to-orange-600/20 border-orange-500/20',
  accepted: 'from-green-500/20 to-green-600/20 border-green-500/20',
  completed: 'from-blue-500/20 to-blue-600/20 border-blue-500/20',
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const DashCampaigns = () => {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>('pending');

  const tabItems: { id: Tab; label: string }[] = [
    { id: 'pending', label: t('dash.pending') },
    { id: 'accepted', label: t('dash.accepted') },
    { id: 'completed', label: t('dash.completed') },
  ];

  const campaigns = mockCampaigns[tab];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold gradient-text">{t('dash.campaigns')}</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabItems.map(ti => (
          <button
            key={ti.id}
            onClick={() => setTab(ti.id)}
            className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === ti.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === ti.id && (
              <motion.div
                layoutId="campaignTab"
                className="absolute inset-0 glass rounded-xl border border-primary/20"
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            )}
            <span className="relative z-10">{ti.label}</span>
          </button>
        ))}
      </div>

      {/* Campaign List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {campaigns.length === 0 ? (
            <motion.div variants={item} className="text-center py-12 text-muted-foreground">
              {t('dash.noData')}
            </motion.div>
          ) : (
            campaigns.map((c, i) => (
              <motion.div
                key={i}
                variants={item}
                className={`rounded-2xl p-4 border bg-gradient-to-br ${tabColors[tab]} transition-all`}
              >
                <h3 className="font-bold mb-1">{c.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{c.brand}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Clock size={12} /> {c.date}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {c.location}</span>
                </div>
                {tab === 'pending' && (
                  <div className="flex gap-2">
                    <button className="flex-1 gradient-bg text-primary-foreground text-sm py-2 rounded-xl flex items-center justify-center gap-1 hover:opacity-90">
                      <Check size={14} /> {t('dash.accept')}
                    </button>
                    <button className="flex-1 glass text-sm py-2 rounded-xl flex items-center justify-center gap-1 hover:bg-destructive/10 hover:text-destructive border border-border">
                      <X size={14} /> {t('dash.decline')}
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DashCampaigns;
