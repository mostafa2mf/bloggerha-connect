import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { X, Users, Building2, Mail, Lock, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'selectRole' | 'login' | 'signup';

const UserLoginModal = ({ isOpen, onClose }: Props) => {
  const { t } = useLanguage();
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

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t('auth.loginSuccess'));
    onClose();
    navigate(role === 'blogger' ? '/dashboard' : '/dashboard');
  };

  const handleSignup = async () => {
    setLoading(true);
    const { error } = await signUp(email, password, role, username);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t('auth.signupSuccess'));
    onClose();
    navigate('/dashboard');
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
            className="glass rounded-3xl p-8 w-full max-w-md relative z-10"
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
                    className="w-full gradient-bg text-primary-foreground font-medium py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? '...' : isSignup ? t('auth.signup') : t('auth.login')}
                  </button>

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
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserLoginModal;
