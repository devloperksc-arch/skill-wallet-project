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

// Chapter 2 Pages
import Employees from './pages/hr/Employees.jsx';
import EmployeeDetail from './pages/hr/EmployeeDetail.jsx';
import Departments from './pages/hr/Departments.jsx';
import MyTeam from './pages/manager/MyTeam.jsx';
import Directory from './pages/Directory.jsx';
import MyProfile from './pages/MyProfile.jsx';

// Chapter 3 Pages
import MyLeaves from './pages/leaves/MyLeaves.jsx';
import LeaveCalendar from './pages/leaves/LeaveCalendar.jsx';
import LeaveApprovals from './pages/manager/LeaveApprovals.jsx';
import LeaveRequests from './pages/hr/LeaveRequests.jsx';
import LeaveSettings from './pages/hr/LeaveSettings.jsx';

// Chapter 4 Pages
import MyAttendance from './pages/attendance/MyAttendance.jsx';
import TeamAttendance from './pages/manager/TeamAttendance.jsx';
import AttendanceManagement from './pages/hr/AttendanceManagement.jsx';
import AnnouncementsFeed from './pages/announcements/AnnouncementsFeed.jsx';
import ManageAnnouncements from './pages/hr/ManageAnnouncements.jsx';

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

                {/* Common/Shared Routes across all roles */}
                <Route path="directory" element={<Directory />} />
                <Route path="profile" element={<MyProfile />} />
                <Route path="leaves/my" element={<MyLeaves />} />
                <Route path="leaves/calendar" element={<LeaveCalendar />} />
                <Route path="attendance/my" element={<MyAttendance />} />
                <Route path="announcements" element={<AnnouncementsFeed />} />

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
                      <Employees />
                    </RoleRoute>
                  }
                />
                <Route
                  path="employees/:id"
                  element={
                    <RoleRoute roles={['hr', 'manager', 'employee']}>
                      <EmployeeDetail />
                    </RoleRoute>
                  }
                />
                <Route
                  path="departments"
                  element={
                    <RoleRoute roles={['hr']}>
                      <Departments />
                    </RoleRoute>
                  }
                />
                <Route
                  path="leaves/requests"
                  element={
                    <RoleRoute roles={['hr']}>
                      <LeaveRequests />
                    </RoleRoute>
                  }
                />
                <Route
                  path="leaves/settings"
                  element={
                    <RoleRoute roles={['hr']}>
                      <LeaveSettings />
                    </RoleRoute>
                  }
                />
                <Route
                  path="leaves"
                  element={
                    <RoleRoute roles={['hr']}>
                      <LeaveRequests />
                    </RoleRoute>
                  }
                />
                <Route
                  path="attendance"
                  element={
                    <RoleRoute roles={['hr']}>
                      <AttendanceManagement />
                    </RoleRoute>
                  }
                />
                <Route
                  path="announcements/manage"
                  element={
                    <RoleRoute roles={['hr']}>
                      <ManageAnnouncements />
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
                      <MyTeam />
                    </RoleRoute>
                  }
                />
                <Route
                  path="leaves/approvals"
                  element={
                    <RoleRoute roles={['manager', 'hr']}>
                      <LeaveApprovals />
                    </RoleRoute>
                  }
                />
                <Route
                  path="leaves/team"
                  element={
                    <RoleRoute roles={['manager', 'hr']}>
                      <LeaveApprovals />
                    </RoleRoute>
                  }
                />
                <Route
                  path="attendance/team"
                  element={
                    <RoleRoute roles={['manager', 'hr']}>
                      <TeamAttendance />
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
                  path="trainings/my"
                  element={
                    <RoleRoute roles={['employee', 'manager', 'hr']}>
                      <ComingSoon title="My Training Courses" />
                    </RoleRoute>
                  }
                />

                {/* General / Shared Navigation Links (Unlocking in Chapter 5) */}
                <Route path="trainings" element={<ComingSoon title="Training & Development" />} />
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
