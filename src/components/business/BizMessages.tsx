import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, Send } from 'lucide-react';

const conversations = [
  { name: 'سارا احمدی', lastMsg: 'سلام، درباره کمپین زیبایی سوال داشتم...', time: '۵ دقیقه', unread: 2, avatar: 'S' },
  { name: 'علی تکنولوژی', lastMsg: 'محتوا آماده‌ست، کجا آپلود کنم؟', time: '۱ ساعت', unread: 0, avatar: 'ع' },
  { name: 'مینا فشن', lastMsg: 'ممنون از دعوتتون!', time: '۳ ساعت', unread: 1, avatar: 'م' },
  { name: 'رضا فودی', lastMsg: 'عکس‌های نهایی رو فرستادم', time: 'دیروز', unread: 0, avatar: 'ر' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const BizMessages = () => {
  const { t } = useLanguage();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.h1 variants={item} className="text-2xl font-bold gradient-text">{t('biz.messages')}</motion.h1>

      <motion.div variants={item} className="relative">
        <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={t('biz.searchMessages')}
          className="w-full glass rounded-xl ps-10 pe-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </motion.div>

      <div className="space-y-2">
        {conversations.map((c, i) => (
          <motion.button
            key={i}
            variants={item}
            whileTap={{ scale: 0.98 }}
            className="w-full glass rounded-2xl p-4 flex items-center gap-3 text-start hover:glow-border transition-all duration-300"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-lg font-bold text-primary-foreground shrink-0">
                {c.avatar}
              </div>
              {c.unread > 0 && (
                <span className="absolute -top-1 -end-1 w-5 h-5 gradient-bg rounded-full text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                  {c.unread}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm ${c.unread > 0 ? 'font-bold' : 'font-medium'}`}>{c.name}</h3>
                <span className="text-[10px] text-muted-foreground">{c.time}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{c.lastMsg}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Quick compose placeholder */}
      <motion.div variants={item} className="glass rounded-2xl p-3 flex items-center gap-2">
        <input
          type="text"
          placeholder={t('biz.typeMessage')}
          className="flex-1 bg-transparent text-sm focus:outline-none"
        />
        <motion.button whileTap={{ scale: 0.95 }} className="p-2 rounded-xl gradient-bg text-primary-foreground">
          <Send size={16} />
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default BizMessages;
