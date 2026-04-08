import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin Supabase credentials
const ADMIN_URL = "https://iketcqfmrhdpgmbacxpy.supabase.co";
const ADMIN_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZXRjcWZtcmhkcGdtYmFjeHB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU2NzA3MiwiZXhwIjoyMDkxMTQzMDcyfQ.S8x01R0g8cfnukrviwf2AvFh6x3n7aS52qL5GobZDPE";

const adminDb = createClient(ADMIN_URL, ADMIN_SERVICE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();

    switch (action) {
      // ── Sync a new campaign to admin DB ──
      case "sync_campaign": {
        const { error } = await adminDb.from("campaigns").upsert({
          id: data.id,
          title: data.title,
          business_id: data.business_id,
          city: data.city || null,
          budget: data.budget || null,
          description: data.description || null,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          status: "pending",
          category_id: data.category_id || null,
        }, { onConflict: "id" });

        if (error) throw error;

        // Also create an approval record
        await adminDb.from("approvals").upsert({
          entity_type: "campaign",
          entity_id: data.id,
          status: "pending",
        }, { onConflict: "entity_id" }).catch(() => {});

        // Log activity
        await adminDb.from("activity_log").insert({
          type: "campaign_submitted",
          message: `New campaign "${data.title}" submitted for review`,
          message_fa: `کمپین جدید "${data.title}" برای بررسی ارسال شد`,
          icon: "megaphone",
          entity_type: "campaign",
          entity_id: data.id,
        }).catch(() => {});

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Sync blogger profile as influencer ──
      case "sync_influencer": {
        const { error } = await adminDb.from("influencers").upsert({
          id: data.user_id,
          name: data.display_name || data.username,
          handle: data.instagram || `@${data.username}`,
          avatar_url: data.avatar_url || null,
          followers: data.followers_count || 0,
          engagement: data.engagement_rate || 0,
          city: data.city || null,
          bio: data.bio || null,
          status: "pending",
          verified: false,
          category_id: data.category_id || null,
        }, { onConflict: "id" });

        if (error) throw error;

        // Approval record
        await adminDb.from("approvals").upsert({
          entity_type: "influencer",
          entity_id: data.user_id,
          status: "pending",
        }, { onConflict: "entity_id" }).catch(() => {});

        await adminDb.from("activity_log").insert({
          type: "influencer_registered",
          message: `New influencer "${data.display_name || data.username}" registered`,
          message_fa: `اینفلوئنسر جدید "${data.display_name || data.username}" ثبت‌نام کرد`,
          icon: "user",
          entity_type: "influencer",
          entity_id: data.user_id,
        }).catch(() => {});

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Sync business profile ──
      case "sync_business": {
        const { error } = await adminDb.from("businesses").upsert({
          id: data.user_id,
          name: data.display_name || data.username,
          logo_url: data.avatar_url || null,
          city: data.city || null,
          email: data.email || null,
          description: data.bio || null,
          status: "pending",
          verified: false,
          category_id: data.category_id || null,
        }, { onConflict: "id" });

        if (error) throw error;

        await adminDb.from("approvals").upsert({
          entity_type: "business",
          entity_id: data.user_id,
          status: "pending",
        }, { onConflict: "entity_id" }).catch(() => {});

        await adminDb.from("activity_log").insert({
          type: "business_registered",
          message: `New business "${data.display_name || data.username}" registered`,
          message_fa: `کسب‌وکار جدید "${data.display_name || data.username}" ثبت‌نام کرد`,
          icon: "building",
          entity_type: "business",
          entity_id: data.user_id,
        }).catch(() => {});

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Sync application (blogger applies to campaign) ──
      case "sync_application": {
        const { error } = await adminDb.from("campaign_influencers").upsert({
          id: data.id,
          campaign_id: data.campaign_id,
          influencer_id: data.blogger_id,
        }, { onConflict: "id" });

        if (error) throw error;

        await adminDb.from("activity_log").insert({
          type: "application_received",
          message: `New application received for campaign`,
          message_fa: `درخواست جدید برای کمپین دریافت شد`,
          icon: "inbox",
          entity_type: "campaign",
          entity_id: data.campaign_id,
        }).catch(() => {});

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Check approval status from admin ──
      case "check_approval": {
        const { data: approval, error } = await adminDb
          .from("approvals")
          .select("status, reject_reason, reviewed_at")
          .eq("entity_type", data.entity_type)
          .eq("entity_id", data.entity_id)
          .maybeSingle();

        if (error) throw error;

        return new Response(JSON.stringify({ approval: approval || { status: "pending" } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Get categories from admin ──
      case "get_categories": {
        const { data: categories, error } = await adminDb
          .from("categories")
          .select("*")
          .order("name_fa");

        if (error) throw error;

        return new Response(JSON.stringify({ categories }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    console.error("Admin sync error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
