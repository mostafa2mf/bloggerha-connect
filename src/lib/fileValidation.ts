export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const validateFile = (file: File, lang: string = 'fa'): ValidationResult => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: lang === 'fa'
        ? `فرمت فایل "${file.name}" مجاز نیست. فقط JPG، PNG، WebP و GIF`
        : `File "${file.name}" type not allowed. Only JPG, PNG, WebP, GIF`,
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: lang === 'fa'
        ? `حجم فایل "${file.name}" بیشتر از ۵ مگابایت است`
        : `File "${file.name}" exceeds 5MB limit`,
    };
  }
  return { valid: true };
};

export const validateFiles = (files: File[], lang: string = 'fa'): ValidationResult => {
  for (const file of files) {
    const result = validateFile(file, lang);
    if (!result.valid) return result;
  }
  return { valid: true };
};
