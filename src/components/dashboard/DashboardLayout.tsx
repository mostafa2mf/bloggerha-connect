import { useState } from 'react';
import DashboardSidebar, { type BloggerTabId } from './DashboardSidebar';
import DashTopBar from './DashTopBar';
import DashHome from './DashHome';
import DashExplore from './DashExplore';
import DashCampaigns from './DashCampaigns';
import DashProfile from './DashProfile';
import DashMessages from './DashMessages';
import DashSettings from './DashSettings';

const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState<BloggerTabId>('home');

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <DashHome />;
      case 'explore': return <DashExplore />;
      case 'campaigns': return <DashCampaigns />;
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
