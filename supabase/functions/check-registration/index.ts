import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_URL = "https://iketcqfmrhdpgmbacxpy.supabase.co";
const ADMIN_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZXRjcWZtcmhkcGdtYmFjeHB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU2NzA3MiwiZXhwIjoyMDkxMTQzMDcyfQ.S8x01R0g8cfnukrviwf2AvFh6x3n7aS52qL5GobZDPE";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
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
      console.error("Lookup error:", error);
      return new Response(
        JSON.stringify({ success: false, message: "Lookup failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile) {
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

      if (!approvalError && approval) {
        const remoteStatus = approval.status || "pending";
        resolvedStatus = remoteStatus === "pending" && profile.approval_status === "approved"
          ? "approved"
          : remoteStatus;
        rejectReason = approval.reject_reason || null;

        if (resolvedStatus !== profile.approval_status) {
          await supabase
            .from("profiles")
            .update({ approval_status: resolvedStatus })
            .eq("user_id", profile.user_id);
        }
      }
    } catch (syncErr) {
      console.error("Approval sync check failed:", syncErr);
    }

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
    console.error("check-registration error:", err);
    return new Response(
      JSON.stringify({ success: false, message: "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
