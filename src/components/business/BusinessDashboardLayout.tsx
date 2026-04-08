import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { checkApproval } from '@/lib/adminSync';
import BusinessSidebar, { type BizTabId } from './BusinessSidebar';
import DashTopBar from '../dashboard/DashTopBar';
import BizHome from './BizHome';
import BizDiscover from './BizDiscover';
import BizCampaigns from './BizCampaigns';
import BizApplications from './BizApplications';
import BizMessages from './BizMessages';
import BizAnalytics from './BizAnalytics';
import BizProfile from './BizProfile';
import PendingApprovalScreen from '../shared/PendingApprovalScreen';
import { Loader2 } from 'lucide-react';

const BusinessDashboardLayout = () => {
  const [activeTab, setActiveTab] = useState<BizTabId>('home');
  const { user } = useAuth();
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) return;
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

      const result = await checkApproval('business', user.id, user.id);
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
      case 'home': return <BizHome />;
      case 'discover': return <BizDiscover />;
      case 'campaigns': return <BizCampaigns />;
      case 'applications': return <BizApplications />;
      case 'messages': return <BizMessages />;
      case 'analytics': return <BizAnalytics />;
      case 'profile': return <BizProfile />;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <BusinessSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashTopBar role="business" />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {renderTab()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default BusinessDashboardLayout;
