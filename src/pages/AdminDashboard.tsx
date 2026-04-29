import { useNavigate } from 'react-router-dom';
import AdminAuditLogs from './AdminAuditLogs';

/**
 * Lightweight admin landing — currently routes admins straight to the audit
 * logs page (the only first-party admin surface in the app today). Replace
 * with a richer admin shell when more admin pages exist.
 */
const AdminDashboard = () => {
  return <AdminAuditLogs />;
};

export default AdminDashboard;
