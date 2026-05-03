import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle, Clock, Upload, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

type Review = {
  id: string;
  blogger_id: string;
  campaign_id: string;
  images: string[];
  status: string;
  admin_note: string | null;
  created_at: string;
  blogger_name?: string;
  campaign_title?: string;
};

const AdminContentReview = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  useEffect(() => { fetchReviews(); }, [filter]);

  const fetchReviews = async () => {
    setLoading(true);
    let query = supabase.from('upload_reviews').select('*, campaigns(title)').order('created_at', { ascending: false });
    if (filter === 'pending') query = query.eq('status', 'pending');
    const { data } = await query;

    if (data && data.length > 0) {
      const bloggerIds = [...new Set(data.map((r: any) => r.blogger_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, username').in('user_id', bloggerIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.username]));
      setReviews(data.map((r: any) => ({
        ...r,
        blogger_name: profileMap.get(r.blogger_id) || 'Unknown',
        campaign_title: r.campaigns?.title || 'Campaign',
      })));
    } else {
      setReviews([]);
    }
    setLoading(false);
  };

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setProcessing(id);
    const admin_note = notes[id] || null;
    const { error } = await supabase.from('upload_reviews').update({ status, admin_note }).eq('id', id);
    if (error) toast.error(error.message);
    else toast.success(`Review ${status}`);
    setProcessing(null);
    fetchReviews();
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
      ) : reviews.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
          <Upload size={32} className="mx-auto mb-3 opacity-40" />
          No reviews found
        </div>
      ) : (
        reviews.map(r => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-sm">{r.blogger_name}</h3>
                <p className="text-[11px] text-muted-foreground">{r.campaign_title} · {new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                r.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                r.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                'bg-amber-500/10 text-amber-400'
              }`}>
                {r.status}
              </span>
            </div>

            {/* Images */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {r.images.map((img, i) => (
                <div key={i} className="rounded-xl overflow-hidden aspect-square cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewImg(img)}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            {r.status === 'pending' && (
              <div className="space-y-2">
                <input
                  value={notes[r.id] || ''}
                  onChange={e => setNotes(prev => ({ ...prev, [r.id]: e.target.value }))}
                  placeholder="Admin note (optional)..."
                  className="w-full bg-background/50 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <div className="flex gap-2">
                  <button onClick={() => handleAction(r.id, 'approved')} disabled={processing === r.id} className="flex-1 bg-green-500/15 text-green-500 font-bold py-2 rounded-xl text-xs hover:bg-green-500/25 disabled:opacity-50 flex items-center justify-center gap-1">
                    {processing === r.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Approve
                  </button>
                  <button onClick={() => handleAction(r.id, 'rejected')} disabled={processing === r.id} className="flex-1 bg-red-500/15 text-red-500 font-bold py-2 rounded-xl text-xs hover:bg-red-500/25 disabled:opacity-50 flex items-center justify-center gap-1">
                    {processing === r.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />} Reject
                  </button>
                </div>
              </div>
            )}

            {r.admin_note && r.status !== 'pending' && (
              <p className="text-[11px] text-muted-foreground bg-muted/30 rounded-lg p-2 mt-2">Note: {r.admin_note}</p>
            )}
          </motion.div>
        ))
      )}

      {/* Image Preview Modal */}
      {previewImg && (
        <div className="fixed inset-0 z-[200] bg-background/90 flex items-center justify-center p-4" onClick={() => setPreviewImg(null)}>
          <img src={previewImg} alt="" className="max-w-full max-h-full rounded-2xl" />
        </div>
      )}
    </div>
  );
};

export default AdminContentReview;
