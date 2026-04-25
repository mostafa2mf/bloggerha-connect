import { useState, useEffect } from 'react';
import BackButton from '@/components/shared/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit3, Trash2, Eye, Users, MapPin, Calendar, Clock, Loader2, RefreshCw, PowerOff } from 'lucide-react';
import { toast } from 'sonner';
import CreateCampaignModal from './CreateCampaignModal';

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  city: string | null;
  budget: string | null;
  start_date: string | null;
  end_date: string | null;
  applicants_count: number | null;
  approved_count: number | null;
  status: string;
  cover_image: string | null;
  admin_approval_status: string;
};

type TabKey = 'all' | 'pending' | 'active' | 'inactive';
const tabFilters: TabKey[] = ['all', 'pending', 'active', 'inactive'];

const BizCampaigns = ({ onGoBack }: { onGoBack?: () => void }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);

  const tabLabels: Record<TabKey, string> = {
    all: lang === 'fa' ? 'همه' : 'All',
    pending: lang === 'fa' ? 'در انتظار تأیید' : 'Pending Approval',
    active: lang === 'fa' ? 'فعال' : 'Active',
    inactive: lang === 'fa' ? 'غیرفعال' : 'Inactive',
  };

  const fetchCampaigns = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('business_id', user.id)
      .order('created_at', { ascending: false });
    setCampaigns((data as Campaign[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, [user]);

  const bucketOf = (c: Campaign): TabKey => {
    if (c.admin_approval_status === 'pending') return 'pending';
    if (c.admin_approval_status === 'approved' && c.status === 'active') return 'active';
    return 'inactive'; // rejected, draft, archived, completed, etc.
  };

  const visible = campaigns.filter(c => activeTab === 'all' ? true : bucketOf(c) === activeTab);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(lang === 'fa' ? 'کمپین حذف شد' : 'Campaign deleted');
    fetchCampaigns();
  };

  const handleDeactivate = async (id: string) => {
    const { error } = await supabase.from('campaigns').update({ status: 'inactive' }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(lang === 'fa' ? 'کمپین غیرفعال شد' : 'Campaign deactivated');
    fetchCampaigns();
  };

  const renderBadges = (c: Campaign) => {
    const bucket = bucketOf(c);
    const map: Record<TabKey, { fa: string; en: string; cls: string }> = {
      pending: { fa: '⏳ در انتظار تأیید ادمین', en: '⏳ Pending Admin', cls: 'bg-amber-500/10 text-amber-400' },
      active: { fa: '✓ فعال', en: '✓ Active', cls: 'bg-green-500/10 text-green-400' },
      inactive: {
        fa: c.admin_approval_status === 'rejected' ? '✗ رد شده' : '⛔ غیرفعال',
        en: c.admin_approval_status === 'rejected' ? '✗ Rejected' : '⛔ Inactive',
        cls: c.admin_approval_status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-muted text-muted-foreground',
      },
      all: { fa: '', en: '', cls: '' },
    };
    const b = map[bucket];
    return (
      <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${b.cls}`}>
        {lang === 'fa' ? b.fa : b.en}
      </span>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {onGoBack && <BackButton onGoBack={onGoBack} />}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold gradient-text">{lang === 'fa' ? 'کمپین‌ها' : 'Campaigns'}</h1>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { setEditing(null); setCreateOpen(true); }}
          className="gradient-bg text-primary-foreground text-xs font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
        >
          <Plus size={14} /> {lang === 'fa' ? 'ساخت کمپین' : 'Create Campaign'}
        </motion.button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4">
        {tabFilters.map(tab => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            whileTap={{ scale: 0.95 }}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
              activeTab === tab ? 'gradient-bg text-primary-foreground shadow-lg shadow-primary/20' : 'glass'
            }`}
          >
            {tabLabels[tab]}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
          {loading ? (
            <div className="glass rounded-3xl p-8 flex justify-center">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : visible.length === 0 ? (
            <div className="glass rounded-3xl p-8 text-center">
              <Clock size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">{lang === 'fa' ? 'هیچ کمپینی وجود ندارد' : 'No campaigns found'}</p>
            </div>
          ) : (
            visible.map((c) => {
              const bucket = bucketOf(c);
              const isInactive = bucket === 'inactive';
              const isActive = bucket === 'active';
              return (
                <motion.div key={c.id} className="glass rounded-3xl overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  {c.cover_image && (
                    <div className="h-32 overflow-hidden relative">
                      <img src={c.cover_image} alt={c.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 start-3">{renderBadges(c)}</div>
                    </div>
                  )}
                  {!c.cover_image && (
                    <div className="px-4 pt-4">{renderBadges(c)}</div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold mb-1">{c.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2 flex-wrap">
                      {c.city && <span className="flex items-center gap-1"><MapPin size={11} /> {c.city}</span>}
                      {c.start_date && <span className="flex items-center gap-1"><Calendar size={11} /> {c.start_date}</span>}
                      {c.budget && <span className="font-medium text-primary">{c.budget} تومان</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><Users size={11} /> {c.applicants_count || 0} {lang === 'fa' ? 'درخواست' : 'apps'}</span>
                      <span>{c.approved_count || 0} {lang === 'fa' ? 'تأیید شده' : 'approved'}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {isActive && (
                        <>
                          <motion.button whileTap={{ scale: 0.95 }} className="flex-1 gradient-bg text-primary-foreground text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1 hover:opacity-90 transition-opacity">
                            <Eye size={12} /> {lang === 'fa' ? 'مشاهده درخواست‌ها' : 'View Applicants'}
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleDeactivate(c.id)} className="glass text-xs py-2 px-3 rounded-xl hover:bg-muted/50 transition-colors" title={lang === 'fa' ? 'غیرفعال کردن' : 'Deactivate'}><PowerOff size={14} /></motion.button>
                        </>
                      )}
                      {isInactive && (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => { setEditing(c); setCreateOpen(true); }}
                          className="flex-1 gradient-bg text-primary-foreground text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1 hover:opacity-90 transition-opacity"
                        >
                          <RefreshCw size={12} /> {lang === 'fa' ? 'ادیت و ارسال مجدد' : 'Edit & Resubmit'}
                        </motion.button>
                      )}
                      {bucket === 'pending' && (
                        <div className="flex-1 text-center text-xs text-muted-foreground py-2">
                          {lang === 'fa' ? 'منتظر تأیید ادمین…' : 'Awaiting admin approval…'}
                        </div>
                      )}
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setEditing(c); setCreateOpen(true); }} className="glass text-xs py-2 px-3 rounded-xl hover:bg-muted/50 transition-colors"><Edit3 size={14} /></motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleDelete(c.id)} className="glass text-xs py-2 px-3 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 size={14} /></motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>

      <CreateCampaignModal
        isOpen={createOpen}
        onClose={() => { setCreateOpen(false); setEditing(null); }}
        onCreated={fetchCampaigns}
        editCampaign={editing}
      />
    </motion.div>
  );
};

export default BizCampaigns;
