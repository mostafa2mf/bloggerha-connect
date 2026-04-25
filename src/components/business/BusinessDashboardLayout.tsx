import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { checkApproval } from '@/lib/adminSync';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { isApprovedStatus, normalizeApprovalStatus } from '@/lib/approvalStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import DashTopBar from '../dashboard/DashTopBar';
import BizHome from './BizHome';
import BizCampaigns from './BizCampaigns';
import BizApplications from './BizApplications';
import BizMessages from './BizMessages';
import BizProfile from './BizProfile';
import PendingApprovalScreen from '../shared/PendingApprovalScreen';
import { Loader2 } from 'lucide-react';

type BizTabId = 'home' | 'campaigns' | 'applications' | 'messages' | 'profile';

const BusinessDashboardLayout = () => {
  const [activeTab, setActiveTab] = useState<BizTabId>('home');
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const isAdminPreview = searchParams.get('admin_preview') === 'true';
  const [approvalStatus, setApprovalStatus] = useState<string | null>(isAdminPreview ? 'approved' : null);
  const [checking, setChecking] = useState(!isAdminPreview);
  const welcomedRef = useRef(false);

  useEffect(() => {
    if (approvalStatus === 'approved' && !welcomedRef.current && user) {
      welcomedRef.current = true;
      setTimeout(() => {
        toast.info(
          lang === 'fa'
            ? 'لطفاً قبل از هر کاری پروفایل خود را تکمیل کنید'
            : 'Please complete your profile before doing anything else',
          { duration: 6000 }
        );
      }, 800);
    }
  }, [approvalStatus, user, lang]);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    const checkStatus = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('approval_status')
        .eq('user_id', user.id)
        .maybeSingle();
      if (isApprovedStatus(profile?.approval_status)) {
        setApprovalStatus('approved');
        setChecking(false);
        return;
      }
      const result = await checkApproval('business', user.id, user.id);
      const status = normalizeApprovalStatus(result?.approval?.status || profile?.approval_status);
      setApprovalStatus(status);
      setChecking(false);
    };
    checkStatus();
  }, [user]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (approvalStatus !== 'approved') {
    return <PendingApprovalScreen onApproved={() => { setApprovalStatus('approved'); }} />;
  }

  const goHome = () => setActiveTab('home');

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <BizHome onNavigate={(tab) => setActiveTab(tab as BizTabId)} />;
      case 'campaigns': return <BizCampaigns onGoBack={goHome} />;
      case 'applications': return <BizApplications onGoBack={goHome} />;
      case 'messages': return <BizMessages onGoBack={goHome} />;
      case 'profile': return <BizProfile onGoBack={goHome} />;
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <DashTopBar role="business" onGoHome={goHome} />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {renderTab()}
        </div>
      </main>
    </div>
  );
};

export default BusinessDashboardLayout;
