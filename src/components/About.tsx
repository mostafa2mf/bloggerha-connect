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
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 gradient-text">{t('about.title')}</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">{t('about.desc')}</p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users size={20} className="text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">{t('about.bloggerBenefit')}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Building2 size={20} className="text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">{t('about.brandBenefit')}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="glass rounded-3xl p-8 relative overflow-hidden"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
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
                  <div key={i} className="glass rounded-xl p-4 text-center">
                    <div className="text-xl font-bold gradient-text">{s.val}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
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
