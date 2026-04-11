import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, Loader2, ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

type Blogger = {
  id: string;
  display_name: string | null;
  username: string;
  avatar_url: string | null;
  followers_count: number | null;
  city: string | null;
};

const otherCities = ['مشهد', 'اصفهان', 'شیراز', 'تبریز', 'کرج'];

const BizDiscover = () => {
  const { lang } = useLanguage();
  const [bloggers, setBloggers] = useState<Blogger[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isFemale, setIsFemale] = useState(false);
  const [selectedCity, setSelectedCity] = useState('تهران');
  const [showCities, setShowCities] = useState(false);
  const pageRef = useRef(0);
  const observerRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 12;

  const fetchBloggers = useCallback(async (reset = false) => {
    if (reset) {
      pageRef.current = 0;
      setBloggers([]);
      setHasMore(true);
    }
    setLoading(true);
    const from = pageRef.current * PAGE_SIZE;
    let query = supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url, followers_count, city')
      .eq('role', 'blogger')
      .eq('approval_status', 'approved')
      .range(from, from + PAGE_SIZE - 1)
      .order('followers_count', { ascending: false });

    if (selectedCity === 'تهران') {
      query = query.eq('city', 'تهران');
    }

    const { data } = await query;
    const items = (data as Blogger[]) || [];
    if (items.length < PAGE_SIZE) setHasMore(false);
    setBloggers(prev => reset ? items : [...prev, ...items]);
    pageRef.current += 1;
    setLoading(false);
  }, [selectedCity]);

  useEffect(() => {
    fetchBloggers(true);
  }, [selectedCity, fetchBloggers]);

  useEffect(() => {
    const interval = setInterval(() => fetchBloggers(true), 30000);
    return () => clearInterval(interval);
  }, [fetchBloggers]);

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) fetchBloggers();
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, fetchBloggers]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.h1 variants={item} className="text-2xl font-extrabold gradient-text">
        {lang === 'fa' ? 'بازدید بلاگرها' : 'Browse Bloggers'}
      </motion.h1>

      {/* Filters Row */}
      <motion.div variants={item} className="flex items-center gap-4 flex-wrap">
        {/* Gender Toggle */}
        <div className="flex items-center gap-2.5 glass rounded-2xl px-4 py-2.5">
          <span className={`text-xs font-bold transition-colors ${!isFemale ? 'text-primary' : 'text-muted-foreground'}`}>
            {lang === 'fa' ? 'آقا' : 'Male'}
          </span>
          <Switch checked={isFemale} onCheckedChange={setIsFemale} />
          <span className={`text-xs font-bold transition-colors ${isFemale ? 'text-primary' : 'text-muted-foreground'}`}>
            {lang === 'fa' ? 'خانم' : 'Female'}
          </span>
        </div>

        {/* City Selector */}
        <div className="relative">
          <button
            onClick={() => setShowCities(!showCities)}
            className="flex items-center gap-2 glass rounded-2xl px-4 py-2.5 hover:glow-border transition-all"
          >
            <span className="relative flex h-2.5 w-2.5">
              {selectedCity === 'تهران' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${selectedCity === 'تهران' ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
            </span>
            <span className="text-xs font-bold">{selectedCity}</span>
            <ChevronDown size={14} className={`text-muted-foreground transition-transform ${showCities ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showCities && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full mt-1.5 z-20 glass rounded-2xl border border-primary/10 shadow-xl shadow-primary/10 overflow-hidden min-w-[140px]"
              >
                <button
                  onClick={() => { setSelectedCity('تهران'); setShowCities(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold hover:bg-primary/5 transition-colors"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  تهران
                </button>
                {otherCities.map(c => (
                  <button
                    key={c}
                    disabled
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-muted-foreground/40 cursor-not-allowed"
                  >
                    <span className="inline-flex rounded-full h-2 w-2 bg-muted-foreground/20" />
                    {c}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Blogger Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {bloggers.map((b) => (
          <motion.div
            key={b.id}
            variants={item}
            className="glass rounded-3xl p-4 flex flex-col items-center text-center border border-primary/10 shadow-lg shadow-primary/5 hover:shadow-primary/15 transition-all duration-300"
          >
            <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-primary/30 mb-3">
              {b.avatar_url ? (
                <img src={b.avatar_url} alt={b.display_name || b.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-bg flex items-center justify-center text-xl font-bold text-primary-foreground">
                  {(b.display_name || b.username)?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <h3 className="font-bold text-sm truncate w-full">{b.display_name || b.username}</h3>
            <p className="text-[11px] text-muted-foreground">@{b.username}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Users size={12} className="text-primary" />
              <span className="font-semibold text-foreground">
                {b.followers_count ? b.followers_count.toLocaleString('fa-IR') : '۰'}
              </span>
              <span>{lang === 'fa' ? 'فالوور' : 'followers'}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Loading / Infinite scroll trigger */}
      <div ref={observerRef} className="flex justify-center py-4">
        {loading && <Loader2 size={24} className="animate-spin text-primary" />}
        {!loading && bloggers.length === 0 && (
          <p className="text-sm text-muted-foreground">{lang === 'fa' ? 'بلاگری یافت نشد' : 'No bloggers found'}</p>
        )}
      </div>
    </motion.div>
  );
};

export default BizDiscover;
