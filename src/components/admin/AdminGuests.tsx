import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Users, Calendar, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type Guest = {
  id: string;
  business_id: string;
  blogger_name: string | null;
  visit_date: string;
  visit_time: string | null;
  status: string;
  notes: string | null;
  campaign_id: string | null;
};

type Business = {
  user_id: string;
  username: string;
  brand_name: string | null;
};

const AdminGuests = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ business_id: '', blogger_name: '', visit_date: '', visit_time: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchGuests(); fetchBusinesses(); }, []);

  const fetchGuests = async () => {
    setLoading(true);
    const { data } = await supabase.from('guests' as any).select('*').order('visit_date', { ascending: true });
    setGuests((data || []) as any as Guest[]);
    setLoading(false);
  };

  const fetchBusinesses = async () => {
    const { data } = await supabase.from('profiles').select('user_id, username, brand_name').eq('role', 'business');
    setBusinesses((data || []) as Business[]);
  };

  const handleAdd = async () => {
    if (!form.business_id || !form.blogger_name || !form.visit_date) {
      toast.error('Business, name and date are required');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('guests' as any).insert({
      business_id: form.business_id,
      blogger_name: form.blogger_name,
      visit_date: form.visit_date,
      visit_time: form.visit_time || null,
      notes: form.notes || null,
      status: 'scheduled',
    } as any);
    if (error) toast.error(error.message);
    else {
      toast.success('Guest assigned');
      setShowAdd(false);
      setForm({ business_id: '', blogger_name: '', visit_date: '', visit_time: '', notes: '' });
      fetchGuests();
    }
    setSubmitting(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('guests' as any).update({ status } as any).eq('id', id);
    fetchGuests();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold flex items-center gap-2"><Users size={14} /> Manage Guests</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="gradient-bg text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1">
          <Plus size={12} /> Assign Guest
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="glass rounded-2xl p-4 space-y-3">
              <select value={form.business_id} onChange={e => setForm(f => ({ ...f, business_id: e.target.value }))} className="w-full bg-background/50 border border-border rounded-xl px-3 py-2 text-xs">
                <option value="">Select Business...</option>
                {businesses.map(b => (
                  <option key={b.user_id} value={b.user_id}>{b.brand_name || b.username}</option>
                ))}
              </select>
              <input value={form.blogger_name} onChange={e => setForm(f => ({ ...f, blogger_name: e.target.value }))} placeholder="Blogger/Guest name" className="w-full bg-background/50 border border-border rounded-xl px-3 py-2 text-xs" />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={form.visit_date} onChange={e => setForm(f => ({ ...f, visit_date: e.target.value }))} className="bg-background/50 border border-border rounded-xl px-3 py-2 text-xs" />
                <input type="time" value={form.visit_time} onChange={e => setForm(f => ({ ...f, visit_time: e.target.value }))} className="bg-background/50 border border-border rounded-xl px-3 py-2 text-xs" placeholder="Time (optional)" />
              </div>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes (optional)" className="w-full bg-background/50 border border-border rounded-xl px-3 py-2 text-xs" />
              <div className="flex gap-2">
                <button onClick={handleAdd} disabled={submitting} className="flex-1 gradient-bg text-primary-foreground font-bold py-2 rounded-xl text-xs disabled:opacity-50">
                  {submitting ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'Assign'}
                </button>
                <button onClick={() => setShowAdd(false)} className="glass px-4 py-2 rounded-xl text-xs">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={20} /></div>
      ) : guests.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">No guests assigned yet</div>
      ) : (
        <div className="space-y-2">
          {guests.map(g => (
            <div key={g.id} className="glass rounded-2xl p-3 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{g.blogger_name}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                  <Calendar size={10} /> {g.visit_date} {g.visit_time && `· ${g.visit_time}`}
                </p>
                {g.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{g.notes}</p>}
              </div>
              <select
                value={g.status}
                onChange={e => updateStatus(g.id, e.target.value)}
                className="bg-background/50 border border-border rounded-lg px-2 py-1 text-[10px]"
              >
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminGuests;
