import { useState, FormEvent, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link, useNavigate } from "react-router-dom";
import PendingByEmailScreen from "@/components/shared/PendingByEmailScreen";
import {
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Instagram,
  Tag,
  Loader2,
  Users,
  MapPin,
  CheckCircle2,
  Building2,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  businessRegisterSchema,
  bloggerRegisterSchema,
  extractInstagramUsername,
  IRAN_CITIES,
  BLOGGER_CATEGORIES,
  BUSINESS_CATEGORIES,
  FOLLOWER_OPTIONS,
} from "@/lib/registerValidation";
import type { ZodError } from "zod";

interface Props {
  type: "blogger" | "business";
}

type FieldErrors = Record<string, string[]>;

function zodToFieldErrors(err: ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of err.issues) {
    const key = issue.path[0] as string;
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

const RegisterForm = ({ type }: Props) => {
  useLanguage();
  const navigate = useNavigate();

  const lang =
    typeof document !== "undefined" && document.documentElement.lang?.toLowerCase().startsWith("en") ? "en" : "fa";

  const isEn = lang === "en";
  const isBlogger = type === "blogger";

  const copy = {
    fa: {
      bloggerTitle: "ثبت‌نام بلاگر",
      businessTitle: "ثبت‌نام کسب‌وکار",
      bloggerSubtitle: "اطلاعات خودت را ثبت کن و منتظر بررسی ادمین بمان.",
      businessSubtitle: "اطلاعات برندت را ثبت کن و پروفایل کسب‌وکارت را بساز.",
      back: "بازگشت",
      brandName: "نام برند را وارد کنید",
      fullNameBlogger: "نام و نام خانوادگی خود را وارد کنید",
      fullNameBusiness: "نام و نام خانوادگی مسئول را وارد کنید",
      email: "example@email.com",
      phone: "09123456789",
      gender: "جنسیت",
      male: "آقا",
      female: "خانم",
      followers: "تعداد فالوور را انتخاب کنید",
      city: "شهر را انتخاب کنید",
      categoryBlogger: "دسته‌بندی فعالیت را انتخاب کنید",
      categoryBusiness: "دسته‌بندی کسب‌وکار را انتخاب کنید",
      instagram: "@username یا https://instagram.com/username",
      submit: "ثبت‌نام",
      loading: "در حال ثبت‌نام...",
      invalidForm: "لطفاً فیلدهای فرم را درست تکمیل کنید.",
      bloggerSuccess: "درخواست شما ثبت شد و در انتظار بررسی ادمین است.",
      businessSuccess: "اطلاعات کسب‌وکار شما با موفقیت ثبت شد.",
      genericError: "خطایی در پردازش درخواست رخ داد. لطفاً دوباره تلاش کنید.",
    },
    en: {
      bloggerTitle: "Blogger Registration",
      businessTitle: "Business Registration",
      bloggerSubtitle: "Submit your profile and wait for admin review.",
      businessSubtitle: "Submit your brand information and create your business profile.",
      back: "Back",
      brandName: "Enter brand name",
      fullNameBlogger: "Enter your full name",
      fullNameBusiness: "Enter manager full name",
      email: "example@email.com",
      phone: "09123456789",
      gender: "Gender",
      male: "Male",
      female: "Female",
      followers: "Select follower range",
      city: "Select city",
      categoryBlogger: "Select content category",
      categoryBusiness: "Select business category",
      instagram: "@username or https://instagram.com/username",
      submit: "Register",
      loading: "Submitting...",
      invalidForm: "Please complete the form correctly.",
      bloggerSuccess: "Your request was submitted and is pending admin review.",
      businessSuccess: "Your business information was submitted successfully.",
      genericError: "Something went wrong. Please try again.",
    },
  }[isEn ? "en" : "fa"];

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const STORAGE_KEY = `pending_registration_${type}`;

  const [pendingEmail, setPendingEmail] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY);
  });
  const [pendingProfile, setPendingProfile] = useState<any>(null);
  const [bootChecking, setBootChecking] = useState<boolean>(!!pendingEmail);

  const [fullName, setFullName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [instagram, setInstagram] = useState("");
  const [followersCount, setFollowersCount] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");

  // On mount: if we have a stored email, look up its current status.
  // If approved, clear gate so user can log in normally.
  useEffect(() => {
    if (!pendingEmail) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.functions.invoke('check-registration', {
          body: { email: pendingEmail },
        });
        if (cancelled) return;
        if (data?.exists && data.profile) {
          if (data.profile.approval_status === 'approved') {
            localStorage.removeItem(STORAGE_KEY);
            setPendingEmail(null);
            setPendingProfile(null);
          } else {
            setPendingProfile(data.profile);
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setPendingEmail(null);
        }
      } catch (err) {
        console.error('Initial status check failed:', err);
      } finally {
        if (!cancelled) setBootChecking(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const igUsername = useMemo(() => extractInstagramUsername(instagram), [instagram]);

  const title = isBlogger ? copy.bloggerTitle : copy.businessTitle;
  const subtitle = isBlogger ? copy.bloggerSubtitle : copy.businessSubtitle;
  const categories = isBlogger ? BLOGGER_CATEGORIES : BUSINESS_CATEGORIES;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const rawData: Record<string, any> = {
      email: email.trim(),
      phone: phone.trim(),
      instagram_url: instagram.trim(),
      category,
      city,
      role: type,
    };

    if (isBlogger) {
      rawData.full_name = fullName.trim();
      rawData.gender = gender;
      rawData.followers_count = followersCount;
    } else {
      rawData.brand_name = brandName.trim();
      rawData.full_name = fullName.trim();
    }

    const schema = isBlogger ? bloggerRegisterSchema : businessRegisterSchema;
    const result = schema.safeParse(rawData);

    if (!result.success) {
      setFieldErrors(zodToFieldErrors(result.error));
      toast.error(copy.invalidForm);
      return;
    }

    setLoading(true);

    try {
      const { data: response, error: fnError } = await supabase.functions.invoke("register", {
        body: result.data,
      });

      const ctx: any = (fnError as any)?.context;
      let payload: any = response;

      if (fnError && ctx && typeof ctx.json === "function") {
        try {
          payload = await ctx.json();
        } catch {
          // ignore
        }
      }

      if (fnError && !payload?.errors && !payload?.message) {
        toast.error(copy.genericError);
        setLoading(false);
        return;
      }

      if (!payload?.success) {
        if (payload?.errors && Object.keys(payload.errors).length > 0) {
          setFieldErrors(payload.errors);
        }
        toast.error(payload?.message || copy.genericError);
        setLoading(false);
        return;
      }

      toast.success(payload?.message || (isBlogger ? copy.bloggerSuccess : copy.businessSuccess));

      // Save email so subsequent visits show the pending screen instead of the form
      const submittedEmail = (result.data as any).email as string;
      try { localStorage.setItem(STORAGE_KEY, submittedEmail); } catch { /* ignore */ }
      setPendingProfile(payload?.profile || null);
      setPendingEmail(submittedEmail);
      setBootChecking(false);
    } catch {
      toast.error(copy.genericError);
    } finally {
      setLoading(false);
    }
  };

  const baseInputClass =
    "w-full h-12 bg-background/60 border border-border rounded-2xl pe-10 ps-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-muted-foreground/60";
  const errorInputClass =
    "w-full h-12 bg-background/60 border border-destructive rounded-2xl pe-10 ps-11 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/40 transition-all placeholder:text-muted-foreground/60";

  const getInputClass = (field: string) => (fieldErrors[field] ? errorInputClass : baseInputClass);

  const FieldError = ({ field }: { field: string }) => {
    const errs = fieldErrors[field];
    if (!errs?.length) return null;

    return (
      <AnimatePresence>
        {errs.map((msg, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-destructive mt-1.5 px-1"
          >
            {msg}
          </motion.p>
        ))}
      </AnimatePresence>
    );
  };

  // Show loading while we resolve a stored pending email
  if (bootChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  // If a pending registration exists for this email, show status instead of the form
  if (pendingEmail) {
    return (
      <PendingByEmailScreen
        email={pendingEmail}
        initialProfile={pendingProfile}
        onApproved={() => {
          localStorage.removeItem(STORAGE_KEY);
          setPendingEmail(null);
          setPendingProfile(null);
        }}
        onReset={() => {
          localStorage.removeItem(STORAGE_KEY);
          setPendingEmail(null);
          setPendingProfile(null);
        }}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center py-10 sm:py-16 lg:py-24 px-3 sm:px-4 relative"
      dir={isEn ? "ltr" : "rtl"}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 start-1/4 w-72 h-72 rounded-full bg-primary/15 blur-[100px] animate-blob" />
        <div className="absolute bottom-1/3 end-1/4 w-64 h-64 rounded-full bg-primary/10 blur-[80px] animate-blob [animation-delay:3s]" />
      </div>

      <motion.div
        className="glass rounded-[28px] p-4 sm:p-6 lg:p-8 w-full max-w-md relative z-10 shadow-2xl"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-start justify-between gap-3 mb-6 sm:mb-8">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold gradient-text leading-tight">{title}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-6">{subtitle}</p>
          </div>

          <Link
            to="/"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 h-10 text-sm text-foreground hover:bg-background/80 transition-colors"
          >
            {isEn ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            <span>{copy.back}</span>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {!isBlogger && (
            <div>
              <div className="relative">
                <Building2 size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={copy.brandName}
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className={getInputClass("brand_name")}
                />
              </div>
              <FieldError field="brand_name" />
            </div>
          )}

          <div>
            <div className="relative">
              <User size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={isBlogger ? copy.fullNameBlogger : copy.fullNameBusiness}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={getInputClass("full_name")}
              />
            </div>
            <FieldError field="full_name" />
          </div>

          <div>
            <div className="relative">
              <Mail size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                placeholder={copy.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={getInputClass("email")}
                dir="ltr"
              />
            </div>
            <FieldError field="email" />
          </div>

          <div>
            <div className="relative">
              <Phone size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                placeholder={copy.phone}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={getInputClass("phone")}
                dir="ltr"
              />
            </div>
            <FieldError field="phone" />
          </div>

          {isBlogger && (
            <div>
              <div className="mb-2 px-1 text-sm font-medium">{copy.gender}</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={`h-12 rounded-2xl border text-sm font-medium transition-all ${
                    gender === "male"
                      ? "border-primary bg-primary/15 text-primary shadow-sm"
                      : "border-border bg-background/50 text-muted-foreground"
                  }`}
                >
                  {copy.male}
                </button>
                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={`h-12 rounded-2xl border text-sm font-medium transition-all ${
                    gender === "female"
                      ? "border-primary bg-primary/15 text-primary shadow-sm"
                      : "border-border bg-background/50 text-muted-foreground"
                  }`}
                >
                  {copy.female}
                </button>
              </div>
              <FieldError field="gender" />
            </div>
          )}

          {isBlogger && (
            <div>
              <div className="relative">
                <Users size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
                <select
                  value={followersCount}
                  onChange={(e) => setFollowersCount(e.target.value)}
                  className={getInputClass("followers_count") + " appearance-none cursor-pointer"}
                >
                  <option value="">{copy.followers}</option>
                  {FOLLOWER_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {isEn ? item.en : item.fa}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
              </div>
              <FieldError field="followers_count" />
            </div>
          )}

          <div>
            <div className="relative">
              <MapPin size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={getInputClass("city") + " appearance-none cursor-pointer"}
              >
                <option value="">{copy.city}</option>
                {IRAN_CITIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {isEn ? item.en : item.fa}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>
            <FieldError field="city" />
          </div>

          <div>
            <div className="relative">
              <Tag size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={getInputClass("category") + " appearance-none cursor-pointer"}
              >
                <option value="">{isBlogger ? copy.categoryBlogger : copy.categoryBusiness}</option>
                {categories.map((item) => (
                  <option key={item.value} value={item.value}>
                    {isEn ? item.en : item.fa}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>
            <FieldError field="category" />
          </div>

          <div>
            <div className="relative">
              <Instagram size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={copy.instagram}
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className={getInputClass("instagram_url")}
                dir="ltr"
              />
              {igUsername && !fieldErrors["instagram_url"] && (
                <CheckCircle2 size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-green-500" />
              )}
            </div>

            {igUsername && !fieldErrors["instagram_url"] && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 px-1" dir="ltr">
                ✓ @{igUsername}
              </p>
            )}

            <FieldError field="instagram_url" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 gradient-bg text-primary-foreground font-medium rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 mt-2 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? copy.loading : copy.submit}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default RegisterForm;
