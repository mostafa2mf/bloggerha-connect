import { useState, useEffect, useMemo } from 'react';
import BackButton from '@/components/shared/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Calendar, Loader2, FolderOpen, CheckCircle2, Clock, ChevronLeft, Phone, Sparkles, Search, Filter, SlidersHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';
import jalaali from 'jalaali-js';
import SkeletonCard from '@/components/shared/SkeletonCard';
import { isCampaignVisibleToBlogger } from '@/lib/campaignVisibility';

function toJalaliStr(dateStr: string) {
  const d = new Date(dateStr);
  const j = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
}

const tabFilters = ['available', 'pending', 'approved'] as const;

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const fakeImages = [
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
];

const cities = ['تهران', 'اصفهان', 'شیراز', 'مشهد', 'تبریز', 'اهواز', 'کرج', 'قم'];
const categories = ['رستوران', 'کافه', 'هتل', 'فروشگاه', 'آرایشگاه', 'ورزشی', 'گردشگری', 'فناوری'];

const DashCampaigns = ({ onGoBack }: { onGoBack?: () => void }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('available');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [carouselIdx, setCarouselIdx] = useState<Record<string, number>>({});
  const [hasPendingReview, setHasPendingReview] = useState(false);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');

  useEffect(() => {
    fetchCampaigns();
    if (user) {
      fetchMyApplications();
      checkPendingReviews();
    }
  }, [user]);

  const checkPendingReviews = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('upload_reviews')
      .select('id')
      .eq('blogger_id', user.id)
      .eq('status', 'pending')
      .limit(1);
    setHasPendingReview((data || []).length > 0);
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .in('admin_approval_status', ['approved', 'accepted', 'active', 'verified'])
      .in('status', ['active', 'scheduled', 'approved', 'live'])
      .order('created_at', { ascending: false })
      .limit(50);

    setCampaigns((data || []).filter((c: any) => isCampaignVisibleToBlogger(c.admin_approval_status, c.status)));
    setLoading(false);
  };

  const fetchMyApplications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('applications')
      .select('campaign_id, status')
      .eq('blogger_id', user.id);
    if (data) {
      setAppliedIds(new Set(data.filter(a => a.status === 'pending').map(a => a.campaign_id)));
      setApprovedIds(new Set(data.filter(a => a.status === 'accepted').map(a => a.campaign_id)));
    }
  };

  const handleApply = async (campaignId: string) => {
    if (!user) { toast.error(lang === 'fa' ? 'ابتدا وارد شوید' : 'Please login first'); return; }
    if (hasPendingReview) {
      toast.error(lang === 'fa' ? 'ابتدا بازبینی قبلی باید توسط ادمین تأیید شود' : 'Previous review must be approved first');
      return;
    }
    setApplyingId(campaignId);
    const { error } = await supabase.from('applications').insert({
      campaign_id: campaignId,
      blogger_id: user.id,
      status: 'pending',
    });
    if (error) {
      toast.error(lang === 'fa' ? 'خطا در ارسال درخواست' : 'Error submitting');
    } else {
      toast.success(lang === 'fa' ? '✨ درخواست آفر ارسال شد' : '✨ Application submitted');
      setAppliedIds(prev => new Set(prev).add(campaignId));
    }
    setApplyingId(null);
  };

  const nextSlide = (id: string) => {
    setCarouselIdx(prev => ({ ...prev, [id]: ((prev[id] || 0) + 1) % fakeImages.length }));
  };

  const tabLabels: Record<string, string> = {
    available: lang === 'fa' ? 'آفرهای موجود' : 'Available',
    pending: lang === 'fa' ? 'در انتظار تأیید' : 'Pending',
    approved: lang === 'fa' ? 'تأیید شده' : 'Approved',
  };

  const filteredCampaigns = useMemo(() => {
    let result = campaigns.filter(c => {
      const isPending = appliedIds.has(c.id);
      const isApproved = approvedIds.has(c.id);
      if (activeTab === 'pending') return isPending;
      if (activeTab === 'approved') return isApproved;
      return !isPending && !isApproved;
    });

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q)
      );
    }

    // City filter
    if (filterCity) {
      result = result.filter(c => c.city === filterCity);
    }

    // Category filter
    if (filterCategory) {
      result = result.filter(c => c.category === filterCategory);
    }

    // Sort
    if (sortBy === 'popular') {
      result = [...result].sort((a, b) => (b.applicants_count || 0) - (a.applicants_count || 0));
    }

    return result;
  }, [campaigns, activeTab, appliedIds, approvedIds, searchQuery, filterCity, filterCategory, sortBy]);

  const hasActiveFilters = searchQuery || filterCity || filterCategory;

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCity('');
    setFilterCategory('');
    setSortBy('newest');
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {onGoBack && <BackButton onGoBack={onGoBack} />}
      <motion.h1 variants={item} className="text-2xl font-extrabold gradient-text">
        {lang === 'fa' ? 'کمپین‌ها' : 'Campaigns'}
      </motion.h1>

      {/* Search Bar */}
      <motion.div variants={item} className="relative">
        <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={lang === 'fa' ? 'جستجوی کمپین...' : 'Search campaigns...'}
          className="w-full glass rounded-2xl ps-10 pe-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute end-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${showFilters ? 'gradient-bg text-primary-foreground' : 'hover:bg-muted'}`}
        >
          <SlidersHorizontal size={16} />
        </button>
      </motion.div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold flex items-center gap-1.5">
                  <Filter size={13} />
                  {lang === 'fa' ? 'فیلترها' : 'Filters'}
                </h4>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-[10px] text-destructive hover:underline flex items-center gap-1">
                    <X size={10} /> {lang === 'fa' ? 'حذف فیلترها' : 'Clear'}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* City */}
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">{lang === 'fa' ? 'شهر' : 'City'}</label>
                  <select
                    value={filterCity}
                    onChange={e => setFilterCity(e.target.value)}
                    className="w-full glass rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">{lang === 'fa' ? 'همه شهرها' : 'All cities'}</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {/* Category */}
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">{lang === 'fa' ? 'دسته‌بندی' : 'Category'}</label>
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="w-full glass rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">{lang === 'fa' ? 'همه دسته‌ها' : 'All categories'}</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {/* Sort */}
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">{lang === 'fa' ? 'مرتب‌سازی' : 'Sort'}</label>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="w-full glass rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="newest">{lang === 'fa' ? 'جدیدترین' : 'Newest'}</option>
                    <option value="popular">{lang === 'fa' ? 'محبوب‌ترین' : 'Most Popular'}</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <motion.div variants={item} className="flex gap-2">
        {tabFilters.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === tab
                ? 'gradient-bg text-primary-foreground shadow-lg shadow-primary/20'
                : 'glass hover:glow-border'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </motion.div>

      {/* Campaign Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + searchQuery + filterCity + filterCategory + sortBy}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {loading ? (
            <SkeletonCard count={4} type="card" />
          ) : filteredCampaigns.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center">
              <FolderOpen size={40} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters
                  ? (lang === 'fa' ? 'نتیجه‌ای با فیلترهای انتخابی یافت نشد' : 'No results match your filters')
                  : (lang === 'fa' ? 'کمپینی یافت نشد' : 'No campaigns found')}
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-primary hover:underline mt-2">
                  {lang === 'fa' ? 'حذف فیلترها' : 'Clear filters'}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCampaigns.map((c) => {
                const isExpanded = expandedId === c.id;
                const slideIdx = carouselIdx[c.id] || 0;
                const isPending = appliedIds.has(c.id);
                const isApproved = approvedIds.has(c.id);

                return (
                  <motion.div
                    key={c.id}
                    variants={item}
                    className="glass rounded-2xl overflow-hidden border border-primary/10 shadow-lg shadow-primary/5 cursor-pointer hover:shadow-primary/15 transition-all"
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  >
                    {/* Image */}
                    <div className="relative h-32 overflow-hidden bg-muted">
                      {c.cover_image ? (
                        <img src={c.cover_image} alt={c.title} className="w-full h-full object-cover" />
                      ) : (
                        <img src={fakeImages[slideIdx]} alt="" className="w-full h-full object-cover transition-all duration-500" />
                      )}
                      {!c.cover_image && (
                        <button
                          onClick={(e) => { e.stopPropagation(); nextSlide(c.id); }}
                          className="absolute top-1/2 end-2 -translate-y-1/2 glass rounded-full p-1 opacity-70 hover:opacity-100"
                        >
                          <ChevronLeft size={14} />
                        </button>
                      )}
                      {isPending && (
                        <span className="absolute top-2 start-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                          ⏳ {lang === 'fa' ? 'در انتظار' : 'Pending'}
                        </span>
                      )}
                      {isApproved && (
                        <span className="absolute top-2 start-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                          ✓ {lang === 'fa' ? 'تأیید شده' : 'Approved'}
                        </span>
                      )}
                      {c.category && (
                        <span className="absolute bottom-2 start-2 text-[8px] font-bold px-2 py-0.5 rounded-full glass backdrop-blur-sm">
                          {c.category}
                        </span>
                      )}
                    </div>

                    <div className="p-3">
                      <h3 className="font-bold text-sm truncate">{c.title}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                        {c.city && <span className="flex items-center gap-0.5"><MapPin size={10} />{c.city}</span>}
                        {c.start_date && <span className="flex items-center gap-0.5"><Calendar size={10} />{toJalaliStr(c.start_date)}</span>}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 space-y-2 text-xs">
                              {c.description && (
                                <p className="text-muted-foreground leading-relaxed">{c.description}</p>
                              )}
                              <div className="glass rounded-xl p-2.5 border border-primary/10">
                                <p className="font-bold text-primary text-[11px] mb-1">
                                  <Sparkles size={12} className="inline me-1" />
                                  {lang === 'fa' ? 'فعالیت مورد نیاز:' : 'Required Activity:'}
                                </p>
                                <p className="text-muted-foreground text-[10px] leading-relaxed">
                                  {lang === 'fa' 
                                    ? '۱ عدد Reels و ۳ عدد Story از لوکیشن با تگ برند' 
                                    : '1 Reels + 3 Stories from location with brand tag'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin size={11} className="text-primary shrink-0" />
                                <span className="text-[10px]">{c.city || 'تهران'}، خیابان ولیعصر، پلاک ۱۲۳</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone size={11} className="text-primary shrink-0" />
                                <span className="text-[10px] font-medium" dir="ltr">021-1234567</span>
                              </div>

                              {!isPending && !isApproved && (
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  disabled={applyingId === c.id}
                                  onClick={(e) => { e.stopPropagation(); handleApply(c.id); }}
                                  className="w-full gradient-bg text-primary-foreground font-bold py-2.5 rounded-xl text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20 mt-1"
                                >
                                  {applyingId === c.id ? <Loader2 size={14} className="animate-spin" /> : null}
                                  {lang === 'fa' ? 'درخواست آفر' : 'Apply for Offer'}
                                </motion.button>
                              )}
                              {isPending && (
                                <div className="w-full text-center py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400">
                                  <Clock size={12} className="inline me-1" />
                                  {lang === 'fa' ? 'در انتظار تأیید ادمین' : 'Awaiting Admin Approval'}
                                </div>
                              )}
                              {isApproved && (
                                <div className="w-full text-center py-2 rounded-xl text-xs font-bold bg-green-500/10 text-green-400">
                                  <CheckCircle2 size={12} className="inline me-1" />
                                  {lang === 'fa' ? 'تأیید شده — آماده بازدید' : 'Approved — Ready to Visit'}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default DashCampaigns;
