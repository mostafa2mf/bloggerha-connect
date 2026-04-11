import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, Shield, LogOut, Loader2, CheckCircle, Instagram, Users, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  onApproved?: () => void;
}

const PendingApprovalScreen = ({ onApproved }: Props) => {
  const { lang } = useLanguage();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load profile info
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('display_name, username, instagram, followers_count, category, role, approval_status, created_at')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [user]);

  // Realtime listener for approval status changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('approval-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = payload.new?.approval_status;
          if (newStatus === 'approved') {
            toast.success(lang === 'fa' ? 'حساب شما تأیید شد! 🎉' : 'Your account has been approved! 🎉');
            if (onApproved) {
              onApproved();
            } else {
              // Force reload to get into dashboard
              window.location.reload();
            }
          } else if (newStatus === 'rejected') {
            toast.error(lang === 'fa' ? 'متأسفانه حساب شما رد شد.' : 'Your account has been rejected.');
            setProfile((prev: any) => prev ? { ...prev, approval_status: 'rejected' } : prev);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, lang, onApproved]);

  const handleRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    const { data } = await supabase
      .from('profiles')
      .select('approval_status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data?.approval_status === 'approved') {
      toast.success(lang === 'fa' ? 'حساب شما تأیید شد! 🎉' : 'Approved!');
      if (onApproved) {
        onApproved();
      } else {
        window.location.reload();
      }
    } else {
      toast.info(lang === 'fa' ? 'هنوز در حال بررسی...' : 'Still under review...');
    }
    setRefreshing(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    toast.success(lang === 'fa' ? 'خارج شدید' : 'Logged out');
    navigate('/');
  };

  const isRejected = profile?.approval_status === 'rejected';

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong rounded-3xl p-10 max-w-md w-full text-center space-y-6"
      >
        {/* Icon */}
        <motion.div
          animate={isRejected ? {} : { rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-lg ${
            isRejected ? 'bg-destructive shadow-destructive/30' : 'gradient-bg shadow-primary/30'
          }`}
        >
          <Clock size={36} className="text-primary-foreground" />
        </motion.div>

        {/* Title & Description */}
        <div>
          <h1 className="text-2xl font-bold gradient-text mb-2">
            {isRejected
              ? (lang === 'fa' ? 'حساب شما رد شد' : 'Account Rejected')
              : (lang === 'fa' ? 'در انتظار تأیید ادمین' : 'Pending Admin Approval')}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isRejected
              ? (lang === 'fa'
                ? 'متأسفانه درخواست ثبت‌نام شما توسط ادمین رد شده است. لطفاً با پشتیبانی تماس بگیرید.'
                : 'Unfortunately your registration has been rejected. Please contact support.')
              : (lang === 'fa'
                ? 'درخواست ثبت‌نام شما ارسال شده و در حال بررسی توسط تیم ادمین است. پس از تأیید، به‌صورت خودکار به داشبورد هدایت خواهید شد.'
                : 'Your registration is being reviewed. You will be automatically redirected to the dashboard after approval.')}
          </p>
        </div>

        {/* Profile Info Card */}
        {profile && (
          <div className="glass rounded-2xl p-4 space-y-3 text-start">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-primary shrink-0" />
              <span className="text-xs text-muted-foreground">
                {lang === 'fa' ? 'نام:' : 'Name:'}{' '}
                <span className="text-foreground font-medium">{profile.display_name || profile.username}</span>
              </span>
            </div>
            {profile.instagram && (
              <div className="flex items-center gap-2">
                <Instagram size={16} className="text-primary shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  {profile.instagram}
                </span>
              </div>
            )}
            {profile.followers_count > 0 && (
              <div className="flex items-center gap-2">
                <Users size={16} className="text-primary shrink-0" />
                <span className="text-xs text-muted-foreground">
                  {lang === 'fa' ? 'فالوور:' : 'Followers:'}{' '}
                  <span className="text-foreground font-medium">
                    {Number(profile.followers_count).toLocaleString('fa-IR')}
                  </span>
                </span>
              </div>
            )}
            {profile.category && (
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-primary shrink-0" />
                <span className="text-xs text-muted-foreground">
                  {lang === 'fa' ? 'دسته‌بندی:' : 'Category:'}{' '}
                  <span className="text-foreground font-medium">{profile.category}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* What admin checks */}
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <Shield size={20} className="text-primary shrink-0" />
          <p className="text-xs text-muted-foreground text-start">
            {lang === 'fa'
              ? 'ادمین پروفایل، تعداد فالوور و اطلاعات اینستاگرام شما را بررسی می‌کند. این فرآیند معمولاً کمتر از ۲۴ ساعت طول می‌کشد.'
              : 'Admin will review your profile, followers, and Instagram info. This usually takes less than 24 hours.'}
          </p>
        </div>

        {/* Status indicator */}
        {!isRejected && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={14} className="animate-spin text-primary" />
            {lang === 'fa' ? 'وضعیت: در حال بررسی... (به‌روزرسانی خودکار)' : 'Status: Under review... (auto-updates)'}
          </div>
        )}

        {/* Manual refresh button */}
        {!isRejected && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full glass rounded-xl py-3 text-sm font-medium hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 text-primary"
          >
            {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {lang === 'fa' ? 'بررسی مجدد وضعیت' : 'Check status'}
          </button>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full glass rounded-xl py-3 text-sm font-medium hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
        >
          {loggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
          {lang === 'fa' ? 'خروج از حساب' : 'Logout'}
        </button>
      </motion.div>
    </div>
  );
};

export default PendingApprovalScreen;
