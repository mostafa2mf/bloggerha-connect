import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { X, Loader2, ImagePlus, MapPin, Calendar, Tag, FileText, Megaphone, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { syncCampaign } from '@/lib/adminSync';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const cities = ['تهران', 'مشهد', 'اصفهان', 'شیراز', 'تبریز'];
const categories = ['زیبایی', 'مد', 'تکنولوژی', 'غذا', 'سفر', 'ورزش', 'سلامت', 'آموزش'];

type PrevCampaign = {
  id: string;
  title: string;
  description: string | null;
  city: string | null;
  category: string | null;
  start_date: string | null;
  end_date: string | null;
  cover_image: string | null;
};

const CreateCampaignModal = ({ isOpen, onClose, onCreated }: Props) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [prevCampaigns, setPrevCampaigns] = useState<PrevCampaign[]>([]);
  const [showRepeat, setShowRepeat] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    city: 'تهران',
    category: '',
    start_date: '',
    end_date: '',
  });

  const updateField = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  // Fetch previous campaigns for repeat
  useEffect(() => {
    if (!user || !isOpen) return;
    supabase
      .from('campaigns')
      .select('id, title, description, city, category, start_date, end_date, cover_image')
      .eq('business_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setPrevCampaigns((data as PrevCampaign[]) || []));
  }, [user, isOpen]);

  const handleRepeat = (c: PrevCampaign) => {
    setForm({
      title: c.title,
      description: c.description || '',
      city: c.city || 'تهران',
      category: c.category || '',
      start_date: '',
      end_date: '',
    });
    if (c.cover_image) setCoverPreview(c.cover_image);
    setShowRepeat(false);
    toast.success(lang === 'fa' ? 'اطلاعات کمپین بارگذاری شد' : 'Campaign data loaded');
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!form.title) {
      toast.error(lang === 'fa' ? 'عنوان کمپین الزامی است' : 'Campaign title is required');
      return;
    }
    if (!user) {
      toast.error(lang === 'fa' ? 'ابتدا وارد شوید' : 'Please login first');
      return;
    }

    setLoading(true);
    try {
      let cover_image: string | null = null;

      if (coverFile) {
        const ext = coverFile.name.split('.').pop();
        const path = `campaigns/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(path, coverFile);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('profile-images').getPublicUrl(path);
          cover_image = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from('campaigns').insert({
        business_id: user.id,
        title: form.title,
        description: form.description || null,
        city: form.city || null,
        category: form.category || null,
        budget: null,
        collaboration_type: null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        cover_image,
        status: 'draft',
      });

      if (error) throw error;

      syncCampaign({
        id: crypto.randomUUID(),
        title: form.title,
        business_id: user.id,
        city: form.city,
        budget: '',
        description: form.description,
        start_date: form.start_date,
        end_date: form.end_date,
      }).catch(console.error);

      toast.success(lang === 'fa' ? 'کمپین با موفقیت ساخته شد و برای تأیید ادمین ارسال شد' : 'Campaign created & sent for approval');
      onCreated?.();
      onClose();
      setForm({ title: '', description: '', city: 'تهران', category: '', start_date: '', end_date: '' });
      setCoverFile(null);
      setCoverPreview(null);
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full glass rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50";
  const selectClass = "w-full glass rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none";
  const labelClass = "text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="glass rounded-3xl p-6 w-full max-w-lg relative z-10 max-h-[90vh] overflow-y-auto border border-primary/10 shadow-2xl shadow-primary/10"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold gradient-text flex items-center gap-2">
                <Megaphone size={20} />
                {lang === 'fa' ? 'ساخت کمپین جدید' : 'Create Campaign'}
              </h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Repeat Campaign Button */}
            {prevCampaigns.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setShowRepeat(!showRepeat)}
                  className="w-full glass rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-2 hover:glow-border transition-all border border-primary/20"
                >
                  <RefreshCw size={14} className="text-primary" />
                  {lang === 'fa' ? 'تکرار کمپین قبلی' : 'Repeat Previous Campaign'}
                </button>
                <AnimatePresence>
                  {showRepeat && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-2 space-y-1.5"
                    >
                      {prevCampaigns.map(c => (
                        <button
                          key={c.id}
                          onClick={() => handleRepeat(c)}
                          className="w-full glass rounded-xl p-3 text-start text-sm hover:bg-primary/5 transition-colors"
                        >
                          <span className="font-bold">{c.title}</span>
                          {c.city && <span className="text-xs text-muted-foreground ms-2">· {c.city}</span>}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="space-y-4">
              {/* Cover Image */}
              <div>
                <label className={labelClass}><ImagePlus size={14} /> {lang === 'fa' ? 'تصویر کاور' : 'Cover Image'}</label>
                <label className="block cursor-pointer">
                  {coverPreview ? (
                    <div className="relative rounded-2xl overflow-hidden h-40">
                      <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-xs font-bold glass px-3 py-1.5 rounded-full">{lang === 'fa' ? 'تغییر' : 'Change'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-primary/20 rounded-2xl h-40 flex items-center justify-center hover:border-primary/50 transition-colors">
                      <div className="text-center">
                        <ImagePlus size={24} className="mx-auto mb-2 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{lang === 'fa' ? 'آپلود تصویر' : 'Upload image'}</span>
                      </div>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                </label>
              </div>

              {/* Title */}
              <div>
                <label className={labelClass}><FileText size={14} /> {lang === 'fa' ? 'عنوان کمپین *' : 'Campaign Title *'}</label>
                <input
                  value={form.title}
                  onChange={e => updateField('title', e.target.value)}
                  placeholder={lang === 'fa' ? 'مثلاً: کمپین زیبایی بهاره' : 'e.g. Spring Beauty Campaign'}
                  className={inputClass}
                />
              </div>

              {/* Description */}
              <div>
                <label className={labelClass}><FileText size={14} /> {lang === 'fa' ? 'توضیحات' : 'Description'}</label>
                <textarea
                  value={form.description}
                  onChange={e => updateField('description', e.target.value)}
                  placeholder={lang === 'fa' ? 'توضیحات کمپین...' : 'Campaign description...'}
                  rows={3}
                  className={inputClass + ' resize-none'}
                />
              </div>

              {/* City & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}><MapPin size={14} /> {lang === 'fa' ? 'شهر' : 'City'}</label>
                  <select value={form.city} onChange={e => updateField('city', e.target.value)} className={selectClass}>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}><Tag size={14} /> {lang === 'fa' ? 'دسته‌بندی' : 'Category'}</label>
                  <select value={form.category} onChange={e => updateField('category', e.target.value)} className={selectClass}>
                    <option value="">{lang === 'fa' ? 'انتخاب...' : 'Select...'}</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}><Calendar size={14} /> {lang === 'fa' ? 'تاریخ شروع' : 'Start Date'}</label>
                  <input type="date" value={form.start_date} onChange={e => updateField('start_date', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}><Calendar size={14} /> {lang === 'fa' ? 'تاریخ پایان' : 'End Date'}</label>
                  <input type="date" value={form.end_date} onChange={e => updateField('end_date', e.target.value)} className={inputClass} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 gradient-bg text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {lang === 'fa' ? 'انتشار کمپین' : 'Publish Campaign'}
                </button>
                <button
                  onClick={onClose}
                  className="glass px-6 py-3 rounded-xl text-sm font-bold hover:bg-muted/50 transition-colors"
                >
                  {lang === 'fa' ? 'انصراف' : 'Cancel'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateCampaignModal;
