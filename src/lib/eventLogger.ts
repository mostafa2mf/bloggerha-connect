import { supabase } from '@/integrations/supabase/client';

export type AuthEventAction =
  | 'approval.detected'
  | 'approval.redirect'
  | 'rejection.detected'
  | 'rejection.signout'
  | 'redirect.to_landing'
  | 'redirect.to_dashboard'
  | 'route.404'
  | 'auth.signin'
  | 'auth.signout'
  | 'register.submit'
  | 'register.success'
  | 'register.failure'
  | 'check-registration.call'
  | 'check-registration.error';

interface LogEventOptions {
  action: AuthEventAction;
  details?: Record<string, unknown>;
  /** Persist to audit_logs (requires authenticated user). Default: true when user available. */
  persist?: boolean;
}

const fmt = (action: string, details?: Record<string, unknown>) =>
  `[event] ${action} ${details ? JSON.stringify(details) : ''}`.trim();

export async function logEvent({ action, details, persist }: LogEventOptions): Promise<void> {
  // Always log to client console for live debugging
  // eslint-disable-next-line no-console
  console.info(fmt(action, details));

  if (persist === false) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // RLS requires authenticated user_id

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action,
      details: {
        ...(details ?? {}),
        path: typeof window !== 'undefined' ? window.location.pathname : null,
        ts: new Date().toISOString(),
      },
    });
  } catch (err) {
    // Never let logging break the UX
    // eslint-disable-next-line no-console
    console.warn('[event] failed to persist', action, err);
  }
}

/** Sync (fire-and-forget) variant for places where awaiting is awkward. */
export function logEventSync(opts: LogEventOptions): void {
  void logEvent(opts);
}
