import Header from '@/components/Header';
import BusinessDashboardLayout from '@/components/business/BusinessDashboardLayout';

const BusinessDashboard = () => (
  <>
    <Header />
    <div className="pt-16">
      <BusinessDashboardLayout />
    </div>
  </>
);

export default BusinessDashboard;
