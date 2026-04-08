import { supabase } from "@/integrations/supabase/client";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-sync`;

async function callAdminSync(action: string, data: Record<string, any>) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const res = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ action, data }),
    });

    const result = await res.json();
    if (!res.ok) {
      console.error("Admin sync error:", result);
      return { success: false, error: result.error };
    }
    return { success: true, ...result };
  } catch (err: any) {
    console.error("Admin sync network error:", err);
    return { success: false, error: err.message };
  }
}

/** Sync a campaign to admin dashboard */
export const syncCampaign = (campaign: Record<string, any>) =>
  callAdminSync("sync_campaign", campaign);

/** Sync blogger profile as influencer */
export const syncInfluencer = (profile: Record<string, any>) =>
  callAdminSync("sync_influencer", profile);

/** Sync business profile */
export const syncBusiness = (profile: Record<string, any>) =>
  callAdminSync("sync_business", profile);

/** Sync application */
export const syncApplication = (application: Record<string, any>) =>
  callAdminSync("sync_application", application);

/** Check approval status */
export const checkApproval = (entityType: string, entityId: string) =>
  callAdminSync("check_approval", { entity_type: entityType, entity_id: entityId });

/** Get categories from admin */
export const getAdminCategories = () =>
  callAdminSync("get_categories", {});
