import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
    if (!/^[\u0600-\u06FFa-zA-Z\s\u200C\-]+$/.test(name))
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
  if (!rawPhone.trim()) {
    (errors.phone ??= []).push("شماره موبایل الزامی است.");
  } else {
    const phone = normalizePhone(rawPhone);
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
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password))
      (errors.password ??= []).push("رمز عبور باید شامل حداقل یک حرف و یک عدد باشد.");
  }

  // instagram_url
  const ig = typeof body.instagram_url === "string" ? body.instagram_url.trim() : "";
  if (!ig) {
    (errors.instagram_url ??= []).push("لینک اینستاگرام الزامی است.");
  } else if (!/^(https?:\/\/)?(www\.)?instagram\.com\/[A-Za-z0-9._]+\/?$/.test(ig)) {
    (errors.instagram_url ??= []).push("لینک اینستاگرام معتبر نیست.");
  }

  // category
  const cat = typeof body.category === "string" ? collapseSpaces(body.category) : "";
  if (!cat) {
    (errors.category ??= []).push("دسته‌بندی الزامی است.");
  } else {
    if (cat.length < 2) (errors.category ??= []).push("دسته‌بندی باید حداقل 2 کاراکتر باشد.");
    if (cat.length > 50) (errors.category ??= []).push("دسته‌بندی نمی‌تواند بیشتر از 50 کاراکتر باشد.");
  }

  return { name, email, phone: normalizePhone(rawPhone), password, instagram: ig, category: cat };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
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

    // Check duplicate phone
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

    // Create auth user (Supabase handles password hashing with bcrypt)
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

    // Update the profile created by trigger with additional fields
    const profileUpdate: Record<string, any> = {
      phone: normalized.phone,
      email: normalized.email,
      instagram: normalized.instagram,
      category: normalized.category,
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
      
      if (profileError.message?.includes("profiles_phone_unique")) {
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

    const responseData: any = { role, status: approvalStatus === "pending" ? "pending_review" : "active" };
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
