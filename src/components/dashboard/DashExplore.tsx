import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, SlidersHorizontal, MapPin, Calendar, Bookmark, TrendingUp, Sparkles } from 'lucide-react';
import jalaali from 'jalaali-js';

const categories = ['همه', 'زیبایی', 'مد', 'تکنولوژی', 'غذا', 'سفر', 'ورزش'];

function toJalaliStr(y: number, m: number, d: number) {
  const j = jalaali.toJalaali(y, m, d);
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
}

const campaigns = [
  { title: 'کمپین زیبایی لوکس', brand: 'Glow Beauty', location: 'تهران', date: toJalaliStr(2026, 7, 5), category: 'زیبایی', reward: '۵M', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=250&fit=crop', tag: 'trending' },
  { title: 'فشن استریت استایل', brand: 'UrbanWear', location: 'تهران', date: toJalaliStr(2026, 7, 10), category: 'مد', reward: '۳M', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=250&fit=crop', tag: 'new' },
  { title: 'تکنولوژی آینده', brand: 'TechVision', location: 'تهران', date: toJalaliStr(2026, 7, 15), category: 'تکنولوژی', reward: '۸M', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=250&fit=crop', tag: 'recommended' },
  { title: 'غذای سالم', brand: 'FreshBite', location: 'تهران', date: toJalaliStr(2026, 8, 1), category: 'غذا', reward: '۲M', image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=250&fit=crop', tag: null },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const tagColors: Record<string, string> = {
  trending: 'bg-red-500/10 text-red-400',
  new: 'bg-green-500/10 text-green-400',
  recommended: 'bg-purple-500/10 text-purple-400',
};
const tagLabels: Record<string, Record<string, string>> = {
  trending: { fa: 'پرطرفدار', en: 'Trending' },
  new: { fa: 'جدید', en: 'New' },
  recommended: { fa: 'پیشنهادی', en: 'Recommended' },
};

const tagIcons: Record<string, any> = {
  trending: TrendingUp,
  new: Sparkles,
  recommended: Sparkles,
};

const DashExplore = () => {
  const { t, lang } = useLanguage();
  const [activeCat, setActiveCat] = useState('همه');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = campaigns
    .filter(c => activeCat === 'همه' || c.category === activeCat)
    .filter(c => !searchQuery || c.title.includes(searchQuery) || c.brand.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.h1 variants={item} className="text-2xl font-bold gradient-text">{t('dash.explore')}</motion.h1>

      {/* Search + Filters */}
      <motion.div variants={item} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('dash.searchCampaigns')}
            className="w-full glass rounded-xl ps-10 pe-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <motion.button whileTap={{ scale: 0.95 }} className="glass rounded-xl p-2.5 hover:glow-border transition-all">
          <SlidersHorizontal size={18} />
        </motion.button>
      </motion.div>

      {/* Category Chips */}
      <motion.div variants={item} className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <motion.button
            key={cat}
            onClick={() => setActiveCat(cat)}
            whileTap={{ scale: 0.95 }}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
              activeCat === cat ? 'gradient-bg text-primary-foreground shadow-lg shadow-primary/20' : 'glass hover:glow-border'
            }`}
          >
            {cat}
          </motion.button>
        ))}
      </motion.div>

      {/* Campaign Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((c, i) => (
          <motion.div
            key={i}
            variants={item}
            className="glass rounded-3xl overflow-hidden group cursor-pointer hover:glow-border transition-all duration-300"
            whileTap={{ scale: 0.98 }}
          >
            <div className="h-40 overflow-hidden relative">
              <img src={c.image} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <button className="absolute top-3 end-3 p-2 rounded-xl glass text-foreground/80 hover:text-primary transition-colors">
                <Bookmark size={16} />
              </button>
              {c.tag && (
                <span className={`absolute top-3 start-3 flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full ${tagColors[c.tag]}`}>
                  {(() => { const Icon = tagIcons[c.tag]; return <Icon size={10} />; })()}
                  {tagLabels[c.tag][lang]}
                </span>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">{c.title}</h3>
                <span className="text-sm font-bold text-primary">{c.reward} تومان</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{c.brand}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {c.location}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {c.date}</span>
                </div>
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.95 }} className="text-xs font-medium glass px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-all">
                    {lang === 'fa' ? 'مشاهده' : 'View'}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} className="text-xs font-medium gradient-bg text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
                    {lang === 'fa' ? 'درخواست همکاری' : 'Apply'}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default DashExplore;
