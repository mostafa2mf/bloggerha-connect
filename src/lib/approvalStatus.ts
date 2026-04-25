export function normalizeApprovalStatus(status: string | null | undefined): 'approved' | 'pending' | 'rejected' {
  const value = (status ?? '').toLowerCase().trim();

  if (['approved', 'accepted', 'active', 'verified'].includes(value)) {
    return 'approved';
  }

  if (['rejected', 'denied', 'blocked'].includes(value)) {
    return 'rejected';
  }

  return 'pending';
}

export function isApprovedStatus(status: string | null | undefined): boolean {
  return normalizeApprovalStatus(status) === 'approved';
}
