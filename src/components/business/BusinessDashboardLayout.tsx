import { useState } from 'react';
import BusinessSidebar, { type BizTabId } from './BusinessSidebar';
import DashTopBar from '../dashboard/DashTopBar';
import BizHome from './BizHome';
import BizDiscover from './BizDiscover';
import BizCampaigns from './BizCampaigns';
import BizApplications from './BizApplications';
import BizMessages from './BizMessages';
import BizAnalytics from './BizAnalytics';
import BizProfile from './BizProfile';

const BusinessDashboardLayout = () => {
  const [activeTab, setActiveTab] = useState<BizTabId>('home');

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

export default BusinessDashboardLayout;
