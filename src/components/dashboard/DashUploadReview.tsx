import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { syncUploadReview } from '@/lib/adminSync';
import { Upload, ImagePlus, Loader2, CheckCircle2, Clock, X, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import BackButton from '@/components/shared/BackButton';

type UploadReview = {
  id: string;
  campaign_id: string;
  images: string[];
  status: string;
  admin_note: string | null;
  created_at: string;
  campaigns?: { title: string; city: string | null; cover_image: string | null } | null;
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const DashUploadReview = ({ onGoBack }: { onGoBack?: () => void }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<UploadReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCampaignForUpload, setSelectedCampaignForUpload] = useState<string | null>(null);

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
      .select('*, campaigns(title, city, cover_image)')
      .eq('blogger_id', user.id)
      .order('created_at', { ascending: false });
    setReviews((data || []) as unknown as UploadReview[]);
    setLoading(false);
  };

  const fetchMyCampaigns = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('applications')
      .select('campaign_id, campaigns(id, title, city, cover_image)')
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

  const handleSubmit = async (campaignId: string) => {
    if (!user) return;
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
        campaign_id: campaignId,
        images: imageUrls,
        status: 'pending',
      });
      if (error) throw error;

      syncUploadReview({ campaign_id: campaignId, blogger_id: user.id }).catch(console.error);

      toast.success(lang === 'fa' ? 'محتوا برای بررسی ارسال شد' : 'Review submitted');
      setUploadFiles([]);
      setPreviews([]);
      setSelectedCampaignForUpload(null);
      setExpandedId(null);
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  // Merge campaigns (accepted) with existing reviews
  const locationCards = campaigns.map(c => {
    const review = reviews.find(r => r.campaign_id === c.id);
    return {
      campaign: c,
      review,
      isPending: review?.status === 'pending',
      isApproved: review?.status === 'approved',
      isRejected: review?.status === 'rejected',
      hasReview: !!review,
    };
  });

  // Also include reviews for campaigns not in accepted list
  const orphanReviews = reviews.filter(r => !campaigns.some(c => c.id === r.campaign_id));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {onGoBack && <BackButton onGoBack={onGoBack} />}
      <motion.h1 variants={item} className="text-2xl font-extrabold gradient-text">Upload Review</motion.h1>

      <motion.p variants={item} className="text-sm text-muted-foreground">
        {lang === 'fa'
          ? 'لوکیشن‌هایی که بازدید کرده‌اید را انتخاب کنید و اسکرین‌شات استوری و پست خود را آپلود کنید.'
          : 'Select visited locations and upload screenshots of your stories and posts.'}
      </motion.p>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      ) : locationCards.length === 0 && orphanReviews.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center">
          <Upload size={40} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            {lang === 'fa' ? 'هنوز لوکیشنی برای بازبینی ندارید' : 'No locations to review yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {locationCards.map(({ campaign: c, review, isPending, isApproved, hasReview }) => (
            <motion.div
              key={c.id}
              variants={item}
              className={`rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 ${
                isApproved
                  ? 'opacity-50 border-border/20 shadow-none'
                  : 'border-primary/20 shadow-primary/10 glass'
              }`}
            >
              {/* Location Image */}
              <div className="h-28 overflow-hidden relative bg-muted">
                {c.cover_image ? (
                  <img src={c.cover_image} alt={c.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full gradient-bg flex items-center justify-center">
                    <MapPin size={28} className="text-primary-foreground/60" />
                  </div>
                )}
                {/* Status Badge */}
                {isPending && (
                  <span className="absolute top-2 start-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 backdrop-blur-sm">
                    <Clock size={9} className="inline me-0.5" /> {lang === 'fa' ? 'در انتظار تأیید' : 'Pending'}
                  </span>
                )}
                {isApproved && (
                  <span className="absolute top-2 start-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 backdrop-blur-sm">
                    <CheckCircle2 size={9} className="inline me-0.5" /> {lang === 'fa' ? 'تأیید شده' : 'Approved'}
                  </span>
                )}
              </div>

              <div className="p-3">
                <h3 className="font-bold text-sm truncate">{c.title}</h3>
                {c.city && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {c.city}
                  </p>
                )}

                {/* Upload Review Button */}
                {!hasReview && !isApproved && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedCampaignForUpload(c.id);
                      setExpandedId(expandedId === c.id ? null : c.id);
                    }}
                    className="w-full mt-2 gradient-bg text-primary-foreground font-bold py-2 rounded-xl text-[11px] hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20"
                  >
                    <Upload size={12} /> Upload Review
                  </motion.button>
                )}

                {/* Review images if exists */}
                {review && review.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-1 mt-2">
                    {review.images.map((img, i) => (
                      <div key={i} className="rounded-lg overflow-hidden aspect-square">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {review?.admin_note && (
                  <p className="text-[10px] text-muted-foreground mt-1.5 glass rounded-lg p-1.5">
                    {lang === 'fa' ? 'ادمین: ' : 'Admin: '}{review.admin_note}
                  </p>
                )}
              </div>

              {/* Upload Form (expanded) */}
              <AnimatePresence>
                {expandedId === c.id && selectedCampaignForUpload === c.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-border/20"
                  >
                    <div className="p-3 space-y-2">
                      <label className="block cursor-pointer">
                        <div className="border-2 border-dashed border-primary/20 rounded-xl p-3 flex items-center justify-center hover:border-primary/50 transition-colors">
                          <div className="text-center">
                            <ImagePlus size={20} className="mx-auto mb-1 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">
                              {lang === 'fa' ? 'انتخاب تصاویر (حداکثر ۴)' : 'Select images (max 4)'}
                            </span>
                          </div>
                        </div>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                      </label>

                      {previews.length > 0 && (
                        <div className="grid grid-cols-4 gap-1">
                          {previews.map((p, i) => (
                            <div key={i} className="relative rounded-lg overflow-hidden aspect-square">
                              <img src={p} alt="" className="w-full h-full object-cover" />
                              <button
                                onClick={() => removeFile(i)}
                                className="absolute top-0.5 end-0.5 p-0.5 rounded-full bg-background/80 text-destructive"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => handleSubmit(c.id)}
                        disabled={submitting || uploadFiles.length < 1}
                        className="w-full gradient-bg text-primary-foreground font-bold py-2 rounded-xl text-[11px] disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {submitting && <Loader2 size={12} className="animate-spin" />}
                        {lang === 'fa' ? 'ارسال به ادمین' : 'Send to Admin'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {/* Orphan reviews */}
          {orphanReviews.map(r => (
            <motion.div
              key={r.id}
              variants={item}
              className={`glass rounded-2xl overflow-hidden border shadow-lg transition-all ${
                r.status === 'approved'
                  ? 'opacity-50 border-border/20 shadow-none'
                  : 'border-primary/20 shadow-primary/10'
              }`}
            >
              <div className="p-3">
                <h3 className="font-bold text-sm">{(r as any).campaigns?.title || 'Campaign'}</h3>
                <div className="grid grid-cols-4 gap-1 mt-2">
                  {r.images.map((img, i) => (
                    <div key={i} className="rounded-lg overflow-hidden aspect-square">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-2 inline-block ${
                  r.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                  r.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                  'bg-amber-500/10 text-amber-400'
                }`}>
                  {r.status === 'approved' ? '✓' : r.status === 'rejected' ? '✗' : '⏳'}
                  {' '}{r.status === 'approved' ? (lang === 'fa' ? 'تأیید شده' : 'Approved') :
                   r.status === 'rejected' ? (lang === 'fa' ? 'رد شده' : 'Rejected') :
                   (lang === 'fa' ? 'در انتظار' : 'Pending')}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default DashUploadReview;
