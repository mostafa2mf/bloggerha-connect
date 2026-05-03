import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, Shield, LogOut, Loader2, CheckCircle, Instagram, Users, RefreshCw, Lock, MessageCircle, Calendar, Upload, User, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  role: 'blogger' | 'business';
  onApproved?: () => void;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const PendingDashboardScreen = ({ role, onApproved }: Props) => {
  const { lang } = useLanguage();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const isFa = lang === 'fa';
  const isBlogger = role === 'blogger';

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user]);

  // Realtime listener for approval
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`pending-status-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` }, (payload) => {
        const next = payload.new as any;
        setProfile(next);
        if (next.approval_status === 'approved') {
          toast.success(isFa ? 'حساب شما تأیید شد! 🎉' : 'Your account has been approved! 🎉');
          onApproved?.();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, onApproved, isFa]);

  const handleRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
    if (data) {
      setProfile(data);
      if (data.approval_status === 'approved') {
        toast.success(isFa ? 'حساب شما تأیید شد! 🎉' : 'Approved!');
        onApproved?.();
      } else {
        toast.info(isFa ? 'هنوز در حال بررسی...' : 'Still under review...');
      }
    }
    setRefreshing(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    toast.success(isFa ? 'خارج شدید' : 'Logged out');
    navigate('/');
  };

  const bloggerCards = [
    { icon: Calendar, label: isFa ? 'کمپین‌ها' : 'Campaigns' },
    { icon: MessageCircle, label: isFa ? 'پیام‌ها' : 'Messages' },
    { icon: User, label: isFa ? 'پروفایل' : 'Profile' },
    { icon: Upload, label: isFa ? 'بازبینی محتوا' : 'Upload Review' },
  ];

  const businessCards = [
    { icon: Calendar, label: isFa ? 'کمپین‌ها' : 'Campaigns' },
    { icon: Users, label: isFa ? 'مهمان‌ها' : 'Guests' },
    { icon: MessageCircle, label: isFa ? 'پیام‌ها' : 'Messages' },
    { icon: User, label: isFa ? 'پروفایل' : 'Profile' },
  ];

  const cards = isBlogger ? bloggerCards : businessCards;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-2xl mx-auto pb-10">
      {/* Status Header */}
      <motion.div variants={item} className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-background via-background to-amber-950/10 p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
        <div className="absolute top-4 end-4">
          <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
            <Clock size={10} className="animate-pulse" />
            {isFa ? 'در انتظار تأیید' : 'Pending Approval'}
          </span>
        </div>
        
        <div className="relative z-10">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4"
          >
            <Clock size={28} className="text-white" />
          </motion.div>

          <h1 className="text-xl font-extrabold mb-2">
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              {isBlogger
                ? (isFa ? 'درخواست شما در حال بررسی است' : 'Your Request is Under Review')
                : (isFa ? 'حساب کسب‌وکار شما در حال بررسی است' : 'Your Business Account is Under Review')}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isBlogger
              ? (isFa ? 'پروفایل شما برای تایید به ادمین ارسال شده است. بعد از تایید، داشبورد کامل برای شما فعال می‌شود.' : 'Your profile has been submitted for admin approval. After approval, full dashboard access will be enabled.')
              : (isFa ? 'اطلاعات کسب‌وکار شما به ادمین ارسال شده است. بعد از تایید، امکان ساخت کمپین فعال می‌شود.' : 'Your business info has been submitted to admin. After approval, you can create campaigns.')}
          </p>
        </div>
      </motion.div>

      {/* Profile Summary */}
      {profile && (
        <motion.div variants={item} className="rounded-3xl border border-border/30 bg-background/40 backdrop-blur-sm p-6 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            {isBlogger ? <User size={14} /> : <Building2 size={14} />}
            {isFa ? 'خلاصه اطلاعات ارسال‌شده' : 'Submitted Profile Summary'}
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {profile.display_name && (
              <div className="glass rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">{isFa ? 'نام' : 'Name'}</p>
                <p className="text-sm font-medium">{profile.display_name}</p>
              </div>
            )}
            {profile.brand_name && (
              <div className="glass rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">{isFa ? 'نام برند' : 'Brand'}</p>
                <p className="text-sm font-medium">{profile.brand_name}</p>
              </div>
            )}
            {profile.instagram && (
              <div className="glass rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">{isFa ? 'اینستاگرام' : 'Instagram'}</p>
                <p className="text-sm font-medium flex items-center gap-1"><Instagram size={12} /> {profile.instagram}</p>
              </div>
            )}
            {profile.city && (
              <div className="glass rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">{isFa ? 'شهر' : 'City'}</p>
                <p className="text-sm font-medium">{profile.city}</p>
              </div>
            )}
            {profile.category && (
              <div className="glass rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">{isFa ? 'دسته‌بندی' : 'Category'}</p>
                <p className="text-sm font-medium">{profile.category}</p>
              </div>
            )}
            {profile.followers_count > 0 && (
              <div className="glass rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">{isFa ? 'فالوور' : 'Followers'}</p>
                <p className="text-sm font-medium">{Number(profile.followers_count).toLocaleString()}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Disabled Dashboard Cards with Lock */}
      <motion.div variants={item}>
        <h3 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
          <Lock size={12} />
          {isFa ? 'بخش‌های داشبورد (پس از تأیید فعال می‌شوند)' : 'Dashboard sections (enabled after approval)'}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card, i) => (
            <div key={i} className="rounded-2xl border border-border/20 bg-muted/20 p-5 opacity-40 relative">
              <div className="absolute top-3 end-3">
                <Lock size={12} className="text-muted-foreground" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center mb-2">
                <card.icon size={18} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Review Info */}
      <motion.div variants={item} className="glass rounded-2xl p-4 flex items-center gap-3">
        <Shield size={20} className="text-amber-400 shrink-0" />
        <p className="text-xs text-muted-foreground">
          {isFa
            ? 'ادمین پروفایل و اطلاعات شما را بررسی می‌کند. این فرآیند معمولاً کمتر از ۲۴ ساعت طول می‌کشد.'
            : 'Admin will review your profile and information. This usually takes less than 24 hours.'}
        </p>
      </motion.div>

      {/* Auto-update indicator */}
      <motion.div variants={item} className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Loader2 size={14} className="animate-spin text-amber-400" />
        {isFa ? 'وضعیت: در حال بررسی... (به‌روزرسانی خودکار)' : 'Status: Under review... (auto-updates)'}
      </motion.div>

      {/* Actions */}
      <motion.div variants={item} className="space-y-3">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-full rounded-2xl py-3.5 text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
        >
          {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {isFa ? 'بررسی مجدد وضعیت' : 'Check Status'}
        </button>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full glass rounded-2xl py-3 text-sm font-medium hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 text-muted-foreground"
        >
          {loggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
          {isFa ? 'خروج از حساب' : 'Logout'}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default PendingDashboardScreen;
