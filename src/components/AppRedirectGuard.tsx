import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logEventSync } from '@/lib/eventLogger';
import LogoSplash from '@/components/shared/LogoSplash';
import AuthRouteDebugScreen from '@/components/shared/AuthRouteDebugScreen';

/**
 * Single source of truth for post-login routing.
 *
 * Rules:
 *  - Unauthenticated → /
 *  - role=admin → /admin-dashboard
 *  - role=blogger (any status) → /blogger-dashboard
 *  - role=business (any status) → /business-dashboard
 *
 * NEVER redirects pending/rejected users to "/" or a separate status page.
 * Dashboard-level gating handles pending/rejected states.
 */
const AppRedirectGuard = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState<{ id: string; user_id: string; role: string | null; approval_status: string | null } | null>(null);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const lastDecisionRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !user) {
      setProfile(null);
      setQueryError(null);
      setFetchingProfile(false);
      return;
    }

    let cancelled = false;
    setFetchingProfile(true);
    setQueryError(null);

    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, role, approval_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setQueryError(error.message);
        setProfile(null);
        setFetchingProfile(false);
        return;
      }

      setProfile(data ?? null);
      setFetchingProfile(false);
    })();

    return () => { cancelled = true; };
  }, [loading, user]);

  const decision = useMemo(() => {
    if (loading || fetchingProfile) return { kind: 'loading' as const };
    if (!user) return { kind: 'redirect' as const, target: '/', reason: 'unauthenticated' };
    if (queryError) return { kind: 'error' as const, message: queryError };
    if (!profile) return { kind: 'missing-profile' as const };

    if (!['admin', 'blogger', 'business'].includes(profile.role ?? '')) {
      return { kind: 'invalid-role' as const };
    }

    if (profile.role === 'admin') {
      return { kind: 'redirect' as const, target: '/admin-dashboard', reason: 'admin' };
    }

    // Always send to dashboard regardless of approval status
    // Dashboard-level gating will show pending/rejected screens
    return {
      kind: 'redirect' as const,
      target: profile.role === 'business' ? '/business-dashboard' : '/blogger-dashboard',
      reason: profile.approval_status || 'routing',
    };
  }, [fetchingProfile, loading, profile, queryError, user]);

  useEffect(() => {
    if (decision.kind === 'loading') return;

    const payload = {
      userId: user?.id ?? null,
      pathname: location.pathname,
      role: profile?.role ?? null,
      approval_status: profile?.approval_status ?? null,
      finalRedirectTarget: decision.kind === 'redirect' ? decision.target : null,
    };

    const signature = JSON.stringify({ decision, payload });
    if (lastDecisionRef.current === signature) return;
    lastDecisionRef.current = signature;

    console.info('[AppRedirectGuard]', payload);

    if (decision.kind === 'redirect') {
      logEventSync({ action: 'redirect.to_dashboard', details: { ...payload, source: 'AppRedirectGuard' } });
    }
  }, [decision, location.pathname, profile, user?.id]);

  if (decision.kind === 'loading') return <LogoSplash />;

  if (decision.kind === 'redirect') {
    return <Navigate to={decision.target} replace />;
  }

  if (decision.kind === 'missing-profile') {
    return (
      <AuthRouteDebugScreen
        title="Profile not found"
        description="Authenticated user exists but no matching profile row was found."
        payload={{ userId: user?.id ?? null, pathname: location.pathname }}
      />
    );
  }

  if (decision.kind === 'invalid-role') {
    return (
      <AuthRouteDebugScreen
        title="Invalid role"
        description="The authenticated profile has an unexpected role value."
        payload={{ userId: user?.id ?? null, pathname: location.pathname, profile }}
      />
    );
  }

  return (
    <AuthRouteDebugScreen
      title="Redirect guard error"
      description="The routing guard could not load the authenticated profile."
      payload={{ userId: user?.id ?? null, pathname: location.pathname, error: queryError }}
    />
  );
};

export default AppRedirectGuard;
