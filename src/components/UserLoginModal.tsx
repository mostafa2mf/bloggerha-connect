import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { X, Users, Building2, Mail, Lock, User as UserIcon, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import AdminChatPanel from '@/components/shared/AdminChatPanel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'selectRole' | 'login' | 'forgotPassword';

const UserLoginModal = ({ isOpen, onClose }: Props) => {
  const { t, lang } = useLanguage();
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('selectRole');
  const [role, setRole] = useState<'blogger' | 'business'>('blogger');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const handleSelectRole = (r: 'blogger' | 'business') => {
    setRole(r);
    setStep('login');
  };

  const redirectByRole = async (userRole?: string) => {
    if (userRole) {
      navigate(userRole === 'business' ? '/dashboard/business' : '/dashboard');
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      if (profile?.role === 'business') {
        navigate('/dashboard/business');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error(t('auth.fillFields'));
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t('auth.loginSuccess'));
    onClose();
    await redirectByRole();
  };

  const handleSignup = async () => {
    if (!email || !password || !username) {
      toast.error(t('auth.fillFields'));
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, role, username);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t('auth.signupSuccess'));
    onClose();
    await redirectByRole(role);
  };

  const resetModal = () => {
    setStep('selectRole');
    setEmail('');
    setPassword('');
    setUsername('');
    setIsSignup(false);
    onClose();
  };

  const inputClass = "w-full bg-background/50 border border-border rounded-xl pe-4 ps-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={resetModal} />
          <motion.div
            className={`glass rounded-3xl p-8 w-full relative z-10 ${step === 'forgotPassword' ? 'max-w-lg' : 'max-w-md'}`}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <button onClick={resetModal} className="absolute top-4 end-4 p-2 rounded-lg hover:bg-muted transition-colors">
              <X size={18} />
            </button>

            <AnimatePresence mode="wait">
              {step === 'selectRole' && (
                <motion.div
                  key="selectRole"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold gradient-text">{t('auth.selectRole')}</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleSelectRole('blogger')}
                      className="glass rounded-2xl p-6 text-center hover:glow-border transition-all duration-300 hover:-translate-y-1 group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <Users size={24} className="text-purple-400" />
                      </div>
                      <span className="font-semibold text-sm">{t('auth.blogger')}</span>
                    </button>
                    <button
                      onClick={() => handleSelectRole('business')}
                      className="glass rounded-2xl p-6 text-center hover:glow-border transition-all duration-300 hover:-translate-y-1 group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <Building2 size={24} className="text-blue-400" />
                      </div>
                      <span className="font-semibold text-sm">{t('auth.business')}</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <h2 className="text-xl font-bold gradient-text">
                    {isSignup ? t('auth.signup') : t('auth.login')}
                  </h2>

                  {isSignup && (
                    <div className="relative">
                      <UserIcon size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder={t('auth.username')}
                        className={inputClass}
                      />
                    </div>
                  )}

                  <div className="relative">
                    <Mail size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={t('auth.email')}
                      className={inputClass}
                    />
                  </div>

                  <div className="relative">
                    <Lock size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={t('auth.password')}
                      className={inputClass}
                    />
                  </div>

                  <button
                    onClick={isSignup ? handleSignup : handleLogin}
                    disabled={loading}
                    className="w-full gradient-bg text-primary-foreground font-medium py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {loading ? '' : isSignup ? t('auth.signup') : t('auth.login')}
                  </button>

                  {/* Forgot password */}
                  {!isSignup && (
                    <button
                      onClick={() => setStep('forgotPassword')}
                      className="w-full text-center text-xs text-primary/70 hover:text-primary transition-colors flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare size={12} />
                      {lang === 'fa' ? 'رمز عبور را فراموش کرده‌اید؟' : 'Forgot your password?'}
                    </button>
                  )}

                  <div className="text-center">
                    <button
                      onClick={() => setIsSignup(!isSignup)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isSignup ? t('auth.hasAccount') : t('auth.noAccount')}{' '}
                      <span className="text-primary font-medium">
                        {isSignup ? t('auth.login') : t('auth.signup')}
                      </span>
                    </button>
                  </div>

                  <button
                    onClick={() => setStep('selectRole')}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← {t('register.back')}
                  </button>
                </motion.div>
              )}

              {step === 'forgotPassword' && (
                <motion.div
                  key="forgotPassword"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h2 className="text-lg font-bold gradient-text flex items-center gap-2">
                    <MessageSquare size={20} />
                    {lang === 'fa' ? 'بازیابی رمز عبور' : 'Password Recovery'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {lang === 'fa'
                      ? 'برای بازیابی رمز عبور، با ادمین در ارتباط باشید. کلمه کلیدی امنیتی خود را ارسال کنید.'
                      : 'To recover your password, chat with admin. Send your security keyword.'}
                  </p>
                  <div className="h-[350px] rounded-2xl overflow-hidden border border-border/30">
                    <AdminChatPanel lang={lang} />
                  </div>
                  <button
                    onClick={() => setStep('login')}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← {lang === 'fa' ? 'بازگشت به ورود' : 'Back to login'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserLoginModal;
