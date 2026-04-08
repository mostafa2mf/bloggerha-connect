import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { X, Loader2, ImagePlus, MapPin, DollarSign, Calendar, Tag, FileText, Megaphone, Handshake } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const cities = ['تهران', 'مشهد', 'اصفهان', 'شیراز', 'تبریز'];
const categories = ['زیبایی', 'مد', 'تکنولوژی', 'غذا', 'سفر', 'ورزش', 'سلامت', 'آموزش'];
const collabTypes = ['بررسی محصول', 'پست اینستاگرام', 'استوری', 'ویدیو', 'حضوری', 'ترکیبی'];

const CreateCampaignModal = ({ isOpen, onClose, onCreated }: Props) => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    city: 'تهران',
    category: '',
    budget: '',
    collaboration_type: '',
    start_date: '',
    end_date: '',
  });

  const updateField = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

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
        budget: form.budget || null,
        collaboration_type: form.collaboration_type || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        cover_image,
        status: 'draft',
      });

      if (error) throw error;

      toast.success(lang === 'fa' ? 'کمپین با موفقیت ساخته شد' : 'Campaign created successfully');
      onCreated?.();
      onClose();
      // Reset
      setForm({ title: '', description: '', city: 'تهران', category: '', budget: '', collaboration_type: '', start_date: '', end_date: '' });
      setCoverFile(null);
      setCoverPreview(null);
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50";
  const selectClass = "w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none";
  const labelClass = "text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5";

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
            className="glass rounded-3xl p-6 w-full max-w-lg relative z-10 max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold gradient-text flex items-center gap-2">
                <Megaphone size={20} />
                {lang === 'fa' ? 'ساخت کمپین جدید' : 'Create Campaign'}
              </h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Cover Image */}
              <div>
                <label className={labelClass}><ImagePlus size={14} /> {lang === 'fa' ? 'تصویر کاور' : 'Cover Image'}</label>
                <label className="block cursor-pointer">
                  {coverPreview ? (
                    <div className="relative rounded-2xl overflow-hidden h-40">
                      <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-xs font-medium glass px-3 py-1.5 rounded-full">{lang === 'fa' ? 'تغییر' : 'Change'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-2xl h-40 flex items-center justify-center hover:border-primary/50 transition-colors">
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

              {/* Budget & Collab Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}><DollarSign size={14} /> {lang === 'fa' ? 'بودجه (تومان)' : 'Budget'}</label>
                  <input
                    value={form.budget}
                    onChange={e => updateField('budget', e.target.value)}
                    placeholder={lang === 'fa' ? 'مثلاً: ۲۰,۰۰۰,۰۰۰' : 'e.g. 20,000,000'}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}><Handshake size={14} /> {lang === 'fa' ? 'نوع همکاری' : 'Collaboration Type'}</label>
                  <select value={form.collaboration_type} onChange={e => updateField('collaboration_type', e.target.value)} className={selectClass}>
                    <option value="">{lang === 'fa' ? 'انتخاب...' : 'Select...'}</option>
                    {collabTypes.map(c => <option key={c} value={c}>{c}</option>)}
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
                  className="flex-1 gradient-bg text-primary-foreground font-medium py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {lang === 'fa' ? 'انتشار کمپین' : 'Publish Campaign'}
                </button>
                <button
                  onClick={onClose}
                  className="glass px-6 py-3 rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors"
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
