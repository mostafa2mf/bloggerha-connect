export type CampaignApproval = 'approved' | 'pending' | 'rejected';

export function normalizeCampaignApprovalStatus(status: string | null | undefined): CampaignApproval {
  const value = (status || '').toLowerCase().trim();
  if (['approved', 'accepted', 'active', 'verified'].includes(value)) return 'approved';
  if (['rejected', 'denied', 'blocked'].includes(value)) return 'rejected';
  return 'pending';
}

export function normalizeCampaignLifecycleStatus(status: string | null | undefined): string {
  const value = (status || '').toLowerCase().trim();
  if (['approved', 'live'].includes(value)) return 'active';
  return value || 'draft';
}

export function isCampaignVisibleToBlogger(
  adminApprovalStatus: string | null | undefined,
  campaignStatus: string | null | undefined,
): boolean {
  if (normalizeCampaignApprovalStatus(adminApprovalStatus) !== 'approved') return false;
  const normalizedStatus = normalizeCampaignLifecycleStatus(campaignStatus);
  return normalizedStatus === 'active' || normalizedStatus === 'scheduled';
}

export function nextCampaignStatusForApproval(
  adminApprovalStatus: string | null | undefined,
  currentStatus: string | null | undefined,
): string {
  const approval = normalizeCampaignApprovalStatus(adminApprovalStatus);
  const status = normalizeCampaignLifecycleStatus(currentStatus);

  if (approval === 'approved' && (status === 'pending' || status === 'draft' || !status)) {
    return 'active';
  }

  return status || 'draft';
}
