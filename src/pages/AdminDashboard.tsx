import { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import AdminMessages from '@/components/admin/AdminMessages';
import AdminCampaigns from '@/components/admin/AdminCampaigns';
import AdminGuests from '@/components/admin/AdminGuests';
import AdminContentReview from '@/components/admin/AdminContentReview';
import AdminUserApprovals from '@/components/admin/AdminUserApprovals';
import { MessageCircle, Megaphone, Users, Upload, ShieldAlert, Loader2, UserCheck } from 'lucide-react';

// Lazy load audit logs to avoid circular issues
const AdminAuditLogsLazy = lazy(() => import('@/pages/AdminAuditLogs'));

type AdminTab = 'approvals' | 'messages' | 'campaigns' | 'guests' | 'content-review' | 'audit-logs';

const tabs: { id: AdminTab; icon: any; label: string }[] = [
  { id: 'approvals', icon: UserCheck, label: 'User Approvals' },
  { id: 'messages', icon: MessageCircle, label: 'Messages' },
  { id: 'campaigns', icon: Megaphone, label: 'Campaigns' },
  { id: 'guests', icon: Users, label: 'Guests' },
  { id: 'content-review', icon: Upload, label: 'Content Review' },
  { id: 'audit-logs', icon: ShieldAlert, label: 'Audit Logs' },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('approvals');

  const renderTab = () => {
    switch (activeTab) {
      case 'approvals': return <AdminUserApprovals />;
      case 'messages': return <AdminMessages />;
      case 'campaigns': return <AdminCampaigns />;
      case 'guests': return <AdminGuests />;
      case 'content-review': return <AdminContentReview />;
      case 'audit-logs': return <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>}><AdminAuditLogsLazy /></Suspense>;
    }
  };

  return (
    <>
      <Header />
      <div className="pt-20 px-4 md:px-6 pb-10 max-w-6xl mx-auto" dir="ltr">
        <h1 className="text-2xl font-bold gradient-text mb-4">Admin Dashboard</h1>

        {/* Tab bar */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none mb-6 -mx-4 px-4">
          {tabs.map(t => (
            <motion.button
              key={t.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(t.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === t.id ? 'gradient-bg text-primary-foreground shadow-lg shadow-primary/20' : 'glass hover:bg-muted/50'
              }`}
            >
              <t.icon size={14} /> {t.label}
            </motion.button>
          ))}
        </div>

        {renderTab()}
      </div>
    </>
  );
};

export default AdminDashboard;
