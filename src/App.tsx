import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import BloggerRegister from "./pages/BloggerRegister.tsx";
import BusinessRegister from "./pages/BusinessRegister.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import BusinessDashboard from "./pages/BusinessDashboard.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminAuditLogs from "./pages/AdminAuditLogs.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import PendingApproval from "./pages/PendingApproval.tsx";
import ApplicationRejected from "./pages/ApplicationRejected.tsx";
import AppRedirectGuard from "./components/AppRedirectGuard";
import AuthGate from "./components/shared/AuthGate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AuthProvider>
            <TooltipProvider>
              <Sonner />
              <AuthGate>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/register/blogger" element={<BloggerRegister />} />
                <Route path="/register/business" element={<BusinessRegister />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Single source of truth for post-login routing */}
                <Route path="/app" element={<AppRedirectGuard />} />

                {/* Status screens */}
                <Route path="/pending-approval" element={<PendingApproval />} />
                <Route path="/application-rejected" element={<ApplicationRejected />} />

                {/* Role dashboards */}
                <Route path="/blogger-dashboard" element={<Dashboard />} />
                <Route path="/business-dashboard" element={<BusinessDashboard />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />

                {/* Legacy aliases — kept so existing links don't 404 */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/business" element={<BusinessDashboard />} />
                <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
              </AuthGate>
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
