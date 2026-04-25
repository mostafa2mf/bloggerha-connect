import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PendingApprovalScreen from '@/components/shared/PendingApprovalScreen';

// --- Mocks ---
const mockAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuth(),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en' }),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual: any = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

// Programmable profile state returned by supabase mock
const state = vi.hoisted(() => ({
  state.currentProfile: {
    display_name: 'Tester',
    username: 'tester',
    approval_status: 'pending',
    role: 'blogger',
  } as any,
  state.removeChannelMock: vi.fn(),
  state.subscribeMock: vi.fn(() => ({ unsubscribe: () => {} })),
}));

vi.mock('@/integrations/supabase/client', () => {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    maybeSingle: () => Promise.resolve({ data: state.currentProfile, error: null }),
  };
  return {
    supabase: {
      from: () => builder,
      channel: () => ({
        on: () => ({ subscribe: state.subscribeMock }),
      }),
      removeChannel: state.removeChannelMock,
    },
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/adminSync', () => ({
  checkApproval: vi.fn().mockResolvedValue({ approval: { status: 'pending' } }),
}));

const renderScreen = (onApproved?: () => void) =>
  render(
    <MemoryRouter>
      <PendingApprovalScreen onApproved={onApproved} />
    </MemoryRouter>
  );

describe('PendingApprovalScreen — negative flows', () => {
  beforeEach(() => {
    mockAuth.mockReturnValue({
      user: { id: 'u1' },
      signOut: vi.fn().mockResolvedValue(undefined),
    });
    navigateMock.mockReset();
    state.removeChannelMock.mockReset();
    state.subscribeMock.mockClear();
  });

  it('shows pending UI when profile.approval_status === "pending"', async () => {
    state.currentProfile = { display_name: 'A', username: 'a', approval_status: 'pending', role: 'blogger' };
    renderScreen();
    await waitFor(() =>
      expect(screen.getByText(/Pending Admin Approval/i)).toBeInTheDocument()
    );
    // Refresh button visible (not rejected)
    expect(screen.getByText(/Check status/i)).toBeInTheDocument();
  });

  it('shows rejected UI when admin rejects (approval_status === "rejected")', async () => {
    state.currentProfile = { display_name: 'A', username: 'a', approval_status: 'rejected', role: 'blogger' };
    renderScreen();
    await waitFor(() =>
      expect(screen.getByText(/Account Rejected/i)).toBeInTheDocument()
    );
    // Refresh button hidden when rejected
    expect(screen.queryByText(/Check status/i)).not.toBeInTheDocument();
  });

  it('shows pending UI for revoked approval (was approved → set back to pending)', async () => {
    // Simulate admin revoking approval: status flips back to pending
    state.currentProfile = { display_name: 'A', username: 'a', approval_status: 'pending', role: 'business' };
    renderScreen();
    await waitFor(() =>
      expect(screen.getByText(/Pending Admin Approval/i)).toBeInTheDocument()
    );
  });

  it('subscribes to realtime updates so status flips trigger re-evaluation', async () => {
    state.currentProfile = { display_name: 'A', username: 'a', approval_status: 'pending', role: 'blogger' };
    renderScreen();
    await waitFor(() => expect(state.subscribeMock).toHaveBeenCalled());
  });
});
