import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, ArrowLeft, Home } from 'lucide-react';

interface Props {
  onGoBack: () => void;
}

const BackButton = ({ onGoBack }: Props) => {
  const { lang } = useLanguage();
  const Arrow = lang === 'fa' ? ArrowRight : ArrowLeft;

  return (
    <motion.button
      initial={{ opacity: 0, x: lang === 'fa' ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileTap={{ scale: 0.93 }}
      onClick={onGoBack}
      className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-4 group"
    >
      <div className="p-1.5 rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors">
        <Arrow size={16} />
      </div>
      <Home size={14} className="opacity-50" />
      <span>{lang === 'fa' ? 'بازگشت به خانه' : 'Back to Home'}</span>
    </motion.button>
  );
};

export default BackButton;
