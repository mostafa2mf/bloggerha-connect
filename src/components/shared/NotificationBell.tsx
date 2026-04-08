import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Bell, X, CheckCheck, MessageCircle, Megaphone, UserCheck, AlertTriangle, Clock, Loader2, Star, CheckCircle2, XCircle } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  entity_type?: string;
}

const typeIcons: Record<string, any> = {
  approval: CheckCircle2,
  rejection: XCircle,
  invite: Megaphone,
  profile: AlertTriangle,
  admin: MessageCircle,
  campaign: Megaphone,
  reminder: Clock,
  application: UserCheck,
  review: Star,
  info: Bell,
};

const typeColors: Record<string, string> = {
  approval: 'bg-green-500/10 text-green-400',
  rejection: 'bg-red-500/10 text-red-400',
  invite: 'bg-blue-500/10 text-blue-400',
  profile: 'bg-amber-500/10 text-amber-400',
  admin: 'bg-green-500/10 text-green-400',
  campaign: 'bg-purple-500/10 text-purple-400',
  reminder: 'bg-orange-500/10 text-orange-400',
  application: 'bg-cyan-500/10 text-cyan-400',
  review: 'bg-pink-500/10 text-pink-400',
  info: 'bg-muted text-muted-foreground',
};

function timeAgo(dateStr: string, lang: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === 'fa' ? 'الان' : 'Just now';
  if (mins < 60) return lang === 'fa' ? `${mins} دقیقه پیش` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return lang === 'fa' ? `${hrs} ساعت پیش` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return lang === 'fa' ? `${days} روز پیش` : `${days}d ago`;
}

interface NotificationBellProps {
  role?: 'blogger' | 'business';
}

const NotificationBell = ({ role }: NotificationBellProps) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifs((data as Notification[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30s
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifs.filter(n => !n.is_read).length;

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = notifs.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    for (const id of unreadIds) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    }
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
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

              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={20} /></div>
                ) : notifs.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs text-muted-foreground">{lang === 'fa' ? 'اعلانی ندارید' : 'No notifications'}</p>
                  </div>
                ) : (
                  notifs.map((n) => {
                    const Icon = typeIcons[n.type] || Bell;
                    return (
                      <motion.button
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                        className={`w-full flex items-start gap-3 p-4 text-start transition-all border-b border-border/10 ${!n.is_read ? 'bg-primary/5' : ''}`}
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${typeColors[n.type] || typeColors.info}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${!n.is_read ? 'font-bold' : 'font-medium'}`}>{n.title}</span>
                            {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-muted-foreground/60 mt-1 block">{timeAgo(n.created_at, lang)}</span>
                        </div>
                      </motion.button>
                    );
                  })
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
