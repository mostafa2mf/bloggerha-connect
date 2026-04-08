import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Search, SlidersHorizontal, MapPin, Calendar, Bookmark, TrendingUp, Sparkles, Loader2, FolderOpen, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import jalaali from 'jalaali-js';

const categories = ['همه', 'زیبایی', 'مد', 'تکنولوژی', 'غذا', 'سفر', 'ورزش'];

function toJalaliStr(dateStr: string) {
  const d = new Date(dateStr);
  const j = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const DashExplore = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [activeCat, setActiveCat] = useState('همه');
  const [searchQuery, setSearchQuery] = useState('');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
    if (user) fetchMyApplications();
  }, [user]);

  const fetchCampaigns = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (!error && data) setCampaigns(data);
    setLoading(false);
  };

  const fetchMyApplications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('applications')
      .select('campaign_id')
      .eq('blogger_id', user.id);
    if (data) setAppliedIds(new Set(data.map(a => a.campaign_id)));
  };

  const handleApply = async (campaignId: string) => {
    if (!user) { toast.error(lang === 'fa' ? 'ابتدا وارد شوید' : 'Please login first'); return; }
    setApplyingId(campaignId);
    const { error } = await supabase.from('applications').insert({
      campaign_id: campaignId,
      blogger_id: user.id,
      status: 'pending',
    });
    if (error) {
      toast.error(lang === 'fa' ? 'خطا در ارسال درخواست' : 'Error submitting application');
    } else {
      toast.success(lang === 'fa' ? 'درخواست همکاری ارسال شد' : 'Application submitted');
      setAppliedIds(prev => new Set(prev).add(campaignId));
    }
    setApplyingId(null);
  };

  const filtered = campaigns
    .filter(c => activeCat === 'همه' || c.category === activeCat)
    .filter(c => !searchQuery || c.title?.includes(searchQuery) || c.description?.includes(searchQuery));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.h1 variants={item} className="text-2xl font-bold gradient-text">{t('dash.explore')}</motion.h1>

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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass rounded-3xl overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div variants={item} className="glass rounded-3xl p-12 text-center">
          <FolderOpen size={48} className="mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-bold mb-2">{lang === 'fa' ? 'کمپینی یافت نشد' : 'No campaigns found'}</h3>
          <p className="text-sm text-muted-foreground">{lang === 'fa' ? 'در حال حاضر کمپین فعالی وجود ندارد' : 'No active campaigns at the moment'}</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => {
            const alreadyApplied = appliedIds.has(c.id);
            return (
              <motion.div
                key={c.id}
                variants={item}
                className="glass rounded-3xl overflow-hidden group cursor-pointer hover:glow-border transition-all duration-300"
                whileTap={{ scale: 0.98 }}
              >
                <div className="h-40 overflow-hidden relative bg-muted">
                  {c.cover_image ? (
                    <img src={c.cover_image} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                      <Sparkles size={48} />
                    </div>
                  )}
                  <button className="absolute top-3 end-3 p-2 rounded-xl glass text-foreground/80 hover:text-primary transition-colors">
                    <Bookmark size={16} />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold truncate">{c.title}</h3>
                    {c.budget && <span className="text-sm font-bold text-primary shrink-0">{c.budget} تومان</span>}
                  </div>
                  {c.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{c.description}</p>}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {c.city && <span className="flex items-center gap-1"><MapPin size={12} /> {c.city}</span>}
                      {c.start_date && <span className="flex items-center gap-1"><Calendar size={12} /> {toJalaliStr(c.start_date)}</span>}
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      disabled={alreadyApplied || applyingId === c.id}
                      onClick={() => handleApply(c.id)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                        alreadyApplied
                          ? 'bg-green-500/10 text-green-400 cursor-default'
                          : 'gradient-bg text-primary-foreground hover:opacity-90'
                      }`}
                    >
                      {applyingId === c.id ? <Loader2 size={12} className="animate-spin" /> :
                       alreadyApplied ? <><CheckCircle2 size={12} /> {lang === 'fa' ? 'ارسال شده' : 'Applied'}</> :
                       lang === 'fa' ? 'درخواست همکاری' : 'Apply'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default DashExplore;
