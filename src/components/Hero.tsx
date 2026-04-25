import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Users, Briefcase, User, ArrowLeft, ArrowRight } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import UserLoginModal from './UserLoginModal';

const Hero = () => {
  const { t, lang } = useLanguage();
  const Arrow = lang === 'fa' ? ArrowLeft : ArrowRight;
  const [userModalOpen, setUserModalOpen] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 start-1/4 w-72 h-72 rounded-full bg-primary/20 blur-[100px] animate-blob" />
        <div className="absolute bottom-1/4 end-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px] animate-blob [animation-delay:2s]" />
        <div className="absolute top-1/2 start-1/2 w-64 h-64 rounded-full bg-primary/15 blur-[80px] animate-blob [animation-delay:4s]" />
      </div>

      <div className="container relative z-10 px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 gradient-text"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {t('hero.title')}
          </motion.h1>
          <motion.p
            className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {t('hero.subtitle')}
          </motion.p>
        </div>

        <motion.div
          className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <Link to="/register/blogger" className="group w-full sm:w-64">
            <div className="glass rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2 hover:glow-border cursor-pointer animate-float">
              <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4">
                <Users size={24} className="text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t('hero.bloggerCard')}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t('hero.bloggerDesc')}</p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                {t('nav.bloggerLogin')} <Arrow size={16} />
              </span>
            </div>
          </Link>

          <Link to="/register/business" className="group w-full sm:w-64">
            <div className="glass rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2 hover:glow-border cursor-pointer animate-float-slow">
              <div className="w-12 h-12 rounded-xl gradient-bg-gold flex items-center justify-center mb-4">
                <Briefcase size={24} className="text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t('hero.businessCard')}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t('hero.businessDesc')}</p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                {t('nav.businessLogin')} <Arrow size={16} />
              </span>
            </div>
          </Link>

          <button onClick={() => setUserModalOpen(true)} className="group w-full sm:w-64 text-start">
            <div className="glass-gold rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2 hover:glow-gold cursor-pointer animate-float [animation-delay:1s]">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                <User size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t('hero.userCard')}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t('hero.userDesc')}</p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                {t('nav.userLogin')} <Arrow size={16} />
              </span>
            </div>
          </button>
        </motion.div>

        <motion.div
          className="flex flex-wrap justify-center gap-8 sm:gap-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          <AnimatedCounter end={10000000} suffix="+" label={t('stats.users')} display="+10M" />
          <AnimatedCounter end={2000} suffix="+" label={t('stats.brands')} display="+2K" />
          <AnimatedCounter end={150000} suffix="+" label={t('stats.campaigns')} display="+150K" />
        </motion.div>
      </div>

      <UserLoginModal isOpen={userModalOpen} onClose={() => setUserModalOpen(false)} />
    </section>
  );
};

export default Hero;
