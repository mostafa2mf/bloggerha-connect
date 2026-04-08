import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

const Contact = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    toast.success(t('contact.success'));
    (e.target as HTMLFormElement).reset();
  };

  return (
    <section id="contact" className="py-24 relative">
      <div className="container px-4">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold text-center mb-16 gradient-text"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t('contact.title')}
        </motion.h2>

        <motion.form
          onSubmit={handleSubmit}
          className="glass rounded-3xl p-8 max-w-lg mx-auto space-y-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">{t('contact.name')}</label>
            <input
              required
              type="text"
              className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder={t('contact.name')}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">{t('contact.email')}</label>
            <input
              required
              type="email"
              className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder={t('contact.email')}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">{t('contact.message')}</label>
            <textarea
              required
              rows={4}
              className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              placeholder={t('contact.message')}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-bg text-primary-foreground font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send size={18} />
            {loading ? '...' : t('contact.send')}
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default Contact;
