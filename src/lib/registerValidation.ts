import { z } from "zod";

export const IRAN_CITIES = [
  { value: "تهران", fa: "تهران", en: "Tehran" },
  { value: "مشهد", fa: "مشهد", en: "Mashhad" },
  { value: "اصفهان", fa: "اصفهان", en: "Isfahan" },
  { value: "شیراز", fa: "شیراز", en: "Shiraz" },
  { value: "تبریز", fa: "تبریز", en: "Tabriz" },
  { value: "کرج", fa: "کرج", en: "Karaj" },
  { value: "قم", fa: "قم", en: "Qom" },
  { value: "اهواز", fa: "اهواز", en: "Ahvaz" },
  { value: "رشت", fa: "رشت", en: "Rasht" },
  { value: "کرمانشاه", fa: "کرمانشاه", en: "Kermanshah" },
  { value: "ارومیه", fa: "ارومیه", en: "Urmia" },
  { value: "یزد", fa: "یزد", en: "Yazd" },
  { value: "قزوین", fa: "قزوین", en: "Qazvin" },
  { value: "بندرعباس", fa: "بندرعباس", en: "Bandar Abbas" },
  { value: "زاهدان", fa: "زاهدان", en: "Zahedan" },
  { value: "ساری", fa: "ساری", en: "Sari" },
  { value: "اردبیل", fa: "اردبیل", en: "Ardabil" },
  { value: "کرمان", fa: "کرمان", en: "Kerman" },
  { value: "همدان", fa: "همدان", en: "Hamedan" },
  { value: "گرگان", fa: "گرگان", en: "Gorgan" },
] as const;

export const BLOGGER_CATEGORIES = [
  { value: "زیبایی", fa: "زیبایی", en: "Beauty" },
  { value: "مد و فشن", fa: "مد و فشن", en: "Fashion" },
  { value: "تکنولوژی", fa: "تکنولوژی", en: "Technology" },
  { value: "غذا", fa: "غذا", en: "Food" },
  { value: "سفر", fa: "سفر", en: "Travel" },
  { value: "ورزش", fa: "ورزش", en: "Sports" },
  { value: "آموزشی", fa: "آموزشی", en: "Education" },
  { value: "طنز", fa: "طنز", en: "Comedy" },
  { value: "کودک و مادر", fa: "کودک و مادر", en: "Mother & Kids" },
  { value: "لایف‌استایل", fa: "لایف‌استایل", en: "Lifestyle" },
  { value: "گیم", fa: "گیم", en: "Gaming" },
  { value: "خودرو", fa: "خودرو", en: "Automotive" },
  { value: "هنر", fa: "هنر", en: "Art" },
  { value: "مالی", fa: "مالی", en: "Finance" },
  { value: "پزشکی", fa: "پزشکی", en: "Medical" },
] as const;

export const BUSINESS_CATEGORIES = [
  { value: "پوشاک", fa: "پوشاک", en: "Clothing" },
  { value: "آرایشی و بهداشتی", fa: "آرایشی و بهداشتی", en: "Beauty & Personal Care" },
  { value: "رستوران و کافه", fa: "رستوران و کافه", en: "Restaurant & Cafe" },
  { value: "تکنولوژی", fa: "تکنولوژی", en: "Technology" },
  { value: "خدمات", fa: "خدمات", en: "Services" },
  { value: "آموزشی", fa: "آموزشی", en: "Education" },
  { value: "مالی", fa: "مالی", en: "Finance" },
  { value: "گردشگری", fa: "گردشگری", en: "Tourism" },
  { value: "سلامت و پزشکی", fa: "سلامت و پزشکی", en: "Health & Medical" },
  { value: "دکوراسیون", fa: "دکوراسیون", en: "Home Decor" },
  { value: "طلا و جواهر", fa: "طلا و جواهر", en: "Jewelry" },
  { value: "خودرو", fa: "خودرو", en: "Automotive" },
  { value: "مواد غذایی", fa: "مواد غذایی", en: "Food Products" },
] as const;

export const FOLLOWER_OPTIONS = [
  { value: "100k-500k", fa: "100K تا 500K", en: "100K to 500K", numericValue: 100000 },
  { value: "500k+", fa: "500K+", en: "500K+", numericValue: 500000 },
] as const;

// Accept only @username (1-30 chars, letters/numbers/._). No URLs.
const instagramHandleRegex = /^@[A-Za-z0-9._]{1,30}$/;

export function extractInstagramUsername(input: string): string {
  const value = input.trim().replace(/^@+/, "");
  if (!value) return "";
  if (!/^[A-Za-z0-9._]{1,30}$/.test(value)) return "";
  return value;
}

// Convert Persian/Arabic digits to ASCII digits.
export function toEnglishDigits(input: string): string {
  return input
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

const phoneSchema = z
  .string()
  .trim()
  .transform((v) => toEnglishDigits(v))
  .pipe(z.string().regex(/^09\d{9}$/, "شماره موبایل باید با 09 شروع شود و 11 رقم باشد."));

const emailSchema = z.string().trim().min(1, "ایمیل الزامی است.").email("فرمت ایمیل صحیح نیست.");

const fullNameSchema = z.string().trim().min(3, "نام و نام خانوادگی را کامل وارد کنید.");

const cityValues = IRAN_CITIES.map((item) => item.value) as [string, ...string[]];
const followerValues = FOLLOWER_OPTIONS.map((item) => item.value) as [string, ...string[]];

const citySchema = z.enum(cityValues, {
  errorMap: () => ({ message: "لطفاً شهر را انتخاب کنید." }),
});

const categoryStringSchema = z.string().trim().min(1, "لطفاً دسته‌بندی را انتخاب کنید.");

const instagramSchema = z
  .string()
  .trim()
  .min(1, "آیدی اینستاگرام الزامی است.")
  .refine((value) => !!extractInstagramUsername(value), {
    message: "آیدی اینستاگرام باید با @ شروع شود (مثل @username).",
  })
  .transform((value) => `@${extractInstagramUsername(value)}`);

export const bloggerRegisterSchema = z.object({
  full_name: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  gender: z.enum(["male", "female"], {
    errorMap: () => ({ message: "لطفاً جنسیت را انتخاب کنید." }),
  }),
  followers_count: z.enum(followerValues, {
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
