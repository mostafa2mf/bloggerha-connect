import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Instagram, MapPin, Edit3, Save, Users, CheckCircle, AlertCircle, Upload, X, Image, AlertTriangle, Loader2, Key } from 'lucide-react';
import { toast } from 'sonner';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const MAX_IMAGES = 5;

const DashProfile = ({ onGoBack }: { onGoBack?: () => void }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState('');
  const [insta, setInsta] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('تهران');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [securityKeyword, setSecurityKeyword] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setBio(data.bio || '');
      setInsta(data.instagram || '');
      setDisplayName(data.display_name || data.username);
      setCity(data.city || 'تهران');
      setAvatarUrl(data.avatar_url);
      setImages(data.images || []);
      setFollowersCount(data.followers_count || 0);
      setSecurityKeyword((data as any).security_keyword || '');
    }
    setLoading(false);
  };

  const hasMinImages = images.length >= MAX_IMAGES;
  const healthItems = [
    { label: lang === 'fa' ? 'نام نمایشی' : 'Display Name', done: displayName.trim().length > 0 },
    { label: lang === 'fa' ? 'تصویر پروفایل' : 'Profile Photo', done: !!avatarUrl },
    { label: lang === 'fa' ? 'بیوگرافی' : 'Bio', done: bio.trim().length > 0 },
    { label: lang === 'fa' ? 'اینستاگرام' : 'Instagram', done: insta.trim().length > 0 },
    { label: lang === 'fa' ? 'کلمه کلیدی امنیتی' : 'Security Keyword', done: securityKeyword.trim().length > 0 },
    { label: lang === 'fa' ? `${MAX_IMAGES} تصویر گالری (${images.length}/${MAX_IMAGES})` : `${MAX_IMAGES} gallery images (${images.length}/${MAX_IMAGES})`, done: hasMinImages },
  ];
  const pct = Math.round((healthItems.filter(p => p.done).length / healthItems.length) * 100);
  const isComplete = pct === 100;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('profile-images').upload(path, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from('profile-images').getPublicUrl(path);
      setAvatarUrl(urlData.publicUrl);
      await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('user_id', user.id);
      toast.success(lang === 'fa' ? 'عکس پروفایل بروز شد' : 'Avatar updated');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    const remaining = MAX_IMAGES - images.length;
    const newUrls: string[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      const ext = file.name.split('.').pop();
      const path = `gallery/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('profile-images').upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from('profile-images').getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
    }
    const updated = [...images, ...newUrls];
    setImages(updated);
    await supabase.from('profiles').update({ images: updated }).eq('user_id', user.id);
    toast.success(lang === 'fa' ? 'تصویر آپلود شد' : 'Image uploaded');
  };

  const removeImage = async (idx: number) => {
    const updated = images.filter((_, i) => i !== idx);
    setImages(updated);
    if (user) {
      await supabase.from('profiles').update({ images: updated }).eq('user_id', user.id);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    // Validate security keyword: max 2 words
    if (securityKeyword.trim() && securityKeyword.trim().split(/\s+/).length > 2) {
      toast.error(lang === 'fa' ? 'کلمه کلیدی حداکثر ۲ کلمه باشد' : 'Security keyword max 2 words');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      display_name: displayName,
      bio,
      instagram: insta,
      city,
      security_keyword: securityKeyword.trim() || null,
    }).eq('user_id', user.id);
    if (error) {
      console.error('Profile update error:', error);
      toast.error(lang === 'fa' ? 'خطا در ذخیره' : 'Save error');
      setSaving(false);
      return;
    }
    setSaving(false);
    setEditing(false);
    toast.success(lang === 'fa' ? 'پروفایل ذخیره شد' : 'Profile saved');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {!isComplete && (
        <motion.div variants={item} className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle size={20} className="text-amber-400 shrink-0" />
          <p className="text-sm font-medium text-amber-300">
            {lang === 'fa' ? 'برای تکمیل حساب، اطلاعات خود را کامل کنید' : 'Complete your profile to unlock full access'}
          </p>
        </motion.div>
      )}

      {/* Avatar + Info */}
      <motion.div variants={item} className="glass-gold rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-primary/30 shadow-xl shadow-primary/20">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-bg flex items-center justify-center text-3xl font-bold text-primary-foreground">
                  {displayName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <button
              onClick={() => avatarRef.current?.click()}
              className="absolute -bottom-1 -end-1 w-8 h-8 rounded-full gradient-bg flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera size={14} className="text-primary-foreground" />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-extrabold truncate">{displayName}</h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <MapPin size={12} /> {city}
              {insta && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                  <Instagram size={12} /> {insta}
                </>
              )}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Users size={12} className="text-primary" />
              <span className="text-sm font-bold">{followersCount.toLocaleString('fa-IR')}</span>
              <span className="text-[10px] text-muted-foreground">{lang === 'fa' ? 'فالوور' : 'followers'}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats + Health side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={item} className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">{lang === 'fa' ? 'سلامت پروفایل' : 'Profile Health'}</h3>
            <span className={`text-sm font-bold ${isComplete ? 'text-green-400' : 'text-primary'}`}>{pct}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-muted mb-4 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'gradient-bg'}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
          <div className="space-y-2">
            {healthItems.map((hi, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {hi.done ? <CheckCircle size={16} className="text-green-400" /> : <AlertCircle size={16} className="text-orange-400" />}
                <span className={hi.done ? 'text-muted-foreground' : 'font-medium'}>{hi.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Edit Form */}
        <motion.div variants={item} className="glass rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">{lang === 'fa' ? 'ویرایش پروفایل' : 'Edit Profile'}</h3>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => editing ? handleSave() : setEditing(true)}
              disabled={saving}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 ${editing ? 'gradient-bg text-primary-foreground' : 'glass hover:glow-border'}`}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : editing ? <><Save size={14} /> {lang === 'fa' ? 'ذخیره' : 'Save'}</> : <><Edit3 size={14} /> {lang === 'fa' ? 'ویرایش' : 'Edit'}</>}
            </motion.button>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">{lang === 'fa' ? 'نام نمایشی' : 'Display Name'}</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} disabled={!editing} className="w-full glass rounded-xl p-3 text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">{lang === 'fa' ? 'بیوگرافی' : 'Bio'}</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} disabled={!editing} className="w-full glass rounded-xl p-3 text-sm resize-none h-20 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1"><Instagram size={12} /> {lang === 'fa' ? 'اینستاگرام' : 'Instagram'}</label>
            <input value={insta} onChange={e => setInsta(e.target.value)} disabled={!editing} className="w-full glass rounded-xl p-3 text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1"><Key size={12} /> {lang === 'fa' ? 'کلمه کلیدی امنیتی (حداکثر ۲ کلمه)' : 'Security Keyword (max 2 words)'}</label>
            <input value={securityKeyword} onChange={e => setSecurityKeyword(e.target.value)} disabled={!editing} placeholder={lang === 'fa' ? 'مثلاً: گربه سفید' : 'e.g.: white cat'} className="w-full glass rounded-xl p-3 text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </motion.div>
      </div>

      {/* Gallery */}
      <motion.div variants={item} className="glass rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Image size={18} />
            {lang === 'fa' ? `تصاویر گالری (${images.length}/${MAX_IMAGES})` : `Gallery (${images.length}/${MAX_IMAGES})`}
          </h3>
          {hasMinImages ? (
            <span className="text-xs text-green-400 font-medium flex items-center gap-1"><CheckCircle size={12} /> {lang === 'fa' ? 'کامل' : 'Complete'}</span>
          ) : (
            <span className="text-xs text-orange-400 font-medium">{MAX_IMAGES - images.length} {lang === 'fa' ? 'تصویر دیگر' : 'more needed'}</span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={() => removeImage(i)} className="p-2 rounded-full bg-destructive/80 text-white"><X size={16} /></button>
              </div>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-2xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/60 hover:text-primary transition-all"
            >
              <Upload size={20} />
              <span className="text-[10px] font-medium">+</span>
            </motion.button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
      </motion.div>
    </motion.div>
  );
};

export default DashProfile;
