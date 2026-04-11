import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, MessageCircle, User, Upload } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

interface Props {
  onNavigate?: (tab: string) => void;
}

const shortcuts = [
  { id: 'campaigns', icon: Calendar, labelFa: 'کمپین‌ها', labelEn: 'Campaigns', desc_fa: 'مشاهده و درخواست آفرها', desc_en: 'View & apply for offers' },
  { id: 'messages', icon: MessageCircle, labelFa: 'پیام‌ها', labelEn: 'Messages', desc_fa: 'گفتگو با ادمین', desc_en: 'Chat with admin' },
  { id: 'profile', icon: User, labelFa: 'پروفایل', labelEn: 'Profile', desc_fa: 'ویرایش اطلاعات حساب', desc_en: 'Edit your account info' },
  { id: 'upload-review', icon: Upload, labelFa: 'Upload Review', labelEn: 'Upload Review', desc_fa: 'ارسال مدارک بازدید', desc_en: 'Submit visit proof' },
];

const DashHome = () => {
  const { lang } = useLanguage();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Greeting */}
      <motion.div variants={item} className="glass-gold rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl font-extrabold">
            {lang === 'fa' ? 'سلام،' : 'Hello,'} <span className="gradient-text">{lang === 'fa' ? 'بلاگر' : 'Blogger'}</span> 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'fa' ? 'به داشبورد خوش آمدید' : 'Welcome to your dashboard'}
          </p>
        </div>
      </motion.div>

      {/* 4 Shortcut Cards */}
      <div className="grid grid-cols-2 gap-4">
        {shortcuts.map((s) => (
          <motion.button
            key={s.id}
            variants={item}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            className="glass rounded-3xl p-5 text-start border border-primary/10 shadow-lg shadow-primary/5 hover:shadow-primary/15 hover:glow-border transition-all duration-300 group"
          >
            <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <s.icon size={22} className="text-primary-foreground" />
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
