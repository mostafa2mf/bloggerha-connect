import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logEventSync } from '@/lib/eventLogger';
import LogoSplash from '@/components/shared/LogoSplash';
import AuthRouteDebugScreen from '@/components/shared/AuthRouteDebugScreen';

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

    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  const decision = useMemo(() => {
    if (loading || fetchingProfile) return { kind: 'loading' as const };
    if (!user) return { kind: 'redirect' as const, target: '/', reason: 'unauthenticated' };
    if (queryError) return { kind: 'error' as const, message: queryError };
    if (!profile) return { kind: 'missing-profile' as const };

    if (!['admin', 'blogger', 'business'].includes(profile.role ?? '')) {
      return { kind: 'invalid-role' as const };
    }

    if (!['pending', 'approved', 'rejected'].includes(profile.approval_status ?? '')) {
      return { kind: 'invalid-status' as const };
    }

    if (profile.role === 'admin') {
      return { kind: 'redirect' as const, target: '/admin-dashboard', reason: 'admin' };
    }

    if (profile.approval_status === 'pending') {
      return { kind: 'redirect' as const, target: '/pending-approval', reason: 'pending' };
    }

    if (profile.approval_status === 'rejected') {
      return { kind: 'redirect' as const, target: '/application-rejected', reason: 'rejected' };
    }

    return {
      kind: 'redirect' as const,
      target: profile.role === 'business' ? '/business-dashboard' : '/blogger-dashboard',
      reason: 'approved',
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
      if (decision.target === '/') {
        logEventSync({ action: 'redirect.to_landing', details: { ...payload, reason: decision.reason, source: 'AppRedirectGuard' } });
      } else if (decision.target === '/pending-approval') {
        logEventSync({ action: 'redirect.to_pending', details: { ...payload, source: 'AppRedirectGuard' } });
      } else if (decision.target === '/application-rejected') {
        logEventSync({ action: 'redirect.to_rejected', details: { ...payload, source: 'AppRedirectGuard' } });
      } else {
        logEventSync({ action: 'redirect.to_dashboard', details: { ...payload, source: 'AppRedirectGuard' } });
      }
      return;
    }

    if (decision.kind === 'error') {
      logEventSync({ action: 'redirect.error', details: { ...payload, error: decision.message, source: 'AppRedirectGuard' } });
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

  if (decision.kind === 'invalid-status') {
    return (
      <AuthRouteDebugScreen
        title="Invalid approval status"
        description="The authenticated profile has an unexpected approval status value."
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
