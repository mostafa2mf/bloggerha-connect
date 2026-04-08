import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, SlidersHorizontal, MapPin, Users, Heart, Star, Bookmark, Send } from 'lucide-react';

const categories = ['همه', 'زیبایی', 'مد', 'تکنولوژی', 'غذا', 'سفر', 'ورزش'];

const bloggers = [
  { name: 'سارا احمدی', username: '@sara_beauty', niche: 'زیبایی', city: 'تهران', followers: '۴۵K', engagement: '۵.۲%', score: 92, avatar: 'S', tag: 'trending' },
  { name: 'علی تکنولوژی', username: '@tech_ali', niche: 'تکنولوژی', city: 'اصفهان', followers: '۸۰K', engagement: '۳.۸%', score: 88, avatar: 'ع', tag: 'best_match' },
  { name: 'مینا فشن', username: '@mina_fashion', niche: 'مد', city: 'تهران', followers: '۱۲۰K', engagement: '۶.۱%', score: 95, avatar: 'م', tag: 'high_engagement' },
  { name: 'رضا فودی', username: '@reza_food', niche: 'غذا', city: 'شیراز', followers: '۳۵K', engagement: '۴.۵%', score: 78, avatar: 'ر', tag: 'new' },
];

const tagLabels: Record<string, string> = { trending: 'ترند', best_match: 'بهترین تطبیق', high_engagement: 'تعامل بالا', new: 'جدید' };
const tagStyles: Record<string, string> = { trending: 'bg-red-500/10 text-red-400', best_match: 'bg-purple-500/10 text-purple-400', high_engagement: 'bg-green-500/10 text-green-400', new: 'bg-blue-500/10 text-blue-400' };

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const BizDiscover = () => {
  const { t } = useLanguage();
  const [activeCat, setActiveCat] = useState('همه');

  const filtered = activeCat === 'همه' ? bloggers : bloggers.filter(b => b.niche === activeCat);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.h1 variants={item} className="text-2xl font-bold gradient-text">{t('biz.discover')}</motion.h1>

      <motion.div variants={item} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('biz.searchBloggers')}
            className="w-full glass rounded-xl ps-10 pe-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <motion.button whileTap={{ scale: 0.95 }} className="glass rounded-xl p-2.5 hover:glow-border transition-all">
          <SlidersHorizontal size={18} />
        </motion.button>
      </motion.div>

      <motion.div variants={item} className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4">
        {categories.map(cat => (
          <motion.button
            key={cat}
            onClick={() => setActiveCat(cat)}
            whileTap={{ scale: 0.95 }}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
              activeCat === cat ? 'gradient-bg text-primary-foreground shadow-lg shadow-primary/20' : 'glass'
            }`}
          >
            {cat}
          </motion.button>
        ))}
      </motion.div>

      {filtered.map((b, i) => (
        <motion.div
          key={i}
          variants={item}
          className="glass rounded-3xl p-4 hover:glow-border transition-all duration-300"
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center text-lg font-bold text-primary-foreground shrink-0">
              {b.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold truncate">{b.name}</h3>
                {b.tag && (
                  <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${tagStyles[b.tag]}`}>
                    {tagLabels[b.tag]}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{b.username} · {b.niche}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users size={11} /> {b.followers}</span>
                <span className="flex items-center gap-1"><Heart size={11} /> {b.engagement}</span>
                <span className="flex items-center gap-1"><MapPin size={11} /> {b.city}</span>
                <span className="flex items-center gap-1"><Star size={11} /> {b.score}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <motion.button whileTap={{ scale: 0.95 }} className="flex-1 gradient-bg text-primary-foreground text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1.5">
              <Send size={12} /> {t('biz.invite')}
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} className="glass text-xs font-medium py-2 px-3 rounded-xl flex items-center justify-center">
              <Bookmark size={14} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} className="glass text-xs font-medium py-2 px-3 rounded-xl flex items-center justify-center">
              <Users size={14} />
            </motion.button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default BizDiscover;
