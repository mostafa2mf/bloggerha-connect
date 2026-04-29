import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { logEventSync } from '@/lib/eventLogger';
import { toast } from 'sonner';

const ApplicationRejected = () => {
  const { user, signOut, loading } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isEn = lang === 'en';
  const [reason, setReason] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

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

      // If status was changed away from rejected, route correctly
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
    toast.success(isEn ? 'Logged out' : 'خارج شدید');
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" dir={isEn ? 'ltr' : 'rtl'}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong rounded-3xl p-10 max-w-md w-full text-center space-y-6"
      >
        <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-destructive shadow-lg shadow-destructive/30">
          <AlertTriangle size={36} className="text-destructive-foreground" />
        </div>

        <div>
          <h1 className="text-2xl font-bold gradient-text mb-2">
            {isEn ? 'Application Rejected' : 'درخواست شما رد شد'}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isEn
              ? 'Unfortunately your application has been rejected by the admin. Please contact support if you believe this is a mistake.'
              : 'متأسفانه درخواست شما توسط ادمین رد شده است. اگر فکر می‌کنید اشتباه شده با پشتیبانی تماس بگیرید.'}
          </p>
        </div>

        {reason && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-start">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-destructive shrink-0" />
              <span className="text-xs font-semibold text-destructive">
                {isEn ? 'Reason from admin' : 'دلیل ادمین'}
              </span>
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">{reason}</p>
          </div>
        )}

        <button
          onClick={handleLogout}
          disabled={signingOut}
          className="w-full glass rounded-xl py-3 text-sm font-medium hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
        >
          {signingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
          {isEn ? 'Logout' : 'خروج از حساب'}
        </button>
      </motion.div>
    </div>
  );
};

export default ApplicationRejected;
