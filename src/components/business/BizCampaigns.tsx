import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit3, Copy, Archive, Trash2, Eye, Users, MapPin, Calendar, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import CreateCampaignModal from './CreateCampaignModal';

type Campaign = {
  id: string;
  title: string;
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

const tabFilters = ['all', 'draft', 'active', 'scheduled', 'completed', 'archived'] as const;

const statusBadge: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-500/10 text-blue-400',
  completed: 'bg-purple-500/10 text-purple-400',
  archived: 'bg-muted text-muted-foreground',
};

const BizCampaigns = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const tabLabels: Record<string, string> = {
    all: lang === 'fa' ? 'همه' : 'All',
    draft: lang === 'fa' ? 'پیش‌نویس' : 'Draft',
    active: lang === 'fa' ? 'فعال' : 'Active',
    scheduled: lang === 'fa' ? 'زمان‌بندی' : 'Scheduled',
    completed: lang === 'fa' ? 'انجام شده' : 'Completed',
    archived: lang === 'fa' ? 'آرشیو' : 'Archived',
  };

  const fetchCampaigns = async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase.from('campaigns').select('*').eq('business_id', user.id).order('created_at', { ascending: false });
    if (activeTab !== 'all') {
      query = query.eq('status', activeTab);
    }
    const { data } = await query;
    setCampaigns((data as Campaign[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, [activeTab, user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(lang === 'fa' ? 'کمپین حذف شد' : 'Campaign deleted');
    fetchCampaigns();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold gradient-text">{lang === 'fa' ? 'کمپین‌ها' : 'Campaigns'}</h1>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setCreateOpen(true)}
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
          ) : campaigns.length === 0 ? (
            <div className="glass rounded-3xl p-8 text-center">
              <Clock size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">{lang === 'fa' ? 'هیچ کمپینی وجود ندارد' : 'No campaigns found'}</p>
            </div>
          ) : (
            campaigns.map((c) => (
              <motion.div key={c.id} className="glass rounded-3xl overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {c.cover_image && (
                  <div className="h-32 overflow-hidden relative">
                    <img src={c.cover_image} alt={c.title} className="w-full h-full object-cover" />
                    <span className={`absolute top-3 start-3 text-[10px] font-medium px-2.5 py-1 rounded-full ${statusBadge[c.status] || statusBadge.draft}`}>
                      {c.status}
                    </span>
                  </div>
                )}
                {!c.cover_image && (
                  <div className="px-4 pt-4">
                    <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${statusBadge[c.status] || statusBadge.draft}`}>
                      {c.status}
                    </span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold mb-1">{c.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    {c.city && <span className="flex items-center gap-1"><MapPin size={11} /> {c.city}</span>}
                    {c.start_date && <span className="flex items-center gap-1"><Calendar size={11} /> {c.start_date}</span>}
                    {c.budget && <span className="font-medium text-primary">{c.budget} تومان</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><Users size={11} /> {c.applicants_count || 0} درخواست</span>
                    <span>{c.approved_count || 0} تأیید شده</span>
                  </div>
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.95 }} className="flex-1 gradient-bg text-primary-foreground text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1 hover:opacity-90 transition-opacity">
                      <Eye size={12} /> {lang === 'fa' ? 'مشاهده درخواست‌ها' : 'View Applicants'}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} className="glass text-xs py-2 px-3 rounded-xl hover:bg-muted/50 transition-colors"><Edit3 size={14} /></motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} className="glass text-xs py-2 px-3 rounded-xl hover:bg-muted/50 transition-colors"><Copy size={14} /></motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleDelete(c.id)} className="glass text-xs py-2 px-3 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 size={14} /></motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>

      <CreateCampaignModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreated={fetchCampaigns} />
    </motion.div>
  );
};

export default BizCampaigns;
