import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, LogOut, Loader2, Home, Instagram, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { logEventSync } from '@/lib/eventLogger';
import { toast } from 'sonner';

const ApplicationRejected = () => {
  const { user, signOut, loading } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isFa = lang === 'fa';
  const [reason, setReason] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/', { replace: true });
      return;
    }

    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('approval_status, role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.role) setRole(data.role);

      if (data?.approval_status === 'approved') {
        navigate('/app', { replace: true });
        return;
      }
      if (data?.approval_status === 'pending') {
        navigate('/pending-approval', { replace: true });
        return;
      }

      try {
        const { checkApproval } = await import('@/lib/adminSync');
        const entityType = data?.role === 'business' ? 'business' : 'influencer';
        const result: any = await checkApproval(entityType, user.id, user.id);
        const r = result?.approval?.reject_reason ?? null;
        if (r) {
          setReason(r);
          logEventSync({
            action: 'rejection.reason_shown',
            details: { reason: r, role: data?.role, source: 'ApplicationRejected' },
          });
        }
      } catch (_) { /* ignore */ }
    })();
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    setSigningOut(true);
    logEventSync({ action: 'rejection.signout', details: { source: 'ApplicationRejected' } });
    await signOut();
    toast.success(isFa ? 'خارج شدید' : 'Logged out');
    navigate('/', { replace: true });
  };

  const handleBackToLanding = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      dir={isFa ? 'rtl' : 'ltr'}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-destructive/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-[hsl(var(--gold))]/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative glass-strong rounded-3xl p-10 max-w-md w-full text-center space-y-7 border border-destructive/20"
      >
        {/* Icon with red/gold gradient glow */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="relative mx-auto w-24 h-24"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-destructive/40 to-[hsl(var(--gold))]/30 blur-xl" />
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center shadow-2xl shadow-destructive/30">
            <ShieldX size={42} className="text-destructive-foreground drop-shadow-lg" />
          </div>
        </motion.div>

        {/* Heading with gold accent */}
        <div className="space-y-3">
          <h1 className="text-2xl font-extrabold">
            <span className="text-destructive">
              {isFa ? 'از شما عذرخواهی می‌کنیم' : 'We Apologize'}
            </span>
          </h1>
          <div className="h-0.5 w-16 mx-auto bg-gradient-to-r from-destructive via-[hsl(var(--gold))] to-destructive rounded-full" />
          <p className="text-base font-semibold text-[hsl(var(--gold))]">
            {isFa
              ? 'درخواست عضویت شما تأیید نشد'
              : 'Your membership request was not approved'}
          </p>
        </div>

        {/* Main message */}
        <div className="glass rounded-2xl p-5 text-start space-y-3 border border-destructive/10">
          <div className="flex items-start gap-3">
            <Instagram size={20} className="text-[hsl(var(--gold))] shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isFa
                ? role === 'business'
                  ? 'متأسفانه اطلاعات کسب‌وکار شما در حال حاضر شرایط عضویت در پلتفرم بلاگرها را ندارد. لطفاً پس از تکمیل اطلاعات دوباره تلاش کنید.'
                  : 'متأسفانه پروفایل اینستاگرام شما هنوز آمادگی عضویت در پلتفرم بلاگرها را ندارد. لطفاً پس از رشد پروفایل خود دوباره تلاش کنید.'
                : role === 'business'
                  ? 'Unfortunately, your business information does not currently meet the requirements for Bloggerha membership. Please try again after completing your information.'
                  : 'Unfortunately, your Instagram profile is not yet ready for Bloggerha membership. Please try again after growing your profile.'}
            </p>
          </div>
        </div>

        {/* Admin reason if available */}
        {reason && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-start space-y-2"
          >
            <div className="flex items-center gap-2">
              <XCircle size={16} className="text-destructive shrink-0" />
              <span className="text-xs font-bold text-destructive">
                {isFa ? 'توضیحات ادمین' : 'Admin notes'}
              </span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {reason}
            </p>
          </motion.div>
        )}

        {/* Suggestions */}
        <div className="glass rounded-2xl p-4 text-start">
          <p className="text-xs font-semibold text-[hsl(var(--gold))] mb-2">
            {isFa ? '💡 پیشنهادات ما:' : '💡 Our suggestions:'}
          </p>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
            {isFa ? (
              <>
                <li>تعداد فالوورهای خود را افزایش دهید</li>
                <li>محتوای با کیفیت و منظم منتشر کنید</li>
                <li>نرخ تعامل پروفایل خود را بهبود دهید</li>
                <li>پس از رشد، دوباره ثبت‌نام کنید</li>
              </>
            ) : (
              <>
                <li>Grow your follower count</li>
                <li>Post quality content regularly</li>
                <li>Improve your engagement rate</li>
                <li>Re-register after growth</li>
              </>
            )}
          </ul>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleBackToLanding}
            className="w-full rounded-xl py-3.5 text-sm font-bold bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold))]/80 text-background hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-[hsl(var(--gold))]/20"
          >
            <Home size={18} />
            {isFa ? 'بازگشت به صفحه اصلی' : 'Back to Home'}
          </button>

          <button
            onClick={handleLogout}
            disabled={signingOut}
            className="w-full glass rounded-xl py-3 text-sm font-medium hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 text-muted-foreground"
          >
            {signingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
            {isFa ? 'خروج از حساب' : 'Logout'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ApplicationRejected;
