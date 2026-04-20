import { z } from "zod";

export const IRAN_CITIES = [
  "تهران",
  "مشهد",
  "اصفهان",
  "شیراز",
  "تبریز",
  "کرج",
  "قم",
  "اهواز",
  "رشت",
  "کرمانشاه",
  "ارومیه",
  "یزد",
  "قزوین",
  "بندرعباس",
  "زاهدان",
  "ساری",
  "اردبیل",
  "کرمان",
  "همدان",
  "گرگان",
] as const;

export const BLOGGER_CATEGORIES = [
  "زیبایی",
  "مد و فشن",
  "تکنولوژی",
  "غذا",
  "سفر",
  "ورزش",
  "آموزشی",
  "طنز",
  "کودک و مادر",
  "لایف‌استایل",
  "گیم",
  "خودرو",
  "هنر",
  "مالی",
  "پزشکی",
] as const;

export const BUSINESS_CATEGORIES = [
  "پوشاک",
  "آرایشی و بهداشتی",
  "رستوران و کافه",
  "تکنولوژی",
  "خدمات",
  "آموزشی",
  "مالی",
  "گردشگری",
  "سلامت و پزشکی",
  "دکوراسیون",
  "طلا و جواهر",
  "خودرو",
  "مواد غذایی",
] as const;

export const FOLLOWER_OPTIONS = [
  { value: "10000-50000", label: "10K تا 50K" },
  { value: "50000-100000", label: "50K تا 100K" },
  { value: "100000-500000", label: "100K تا 500K" },
  { value: "500000+", label: "500K+" },
] as const;

const instagramRegex =
  /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]{1,30})\/?$|^@?([A-Za-z0-9._]{1,30})$/i;

export function extractInstagramUsername(input: string): string {
  const value = input.trim();
  if (!value) return "";

  const match = value.match(instagramRegex);
  if (!match) return "";

  return match[1] || match[2] || "";
}

const phoneSchema = z
  .string()
  .trim()
  .regex(/^09\d{9}$/, "شماره موبایل باید با 09 شروع شود و 11 رقم باشد.");

const emailSchema = z.string().trim().min(1, "ایمیل الزامی است.").email("فرمت ایمیل صحیح نیست.");

const fullNameSchema = z.string().trim().min(3, "نام و نام خانوادگی را کامل وارد کنید.");

const citySchema = z.enum(IRAN_CITIES, {
  errorMap: () => ({ message: "لطفاً شهر را انتخاب کنید." }),
});

const categoryStringSchema = z.string().trim().min(1, "لطفاً دسته‌بندی را انتخاب کنید.");

const instagramSchema = z
  .string()
  .trim()
  .min(1, "آدرس اینستاگرام الزامی است.")
  .refine((value) => !!extractInstagramUsername(value), {
    message: "آیدی یا لینک اینستاگرام معتبر نیست.",
  })
  .transform((value) => {
    const username = extractInstagramUsername(value);
    return username ? `@${username}` : value.trim();
  });

export const bloggerRegisterSchema = z.object({
  full_name: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  gender: z.enum(["male", "female"], {
    errorMap: () => ({ message: "لطفاً جنسیت را انتخاب کنید." }),
  }),
  followers_count: z.enum(FOLLOWER_OPTIONS.map((item) => item.value) as [string, ...string[]], {
    errorMap: () => ({ message: "لطفاً بازه تعداد فالوور را انتخاب کنید." }),
  }),
  city: citySchema,
  category: categoryStringSchema,
  instagram_url: instagramSchema,
  role: z.literal("blogger"),
});

export const businessRegisterSchema = z.object({
  brand_name: z.string().trim().min(2, "نام برند را وارد کنید."),
  full_name: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  city: citySchema,
  category: categoryStringSchema,
  instagram_url: instagramSchema,
  role: z.literal("business"),
});
