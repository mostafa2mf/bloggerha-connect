import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthGate from '@/components/shared/AuthGate';

// --- Mocks ---
const mockAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuth(),
}));

vi.mock('@/components/shared/LogoSplash', () => ({
  default: () => <div data-testid="logo-splash">SPLASH</div>,
}));

const Landing = () => <div data-testid="landing">LANDING</div>;
const RegBlogger = () => <div data-testid="reg-blogger">REG_BLOGGER</div>;
const RegBusiness = () => <div data-testid="reg-business">REG_BUSINESS</div>;
const Dashboard = () => <div data-testid="dashboard">DASHBOARD</div>;
const BizDashboard = () => <div data-testid="biz-dashboard">BIZ_DASHBOARD</div>;

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthGate>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register/blogger" element={<RegBlogger />} />
          <Route path="/register/business" element={<RegBusiness />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/business" element={<BizDashboard />} />
        </Routes>
      </AuthGate>
    </MemoryRouter>
  );

describe('AuthGate — logged-in users on public pages', () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it('redirects an unapproved blogger from "/" to /dashboard (waiting screen lives there)', async () => {
    mockAuth.mockReturnValue({
      user: { id: 'u1' },
      userRole: 'blogger',
      loading: false,
    });
    renderAt('/');
    expect(screen.getByTestId('logo-splash')).toBeInTheDocument();
    await waitFor(
      () => expect(screen.getByTestId('dashboard')).toBeInTheDocument(),
      { timeout: 2500 }
    );
    expect(screen.queryByTestId('landing')).not.toBeInTheDocument();
  });

  it('redirects unapproved blogger away from /register/blogger', async () => {
    mockAuth.mockReturnValue({
      user: { id: 'u1' },
      userRole: 'blogger',
      loading: false,
    });
    renderAt('/register/blogger');
    await waitFor(
      () => expect(screen.getByTestId('dashboard')).toBeInTheDocument(),
      { timeout: 2500 }
    );
    expect(screen.queryByTestId('reg-blogger')).not.toBeInTheDocument();
  });

  it('redirects unapproved business from /register/business to /dashboard/business', async () => {
    mockAuth.mockReturnValue({
      user: { id: 'u2' },
      userRole: 'business',
      loading: false,
    });
    renderAt('/register/business');
    await waitFor(
      () => expect(screen.getByTestId('biz-dashboard')).toBeInTheDocument(),
      { timeout: 2500 }
    );
    expect(screen.queryByTestId('reg-business')).not.toBeInTheDocument();
  });

  it('redirects user with NO role yet (just signed up) to /dashboard, not the form', async () => {
    mockAuth.mockReturnValue({
      user: { id: 'u3' },
      userRole: null,
      loading: false,
    });
    renderAt('/register/blogger');
    await waitFor(
      () => expect(screen.getByTestId('dashboard')).toBeInTheDocument(),
      { timeout: 2500 }
    );
    expect(screen.queryByTestId('reg-blogger')).not.toBeInTheDocument();
  });

  it('does NOT redirect an unauthenticated visitor — landing stays visible', async () => {
    mockAuth.mockReturnValue({ user: null, userRole: null, loading: false });
    renderAt('/');
    expect(screen.getByTestId('landing')).toBeInTheDocument();
    expect(screen.queryByTestId('logo-splash')).not.toBeInTheDocument();
  });


  it('redirects unauthenticated visitor away from /dashboard to /', async () => {
    mockAuth.mockReturnValue({ user: null, userRole: null, loading: false });
    renderAt('/dashboard');
    await waitFor(
      () => expect(screen.getByTestId('landing')).toBeInTheDocument(),
      { timeout: 1000 }
    );
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });

  it('redirects authenticated business user from /dashboard to /dashboard/business', async () => {
    mockAuth.mockReturnValue({ user: { id: 'u4' }, userRole: 'business', loading: false });
    renderAt('/dashboard');
    await waitFor(
      () => expect(screen.getByTestId('biz-dashboard')).toBeInTheDocument(),
      { timeout: 1000 }
    );
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });

  it('does not redirect while auth is still loading', async () => {
    mockAuth.mockReturnValue({ user: null, userRole: null, loading: true });
    renderAt('/');
    expect(screen.getByTestId('landing')).toBeInTheDocument();
    expect(screen.queryByTestId('logo-splash')).not.toBeInTheDocument();
  });
});
