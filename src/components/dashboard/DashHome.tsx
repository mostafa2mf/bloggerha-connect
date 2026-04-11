import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, MessageCircle, User, Upload, BarChart3 } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

interface Props {
  onNavigate?: (tab: string) => void;
}

const shortcuts = [
  { id: 'campaigns', icon: Calendar, labelFa: 'کمپین‌ها', labelEn: 'Campaigns', desc_fa: 'مشاهده و درخواست آفرها', desc_en: 'View & apply for offers', gradient: 'from-orange-400 to-amber-500', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800/40' },
  { id: 'messages', icon: MessageCircle, labelFa: 'پیام‌ها', labelEn: 'Messages', desc_fa: 'گفتگو با ادمین', desc_en: 'Chat with admin', gradient: 'from-violet-400 to-purple-500', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800/40' },
  { id: 'profile', icon: User, labelFa: 'پروفایل', labelEn: 'Profile', desc_fa: 'ویرایش اطلاعات حساب', desc_en: 'Edit your account info', gradient: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800/40' },
  { id: 'upload-review', icon: Upload, labelFa: 'بازبینی محتوا', labelEn: 'Upload Review', desc_fa: 'ارسال مدارک بازدید', desc_en: 'Submit visit proof', gradient: 'from-rose-400 to-pink-500', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800/40' },
  { id: 'analytics', icon: BarChart3, labelFa: 'آمار', labelEn: 'Analytics', desc_fa: 'تحلیل عملکرد شما', desc_en: 'Your performance', gradient: 'from-sky-400 to-blue-500', bg: 'bg-sky-50 dark:bg-sky-950/30', border: 'border-sky-200 dark:border-sky-800/40' },
];

const DashHome = ({ onNavigate }: Props) => {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const displayName = user?.user_metadata?.username || user?.user_metadata?.display_name || (lang === 'fa' ? 'کاربر' : 'User');

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Greeting */}
      <motion.div variants={item} className="glass-gold rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl font-extrabold">
            {lang === 'fa' ? 'سلام،' : 'Hello,'} <span className="gradient-text">{displayName}</span> 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'fa' ? 'به داشبورد خوش آمدید' : 'Welcome to your dashboard'}
          </p>
        </div>
      </motion.div>

      {/* 4 Shortcut Cards - Pastel & Colorful */}
      <div className="grid grid-cols-2 gap-4">
        {shortcuts.map((s) => (
          <motion.button
            key={s.id}
            variants={item}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03, y: -2 }}
            onClick={() => onNavigate?.(s.id)}
            className={`${s.bg} ${s.border} border rounded-3xl p-5 text-start shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer`}
          >
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md`}>
              <s.icon size={22} className="text-white" />
            </div>
            <h3 className="font-bold text-sm">{lang === 'fa' ? s.labelFa : s.labelEn}</h3>
            <p className="text-[11px] text-muted-foreground mt-1">{lang === 'fa' ? s.desc_fa : s.desc_en}</p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default DashHome;
