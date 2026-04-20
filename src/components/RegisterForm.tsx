import { useState, FormEvent, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, User, Mail, Phone, Lock, Instagram, Tag, Loader2, Users, MapPin, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  businessRegisterSchema,
  bloggerRegisterSchema,
  normalizePhone,
  persianToEnglishDigits,
  extractInstagramUsername,
  IRAN_CITIES,
} from '@/lib/registerValidation';
import type { ZodError } from 'zod';

interface Props {
  type: 'blogger' | 'business';
}

type FieldErrors = Record<string, string[]>;

function zodToFieldErrors(err: ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of err.issues) {
    const key = issue.path[0] as string;
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

const RegisterForm = ({ type }: Props) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [instagram, setInstagram] = useState('');
  const [followersCount, setFollowersCount] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('تهران');

  const igUsername = useMemo(() => extractInstagramUsername(instagram), [instagram]);

  const title = type === 'blogger' ? 'ثبت‌نام بلاگر' : 'ثبت‌نام کسب‌وکار';

  const getStrength = (pw: string) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return Math.min(s, 4);
  };

  const strength = getStrength(password);
  const strengthColors = ['bg-destructive', 'bg-destructive', 'bg-primary/60', 'bg-primary', 'bg-green-500'];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    // Client-side validation
    const rawData: any = {
      full_name: fullName,
      email,
      phone,
      password,
      instagram_url: instagram,
      category,
      city,
    };
    if (type === 'blogger') {
      rawData.followers_count = followersCount;
    }

    const schema = type === 'blogger' ? bloggerRegisterSchema : businessRegisterSchema;
    const result = schema.safeParse(rawData);

    if (!result.success) {
      setFieldErrors(zodToFieldErrors(result.error));
      return;
    }

    setLoading(true);

    try {
      // Call edge function for server-side validation + registration
      const { data: response, error: fnError } = await supabase.functions.invoke('register', {
        body: { ...rawData, role: type },
      });

      if (fnError) {
        toast.error('خطایی در پردازش درخواست رخ داد. لطفاً دوباره تلاش کنید.');
        setLoading(false);
        return;
      }

      if (!response.success) {
        if (response.errors && Object.keys(response.errors).length > 0) {
          setFieldErrors(response.errors);
        }
        toast.error(response.message || 'ثبت‌نام انجام نشد.');
        setLoading(false);
        return;
      }

      // For businesses (auto-approved): auto-login and redirect to dashboard.
      // For bloggers (pending review): do NOT auto-login. Show clear pending message
      // and send them to the login page so they can sign in once an admin approves.
      if (type === 'business') {
        const normalizedEmail = email.trim().toLowerCase();
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (loginError) {
          toast.success(response.message);
          setTimeout(() => navigate('/'), 2000);
        } else {
          toast.success(response.message);
          setTimeout(() => navigate('/dashboard/business'), 1500);
        }
      } else {
        // Blogger: pending review — keep them logged out
        toast.success(response.message, {
          description: 'بررسی توسط ادمین معمولاً بین ۱ تا ۲۴ ساعت طول می‌کشد. پس از تأیید می‌توانید وارد شوید.',
          duration: 8000,
        });
        setTimeout(() => navigate('/'), 3500);
      }
    } catch {
      toast.error('خطایی در پردازش درخواست رخ داد. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-background/50 border border-border rounded-xl pe-4 ps-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50';
  const errorInputClass =
    'w-full bg-background/50 border border-destructive rounded-xl pe-4 ps-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50 transition-all placeholder:text-muted-foreground/50';

  const getInputClass = (field: string) => (fieldErrors[field] ? errorInputClass : inputClass);

  const FieldError = ({ field }: { field: string }) => {
    const errs = fieldErrors[field];
    if (!errs?.length) return null;
    return (
      <AnimatePresence>
        {errs.map((msg, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-destructive mt-1"
          >
            {msg}
          </motion.p>
        ))}
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-24 px-4 relative">
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

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <div className="relative">
              <User size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="نام و نام خانوادگی خود را وارد کنید"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={getInputClass('full_name')}
              />
            </div>
            <FieldError field="full_name" />
          </div>

          {/* Email */}
          <div>
            <div className="relative">
              <Mail size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={getInputClass('email')}
                dir="ltr"
              />
            </div>
            <FieldError field="email" />
          </div>

          {/* Phone */}
          <div>
            <div className="relative">
              <Phone size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                placeholder="09123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={getInputClass('phone')}
                dir="ltr"
              />
            </div>
            <FieldError field="phone" />
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <Lock size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="حداقل ۸ کاراکتر"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={getInputClass('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <FieldError field="password" />
          </div>

          {/* Password strength */}
          {password && (
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? strengthColors[strength] : 'bg-border'}`}
                />
              ))}
            </div>
          )}

          {/* Instagram */}
          <div>
            <div className="relative">
              <Instagram size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="url"
                placeholder="https://instagram.com/yourusername"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className={getInputClass('instagram_url')}
                dir="ltr"
              />
              {igUsername && !fieldErrors['instagram_url'] && (
                <CheckCircle2 size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-green-500" />
              )}
            </div>
            {igUsername && !fieldErrors['instagram_url'] && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1" dir="ltr">
                ✓ @{igUsername}
              </p>
            )}
            <FieldError field="instagram_url" />
          </div>

          {/* Followers Count - Only for blogger */}
          {type === 'blogger' && (
            <div>
              <div className="relative">
                <Users size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="مثال: 150000"
                  value={followersCount}
                  onChange={(e) => setFollowersCount(e.target.value)}
                  className={getInputClass('followers_count')}
                  dir="ltr"
                />
              </div>
              <FieldError field="followers_count" />
            </div>
          )}

          {/* City */}
          <div>
            <div className="relative">
              <MapPin size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={getInputClass('city') + ' appearance-none cursor-pointer'}
              >
                {IRAN_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <FieldError field="city" />
          </div>

          {/* Category */}
          <div>
            <div className="relative">
              <Tag size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="مثال: زیبایی، مد، تکنولوژی"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={getInputClass('category')}
              />
            </div>
            <FieldError field="category" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-bg text-primary-foreground font-medium py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default RegisterForm;
