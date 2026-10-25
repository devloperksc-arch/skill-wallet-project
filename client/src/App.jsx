import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import RoleRoute from './routes/RoleRoute.jsx';

import AuthLayout from './layouts/AuthLayout.jsx';
import AppLayout from './layouts/AppLayout.jsx';

import Login from './pages/Login.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import Forbidden from './pages/Forbidden.jsx';
import NotFound from './pages/NotFound.jsx';
import ComingSoon from './pages/ComingSoon.jsx';

import HrDashboard from './pages/dashboards/HrDashboard.jsx';
import ManagerDashboard from './pages/dashboards/ManagerDashboard.jsx';
import EmployeeDashboard from './pages/dashboards/EmployeeDashboard.jsx';

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'hr') return <Navigate to="/hr" replace />;
  if (user.role === 'manager') return <Navigate to="/manager" replace />;
  return <Navigate to="/employee" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              {/* Public Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
              </Route>

              {/* Force password change or account settings */}
              <Route
                path="/change-password"
                element={
                  <ProtectedRoute>
                    <AuthLayout>
                      <ChangePassword />
                    </AuthLayout>
                  </ProtectedRoute>
                }
              />

              {/* Protected Authenticated App Layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                {/* Root Redirect based on role */}
                <Route index element={<RootRedirect />} />

                {/* HR Restricted Routes */}
                <Route
                  path="hr"
                  element={
                    <RoleRoute roles={['hr']}>
                      <HrDashboard />
                    </RoleRoute>
                  }
                />
                <Route
                  path="employees"
                  element={
                    <RoleRoute roles={['hr']}>
                      <ComingSoon title="Employee Management" />
                    </RoleRoute>
                  }
                />
                <Route
                  path="departments"
                  element={
                    <RoleRoute roles={['hr']}>
                      <ComingSoon title="Department Management" />
                    </RoleRoute>
                  }
                />

                {/* Manager Routes */}
                <Route
                  path="manager"
                  element={
                    <RoleRoute roles={['manager', 'hr']}>
                      <ManagerDashboard />
                    </RoleRoute>
                  }
                />
                <Route
                  path="team"
                  element={
                    <RoleRoute roles={['manager', 'hr']}>
                      <ComingSoon title="My Team Directory" />
                    </RoleRoute>
                  }
                />
                <Route
                  path="attendance/team"
                  element={
                    <RoleRoute roles={['manager', 'hr']}>
                      <ComingSoon title="Team Attendance" />
                    </RoleRoute>
                  }
                />
                <Route
                  path="leaves/team"
                  element={
                    <RoleRoute roles={['manager', 'hr']}>
                      <ComingSoon title="Team Leave Requests" />
                    </RoleRoute>
                  }
                />

                {/* Employee Routes */}
                <Route
                  path="employee"
                  element={
                    <RoleRoute roles={['employee', 'manager', 'hr']}>
                      <EmployeeDashboard />
                    </RoleRoute>
                  }
                />
                <Route
                  path="leaves/my"
                  element={
                    <RoleRoute roles={['employee', 'manager', 'hr']}>
                      <ComingSoon title="My Leave Requests" />
                    </RoleRoute>
                  }
                />
                <Route
                  path="attendance/my"
                  element={
                    <RoleRoute roles={['employee', 'manager', 'hr']}>
                      <ComingSoon title="My Daily Attendance" />
                    </RoleRoute>
                  }
                />
                <Route
                  path="trainings/my"
                  element={
                    <RoleRoute roles={['employee', 'manager', 'hr']}>
                      <ComingSoon title="My Training Courses" />
                    </RoleRoute>
                  }
                />

                {/* General / Shared Navigation Links */}
                <Route path="attendance" element={<ComingSoon title="Attendance Overview" />} />
                <Route path="leaves" element={<ComingSoon title="Leave Management" />} />
                <Route path="trainings" element={<ComingSoon title="Training & Development" />} />
                <Route path="announcements" element={<ComingSoon title="Announcements & Bulletins" />} />
                <Route path="profile" element={<ComingSoon title="My Profile" />} />
              </Route>

              {/* Status and Fallback Routes */}
              <Route path="/forbidden" element={<Forbidden />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
