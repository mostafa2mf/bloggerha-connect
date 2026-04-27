import { motion } from 'framer-motion';
import { Clock, Shield, Loader2, CheckCircle, Instagram, Users, RefreshCw, ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import { useState, useEffect, useRef, forwardRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  email: string;
  initialProfile?: any;
  onApproved?: () => void;
  onReset?: () => void;
}

const PendingByEmailScreen = forwardRef<HTMLDivElement, Props>(({ email, initialProfile, onApproved, onReset }, ref) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const lang =
    typeof document !== 'undefined' && document.documentElement.lang?.toLowerCase().startsWith('en') ? 'en' : 'fa';
  const isEn = lang === 'en';

  const [profile, setProfile] = useState<any>(initialProfile || null);
  const [refreshing, setRefreshing] = useState(false);
  const lastStatusRef = useRef<string | null>(initialProfile?.approval_status ?? null);
  const status = profile?.approval_status || 'pending';
  const isRejected = status === 'rejected';
  const isApproved = status === 'approved';
  const displayName = profile?.brand_name || profile?.display_name || profile?.full_name || profile?.username;
  const dashboardPath = profile?.role === 'business' ? '/dashboard/business' : '/dashboard';

  const handleStatusChange = (nextProfile: any) => {
    setProfile(nextProfile);

    const nextStatus = nextProfile?.approval_status ?? null;
    const prevStatus = lastStatusRef.current;
    lastStatusRef.current = nextStatus;

    if (!nextStatus || nextStatus === prevStatus) return;

    if (nextStatus === 'approved') {
      toast.success(isEn ? 'Account approved.' : 'حساب شما تأیید شد.');
      return;
    }

    if (nextStatus === 'rejected') {
      toast.error(isEn ? 'Your registration was rejected.' : 'درخواست ثبت‌نام شما رد شد.');
    }
  };

  const fetchStatus = async () => {
    try {
      const { data } = await supabase.functions.invoke('check-registration', {
        body: { email },
      });

      if (!data?.exists || !data.profile) {
        setProfile(null);
        return null;
      }

      handleStatusChange(data.profile);
      return data.profile;
    } catch (err) {
      console.error('Status check failed:', err);
      return null;
    }
  };

  useEffect(() => {
    if (initialProfile || !email) return;
    void fetchStatus();
  }, [email, initialProfile]);

  useEffect(() => {
    if (!email || status !== 'pending') return;
    const id = window.setInterval(() => {
      void fetchStatus();
    }, 5000);
    return () => window.clearInterval(id);
  }, [email, status]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const nextProfile = await fetchStatus();
    const nextStatus = nextProfile?.approval_status ?? profile?.approval_status ?? 'pending';

    if (nextStatus === 'approved') {
      toast.success(isEn ? 'Approved!' : 'حساب شما تأیید شد! 🎉');
    } else if (nextStatus === 'rejected') {
      toast.error(isEn ? 'Rejected.' : 'متأسفانه حساب شما رد شد.');
    } else {
      toast.info(isEn ? 'Still under review...' : 'هنوز در حال بررسی...');
    }

    setRefreshing(false);
  };

  useEffect(() => {
    if (!isApproved || !profile?.role || !user) return;

    const timer = window.setTimeout(() => {
      navigate(dashboardPath, { replace: true });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [dashboardPath, isApproved, navigate, profile?.role, user]);

  const handleApprovedAction = () => {
    if (user) {
      navigate(dashboardPath);
      return;
    }

    onApproved?.();
    navigate('/');
  };

  return (
    <div ref={ref} className="min-h-screen flex items-center justify-center p-6" dir={isEn ? 'ltr' : 'rtl'}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl p-8 sm:p-10 max-w-md w-full text-center space-y-6"
      >
        <motion.div
          animate={isRejected || isApproved ? {} : { rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-lg ${
            isRejected ? 'bg-destructive shadow-destructive/30' :
            isApproved ? 'bg-green-500 shadow-green-500/30' :
            'gradient-bg shadow-primary/30'
          }`}
        >
          {isApproved ? <CheckCircle size={36} className="text-white" /> : <Clock size={36} className="text-primary-foreground" />}
        </motion.div>

        <div>
          <h1 className="text-2xl font-bold gradient-text mb-2">
            {isApproved
              ? (isEn ? 'Account Approved 🎉' : 'حساب شما تأیید شد 🎉')
              : isRejected
                ? (isEn ? 'Account Rejected' : 'حساب شما رد شد')
                : (isEn ? 'Pending Admin Approval' : 'در انتظار تأیید ادمین')}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isApproved
              ? (isEn
                ? user
                  ? 'Your account is approved. Opening your dashboard now.'
                  : 'Your account is approved. Log in to enter your dashboard.'
                : user
                  ? 'حساب شما تأیید شده است. در حال ورود به داشبورد شما هستیم.'
                  : 'حساب شما تأیید شده است. برای ورود به داشبورد وارد حساب خود شوید.')
              : isRejected
                ? (isEn
                  ? 'Unfortunately your registration has been rejected. Please contact support.'
                  : 'متأسفانه درخواست ثبت‌نام شما رد شد. لطفاً با پشتیبانی تماس بگیرید.')
                : (isEn
                  ? 'Your registration is being reviewed. After approval the status here will update automatically.'
                  : 'درخواست ثبت‌نام شما در حال بررسی است. بعد از تأیید، وضعیت این صفحه به‌صورت خودکار به‌روزرسانی می‌شود.')}
          </p>
        </div>

        <div className="glass rounded-2xl p-4 space-y-3 text-start">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-primary shrink-0" />
            <span className="text-xs text-muted-foreground truncate" dir="ltr">{email}</span>
          </div>
          {displayName && (
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-primary shrink-0" />
              <span className="text-xs text-muted-foreground">
                {isEn ? 'Name:' : 'نام:'}{' '}
                <span className="text-foreground font-medium">{displayName}</span>
              </span>
            </div>
          )}
          {profile?.instagram && (
            <div className="flex items-center gap-2">
              <Instagram size={16} className="text-primary shrink-0" />
              <span className="text-xs text-muted-foreground truncate" dir="ltr">{profile.instagram}</span>
            </div>
          )}
          {profile?.followers_count > 0 && (
            <div className="flex items-center gap-2">
              <Users size={16} className="text-primary shrink-0" />
              <span className="text-xs text-muted-foreground">
                {isEn ? 'Followers:' : 'فالوور:'}{' '}
                <span className="text-foreground font-medium">
                  {Number(profile.followers_count).toLocaleString(isEn ? 'en-US' : 'fa-IR')}
                </span>
              </span>
            </div>
          )}
          {profile?.category && (
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-primary shrink-0" />
              <span className="text-xs text-muted-foreground">
                {isEn ? 'Category:' : 'دسته‌بندی:'}{' '}
                <span className="text-foreground font-medium">{profile.category}</span>
              </span>
            </div>
          )}
        </div>

        {!isApproved && !isRejected && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={14} className="animate-spin text-primary" />
            {isEn ? 'Status: Under review... (auto-updates)' : 'وضعیت: در حال بررسی... (به‌روزرسانی خودکار)'}
          </div>
        )}

        {!isApproved && !isRejected && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full glass rounded-xl py-3 text-sm font-medium hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 text-primary"
          >
            {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {isEn ? 'Check status' : 'بررسی مجدد وضعیت'}
          </button>
        )}

        {isApproved && profile?.role && (
          <Button onClick={handleApprovedAction} className="w-full rounded-xl">
            {user
              ? (isEn ? 'Open dashboard' : 'ورود به داشبورد')
              : (isEn ? 'Back to home and log in' : 'بازگشت و ورود به حساب')}
          </Button>
        )}

        <Link
          to="/"
          className="w-full glass rounded-xl py-3 text-sm font-medium hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
        >
          {isEn ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          {isEn ? 'Back to home' : 'بازگشت به خانه'}
        </Link>

        {onReset && (
          <button
            onClick={onReset}
            className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
          >
            {isEn ? 'Use a different email' : 'با ایمیل دیگری ثبت‌نام کنید'}
          </button>
        )}
      </motion.div>
    </div>
  );
});

PendingByEmailScreen.displayName = 'PendingByEmailScreen';

export default PendingByEmailScreen;
