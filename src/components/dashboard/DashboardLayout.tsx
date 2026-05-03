import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import DashTopBar from './DashTopBar';
import DashHome from './DashHome';
import DashCampaigns from './DashCampaigns';
import DashProfile from './DashProfile';
import DashMessages from './DashMessages';
import DashUploadReview from './DashUploadReview';
import PendingDashboardScreen from '../shared/PendingDashboardScreen';
import RejectedDashboardScreen from '../shared/RejectedDashboardScreen';
import { Loader2 } from 'lucide-react';

type TabId = 'home' | 'campaigns' | 'upload-review' | 'messages' | 'profile';

const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
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
        <DashTopBar onGoHome={() => {}} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <PendingDashboardScreen role="blogger" onApproved={() => setApprovalStatus('approved')} />
        </main>
      </div>
    );
  }

  // Rejected: show rejected screen inside dashboard layout
  if (approvalStatus === 'rejected') {
    return (
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        <DashTopBar onGoHome={() => {}} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <RejectedDashboardScreen role="blogger" />
        </main>
      </div>
    );
  }

  const goHome = () => setActiveTab('home');

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <DashHome onNavigate={(tab) => setActiveTab(tab as TabId)} />;
      case 'campaigns': return <DashCampaigns onGoBack={goHome} />;
      case 'upload-review': return <DashUploadReview onGoBack={goHome} />;
      case 'messages': return <DashMessages onGoBack={goHome} />;
      case 'profile': return <DashProfile onGoBack={goHome} />;
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <DashTopBar onGoHome={() => setActiveTab('home')} />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {renderTab()}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
