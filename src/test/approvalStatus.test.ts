import { describe, it, expect } from 'vitest';
import { isApprovedStatus, normalizeApprovalStatus } from '@/lib/approvalStatus';

describe('approval status normalization', () => {
  it('maps accepted aliases to approved', () => {
    expect(normalizeApprovalStatus('accepted')).toBe('approved');
    expect(normalizeApprovalStatus('active')).toBe('approved');
    expect(normalizeApprovalStatus('verified')).toBe('approved');
    expect(isApprovedStatus('approved')).toBe(true);
  });

  it('maps rejected aliases and defaults pending', () => {
    expect(normalizeApprovalStatus('denied')).toBe('rejected');
    expect(normalizeApprovalStatus('blocked')).toBe('rejected');
    expect(normalizeApprovalStatus('')).toBe('pending');
    expect(normalizeApprovalStatus(null)).toBe('pending');
  });
});
