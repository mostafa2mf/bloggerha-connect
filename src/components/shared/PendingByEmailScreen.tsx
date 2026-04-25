import { motion } from 'framer-motion';
import { Clock, Shield, Loader2, CheckCircle, Instagram, Users, RefreshCw, ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { isApprovedStatus, normalizeApprovalStatus } from '@/lib/approvalStatus';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface Props {
  email: string;
  initialProfile?: any;
  onApproved?: () => void;
  onReset?: () => void;
}

const PendingByEmailScreen = ({ email, initialProfile, onApproved, onReset }: Props) => {
  const navigate = useNavigate();
  const lang =
    typeof document !== 'undefined' && document.documentElement.lang?.toLowerCase().startsWith('en') ? 'en' : 'fa';
  const isEn = lang === 'en';

  const [profile, setProfile] = useState<any>(initialProfile || null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  // Initial fetch if not provided
  useEffect(() => {
    if (initialProfile || !email) return;
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  // Auto-poll every 20s
  useEffect(() => {
    if (!email) return;
    const id = setInterval(fetchStatus, 20000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);


  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchStatus();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const fetchStatus = async () => {
    try {
      const { data } = await supabase.functions.invoke('check-registration', {
        body: { email },
      });
      setLastCheckedAt(new Date());
      if (data?.exists && data.profile) {
        setProfile(data.profile);
        if (isApprovedStatus(data.profile.approval_status)) {
          toast.success(isEn ? 'Account approved. Opening your dashboard…' : 'حساب شما تأیید شد. ورود به داشبورد...');
          if (onApproved) onApproved();
        }
      }
    } catch (err) {
      console.error('Status check failed:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStatus();
    if (isApprovedStatus(profile?.approval_status)) {
      toast.success(isEn ? 'Approved!' : 'حساب شما تأیید شد! 🎉');
    } else if (normalizeApprovalStatus(profile?.approval_status) === 'rejected') {
      toast.error(isEn ? 'Rejected.' : 'متأسفانه حساب شما رد شد.');
    } else {
      toast.info(isEn ? 'Still under review...' : 'هنوز در حال بررسی...');
    }
    setRefreshing(false);
  };

  const status = normalizeApprovalStatus(profile?.approval_status);
  const isRejected = status === 'rejected';
  const isApproved = status === 'approved';
  const displayName = profile?.brand_name || profile?.display_name || profile?.full_name || profile?.username;

   useEffect(() => {
    if (!isApproved || !profile?.role) return;

    const timer = window.setTimeout(() => {
      navigate(profile.role === 'business' ? '/dashboard/business' : '/dashboard', { replace: true });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [isApproved, navigate, profile?.role]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6" dir={isEn ? 'ltr' : 'rtl'}>
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
                ? 'Your account is approved. Please log in to access your dashboard.'
                : 'حساب شما تأیید شده است. برای ورود به داشبورد وارد شوید.')
              : isRejected
                ? (isEn
                  ? 'Unfortunately your registration has been rejected. Please contact support.'
                  : 'متأسفانه درخواست ثبت‌نام شما رد شد. لطفاً با پشتیبانی تماس بگیرید.')
                : (isEn
                  ? 'Your registration is being reviewed. After approval you can log in.'
                  : 'درخواست ثبت‌نام شما در حال بررسی است. پس از تأیید می‌توانید وارد شوید.')}
          </p>
        </div>

        {/* Email + profile summary */}
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
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 size={14} className="animate-spin text-primary" />
              {isEn ? 'Status: Under review... (auto-updates)' : 'وضعیت: در حال بررسی... (به‌روزرسانی خودکار)'}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {isEn ? 'Last checked at:' : 'آخرین بررسی:'}{' '}
              {lastCheckedAt
                ? lastCheckedAt.toLocaleTimeString(isEn ? 'en-US' : 'fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : (isEn ? 'not yet' : 'هنوز انجام نشده')}
            </p>
          </div>
        )}

        {!isApproved && (
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
          <Button
            onClick={() => navigate(profile.role === 'business' ? '/dashboard/business' : '/dashboard')}
            className="w-full rounded-xl"
          >
            {isEn ? 'Open dashboard' : 'ورود به داشبورد'}
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
};

export default PendingByEmailScreen;
