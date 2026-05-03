import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShieldX, LogOut, Loader2, Home, Instagram, XCircle, MessageCircle, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  role: 'blogger' | 'business';
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const RejectedDashboardScreen = ({ role }: Props) => {
  const { lang } = useLanguage();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const isFa = lang === 'fa';
  const isBlogger = role === 'blogger';
  const [signingOut, setSigningOut] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { checkApproval } = await import('@/lib/adminSync');
        const entityType = role === 'business' ? 'business' : 'influencer';
        const result: any = await checkApproval(entityType, user.id, user.id);
        const r = result?.approval?.reject_reason ?? null;
        if (r) setReason(r);
      } catch {}
    })();
  }, [user, role]);

  const handleLogout = async () => {
    setSigningOut(true);
    await signOut();
    toast.success(isFa ? 'خارج شدید' : 'Logged out');
    navigate('/');
  };

  const handleBackToLanding = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-md mx-auto space-y-6 pb-10">
      {/* Icon */}
      <motion.div variants={item} className="flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-destructive/40 to-amber-500/30 blur-xl" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center shadow-2xl shadow-destructive/30">
            <ShieldX size={36} className="text-white drop-shadow-lg" />
          </div>
        </div>
      </motion.div>

      {/* Heading */}
      <motion.div variants={item} className="text-center space-y-3">
        <h1 className="text-2xl font-extrabold text-destructive">
          {isFa ? 'از شما عذرخواهی می‌کنیم' : 'We Apologize'}
        </h1>
        <div className="h-0.5 w-16 mx-auto bg-gradient-to-r from-destructive via-amber-500 to-destructive rounded-full" />
        <p className="text-base font-semibold text-amber-400">
          {isFa ? 'درخواست عضویت شما تأیید نشد' : 'Your membership request was not approved'}
        </p>
      </motion.div>

      {/* Message */}
      <motion.div variants={item} className="glass rounded-2xl p-5 text-start space-y-3 border border-destructive/10">
        <div className="flex items-start gap-3">
          <Instagram size={20} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isFa
              ? (isBlogger
                ? 'متأسفانه پروفایل اینستاگرام شما هنوز آمادگی عضویت در پلتفرم بلاگرها را ندارد. لطفاً پس از رشد پروفایل خود دوباره تلاش کنید.'
                : 'متأسفانه اطلاعات کسب‌وکار شما در حال حاضر شرایط عضویت در پلتفرم بلاگرها را ندارد. لطفاً پس از تکمیل اطلاعات دوباره تلاش کنید.')
              : (isBlogger
                ? 'Unfortunately, your Instagram profile is not yet ready for Bloggerha membership. Please try again after growing your profile.'
                : 'Unfortunately, your business info does not currently meet the requirements. Please try again after completing your information.')}
          </p>
        </div>
      </motion.div>

      {/* Admin reason */}
      {reason && (
        <motion.div variants={item} className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-start space-y-2">
          <div className="flex items-center gap-2">
            <XCircle size={16} className="text-destructive shrink-0" />
            <span className="text-xs font-bold text-destructive">
              {isFa ? 'توضیحات ادمین' : 'Admin notes'}
            </span>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{reason}</p>
        </motion.div>
      )}

      {/* Suggestions */}
      <motion.div variants={item} className="glass rounded-2xl p-4 text-start">
        <p className="text-xs font-semibold text-amber-400 mb-2">
          {isFa ? '💡 پیشنهادات ما:' : '💡 Our suggestions:'}
        </p>
        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
          {isFa ? (
            isBlogger ? (
              <>
                <li>تعداد فالوورهای خود را افزایش دهید</li>
                <li>محتوای با کیفیت و منظم منتشر کنید</li>
                <li>نرخ تعامل پروفایل خود را بهبود دهید</li>
                <li>پس از رشد، دوباره ثبت‌نام کنید</li>
              </>
            ) : (
              <>
                <li>اطلاعات کسب‌وکار خود را تکمیل کنید</li>
                <li>تصاویر و مدارک معتبر ارائه دهید</li>
                <li>با پشتیبانی تماس بگیرید</li>
              </>
            )
          ) : (
            <>
              <li>Grow your follower count</li>
              <li>Post quality content regularly</li>
              <li>Improve your engagement rate</li>
              <li>Re-register after growth</li>
            </>
          )}
        </ul>
      </motion.div>

      {/* Actions */}
      <motion.div variants={item} className="space-y-3">
        <button
          onClick={handleBackToLanding}
          className="w-full rounded-2xl py-3.5 text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-background hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
        >
          <Home size={18} />
          {isFa ? 'بازگشت به صفحه اصلی' : 'Back to Home'}
        </button>

        <button
          onClick={handleLogout}
          disabled={signingOut}
          className="w-full glass rounded-2xl py-3 text-sm font-medium hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 text-muted-foreground"
        >
          {signingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
          {isFa ? 'خروج از حساب' : 'Logout'}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default RejectedDashboardScreen;
