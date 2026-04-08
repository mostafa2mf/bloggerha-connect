import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { checkApproval } from '@/lib/adminSync';
import DashboardSidebar, { type BloggerTabId } from './DashboardSidebar';
import DashTopBar from './DashTopBar';
import DashHome from './DashHome';
import DashExplore from './DashExplore';
import DashCampaigns from './DashCampaigns';
import DashProfile from './DashProfile';
import DashMessages from './DashMessages';
import DashSettings from './DashSettings';
import DashUploadReview from './DashUploadReview';
import PendingApprovalScreen from '../shared/PendingApprovalScreen';
import { Loader2 } from 'lucide-react';

const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState<BloggerTabId>('home');
  const { user } = useAuth();
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) return;
    // Check approval status from local profile first, then poll admin
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

      // Poll admin for latest status
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

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <DashHome />;
      case 'explore': return <DashExplore />;
      case 'campaigns': return <DashCampaigns />;
      case 'upload-review': return <DashUploadReview />;
      case 'messages': return <DashMessages />;
      case 'profile': return <DashProfile />;
      case 'settings': return <DashSettings />;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashTopBar />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {renderTab()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
