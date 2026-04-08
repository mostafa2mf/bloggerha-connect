import { useLanguage } from '@/contexts/LanguageContext';
import ChatPanel from '@/components/shared/ChatPanel';

const BizMessages = () => {
  const { lang } = useLanguage();
  return <ChatPanel lang={lang} />;
};

export default BizMessages;
