import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, Globe, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import AdminEntryModal from './AdminEntryModal';
import logo from '@/assets/logo.png';

const Header = () => {
  const { t, toggleLang, lang } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  const isDashboard = location.pathname.startsWith('/dashboard');

  const navItems = isDashboard ? [] : [
    { label: t('nav.home'), href: '/' },
    { label: t('nav.about'), href: '/#about' },
    { label: t('nav.contact'), href: '/#contact' },
  ];

  return (
    <>
      <motion.header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? 'glass-strong shadow-sm' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Bloggerha" className="h-10 w-10 object-contain drop-shadow-[0_0_8px_rgba(218,165,32,0.5)]" style={{ filter: 'drop-shadow(0 0 6px rgba(218,165,32,0.4))' }} />
            <span className="text-xl font-bold gradient-text tracking-tight">Bloggerha</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300 relative group"
              >
                {item.label}
                <span className="absolute bottom-1 inset-x-4 h-0.5 rounded-full gradient-bg scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass text-xs font-bold hover:glow-border transition-all duration-300"
            >
              <Globe size={14} />
              <span>{lang === 'fa' ? 'EN' : 'FA'}</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl glass hover:glow-border transition-all duration-300 relative overflow-hidden"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isDark ? 'dark' : 'light'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                </motion.div>
              </AnimatePresence>
            </button>

            {!isDashboard && (
              <button
                onClick={() => setAdminModalOpen(true)}
                className="text-sm font-medium px-4 py-2 rounded-xl glass-gold text-primary hover:glow-gold transition-all duration-300 flex items-center gap-1.5"
              >
                <Shield size={14} />
                {t('nav.adminEntry')}
              </button>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button onClick={toggleLang} className="flex items-center gap-1 px-2 py-1.5 rounded-lg glass text-xs font-bold">
              <Globe size={13} />
              {lang === 'fa' ? 'EN' : 'FA'}
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-lg glass">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg glass">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-16 z-40 glass-strong p-4 md:hidden"
          >
            <nav className="flex flex-col gap-2">
              {navItems.map(item => (
                <a key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2.5 px-4 rounded-xl hover:bg-muted/50 transition-colors">
                  {item.label}
                </a>
              ))}
              {!isDashboard && (
                <button
                  onClick={() => { setAdminModalOpen(true); setMobileOpen(false); }}
                  className="text-sm font-medium py-2.5 px-4 rounded-xl glass-gold text-primary text-center flex items-center justify-center gap-1.5"
                >
                  <Shield size={14} />
                  {t('nav.adminEntry')}
                </button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminEntryModal isOpen={adminModalOpen} onClose={() => setAdminModalOpen(false)} />
    </>
  );
};

export default Header;
