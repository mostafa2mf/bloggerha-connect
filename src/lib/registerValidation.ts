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

/**
 * Extract Instagram username from any reasonable URL/handle format.
 * Supports: full URL, www, no protocol, @handle, just username, trailing slashes, query strings.
 * Returns normalized username (without @) or null if invalid.
 */
export function extractInstagramUsername(raw: string): string | null {
  if (!raw) return null;
  let s = raw.trim().replace(/\s+/g, '');
  // Remove @ prefix
  if (s.startsWith('@')) s = s.slice(1);
  // Strip protocol
  s = s.replace(/^https?:\/\//i, '');
  // Strip www.
  s = s.replace(/^www\./i, '');
  // If starts with instagram.com, strip it
  s = s.replace(/^instagram\.com\//i, '');
  // Take only the first path segment (before / or ?)
  s = s.split(/[/?#]/)[0];
  // Validate username: letters, numbers, dot, underscore, 1-30 chars
  if (!/^[A-Za-z0-9._]{1,30}$/.test(s)) return null;
  // Reject reserved words / non-profile paths
  const reserved = ['p', 'reel', 'reels', 'tv', 'explore', 'stories', 'accounts', 'direct'];
  if (reserved.includes(s.toLowerCase())) return null;
  return s.toLowerCase();
}

export function normalizeInstagramUrl(raw: string): string | null {
  const username = extractInstagramUsername(raw);
  if (!username) return null;
  return `https://instagram.com/${username}`;
}

// --- Name regex: Persian + English letters, spaces, ZWNJ/ZWJ/ZWSP, hyphen, tatweel, apostrophe ---
const nameRegex = /^[\u0600-\u06FFa-zA-Z\s\u200B-\u200D\u0640'\-]+$/;

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

// Password: normalize Persian digits before checking for digits/letters
const passwordSchema = z
  .string()
  .min(1, 'رمز عبور الزامی است.')
  .min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد.')
  .max(72, 'رمز عبور نمی‌تواند بیشتر از ۷۲ کاراکتر باشد.')
  .refine(
    (v) => {
      const normalized = persianToEnglishDigits(v);
      return /[A-Za-z]/.test(normalized) && /\d/.test(normalized);
    },
    'رمز عبور باید شامل حداقل یک حرف و یک عدد باشد.'
  );

const instagramSchema = z
  .string()
  .min(1, 'لینک اینستاگرام الزامی است.')
  .refine((v) => extractInstagramUsername(v) !== null, 'لینک اینستاگرام معتبر نیست.');

const categorySchema = z
  .string()
  .transform(collapseSpaces)
  .pipe(
    z.string()
      .min(1, 'دسته‌بندی الزامی است.')
      .min(2, 'دسته‌بندی باید حداقل ۲ کاراکتر باشد.')
      .max(50, 'دسته‌بندی نمی‌تواند بیشتر از ۵۰ کاراکتر باشد.')
  );

const citySchema = z
  .string()
  .transform(collapseSpaces)
  .pipe(
    z.string()
      .min(1, 'شهر الزامی است.')
      .min(2, 'نام شهر باید حداقل ۲ کاراکتر باشد.')
      .max(50, 'نام شهر نمی‌تواند بیشتر از ۵۰ کاراکتر باشد.')
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
  city: citySchema,
});

export const bloggerRegisterSchema = z.object({
  full_name: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  instagram_url: instagramSchema,
  followers_count: followersCountSchema,
  category: categorySchema,
  city: citySchema,
});

export type BusinessRegisterData = z.infer<typeof businessRegisterSchema>;
export type BloggerRegisterData = z.infer<typeof bloggerRegisterSchema>;

// Common Iranian cities for the dropdown
export const IRAN_CITIES = [
  'تهران', 'مشهد', 'اصفهان', 'شیراز', 'تبریز', 'کرج', 'اهواز', 'قم',
  'کرمانشاه', 'ارومیه', 'رشت', 'زاهدان', 'همدان', 'کرمان', 'یزد', 'اردبیل',
  'بندرعباس', 'اراک', 'قزوین', 'زنجان', 'ساری', 'بابل', 'گرگان', 'بوشهر',
  'سنندج', 'خرم‌آباد', 'بجنورد', 'بیرجند', 'یاسوج', 'ایلام', 'شهرکرد', 'سمنان',
];
