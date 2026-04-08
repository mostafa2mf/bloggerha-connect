import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Edit3, Copy, Archive, Trash2, Eye, Users, MapPin, Calendar, Clock } from 'lucide-react';

const tabKeys = ['biz.all', 'biz.draft', 'biz.active', 'biz.scheduled', 'biz.completed', 'biz.archived'] as const;

const mockCampaigns: Record<string, Array<{
  title: string; category: string; city: string; budget: string; date: string; applicants: number; approved: number; status: string; image: string;
}>> = {
  'biz.all': [
    { title: 'کمپین زیبایی بهاره', category: 'زیبایی', city: 'تهران', budget: '۲۰M', date: '۱۵ تیر', applicants: 12, approved: 4, status: 'active', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=180&fit=crop' },
    { title: 'معرفی محصول تکنولوژی', category: 'تکنولوژی', city: 'اصفهان', budget: '۳۵M', date: '۲۵ تیر', applicants: 8, approved: 2, status: 'active', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=180&fit=crop' },
    { title: 'فشن پاییزه', category: 'مد', city: 'تهران', budget: '۱۵M', date: '۱ مرداد', applicants: 0, approved: 0, status: 'draft', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=180&fit=crop' },
  ],
  'biz.draft': [
    { title: 'فشن پاییزه', category: 'مد', city: 'تهران', budget: '۱۵M', date: '۱ مرداد', applicants: 0, approved: 0, status: 'draft', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=180&fit=crop' },
  ],
  'biz.active': [
    { title: 'کمپین زیبایی بهاره', category: 'زیبایی', city: 'تهران', budget: '۲۰M', date: '۱۵ تیر', applicants: 12, approved: 4, status: 'active', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=180&fit=crop' },
    { title: 'معرفی محصول تکنولوژی', category: 'تکنولوژی', city: 'اصفهان', budget: '۳۵M', date: '۲۵ تیر', applicants: 8, approved: 2, status: 'active', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=180&fit=crop' },
  ],
  'biz.scheduled': [],
  'biz.completed': [],
  'biz.archived': [],
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const statusBadge: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-500/10 text-blue-400',
  completed: 'bg-purple-500/10 text-purple-400',
};

const BizCampaigns = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('biz.all');

  const campaigns = mockCampaigns[activeTab] || [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={item} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold gradient-text">{t('biz.campaigns')}</h1>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="gradient-bg text-primary-foreground text-xs font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-primary/20"
        >
          <Plus size={14} /> {t('biz.createCampaign')}
        </motion.button>
      </motion.div>

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
            {t(tab)} ({(mockCampaigns[tab] || []).length})
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="glass rounded-3xl p-8 text-center">
              <Clock size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">{t('dash.noData')}</p>
            </div>
          ) : (
            campaigns.map((c, i) => (
              <motion.div key={i} className="glass rounded-3xl overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <div className="h-32 overflow-hidden relative">
                  <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                  <span className={`absolute top-3 start-3 text-[10px] font-medium px-2.5 py-1 rounded-full ${statusBadge[c.status]}`}>
                    {c.status}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold mb-1">{c.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1"><MapPin size={11} /> {c.city}</span>
                    <span className="flex items-center gap-1"><Calendar size={11} /> {c.date}</span>
                    <span className="font-medium text-primary">{c.budget} تومان</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><Users size={11} /> {c.applicants} درخواست</span>
                    <span>{c.approved} تأیید شده</span>
                  </div>
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.95 }} className="flex-1 gradient-bg text-primary-foreground text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1">
                      <Eye size={12} /> {t('biz.viewApplicants')}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} className="glass text-xs py-2 px-3 rounded-xl"><Edit3 size={14} /></motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} className="glass text-xs py-2 px-3 rounded-xl"><Copy size={14} /></motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} className="glass text-xs py-2 px-3 rounded-xl"><Archive size={14} /></motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default BizCampaigns;
