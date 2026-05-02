import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface RedirectLog {
  timestamp: string;
  userId: string | null;
  pathname: string;
  role: string | null;
  approval_status: string | null;
  finalTarget: string | null;
}

const DebugRedirectHealth = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [logs, setLogs] = useState<RedirectLog[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('role, approval_status')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  useEffect(() => {
    if (loading) return;
    const role = profile?.role ?? null;
    const status = profile?.approval_status ?? null;

    let target: string | null = null;
    if (!user) target = '/';
    else if (role === 'admin') target = '/admin-dashboard';
    else if (status === 'pending') target = '/pending-approval';
    else if (status === 'rejected') target = '/application-rejected';
    else if (role === 'blogger') target = '/blogger-dashboard';
    else if (role === 'business') target = '/business-dashboard';

    const entry: RedirectLog = {
      timestamp: new Date().toISOString(),
      userId: user?.id ?? null,
      pathname: location.pathname,
      role,
      approval_status: status,
      finalTarget: target,
    };

    console.info('[DebugRedirectHealth]', entry);
    setLogs(prev => [entry, ...prev].slice(0, 50));
  }, [loading, user, profile, location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 font-mono text-xs">
      <h1 className="text-lg font-bold mb-4">🔍 Redirect Health Debug</h1>
      <div className="glass rounded-xl p-4 mb-6 space-y-1">
        <p><strong>Auth loading:</strong> {String(loading)}</p>
        <p><strong>User ID:</strong> {user?.id ?? 'null'}</p>
        <p><strong>Current path:</strong> {location.pathname}</p>
        <p><strong>Role:</strong> {profile?.role ?? 'null'}</p>
        <p><strong>Approval status:</strong> {profile?.approval_status ?? 'null'}</p>
      </div>
      <h2 className="text-sm font-semibold mb-2">Recent evaluations</h2>
      <div className="space-y-2">
        {logs.map((log, i) => (
          <div key={i} className="glass rounded-lg p-3 space-y-0.5">
            <p className="text-muted-foreground">{log.timestamp}</p>
            <p>user={log.userId ?? '—'} path={log.pathname} role={log.role ?? '—'} status={log.approval_status ?? '—'}</p>
            <p className="text-primary font-semibold">→ {log.finalTarget ?? 'unknown'}</p>
          </div>
        ))}
        {logs.length === 0 && <p className="text-muted-foreground">No evaluations yet.</p>}
      </div>
    </div>
  );
};

export default DebugRedirectHealth;
