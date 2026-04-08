import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, Check, X, MapPin, Calendar, Eye, Upload, MessageCircle, FileText } from 'lucide-react';

const tabKeys = ['dash.pending', 'dash.accepted', 'dash.scheduled', 'dash.completed', 'dash.rejected'] as const;

const tabColors: Record<string, string> = {
  'dash.pending': 'status-orange',
  'dash.accepted': 'status-green',
  'dash.scheduled': 'status-blue',
  'dash.completed': 'status-purple',
  'dash.rejected': 'status-red',
};

const mockData: Record<string, Array<{
  title: string; brand: string; city: string; date: string; image: string; status: string;
}>> = {
  'dash.pending': [
    { title: 'کمپین معرفی محصول', brand: 'Glow Beauty', city: 'تهران', date: '۱۵ تیر', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=180&fit=crop', status: 'pending' },
    { title: 'همکاری فشن پاییزه', brand: 'UrbanWear', city: 'اصفهان', date: '۲۰ تیر', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=180&fit=crop', status: 'pending' },
  ],
  'dash.accepted': [
    { title: 'تکنولوژی آینده', brand: 'TechVision', city: 'تهران', date: '۲۵ تیر', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=180&fit=crop', status: 'accepted' },
  ],
  'dash.scheduled': [],
  'dash.completed': [
    { title: 'غذای سالم', brand: 'FreshBite', city: 'شیراز', date: '۱ خرداد', image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=300&h=180&fit=crop', status: 'completed' },
  ],
  'dash.rejected': [],
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const DashCampaigns = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('dash.pending');

  const campaigns = mockData[activeTab] || [];

  const actionButtons = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <>
            <motion.button whileTap={{ scale: 0.95 }} className="flex-1 gradient-bg text-primary-foreground text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1.5">
              <Check size={14} /> {t('dash.accept')}
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} className="flex-1 glass text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1.5 hover:bg-destructive/10 hover:text-destructive transition-all">
              <X size={14} /> {t('dash.decline')}
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} className="glass text-xs font-medium py-2 px-3 rounded-xl flex items-center justify-center">
              <Eye size={14} />
            </motion.button>
          </>
        );
      case 'accepted':
        return (
          <>
            <motion.button whileTap={{ scale: 0.95 }} className="flex-1 status-blue text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1.5 text-blue-400">
              <Check size={14} /> {t('dash.confirmAttendance')}
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} className="glass text-xs font-medium py-2 px-3 rounded-xl flex items-center justify-center">
              <MessageCircle size={14} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} className="glass text-xs font-medium py-2 px-3 rounded-xl flex items-center justify-center">
              <FileText size={14} />
            </motion.button>
          </>
        );
      case 'completed':
        return (
          <>
            <motion.button whileTap={{ scale: 0.95 }} className="flex-1 status-purple text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1.5 text-purple-400">
              <Upload size={14} /> {t('dash.uploadResult')}
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} className="glass text-xs font-medium py-2 px-3 rounded-xl flex items-center justify-center">
              <Eye size={14} />
            </motion.button>
          </>
        );
      default: return null;
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.h1 variants={item} className="text-2xl font-bold gradient-text">{t('dash.campaigns')}</motion.h1>

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
            {t(tab)} ({(mockData[tab] || []).length})
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-4"
        >
          {campaigns.length === 0 ? (
            <div className={`rounded-3xl p-8 text-center ${tabColors[activeTab]}`}>
              <Clock size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">{t('dash.noData')}</p>
            </div>
          ) : (
            campaigns.map((c, i) => (
              <motion.div
                key={i}
                className="glass rounded-3xl overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="h-36 overflow-hidden">
                  <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold mb-1">{c.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{c.brand}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {c.city}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> {c.date}</span>
                  </div>
                  <div className="flex gap-2">{actionButtons(c.status)}</div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default DashCampaigns;
