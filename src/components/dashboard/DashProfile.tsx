import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Camera, Instagram, MapPin, Edit3, Save, Users, Heart, Zap, Award, CheckCircle, AlertCircle, Upload, X, Image, Lock, User, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const DashProfile = () => {
  const { t, lang } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState('بلاگر سبک زندگی و محتوای خلاقانه | تهران');
  const [insta, setInsta] = useState('@blogger_example');
  const [username, setUsername] = useState('blogger_example');
  const [password, setPassword] = useState('');
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  ]);
  const fileRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGES = 5;
  const hasUsername = username.trim().length > 0;
  const hasPassword = password.trim().length >= 6;
  const hasMinImages = images.length >= MAX_IMAGES;
  const isProfileComplete = hasUsername && hasPassword && hasMinImages;

  const healthItems = [
    { label: lang === 'fa' ? 'نام کاربری' : 'Username', done: hasUsername },
    { label: lang === 'fa' ? 'رمز عبور' : 'Password', done: hasPassword },
    { label: lang === 'fa' ? 'تصویر پروفایل' : 'Profile Photo', done: true },
    { label: lang === 'fa' ? 'بیوگرافی' : 'Bio', done: bio.trim().length > 0 },
    { label: lang === 'fa' ? 'لینک اینستاگرام' : 'Instagram', done: insta.trim().length > 0 },
    { label: lang === 'fa' ? `${MAX_IMAGES} تصویر گالری (${images.length}/${MAX_IMAGES})` : `${MAX_IMAGES} gallery images (${images.length}/${MAX_IMAGES})`, done: hasMinImages },
  ];

  const pct = Math.round((healthItems.filter(p => p.done).length / healthItems.length) * 100);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = MAX_IMAGES - images.length;
    Array.from(files).slice(0, remaining).forEach(file => {
      const url = URL.createObjectURL(file);
      setImages(prev => [...prev, url]);
    });
    toast.success(lang === 'fa' ? 'تصویر آپلود شد' : 'Image uploaded');
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setEditing(false);
    toast.success(lang === 'fa' ? 'پروفایل ذخیره شد' : 'Profile saved');
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Profile Incomplete Warning Banner */}
      {!isProfileComplete && (
        <motion.div
          variants={item}
          className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20"
        >
          <AlertTriangle size={20} className="text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-300">
              {lang === 'fa' ? 'برای تکمیل حساب، اطلاعات خود را کامل کنید' : 'Complete your profile to unlock full access'}
            </p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              {lang === 'fa' ? `نام کاربری، رمز عبور و ${MAX_IMAGES} تصویر الزامی است` : `Username, password, and ${MAX_IMAGES} images are required`}
            </p>
          </div>
        </motion.div>
      )}

      {/* Profile Header + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={item} className="lg:col-span-2 relative">
          <div className="h-32 rounded-3xl overflow-hidden glass-gold">
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-transparent" />
          </div>
          <div className="flex items-end gap-4 -mt-10 px-6 relative z-10">
            <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background">
              B
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-bold">بلاگر نمونه</h2>
              <p className="text-sm text-muted-foreground">@{username}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <MapPin size={12} /> تهران
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                <Camera size={12} /> سبک زندگی
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-2 gap-2">
          {[
            { icon: Users, label: lang === 'fa' ? 'فالوور' : 'Followers', value: '۱۲.۵K' },
            { icon: Heart, label: lang === 'fa' ? 'تعامل' : 'Engagement', value: '۴.۸%' },
            { icon: Zap, label: lang === 'fa' ? 'پاسخ' : 'Response', value: '۹۲%' },
            { icon: Award, label: lang === 'fa' ? 'امتیاز' : 'Score', value: '۸۵' },
          ].map((s, i) => (
            <div key={i} className="glass rounded-2xl p-3 text-center">
              <s.icon size={16} className="mx-auto mb-1 text-primary" />
              <div className="text-sm font-bold">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Profile Health + Edit Form side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Profile Health */}
        <motion.div variants={item} className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">{t('dash.profileHealth')}</h3>
            <span className={`text-sm font-bold ${isProfileComplete ? 'text-green-400' : 'text-primary'}`}>{pct}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-muted mb-4 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isProfileComplete ? 'bg-green-500' : 'gradient-bg'}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
          {isProfileComplete && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-xs text-green-400 font-medium">{lang === 'fa' ? 'پروفایل کامل است!' : 'Profile complete!'}</span>
            </div>
          )}
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
            <h3 className="font-bold">{t('dash.editProfile')}</h3>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => editing ? handleSave() : setEditing(true)}
              disabled={saving}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 disabled:opacity-50 ${editing ? 'gradient-bg text-primary-foreground' : 'glass hover:glow-border'}`}
            >
              {saving ? (
                <span className="animate-spin w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full" />
              ) : editing ? (
                <><Save size={14} /> {t('dash.save')}</>
              ) : (
                <><Edit3 size={14} /> {t('dash.editProfile')}</>
              )}
            </motion.button>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <User size={12} /> {lang === 'fa' ? 'نام کاربری *' : 'Username *'}
            </label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={!editing}
              className="w-full glass rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Lock size={12} /> {lang === 'fa' ? 'رمز عبور *' : 'Password *'}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={!editing}
              placeholder={lang === 'fa' ? 'حداقل ۶ کاراکتر' : 'Min 6 characters'}
              className="w-full glass rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t('dash.bio')}</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              disabled={!editing}
              className="w-full glass rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Instagram size={12} /> {t('dash.instagram')}
            </label>
            <input
              value={insta}
              onChange={e => setInsta(e.target.value)}
              disabled={!editing}
              className="w-full glass rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 transition-all"
            />
          </div>
        </motion.div>
      </div>

      {/* Image Upload Section - 5 images */}
      <motion.div variants={item} className="glass rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Image size={18} />
            {lang === 'fa' ? `تصاویر گالری (${images.length}/${MAX_IMAGES})` : `Gallery Images (${images.length}/${MAX_IMAGES})`}
          </h3>
          {!hasMinImages && (
            <span className="text-xs text-orange-400 font-medium">
              {lang === 'fa' ? `${MAX_IMAGES - images.length} تصویر دیگر نیاز است` : `${MAX_IMAGES - images.length} more needed`}
            </span>
          )}
          {hasMinImages && (
            <span className="text-xs text-green-400 font-medium flex items-center gap-1">
              <CheckCircle size={12} /> {lang === 'fa' ? 'کامل' : 'Complete'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => removeImage(i)}
                  className="p-2 rounded-full bg-destructive/80 text-white hover:bg-destructive transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <span className="absolute bottom-1.5 start-1.5 text-[9px] font-bold glass rounded-md px-1.5 py-0.5">{i + 1}</span>
            </div>
          ))}

          {images.length < MAX_IMAGES && Array.from({ length: MAX_IMAGES - images.length }).map((_, i) => (
            <motion.button
              key={`empty-${i}`}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-2xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/60 hover:text-primary transition-all cursor-pointer"
            >
              <Upload size={20} />
              <span className="text-[10px] font-medium">{images.length + i + 1}</span>
            </motion.button>
          ))}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
      </motion.div>
    </motion.div>
  );
};

export default DashProfile;
