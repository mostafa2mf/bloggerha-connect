import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, Shield, LogOut, Loader2, CheckCircle, Instagram, Users, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { normalizeApprovalStatus } from '@/lib/approvalStatus';
import { checkApproval } from '@/lib/adminSync';

interface Props {
  onApproved?: () => void;
}

type Approval = 'approved' | 'pending' | 'rejected';

const POLL_INTERVAL_MS = 20_000;

const PendingApprovalScreen = ({ onApproved }: Props) => {
  const { lang } = useLanguage();
  const { signOut, user, userRole, refreshAuth } = useAuth();
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const checkingRef = useRef(false);

  const roleForTarget = (role?: string | null) => (role === 'business' ? '/dashboard/business' : '/dashboard');

  const handleApprovedRedirect = useCallback(async (resolvedRole?: string | null) => {
    const target = roleForTarget(resolvedRole || profile?.role || userRole);

    toast.success(
      lang === 'fa'
        ? 'حساب شما تأیید شد. در حال انتقال به داشبورد...'
        : 'Your account has been approved. Redirecting to your dashboard...'
    );

    onApproved?.();

    await refreshAuth();
    navigate(target, { replace: true });

    // Fallback hard refresh in case stale in-memory state still blocks route.
    setTimeout(async () => {
      try {
        const { data: verifyProfile } = await supabase
          .from('profiles')
          .select('approval_status')
          .eq('user_id', user?.id)
          .maybeSingle();

        if (normalizeApprovalStatus(verifyProfile?.approval_status) === 'approved') {
          await supabase.auth.refreshSession();
          window.location.assign(target);
        }
      } catch (_) {
        window.location.assign(target);
      }
    }, 1000);
  }, [lang, navigate, onApproved, profile?.role, refreshAuth, user?.id, userRole]);

  const syncStatus = useCallback(async (manual = false) => {
    if (!user || checkingRef.current) return;

    checkingRef.current = true;
    setSyncing(true);
    setSyncError(null);

    try {
      const { data: localProfile, error: profileErr } = await supabase
        .from('profiles')
        .select('display_name, username, instagram, followers_count, category, role, approval_status, created_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileErr) throw profileErr;

      if (localProfile) {
        setProfile(localProfile);
      }

      const entityType = (localProfile?.role || userRole) === 'business' ? 'business' : 'influencer';
      const syncRes: any = await checkApproval(entityType, user.id, user.id);
      const normalized: Approval = normalizeApprovalStatus(syncRes?.approval?.status || localProfile?.approval_status);

      if (normalized === 'approved') {
        await handleApprovedRedirect(localProfile?.role || userRole);
        return;
      }

      if (normalized === 'rejected') {
        setProfile((prev: any) => ({ ...(prev || {}), ...(localProfile || {}), approval_status: 'rejected' }));
      }

      if (manual && normalized === 'pending') {
        toast.info(lang === 'fa' ? 'هنوز در حال بررسی...' : 'Still under review...');
      }

      setLastCheckedAt(new Date());
    } catch (err) {
      console.error('Approval sync failed:', err);
      setSyncError(lang === 'fa' ? 'خطا در بررسی وضعیت. دوباره تلاش کنید.' : 'Failed to refresh status. Please try again.');
      if (manual) {
        toast.error(lang === 'fa' ? 'خطا در بررسی وضعیت' : 'Failed to check approval status');
      }
    } finally {
      checkingRef.current = false;
      setSyncing(false);
      setRefreshing(false);
    }
  }, [handleApprovedRedirect, lang, user, userRole]);

  // Initial check on mount + profile load.
  useEffect(() => {
    if (!user) return;
    void syncStatus();
  }, [user, syncStatus]);

  // Realtime listener (best effort) + periodic polling + tab visibility sync.
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`approval-status-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const newStatus = normalizeApprovalStatus((payload.new as any)?.approval_status);
          if (newStatus === 'approved') {
            await handleApprovedRedirect((payload.new as any)?.role || userRole);
          } else if (newStatus === 'rejected') {
            setProfile((prev: any) => prev ? { ...prev, approval_status: 'rejected' } : { approval_status: 'rejected' });
          }
          setLastCheckedAt(new Date());
        }
      )
      .subscribe();

    const interval = window.setInterval(() => {
      void syncStatus();
    }, POLL_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void syncStatus();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      supabase.removeChannel(channel);
    };
  }, [handleApprovedRedirect, syncStatus, user, userRole]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await syncStatus(true);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    toast.success(lang === 'fa' ? 'خارج شدید' : 'Logged out');
    navigate('/');
  };

  const normalizedStatus = normalizeApprovalStatus(profile?.approval_status);
  const isRejected = normalizedStatus === 'rejected';

  const formatLastChecked = () => {
    if (!lastCheckedAt) return lang === 'fa' ? 'هنوز بررسی نشده' : 'Not checked yet';
    return lastCheckedAt.toLocaleTimeString(lang === 'fa' ? 'fa-IR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

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
                ? 'وضعیت حساب شما هر ۲۰ ثانیه بررسی می‌شود. پس از تأیید، به‌صورت خودکار به داشبورد هدایت خواهید شد.'
                : 'Your status is checked every 20 seconds. You will be automatically redirected after approval.')}
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
                  <span className="text-foreground font-medium">{Number(profile.followers_count).toLocaleString('fa-IR')}</span>
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

        {!isRejected && (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              {(syncing || refreshing) ? <Loader2 size={14} className="animate-spin text-primary" /> : <RefreshCw size={14} className="text-primary" />}
              {lang === 'fa' ? 'بررسی خودکار هر ۲۰ ثانیه' : 'Auto-check every 20s'}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {lang === 'fa' ? 'آخرین بررسی:' : 'Last checked:'} {formatLastChecked()}
            </p>
            {syncError && <p className="text-[11px] text-destructive">{syncError}</p>}
          </div>
        )}

        {!isRejected && (
          <button
            onClick={handleRefresh}
            disabled={refreshing || syncing}
            className="w-full glass rounded-xl py-3 text-sm font-medium hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 text-primary disabled:opacity-60"
          >
            {(refreshing || syncing) ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {lang === 'fa' ? 'بررسی دوباره وضعیت' : 'Check approval status'}
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
