import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, TrendingUp, CheckCircle2, XCircle, Clock, Send, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import BackButton from '@/components/shared/BackButton';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const COLORS = ['hsl(36, 95%, 52%)', 'hsl(142, 60%, 45%)', 'hsl(0, 70%, 55%)', 'hsl(210, 80%, 55%)'];

const DashAnalytics = ({ onGoBack }: { onGoBack?: () => void }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('applications')
      .select('*, campaigns(title)')
      .eq('blogger_id', user.id)
      .order('created_at', { ascending: false });
    setApplications(data || []);
    setLoading(false);
  };

  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(a => a.status === 'pending').length;
    const accepted = applications.filter(a => a.status === 'accepted').length;
    const rejected = applications.filter(a => a.status === 'rejected').length;
    const rate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    return { total, pending, accepted, rejected, rate };
  }, [applications]);

  const pieData = useMemo(() => [
    { name: lang === 'fa' ? 'در انتظار' : 'Pending', value: stats.pending },
    { name: lang === 'fa' ? 'تأیید شده' : 'Accepted', value: stats.accepted },
    { name: lang === 'fa' ? 'رد شده' : 'Rejected', value: stats.rejected },
  ].filter(d => d.value > 0), [stats, lang]);

  // Monthly trend (group by month)
  const monthlyData = useMemo(() => {
    const months: Record<string, { sent: number; accepted: number }> = {};
    applications.forEach(a => {
      const d = new Date(a.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { sent: 0, accepted: 0 };
      months[key].sent++;
      if (a.status === 'accepted') months[key].accepted++;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: month.slice(5),
        [lang === 'fa' ? 'ارسال شده' : 'Sent']: data.sent,
        [lang === 'fa' ? 'تأیید شده' : 'Accepted']: data.accepted,
      }));
  }, [applications, lang]);

  const statCards = [
    { label: lang === 'fa' ? 'کل درخواست‌ها' : 'Total Applications', value: stats.total, icon: Send, gradient: 'from-blue-400 to-indigo-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: lang === 'fa' ? 'در انتظار' : 'Pending', value: stats.pending, icon: Clock, gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: lang === 'fa' ? 'تأیید شده' : 'Accepted', value: stats.accepted, icon: CheckCircle2, gradient: 'from-emerald-400 to-green-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: lang === 'fa' ? 'نرخ موفقیت' : 'Success Rate', value: `${stats.rate}%`, icon: TrendingUp, gradient: 'from-violet-400 to-purple-500', bg: 'bg-violet-50 dark:bg-violet-950/30' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {onGoBack && <BackButton onGoBack={onGoBack} />}
      <motion.h1 variants={item} className="text-2xl font-extrabold gradient-text flex items-center gap-2">
        <BarChart3 size={24} />
        {lang === 'fa' ? 'آمار و تحلیل' : 'Analytics'}
      </motion.h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((s, i) => (
          <motion.div
            key={i}
            variants={item}
            className={`${s.bg} rounded-2xl p-4 border border-border/20`}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-2 shadow-md`}>
              <s.icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-extrabold">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart - Monthly Trend */}
        {monthlyData.length > 0 && (
          <motion.div variants={item} className="glass rounded-3xl p-5">
            <h3 className="text-sm font-bold mb-4">
              {lang === 'fa' ? 'روند ماهانه' : 'Monthly Trend'}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                <Bar dataKey={lang === 'fa' ? 'ارسال شده' : 'Sent'} fill="hsl(36, 95%, 52%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey={lang === 'fa' ? 'تأیید شده' : 'Accepted'} fill="hsl(142, 60%, 45%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Pie Chart - Status Distribution */}
        {pieData.length > 0 && (
          <motion.div variants={item} className="glass rounded-3xl p-5">
            <h3 className="text-sm font-bold mb-4">
              {lang === 'fa' ? 'توزیع وضعیت' : 'Status Distribution'}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                  {d.name}: {d.value}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Empty state */}
      {applications.length === 0 && (
        <motion.div variants={item} className="glass rounded-3xl p-10 text-center">
          <BarChart3 size={40} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            {lang === 'fa' ? 'هنوز درخواستی ارسال نکرده‌اید' : 'No applications yet'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DashAnalytics;
