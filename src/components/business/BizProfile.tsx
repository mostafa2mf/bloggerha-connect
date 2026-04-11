import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Building2, MapPin, Globe, Mail, Phone, Edit3, Save, Shield, Bell, Users, Image, Upload, X, CheckCircle, AlertCircle, AlertTriangle, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const MAX_IMAGES = 5;

const BizProfile = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [securityKeyword, setSecurityKeyword] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('username, display_name, avatar_url, images')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setUsername(data.username || '');
          setDisplayName(data.display_name || '');
          setAvatarUrl(data.avatar_url);
          setImages(data.images || []);
          setSecurityKeyword((data as any).security_keyword || '');
        }
      });
  }, [user]);

  const hasUsername = username.trim().length > 0;
  const hasPassword = password.trim().length >= 6;
  const hasMinImages = images.length >= MAX_IMAGES;
  const isProfileComplete = hasUsername && hasPassword && hasMinImages;

  const hasKeyword = securityKeyword.trim().length > 0;
  const healthItems = [
    { label: lang === 'fa' ? 'نام کاربری' : 'Username', done: hasUsername },
    { label: lang === 'fa' ? 'رمز عبور' : 'Password', done: hasPassword },
    { label: lang === 'fa' ? 'کلمه کلیدی امنیتی' : 'Security Keyword', done: hasKeyword },
    { label: lang === 'fa' ? `${MAX_IMAGES} تصویر (${images.length}/${MAX_IMAGES})` : `${MAX_IMAGES} images (${images.length}/${MAX_IMAGES})`, done: hasMinImages },
  ];

  const pct = Math.round((healthItems.filter(p => p.done).length / healthItems.length) * 100);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('profile-images').upload(path, file);
    if (error) { toast.error(error.message); return; }
    const { data: urlData } = supabase.storage.from('profile-images').getPublicUrl(path);
    const url = urlData.publicUrl;
    await supabase.from('profiles').update({ avatar_url: url }).eq('user_id', user.id);
    setAvatarUrl(url);
    toast.success(lang === 'fa' ? 'عکس پروفایل آپلود شد' : 'Avatar uploaded');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = MAX_IMAGES - images.length;
    Array.from(files).slice(0, remaining).forEach(file => {
      setImages(prev => [...prev, URL.createObjectURL(file)]);
    });
    toast.success(lang === 'fa' ? 'تصویر آپلود شد' : 'Image uploaded');
  };

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setSaving(true);
    if (user) {
      await supabase.from('profiles').update({
        username,
        display_name: displayName,
        images,
        security_keyword: securityKeyword.trim() || null,
      } as any).eq('user_id', user.id);
    }
    setSaving(false);
    setEditing(false);
    toast.success(lang === 'fa' ? 'پروفایل ذخیره شد' : 'Profile saved');
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {!isProfileComplete && (
        <motion.div variants={item} className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle size={20} className="text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-300">{lang === 'fa' ? 'پروفایل ناقص است' : 'Profile is incomplete'}</p>
            <p className="text-xs text-amber-400/70 mt-0.5">{lang === 'fa' ? `نام کاربری، رمز عبور و ${MAX_IMAGES} تصویر الزامی است` : `Username, password, and ${MAX_IMAGES} images required`}</p>
          </div>
        </motion.div>
      )}

      {/* Brand Header with Avatar Circle */}
      <motion.div variants={item} className="relative">
        <div className="h-32 rounded-3xl overflow-hidden glass">
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-transparent" />
        </div>
        <div className="flex flex-col items-center -mt-12 relative z-10">
          <div
            className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-background shadow-lg shadow-primary/30 cursor-pointer relative group"
            onClick={() => avatarRef.current?.click()}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full gradient-bg flex items-center justify-center text-3xl font-bold text-primary-foreground">
                <Building2 size={36} />
              </div>
            )}
            <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload size={18} className="text-foreground" />
            </div>
          </div>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <h2 className="text-xl font-extrabold mt-3">{displayName || username || '...'}</h2>
          <p className="text-sm text-muted-foreground">@{username}</p>
        </div>
      </motion.div>

      {/* Profile Completion + Brand Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={item} className="glass rounded-3xl p-5 border border-primary/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold">{lang === 'fa' ? 'تکمیل پروفایل' : 'Profile Completion'}</h3>
            <span className={`text-sm font-bold ${isProfileComplete ? 'text-green-400' : 'text-primary'}`}>{pct}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-muted mb-4 overflow-hidden">
            <motion.div className={`h-full rounded-full ${isProfileComplete ? 'bg-green-500' : 'gradient-bg'}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.3 }} />
          </div>
          {isProfileComplete && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-xs text-green-400 font-bold">{lang === 'fa' ? 'پروفایل کامل است!' : 'Profile complete!'}</span>
            </div>
          )}
          <div className="space-y-2">
            {healthItems.map((hi, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {hi.done ? <CheckCircle size={16} className="text-green-400" /> : <AlertCircle size={16} className="text-orange-400" />}
                <span className={hi.done ? 'text-muted-foreground' : 'font-bold'}>{hi.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><User size={12} /> {lang === 'fa' ? 'نام کاربری *' : 'Username *'}</label>
              <input value={username} onChange={e => setUsername(e.target.value)} disabled={!editing} className="w-full glass rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 transition-all" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Lock size={12} /> {lang === 'fa' ? 'رمز عبور *' : 'Password *'}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={!editing} placeholder={lang === 'fa' ? 'حداقل ۶ کاراکتر' : 'Min 6 chars'} className="w-full glass rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 transition-all" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Shield size={12} /> {lang === 'fa' ? 'کلمه کلیدی امنیتی (حداکثر ۲ کلمه)' : 'Security Keyword (max 2 words)'}</label>
              <input value={securityKeyword} onChange={e => setSecurityKeyword(e.target.value)} disabled={!editing} placeholder={lang === 'fa' ? 'مثلاً: گربه سفید' : 'e.g.: white cat'} className="w-full glass rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 transition-all" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass rounded-3xl p-5 space-y-3 border border-primary/10">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold">{lang === 'fa' ? 'اطلاعات برند' : 'Brand Info'}</h3>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => editing ? handleSave() : setEditing(true)}
              disabled={saving}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 disabled:opacity-50 ${editing ? 'gradient-bg text-primary-foreground' : 'glass hover:glow-border'}`}
            >
              {saving ? <span className="animate-spin w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full" /> : editing ? <><Save size={14} /> {lang === 'fa' ? 'ذخیره' : 'Save'}</> : <><Edit3 size={14} /> {lang === 'fa' ? 'ویرایش' : 'Edit'}</>}
            </motion.button>
          </div>
          <div className="space-y-3">
            {[
              { icon: Building2, label: lang === 'fa' ? 'نام برند' : 'Brand Name', value: displayName || '...' },
              { icon: MapPin, label: lang === 'fa' ? 'شهر' : 'City', value: 'تهران' },
              { icon: Mail, label: lang === 'fa' ? 'ایمیل' : 'Email', value: user?.email || '...' },
              { icon: Phone, label: lang === 'fa' ? 'تلفن' : 'Phone', value: '—' },
              { icon: Globe, label: lang === 'fa' ? 'وبسایت' : 'Website', value: '—' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <f.icon size={16} className="text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <div className="text-[10px] text-muted-foreground">{f.label}</div>
                  {editing ? (
                    <input defaultValue={f.value} className="w-full bg-transparent text-sm font-medium border-b border-border focus:border-primary focus:outline-none pb-0.5 transition-colors" />
                  ) : (
                    <div className="text-sm font-medium">{f.value}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Image Upload */}
      <motion.div variants={item} className="glass rounded-3xl p-5 border border-primary/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold flex items-center gap-2">
            <Image size={18} />
            {lang === 'fa' ? `تصاویر پروفایل (${images.length}/${MAX_IMAGES})` : `Profile Images (${images.length}/${MAX_IMAGES})`}
          </h3>
          {hasMinImages ? (
            <span className="text-xs text-green-400 font-bold flex items-center gap-1"><CheckCircle size={12} /> {lang === 'fa' ? 'کامل' : 'Complete'}</span>
          ) : (
            <span className="text-xs text-orange-400 font-bold">{lang === 'fa' ? `${MAX_IMAGES - images.length} تصویر دیگر` : `${MAX_IMAGES - images.length} more`}</span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={() => removeImage(i)} className="p-2 rounded-full bg-destructive/80 text-primary-foreground hover:bg-destructive transition-colors"><X size={16} /></button>
              </div>
            </div>
          ))}
          {images.length < MAX_IMAGES && Array.from({ length: MAX_IMAGES - images.length }).map((_, i) => (
            <motion.button key={`e-${i}`} whileTap={{ scale: 0.95 }} onClick={() => fileRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/60 hover:text-primary transition-all cursor-pointer">
              <Upload size={20} />
            </motion.button>
          ))}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
      </motion.div>

      {/* Settings */}
      <motion.div variants={item} className="space-y-2">
        {[
          { icon: Shield, label: lang === 'fa' ? 'امنیت' : 'Security', desc: lang === 'fa' ? 'رمز عبور و احراز هویت' : 'Password & auth' },
          { icon: Bell, label: lang === 'fa' ? 'اعلان‌ها' : 'Notifications', desc: lang === 'fa' ? 'تنظیمات اعلان‌ها' : 'Notification settings' },
          { icon: Users, label: lang === 'fa' ? 'تیم' : 'Team', desc: lang === 'fa' ? 'مدیریت اعضای تیم' : 'Team members' },
        ].map((s, i) => (
          <motion.button key={i} whileTap={{ scale: 0.98 }} className="w-full glass rounded-2xl p-4 flex items-center gap-3 text-start hover:glow-border transition-all duration-300 border border-primary/5">
            <div className="p-2 rounded-xl bg-primary/10"><s.icon size={18} className="text-primary" /></div>
            <div>
              <div className="text-sm font-bold">{s.label}</div>
              <div className="text-[10px] text-muted-foreground">{s.desc}</div>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default BizProfile;
