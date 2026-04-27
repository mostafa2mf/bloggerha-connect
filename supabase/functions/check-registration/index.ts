import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_URL = "https://iketcqfmrhdpgmbacxpy.supabase.co";
const ADMIN_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZXRjcWZtcmhkcGdtYmFjeHB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU2NzA3MiwiZXhwIjoyMDkxMTQzMDcyfQ.S8x01R0g8cfnukrviwf2AvFh6x3n7aS52qL5GobZDPE";

const logEvent = (action: string, details: Record<string, unknown> = {}) => {
  console.log(JSON.stringify({ fn: 'check-registration', action, ...details, ts: new Date().toISOString() }));
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const reqId = crypto.randomUUID();

  try {
    const { email } = await req.json();
    logEvent('request.received', { reqId, hasEmail: !!email });

    if (!email || typeof email !== "string") {
      logEvent('request.invalid', { reqId, reason: 'missing_email' });
      return new Response(
        JSON.stringify({ success: false, message: "Email required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const adminDb = createClient(ADMIN_URL, ADMIN_SERVICE_KEY);

    const normalizedEmail = email.trim().toLowerCase();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("user_id, username, display_name, full_name, brand_name, role, approval_status, instagram, followers_count, category, city, created_at")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      logEvent('lookup.error', { reqId, error: error.message });
      return new Response(
        JSON.stringify({ success: false, message: "Lookup failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile) {
      logEvent('lookup.not_found', { reqId, email: normalizedEmail });
      return new Response(
        JSON.stringify({ success: true, exists: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const entityType = profile.role === "business" ? "business" : "influencer";
    let resolvedStatus = profile.approval_status;
    let rejectReason: string | null = null;

    try {
      const { data: approval, error: approvalError } = await adminDb
        .from("approvals")
        .select("status, reject_reason")
        .eq("entity_type", entityType)
        .eq("entity_id", profile.user_id)
        .maybeSingle();

      if (approvalError) {
        logEvent('admin_sync.error', { reqId, error: approvalError.message });
      }

      if (!approvalError && approval) {
        const remoteStatus = approval.status || "pending";
        resolvedStatus = remoteStatus === "pending" && profile.approval_status === "approved"
          ? "approved"
          : remoteStatus;
        rejectReason = approval.reject_reason || null;

        if (resolvedStatus !== profile.approval_status) {
          logEvent('admin_sync.status_changed', {
            reqId,
            user_id: profile.user_id,
            role: profile.role,
            from: profile.approval_status,
            to: resolvedStatus,
            rejectReason,
          });
          await supabase
            .from("profiles")
            .update({ approval_status: resolvedStatus })
            .eq("user_id", profile.user_id);
        }
      }
    } catch (syncErr) {
      logEvent('admin_sync.exception', { reqId, error: String(syncErr) });
    }

    logEvent('response.ok', {
      reqId,
      user_id: profile.user_id,
      role: profile.role,
      status: resolvedStatus,
    });

    return new Response(
      JSON.stringify({
        success: true,
        exists: true,
        profile: {
          ...profile,
          approval_status: resolvedStatus,
          reject_reason: rejectReason,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    logEvent('exception', { reqId, error: String(err) });
    return new Response(
      JSON.stringify({ success: false, message: "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
