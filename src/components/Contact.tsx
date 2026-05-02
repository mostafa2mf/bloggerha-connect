import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Contact = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = (formData.get('name') as string)?.trim();
    const email = (formData.get('email') as string)?.trim();
    const message = (formData.get('message') as string)?.trim();

    if (!name || !email || !message) {
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from('contact_submissions').insert({ name, email, message });
      if (error) throw error;
      toast.success(t('contact.success'));
      form.reset();
    } catch {
      toast.error(t('contact.error') || 'خطا در ارسال پیام');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-24 relative">
      <div className="container px-4">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold text-center mb-16 gradient-text"
          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {t('contact.title')}
        </motion.h2>

        <motion.form
          onSubmit={handleSubmit}
          className="glass rounded-3xl p-8 max-w-lg mx-auto space-y-6"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="space-y-1"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <label className="text-sm font-medium text-muted-foreground">{t('contact.name')}</label>
            <input
              required
              name="name"
              type="text"
              className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder={t('contact.name')}
            />
          </motion.div>
          <motion.div
            className="space-y-1"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <label className="text-sm font-medium text-muted-foreground">{t('contact.email')}</label>
            <input
              required
              name="email"
              type="email"
              className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder={t('contact.email')}
            />
          </motion.div>
          <motion.div
            className="space-y-1"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <label className="text-sm font-medium text-muted-foreground">{t('contact.message')}</label>
            <textarea
              required
              name="message"
              rows={4}
              className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              placeholder={t('contact.message')}
            />
          </motion.div>
          <motion.button
            type="submit"
            disabled={loading}
            className="w-full gradient-bg text-primary-foreground font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.4 }}
            whileTap={{ scale: 0.97 }}
          >
            <Send size={18} />
            {loading ? '...' : t('contact.send')}
          </motion.button>
        </motion.form>
      </div>
    </section>
  );
};

export default Contact;
