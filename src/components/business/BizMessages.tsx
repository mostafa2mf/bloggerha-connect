import { useLanguage } from '@/contexts/LanguageContext';
import AdminChatPanel from '@/components/shared/AdminChatPanel';
import BackButton from '@/components/shared/BackButton';

const BizMessages = ({ onGoBack }: { onGoBack?: () => void }) => {
  const { lang } = useLanguage();
  return (
    <div>
      {onGoBack && <BackButton onGoBack={onGoBack} />}
      <AdminChatPanel lang={lang} chatLabel={lang === 'fa' ? 'تیام ۳' : 'Tiam 3'} />
    </div>
  );
};

export default BizMessages;
