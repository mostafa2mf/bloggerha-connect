import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { checkApproval } from '@/lib/adminSync';
import { useSearchParams } from 'react-router-dom';
import DashTopBar from './DashTopBar';
import DashHome from './DashHome';
import DashCampaigns from './DashCampaigns';
import DashProfile from './DashProfile';
import DashMessages from './DashMessages';
import DashUploadReview from './DashUploadReview';
import PendingApprovalScreen from '../shared/PendingApprovalScreen';
import { Loader2 } from 'lucide-react';

type TabId = 'home' | 'campaigns' | 'upload-review' | 'messages' | 'profile';

const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isAdminPreview = searchParams.get('admin_preview') === 'true';
  const [approvalStatus, setApprovalStatus] = useState<string | null>(isAdminPreview ? 'approved' : null);
  const [checking, setChecking] = useState(!isAdminPreview);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    const checkStatus = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('approval_status')
        .eq('user_id', user.id)
        .maybeSingle();
      if (profile?.approval_status === 'approved') {
        setApprovalStatus('approved');
        setChecking(false);
        return;
      }
      const result = await checkApproval('influencer', user.id, user.id);
      const status = result?.approval?.status || profile?.approval_status || 'pending';
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
    return <PendingApprovalScreen />;
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
