import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Loader2, Search, Filter, ShieldAlert, RefreshCw } from 'lucide-react';

interface AuditLogRow {
  id: string;
  user_id: string;
  action: string;
  details: Record<string, any> | null;
  created_at: string;
  ip_address: string | null;
  // joined
  email?: string | null;
  role?: string | null;
}

const APPROVAL_ACTIONS = [
  'approval.detected',
  'approval.redirect',
  'rejection.detected',
  'rejection.signout',
  'rejection.reason_shown',
  'redirect.to_dashboard',
  'redirect.to_landing',
];

const AdminAuditLogs = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [rows, setRows] = useState<AuditLogRow[]>([]);

  // Filters
  const [emailFilter, setEmailFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'blogger' | 'business' | 'admin'>('all');
  const [reqIdFilter, setReqIdFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [actionFilter, setActionFilter] = useState<'approval' | 'all'>('approval');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/', { replace: true });
      return;
    }
    if (userRole !== 'admin') {
      setForbidden(true);
      setLoading(false);
    }
  }, [user, userRole, authLoading, navigate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('id, user_id, action, details, created_at, ip_address')
        .order('created_at', { ascending: false })
        .limit(500);

      if (actionFilter === 'approval') {
        query = query.in('action', APPROVAL_ACTIONS);
      }
      if (fromDate) query = query.gte('created_at', new Date(fromDate).toISOString());
      if (toDate) {
        const end = new Date(toDate);
        end.setDate(end.getDate() + 1);
        query = query.lt('created_at', end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Hydrate user emails/roles
      const userIds = Array.from(new Set((data ?? []).map((r) => r.user_id)));
      let profileMap = new Map<string, { email: string | null; role: string | null }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email, role')
          .in('user_id', userIds);
        profileMap = new Map(
          (profiles ?? []).map((p) => [p.user_id, { email: p.email ?? null, role: p.role ?? null }])
        );
      }

      const enriched: AuditLogRow[] = (data ?? []).map((r) => ({
        ...(r as any),
        email: profileMap.get(r.user_id)?.email ?? null,
        role: profileMap.get(r.user_id)?.role ?? null,
      }));

      setRows(enriched);
    } catch (err) {
      console.error('Failed to load audit logs', err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole !== 'admin') return;
    void fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, actionFilter, fromDate, toDate]);

  const filtered = useMemo(() => {
    const email = emailFilter.trim().toLowerCase();
    const reqId = reqIdFilter.trim().toLowerCase();
    return rows.filter((r) => {
      if (email && !(r.email ?? '').toLowerCase().includes(email)) return false;
      if (roleFilter !== 'all' && r.role !== roleFilter) return false;
      if (reqId) {
        const inDetails = JSON.stringify(r.details ?? {}).toLowerCase().includes(reqId);
        if (!inDetails) return false;
      }
      return true;
    });
  }, [rows, emailFilter, roleFilter, reqIdFilter]);

  if (authLoading || (loading && !forbidden)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <>
        <Header />
        <div className="pt-24 px-6 max-w-2xl mx-auto text-center space-y-4">
          <ShieldAlert size={48} className="mx-auto text-destructive" />
          <h1 className="text-2xl font-bold">Admins only</h1>
          <p className="text-sm text-muted-foreground">
            You don't have permission to view audit logs.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="pt-20 px-4 md:px-6 pb-10 max-w-6xl mx-auto" dir="ltr">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Audit Logs</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Approve / reject events & redirect traces from users.
            </p>
          </div>
          <button
            onClick={() => void fetchLogs()}
            className="glass rounded-xl px-3 py-2 text-sm flex items-center gap-2 hover:bg-primary/10"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-4 mb-4 grid grid-cols-1 md:grid-cols-6 gap-3 text-sm">
          <div className="md:col-span-2 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              placeholder="Filter by email"
              className="w-full h-10 bg-background/60 border border-border rounded-xl pl-9 pr-3 text-xs"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="h-10 bg-background/60 border border-border rounded-xl px-3 text-xs"
          >
            <option value="all">All roles</option>
            <option value="blogger">Blogger</option>
            <option value="business">Business</option>
            <option value="admin">Admin</option>
          </select>

          <input
            value={reqIdFilter}
            onChange={(e) => setReqIdFilter(e.target.value)}
            placeholder="reqId / detail substring"
            className="h-10 bg-background/60 border border-border rounded-xl px-3 text-xs"
          />

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-10 bg-background/60 border border-border rounded-xl px-3 text-xs"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-10 bg-background/60 border border-border rounded-xl px-3 text-xs"
          />

          <div className="md:col-span-6 flex items-center gap-3 text-xs text-muted-foreground">
            <Filter size={12} />
            <button
              onClick={() => setActionFilter('approval')}
              className={`px-3 py-1 rounded-full border ${
                actionFilter === 'approval'
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border'
              }`}
            >
              Approve / Reject only
            </button>
            <button
              onClick={() => setActionFilter('all')}
              className={`px-3 py-1 rounded-full border ${
                actionFilter === 'all'
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border'
              }`}
            >
              All actions
            </button>
            <span className="ml-auto">{filtered.length} of {rows.length} rows</span>
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No matching audit logs.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-background/40 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Time</th>
                    <th className="px-3 py-2 text-left">Action</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Role</th>
                    <th className="px-3 py-2 text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t border-border/40 hover:bg-background/30 align-top">
                      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full font-medium ${
                            r.action.startsWith('rejection')
                              ? 'bg-destructive/15 text-destructive'
                              : r.action.startsWith('approval')
                              ? 'bg-green-500/15 text-green-500'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {r.action}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{r.email ?? '—'}</td>
                      <td className="px-3 py-2">{r.role ?? '—'}</td>
                      <td className="px-3 py-2">
                        <pre className="whitespace-pre-wrap break-all text-[10px] text-muted-foreground max-w-xl">
                          {JSON.stringify(r.details ?? {}, null, 0)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminAuditLogs;
