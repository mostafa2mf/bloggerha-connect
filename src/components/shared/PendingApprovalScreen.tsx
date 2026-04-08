import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, Shield, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';

const PendingApprovalScreen = () => {
  const { lang } = useLanguage();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    toast.success(lang === 'fa' ? 'خارج شدید' : 'Logged out');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong rounded-3xl p-10 max-w-md w-full text-center space-y-6"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="w-20 h-20 mx-auto rounded-2xl gradient-bg flex items-center justify-center shadow-lg shadow-primary/30"
        >
          <Clock size={36} className="text-primary-foreground" />
        </motion.div>

        <div>
          <h1 className="text-2xl font-bold gradient-text mb-2">
            {lang === 'fa' ? 'در انتظار تأیید ادمین' : 'Pending Admin Approval'}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {lang === 'fa'
              ? 'درخواست ثبت‌نام شما ارسال شده و در حال بررسی توسط تیم ادمین است. پس از تأیید، دسترسی به داشبورد فعال خواهد شد.'
              : 'Your registration request has been submitted and is being reviewed by the admin team. Dashboard access will be granted after approval.'}
          </p>
        </div>

        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <Shield size={20} className="text-primary shrink-0" />
          <p className="text-xs text-muted-foreground text-start">
            {lang === 'fa'
              ? 'ادمین پروفایل، تعداد فالوور و اطلاعات اینستاگرام شما را بررسی می‌کند.'
              : 'Admin will review your profile, followers count, and Instagram information.'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 size={14} className="animate-spin text-primary" />
          {lang === 'fa' ? 'وضعیت: در حال بررسی...' : 'Status: Under review...'}
        </div>

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
