import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

interface Props {
  role: 'blogger' | 'business';
  onGoToProfile?: () => void;
}

const FIELDS: Record<'blogger' | 'business', { key: string; fa: string; en: string }[]> = {
  blogger: [
    { key: 'avatar_url', fa: 'تصویر پروفایل', en: 'Avatar' },
    { key: 'full_name', fa: 'نام و نام خانوادگی', en: 'Full name' },
    { key: 'bio', fa: 'بیوگرافی', en: 'Bio' },
    { key: 'phone', fa: 'شماره تماس', en: 'Phone' },
    { key: 'city', fa: 'شهر', en: 'City' },
    { key: 'category', fa: 'دسته‌بندی', en: 'Category' },
    { key: 'instagram', fa: 'اینستاگرام', en: 'Instagram' },
    { key: 'followers_count', fa: 'تعداد فالوور', en: 'Followers' },
  ],
  business: [
    { key: 'avatar_url', fa: 'لوگو', en: 'Logo' },
    { key: 'brand_name', fa: 'نام برند', en: 'Brand name' },
    { key: 'bio', fa: 'درباره کسب‌وکار', en: 'About' },
    { key: 'phone', fa: 'شماره تماس', en: 'Phone' },
    { key: 'city', fa: 'شهر', en: 'City' },
    { key: 'category', fa: 'دسته‌بندی', en: 'Category' },
    { key: 'instagram', fa: 'اینستاگرام', en: 'Instagram' },
  ],
};

const isFilled = (v: any) =>
  v !== null && v !== undefined && v !== '' && !(typeof v === 'number' && v === 0);

const ProfileCompletionCard = ({ role, onGoToProfile }: Props) => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [user]);

  if (loading || !profile) return null;

  const fields = FIELDS[role];
  const missing = fields.filter((f) => !isFilled(profile[f.key]));
  const filledCount = fields.length - missing.length;
  const percent = Math.round((filledCount / fields.length) * 100);
  const isComplete = missing.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-3xl p-5 border ${
        isComplete ? 'border-emerald-400/40' : 'border-amber-400/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle size={20} className="text-amber-500 shrink-0" />
          )}
          <div>
            <h3 className="font-bold text-sm">
              {isComplete
                ? lang === 'fa'
                  ? 'پروفایل شما کامل است 🎉'
                  : 'Your profile is complete 🎉'
                : lang === 'fa'
                ? 'پروفایل خود را تکمیل کنید'
                : 'Complete your profile'}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {lang === 'fa'
                ? `${filledCount} از ${fields.length} مورد تکمیل شده`
                : `${filledCount} of ${fields.length} fields filled`}
            </p>
          </div>
        </div>
        <span
          className={`text-sm font-bold ${
            isComplete ? 'text-emerald-500' : 'text-amber-500'
          }`}
        >
          {percent}%
        </span>
      </div>

      <Progress value={percent} className="h-2 mb-3" />

      {!isComplete && (
        <>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {missing.slice(0, 6).map((f) => (
              <span
                key={f.key}
                className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              >
                {lang === 'fa' ? f.fa : f.en}
              </span>
            ))}
            {missing.length > 6 && (
              <span className="text-[10px] px-2 py-0.5 text-muted-foreground">
                +{missing.length - 6}
              </span>
            )}
          </div>
          <button
            onClick={onGoToProfile}
            className="w-full text-xs font-medium py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors flex items-center justify-center gap-1.5"
          >
            {lang === 'fa' ? 'تکمیل پروفایل' : 'Complete profile'}
            <ArrowLeft size={14} className={lang === 'fa' ? '' : 'rotate-180'} />
          </button>
        </>
      )}
    </motion.div>
  );
};

export default ProfileCompletionCard;
