import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Settings } from 'lucide-react';

const DashSettings = () => {
  const { lang } = useLanguage();
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Settings size={28} className="text-primary" />
      </div>
      <h2 className="text-xl font-bold mb-2">{lang === 'fa' ? 'تنظیمات' : 'Settings'}</h2>
      <p className="text-sm text-muted-foreground">{lang === 'fa' ? 'به زودی...' : 'Coming soon...'}</p>
    </motion.div>
  );
};

export default DashSettings;
