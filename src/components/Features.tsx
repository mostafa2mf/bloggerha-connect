import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, BarChart3, MessageCircle, UserCircle } from 'lucide-react';

const Features = () => {
  const { t } = useLanguage();

  const features = [
    { icon: Shield, title: t('features.security'), desc: t('features.securityDesc') },
    { icon: BarChart3, title: t('features.analytics'), desc: t('features.analyticsDesc') },
    { icon: MessageCircle, title: t('features.directComm'), desc: t('features.directCommDesc') },
    { icon: UserCircle, title: t('features.profile'), desc: t('features.profileDesc') },
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
          {t('features.title')}
        </motion.h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="glass rounded-2xl p-6 group hover:glow-border transition-all duration-300 hover:-translate-y-2"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon size={24} className="text-primary" />
              </div>
              <h3 className="text-base font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
