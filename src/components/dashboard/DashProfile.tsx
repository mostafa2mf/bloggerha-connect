import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Instagram, Edit3, Save } from 'lucide-react';
import { toast } from 'sonner';

const DashProfile = () => {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('بلاگر حرفه‌ای در حوزه سبک زندگی و مد');
  const [instagram, setInstagram] = useState('@bloggerha');

  const username = user?.user_metadata?.username || 'کاربر';
  const email = user?.email || '';

  const handleSave = () => {
    setEditing(false);
    toast.success(t('contact.success'));
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const inputClass = "w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Profile Header */}
      <div className="relative rounded-3xl overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-primary/30 to-primary/10" />
        <div className="relative px-4 pb-4 -mt-12">
          <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center text-3xl font-bold text-primary-foreground border-4 border-background">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="mt-3">
            <h1 className="text-xl font-bold">{username}</h1>
            <p className="text-sm text-muted-foreground">{email}</p>
            <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Influencer
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold gradient-text">85%</div>
          <div className="text-xs text-muted-foreground">{t('dash.engagement')}</div>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold gradient-text">92%</div>
          <div className="text-xs text-muted-foreground">{t('dash.profileHealth')}</div>
        </div>
      </div>

      {/* Profile Fields */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{t('dash.editProfile')}</h2>
          <button
            onClick={editing ? handleSave : () => setEditing(true)}
            className="flex items-center gap-1 text-sm text-primary hover:opacity-80 transition-opacity"
          >
            {editing ? <><Save size={14} /> {t('dash.save')}</> : <><Edit3 size={14} /> {t('dash.editProfile')}</>}
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t('dash.bio')}</label>
            {editing ? (
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className={inputClass + ' resize-none'} />
            ) : (
              <p className="text-sm">{bio}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t('dash.instagram')}</label>
            {editing ? (
              <div className="relative">
                <Instagram size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={instagram} onChange={e => setInstagram(e.target.value)} className={inputClass + ' ps-10'} />
              </div>
            ) : (
              <p className="text-sm flex items-center gap-2"><Instagram size={14} className="text-primary" /> {instagram}</p>
            )}
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full glass rounded-2xl p-4 flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 transition-colors font-medium"
      >
        <LogOut size={18} />
        {t('auth.logout')}
      </button>
    </motion.div>
  );
};

export default DashProfile;
