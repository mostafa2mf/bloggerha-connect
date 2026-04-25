import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, Building2 } from 'lucide-react';

const About = () => {
  const { t } = useLanguage();

  return (
    <section id="about" className="py-24 relative">
      <div className="container px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -50, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 gradient-text">{t('about.title')}</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">{t('about.desc')}</p>
            <div className="space-y-4">
              <motion.div
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users size={20} className="text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">{t('about.bloggerBenefit')}</p>
              </motion.div>
              <motion.div
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.45, duration: 0.5 }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Building2 size={20} className="text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">{t('about.brandBenefit')}</p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="glass rounded-3xl p-8 relative overflow-hidden"
            initial={{ opacity: 0, x: 50, scale: 0.92, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 pointer-events-none" />
            <div className="relative space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-foreground">B</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Bloggerha</h3>
                  <p className="text-sm text-muted-foreground">Smart Marketplace</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { val: '+10M', label: 'Users' },
                  { val: '+2K', label: 'Brands' },
                  { val: '98%', label: 'Satisfaction' },
                  { val: '24/7', label: 'Support' },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    className="glass rounded-xl p-4 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.1, type: 'spring', stiffness: 100 }}
                  >
                    <div className="text-xl font-bold gradient-text">{s.val}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
