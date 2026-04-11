import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronDown, Home, LogOut, Loader2 } from 'lucide-react';
import NotificationBell from '@/components/shared/NotificationBell';
import { toast } from 'sonner';

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
  const { t, lang } = useLanguage();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [cityOpen, setCityOpen] = useState(false);
  const [selectedCity] = useState(cities[0]);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    toast.success(lang === 'fa' ? 'با موفقیت خارج شدید' : 'Logged out successfully');
    navigate('/');
  };

  const avatarUrl = user?.user_metadata?.avatar_url;
  const initial = (user?.user_metadata?.username || user?.email || 'U')[0].toUpperCase();

  return (
    <div className="glass-strong border-b border-border/50 px-4 md:px-6 py-3 flex items-center gap-3 relative z-50">
      {/* Home Button */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={onGoHome}
        className="p-2 rounded-xl glass hover:glow-border transition-all duration-200"
        title={lang === 'fa' ? 'خانه' : 'Home'}
      >
        <Home size={18} className="text-primary" />
      </motion.button>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
        <input
          type="text"
          placeholder={lang === 'fa' ? 'جستجوی کمپین‌ها...' : 'Search campaigns...'}
          className="w-full bg-muted/20 border border-border/30 rounded-2xl ps-10 pe-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all placeholder:text-muted-foreground/40"
        />
      </div>

      {/* City Selector */}
      <div className="relative hidden sm:block">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setCityOpen(!cityOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl glass hover:glow-border transition-all duration-200 text-sm"
        >
          <MapPin size={14} className="text-primary" />
          <span className="font-medium">{lang === 'fa' ? selectedCity.name : selectedCity.nameEn}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
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
                  <span className={`w-2 h-2 rounded-full ${city.active ? 'bg-emerald-400' : 'bg-muted-foreground/20'}`} />
                  {lang === 'fa' ? city.name : city.nameEn}
                  {!city.active && <span className="text-[10px] ms-auto opacity-50">{lang === 'fa' ? 'بزودی' : 'Soon'}</span>}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notifications */}
      <NotificationBell role={role} />

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-bold text-sm overflow-hidden">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : initial}
      </div>

      {/* Logout */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={handleLogout}
        disabled={loggingOut}
        className="p-2 rounded-xl glass hover:bg-destructive/10 hover:text-destructive transition-all duration-200 disabled:opacity-50"
        title={lang === 'fa' ? 'خروج' : 'Logout'}
      >
        {loggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
      </motion.button>
    </div>
  );
};

export default DashTopBar;
