import { useLanguage } from '@/contexts/LanguageContext';
import ChatPanel from '@/components/shared/ChatPanel';

const DashMessages = () => {
  const { lang } = useLanguage();
  return <ChatPanel lang={lang} />;
};

export default DashMessages;
