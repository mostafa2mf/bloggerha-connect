import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, Calendar, ChevronRight, ChevronLeft, Clock, Loader2 } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

type Guest = {
  id: string;
  blogger_id: string;
  campaign_id: string;
  status: string;
  created_at: string;
  blogger_name?: string;
  blogger_avatar?: string | null;
  blogger_followers?: number | null;
  campaign_title?: string;
};

const BizApplications = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayOffset, setDayOffset] = useState(0); // 0 = today

  const getDateRange = () => {
    const start = new Date();
    start.setDate(start.getDate() + dayOffset);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  };

  const { start, end } = getDateRange();

  const fetchGuests = async () => {
    if (!user) return;
    setLoading(true);

    // Get campaigns owned by this business
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, title')
      .eq('business_id', user.id);

    if (!campaigns || campaigns.length === 0) {
      setGuests([]);
      setLoading(false);
      return;
    }

    const campaignIds = campaigns.map(c => c.id);
    const campaignMap = Object.fromEntries(campaigns.map(c => [c.id, c.title]));

    // Get accepted applications for those campaigns
    const { data: apps } = await supabase
      .from('applications')
      .select('id, blogger_id, campaign_id, status, created_at')
      .in('campaign_id', campaignIds)
      .eq('status', 'accepted');

    if (!apps || apps.length === 0) {
      setGuests([]);
      setLoading(false);
      return;
    }

    // Get blogger profiles
    const bloggerIds = [...new Set(apps.map(a => a.blogger_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url, followers_count')
      .in('user_id', bloggerIds);

    const profileMap = Object.fromEntries(
      (profiles || []).map(p => [p.user_id, p])
    );

    const result: Guest[] = apps.map(a => ({
      ...a,
      blogger_name: profileMap[a.blogger_id]?.display_name || profileMap[a.blogger_id]?.username || 'بلاگر',
      blogger_avatar: profileMap[a.blogger_id]?.avatar_url,
      blogger_followers: profileMap[a.blogger_id]?.followers_count,
      campaign_title: campaignMap[a.campaign_id] || '',
    }));

    setGuests(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchGuests();
  }, [user, dayOffset]);

  const formatDate = (d: Date) =>
    d.toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US', { month: 'short', day: 'numeric' });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.h1 variants={item} className="text-2xl font-extrabold gradient-text">
        {lang === 'fa' ? 'مهمان‌ها' : 'Guests'}
      </motion.h1>

      {/* Date Switcher */}
      <motion.div variants={item} className="flex items-center justify-center gap-4">
        <button onClick={() => setDayOffset(d => d - 7)} className="glass p-2 rounded-xl hover:glow-border transition-all">
          {lang === 'fa' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        <div className="glass rounded-xl px-5 py-2 text-sm font-bold flex items-center gap-2">
          <Calendar size={14} className="text-primary" />
          {formatDate(start)} – {formatDate(end)}
        </div>
        <button onClick={() => setDayOffset(d => d + 7)} className="glass p-2 rounded-xl hover:glow-border transition-all">
          {lang === 'fa' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </motion.div>

      {/* Guest Cards */}
      {loading ? (
        <div className="glass rounded-3xl p-8 flex justify-center">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : guests.length === 0 ? (
        <div className="glass rounded-3xl p-8 text-center">
          <Clock size={32} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">{lang === 'fa' ? 'مهمانی در این بازه زمانی وجود ندارد' : 'No guests in this period'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {guests.map(g => (
            <motion.div
              key={g.id}
              variants={item}
              className="glass rounded-3xl p-4 flex flex-col items-center text-center border border-primary/10 shadow-lg shadow-primary/5"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary/30 mb-3">
                {g.blogger_avatar ? (
                  <img src={g.blogger_avatar} alt={g.blogger_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full gradient-bg flex items-center justify-center text-lg font-bold text-primary-foreground">
                    {g.blogger_name?.[0] || '?'}
                  </div>
                )}
              </div>
              <h3 className="font-bold text-sm truncate w-full">{g.blogger_name}</h3>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Users size={11} className="text-primary" />
                <span className="font-semibold text-foreground">
                  {g.blogger_followers ? g.blogger_followers.toLocaleString('fa-IR') : '۰'}
                </span>
              </div>
              <span className="text-[10px] text-primary/70 mt-1.5 bg-primary/5 px-2 py-0.5 rounded-full">{g.campaign_title}</span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default BizApplications;
