import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// -----------------------------
// Rate limiter
// -----------------------------
const RATE_LIMIT_WINDOW_MIN = 10;
const RATE_LIMIT_MAX = 5;

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
  const { error } = await supabase.from("registration_attempts").insert({
    ip_address: ip,
    email,
  });

  if (error) {
    console.error("Record attempt error:", error);
  }
}

// -----------------------------
// Helpers
// -----------------------------
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

function generateSystemPassword(length = 20): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[array[i] % chars.length];
  }

  if (!/[A-Za-z]/.test(out)) out += "A";
  if (!/\d/.test(out)) out += "2";
  if (!/[!@#$%^&*]/.test(out)) out += "!";

  return out;
}

// -----------------------------
// Validation
// -----------------------------
interface FieldErrors {
  [field: string]: string[];
}

const ALLOWED_BLOGGER_FOLLOWER_OPTIONS = ["10000-50000", "50000-100000", "100000-500000", "500000+"] as const;

const ALLOWED_GENDERS = ["male", "female"] as const;

function validateCommon(body: any, errors: FieldErrors) {
  const fullName = typeof body.full_name === "string" ? collapseSpaces(body.full_name) : "";
  if (!fullName) {
    (errors.full_name ??= []).push("نام و نام خانوادگی الزامی است.");
  } else {
    if (fullName.length < 2) {
      (errors.full_name ??= []).push("نام و نام خانوادگی باید حداقل 2 کاراکتر باشد.");
    }
    if (fullName.length > 60) {
      (errors.full_name ??= []).push("نام و نام خانوادگی نمی‌تواند بیشتر از 60 کاراکتر باشد.");
    }
    if (!/^[\u0600-\u06FFa-zA-Z\s\u200B-\u200D\u0640'\-]+$/.test(fullName)) {
      (errors.full_name ??= []).push("نام فقط باید شامل حروف فارسی یا انگلیسی باشد.");
    }
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    (errors.email ??= []).push("ایمیل الزامی است.");
  } else {
    if (email.length > 254) {
      (errors.email ??= []).push("ایمیل نمی‌تواند بیشتر از 254 کاراکتر باشد.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      (errors.email ??= []).push("فرمت ایمیل معتبر نیست.");
    }
  }

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

  const igRaw = typeof body.instagram_url === "string" ? body.instagram_url : "";
  let instagramUsername = "";
  let instagramUrl = "";

  if (!igRaw.trim()) {
    (errors.instagram_url ??= []).push("آدرس اینستاگرام الزامی است.");
  } else {
    const username = extractInstagramUsername(igRaw);
    if (!username) {
      (errors.instagram_url ??= []).push("آیدی یا لینک اینستاگرام معتبر نیست.");
    } else {
      instagramUsername = username;
      instagramUrl = `https://instagram.com/${username}`;
    }
  }

  const cat = typeof body.category === "string" ? collapseSpaces(body.category) : "";
  if (!cat) {
    (errors.category ??= []).push("دسته‌بندی الزامی است.");
  } else {
    if (cat.length < 2) {
      (errors.category ??= []).push("دسته‌بندی باید حداقل 2 کاراکتر باشد.");
    }
    if (cat.length > 50) {
      (errors.category ??= []).push("دسته‌بندی نمی‌تواند بیشتر از 50 کاراکتر باشد.");
    }
  }

  const city = typeof body.city === "string" ? collapseSpaces(body.city) : "";
  if (!city) {
    (errors.city ??= []).push("شهر الزامی است.");
  } else {
    if (city.length < 2) {
      (errors.city ??= []).push("نام شهر باید حداقل 2 کاراکتر باشد.");
    }
    if (city.length > 50) {
      (errors.city ??= []).push("نام شهر نمی‌تواند بیشتر از 50 کاراکتر باشد.");
    }
  }

  return {
    fullName,
    email,
    phone,
    instagram: instagramUrl,
    instagramUsername,
    category: cat,
    city,
  };
}

function validateBlogger(body: any, errors: FieldErrors) {
  const gender = typeof body.gender === "string" ? body.gender.trim() : "";

  if (!gender) {
    (errors.gender ??= []).push("جنسیت الزامی است.");
  } else if (!ALLOWED_GENDERS.includes(gender as (typeof ALLOWED_GENDERS)[number])) {
    (errors.gender ??= []).push("جنسیت انتخاب‌شده معتبر نیست.");
  }

  const followersCount = typeof body.followers_count === "string" ? body.followers_count.trim() : "";

  if (!followersCount) {
    (errors.followers_count ??= []).push("بازه تعداد فالوور الزامی است.");
  } else if (
    !ALLOWED_BLOGGER_FOLLOWER_OPTIONS.includes(followersCount as (typeof ALLOWED_BLOGGER_FOLLOWER_OPTIONS)[number])
  ) {
    (errors.followers_count ??= []).push("بازه تعداد فالوور معتبر نیست.");
  }

  return {
    gender,
    followersCount,
  };
}

function validateBusiness(body: any, errors: FieldErrors) {
  const brandName = typeof body.brand_name === "string" ? collapseSpaces(body.brand_name) : "";

  if (!brandName) {
    (errors.brand_name ??= []).push("نام برند الزامی است.");
  } else {
    if (brandName.length < 2) {
      (errors.brand_name ??= []).push("نام برند باید حداقل 2 کاراکتر باشد.");
    }
    if (brandName.length > 80) {
      (errors.brand_name ??= []).push("نام برند نمی‌تواند بیشتر از 80 کاراکتر باشد.");
    }
  }

  return { brandName };
}

// -----------------------------
// Handler
// -----------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "unknown";

    const body = await req.json();
    const role = body.role;

    if (role !== "blogger" && role !== "business") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "اطلاعات ارسالی معتبر نیست.",
          errors: {},
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const errors: FieldErrors = {};
    const common = validateCommon(body, errors);

    let bloggerData: { gender: string; followersCount: string } | null = null;
    let businessData: { brandName: string } | null = null;

    if (role === "blogger") {
      bloggerData = validateBlogger(body, errors);
    }

    if (role === "business") {
      businessData = validateBusiness(body, errors);
    }

    if (Object.keys(errors).length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "لطفاً فیلدهای فرم را درست تکمیل کنید.",
          errors,
        }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (!(await checkRateLimit(supabaseAdmin, ip))) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "تعداد درخواست‌های ثبت‌نام از این IP زیاد بوده است. لطفاً چند دقیقه دیگر دوباره تلاش کنید.",
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    await recordAttempt(supabaseAdmin, ip, common.email);

    const { data: existingPhone, error: existingPhoneError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("phone", common.phone)
      .maybeSingle();

    if (existingPhoneError) {
      throw existingPhoneError;
    }

    if (existingPhone) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "ثبت‌نام انجام نشد.",
          errors: {
            phone: ["با این شماره موبایل قبلاً حساب ساخته شده است."],
          },
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: existingEmail, error: existingEmailError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", common.email)
      .maybeSingle();

    if (existingEmailError) {
      throw existingEmailError;
    }

    if (existingEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "ثبت‌نام انجام نشد.",
          errors: {
            email: ["با این ایمیل قبلاً حساب ساخته شده است."],
          },
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const approvalStatus = role === "blogger" ? "pending" : "approved";
    const systemPassword = generateSystemPassword();

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: common.email,
      password: systemPassword,
      email_confirm: true,
      user_metadata: {
        role,
        full_name: common.fullName,
        display_name: common.fullName,
        ...(role === "business" && businessData ? { brand_name: businessData.brandName } : {}),
      },
    });

    if (authError) {
      if (authError.message?.includes("already been registered") || authError.message?.includes("already exists")) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "ثبت‌نام انجام نشد.",
            errors: {
              email: ["با این ایمیل قبلاً حساب ساخته شده است."],
            },
          }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      throw authError;
    }

    const userId = authData.user!.id;

    const profileUpdate: Record<string, any> = {
      phone: common.phone,
      email: common.email,
      instagram: common.instagram,
      category: common.category,
      city: common.city,
      display_name: common.fullName,
      username: common.fullName,
      role,
      approval_status: approvalStatus,
    };

    if (role === "blogger" && bloggerData) {
      profileUpdate.gender = bloggerData.gender;
      profileUpdate.followers_count = bloggerData.followersCount;
    }

    if (role === "business" && businessData) {
      profileUpdate.brand_name = businessData.brandName;
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").update(profileUpdate).eq("user_id", userId);

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);

      if (profileError.message?.includes("profiles_phone_unique") || profileError.code === "23505") {
        return new Response(
          JSON.stringify({
            success: false,
            message: "ثبت‌نام انجام نشد.",
            errors: {
              phone: ["با این شماره موبایل قبلاً حساب ساخته شده است."],
            },
          }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      throw profileError;
    }

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

    if (roleError) {
      console.error("user_roles upsert error:", roleError);
    }

    const message =
      role === "blogger"
        ? "ثبت‌نام بلاگر با موفقیت انجام شد و حساب شما در انتظار بررسی ادمین است."
        : "ثبت‌نام کسب‌وکار با موفقیت انجام شد.";

    const responseData: Record<string, any> = {
      role,
      status: approvalStatus === "pending" ? "pending_review" : "active",
      instagram_username: common.instagramUsername,
    };

    if (role === "blogger" && bloggerData) {
      responseData.review_status = "pending";
      responseData.followers_count = bloggerData.followersCount;
      responseData.gender = bloggerData.gender;
    }

    if (role === "business" && businessData) {
      responseData.brand_name = businessData.brandName;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message,
        data: responseData,
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Registration error:", err);

    return new Response(
      JSON.stringify({
        success: false,
        message: "خطایی در پردازش درخواست رخ داد. لطفاً دوباره تلاش کنید.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
