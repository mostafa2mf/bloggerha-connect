import { z } from 'zod';

// --- Helpers ---
export function persianToEnglishDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

export function normalizePhone(raw: string): string {
  let p = raw.trim();
  p = p.replace(/[\s\-_()]/g, '');
  p = persianToEnglishDigits(p);
  if (p.startsWith('+98')) p = '0' + p.slice(3);
  else if (p.startsWith('98') && p.length === 12) p = '0' + p.slice(2);
  return p;
}

function collapseSpaces(s: string): string {
  return s.trim().replace(/\s+/g, ' ');
}

// --- Name regex: Persian + English letters, spaces, ZWNJ, hyphen ---
const nameRegex = /^[\u0600-\u06FFa-zA-Z\s\u200C\-]+$/;
const instagramRegex = /^(https?:\/\/)?(www\.)?instagram\.com\/[A-Za-z0-9._]+\/?$/;

// --- Schemas ---
const fullNameSchema = z
  .string()
  .transform(collapseSpaces)
  .pipe(
    z.string()
      .min(1, 'نام و نام خانوادگی الزامی است.')
      .min(2, 'نام باید حداقل ۲ کاراکتر باشد.')
      .max(60, 'نام نمی‌تواند بیشتر از ۶۰ کاراکتر باشد.')
      .regex(nameRegex, 'نام فقط باید شامل حروف فارسی یا انگلیسی باشد.')
  );

const emailSchema = z
  .string()
  .transform((v) => v.trim().toLowerCase())
  .pipe(
    z.string()
      .min(1, 'ایمیل الزامی است.')
      .max(254, 'ایمیل نمی‌تواند بیشتر از ۲۵۴ کاراکتر باشد.')
      .email('فرمت ایمیل معتبر نیست.')
  );

const phoneSchema = z
  .string()
  .transform(normalizePhone)
  .pipe(
    z.string()
      .min(1, 'شماره موبایل الزامی است.')
      .refine((v) => /^\d+$/.test(v), 'شماره موبایل معتبر نیست.')
      .refine((v) => v.startsWith('09'), 'شماره موبایل باید با ۰۹ شروع شود.')
      .refine((v) => v.length === 11, 'شماره موبایل باید دقیقاً ۱۱ رقم باشد.')
  );

const passwordSchema = z
  .string()
  .min(1, 'رمز عبور الزامی است.')
  .min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد.')
  .max(72, 'رمز عبور نمی‌تواند بیشتر از ۷۲ کاراکتر باشد.')
  .refine((v) => /(?=.*[A-Za-z])(?=.*\d)/.test(v), 'رمز عبور باید شامل حداقل یک حرف و یک عدد باشد.');

const instagramSchema = z
  .string()
  .transform((v) => v.trim())
  .pipe(
    z.string()
      .min(1, 'لینک اینستاگرام الزامی است.')
      .regex(instagramRegex, 'لینک اینستاگرام معتبر نیست.')
  );

const categorySchema = z
  .string()
  .transform(collapseSpaces)
  .pipe(
    z.string()
      .min(1, 'دسته‌بندی الزامی است.')
      .min(2, 'دسته‌بندی باید حداقل ۲ کاراکتر باشد.')
      .max(50, 'دسته‌بندی نمی‌تواند بیشتر از ۵۰ کاراکتر باشد.')
  );

const followersCountSchema = z
  .string()
  .transform((v) => persianToEnglishDigits(v.trim()))
  .pipe(
    z.string()
      .min(1, 'تعداد فالوور الزامی است.')
      .refine((v) => /^\d+$/.test(v), 'تعداد فالوور باید فقط عدد باشد.')
      .transform(Number)
      .pipe(
        z.number()
          .min(100000, 'حداقل تعداد فالوور برای ثبت‌نام بلاگر ۱۰۰٬۰۰۰ است.')
          .max(200000000, 'تعداد فالوور واردشده معتبر نیست.')
      )
  );

// --- Combined schemas ---
export const businessRegisterSchema = z.object({
  full_name: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  instagram_url: instagramSchema,
  category: categorySchema,
});

export const bloggerRegisterSchema = z.object({
  full_name: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  instagram_url: instagramSchema,
  followers_count: followersCountSchema,
  category: categorySchema,
});

export type BusinessRegisterData = z.infer<typeof businessRegisterSchema>;
export type BloggerRegisterData = z.infer<typeof bloggerRegisterSchema>;
