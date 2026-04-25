import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT_WINDOW_MIN = 10;
const RATE_LIMIT_MAX = 5;

// Admin DB (external) for cross-project sync
const ADMIN_URL = "https://iketcqfmrhdpgmbacxpy.supabase.co";
const ADMIN_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZXRjcWZtcmhkcGdtYmFjeHB5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU2NzA3MiwiZXhwIjoyMDkxMTQzMDcyfQ.S8x01R0g8cfnukrviwf2AvFh6x3n7aS52qL5GobZDPE";

async function checkRateLimit(supabase: any, ip: string): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MIN * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("registration_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("created_at", since);
  if (error) {
    console.error("Rate limit check error:", error);
    return true;
  }
  return (count ?? 0) < RATE_LIMIT_MAX;
}

async function recordAttempt(supabase: any, ip: string, email: string) {
  const { error } = await supabase.from("registration_attempts").insert({ ip_address: ip, email });
  if (error) console.error("Record attempt error:", error);
}

function normalizePhone(raw: string): string {
  let p = raw.trim().replace(/[\s\-_()]/g, "");
  if (p.startsWith("+98")) p = "0" + p.slice(3);
  else if (p.startsWith("98") && p.length === 12) p = "0" + p.slice(2);
  return p;
}

function collapseSpaces(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

function extractInstagramUsername(raw: string): string | null {
  if (!raw) return null;
  let s = raw.trim().replace(/\s+/g, "");
  if (s.startsWith("@")) s = s.slice(1);
  s = s.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/^instagram\.com\//i, "");
  s = s.split(/[/?#]/)[0];
  if (!/^[A-Za-z0-9._]{1,30}$/.test(s)) return null;
  const reserved = ["p", "reel", "reels", "tv", "explore", "stories", "accounts", "direct"];
  if (reserved.includes(s.toLowerCase())) return null;
  return s.toLowerCase();
}

function generateSystemPassword(length = 20): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  let out = "";
  for (let i = 0; i < length; i++) out += chars[array[i] % chars.length];
  if (!/[A-Za-z]/.test(out)) out += "A";
  if (!/\d/.test(out)) out += "2";
  if (!/[!@#$%^&*]/.test(out)) out += "!";
  return out;
}

// Build a safe ASCII-ish unique username from email + ig handle
async function buildUniqueUsername(supabase: any, email: string, igUsername: string): Promise<string> {
  const base = (igUsername || email.split("@")[0] || "user")
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, 24) || "user";
  let candidate = base;
  let suffix = 0;
  // try up to 50 times with random suffix fallback
  while (true) {
    const { data } = await supabase.from("profiles").select("id").eq("username", candidate).maybeSingle();
    if (!data) return candidate;
    suffix++;
    if (suffix > 8) {
      candidate = `${base}${Math.floor(Math.random() * 100000)}`;
    } else {
      candidate = `${base}${suffix}`;
    }
  }
}

interface FieldErrors { [field: string]: string[]; }

const FOLLOWER_VALUE_TO_NUMBER: Record<string, number> = {
  "100k-500k": 100000,
  "500k+": 500000,
};
const ALLOWED_GENDERS = ["male", "female"] as const;

function validateCommon(body: any, errors: FieldErrors) {
  const fullName = typeof body.full_name === "string" ? collapseSpaces(body.full_name) : "";
  if (!fullName) (errors.full_name ??= []).push("نام و نام خانوادگی الزامی است.");
  else {
    if (fullName.length < 2) (errors.full_name ??= []).push("نام و نام خانوادگی باید حداقل 2 کاراکتر باشد.");
    if (fullName.length > 60) (errors.full_name ??= []).push("نام و نام خانوادگی نمی‌تواند بیشتر از 60 کاراکتر باشد.");
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) (errors.email ??= []).push("ایمیل الزامی است.");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) (errors.email ??= []).push("فرمت ایمیل معتبر نیست.");

  const rawPhone = typeof body.phone === "string" ? body.phone : "";
  let phone = "";
  if (!rawPhone.trim()) (errors.phone ??= []).push("شماره موبایل الزامی است.");
  else {
    phone = normalizePhone(rawPhone);
    if (!/^\d+$/.test(phone)) (errors.phone ??= []).push("شماره موبایل معتبر نیست.");
    else if (!phone.startsWith("09")) (errors.phone ??= []).push("شماره موبایل باید با 09 شروع شود.");
    else if (phone.length !== 11) (errors.phone ??= []).push("شماره موبایل باید دقیقاً 11 رقم باشد.");
  }

  const igRaw = typeof body.instagram_url === "string" ? body.instagram_url : "";
  let instagramUsername = "";
  let instagramUrl = "";
  if (!igRaw.trim()) (errors.instagram_url ??= []).push("آدرس اینستاگرام الزامی است.");
  else {
    const username = extractInstagramUsername(igRaw);
    if (!username) (errors.instagram_url ??= []).push("آیدی یا لینک اینستاگرام معتبر نیست.");
    else { instagramUsername = username; instagramUrl = `https://instagram.com/${username}`; }
  }

  const cat = typeof body.category === "string" ? collapseSpaces(body.category) : "";
  if (!cat) (errors.category ??= []).push("دسته‌بندی الزامی است.");

  const city = typeof body.city === "string" ? collapseSpaces(body.city) : "";
  if (!city) (errors.city ??= []).push("شهر الزامی است.");

  return { fullName, email, phone, instagram: instagramUrl, instagramUsername, category: cat, city };
}

function validateBlogger(body: any, errors: FieldErrors) {
  const gender = typeof body.gender === "string" ? body.gender.trim() : "";
  if (!gender) (errors.gender ??= []).push("جنسیت الزامی است.");
  else if (!ALLOWED_GENDERS.includes(gender as (typeof ALLOWED_GENDERS)[number]))
    (errors.gender ??= []).push("جنسیت انتخاب‌شده معتبر نیست.");

  const followersKey = typeof body.followers_count === "string" ? body.followers_count.trim() : "";
  if (!followersKey) {
    (errors.followers_count ??= []).push("بازه تعداد فالوور الزامی است.");
    return { gender, followersCountNumber: 0 };
  }
  const followersCountNumber = FOLLOWER_VALUE_TO_NUMBER[followersKey];
  if (!followersCountNumber) {
    (errors.followers_count ??= []).push("تعداد فالوورها مجاز نیست.");
    return { gender, followersCountNumber: 0 };
  }
  return { gender, followersCountNumber };
}

function validateBusiness(body: any, errors: FieldErrors) {
  const brandName = typeof body.brand_name === "string" ? collapseSpaces(body.brand_name) : "";
  if (!brandName) (errors.brand_name ??= []).push("نام برند الزامی است.");
  else if (brandName.length < 2) (errors.brand_name ??= []).push("نام برند باید حداقل 2 کاراکتر باشد.");
  return { brandName };
}

// Sync to admin DB - never throws (registration must succeed even if sync fails)
async function syncToAdmin(role: string, profileData: Record<string, any>) {
  try {
    const adminDb = createClient(ADMIN_URL, ADMIN_SERVICE_KEY);
    if (role === "blogger") {
      await adminDb.from("influencers").upsert({
        id: profileData.user_id,
        name: profileData.display_name || profileData.username,
        handle: `@${profileData.instagram_username || profileData.username}`,
        followers: profileData.followers_count || 0,
        engagement: 0,
        city: profileData.city || null,
        bio: null,
        status: "pending",
        verified: false,
      }, { onConflict: "id" });

      await adminDb.from("approvals").insert({
        entity_type: "influencer",
        entity_id: profileData.user_id,
        status: "pending",
      });

      await adminDb.from("activity_log").insert({
        type: "influencer_registered",
        message: `New influencer "${profileData.display_name}" registered`,
        message_fa: `اینفلوئنسر جدید "${profileData.display_name}" ثبت‌نام کرد`,
        icon: "user",
        entity_type: "influencer",
        entity_id: profileData.user_id,
      });
    } else if (role === "business") {
      await adminDb.from("businesses").upsert({
        id: profileData.user_id,
        name: profileData.brand_name || profileData.display_name,
        city: profileData.city || null,
        email: profileData.email || null,
        description: null,
        status: "pending",
        verified: false,
      }, { onConflict: "id" });

      await adminDb.from("approvals").insert({
        entity_type: "business",
        entity_id: profileData.user_id,
        status: "pending",
      }).catch(() => {});

      await adminDb.from("activity_log").insert({
        type: "business_registered",
        message: `New business "${profileData.brand_name}" registered`,
        message_fa: `کسب‌وکار جدید "${profileData.brand_name}" ثبت‌نام کرد`,
        icon: "building",
        entity_type: "business",
        entity_id: profileData.user_id,
      });
    }
  } catch (err) {
    console.error("Admin sync failed (non-fatal):", err);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "unknown";
    const body = await req.json();
    const role = body.role;

    if (role !== "blogger" && role !== "business") {
      return new Response(JSON.stringify({ success: false, message: "اطلاعات ارسالی معتبر نیست.", errors: {} }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const errors: FieldErrors = {};
    const common = validateCommon(body, errors);
    let bloggerData: { gender: string; followersCountNumber: number } | null = null;
    let businessData: { brandName: string } | null = null;

    if (role === "blogger") bloggerData = validateBlogger(body, errors);
    if (role === "business") businessData = validateBusiness(body, errors);

    if (Object.keys(errors).length > 0) {
      return new Response(JSON.stringify({ success: false, message: "لطفاً فیلدهای فرم را درست تکمیل کنید.", errors }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (!(await checkRateLimit(supabaseAdmin, ip))) {
      return new Response(JSON.stringify({ success: false, message: "تعداد درخواست‌های ثبت‌نام از این IP زیاد بوده است. لطفاً چند دقیقه دیگر دوباره تلاش کنید." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await recordAttempt(supabaseAdmin, ip, common.email);

    // Pre-check duplicates (phone, email)
    const { data: existingPhone } = await supabaseAdmin.from("profiles").select("id").eq("phone", common.phone).maybeSingle();
    if (existingPhone) {
      return new Response(JSON.stringify({ success: false, message: "ثبت‌نام انجام نشد.", errors: { phone: ["با این شماره موبایل قبلاً حساب ساخته شده است."] } }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: existingEmail } = await supabaseAdmin.from("profiles").select("id").eq("email", common.email).maybeSingle();
    if (existingEmail) {
      return new Response(JSON.stringify({ success: false, message: "ثبت‌نام انجام نشد.", errors: { email: ["با این ایمیل قبلاً حساب ساخته شده است."] } }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const approvalStatus = "pending";
    const systemPassword = generateSystemPassword();

    // Build a safe unique username (ASCII) BEFORE creating user, so handle_new_user trigger uses it
    const uniqueUsername = await buildUniqueUsername(supabaseAdmin, common.email, common.instagramUsername);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: common.email,
      password: systemPassword,
      email_confirm: true,
      user_metadata: {
        role,
        username: uniqueUsername,
        full_name: common.fullName,
        display_name: common.fullName,
        ...(role === "business" && businessData ? { brand_name: businessData.brandName } : {}),
      },
    });

    if (authError) {
      if (authError.message?.includes("already been registered") || authError.message?.includes("already exists")) {
        return new Response(JSON.stringify({ success: false, message: "ثبت‌نام انجام نشد.", errors: { email: ["با این ایمیل قبلاً حساب ساخته شده است."] } }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw authError;
    }

    const userId = authData.user!.id;

    // Update profile with all extra fields. handle_new_user trigger already inserted base row.
    const profileUpdate: Record<string, any> = {
      phone: common.phone,
      email: common.email,
      instagram: common.instagram,
      category: common.category,
      city: common.city,
      display_name: common.fullName,
      full_name: common.fullName,
      role,
      approval_status: approvalStatus,
    };

    if (role === "blogger" && bloggerData) {
      profileUpdate.gender = bloggerData.gender;
      profileUpdate.followers_count = bloggerData.followersCountNumber;
    }
    if (role === "business" && businessData) {
      profileUpdate.brand_name = businessData.brandName;
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").update(profileUpdate).eq("user_id", userId);

    if (profileError) {
      console.error("Profile update error:", profileError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw profileError;
    }

    await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

    // Sync to admin dashboard (non-fatal)
    await syncToAdmin(role, {
      user_id: userId,
      display_name: common.fullName,
      username: uniqueUsername,
      instagram_username: common.instagramUsername,
      followers_count: bloggerData?.followersCountNumber || 0,
      city: common.city,
      email: common.email,
      brand_name: businessData?.brandName,
    });

    // Send password recovery email so the user can set their own password and log in
    let recoveryEmailSent = false;
    try {
      await supabaseAdmin.auth.resetPasswordForEmail(common.email, {
        redirectTo: `${req.headers.get("origin") || ""}/reset-password`,
      });
      recoveryEmailSent = true;
    } catch (e) {
      console.error("Recovery email failed (non-fatal):", e);
    }

    const message = role === "blogger"
      ? "ثبت‌نام با موفقیت انجام شد. لینک تنظیم رمز عبور به ایمیل شما ارسال شد. حساب شما در انتظار بررسی ادمین است."
      : "ثبت‌نام کسب‌وکار با موفقیت انجام شد. لینک تنظیم رمز عبور به ایمیل شما ارسال شد. حساب شما در انتظار بررسی ادمین است.";

    return new Response(JSON.stringify({
      success: true,
      message,
      data: {
        role,
        status: approvalStatus === "pending" ? "pending_review" : "active",
        instagram_username: common.instagramUsername,
        recovery_email_sent: recoveryEmailSent,
      },
    }), { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Registration error:", err);
    return new Response(JSON.stringify({ success: false, message: "خطایی در پردازش درخواست رخ داد. لطفاً دوباره تلاش کنید." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
