import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle, Clock, Megaphone, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  city: string | null;
  category: string | null;
  budget: string | null;
  start_date: string | null;
  end_date: string | null;
  cover_image: string | null;
  status: string;
  admin_approval_status: string;
  business_id: string;
  created_at: string;
  profiles?: { username: string; brand_name: string | null } | null;
};

const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { fetchCampaigns(); }, [filter]);

  const fetchCampaigns = async () => {
    setLoading(true);
    let query = supabase.from('campaigns').select('*').order('created_at', { ascending: false });
    if (filter === 'pending') query = query.eq('admin_approval_status', 'pending');
    const { data } = await query;

    if (data && data.length > 0) {
      const bizIds = [...new Set(data.map(c => c.business_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, username, brand_name').in('user_id', bizIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      setCampaigns(data.map(c => ({ ...c, profiles: profileMap.get(c.business_id) || null })) as Campaign[]);
    } else {
      setCampaigns([]);
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setProcessing(id);
    const { error } = await supabase.from('campaigns').update({ admin_approval_status: 'approved', status: 'active' }).eq('id', id);
    if (error) toast.error(error.message);
    else toast.success('Campaign approved');
    setProcessing(null);
    fetchCampaigns();
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    const reason = rejectReason[id] || '';
    const { error } = await supabase.from('campaigns').update({
      admin_approval_status: 'rejected',
      status: 'inactive',
      description: reason ? `[REJECTED] ${reason}` : undefined,
    } as any).eq('id', id);
    if (error) toast.error(error.message);
    else toast.success('Campaign rejected');
    setProcessing(null);
    fetchCampaigns();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setFilter('pending')} className={`px-4 py-1.5 rounded-xl text-xs font-bold ${filter === 'pending' ? 'gradient-bg text-primary-foreground' : 'glass'}`}>
          <Clock size={12} className="inline me-1" /> Pending
        </button>
        <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-xl text-xs font-bold ${filter === 'all' ? 'gradient-bg text-primary-foreground' : 'glass'}`}>
          All
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
      ) : campaigns.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
          <Megaphone size={32} className="mx-auto mb-3 opacity-40" />
          No campaigns found
        </div>
      ) : (
        campaigns.map(c => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl overflow-hidden">
            <div className="flex gap-4 p-4">
              {c.cover_image && (
                <img src={c.cover_image} alt={c.title} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm">{c.title}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      by {c.profiles?.brand_name || c.profiles?.username || 'Unknown'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    c.admin_approval_status === 'approved' ? 'bg-green-500/10 text-green-400' :
                    c.admin_approval_status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    {c.admin_approval_status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap">
                  {c.city && <span className="flex items-center gap-1"><MapPin size={10} /> {c.city}</span>}
                  {c.category && <span>{c.category}</span>}
                  {c.start_date && <span className="flex items-center gap-1"><Calendar size={10} /> {c.start_date}</span>}
                </div>
                {c.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
              </div>
            </div>

            {c.admin_approval_status === 'pending' && (
              <div className="p-4 pt-0 space-y-2">
                <input
                  value={rejectReason[c.id] || ''}
                  onChange={e => setRejectReason(prev => ({ ...prev, [c.id]: e.target.value }))}
                  placeholder="Rejection reason (optional)..."
                  className="w-full bg-background/50 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(c.id)}
                    disabled={processing === c.id}
                    className="flex-1 bg-green-500/15 text-green-500 font-bold py-2 rounded-xl text-xs hover:bg-green-500/25 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {processing === c.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Approve
                  </button>
                  <button
                    onClick={() => handleReject(c.id)}
                    disabled={processing === c.id}
                    className="flex-1 bg-red-500/15 text-red-500 font-bold py-2 rounded-xl text-xs hover:bg-red-500/25 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {processing === c.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />} Reject
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))
      )}
    </div>
  );
};

export default AdminCampaigns;
