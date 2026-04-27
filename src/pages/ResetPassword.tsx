import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Lock, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const ResetPassword = () => {
  const navigate = useNavigate();
  const isEn = typeof document !== 'undefined' && document.documentElement.lang?.toLowerCase().startsWith('en');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const copy = useMemo(() => isEn ? {
    title: 'Set your password',
    subtitle: 'Choose a password to enter your dashboard.',
    password: 'New password',
    confirm: 'Confirm password',
    submit: 'Save and continue',
    success: 'Password updated. Redirecting to your dashboard.',
    invalid: 'Use at least 8 characters.',
    mismatch: 'Passwords do not match.',
    expired: 'This recovery link is invalid or expired.',
    back: 'Back to home',
  } : {
    title: 'تنظیم رمز عبور',
    subtitle: 'رمز عبور خود را انتخاب کنید تا وارد داشبورد شوید.',
    password: 'رمز عبور جدید',
    confirm: 'تکرار رمز عبور',
    submit: 'ذخیره و ادامه',
    success: 'رمز عبور ذخیره شد. در حال انتقال به داشبورد.',
    invalid: 'رمز عبور باید حداقل ۸ کاراکتر باشد.',
    mismatch: 'تکرار رمز عبور یکسان نیست.',
    expired: 'لینک بازیابی نامعتبر یا منقضی شده است.',
    back: 'بازگشت به خانه',
  }, [isEn]);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
    setReady(params.get('type') === 'recovery' || !!params.get('access_token'));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error(copy.invalid);
      return;
    }
    if (password !== confirmPassword) {
      toast.error(copy.mismatch);
      return;
    }

    setLoading(true);
    const { data: authData, error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message || copy.expired);
      return;
    }

    toast.success(copy.success);
    const role = authData.user?.user_metadata?.role;
    navigate(role === 'business' ? '/dashboard/business' : '/dashboard', { replace: true });
  };

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <section className="glass rounded-3xl w-full max-w-md p-8 space-y-6">
          <div className="space-y-2 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl gradient-bg flex items-center justify-center">
              <CheckCircle2 className="text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">{copy.title}</h1>
            <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>

          {!ready ? (
            <div className="glass rounded-2xl p-4 text-sm text-center text-muted-foreground">{copy.expired}</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium">{copy.password}</span>
                <div className="relative">
                  <Lock size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 rounded-xl border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">{copy.confirm}</span>
                <div className="relative">
                  <Lock size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 rounded-xl border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </label>

              <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : null}
                {copy.submit}
              </Button>
            </form>
          )}

          <Link to="/" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            {isEn ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            {copy.back}
          </Link>
        </section>
      </main>
    </>
  );
};

export default ResetPassword;