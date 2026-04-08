import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageCircle } from 'lucide-react';

const DashMessages = () => {
  const { t, lang } = useLanguage();
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <MessageCircle size={28} className="text-primary" />
      </div>
      <h2 className="text-xl font-bold mb-2">{lang === 'fa' ? 'پیام‌ها' : 'Messages'}</h2>
      <p className="text-sm text-muted-foreground">{lang === 'fa' ? 'هنوز پیامی وجود ندارد' : 'No messages yet'}</p>
    </motion.div>
  );
};

export default DashMessages;
