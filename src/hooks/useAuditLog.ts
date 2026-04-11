import { supabase } from '@/integrations/supabase/client';

export const logAction = async (action: string, details: Record<string, any> = {}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action,
    details,
  });
};
