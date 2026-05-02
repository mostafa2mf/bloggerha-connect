import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
import AppRouteGate from "./components/AppRouteGate";
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
                <Route path="/pending-approval" element={<AppRouteGate allowStatuses={["pending"]}><PendingApproval /></AppRouteGate>} />
                <Route path="/application-rejected" element={<AppRouteGate allowStatuses={["rejected"]}><ApplicationRejected /></AppRouteGate>} />

                {/* Role dashboards */}
                <Route path="/blogger-dashboard" element={<AppRouteGate allowRoles={["blogger"]} allowStatuses={["approved"]} allowAdminPreview><Dashboard /></AppRouteGate>} />
                <Route path="/business-dashboard" element={<AppRouteGate allowRoles={["business"]} allowStatuses={["approved"]} allowAdminPreview><BusinessDashboard /></AppRouteGate>} />
                <Route path="/admin-dashboard" element={<AppRouteGate allowRoles={["admin"]}><AdminDashboard /></AppRouteGate>} />

                {/* Legacy aliases — kept so existing links don't 404 */}
                <Route path="/dashboard" element={<Navigate to="/app" replace />} />
                <Route path="/dashboard/business" element={<Navigate to="/app" replace />} />
                <Route path="/admin/audit-logs" element={<AppRouteGate allowRoles={["admin"]}><AdminAuditLogs /></AppRouteGate>} />

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
