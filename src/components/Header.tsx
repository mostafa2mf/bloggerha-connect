import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, Globe } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const { t, toggleLang, lang } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  const navItems = [
    { label: t('nav.home'), href: '/' },
    { label: t('nav.about'), href: '/#about' },
    { label: t('nav.contact'), href: '/#contact' },
  ];

  return (
    <>
      <motion.header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass-strong shadow-sm' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-xl font-bold gradient-text">
            Bloggerha
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map(item => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 start-0 w-0 h-0.5 gradient-bg transition-all duration-300 group-hover:w-full rounded-full" />
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={toggleLang} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Toggle language">
              <Globe size={18} />
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Toggle theme">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/register/blogger" className="text-sm font-medium px-4 py-2 rounded-lg gradient-bg text-primary-foreground hover:opacity-90 transition-opacity">
              {t('nav.bloggerLogin')}
            </Link>
            <Link to="/register/business" className="text-sm font-medium px-4 py-2 rounded-lg border border-primary/30 text-foreground hover:bg-primary/10 transition-colors">
              {t('nav.businessLogin')}
            </Link>
          </div>

          {/* Mobile toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={toggleLang} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <Globe size={18} />
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-16 z-40 glass-strong p-4 md:hidden"
          >
            <nav className="flex flex-col gap-3">
              {navItems.map(item => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium py-2 px-3 rounded-lg hover:bg-muted transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <Link to="/register/blogger" className="text-sm font-medium py-2 px-3 rounded-lg gradient-bg text-primary-foreground text-center">
                {t('nav.bloggerLogin')}
              </Link>
              <Link to="/register/business" className="text-sm font-medium py-2 px-3 rounded-lg border border-primary/30 text-center">
                {t('nav.businessLogin')}
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
