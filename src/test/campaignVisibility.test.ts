import { describe, expect, it } from 'vitest';
import {
  isCampaignVisibleToBlogger,
  nextCampaignStatusForApproval,
  normalizeCampaignApprovalStatus,
} from '@/lib/campaignVisibility';

describe('campaign visibility/source-of-truth normalization', () => {
  it('normalizes approval aliases to approved', () => {
    expect(normalizeCampaignApprovalStatus('accepted')).toBe('approved');
    expect(normalizeCampaignApprovalStatus('active')).toBe('approved');
    expect(normalizeCampaignApprovalStatus('verified')).toBe('approved');
  });

  it('hides unapproved campaigns from bloggers', () => {
    expect(isCampaignVisibleToBlogger('pending', 'active')).toBe(false);
    expect(isCampaignVisibleToBlogger('rejected', 'active')).toBe(false);
  });

  it('shows only approved + active/scheduled campaigns', () => {
    expect(isCampaignVisibleToBlogger('approved', 'active')).toBe(true);
    expect(isCampaignVisibleToBlogger('accepted', 'scheduled')).toBe(true);
    expect(isCampaignVisibleToBlogger('approved', 'draft')).toBe(false);
  });

  it('moves approved draft/pending campaigns to active', () => {
    expect(nextCampaignStatusForApproval('approved', 'draft')).toBe('active');
    expect(nextCampaignStatusForApproval('approved', 'pending')).toBe('active');
    expect(nextCampaignStatusForApproval('rejected', 'draft')).toBe('draft');
  });
});
