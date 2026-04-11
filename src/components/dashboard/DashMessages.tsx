import { useLanguage } from '@/contexts/LanguageContext';
import AdminChatPanel from '@/components/shared/AdminChatPanel';
import BackButton from '@/components/shared/BackButton';

const DashMessages = ({ onGoBack }: { onGoBack?: () => void }) => {
  const { lang } = useLanguage();
  return (
    <div>
      {onGoBack && <BackButton onGoBack={onGoBack} />}
      <AdminChatPanel lang={lang} />
    </div>
  );
};

export default DashMessages;
