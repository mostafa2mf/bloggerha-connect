import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Send, Loader2, MessageCircle, Check, CheckCheck, Image, Mic, X, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { validateFile } from '@/lib/fileValidation';

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

const dbg = (tag: string, ...args: unknown[]) => {
  console.log(`[MSG:AdminPanel][${tag}]`, ...args);
};

const AdminMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachPreview, setAttachPreview] = useState<{ type: 'image' | 'voice'; url: string; file: File } | null>(null);
  const [recording, setRecording] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const adminId = user?.id;

  useEffect(() => {
    if (!adminId) return;
    dbg('init', 'adminId=', adminId);
    fetchConversations();
  }, [adminId]);

  const fetchConversations = async () => {
    if (!adminId) return;
    setLoading(true);
    dbg('fetchConvs', 'loading conversations for admin=', adminId);
    const { data: msgs, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${adminId},receiver_id.eq.${adminId}`)
      .order('created_at', { ascending: false });

    if (error) {
      dbg('fetchConvs-error', error.message, error.code, error.details);
      setLoading(false);
      return;
    }
    if (!msgs || msgs.length === 0) {
      dbg('fetchConvs', 'no messages found');
      setConversations([]);
      setLoading(false);
      return;
    }
    dbg('fetchConvs', 'total msgs=', msgs.length);

    const userMap = new Map<string, { msgs: any[]; unread: number }>();
    for (const m of msgs) {
      const userId = m.sender_id === adminId ? m.receiver_id : m.sender_id;
      if (!userMap.has(userId)) userMap.set(userId, { msgs: [], unread: 0 });
      const entry = userMap.get(userId)!;
      entry.msgs.push(m);
      if (m.sender_id !== adminId && !m.is_read) entry.unread++;
    }

    const userIds = Array.from(userMap.keys());
    dbg('fetchConvs', 'unique users=', userIds.length);

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
    if (!adminId) return;
    setSelectedUser(userId);
    dbg('selectUser', userId);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${adminId}),and(sender_id.eq.${adminId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });
    if (error) {
      dbg('selectUser-error', error.message, error.code);
    } else {
      dbg('selectUser-ok', 'count=', data?.length);
    }
    setMessages((data as Message[]) || []);
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', userId)
      .eq('receiver_id', adminId)
      .eq('is_read', false);
    fetchConversations();
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime
  useEffect(() => {
    if (!adminId) return;
    const channel = supabase
      .channel('admin-all-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as Message;
        dbg('realtime', msg.id, 'sender=', msg.sender_id, 'receiver=', msg.receiver_id);
        if (msg.sender_id === adminId || msg.receiver_id === adminId) {
          const userId = msg.sender_id === adminId ? msg.receiver_id : msg.sender_id;
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
  }, [adminId, selectedUser]);

  const uploadAttachment = async (file: File, type: 'image' | 'voice'): Promise<string | null> => {
    if (!adminId) return null;
    const ext = type === 'voice' ? 'webm' : file.name.split('.').pop();
    const path = `chat/admin/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('profile-images').upload(path, file);
    if (error) { dbg('upload-err', error); return null; }
    const { data: urlData } = supabase.storage.from('profile-images').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSend = async () => {
    if ((!newMsg.trim() && !attachPreview) || !selectedUser || !adminId) return;
    setSending(true);

    let attachment_url: string | null = null;
    let attachment_type: string | null = null;

    if (attachPreview) {
      attachment_url = await uploadAttachment(attachPreview.file, attachPreview.type);
      attachment_type = attachPreview.type;
      dbg('send-attach', attachment_type, attachment_url ? 'uploaded' : 'failed');
    }

    const content = newMsg.trim() || (attachment_type === 'image' ? '📷 تصویر' : attachment_type === 'voice' ? '🎙️ پیام صوتی' : '');

    const payload = {
      sender_id: adminId,
      receiver_id: selectedUser,
      content,
      attachment_type,
      attachment_url,
    };
    dbg('send', payload);
    const { error } = await supabase.from('messages').insert(payload);
    if (error) {
      dbg('send-error', error.message, error.code, error.details, error.hint);
      toast.error('Failed to send: ' + error.message);
    } else {
      dbg('send-ok');
    }
    setNewMsg('');
    setAttachPreview(null);
    setSending(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateFile(file, 'fa');
    if (!validation.valid) { toast.error(validation.error); return; }
    setAttachPreview({ type: 'image', url: URL.createObjectURL(file), file });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], 'voice.webm', { type: 'audio/webm' });
        setAttachPreview({ type: 'voice', url: URL.createObjectURL(blob), file });
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const selectedConv = conversations.find(c => c.user_id === selectedUser);

  return (
    <div className="glass rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 14rem)' }}>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className={`w-80 border-e border-border/40 flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'} flex-shrink-0`}>
          <div className="p-3 border-b border-border/30">
            <h3 className="text-sm font-bold flex items-center gap-2"><MessageCircle size={14} /> تیام — پیام‌ها</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={20} /></div>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">هنوز پیامی ندارید</p>
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
                <p className="text-sm text-muted-foreground">یک مکالمه انتخاب کنید</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-border/30 flex items-center gap-3">
                <button onClick={() => setSelectedUser(null)} className="md:hidden text-xs text-primary">← بازگشت</button>
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
                  const isAdmin = m.sender_id === adminId;
                  return (
                    <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                        isAdmin ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-ee-sm' : 'bg-muted/80 rounded-es-sm'
                      }`}>
                        {m.attachment_type === 'image' && m.attachment_url && (
                          <img src={m.attachment_url} alt="" className="rounded-xl max-w-[200px] mb-1 cursor-pointer hover:opacity-80" onClick={() => window.open(m.attachment_url!, '_blank')} />
                        )}
                        {m.attachment_type === 'voice' && m.attachment_url && (
                          <audio controls src={m.attachment_url} className="max-w-[220px] mb-1" />
                        )}
                        {m.content && !(m.attachment_type && (m.content === '📷 تصویر' || m.content === '🎙️ پیام صوتی')) && (
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        )}
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

              {/* Attachment Preview */}
              {attachPreview && (
                <div className="px-3 border-t border-border/30">
                  <div className="flex items-center gap-3 py-2">
                    {attachPreview.type === 'image' && <img src={attachPreview.url} alt="" className="w-12 h-12 rounded-xl object-cover" />}
                    {attachPreview.type === 'voice' && (
                      <div className="flex items-center gap-2 glass rounded-xl px-3 py-1.5">
                        <Mic size={12} className="text-primary" />
                        <span className="text-xs">پیام صوتی</span>
                      </div>
                    )}
                    <button onClick={() => setAttachPreview(null)} className="p-1 rounded-lg hover:bg-muted">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}

              <div className="p-3 border-t border-border/30 flex gap-2">
                <div className="flex items-center gap-1">
                  <button onClick={() => fileRef.current?.click()} className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors">
                    <Image size={16} />
                  </button>
                  <button
                    onClick={recording ? stopRecording : startRecording}
                    className={`p-2 rounded-xl transition-colors ${recording ? 'bg-red-500/20 text-red-400 animate-pulse' : 'hover:bg-muted/50 text-muted-foreground hover:text-primary'}`}
                  >
                    {recording ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                </div>
                <input
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="پاسخ..."
                  className="flex-1 bg-background/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={sending || (!newMsg.trim() && !attachPreview)}
                  className="p-2.5 rounded-xl gradient-bg text-primary-foreground disabled:opacity-50"
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </motion.button>
              </div>
            </>
          )}
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
    </div>
  );
};

export default AdminMessages;
