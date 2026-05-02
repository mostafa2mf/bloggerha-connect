import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ select: mockSelect }),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })) },
    removeChannel: vi.fn(),
    channel: () => ({ on: () => ({ subscribe: vi.fn() }), unsubscribe: vi.fn() }),
  },
}));

vi.mock('@/lib/eventLogger', () => ({ logEventSync: vi.fn() }));

const mockUser = { id: 'test-user-123', email: 'test@test.com' };
let authValue: any = { user: mockUser, loading: false, signOut: vi.fn() };

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authValue,
  AuthProvider: ({ children }: any) => children,
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en' }),
  LanguageProvider: ({ children }: any) => children,
}));

import AppRedirectGuard from '@/components/AppRedirectGuard';

function setupProfileMock(role: string, approval_status: string) {
  mockSelect.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
  mockMaybeSingle.mockResolvedValue({
    data: { id: 'p1', user_id: mockUser.id, role, approval_status },
    error: null,
  });
}

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/app']}>
      <Routes>
        <Route path="/app" element={<AppRedirectGuard />} />
        <Route path="/" element={<div data-testid="landing">Landing</div>} />
        <Route path="/blogger-dashboard" element={<div data-testid="blogger-dash">Blogger Dashboard</div>} />
        <Route path="/business-dashboard" element={<div data-testid="business-dash">Business Dashboard</div>} />
        <Route path="/admin-dashboard" element={<div data-testid="admin-dash">Admin Dashboard</div>} />
        <Route path="/pending-approval" element={<div data-testid="pending">Pending</div>} />
        <Route path="/application-rejected" element={<div data-testid="rejected">Rejected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Approval redirect flow (E2E-style)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authValue = { user: mockUser, loading: false, signOut: vi.fn() };
  });

  // --- Blogger ---
  it('approved blogger → /blogger-dashboard, never /', async () => {
    setupProfileMock('blogger', 'approved');
    renderGuard();
    await waitFor(() => expect(screen.getByTestId('blogger-dash')).toBeInTheDocument());
    expect(screen.queryByTestId('landing')).not.toBeInTheDocument();
  });

  it('pending blogger → /pending-approval, never /', async () => {
    setupProfileMock('blogger', 'pending');
    renderGuard();
    await waitFor(() => expect(screen.getByTestId('pending')).toBeInTheDocument());
    expect(screen.queryByTestId('landing')).not.toBeInTheDocument();
  });

  it('rejected blogger → /application-rejected, never /', async () => {
    setupProfileMock('blogger', 'rejected');
    renderGuard();
    await waitFor(() => expect(screen.getByTestId('rejected')).toBeInTheDocument());
    expect(screen.queryByTestId('landing')).not.toBeInTheDocument();
  });

  // --- Business ---
  it('approved business → /business-dashboard, never /', async () => {
    setupProfileMock('business', 'approved');
    renderGuard();
    await waitFor(() => expect(screen.getByTestId('business-dash')).toBeInTheDocument());
    expect(screen.queryByTestId('landing')).not.toBeInTheDocument();
  });

  it('pending business → /pending-approval, never /', async () => {
    setupProfileMock('business', 'pending');
    renderGuard();
    await waitFor(() => expect(screen.getByTestId('pending')).toBeInTheDocument());
    expect(screen.queryByTestId('landing')).not.toBeInTheDocument();
  });

  it('rejected business → /application-rejected, never /', async () => {
    setupProfileMock('business', 'rejected');
    renderGuard();
    await waitFor(() => expect(screen.getByTestId('rejected')).toBeInTheDocument());
    expect(screen.queryByTestId('landing')).not.toBeInTheDocument();
  });

  // --- Admin ---
  it('admin → /admin-dashboard', async () => {
    setupProfileMock('admin', 'approved');
    renderGuard();
    await waitFor(() => expect(screen.getByTestId('admin-dash')).toBeInTheDocument());
  });

  // --- Unauthenticated ---
  it('unauthenticated → /', async () => {
    authValue = { user: null as any, loading: false, signOut: vi.fn() };
    setupProfileMock('blogger', 'approved');
    renderGuard();
    await waitFor(() => expect(screen.getByTestId('landing')).toBeInTheDocument());
  });
});
