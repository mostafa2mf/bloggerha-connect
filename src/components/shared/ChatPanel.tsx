import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Search, Send, ArrowRight, Loader2, MessageCircle, Check, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Conversation {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  role: string;
  last_message: string;
  last_time: string;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Props {
  lang: 'fa' | 'en';
}

const ChatPanel = ({ lang }: Props) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      setLoading(true);
      // Get all messages involving this user
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!msgs || msgs.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Group by other user
      const convMap = new Map<string, { lastMsg: string; lastTime: string; unread: number }>();
      for (const m of msgs) {
        const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (!convMap.has(otherId)) {
          convMap.set(otherId, {
            lastMsg: m.content,
            lastTime: m.created_at,
            unread: (!m.is_read && m.receiver_id === user.id) ? 1 : 0,
          });
        } else {
          const existing = convMap.get(otherId)!;
          if (!m.is_read && m.receiver_id === user.id) {
            existing.unread += 1;
          }
        }
      }

      // Fetch profiles
      const otherIds = Array.from(convMap.keys());
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, role')
        .in('user_id', otherIds);

      const convs: Conversation[] = otherIds.map(id => {
        const profile = profiles?.find(p => p.user_id === id);
        const conv = convMap.get(id)!;
        return {
          user_id: id,
          display_name: profile?.display_name || profile?.username || 'Unknown',
          username: profile?.username || '',
          avatar_url: profile?.avatar_url || null,
          role: profile?.role || 'blogger',
          last_message: conv.lastMsg,
          last_time: conv.lastTime,
          unread: conv.unread,
        };
      });

      setConversations(convs);
      setLoading(false);
    };

    fetchConversations();
  }, [user]);

  // Fetch messages for active chat
  useEffect(() => {
    if (!user || !activeChat) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${activeChat}),and(sender_id.eq.${activeChat},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      setMessages((data as Message[]) || []);

      // Mark as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', activeChat)
        .eq('receiver_id', user.id)
        .eq('is_read', false);
    };

    fetchMessages();
  }, [activeChat, user]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id === user.id || msg.receiver_id === user.id) {
            if (activeChat && (msg.sender_id === activeChat || msg.receiver_id === activeChat)) {
              setMessages(prev => [...prev, msg]);
              // Mark as read if we're in the chat
              if (msg.receiver_id === user.id) {
                supabase.from('messages').update({ is_read: true }).eq('id', msg.id).then(() => {});
              }
            }
            // Update conversations
            setConversations(prev => {
              const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
              const existing = prev.find(c => c.user_id === otherId);
              if (existing) {
                return prev.map(c => c.user_id === otherId ? {
                  ...c,
                  last_message: msg.content,
                  last_time: msg.created_at,
                  unread: (msg.receiver_id === user.id && activeChat !== otherId) ? c.unread + 1 : c.unread,
                } : c);
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, activeChat]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !user || !activeChat) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: activeChat,
      content: newMsg.trim(),
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewMsg('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeConv = conversations.find(c => c.user_id === activeChat);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString(lang === 'fa' ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredConvs = conversations.filter(c =>
    c.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-10rem)] rounded-3xl overflow-hidden glass">
      {/* Conversation list */}
      <div className={`${activeChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-e border-border/50`}>
        <div className="p-4 border-b border-border/50">
          <h2 className="text-lg font-bold mb-3">{lang === 'fa' ? 'پیام‌ها' : 'Messages'}</h2>
          <div className="relative">
            <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={lang === 'fa' ? 'جستجو...' : 'Search...'}
              className="w-full bg-background/50 border border-border rounded-xl ps-9 pe-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={20} /></div>
          ) : filteredConvs.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs text-muted-foreground">{lang === 'fa' ? 'هنوز پیامی ندارید' : 'No messages yet'}</p>
            </div>
          ) : (
            filteredConvs.map(c => (
              <button
                key={c.user_id}
                onClick={() => setActiveChat(c.user_id)}
                className={`w-full flex items-center gap-3 p-4 text-start transition-all hover:bg-muted/50 ${
                  activeChat === c.user_id ? 'bg-primary/5 border-s-2 border-primary' : ''
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-sm font-bold text-primary-foreground">
                    {c.display_name[0]}
                  </div>
                  {c.unread > 0 && (
                    <span className="absolute -top-0.5 -end-0.5 w-4 h-4 gradient-bg rounded-full text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                      {c.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${c.unread > 0 ? 'font-bold' : 'font-medium'}`}>{c.display_name}</span>
                    <span className="text-[10px] text-muted-foreground">{formatTime(c.last_time)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{c.last_message}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-col flex-1`}>
        {activeChat && activeConv ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 p-4 border-b border-border/50">
              <button onClick={() => setActiveChat(null)} className="md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors">
                <ArrowRight size={18} />
              </button>
              <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-sm font-bold text-primary-foreground">
                {activeConv.display_name[0]}
              </div>
              <div>
                <h3 className="text-sm font-bold">{activeConv.display_name}</h3>
                <span className="text-[10px] text-muted-foreground">@{activeConv.username}</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence>
                {messages.map(m => {
                  const isMine = m.sender_id === user?.id;
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                        isMine
                          ? 'gradient-bg text-primary-foreground rounded-ee-sm'
                          : 'bg-muted rounded-es-sm'
                      }`}>
                        <p>{m.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                          <span className="text-[9px] opacity-70">{formatTime(m.created_at)}</span>
                          {isMine && (m.is_read ? <CheckCheck size={10} className="opacity-70" /> : <Check size={10} className="opacity-50" />)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <input
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={lang === 'fa' ? 'پیام بنویسید...' : 'Type a message...'}
                  className="flex-1 bg-background/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={sending || !newMsg.trim()}
                  className="p-2.5 rounded-xl gradient-bg text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <MessageCircle size={28} className="text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-1">{lang === 'fa' ? 'پیام‌رسانی' : 'Messaging'}</h3>
            <p className="text-sm text-muted-foreground">{lang === 'fa' ? 'یک مکالمه انتخاب کنید یا پیام جدید بفرستید' : 'Select a conversation or start a new one'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
