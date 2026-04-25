import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Failed to reset password.');
      return;
    }

    toast.success('Password reset successful. Please log in.');
    navigate('/', { replace: true });
  };

  return (
    <>
      <Header />
      <div className="pt-20 min-h-screen flex items-center justify-center p-6">
        <div className="glass rounded-3xl p-8 w-full max-w-md space-y-5">
          <h1 className="text-2xl font-bold gradient-text text-center">Reset Password</h1>
          <p className="text-sm text-muted-foreground text-center">
            Set a new password for your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-bg text-primary-foreground font-medium py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
