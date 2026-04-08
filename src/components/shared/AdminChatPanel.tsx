import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { syncChatMessage, fetchAdminMessages } from '@/lib/adminSync';
import { Send, Loader2, MessageCircle, Check, CheckCheck, Paperclip, Image, Video, Mic, X, AlertCircle, MicOff } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  attachment_type?: 'image' | 'video' | 'voice' | null;
  attachment_url?: string | null;
  status?: 'sending' | 'sent' | 'failed';
}

interface Props {
  lang: 'fa' | 'en';
}

const ADMIN_ID = '00000000-0000-0000-0000-000000000001';

const AdminChatPanel = ({ lang }: Props) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachPreview, setAttachPreview] = useState<{ type: 'image' | 'video' | 'voice'; url: string; file: File } | null>(null);
  const [recording, setRecording] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchMessages();
    // Poll for admin replies every 15s
    const interval = setInterval(() => {
      fetchAdminMessages(user.id).then(() => fetchMessages()).catch(console.error);
    }, 15000);
    // Initial fetch of admin messages
    fetchAdminMessages(user.id).catch(console.error);
    return () => clearInterval(interval);
  }, [user]);

  const fetchMessages = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${ADMIN_ID}),and(sender_id.eq.${ADMIN_ID},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true });
    setMessages((data as Message[]) || []);
    // Mark as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', ADMIN_ID)
      .eq('receiver_id', user.id)
      .eq('is_read', false);
    setLoading(false);
  };

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('admin-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as Message;
        if ((msg.sender_id === ADMIN_ID && msg.receiver_id === user.id) ||
            (msg.sender_id === user.id && msg.receiver_id === ADMIN_ID)) {
          setMessages(prev => [...prev, msg]);
          if (msg.receiver_id === user.id) {
            supabase.from('messages').update({ is_read: true }).eq('id', msg.id).then(() => {});
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if ((!newMsg.trim() && !attachPreview) || !user) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: ADMIN_ID,
      content: newMsg.trim() || (attachPreview ? `[${attachPreview.type}]` : ''),
    });
    setSending(false);
    if (error) {
      toast.error(lang === 'fa' ? 'خطا در ارسال پیام' : 'Failed to send');
      return;
    }
    setNewMsg('');
    setAttachPreview(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachPreview({ type, url: URL.createObjectURL(file), file });
    }
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
      toast.error(lang === 'fa' ? 'دسترسی به میکروفون رد شد' : 'Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString(lang === 'fa' ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSep = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages: { date: string; msgs: Message[] }[] = [];
  messages.forEach(m => {
    const dateKey = new Date(m.created_at).toDateString();
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === dateKey) {
      last.msgs.push(m);
    } else {
      groupedMessages.push({ date: dateKey, msgs: [m] });
    }
  });

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] rounded-3xl overflow-hidden glass">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-amber-500/30">
          A
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold">{lang === 'fa' ? 'پشتیبانی ادمین' : 'Admin Support'}</h3>
          <span className="text-[10px] text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {lang === 'fa' ? 'آنلاین' : 'Online'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <MessageCircle size={28} className="text-primary" />
            </div>
            <h3 className="text-base font-bold mb-1">{lang === 'fa' ? 'شروع گفتگو با ادمین' : 'Start a conversation'}</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              {lang === 'fa' ? 'هر سوالی دارید، متن، تصویر، ویدیو یا پیام صوتی ارسال کنید' : 'Send text, images, videos or voice messages'}
            </p>
          </div>
        ) : (
          groupedMessages.map((group, gi) => (
            <div key={gi}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border/30" />
                <span className="text-[10px] text-muted-foreground/60 font-medium">{formatDateSep(group.msgs[0].created_at)}</span>
                <div className="flex-1 h-px bg-border/30" />
              </div>
              {group.msgs.map(m => {
                const isMine = m.sender_id === user?.id;
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex mb-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMine
                        ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-ee-sm'
                        : 'bg-muted/80 rounded-es-sm'
                    }`}>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                        <span className="text-[9px] opacity-60">{formatTime(m.created_at)}</span>
                        {isMine && (m.is_read
                          ? <CheckCheck size={10} className="opacity-70" />
                          : <Check size={10} className="opacity-50" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Attachment Preview */}
      <AnimatePresence>
        {attachPreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 border-t border-border/30"
          >
            <div className="flex items-center gap-3 py-3">
              {attachPreview.type === 'image' && (
                <img src={attachPreview.url} alt="" className="w-16 h-16 rounded-xl object-cover" />
              )}
              {attachPreview.type === 'video' && (
                <video src={attachPreview.url} className="w-20 h-16 rounded-xl object-cover" />
              )}
              {attachPreview.type === 'voice' && (
                <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
                  <Mic size={14} className="text-primary" />
                  <span className="text-xs">{lang === 'fa' ? 'پیام صوتی' : 'Voice message'}</span>
                </div>
              )}
              <button onClick={() => setAttachPreview(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          {/* Attachment buttons */}
          <div className="flex items-center gap-1">
            <button onClick={() => fileRef.current?.click()} className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors" title={lang === 'fa' ? 'تصویر' : 'Image'}>
              <Image size={18} />
            </button>
            <button onClick={() => videoRef.current?.click()} className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors" title={lang === 'fa' ? 'ویدیو' : 'Video'}>
              <Video size={18} />
            </button>
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`p-2 rounded-xl transition-colors ${recording ? 'bg-red-500/20 text-red-400 animate-pulse' : 'hover:bg-muted/50 text-muted-foreground hover:text-primary'}`}
              title={lang === 'fa' ? 'صدا' : 'Voice'}
            >
              {recording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          </div>

          <input
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={lang === 'fa' ? 'پیام به ادمین...' : 'Message admin...'}
            className="flex-1 bg-background/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={sending || (!newMsg.trim() && !attachPreview)}
            className="p-2.5 rounded-xl gradient-bg text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </motion.button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, 'image')} />
      <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => handleFileSelect(e, 'video')} />
    </div>
  );
};

export default AdminChatPanel;
