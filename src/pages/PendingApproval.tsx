import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PendingApprovalScreen from '@/components/shared/PendingApprovalScreen';
import { logEventSync } from '@/lib/eventLogger';

const PendingApproval = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      logEventSync({ action: 'redirect.to_landing', details: { reason: 'unauthenticated', source: 'PendingApproval' } });
      navigate('/', { replace: true });
    }
  }, [loading, user, navigate]);

  return <PendingApprovalScreen onApproved={() => navigate('/app', { replace: true })} />;
};

export default PendingApproval;
