import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import LogoSplash from '@/components/shared/LogoSplash';

type AppRole = 'blogger' | 'business' | 'admin';
type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface AppRouteGateProps {
  children: ReactNode;
  allowRoles?: AppRole[];
  allowStatuses?: ApprovalStatus[];
  allowAdminPreview?: boolean;
}

const AppRouteGate = ({ children, allowRoles, allowStatuses, allowAdminPreview = false }: AppRouteGateProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState<{ role: string | null; approval_status: string | null } | null>(null);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const isAdminPreview = new URLSearchParams(location.search).get('admin_preview') === 'true';

  if (allowAdminPreview && isAdminPreview) {
    return <>{children}</>;
  }

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

    return () => {
      cancelled = true;
    };
  }, [loading, user]);

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
  const status = profile.approval_status as ApprovalStatus | null;

  if (allowRoles?.length && (!role || !allowRoles.includes(role))) {
    return <Navigate to="/app" replace />;
  }

  if (allowStatuses?.length && role !== 'admin' && (!status || !allowStatuses.includes(status))) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};

export default AppRouteGate;