import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, X, Check, CheckCheck, MessageCircle, Megaphone, UserCheck, AlertTriangle, Clock, Loader2, Star } from 'lucide-react';

interface Notification {
  id: string;
  icon: any;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: 'invite' | 'profile' | 'admin' | 'campaign' | 'reminder' | 'application' | 'review';
}

const bloggerNotifs: Notification[] = [
  { id: '1', icon: Megaphone, title: 'دعوت جدید', desc: 'برند لوکس شما را به کمپین زیبایی دعوت کرد', time: '۵ دقیقه پیش', read: false, type: 'invite' },
  { id: '2', icon: AlertTriangle, title: 'پروفایل ناقص', desc: 'برای دریافت دعوت‌ها، پروفایل خود را تکمیل کنید', time: '۱ ساعت پیش', read: false, type: 'profile' },
  { id: '3', icon: MessageCircle, title: 'پاسخ ادمین', desc: 'ادمین به پیام شما پاسخ داد', time: '۲ ساعت پیش', read: true, type: 'admin' },
  { id: '4', icon: Star, title: 'بروزرسانی کمپین', desc: 'کمپین «فشن بهاره» وضعیت جدیدی دارد', time: '۳ ساعت پیش', read: true, type: 'campaign' },
  { id: '5', icon: Clock, title: 'یادآوری', desc: 'مهلت ارسال محتوا فردا به پایان می‌رسد', time: 'دیروز', read: true, type: 'reminder' },
];

const businessNotifs: Notification[] = [
  { id: '1', icon: UserCheck, title: 'درخواست جدید', desc: 'سارا احمدی برای کمپین زیبایی درخواست داد', time: '۱۰ دقیقه پیش', read: false, type: 'application' },
  { id: '2', icon: Megaphone, title: 'بروزرسانی کمپین', desc: 'کمپین «فشن استایل» فعال شد', time: '۳۰ دقیقه پیش', read: false, type: 'campaign' },
  { id: '3', icon: MessageCircle, title: 'پاسخ ادمین', desc: 'ادمین به درخواست شما پاسخ داد', time: '۱ ساعت پیش', read: true, type: 'admin' },
  { id: '4', icon: AlertTriangle, title: 'پروفایل ناقص', desc: '۵ تصویر پروفایل آپلود کنید', time: '۲ ساعت پیش', read: false, type: 'profile' },
  { id: '5', icon: Star, title: 'یادآوری بررسی', desc: '۳ درخواست بلاگر منتظر بررسی هستند', time: 'دیروز', read: true, type: 'review' },
];

const typeColors: Record<string, string> = {
  invite: 'bg-blue-500/10 text-blue-400',
  profile: 'bg-amber-500/10 text-amber-400',
  admin: 'bg-green-500/10 text-green-400',
  campaign: 'bg-purple-500/10 text-purple-400',
  reminder: 'bg-orange-500/10 text-orange-400',
  application: 'bg-cyan-500/10 text-cyan-400',
  review: 'bg-pink-500/10 text-pink-400',
};

interface NotificationBellProps {
  role: 'blogger' | 'business';
}

const NotificationBell = ({ role }: NotificationBellProps) => {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>(role === 'blogger' ? bloggerNotifs : businessNotifs);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl glass hover:glow-border transition-all duration-200"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-[10px] text-white flex items-center justify-center font-bold shadow-lg shadow-amber-500/30"
          >
            {unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute top-full mt-2 end-0 w-80 sm:w-96 glass-strong rounded-2xl shadow-2xl shadow-black/20 z-[100] overflow-hidden border border-border/30"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/30">
                <h3 className="text-sm font-bold">{lang === 'fa' ? 'اعلان‌ها' : 'Notifications'}</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] text-primary hover:underline">
                      {lang === 'fa' ? 'خواندن همه' : 'Mark all read'}
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Notifications list */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={20} /></div>
                ) : notifs.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs text-muted-foreground">{lang === 'fa' ? 'اعلانی ندارید' : 'No notifications'}</p>
                  </div>
                ) : (
                  notifs.map((n) => (
                    <motion.button
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                      className={`w-full flex items-start gap-3 p-4 text-start transition-all border-b border-border/10 ${!n.read ? 'bg-primary/5' : ''}`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${typeColors[n.type]}`}>
                        <n.icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${!n.read ? 'font-bold' : 'font-medium'}`}>{n.title}</span>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.desc}</p>
                        <span className="text-[10px] text-muted-foreground/60 mt-1 block">{n.time}</span>
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
