import { motion } from 'framer-motion';
import { ShieldAlert, ArrowRight, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  /** Why the user was denied — shown as a subtitle */
  reason?: string;
}

const AccessDenied = ({ reason }: Props) => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isFa = lang === 'fa';
  const Arrow = isFa ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen flex items-center justify-center p-6" dir={isFa ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong rounded-3xl p-10 max-w-md w-full text-center space-y-6 border border-destructive/20"
      >
        {/* Icon */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-2xl bg-destructive/20 blur-xl" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-destructive to-destructive/70 flex items-center justify-center shadow-xl shadow-destructive/25">
            <ShieldAlert size={38} className="text-destructive-foreground" />
          </div>
        </div>

        {/* 403 badge */}
        <span className="inline-block text-xs font-mono tracking-widest px-3 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
          403
        </span>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-destructive">
            {isFa ? 'دسترسی غیرمجاز' : 'Access Denied'}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {reason ??
              (isFa
                ? 'شما اجازه دسترسی به این صفحه را ندارید. ممکن است نقش یا وضعیت تأیید حساب شما اجازه ورود به این بخش را ندهد.'
                : 'You do not have permission to access this page. Your role or approval status may not allow entry to this section.')}
          </p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="space-y-3">
          <button
            onClick={() => navigate('/app', { replace: true })}
            className="w-full rounded-xl py-3 text-sm font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Arrow size={16} />
            {isFa ? 'بازگشت به داشبورد' : 'Go to Dashboard'}
          </button>

          <button
            onClick={() => navigate('/', { replace: true })}
            className="w-full glass rounded-xl py-3 text-sm font-medium hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 text-muted-foreground"
          >
            <Home size={16} />
            {isFa ? 'صفحه اصلی' : 'Home'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AccessDenied;
