import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, Calendar, Clock, MapPin, Loader2 } from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

type Guest = {
  id: string;
  blogger_name: string | null;
  visit_date: string;
  visit_time: string | null;
  status: string;
  notes: string | null;
  campaign_id: string | null;
  campaigns?: { title: string } | null;
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const BizGuests = ({ onGoBack }: { onGoBack?: () => void }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchGuests();
  }, [user]);

  const fetchGuests = async () => {
    if (!user) return;
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const { data } = await supabase
      .from('guests')
      .select('*, campaigns(title)' as any)
      .eq('business_id', user.id)
      .gte('visit_date', today)
      .lte('visit_date', nextWeekStr)
      .order('visit_date', { ascending: true }) as any;
    
    setGuests((data || []) as Guest[]);
    setLoading(false);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      scheduled: { label: lang === 'fa' ? 'برنامه‌ریزی شده' : 'Scheduled', cls: 'bg-amber-500/10 text-amber-400' },
      confirmed: { label: lang === 'fa' ? 'تأیید شده' : 'Confirmed', cls: 'bg-green-500/10 text-green-400' },
      completed: { label: lang === 'fa' ? 'انجام شده' : 'Completed', cls: 'bg-muted text-muted-foreground' },
      cancelled: { label: lang === 'fa' ? 'لغو شده' : 'Cancelled', cls: 'bg-red-500/10 text-red-400' },
    };
    const s = map[status] || map.scheduled;
    return <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {onGoBack && <BackButton onGoBack={onGoBack} />}
      <motion.div variants={item} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <Users size={22} />
          {lang === 'fa' ? 'مهمان‌ها' : 'Guests'}
        </h1>
        <span className="text-xs text-muted-foreground">
          {lang === 'fa' ? '۷ روز آینده' : 'Next 7 days'}
        </span>
      </motion.div>

      {loading ? (
        <div className="glass rounded-3xl p-8 flex justify-center">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : guests.length === 0 ? (
        <motion.div variants={item} className="glass rounded-3xl p-10 text-center">
          <Users size={40} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            {lang === 'fa' ? 'مهمانی برای ۷ روز آینده ثبت نشده' : 'No guests scheduled for the next 7 days'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {guests.map((g) => (
            <motion.div key={g.id} variants={item} className="glass rounded-2xl p-4 border border-border/30 hover:border-primary/20 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-sm">{g.blogger_name || (lang === 'fa' ? 'بلاگر' : 'Blogger')}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> {formatDate(g.visit_date)}
                    </span>
                    {g.visit_time && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {g.visit_time}
                      </span>
                    )}
                    {(g as any).campaigns?.title && (
                      <span className="flex items-center gap-1 text-primary">
                        <MapPin size={11} /> {(g as any).campaigns.title}
                      </span>
                    )}
                  </div>
                  {g.notes && (
                    <p className="text-[11px] text-muted-foreground mt-2 bg-muted/30 rounded-lg p-2">{g.notes}</p>
                  )}
                </div>
                <div className="ms-3">{statusBadge(g.status)}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default BizGuests;
