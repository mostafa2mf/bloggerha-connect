import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle, Clock, Users, Instagram, MapPin, Tag, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

type Profile = {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  brand_name: string | null;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  followers_count: number | null;
  category: string | null;
  city: string | null;
  role: string;
  approval_status: string;
  avatar_url: string | null;
  images: string[] | null;
  created_at: string;
};

const AdminUserApprovals = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [roleFilter, setRoleFilter] = useState<'all' | 'blogger' | 'business'>('all');
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { fetchProfiles(); }, [filter, roleFilter]);

  const fetchProfiles = async () => {
    setLoading(true);
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (filter === 'pending') query = query.eq('approval_status', 'pending');
    if (roleFilter !== 'all') query = query.eq('role', roleFilter);
    query = query.neq('role', 'admin');
    const { data } = await query;
    setProfiles((data || []) as Profile[]);
    setLoading(false);
  };

  const handleApprove = async (userId: string) => {
    setProcessing(userId);
    const { error } = await supabase.from('profiles').update({ approval_status: 'approved' }).eq('user_id', userId);
    if (error) toast.error(error.message);
    else toast.success('User approved');
    setProcessing(null);
    fetchProfiles();
  };

  const handleReject = async (userId: string) => {
    setProcessing(userId);
    const { error } = await supabase.from('profiles').update({ approval_status: 'rejected' }).eq('user_id', userId);
    if (error) toast.error(error.message);
    else toast.success('User rejected');
    setProcessing(null);
    fetchProfiles();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-bold flex items-center gap-2"><Users size={14} /> User Approvals</h2>
        <div className="flex gap-2">
          <button onClick={() => setFilter('pending')} className={`px-3 py-1 rounded-xl text-xs font-bold ${filter === 'pending' ? 'gradient-bg text-primary-foreground' : 'glass'}`}>
            <Clock size={10} className="inline me-1" /> Pending
          </button>
          <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-xl text-xs font-bold ${filter === 'all' ? 'gradient-bg text-primary-foreground' : 'glass'}`}>
            All
          </button>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)} className="bg-background/50 border border-border rounded-xl px-2 py-1 text-[10px]">
            <option value="all">All roles</option>
            <option value="blogger">Bloggers</option>
            <option value="business">Businesses</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
      ) : profiles.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
          <Users size={32} className="mx-auto mb-3 opacity-40" />
          No users found
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map(p => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {(p.display_name || p.username)?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-sm">{p.display_name || p.brand_name || p.username}</h3>
                      <p className="text-[11px] text-muted-foreground">{p.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.role === 'business' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                    }`}>{p.role}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.approval_status === 'approved' ? 'bg-green-500/10 text-green-400' :
                      p.approval_status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>{p.approval_status}</span>
                  </div>
                </div>

                {/* Quick info row */}
                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground flex-wrap">
                  {p.instagram && <span className="flex items-center gap-1"><Instagram size={10} /> {p.instagram}</span>}
                  {p.city && <span className="flex items-center gap-1"><MapPin size={10} /> {p.city}</span>}
                  {p.category && <span className="flex items-center gap-1"><Tag size={10} /> {p.category}</span>}
                  {p.followers_count && p.followers_count > 0 && <span>{p.followers_count.toLocaleString()} followers</span>}
                  {p.phone && <span>{p.phone}</span>}
                </div>

                {/* Expand/Collapse */}
                <button onClick={() => setExpandedId(expandedId === p.id ? null : p.id)} className="text-[10px] text-primary mt-2 flex items-center gap-1">
                  <Eye size={10} /> {expandedId === p.id ? 'Hide details' : 'Show details'}
                </button>

                {expandedId === p.id && (
                  <div className="mt-3 space-y-2 border-t border-border/20 pt-3">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div><span className="text-muted-foreground">Username:</span> {p.username}</div>
                      <div><span className="text-muted-foreground">Phone:</span> {p.phone || '—'}</div>
                      <div><span className="text-muted-foreground">City:</span> {p.city || '—'}</div>
                      <div><span className="text-muted-foreground">Category:</span> {p.category || '—'}</div>
                      <div><span className="text-muted-foreground">Followers:</span> {p.followers_count || '—'}</div>
                      <div><span className="text-muted-foreground">Registered:</span> {new Date(p.created_at).toLocaleDateString()}</div>
                    </div>
                    {p.brand_name && <div className="text-[11px]"><span className="text-muted-foreground">Brand:</span> {p.brand_name}</div>}
                    {p.images && p.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {p.images.map((img, i) => (
                          <img key={i} src={img} alt="" className="rounded-xl aspect-square object-cover cursor-pointer hover:opacity-80" onClick={() => window.open(img, '_blank')} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions for pending users */}
              {p.approval_status === 'pending' && (
                <div className="p-4 pt-0 space-y-2">
                  <input
                    value={rejectReasons[p.user_id] || ''}
                    onChange={e => setRejectReasons(prev => ({ ...prev, [p.user_id]: e.target.value }))}
                    placeholder="Rejection reason (optional)..."
                    className="w-full bg-background/50 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(p.user_id)}
                      disabled={processing === p.user_id}
                      className="flex-1 bg-green-500/15 text-green-500 font-bold py-2 rounded-xl text-xs hover:bg-green-500/25 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {processing === p.user_id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Approve
                    </button>
                    <button
                      onClick={() => handleReject(p.user_id)}
                      disabled={processing === p.user_id}
                      className="flex-1 bg-red-500/15 text-red-500 font-bold py-2 rounded-xl text-xs hover:bg-red-500/25 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {processing === p.user_id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />} Reject
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUserApprovals;
