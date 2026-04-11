import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, Megaphone, CalendarCheck, Loader2 } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const BizAnalytics = ({ onGoBack }: { onGoBack?: () => void }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [stats, setStats] = useState({ visitors: 0, futureGuests: 0, activeCampaigns: 0 });
  const [loading, setLoading] = useState(true);
  const [recentCampaigns, setRecentCampaigns] = useState<{ title: string; status: string; applicants_count: number | null }[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);

      // Active campaigns
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, title, status, applicants_count')
        .eq('business_id', user.id);

      const activeCampaigns = (campaigns || []).filter(c => c.status === 'active').length;

      // Total applicants (visitors)
      const campaignIds = (campaigns || []).map(c => c.id);
      let visitors = 0;
      let futureGuests = 0;

      if (campaignIds.length > 0) {
        const { count: appCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .in('campaign_id', campaignIds);
        visitors = appCount || 0;

        const { count: acceptedCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .in('campaign_id', campaignIds)
          .eq('status', 'accepted');
        futureGuests = acceptedCount || 0;
      }

      setStats({ visitors, futureGuests, activeCampaigns });
      setRecentCampaigns((campaigns || []).slice(0, 5).map(c => ({
        title: c.title,
        status: c.status,
        applicants_count: c.applicants_count,
      })));
      setLoading(false);
    };
    fetch();
  }, [user]);

  const statCards = [
    { label: lang === 'fa' ? 'تعداد بازدیدکنندگان' : 'Total Visitors', value: stats.visitors, icon: Users, color: 'text-blue-400' },
    { label: lang === 'fa' ? 'مهمان‌های آینده' : 'Future Guests', value: stats.futureGuests, icon: CalendarCheck, color: 'text-green-400' },
    { label: lang === 'fa' ? 'کمپین‌های فعال' : 'Active Campaigns', value: stats.activeCampaigns, icon: Megaphone, color: 'text-purple-400' },
  ];

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      active: lang === 'fa' ? 'فعال' : 'Active',
      draft: lang === 'fa' ? 'پیش‌نویس' : 'Draft',
      completed: lang === 'fa' ? 'تمام شده' : 'Completed',
      scheduled: lang === 'fa' ? 'زمان‌بندی' : 'Scheduled',
    };
    return map[s] || s;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.h1 variants={item} className="text-2xl font-extrabold gradient-text">
        {lang === 'fa' ? 'آمار' : 'Analytics'}
      </motion.h1>

      {/* Stat Cards */}
      <motion.div variants={item} className="grid grid-cols-3 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="glass rounded-3xl p-5 text-center border border-primary/10 shadow-lg shadow-primary/5">
            <s.icon size={28} className={`mx-auto mb-3 ${s.color}`} />
            <div className="text-3xl font-extrabold">{s.value.toLocaleString('fa-IR')}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Campaigns Table */}
      {recentCampaigns.length > 0 && (
        <motion.div variants={item} className="glass rounded-3xl p-5 border border-primary/10">
          <h2 className="font-extrabold mb-4">{lang === 'fa' ? 'کمپین‌های اخیر' : 'Recent Campaigns'}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-start py-2 text-xs text-muted-foreground font-bold">{lang === 'fa' ? 'عنوان' : 'Title'}</th>
                  <th className="text-center py-2 text-xs text-muted-foreground font-bold">{lang === 'fa' ? 'وضعیت' : 'Status'}</th>
                  <th className="text-center py-2 text-xs text-muted-foreground font-bold">{lang === 'fa' ? 'درخواست‌ها' : 'Applicants'}</th>
                </tr>
              </thead>
              <tbody>
                {recentCampaigns.map((c, i) => (
                  <tr key={i} className="border-b border-border/20 last:border-0">
                    <td className="py-3 font-medium">{c.title}</td>
                    <td className="py-3 text-center">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                        {statusLabel(c.status)}
                      </span>
                    </td>
                    <td className="py-3 text-center font-bold">{c.applicants_count ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BizAnalytics;
