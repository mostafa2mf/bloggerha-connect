import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LogoSplash from './LogoSplash';

/**
 * If a user is already authenticated and lands on a public page
 * (landing, register/*), redirect them to their dashboard with a
 * brief logo splash. Once logged out, public pages are shown again.
 */
const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(false);

  const publicPaths = ['/', '/register/blogger', '/register/business'];
  const isPublic = publicPaths.includes(location.pathname);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!isPublic) return;
    // Wait for role to resolve briefly, then redirect
    setShowSplash(true);
    const timer = setTimeout(() => {
      const target = userRole === 'business' ? '/dashboard/business' : '/dashboard';
      navigate(target, { replace: true });
      // Hide splash slightly after navigation so the dashboard mounts under it
      setTimeout(() => setShowSplash(false), 200);
    }, 1200);
    return () => clearTimeout(timer);
  }, [user, userRole, loading, isPublic, location.pathname, navigate]);

  return (
    <>
      {children}
      {showSplash && <LogoSplash />}
    </>
  );
};

export default AuthGate;
