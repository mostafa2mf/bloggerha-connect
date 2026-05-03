import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import LogoSplash from '@/components/shared/LogoSplash';
import AccessDenied from '@/pages/AccessDenied';

type AppRole = 'blogger' | 'business' | 'admin';

interface AppRouteGateProps {
  children: ReactNode;
  allowRoles?: AppRole[];
  allowAdminPreview?: boolean;
}

/**
 * Route-level gate that only checks ROLE, not approval status.
 * Approval status gating is handled INSIDE each dashboard layout.
 * This ensures pending/rejected users stay on their dashboard route.
 */
const AppRouteGate = ({ children, allowRoles, allowAdminPreview = false }: AppRouteGateProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState<{ role: string | null; approval_status: string | null } | null>(null);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const isAdminPreview = new URLSearchParams(location.search).get('admin_preview') === 'true';

  useEffect(() => {
    if (loading || !user) {
      setProfile(null);
      setFetchingProfile(false);
      return;
    }

    let cancelled = false;
    setFetchingProfile(true);

    void (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('role, approval_status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (cancelled) return;
        setProfile(data ?? null);
      } catch {
        if (cancelled) return;
        setProfile(null);
      } finally {
        if (!cancelled) setFetchingProfile(false);
      }
    })();

    return () => { cancelled = true; };
  }, [loading, user]);

  // Admin preview bypass
  if (allowAdminPreview && isAdminPreview) {
    return <>{children}</>;
  }

  if (loading || fetchingProfile) {
    return <LogoSplash />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!profile) {
    return <Navigate to="/app" replace />;
  }

  const role = profile.role as AppRole | null;

  // Only check role — approval status is handled inside dashboard layouts
  if (allowRoles?.length && (!role || !allowRoles.includes(role))) {
    return <AccessDenied />;
  }

  return <>{children}</>;
};

export default AppRouteGate;
