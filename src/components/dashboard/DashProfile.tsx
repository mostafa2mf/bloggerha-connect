import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Camera, Instagram, MapPin, Edit3, Save, Users, Heart, Zap, Award, CheckCircle, AlertCircle } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const healthItems = [
  { label: 'تصویر پروفایل', done: true },
  { label: 'بیوگرافی', done: true },
  { label: 'لینک اینستاگرام', done: true },
  { label: 'نمونه محتوا', done: false },
  { label: 'شهر و دسته‌بندی', done: true },
  { label: 'مدیا کیت', done: false },
];

const DashProfile = () => {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('بلاگر سبک زندگی و محتوای خلاقانه | تهران');
  const [insta, setInsta] = useState('@blogger_example');

  const pct = Math.round((healthItems.filter(p => p.done).length / healthItems.length) * 100);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="relative">
        <div className="h-32 rounded-3xl overflow-hidden glass-gold">
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-transparent" />
        </div>
        <div className="flex flex-col items-center -mt-12 relative z-10">
          <div className="w-24 h-24 rounded-full gradient-bg flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background">
            B
          </div>
          <h2 className="text-xl font-bold mt-3">بلاگر نمونه</h2>
          <p className="text-sm text-muted-foreground">@blogger_example</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <MapPin size={12} /> تهران
            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
            <Camera size={12} /> سبک زندگی
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-4 gap-2">
        {[
          { icon: Users, label: 'فالوور', value: '۱۲.۵K' },
          { icon: Heart, label: 'تعامل', value: '۴.۸%' },
          { icon: Zap, label: 'پاسخ', value: '۹۲%' },
          { icon: Award, label: 'امتیاز', value: '۸۵' },
        ].map((s, i) => (
          <div key={i} className="glass rounded-2xl p-3 text-center">
            <s.icon size={16} className="mx-auto mb-1 text-primary" />
            <div className="text-sm font-bold">{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={item} className="glass rounded-3xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">{t('dash.profileHealth')}</h3>
          <span className="text-sm font-bold text-primary">{pct}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted mb-4 overflow-hidden">
          <motion.div
            className="h-full rounded-full gradient-bg"
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

      <motion.div variants={item} className="glass rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">{t('dash.editProfile')}</h3>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setEditing(!editing)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${editing ? 'gradient-bg text-primary-foreground' : 'glass'}`}
          >
            {editing ? <><Save size={14} /> {t('dash.save')}</> : <><Edit3 size={14} /> {t('dash.editProfile')}</>}
          </motion.button>
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
    </motion.div>
  );
};

export default DashProfile;
