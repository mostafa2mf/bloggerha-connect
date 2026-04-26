import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PendingByEmailScreen from '@/components/shared/PendingByEmailScreen';

const navigateMock = vi.fn();
const invokeMock = vi.fn();
const mockAuth = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual: any = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuth(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => invokeMock(...args),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

describe('PendingByEmailScreen', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    invokeMock.mockReset();
    mockAuth.mockReturnValue({ user: null });
  });

  it('recovers a stuck pending blogger after refresh and sends them to blogger dashboard when logged in', async () => {
    mockAuth.mockReturnValue({ user: { id: 'u1' } });
    invokeMock.mockResolvedValue({
      data: {
        exists: true,
        profile: { role: 'blogger', approval_status: 'approved', display_name: 'Ali' },
      },
    });

    render(
      <MemoryRouter>
        <PendingByEmailScreen
          email="blogger@test.com"
          initialProfile={{ role: 'blogger', approval_status: 'pending', display_name: 'Ali' }}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /check status|بررسی مجدد وضعیت/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Account Approved|حساب شما تأیید شد/i })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard', { replace: true });
    }, { timeout: 1200 });
  });

  it('recovers a stuck pending business after refresh and sends them to business dashboard when logged in', async () => {
    mockAuth.mockReturnValue({ user: { id: 'u2' } });
    invokeMock.mockResolvedValue({
      data: {
        exists: true,
        profile: { role: 'business', approval_status: 'approved', brand_name: 'Brand' },
      },
    });

    render(
      <MemoryRouter>
        <PendingByEmailScreen
          email="business@test.com"
          initialProfile={{ role: 'business', approval_status: 'pending', brand_name: 'Brand' }}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /check status|بررسی مجدد وضعیت/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard/business', { replace: true });
    }, { timeout: 1200 });
  });

  it('shows rejected state instead of leaving the user on waiting', async () => {
    invokeMock.mockResolvedValue({
      data: {
        exists: true,
        profile: { role: 'blogger', approval_status: 'rejected', display_name: 'Ali' },
      },
    });

    render(
      <MemoryRouter>
        <PendingByEmailScreen
          email="reject@test.com"
          initialProfile={{ role: 'blogger', approval_status: 'pending', display_name: 'Ali' }}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /check status|بررسی مجدد وضعیت/i }));

    await waitFor(() => {
      expect(screen.getByText(/Account Rejected|حساب شما رد شد/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /check status|بررسی مجدد وضعیت/i })).not.toBeInTheDocument();
  });
});
