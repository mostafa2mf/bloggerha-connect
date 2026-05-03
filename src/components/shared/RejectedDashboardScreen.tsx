import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShieldX, LogOut, Loader2, Home, Instagram, XCircle, MessageCircle, Building2, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  role: 'blogger' | 'business';
  onStatusChange?: (status: string) => void;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const RejectedDashboardScreen = ({ role, onStatusChange }: Props) => {
  const { lang } = useLanguage();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const isFa = lang === 'fa';
  const isBlogger = role === 'blogger';
  const [signingOut, setSigningOut] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile with rejection details from local DB
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setProfile(data);
      setLoading(false);
    })();
  }, [user]);

  // Realtime: listen for status changes (e.g. admin re-approves)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`rejected-status-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const next = payload.new as any;
        setProfile(next);
        if (next.approval_status === 'approved') {
          toast.success(isFa ? 'حساب شما تأیید شد! 🎉' : 'Your account has been approved! 🎉');
          onStatusChange?.('approved');
        } else if (next.approval_status === 'pending') {
          toast.info(isFa ? 'وضعیت شما به «در انتظار بررسی» تغییر کرد' : 'Your status changed to pending');
          onStatusChange?.('pending');
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, isFa, onStatusChange]);

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

  const handleContactSupport = () => {
    // Navigate to messages section (will open admin chat)
    navigate(isBlogger ? '/blogger-dashboard' : '/business-dashboard');
    // Force a page state where user can send a message
    toast.info(isFa ? 'با پشتیبانی تماس بگیرید تا وضعیت شما بررسی شود' : 'Contact support to review your status');
  };

  const reason = profile?.rejection_reason;
  const rejectedAt = profile?.rejected_at;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(isFa ? 'fa-IR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

      {/* Profile Summary */}
      {profile && (
        <motion.div variants={item} className="rounded-3xl border border-border/30 bg-background/40 backdrop-blur-sm p-5 space-y-3">
          <h3 className="text-xs font-bold flex items-center gap-2 text-muted-foreground">
            {isBlogger ? <Instagram size={12} /> : <Building2 size={12} />}
            {isFa ? 'اطلاعات ارسال‌شده' : 'Submitted Info'}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {(profile.display_name || profile.brand_name) && (
              <div className="glass rounded-xl p-2.5">
                <p className="text-[9px] text-muted-foreground">{isFa ? 'نام' : 'Name'}</p>
                <p className="text-xs font-medium">{profile.display_name || profile.brand_name}</p>
              </div>
            )}
            {profile.city && (
              <div className="glass rounded-xl p-2.5">
                <p className="text-[9px] text-muted-foreground">{isFa ? 'شهر' : 'City'}</p>
                <p className="text-xs font-medium">{profile.city}</p>
              </div>
            )}
            {profile.category && (
              <div className="glass rounded-xl p-2.5">
                <p className="text-[9px] text-muted-foreground">{isFa ? 'دسته‌بندی' : 'Category'}</p>
                <p className="text-xs font-medium">{profile.category}</p>
              </div>
            )}
            {profile.instagram && (
              <div className="glass rounded-xl p-2.5">
                <p className="text-[9px] text-muted-foreground">{isFa ? 'اینستاگرام' : 'Instagram'}</p>
                <p className="text-xs font-medium flex items-center gap-1"><Instagram size={10} /> {profile.instagram}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Admin Rejection Reason */}
      {(reason || rejectedAt) && (
        <motion.div variants={item} className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-start space-y-3">
          <div className="flex items-center gap-2">
            <XCircle size={16} className="text-destructive shrink-0" />
            <span className="text-xs font-bold text-destructive">
              {isFa ? 'توضیحات ادمین' : 'Admin Feedback'}
            </span>
          </div>
          {reason && (
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap border-s-2 border-destructive/30 ps-3">
              {reason}
            </p>
          )}
          {rejectedAt && (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Clock size={10} />
              {formatDate(rejectedAt)}
            </div>
          )}
        </motion.div>
      )}

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

      {/* Realtime indicator */}
      <motion.div variants={item} className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <RefreshCw size={12} className="text-amber-400" />
        {isFa ? 'در صورت تغییر وضعیت، داشبورد به‌صورت خودکار به‌روز می‌شود' : 'Dashboard auto-updates when status changes'}
      </motion.div>

      {/* Actions */}
      <motion.div variants={item} className="space-y-3">
        {/* Support CTA */}
        <button
          onClick={handleContactSupport}
          className="w-full rounded-2xl py-3.5 text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
        >
          <MessageCircle size={18} />
          {isFa ? 'تماس با پشتیبانی' : 'Contact Support'}
        </button>

        <button
          onClick={handleBackToLanding}
          className="w-full glass rounded-2xl py-3 text-sm font-medium hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 text-muted-foreground"
        >
          <Home size={16} />
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
