import { useLanguage } from '@/contexts/LanguageContext';
import AdminChatPanel from '@/components/shared/AdminChatPanel';

const DashMessages = () => {
  const { lang } = useLanguage();
  return <AdminChatPanel lang={lang} />;
};

export default DashMessages;
