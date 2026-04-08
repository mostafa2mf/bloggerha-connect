import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, SlidersHorizontal, MapPin, Users, Heart, Star, Bookmark, Eye } from 'lucide-react';

const categories = ['همه', 'زیبایی', 'مد', 'تکنولوژی', 'غذا', 'سفر', 'ورزش'];

const bloggers = [
  { name: 'سارا احمدی', username: '@sara_beauty', niche: 'زیبایی', city: 'تهران', followers: '۴۵K', engagement: '۵.۲%', score: 92, avatar: 'S', tag: 'trending', images: [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop',
  ]},
  { name: 'علی تکنولوژی', username: '@tech_ali', niche: 'تکنولوژی', city: 'اصفهان', followers: '۸۰K', engagement: '۳.۸%', score: 88, avatar: 'ع', tag: 'best_match', images: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
  ]},
  { name: 'مینا فشن', username: '@mina_fashion', niche: 'مد', city: 'تهران', followers: '۱۲۰K', engagement: '۶.۱%', score: 95, avatar: 'م', tag: 'high_engagement', images: [
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop',
  ]},
  { name: 'رضا فودی', username: '@reza_food', niche: 'غذا', city: 'شیراز', followers: '۳۵K', engagement: '۴.۵%', score: 78, avatar: 'ر', tag: 'new', images: [
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop',
  ]},
];

const tagLabels: Record<string, string> = { trending: 'ترند', best_match: 'بهترین تطبیق', high_engagement: 'تعامل بالا', new: 'جدید' };
const tagStyles: Record<string, string> = { trending: 'bg-red-500/10 text-red-400', best_match: 'bg-purple-500/10 text-purple-400', high_engagement: 'bg-green-500/10 text-green-400', new: 'bg-blue-500/10 text-blue-400' };

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const OverlappingImages = ({ images, name }: { images: string[]; name: string }) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <div className="flex items-center mt-2">
      {images.slice(0, 5).map((img, i) => (
        <motion.div
          key={i}
          onHoverStart={() => setActiveIdx(i)}
          onHoverEnd={() => setActiveIdx(null)}
          animate={{
            scale: activeIdx === i ? 1.3 : 1,
            zIndex: activeIdx === i ? 20 : 5 - i,
            marginInlineStart: i === 0 ? 0 : -8,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative cursor-pointer"
          style={{ zIndex: activeIdx === i ? 20 : 5 - i }}
        >
          <img
            src={img}
            alt={`${name} ${i + 1}`}
            className={`w-8 h-8 rounded-full object-cover border-2 transition-all duration-200 ${
              activeIdx === i
                ? 'border-primary shadow-lg shadow-primary/30 ring-2 ring-primary/20'
                : 'border-background/80'
            }`}
          />
        </motion.div>
      ))}
      {images.length > 5 && (
        <span className="text-[10px] text-muted-foreground ms-2">+{images.length - 5}</span>
      )}
    </div>
  );
};

const BizDiscover = () => {
  const { t, lang } = useLanguage();
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((b, i) => (
          <motion.div
            key={i}
            variants={item}
            className="glass rounded-3xl p-5 hover:glow-border transition-all duration-300"
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
                {/* Overlapping circle images */}
                <OverlappingImages images={b.images} name={b.name} />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <motion.button whileTap={{ scale: 0.95 }} className="flex-1 gradient-bg text-primary-foreground text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity">
                <Eye size={12} /> {lang === 'fa' ? 'مشاهده پروفایل' : 'View Profile'}
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} className="glass text-xs font-medium py-2 px-3 rounded-xl flex items-center justify-center hover:glow-border transition-all">
                <Bookmark size={14} />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default BizDiscover;
