import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, BarChart3, MessageCircle, UserCircle } from 'lucide-react';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 80, damping: 14 } },
};

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
          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {t('features.title')}
        </motion.h2>

        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={item}
              className="glass rounded-2xl p-6 group hover:glow-border transition-all duration-300 hover:-translate-y-2"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <f.icon size={24} className="text-primary" />
              </div>
              <h3 className="text-base font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
