import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logEventSync } from '@/lib/eventLogger';
import LogoSplash from '@/components/shared/LogoSplash';

/**
 * Single source of truth for post-login / post-approval routing.
 *
 * Rules:
 *  - Unauthenticated → /
 *  - role=blogger  + approved → /blogger-dashboard
 *  - role=business + approved → /business-dashboard
 *  - role=admin               → /admin-dashboard
 *  - approval_status=pending  → /pending-approval
 *  - approval_status=rejected → /application-rejected
 *
 * Never sends an approved user to "/".
 */
const AppRedirectGuard = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      logEventSync({ action: 'redirect.to_landing', details: { reason: 'unauthenticated', source: 'AppRedirectGuard' } });
      navigate('/', { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      const { data: profile, error: err } = await supabase
        .from('profiles')
        .select('approval_status, role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (err) {
        setError(err.message);
        logEventSync({ action: 'redirect.error', details: { error: err.message, source: 'AppRedirectGuard' } });
        return;
      }

      const role = (userRole || profile?.role || 'blogger') as 'blogger' | 'business' | 'admin';
      const status = (profile?.approval_status || 'pending') as 'pending' | 'approved' | 'rejected';

      // Admins always go to the admin dashboard regardless of approval_status
      if (role === 'admin') {
        logEventSync({ action: 'redirect.to_dashboard', details: { role, status, target: '/admin-dashboard', source: 'AppRedirectGuard' } });
        navigate('/admin-dashboard', { replace: true });
        return;
      }

      if (status === 'rejected') {
        logEventSync({ action: 'redirect.to_rejected', details: { role, source: 'AppRedirectGuard' } });
        navigate('/application-rejected', { replace: true });
        return;
      }

      if (status === 'pending') {
        logEventSync({ action: 'redirect.to_pending', details: { role, source: 'AppRedirectGuard' } });
        navigate('/pending-approval', { replace: true });
        return;
      }

      // approved
      const target = role === 'business' ? '/business-dashboard' : '/blogger-dashboard';
      logEventSync({ action: 'redirect.to_dashboard', details: { role, status, target, source: 'AppRedirectGuard' } });
      navigate(target, { replace: true });
    })();

    return () => { cancelled = true; };
  }, [user, userRole, loading, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="glass rounded-2xl p-6 max-w-sm">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return <LogoSplash />;
};

export default AppRedirectGuard;
