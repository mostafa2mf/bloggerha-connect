import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, Bell, MapPin, ChevronDown } from 'lucide-react';

const cities = [
  { name: 'تهران', nameEn: 'Tehran', active: true },
  { name: 'مشهد', nameEn: 'Mashhad', active: false },
  { name: 'اصفهان', nameEn: 'Isfahan', active: false },
  { name: 'شیراز', nameEn: 'Shiraz', active: false },
  { name: 'تبریز', nameEn: 'Tabriz', active: false },
];

const DashTopBar = () => {
  const { t, lang } = useLanguage();
  const [cityOpen, setCityOpen] = useState(false);
  const [selectedCity] = useState(cities[0]);

  return (
    <div className="glass-strong border-b border-border/50 px-6 py-3 flex items-center gap-4">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={t('dash.searchCampaigns')}
          className="w-full bg-muted/30 rounded-xl ps-10 pe-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/60"
        />
      </div>

      {/* City Selector */}
      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setCityOpen(!cityOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl glass hover:glow-border transition-all duration-200 text-sm"
        >
          <MapPin size={14} className="text-primary" />
          <span className="font-medium">{lang === 'fa' ? selectedCity.name : selectedCity.nameEn}</span>
          <ChevronDown size={14} className={`transition-transform ${cityOpen ? 'rotate-180' : ''}`} />
        </motion.button>

        <AnimatePresence>
          {cityOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-full mt-2 end-0 w-48 glass-strong rounded-xl p-2 z-50 shadow-xl"
            >
              {cities.map((city, i) => (
                <button
                  key={i}
                  disabled={!city.active}
                  onClick={() => { if (city.active) setCityOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    city.active
                      ? 'hover:bg-primary/10 text-foreground font-medium'
                      : 'text-muted-foreground/40 cursor-not-allowed'
                  } ${city.name === selectedCity.name ? 'bg-primary/10 text-primary' : ''}`}
                >
                  <MapPin size={12} />
                  {lang === 'fa' ? city.name : city.nameEn}
                  {!city.active && <span className="text-[10px] ms-auto opacity-50">{lang === 'fa' ? 'بزودی' : 'Soon'}</span>}
                </button>
              ))}
              <div className="px-3 py-1.5 mt-1 text-[10px] text-muted-foreground/60 border-t border-border/30">
                {lang === 'fa' ? 'شهرهای دیگر به زودی فعال می‌شوند' : 'More cities coming soon'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notifications */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        className="relative p-2 rounded-xl glass hover:glow-border transition-all duration-200"
      >
        <Bell size={18} />
        <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center font-bold">3</span>
      </motion.button>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-bold text-sm">
        B
      </div>
    </div>
  );
};

export default DashTopBar;
