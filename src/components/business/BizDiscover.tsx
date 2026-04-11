import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, Loader2 } from 'lucide-react';

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

const BizDiscover = () => {
  const { lang } = useLanguage();
  const [bloggers, setBloggers] = useState<Blogger[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [gender, setGender] = useState<'all' | 'male' | 'female'>('all');
  const [city, setCity] = useState<'تهران' | 'other'>('تهران');
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

    if (city === 'تهران') {
      query = query.eq('city', 'تهران');
    }

    const { data } = await query;
    const items = (data as Blogger[]) || [];
    if (items.length < PAGE_SIZE) setHasMore(false);
    setBloggers(prev => reset ? items : [...prev, ...items]);
    pageRef.current += 1;
    setLoading(false);
  }, [city]);

  useEffect(() => {
    fetchBloggers(true);
  }, [city, fetchBloggers]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchBloggers(true), 30000);
    return () => clearInterval(interval);
  }, [fetchBloggers]);

  // Infinite scroll observer
  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchBloggers();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, fetchBloggers]);

  const genderFilters = [
    { key: 'all' as const, label: lang === 'fa' ? 'همه' : 'All' },
    { key: 'male' as const, label: lang === 'fa' ? 'آقا' : 'Male' },
    { key: 'female' as const, label: lang === 'fa' ? 'خانم' : 'Female' },
  ];

  const cityFilters = [
    { key: 'تهران' as const, label: lang === 'fa' ? 'تهران' : 'Tehran', active: true },
    { key: 'other' as const, label: lang === 'fa' ? 'سایر شهرها' : 'Other', active: false },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.h1 variants={item} className="text-2xl font-extrabold gradient-text">
        {lang === 'fa' ? 'بازدید بلاگرها' : 'Browse Bloggers'}
      </motion.h1>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-wrap gap-3">
        {/* Gender */}
        <div className="flex gap-1.5 items-center">
          <span className="text-xs text-muted-foreground me-1">{lang === 'fa' ? 'جنسیت:' : 'Gender:'}</span>
          {genderFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setGender(f.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                gender === f.key ? 'gradient-bg text-primary-foreground shadow-lg shadow-primary/20' : 'glass'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* City */}
        <div className="flex gap-1.5 items-center">
          <span className="text-xs text-muted-foreground me-1">{lang === 'fa' ? 'شهر:' : 'City:'}</span>
          {cityFilters.map(f => (
            <button
              key={f.key}
              onClick={() => f.active && setCity(f.key)}
              disabled={!f.active}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                city === f.key && f.active
                  ? 'gradient-bg text-primary-foreground shadow-lg shadow-primary/20'
                  : f.active
                  ? 'glass'
                  : 'glass opacity-40 cursor-not-allowed'
              }`}
            >
              {f.label}
            </button>
          ))}
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
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-primary/30 mb-3">
              {b.avatar_url ? (
                <img src={b.avatar_url} alt={b.display_name || b.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-bg flex items-center justify-center text-xl font-bold text-primary-foreground">
                  {(b.display_name || b.username)?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            {/* Name */}
            <h3 className="font-bold text-sm truncate w-full">{b.display_name || b.username}</h3>
            <p className="text-[11px] text-muted-foreground">@{b.username}</p>

            {/* Followers */}
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
