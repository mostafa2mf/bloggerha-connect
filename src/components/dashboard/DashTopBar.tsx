import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import NotificationBell from '@/components/shared/NotificationBell';

const cities = [
  { name: 'تهران', nameEn: 'Tehran', active: true },
  { name: 'مشهد', nameEn: 'Mashhad', active: false },
  { name: 'اصفهان', nameEn: 'Isfahan', active: false },
  { name: 'شیراز', nameEn: 'Shiraz', active: false },
  { name: 'تبریز', nameEn: 'Tabriz', active: false },
];

interface Props {
  role?: 'blogger' | 'business';
  onGoHome?: () => void;
}

const DashTopBar = ({ role = 'blogger', onGoHome }: Props) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [cityOpen, setCityOpen] = useState(false);
  const [selectedCity] = useState(cities[0]);

  const avatarUrl = user?.user_metadata?.avatar_url;
  const initial = (user?.user_metadata?.username || user?.email || 'U')[0].toUpperCase();

  return (
    <div className="px-4 md:px-6 py-3 flex items-center gap-3 relative z-40">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
        <input
          type="text"
          placeholder={lang === 'fa' ? 'جستجوی کمپین‌ها...' : 'Search campaigns...'}
          className="w-full bg-muted/20 border border-border/30 rounded-2xl ps-10 pe-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all placeholder:text-muted-foreground/40"
        />
      </div>

      {/* Golden info box: city + notification + avatar */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-primary/20 shadow-[0_2px_12px_-2px_rgba(218,165,32,0.25)] bg-primary/5">
        {/* City Selector */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setCityOpen(!cityOpen)}
            className="flex items-center gap-1.5 text-sm"
          >
            <MapPin size={14} className="text-primary" />
            <span className="font-medium text-xs">{lang === 'fa' ? selectedCity.name : selectedCity.nameEn}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <ChevronDown size={12} className={`transition-transform text-muted-foreground ${cityOpen ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {cityOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-full mt-2 end-0 w-44 glass-strong rounded-xl p-2 z-50 shadow-xl"
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
                    <span className={`w-2 h-2 rounded-full ${city.active ? 'bg-emerald-400' : 'bg-muted-foreground/20'}`} />
                    {lang === 'fa' ? city.name : city.nameEn}
                    {!city.active && <span className="text-[10px] ms-auto opacity-50">{lang === 'fa' ? 'بزودی' : 'Soon'}</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-px h-5 bg-border/50" />

        {/* Notifications */}
        <NotificationBell role={role} />

        <div className="w-px h-5 bg-border/50" />

        {/* Avatar */}
        <button onClick={onGoHome} className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-bold text-xs overflow-hidden ring-2 ring-primary/20">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : initial}
        </button>
      </div>
    </div>
  );
};

export default DashTopBar;
