import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import UserManagement from "@/pages/UserManagement";
import RoleManagement from "@/pages/RoleManagement";
import NotFound from "./pages/NotFound";
import Home from "@/pages/public/Home";
import CMSLanding from "@/pages/CMSLanding";
import Profile from '@/pages/Profile';
import Notifications from '@/pages/Notifications';
import NotificationManager from '@/pages/NotificationManager';
import SchemaBuilder from '@/pages/admin/SchemaBuilder';
import CMSModulePage from '@/pages/CMSModulePage';
import CMSPostList from '@/pages/CMSPostList';
import CMSEditPage from '@/pages/CMSEditPage';
import PublicLayout from '@/components/layout/PublicLayout';
import PublicPostList from '@/pages/public/PublicPostList';
import PublicPostDetail from '@/pages/public/PublicPostDetail';

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({
  children,
  requiredRoles,
  requiredPermission,
  requiredPermissions
}: {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermission?: string;
  requiredPermissions?: string[];
}) => {
  const { isAuthenticated, hasAnyRole, permissions, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Helper to check if user has any of the required permissions
  const hasAnyPermission = (perms: string[] | undefined) => {
    if (!perms || perms.length === 0) return false;
    return perms.some(p => permissions?.includes(p));
  };

  // 1. Check Permissions first (most granular)
  // Support both single requiredPermission and array requiredPermissions
  const permissionToCheck = requiredPermissions || (requiredPermission ? [requiredPermission] : []);
  const hasRequiredPermission = permissionToCheck.length > 0 && hasAnyPermission(permissionToCheck);

  // 2. Check Roles
  const hasRequiredRole = requiredRoles && requiredRoles.length > 0 && hasAnyRole(requiredRoles);

  // 3. Logic: Allow access if EITHER Role condition met OR Permission condition met
  // If neither matches (and at least one was required), deny.
  const roleRequirementExists = requiredRoles && requiredRoles.length > 0;
  const permissionRequirementExists = permissionToCheck.length > 0;

  if (roleRequirementExists || permissionRequirementExists) {
    const allowedByRole = roleRequirementExists ? hasRequiredRole : false;
    const allowedByPermission = permissionRequirementExists ? hasRequiredPermission : false;

    // If NO requirement passed, redirect
    // Example: Roles=['ADMIN'], Perms=['READ'].
    // If user has ADMIN but not READ -> Allow (allowedByRole=true)
    // If user has READ but not ADMIN -> Allow (allowedByPermission=true)
    // If user has neither -> Deny

    // NOTE: Original logic implied "Role OR Permission". We keep that.
    if (!allowedByRole && !allowedByPermission) {
      // FIX: Redirect to Landing Page (/) instead of /dashboard to avoid infinite loops 
      // and ensure unauthorized users are sent out of the admin area.
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<CMSLanding />} />
              <Route element={<PublicLayout />}>
                <Route path="/view/:moduleName" element={<PublicPostList />} />
                <Route path="/view/:moduleName/:id" element={<PublicPostDetail />} />
              </Route>

              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route element={<DashboardLayout />}>
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute requiredRoles={['SUPERADMIN', 'ADMIN', 'EDITOR', 'MODULE_EDITOR', 'PROGRAM_EDITOR', 'ABOUT_US_EDITOR']}>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute requiredRoles={['SUPERADMIN', 'ADMIN']}>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/roles"
                  element={
                    <ProtectedRoute requiredRoles={['SUPERADMIN', 'ADMIN']}>
                      <RoleManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/notifications"
                  element={
                    <ProtectedRoute
                      requiredRoles={['SUPERADMIN', 'ADMIN']}
                      requiredPermissions={[
                        'NOTIFICATION_READ',
                        'NOTIFICATION_CREATE',
                        'NOTIFICATION_UPDATE',
                        'NOTIFICATION_DELETE'
                      ]}
                    >
                      <NotificationManager />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/schema"
                  element={
                    <ProtectedRoute requiredRoles={['SUPERADMIN', 'ADMIN']}>
                      <SchemaBuilder />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/modules/:moduleName"
                  element={
                    <ProtectedRoute>
                      <CMSPostList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/modules/:moduleName/posts/:id"
                  element={
                    <ProtectedRoute>
                      <CMSEditPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/modules/:moduleName/new"
                  element={
                    <ProtectedRoute>
                      <CMSModulePage />
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
