import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { X, Loader2, ImagePlus, MapPin, Calendar, Tag, FileText, Megaphone, RefreshCw, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { syncCampaign } from '@/lib/adminSync';
import { validateFile } from '@/lib/fileValidation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
  editCampaign?: PrevCampaign & { id: string } | null;
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

// Get today and max date (1 month from now) as YYYY-MM-DD
const getDateBounds = () => {
  const today = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 1);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { minDate: fmt(today), maxDate: fmt(maxDate) };
};

const CreateCampaignModal = ({ isOpen, onClose, onCreated, editCampaign }: Props) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [prevCampaigns, setPrevCampaigns] = useState<PrevCampaign[]>([]);
  const [showRepeat, setShowRepeat] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { minDate, maxDate } = getDateBounds();

  const [form, setForm] = useState({
    title: '',
    description: '',
    city: 'تهران',
    category: '',
    start_date: '',
    end_date: '',
  });

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  // Prefill when editing
  useEffect(() => {
    if (isOpen && editCampaign) {
      setForm({
        title: editCampaign.title || '',
        description: editCampaign.description || '',
        city: editCampaign.city || 'تهران',
        category: editCampaign.category || '',
        start_date: editCampaign.start_date || '',
        end_date: editCampaign.end_date || '',
      });
      if (editCampaign.cover_image) setExistingImages([editCampaign.cover_image]);
    }
    if (isOpen && !editCampaign) {
      setForm({ title: '', description: '', city: 'تهران', category: '', start_date: '', end_date: '' });
      setImageFiles([]);
      setImagePreviews([]);
      setExistingImages([]);
      setErrors({});
    }
  }, [isOpen, editCampaign]);

  // Fetch previous campaigns for repeat
  useEffect(() => {
    if (!user || !isOpen || editCampaign) return;
    supabase
      .from('campaigns')
      .select('id, title, description, city, category, start_date, end_date, cover_image')
      .eq('business_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setPrevCampaigns((data as PrevCampaign[]) || []));
  }, [user, isOpen, editCampaign]);

  const handleRepeat = (c: PrevCampaign) => {
    setForm({
      title: c.title,
      description: c.description || '',
      city: c.city || 'تهران',
      category: c.category || '',
      start_date: '',
      end_date: '',
    });
    if (c.cover_image) setExistingImages([c.cover_image]);
    setShowRepeat(false);
    toast.success(lang === 'fa' ? 'اطلاعات کمپین بارگذاری شد' : 'Campaign data loaded');
  };

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = imageFiles.length + existingImages.length;
    const allowed = files.slice(0, 5 - totalImages);

    for (const file of allowed) {
      const v = validateFile(file, lang);
      if (!v.valid) { toast.error(v.error); return; }
    }

    setImageFiles(prev => [...prev, ...allowed]);
    setImagePreviews(prev => [...prev, ...allowed.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeNewImage = (idx: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const removeExistingImage = (idx: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== idx));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = lang === 'fa' ? 'عنوان الزامی است' : 'Title is required';
    if (form.start_date && form.start_date < minDate) errs.start_date = lang === 'fa' ? 'تاریخ نمی‌تواند قبل از امروز باشد' : 'Date cannot be in the past';
    if (form.start_date && form.start_date > maxDate) errs.start_date = lang === 'fa' ? 'حداکثر یک ماه آینده' : 'Max one month ahead';
    if (form.end_date && form.end_date < minDate) errs.end_date = lang === 'fa' ? 'تاریخ نمی‌تواند قبل از امروز باشد' : 'Date cannot be in the past';
    if (form.end_date && form.end_date > maxDate) errs.end_date = lang === 'fa' ? 'حداکثر یک ماه آینده' : 'Max one month ahead';
    if (form.start_date && form.end_date && form.end_date < form.start_date) errs.end_date = lang === 'fa' ? 'تاریخ پایان باید بعد از شروع باشد' : 'End date must be after start';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!user) { toast.error(lang === 'fa' ? 'ابتدا وارد شوید' : 'Please login first'); return; }

    setLoading(true);
    try {
      // Upload new images
      const uploadedUrls: string[] = [...existingImages];
      for (const file of imageFiles) {
        const ext = file.name.split('.').pop();
        const path = `campaigns/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('profile-images').upload(path, file);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('profile-images').getPublicUrl(path);
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      const cover_image = uploadedUrls[0] || null;

      let error;
      if (editCampaign?.id) {
        const updatePayload: any = {
          title: form.title,
          description: form.description || null,
          city: form.city || null,
          category: form.category || null,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          cover_image,
          status: 'pending',
          admin_approval_status: 'pending',
        };
        const res = await supabase.from('campaigns').update(updatePayload).eq('id', editCampaign.id);
        error = res.error;
      } else {
        const res = await supabase.from('campaigns').insert({
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
          status: 'pending',
        });
        error = res.error;
      }

      if (error) throw error;

      syncCampaign({
        id: editCampaign?.id || crypto.randomUUID(),
        title: form.title,
        business_id: user.id,
        city: form.city,
        budget: '',
        description: form.description,
        start_date: form.start_date,
        end_date: form.end_date,
      }).catch(console.error);

      toast.success(
        editCampaign
          ? (lang === 'fa' ? 'کمپین ویرایش و برای تأیید ارسال شد' : 'Campaign updated & resubmitted')
          : (lang === 'fa' ? 'کمپین ساخته شد و برای تأیید ادمین ارسال شد' : 'Campaign created & sent for approval')
      );
      onCreated?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const totalImages = existingImages.length + imageFiles.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
          <motion.div
            className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-primary/10 bg-background/40 backdrop-blur-xl shadow-2xl shadow-primary/10"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            {/* Glass overlay */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5 pointer-events-none" />
            
            <div className="relative p-6 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold gradient-text flex items-center gap-2">
                  <Megaphone size={20} />
                  {editCampaign ? (lang === 'fa' ? 'ویرایش کمپین' : 'Edit Campaign') : (lang === 'fa' ? 'ساخت کمپین جدید' : 'Create Campaign')}
                </h2>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Repeat Campaign */}
              {!editCampaign && prevCampaigns.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowRepeat(!showRepeat)}
                    className="w-full border border-primary/20 bg-primary/5 backdrop-blur-sm rounded-2xl py-2.5 text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary/10 transition-all"
                  >
                    <RefreshCw size={14} className="text-primary" />
                    {lang === 'fa' ? 'تکرار کمپین قبلی' : 'Repeat Previous Campaign'}
                  </button>
                  <AnimatePresence>
                    {showRepeat && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2 space-y-1.5">
                        {prevCampaigns.map(c => (
                          <button key={c.id} onClick={() => handleRepeat(c)} className="w-full bg-muted/30 backdrop-blur-sm rounded-xl p-3 text-start text-sm hover:bg-primary/5 transition-colors border border-border/30">
                            <span className="font-bold">{c.title}</span>
                            {c.city && <span className="text-xs text-muted-foreground ms-2">· {c.city}</span>}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Image Upload Area */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <ImagePlus size={14} /> {lang === 'fa' ? 'تصاویر کمپین' : 'Campaign Images'} 
                  <span className="text-muted-foreground/60">({totalImages}/5)</span>
                </label>

                {/* Existing + New image previews */}
                {(existingImages.length > 0 || imagePreviews.length > 0) && (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {existingImages.map((url, i) => (
                      <div key={`ex-${i}`} className="relative rounded-2xl overflow-hidden aspect-square border border-border/30 group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => removeExistingImage(i)} className="absolute top-1 end-1 p-1 rounded-full bg-background/80 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {imagePreviews.map((url, i) => (
                      <div key={`new-${i}`} className="relative rounded-2xl overflow-hidden aspect-square border border-primary/30 group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => removeNewImage(i)} className="absolute top-1 end-1 p-1 rounded-full bg-background/80 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {totalImages < 5 && (
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-primary/20 rounded-2xl p-6 flex flex-col items-center justify-center hover:border-primary/40 hover:bg-primary/5 transition-all">
                      <ImagePlus size={28} className="text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground font-medium">
                        {lang === 'fa' ? 'کلیک یا بکشید اینجا' : 'Click or drag here'}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 mt-0.5">JPG, PNG, WebP · Max 5MB</span>
                    </div>
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={handleImageAdd} />
                  </label>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <FileText size={14} /> {lang === 'fa' ? 'عنوان کمپین *' : 'Campaign Title *'}
                </label>
                <input
                  value={form.title}
                  onChange={e => updateField('title', e.target.value)}
                  placeholder={lang === 'fa' ? 'مثلاً: کمپین زیبایی بهاره' : 'e.g. Spring Beauty Campaign'}
                  className="w-full bg-background/40 backdrop-blur-sm border border-border/40 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all placeholder:text-muted-foreground/40"
                />
                {errors.title && <p className="text-[11px] text-destructive mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <FileText size={14} /> {lang === 'fa' ? 'توضیحات' : 'Description'}
                </label>
                <textarea
                  value={form.description}
                  onChange={e => updateField('description', e.target.value)}
                  placeholder={lang === 'fa' ? 'توضیحات کمپین...' : 'Campaign description...'}
                  rows={3}
                  className="w-full bg-background/40 backdrop-blur-sm border border-border/40 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all resize-none placeholder:text-muted-foreground/40"
                />
              </div>

              {/* City & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <MapPin size={14} /> {lang === 'fa' ? 'شهر' : 'City'}
                  </label>
                  <select value={form.city} onChange={e => updateField('city', e.target.value)} className="w-full bg-background/40 backdrop-blur-sm border border-border/40 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none">
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Tag size={14} /> {lang === 'fa' ? 'دسته‌بندی' : 'Category'}
                  </label>
                  <select value={form.category} onChange={e => updateField('category', e.target.value)} className="w-full bg-background/40 backdrop-blur-sm border border-border/40 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none">
                    <option value="">{lang === 'fa' ? 'انتخاب...' : 'Select...'}</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Calendar size={14} /> {lang === 'fa' ? 'تاریخ شروع' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    value={form.start_date}
                    min={minDate}
                    max={maxDate}
                    onChange={e => updateField('start_date', e.target.value)}
                    className="w-full bg-background/40 backdrop-blur-sm border border-border/40 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  {errors.start_date && <p className="text-[11px] text-destructive mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.start_date}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Calendar size={14} /> {lang === 'fa' ? 'تاریخ پایان' : 'End Date'}
                  </label>
                  <input
                    type="date"
                    value={form.end_date}
                    min={form.start_date || minDate}
                    max={maxDate}
                    onChange={e => updateField('end_date', e.target.value)}
                    className="w-full bg-background/40 backdrop-blur-sm border border-border/40 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  {errors.end_date && <p className="text-[11px] text-destructive mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.end_date}</p>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 gradient-bg text-primary-foreground font-bold py-3.5 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {lang === 'fa' ? 'ارسال برای تأیید' : 'Submit for Approval'}
                </motion.button>
                <button
                  onClick={onClose}
                  className="bg-muted/30 backdrop-blur-sm border border-border/30 px-6 py-3.5 rounded-2xl text-sm font-bold hover:bg-muted/50 transition-colors"
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
