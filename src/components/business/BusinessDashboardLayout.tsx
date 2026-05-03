import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import DashTopBar from '../dashboard/DashTopBar';
import BizHome from './BizHome';
import BizCampaigns from './BizCampaigns';
import BizApplications from './BizApplications';
import BizGuests from './BizGuests';
import BizMessages from './BizMessages';
import BizProfile from './BizProfile';
import PendingDashboardScreen from '../shared/PendingDashboardScreen';
import RejectedDashboardScreen from '../shared/RejectedDashboardScreen';
import { Loader2 } from 'lucide-react';

type BizTabId = 'home' | 'campaigns' | 'applications' | 'guests' | 'messages' | 'profile';

const BusinessDashboardLayout = () => {
  const [activeTab, setActiveTab] = useState<BizTabId>('home');
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const isAdminPreview = searchParams.get('admin_preview') === 'true';
  const [approvalStatus, setApprovalStatus] = useState<string | null>(isAdminPreview ? 'approved' : null);
  const [checking, setChecking] = useState(!isAdminPreview);

  useEffect(() => {
    if (!user || isAdminPreview) { setChecking(false); return; }
    const checkStatus = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('approval_status')
        .eq('user_id', user.id)
        .maybeSingle();
      setApprovalStatus(profile?.approval_status || 'pending');
      setChecking(false);
    };
    checkStatus();
  }, [user, isAdminPreview]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  // Pending: show premium pending screen inside dashboard layout
  if (approvalStatus === 'pending') {
    return (
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        <DashTopBar role="business" onGoHome={() => {}} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <PendingDashboardScreen role="business" onApproved={() => setApprovalStatus('approved')} />
        </main>
      </div>
    );
  }

  // Rejected: show rejected screen inside dashboard layout
  if (approvalStatus === 'rejected') {
    return (
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        <DashTopBar role="business" onGoHome={() => {}} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <RejectedDashboardScreen role="business" />
        </main>
      </div>
    );
  }

  const goHome = () => setActiveTab('home');

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <BizHome onNavigate={(tab) => setActiveTab(tab as BizTabId)} />;
      case 'campaigns': return <BizCampaigns onGoBack={goHome} />;
      case 'applications': return <BizApplications onGoBack={goHome} />;
      case 'guests': return <BizGuests onGoBack={goHome} />;
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
