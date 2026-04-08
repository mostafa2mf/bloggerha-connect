import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, User, Mail, Phone, Lock, Instagram, FileText, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  type: 'blogger' | 'business';
}

const RegisterForm = ({ type }: Props) => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');

  const title = type === 'blogger' ? t('register.blogger.title') : t('register.business.title');

  const categories = [
    t('register.categories.lifestyle'),
    t('register.categories.tech'),
    t('register.categories.food'),
    t('register.categories.fashion'),
    t('register.categories.travel'),
    t('register.categories.beauty'),
  ];

  const getStrength = (pw: string) => {
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return Math.min(s, 4);
  };

  const strength = getStrength(password);
  const strengthColors = ['bg-destructive', 'bg-destructive', 'bg-primary/60', 'bg-primary', 'bg-green-500'];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    toast.success(t('register.success'));
    setTimeout(() => navigate('/'), 1500);
  };

  const inputClass = "w-full bg-background/50 border border-border rounded-xl pe-4 ps-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50";

  return (
    <div className="min-h-screen flex items-center justify-center py-24 px-4 relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 start-1/4 w-72 h-72 rounded-full bg-primary/15 blur-[100px] animate-blob" />
        <div className="absolute bottom-1/3 end-1/4 w-64 h-64 rounded-full bg-primary/10 blur-[80px] animate-blob [animation-delay:3s]" />
      </div>

      <motion.div
        className="glass rounded-3xl p-8 w-full max-w-md relative z-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold gradient-text">{title}</h1>
          <Link
            to="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('register.back')} <ArrowRight size={14} />
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="relative">
            <User size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input required type="text" placeholder={t('register.name')} className={inputClass} />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input required type="email" placeholder={t('register.email')} className={inputClass} />
          </div>

          {/* Phone */}
          <div className="relative">
            <Phone size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input required type="tel" placeholder={t('register.phone')} className={inputClass} />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              required
              type={showPassword ? 'text' : 'password'}
              placeholder={t('register.password')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password strength */}
          {password && (
            <div className="flex gap-1">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? strengthColors[strength] : 'bg-border'}`}
                />
              ))}
            </div>
          )}

          {/* Description */}
          <div className="relative">
            <FileText size={18} className="absolute start-3 top-3 text-muted-foreground" />
            <textarea
              rows={3}
              placeholder={t('register.description')}
              className="w-full bg-background/50 border border-border rounded-xl pe-4 ps-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Instagram */}
          <div className="relative">
            <Instagram size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="url" placeholder={t('register.instagram')} className={inputClass} />
          </div>

          {/* Category */}
          <div className="relative">
            <Tag size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select className={inputClass + " appearance-none"}>
              <option value="">{t('register.category')}</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-bg text-primary-foreground font-medium py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
          >
            {loading ? '...' : t('register.submit')}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default RegisterForm;
