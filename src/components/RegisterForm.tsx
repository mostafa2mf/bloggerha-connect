import { useState, FormEvent, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
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
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [fullName, setFullName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [instagram, setInstagram] = useState("");
  const [followersCount, setFollowersCount] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("تهران");

  const igUsername = useMemo(() => extractInstagramUsername(instagram), [instagram]);

  const isBlogger = type === "blogger";
  const title = isBlogger ? "ثبت‌نام بلاگر" : "ثبت‌نام کسب‌وکار";
  const subtitle = isBlogger
    ? "پروفایل خودت را ثبت کن و منتظر بررسی ادمین بمان."
    : "اطلاعات برندت را ثبت کن و پروفایل کسب‌وکارت را بساز.";

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
      toast.error("لطفاً فیلدهای فرم را درست تکمیل کنید.");
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
        toast.error("خطایی در پردازش درخواست رخ داد. لطفاً دوباره تلاش کنید.");
        setLoading(false);
        return;
      }

      if (!payload?.success) {
        if (payload?.errors && Object.keys(payload.errors).length > 0) {
          setFieldErrors(payload.errors);
        }
        toast.error(payload?.message || "ثبت‌نام انجام نشد.");
        setLoading(false);
        return;
      }

      toast.success(payload?.message || "ثبت‌نام با موفقیت انجام شد.", {
        description: isBlogger
          ? "درخواست شما ثبت شد و پس از بررسی ادمین، نتیجه اعلام می‌شود."
          : "اطلاعات کسب‌وکار شما با موفقیت ثبت شد.",
        duration: 7000,
      });

      setTimeout(() => navigate("/"), 2200);
    } catch {
      toast.error("خطایی در پردازش درخواست رخ داد. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  const baseInputClass =
    "w-full h-12 sm:h-12 bg-background/60 border border-border rounded-2xl pe-4 ps-11 text-sm sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/40 transition-all placeholder:text-muted-foreground/60";
  const errorInputClass =
    "w-full h-12 sm:h-12 bg-background/60 border border-destructive rounded-2xl pe-4 ps-11 text-sm sm:text-sm focus:outline-none focus:ring-2 focus:ring-destructive/40 transition-all placeholder:text-muted-foreground/60";

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

  const categories = isBlogger ? BLOGGER_CATEGORIES : BUSINESS_CATEGORIES;

  return (
    <div className="min-h-screen flex items-center justify-center py-10 sm:py-16 lg:py-24 px-3 sm:px-4 relative">
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
            className="shrink-0 flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("register.back")} <ArrowRight size={14} />
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-4.5" noValidate>
          {!isBlogger && (
            <div>
              <div className="relative">
                <Building2 size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="نام برند را وارد کنید"
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
                placeholder={
                  isBlogger ? "نام و نام خانوادگی خود را وارد کنید" : "نام و نام خانوادگی مسئول را وارد کنید"
                }
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
                placeholder="example@email.com"
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
                placeholder="09123456789"
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
              <label className="block text-sm font-medium mb-2 px-1">جنسیت</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={`h-12 rounded-2xl border text-sm font-medium transition-all ${
                    gender === "male"
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-background/40 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  آقا
                </button>

                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={`h-12 rounded-2xl border text-sm font-medium transition-all ${
                    gender === "female"
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-background/40 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  خانم
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
                  <option value="">تعداد فالوور را انتخاب کنید</option>
                  {FOLLOWER_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 px-1">
                فقط پیج‌های بالای حداقل فالوور مجاز امکان ثبت‌نام دارند.
              </p>
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
                {IRAN_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
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
                <option value="">دسته‌بندی را انتخاب کنید</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <FieldError field="category" />
          </div>

          <div>
            <div className="relative">
              <Instagram size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="@username یا https://instagram.com/username"
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
            className="w-full h-12 sm:h-13 gradient-bg text-primary-foreground font-medium rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 mt-2 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default RegisterForm;
