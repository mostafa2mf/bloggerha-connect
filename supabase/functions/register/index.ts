import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --- Persistent rate limiter (DB-backed, survives cold starts) ---
// 5 registrations per IP per 10 minutes
const RATE_LIMIT_WINDOW_MIN = 10;
const RATE_LIMIT_MAX = 5;

async function checkRateLimit(supabase: any, ip: string): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MIN * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("registration_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("created_at", since);
  return (count ?? 0) < RATE_LIMIT_MAX;
}

async function recordAttempt(supabase: any, ip: string, email: string) {
  await supabase.from("registration_attempts").insert({ ip_address: ip, email });
}

// --- Normalization helpers ---
function persianToEnglishDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function normalizePhone(raw: string): string {
  let p = raw.trim();
  p = p.replace(/[\s\-_()]/g, "");
  p = persianToEnglishDigits(p);
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
  s = s.replace(/^https?:\/\//i, "");
  s = s.replace(/^www\./i, "");
  s = s.replace(/^instagram\.com\//i, "");
  s = s.split(/[/?#]/)[0];
  if (!/^[A-Za-z0-9._]{1,30}$/.test(s)) return null;
  const reserved = ["p", "reel", "reels", "tv", "explore", "stories", "accounts", "direct"];
  if (reserved.includes(s.toLowerCase())) return null;
  return s.toLowerCase();
}

// --- Validation ---
interface FieldErrors {
  [field: string]: string[];
}

function validateCommon(body: any, errors: FieldErrors) {
  // full_name
  const name = typeof body.full_name === "string" ? collapseSpaces(body.full_name) : "";
  if (!name) {
    (errors.full_name ??= []).push("نام و نام خانوادگی الزامی است.");
  } else {
    if (name.length < 2) (errors.full_name ??= []).push("نام باید حداقل 2 کاراکتر باشد.");
    if (name.length > 60) (errors.full_name ??= []).push("نام نمی‌تواند بیشتر از 60 کاراکتر باشد.");
    if (!/^[\u0600-\u06FFa-zA-Z\s\u200B-\u200D\u0640'\-]+$/.test(name))
      (errors.full_name ??= []).push("نام فقط باید شامل حروف فارسی یا انگلیسی باشد.");
  }

  // email
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    (errors.email ??= []).push("ایمیل الزامی است.");
  } else {
    if (email.length > 254) (errors.email ??= []).push("ایمیل نمی‌تواند بیشتر از 254 کاراکتر باشد.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      (errors.email ??= []).push("فرمت ایمیل معتبر نیست.");
  }

  // phone
  const rawPhone = typeof body.phone === "string" ? body.phone : "";
  let phone = "";
  if (!rawPhone.trim()) {
    (errors.phone ??= []).push("شماره موبایل الزامی است.");
  } else {
    phone = normalizePhone(rawPhone);
    if (!/^\d+$/.test(phone)) {
      (errors.phone ??= []).push("شماره موبایل معتبر نیست.");
    } else if (!phone.startsWith("09")) {
      (errors.phone ??= []).push("شماره موبایل باید با 09 شروع شود.");
    } else if (phone.length !== 11) {
      (errors.phone ??= []).push("شماره موبایل باید دقیقاً 11 رقم باشد.");
    }
  }

  // password
  const password = typeof body.password === "string" ? body.password : "";
  if (!password) {
    (errors.password ??= []).push("رمز عبور الزامی است.");
  } else {
    if (password.length < 8) (errors.password ??= []).push("رمز عبور باید حداقل 8 کاراکتر باشد.");
    if (password.length > 72) (errors.password ??= []).push("رمز عبور نمی‌تواند بیشتر از 72 کاراکتر باشد.");
    const normalizedPw = persianToEnglishDigits(password);
    if (!/[A-Za-z]/.test(normalizedPw) || !/\d/.test(normalizedPw))
      (errors.password ??= []).push("رمز عبور باید شامل حداقل یک حرف و یک عدد باشد.");
  }

  // instagram_url - extract & normalize
  const igRaw = typeof body.instagram_url === "string" ? body.instagram_url : "";
  let instagramUsername = "";
  let instagramUrl = "";
  if (!igRaw.trim()) {
    (errors.instagram_url ??= []).push("لینک اینستاگرام الزامی است.");
  } else {
    const username = extractInstagramUsername(igRaw);
    if (!username) {
      (errors.instagram_url ??= []).push("لینک اینستاگرام معتبر نیست.");
    } else {
      instagramUsername = username;
      instagramUrl = `https://instagram.com/${username}`;
    }
  }

  // category
  const cat = typeof body.category === "string" ? collapseSpaces(body.category) : "";
  if (!cat) {
    (errors.category ??= []).push("دسته‌بندی الزامی است.");
  } else {
    if (cat.length < 2) (errors.category ??= []).push("دسته‌بندی باید حداقل 2 کاراکتر باشد.");
    if (cat.length > 50) (errors.category ??= []).push("دسته‌بندی نمی‌تواند بیشتر از 50 کاراکتر باشد.");
  }

  // city
  const city = typeof body.city === "string" ? collapseSpaces(body.city) : "";
  if (!city) {
    (errors.city ??= []).push("شهر الزامی است.");
  } else {
    if (city.length < 2) (errors.city ??= []).push("نام شهر باید حداقل 2 کاراکتر باشد.");
    if (city.length > 50) (errors.city ??= []).push("نام شهر نمی‌تواند بیشتر از 50 کاراکتر باشد.");
  }

  return { name, email, phone, password, instagram: instagramUrl, instagramUsername, category: cat, city };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Rate limiting per IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "تعداد درخواست‌های ثبت‌نام از این IP زیاد بوده است. لطفاً چند دقیقه دیگر دوباره تلاش کنید.",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const role = body.role; // 'blogger' | 'business'

    if (role !== "blogger" && role !== "business") {
      return new Response(
        JSON.stringify({ success: false, message: "اطلاعات ارسالی معتبر نیست.", errors: {} }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const errors: FieldErrors = {};
    const normalized = validateCommon(body, errors);

    // Blogger-specific: followers_count
    let followersCount = 0;
    if (role === "blogger") {
      const fc = body.followers_count;
      if (fc === undefined || fc === null || fc === "") {
        (errors.followers_count ??= []).push("تعداد فالوور الزامی است.");
      } else {
        const num = Number(persianToEnglishDigits(String(fc)));
        if (!Number.isInteger(num) || isNaN(num)) {
          (errors.followers_count ??= []).push("تعداد فالوور باید فقط عدد باشد.");
        } else if (num < 100000) {
          (errors.followers_count ??= []).push("حداقل تعداد فالوور برای ثبت‌نام بلاگر ۱۰۰٬۰۰۰ است.");
        } else if (num > 200000000) {
          (errors.followers_count ??= []).push("تعداد فالوور واردشده معتبر نیست.");
        } else {
          followersCount = num;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Validation failed.", errors }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Pre-check duplicates (phone & email) before creating auth user
    const { data: existingPhone } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("phone", normalized.phone)
      .maybeSingle();

    if (existingPhone) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Registration failed.",
          errors: { phone: ["با این شماره موبایل قبلاً حساب ساخته شده است."] },
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: existingEmail } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", normalized.email)
      .maybeSingle();

    if (existingEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Registration failed.",
          errors: { email: ["با این ایمیل قبلاً حساب ساخته شده است."] },
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user. email_confirm: true keeps the auto-login flow working
    // (real email verification can be enabled later by setting this to false).
    const approvalStatus = role === "blogger" ? "pending" : "approved";
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalized.email,
      password: normalized.password,
      email_confirm: true,
      user_metadata: {
        role,
        username: normalized.name,
      },
    });

    if (authError) {
      if (authError.message?.includes("already been registered") || authError.message?.includes("already exists")) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Registration failed.",
            errors: { email: ["با این ایمیل قبلاً حساب ساخته شده است."] },
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw authError;
    }

    const userId = authData.user!.id;

    // Update profile (created by trigger) with full registration data
    const profileUpdate: Record<string, any> = {
      phone: normalized.phone,
      email: normalized.email,
      instagram: normalized.instagram,
      category: normalized.category,
      city: normalized.city,
      display_name: normalized.name,
      username: normalized.name,
      role,
      approval_status: approvalStatus,
    };

    if (role === "blogger") {
      profileUpdate.followers_count = followersCount;
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update(profileUpdate)
      .eq("user_id", userId);

    if (profileError) {
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);

      // Unique violation on phone (race condition safety net)
      if (
        profileError.message?.includes("profiles_phone_unique") ||
        profileError.code === "23505"
      ) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Registration failed.",
            errors: { phone: ["با این شماره موبایل قبلاً حساب ساخته شده است."] },
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw profileError;
    }

    // Success response
    const message =
      role === "blogger"
        ? "ثبت‌نام بلاگر با موفقیت انجام شد و حساب شما در انتظار بررسی ادمین است."
        : "ثبت‌نام کسب‌وکار با موفقیت انجام شد.";

    const responseData: any = {
      role,
      status: approvalStatus === "pending" ? "pending_review" : "active",
      instagram_username: normalized.instagramUsername,
    };
    if (role === "blogger") responseData.review_status = "pending";

    return new Response(
      JSON.stringify({ success: true, message, data: responseData }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Registration error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: "خطایی در پردازش درخواست رخ داد. لطفاً دوباره تلاش کنید.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
