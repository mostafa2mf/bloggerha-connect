import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, Globe, Shield, LogOut, Loader2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AdminEntryModal from './AdminEntryModal';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

const Header = () => {
  const { t, toggleLang, lang } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
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

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    toast.success(lang === 'fa' ? 'با موفقیت خارج شدید' : 'Logged out successfully');
    navigate('/');
    setLoggingOut(false);
  };

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

            {isDashboard && user && (
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass text-xs font-bold hover:bg-destructive/10 hover:text-destructive transition-all duration-300 disabled:opacity-50"
              >
                {loggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                <span>{lang === 'fa' ? 'خروج' : 'Logout'}</span>
              </button>
            )}

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

          {/* Mobile controls */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg glass">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
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
            <nav className="flex flex-col gap-2">
              {navItems.map(item => (
                <a key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2.5 px-4 rounded-xl hover:bg-muted/50 transition-colors">
                  {item.label}
                </a>
              ))}

              {/* Utility buttons row */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/30 mt-1">
                <button
                  onClick={() => { toggleLang(); setMobileOpen(false); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass text-xs font-bold flex-1 justify-center"
                >
                  <Globe size={13} />
                  {lang === 'fa' ? 'EN' : 'FA'}
                </button>
                <button
                  onClick={() => { toggleTheme(); setMobileOpen(false); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass text-xs font-bold flex-1 justify-center"
                >
                  {isDark ? <Sun size={14} /> : <Moon size={14} />}
                  {isDark ? (lang === 'fa' ? 'روشن' : 'Light') : (lang === 'fa' ? 'تاریک' : 'Dark')}
                </button>
                {isDashboard && user && (
                  <button
                    onClick={() => { handleLogout(); setMobileOpen(false); }}
                    disabled={loggingOut}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass text-xs font-bold flex-1 justify-center hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    {loggingOut ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
                    {lang === 'fa' ? 'خروج' : 'Logout'}
                  </button>
                )}
              </div>

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
