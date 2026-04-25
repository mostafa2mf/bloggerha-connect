import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Send, Instagram, Twitter, Linkedin } from 'lucide-react';
import { toast } from 'sonner';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const Footer = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success(t('contact.success'));
    setEmail('');
  };

  return (
    <footer className="border-t border-border py-16">
      <div className="container px-4">
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
        >
          <motion.div variants={item}>
            <h3 className="text-lg font-bold gradient-text mb-4">Bloggerha</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('about.desc').slice(0, 80)}...
            </p>
          </motion.div>

          <motion.div variants={item}>
            <h4 className="text-sm font-bold mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              <li><a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.home')}</a></li>
              <li><a href="/#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.about')}</a></li>
              <li><a href="/#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('nav.contact')}</a></li>
            </ul>
          </motion.div>

          <motion.div variants={item}>
            <h4 className="text-sm font-bold mb-4">{t('footer.contactInfo')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{t('footer.email')}</li>
              <li>{t('footer.phone')}</li>
              <li>{t('footer.address')}</li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Instagram size={18} /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter size={18} /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin size={18} /></a>
            </div>
          </motion.div>

          <motion.div variants={item}>
            <h4 className="text-sm font-bold mb-4">{t('footer.newsletter')}</h4>
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('footer.newsletterPlaceholder')}
                className="flex-1 bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button type="submit" className="gradient-bg text-primary-foreground p-2 rounded-lg hover:opacity-90 transition-opacity">
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        </motion.div>

        <motion.div
          className="border-t border-border pt-6 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <p className="text-sm text-muted-foreground">{t('footer.copyright')}</p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
