import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { syncUploadReview } from '@/lib/adminSync';
import { Upload, ImagePlus, Loader2, CheckCircle2, Clock, X, Camera } from 'lucide-react';
import { toast } from 'sonner';

type UploadReview = {
  id: string;
  campaign_id: string;
  images: string[];
  status: string;
  admin_note: string | null;
  created_at: string;
  campaigns?: { title: string } | null;
};

const DashUploadReview = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<UploadReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [hasPendingReview, setHasPendingReview] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReviews();
      fetchMyCampaigns();
    }
  }, [user]);

  const fetchReviews = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('upload_reviews')
      .select('*, campaigns(title)')
      .eq('blogger_id', user.id)
      .order('created_at', { ascending: false });
    const items = (data || []) as unknown as UploadReview[];
    setReviews(items);
    setHasPendingReview(items.some(r => r.status === 'pending'));
    setLoading(false);
  };

  const fetchMyCampaigns = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('applications')
      .select('campaign_id, campaigns(id, title)')
      .eq('blogger_id', user.id)
      .eq('status', 'accepted');
    if (data) {
      setCampaigns(data.map((a: any) => a.campaigns).filter(Boolean));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 4);
    setUploadFiles(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeFile = (idx: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!user || !selectedCampaign) return;
    if (uploadFiles.length < 1) {
      toast.error(lang === 'fa' ? 'حداقل یک تصویر آپلود کنید' : 'Upload at least one image');
      return;
    }
    setSubmitting(true);
    try {
      const imageUrls: string[] = [];
      for (const file of uploadFiles) {
        const ext = file.name.split('.').pop();
        const path = `reviews/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('profile-images').upload(path, file);
        if (!error) {
          const { data: urlData } = supabase.storage.from('profile-images').getPublicUrl(path);
          imageUrls.push(urlData.publicUrl);
        }
      }

      const { error } = await supabase.from('upload_reviews').insert({
        blogger_id: user.id,
        campaign_id: selectedCampaign,
        images: imageUrls,
        status: 'pending',
      });

      if (error) throw error;

      syncUploadReview({ campaign_id: selectedCampaign, blogger_id: user.id }).catch(console.error);

      toast.success(lang === 'fa' ? 'محتوا برای بررسی ارسال شد' : 'Review submitted');
      setUploadFiles([]);
      setPreviews([]);
      setSelectedCampaign('');
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-400';
      case 'rejected': return 'bg-red-500/10 text-red-400';
      default: return 'bg-amber-500/10 text-amber-400';
    }
  };

  const statusLabel = (status: string) => {
    if (lang === 'fa') {
      return status === 'approved' ? 'تأیید شده' : status === 'rejected' ? 'رد شده' : 'در انتظار بررسی';
    }
    return status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-2xl font-bold gradient-text">
        {lang === 'fa' ? 'آپلود محتوا و بازبینی' : 'Upload Review'}
      </h1>

      {hasPendingReview && (
        <div className="glass rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5 flex items-center gap-3">
          <Clock size={18} className="text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300">
            {lang === 'fa'
              ? 'شما یک بازبینی در حال انتظار دارید. تا زمان تأیید ادمین نمی‌توانید در کمپین جدیدی شرکت کنید.'
              : 'You have a pending review. You cannot join new campaigns until admin approves it.'}
          </p>
        </div>
      )}

      {/* Upload Form */}
      <div className="glass rounded-3xl p-6 space-y-4">
        <h2 className="font-bold flex items-center gap-2">
          <Camera size={18} className="text-primary" />
          {lang === 'fa' ? 'ارسال اسکرین‌شات استوری و پست' : 'Submit Story & Post Screenshots'}
        </h2>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            {lang === 'fa' ? 'کمپین مربوطه' : 'Related Campaign'}
          </label>
          <select
            value={selectedCampaign}
            onChange={e => setSelectedCampaign(e.target.value)}
            className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
          >
            <option value="">{lang === 'fa' ? 'انتخاب کمپین...' : 'Select campaign...'}</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            {lang === 'fa' ? 'تصاویر (حداکثر ۴ عکس)' : 'Images (max 4)'}
          </label>
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-border rounded-2xl p-6 flex items-center justify-center hover:border-primary/50 transition-colors">
              <div className="text-center">
                <ImagePlus size={28} className="mx-auto mb-2 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {lang === 'fa' ? 'انتخاب تصاویر' : 'Select images'}
                </span>
              </div>
            </div>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
          </label>

          {previews.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {previews.map((p, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden aspect-square">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1 end-1 p-1 rounded-full bg-background/80 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !selectedCampaign || uploadFiles.length < 1}
          className="w-full gradient-bg text-primary-foreground font-medium py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          <Upload size={16} />
          {lang === 'fa' ? 'ارسال برای بازبینی' : 'Submit for Review'}
        </button>
      </div>

      {/* Review History */}
      <div className="space-y-3">
        <h2 className="font-bold text-lg">
          {lang === 'fa' ? 'تاریخچه بازبینی‌ها' : 'Review History'}
        </h2>
        {loading ? (
          <div className="glass rounded-3xl p-8 flex justify-center">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : reviews.length === 0 ? (
          <div className="glass rounded-3xl p-8 text-center">
            <Upload size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              {lang === 'fa' ? 'هنوز بازبینی ارسال نکرده‌اید' : 'No reviews submitted yet'}
            </p>
          </div>
        ) : (
          reviews.map(r => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass rounded-2xl p-4 transition-opacity ${r.status === 'approved' ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold">
                  {(r as any).campaigns?.title || lang === 'fa' ? 'کمپین' : 'Campaign'}
                </span>
                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${statusBadge(r.status)}`}>
                  {r.status === 'pending' && <Clock size={10} className="inline me-1" />}
                  {r.status === 'approved' && <CheckCircle2 size={10} className="inline me-1" />}
                  {statusLabel(r.status)}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {r.images.map((img, i) => (
                  <div key={i} className="rounded-xl overflow-hidden aspect-square">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {r.admin_note && (
                <p className="text-xs text-muted-foreground mt-2 glass rounded-lg p-2">
                  {lang === 'fa' ? 'یادداشت ادمین: ' : 'Admin note: '}{r.admin_note}
                </p>
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default DashUploadReview;
