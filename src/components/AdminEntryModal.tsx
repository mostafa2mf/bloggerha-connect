import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { X, Users, Building2, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AdminEntryModal = ({ isOpen, onClose }: Props) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const goTo = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-md glass-gold rounded-3xl p-8 overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Decorative glow */}
            <div className="absolute -top-20 -end-20 w-40 h-40 rounded-full bg-primary/20 blur-[60px] pointer-events-none" />
            <div className="absolute -bottom-20 -start-20 w-40 h-40 rounded-full bg-primary/10 blur-[60px] pointer-events-none" />

            <button
              onClick={onClose}
              className="absolute top-4 end-4 p-2 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground"
            >
              <X size={20} />
            </button>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={18} className="text-primary" />
                <span className="text-xs font-medium text-primary">{t('admin.temp')}</span>
              </div>
              <h2 className="text-xl font-bold mb-1">{t('admin.title')}</h2>
              <p className="text-sm text-muted-foreground mb-6">{t('admin.subtitle')}</p>

              <div className="space-y-3">
                <motion.button
                  onClick={() => goTo('/dashboard')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl glass hover:glow-border-gold transition-all duration-300 group text-start"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shrink-0">
                    <Users size={22} className="text-primary-foreground" />
                  </div>
                  <div>
                    <div className="font-bold">{t('admin.bloggerDash')}</div>
                    <div className="text-xs text-muted-foreground">{t('admin.bloggerDesc')}</div>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => goTo('/dashboard/business')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl glass hover:glow-border-gold transition-all duration-300 group text-start"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-12 h-12 rounded-xl gradient-bg-gold flex items-center justify-center shrink-0">
                    <Building2 size={22} className="text-primary-foreground" />
                  </div>
                  <div>
                    <div className="font-bold">{t('admin.businessDash')}</div>
                    <div className="text-xs text-muted-foreground">{t('admin.businessDesc')}</div>
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdminEntryModal;
