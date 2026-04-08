import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Building2, MapPin, Globe, Mail, Phone, Edit3, Save, Shield, Bell, Users, LogOut } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const BizProfile = () => {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Brand Header */}
      <motion.div variants={item} className="relative">
        <div className="h-32 rounded-3xl overflow-hidden glass-gold">
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-transparent" />
        </div>
        <div className="flex flex-col items-center -mt-12 relative z-10">
          <div className="w-24 h-24 rounded-full gradient-bg-gold flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background">
            <Building2 size={36} />
          </div>
          <h2 className="text-xl font-bold mt-3">برند نمونه</h2>
          <p className="text-sm text-muted-foreground">@sample_brand</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <MapPin size={12} /> تهران
            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
            <Building2 size={12} /> مد و زیبایی
          </div>
        </div>
      </motion.div>

      {/* Brand Info */}
      <motion.div variants={item} className="glass rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">{t('biz.brandInfo')}</h3>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setEditing(!editing)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${editing ? 'gradient-bg text-primary-foreground' : 'glass'}`}
          >
            {editing ? <><Save size={14} /> {t('dash.save')}</> : <><Edit3 size={14} /> {t('dash.editProfile')}</>}
          </motion.button>
        </div>

        <div className="space-y-3">
          {[
            { icon: Building2, label: 'نام برند', value: 'برند نمونه' },
            { icon: MapPin, label: 'شهر', value: 'تهران' },
            { icon: Mail, label: 'ایمیل', value: 'brand@example.com' },
            { icon: Phone, label: 'تلفن', value: '۰۲۱-۱۲۳۴۵' },
            { icon: Globe, label: 'وبسایت', value: 'brand.example.com' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <f.icon size={16} className="text-muted-foreground shrink-0" />
              <div className="flex-1">
                <div className="text-[10px] text-muted-foreground">{f.label}</div>
                {editing ? (
                  <input
                    defaultValue={f.value}
                    className="w-full bg-transparent text-sm font-medium border-b border-border focus:border-primary focus:outline-none pb-0.5 transition-colors"
                  />
                ) : (
                  <div className="text-sm font-medium">{f.value}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Settings Cards */}
      <motion.div variants={item} className="space-y-2">
        {[
          { icon: Shield, label: t('biz.security'), desc: 'رمز عبور و احراز هویت' },
          { icon: Bell, label: t('biz.notifications'), desc: 'تنظیمات اعلان‌ها' },
          { icon: Users, label: t('biz.team'), desc: 'مدیریت اعضای تیم' },
          { icon: LogOut, label: t('auth.logout'), desc: 'خروج از حساب کاربری' },
        ].map((s, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.98 }}
            className="w-full glass rounded-2xl p-4 flex items-center gap-3 text-start hover:glow-border transition-all duration-300"
          >
            <div className="p-2 rounded-xl bg-primary/10">
              <s.icon size={18} className="text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium">{s.label}</div>
              <div className="text-[10px] text-muted-foreground">{s.desc}</div>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default BizProfile;
