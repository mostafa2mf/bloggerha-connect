import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Send, Loader2, MessageCircle, Check, CheckCheck, Mic, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Conversation {
  user_id: string;
  username: string;
  role: string;
  last_message: string;
  last_at: string;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  attachment_type?: string | null;
  attachment_url?: string | null;
}

const ADMIN_ID = '00000000-0000-0000-0000-000000000001';

const AdminMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchConversations(); }, []);

  const fetchConversations = async () => {
    setLoading(true);
    // Get all messages involving admin
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${ADMIN_ID},receiver_id.eq.${ADMIN_ID}`)
      .order('created_at', { ascending: false });

    if (!msgs) { setLoading(false); return; }

    // Group by user
    const userMap = new Map<string, { msgs: any[]; unread: number }>();
    for (const m of msgs) {
      const userId = m.sender_id === ADMIN_ID ? m.receiver_id : m.sender_id;
      if (!userMap.has(userId)) userMap.set(userId, { msgs: [], unread: 0 });
      const entry = userMap.get(userId)!;
      entry.msgs.push(m);
      if (m.sender_id !== ADMIN_ID && !m.is_read) entry.unread++;
    }

    // Get profiles
    const userIds = Array.from(userMap.keys());
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, role')
      .in('user_id', userIds);

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    const convs: Conversation[] = userIds.map(uid => {
      const entry = userMap.get(uid)!;
      const profile = profileMap.get(uid);
      const latest = entry.msgs[0];
      return {
        user_id: uid,
        username: profile?.username || 'Unknown',
        role: profile?.role || 'blogger',
        last_message: latest.content,
        last_at: latest.created_at,
        unread: entry.unread,
      };
    }).sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());

    setConversations(convs);
    setLoading(false);
  };

  const selectUser = async (userId: string) => {
    setSelectedUser(userId);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${ADMIN_ID}),and(sender_id.eq.${ADMIN_ID},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });
    setMessages((data as Message[]) || []);
    // Mark as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', userId)
      .eq('receiver_id', ADMIN_ID)
      .eq('is_read', false);
    fetchConversations();
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('admin-all-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id === ADMIN_ID || msg.receiver_id === ADMIN_ID) {
          const userId = msg.sender_id === ADMIN_ID ? msg.receiver_id : msg.sender_id;
          if (userId === selectedUser) {
            setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
          fetchConversations();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedUser]);

  const handleSend = async () => {
    if (!newMsg.trim() || !selectedUser) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      sender_id: ADMIN_ID,
      receiver_id: selectedUser,
      content: newMsg.trim(),
    });
    if (error) { toast.error('Failed to send'); }
    setNewMsg('');
    setSending(false);
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const selectedConv = conversations.find(c => c.user_id === selectedUser);

  return (
    <div className="glass rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 14rem)' }}>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className={`w-80 border-e border-border/40 flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'} flex-shrink-0`}>
          <div className="p-3 border-b border-border/30">
            <h3 className="text-sm font-bold flex items-center gap-2"><MessageCircle size={14} /> Conversations</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={20} /></div>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No messages yet</p>
            ) : (
              conversations.map(c => (
                <button
                  key={c.user_id}
                  onClick={() => selectUser(c.user_id)}
                  className={`w-full p-3 text-start hover:bg-muted/30 transition-colors border-b border-border/20 ${selectedUser === c.user_id ? 'bg-primary/10' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm truncate">{c.username}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${c.role === 'business' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                      {c.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">{c.last_message}</p>
                    {c.unread > 0 && (
                      <span className="w-5 h-5 rounded-full gradient-bg text-primary-foreground text-[9px] font-bold flex items-center justify-center">{c.unread}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {!selectedUser ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <MessageCircle size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Select a conversation</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-border/30 flex items-center gap-3">
                <button onClick={() => setSelectedUser(null)} className="md:hidden text-xs text-primary">← Back</button>
                <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {selectedConv?.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <h4 className="text-sm font-bold">{selectedConv?.username}</h4>
                  <span className="text-[10px] text-muted-foreground">{selectedConv?.role}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map(m => {
                  const isAdmin = m.sender_id === ADMIN_ID;
                  return (
                    <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                        isAdmin ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-ee-sm' : 'bg-muted/80 rounded-es-sm'
                      }`}>
                        {m.attachment_type === 'image' && m.attachment_url && (
                          <img src={m.attachment_url} alt="" className="rounded-xl max-w-[200px] mb-1" />
                        )}
                        {m.attachment_type === 'voice' && m.attachment_url && (
                          <audio controls src={m.attachment_url} className="max-w-[220px] mb-1" />
                        )}
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isAdmin ? 'justify-end' : ''}`}>
                          <span className="text-[9px] opacity-60">{formatTime(m.created_at)}</span>
                          {isAdmin && (m.is_read ? <CheckCheck size={10} className="opacity-70" /> : <Check size={10} className="opacity-50" />)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="p-3 border-t border-border/30 flex gap-2">
                <input
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Reply..."
                  className="flex-1 bg-background/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={sending || !newMsg.trim()}
                  className="p-2.5 rounded-xl gradient-bg text-primary-foreground disabled:opacity-50"
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </motion.button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
