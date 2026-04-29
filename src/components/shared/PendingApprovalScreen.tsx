import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, Shield, LogOut, Loader2, CheckCircle, Instagram, Users, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logEventSync } from '@/lib/eventLogger';

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
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const lastStatusRef = useRef<string | null>(null);
  const failuresRef = useRef(0);
  const reasonLoggedRef = useRef<string | null>(null);

  const handleApproved = () => {
    toast.success(lang === 'fa' ? 'حساب شما تأیید شد! 🎉' : 'Your account has been approved! 🎉');
    // Clear any leftover pending-registration markers so refreshes don't bounce
    // the user back into the waiting screen.
    try {
      localStorage.removeItem('pending_registration_blogger');
      localStorage.removeItem('pending_registration_business');
    } catch (_) {}

    if (onApproved) {
      onApproved();
      return;
    }

    // Route directly to the right dashboard instead of full reload, which can
    // re-trigger PendingByEmailScreen via stale localStorage / URL state.
    const target = profile?.role === 'business' ? '/business-dashboard' : '/blogger-dashboard';
    logEventSync({ action: 'redirect.to_dashboard', details: { role: profile?.role ?? null, path: target, source: 'PendingApprovalScreen' } });
    navigate(target, { replace: true });
  };

  const applyStatus = (nextStatus: string | null, nextProfile?: any) => {
    if (nextProfile) setProfile(nextProfile);
    if (!nextStatus) return;

    const previous = lastStatusRef.current;
    lastStatusRef.current = nextStatus;

    if (nextStatus === 'approved') {
      if (previous !== 'approved') {
        logEventSync({ action: 'approval.detected', details: { previous, source: 'PendingApprovalScreen' } });
        handleApproved();
      }
      return;
    }

    if (nextStatus === 'rejected') {
      if (previous !== 'rejected') {
        logEventSync({ action: 'rejection.detected', details: { previous, source: 'PendingApprovalScreen' } });
        toast.error(lang === 'fa' ? 'متأسفانه حساب شما رد شد.' : 'Your account has been rejected.');
      }
      setProfile((prev: any) => ({ ...(prev || {}), ...(nextProfile || {}), approval_status: 'rejected' }));
      return;
    }

    setProfile((prev: any) => ({ ...(prev || {}), ...(nextProfile || {}), approval_status: nextStatus }));
  };

  useEffect(() => {
    if (!user) return;

    supabase
      .from('profiles')
      .select('display_name, username, instagram, followers_count, category, role, approval_status, created_at')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          lastStatusRef.current = data.approval_status ?? null;
          setProfile(data);
        }
      });
  }, [user]);

  // Auto sign-out and redirect to landing page when rejected
  useEffect(() => {
    if (profile?.approval_status !== 'rejected') return;
    const timer = window.setTimeout(async () => {
      try {
        logEventSync({ action: 'rejection.signout', details: { role: profile?.role ?? null } });
        await signOut();
      } catch (_) {
        // ignore
      }
      logEventSync({ action: 'redirect.to_landing', details: { reason: 'rejected' } });
      navigate('/', { replace: true });
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [profile?.approval_status, profile?.role, signOut, navigate]);

  useEffect(() => {
    if (!user) return;

    const syncApproval = async () => {
      // Wait until we know the role to avoid querying admin DB with the wrong entity_type
      if (!profile?.role) return;
      try {
        const { checkApproval } = await import('@/lib/adminSync');
        const entityType = profile.role === 'business' ? 'business' : 'influencer';
        const result: any = await checkApproval(entityType, user.id, user.id);
        const status = result?.approval?.status ?? null;
        const reason = result?.approval?.reject_reason ?? null;
        if (reason) setRejectReason(reason);
        applyStatus(status);
        failuresRef.current = 0;
      } catch (_) {
        failuresRef.current += 1;
        if (failuresRef.current >= 6) {
          // ~30s of consecutive sync failures while waiting → bail out gracefully
          logEventSync({
            action: 'waiting.poll_failure_fallback',
            details: { failures: failuresRef.current, role: profile?.role ?? null, source: 'PendingApprovalScreen' },
          });
          toast.error(lang === 'fa' ? 'ارتباط برقرار نشد. به صفحه اصلی برمی‌گردیم.' : 'Connection issue. Returning to home.');
          try { await signOut(); } catch (_) {}
          navigate('/', { replace: true });
        }
      }
    };

    void syncApproval();

    const channel = supabase
      .channel(`approval-status-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const nextProfile = payload.new as any;
          applyStatus(nextProfile?.approval_status ?? null, nextProfile);
        }
      )
      .subscribe();

    const poll = window.setInterval(() => {
      void syncApproval();
    }, 5000);

    // Hard timeout: if still pending after 10 minutes, force a final recheck and exit
    const hardTimeout = window.setTimeout(async () => {
      if (lastStatusRef.current === 'pending' || lastStatusRef.current === null) {
        logEventSync({
          action: 'waiting.timeout_fallback',
          details: { role: profile?.role ?? null, lastStatus: lastStatusRef.current, source: 'PendingApprovalScreen' },
        });
        toast.info(
          lang === 'fa'
            ? 'هنوز در انتظار است. به صفحه اصلی برمی‌گردیم — به محض تایید، اطلاع‌رسانی می‌شود.'
            : 'Still pending. Returning to home — we will notify you on approval.'
        );
        try { await signOut(); } catch (_) {}
        navigate('/', { replace: true });
      }
    }, 10 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(poll);
      window.clearTimeout(hardTimeout);
    };
  }, [user, lang, onApproved, profile?.role, signOut, navigate]);

  // Log the reject reason once for audit/tracing when it arrives
  useEffect(() => {
    if (profile?.approval_status !== 'rejected' || !rejectReason) return;
    if (reasonLoggedRef.current === rejectReason) return;
    reasonLoggedRef.current = rejectReason;
    logEventSync({
      action: 'rejection.reason_shown',
      details: { role: profile?.role ?? null, reason: rejectReason, source: 'PendingApprovalScreen' },
    });
  }, [profile?.approval_status, profile?.role, rejectReason]);

  const handleRefresh = async () => {
    if (!user) return;
    setRefreshing(true);

    try {
      const { checkApproval } = await import('@/lib/adminSync');
      const entityType = profile?.role === 'business' ? 'business' : 'influencer';
      const result: any = await checkApproval(entityType, user.id, user.id);
      const status = result?.approval?.status ?? null;
      const reason = result?.approval?.reject_reason ?? null;
      if (reason) setRejectReason(reason);

      applyStatus(status);

      if (status === 'approved') {
        toast.success(lang === 'fa' ? 'حساب شما تأیید شد! 🎉' : 'Approved!');
      } else if (status === 'rejected') {
        toast.error(lang === 'fa' ? 'متأسفانه حساب شما رد شد.' : 'Rejected.');
      } else {
        toast.info(lang === 'fa' ? 'هنوز در حال بررسی...' : 'Still under review...');
      }
    } finally {
      setRefreshing(false);
    }
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
        <motion.div
          animate={isRejected ? {} : { rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-lg ${
            isRejected ? 'bg-destructive shadow-destructive/30' : 'gradient-bg shadow-primary/30'
          }`}
        >
          <Clock size={36} className="text-primary-foreground" />
        </motion.div>

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
                <span className="text-xs text-muted-foreground truncate">{profile.instagram}</span>
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

        {isRejected && rejectReason && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-start space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-destructive shrink-0" />
              <span className="text-xs font-semibold text-destructive">
                {lang === 'fa' ? 'دلیل ادمین' : 'Reason from admin'}
              </span>
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {rejectReason}
            </p>
          </div>
        )}

        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <Shield size={20} className="text-primary shrink-0" />
          <p className="text-xs text-muted-foreground text-start">
            {lang === 'fa'
              ? 'ادمین پروفایل، تعداد فالوور و اطلاعات اینستاگرام شما را بررسی می‌کند. این فرآیند معمولاً کمتر از ۲۴ ساعت طول می‌کشد.'
              : 'Admin will review your profile, followers, and Instagram info. This usually takes less than 24 hours.'}
          </p>
        </div>

        {!isRejected && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={14} className="animate-spin text-primary" />
            {lang === 'fa' ? 'وضعیت: در حال بررسی... (به‌روزرسانی خودکار)' : 'Status: Under review... (auto-updates)'}
          </div>
        )}

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
