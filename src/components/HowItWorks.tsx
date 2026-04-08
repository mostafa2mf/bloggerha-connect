import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, Handshake, Rocket } from 'lucide-react';

const HowItWorks = () => {
  const { t } = useLanguage();

  const steps = [
    { icon: Search, title: t('how.step1.title'), desc: t('how.step1.desc') },
    { icon: Handshake, title: t('how.step2.title'), desc: t('how.step2.desc') },
    { icon: Rocket, title: t('how.step3.title'), desc: t('how.step3.desc') },
  ];

  return (
    <section className="py-24 relative">
      <div className="container px-4">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold text-center mb-16 gradient-text"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t('how.title')}
        </motion.h2>

        <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              className="glass rounded-2xl p-6 text-center group hover:glow-border transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <step.icon size={28} className="text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
