import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';

interface Props {
  failureCount: number;
  lastError?: string | null;
  onRetry: () => Promise<void>;
}

const i18n = {
  fa: {
    title: 'خطا در بررسی وضعیت حساب',
    description: (n: number) =>
      `${n} بار تلاش ناموفق برای بررسی وضعیت تأیید. لطفاً اتصال اینترنت خود را بررسی کنید.`,
    retry: 'دوباره بررسی کن',
    errorLabel: 'جزئیات خطا:',
  },
  en: {
    title: 'Approval status check failed',
    description: (n: number) =>
      `${n} consecutive attempts to verify your approval status failed. Please check your internet connection.`,
    retry: 'Retry check',
    errorLabel: 'Error details:',
  },
};

const ApprovalSyncAlert = ({ failureCount, lastError, onRetry }: Props) => {
  const { lang } = useLanguage();
  const t = i18n[lang] ?? i18n.en;
  const [retrying, setRetrying] = useState(false);

  if (failureCount < 3) return null;

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 space-y-3 text-start">
      <div className="flex items-center gap-2">
        <AlertTriangle size={18} className="text-destructive shrink-0" />
        <span className="text-sm font-semibold text-destructive">{t.title}</span>
      </div>
      <p className="text-xs text-foreground/80 leading-relaxed">{t.description(failureCount)}</p>
      {lastError && (
        <p className="text-xs text-muted-foreground">
          {t.errorLabel} <code className="bg-muted px-1 py-0.5 rounded text-[10px]">{lastError}</code>
        </p>
      )}
      <button
        onClick={handleRetry}
        disabled={retrying}
        className="w-full glass rounded-xl py-2.5 text-sm font-medium hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 text-primary"
      >
        {retrying ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        {t.retry}
      </button>
    </div>
  );
};

export default ApprovalSyncAlert;
