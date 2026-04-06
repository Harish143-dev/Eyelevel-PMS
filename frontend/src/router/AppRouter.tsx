import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { getMe } from '../store/slices/authSlice';

// Layout & Protected Route
import PageLayout from '../components/layout/PageLayout';
import SettingsLayout from '../components/layout/SettingsLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import FeatureRoute from '../components/FeatureRoute';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// Module Selector
import ModuleSelectorPage from '../pages/ModuleSelectorPage';

// PM Dashboard
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import UserDashboard from '../pages/dashboard/UserDashboard';

// Lazy-loaded PM Pages
const ProjectsPage = React.lazy(() => import('../pages/projects/ProjectsPage'));
const ProjectDetailPage = React.lazy(() => import('../pages/projects/ProjectDetailPage'));
const TasksPage = React.lazy(() => import('../pages/tasks/TasksPage'));
const ProfilePage = React.lazy(() => import('../pages/ProfilePage'));
const TodoPage = React.lazy(() => import('../pages/todo/TodoPage'));
const NotificationsPage = React.lazy(() => import('../pages/NotificationsPage'));
const TimeReportsPage = React.lazy(() => import('../pages/TimeReportsPage'));
const ReportsPage = React.lazy(() => import('../pages/reports/ReportsPage'));
const CalendarPage = React.lazy(() => import('../pages/calendar/CalendarPage'));
const ChatPage = React.lazy(() => import('../pages/chat/ChatPage'));

// Lazy-loaded HR Pages
const HRDashboard = React.lazy(() => import('../pages/hr/HRDashboard'));
const LeavesPage = React.lazy(() => import('../pages/leaves/LeavesPage'));

// Lazy-loaded Admin Pages
const UsersPage = React.lazy(() => import('../pages/admin/UsersPage'));
const ActivityLogsPage = React.lazy(() => import('../pages/admin/ActivityLogsPage'));
const ActivityMonitorPage = React.lazy(() => import('../pages/admin/ActivityMonitorPage'));
const DepartmentsPage = React.lazy(() => import('../pages/admin/DepartmentsPage'));
const WorkloadPage = React.lazy(() => import('../pages/admin/WorkloadPage'));
const ClientsPage = React.lazy(() => import('../pages/admin/ClientsPage'));
const TrashPage = React.lazy(() => import('../pages/admin/TrashPage'));
const TemplatesPage = React.lazy(() => import('../pages/templates/TemplatesPage'));
const PayrollPage = React.lazy(() => import('../pages/hr/PayrollPage'));
const PerformancePage = React.lazy(() => import('../pages/hr/PerformancePage'));
const EmployeeProfilePage = React.lazy(() => import('../pages/hr/EmployeeProfilePage'));
const RolesPage = React.lazy(() => import('../pages/settings/RolesPage'));
const CompanyList = React.lazy(() => import('../pages/superAdmin/CompanyList'));
const CompanyFeatures = React.lazy(() => import('../pages/superAdmin/CompanyFeatures'));
const MonitoringDashboard = React.lazy(() => import('../pages/admin/MonitoringDashboard'));
const CustomFieldsPage = React.lazy(() => import('../pages/settings/CustomFieldsPage'));
const PreferencesPage = React.lazy(() => import('../pages/settings/PreferencesPage'));
const DataManagementPage = React.lazy(() => import('../pages/settings/DataManagementPage'));

// New Settings Components
const WorkspaceGeneral = React.lazy(() => import('../pages/settings/WorkspaceGeneral'));
const WorkspaceSecurity = React.lazy(() => import('../pages/settings/WorkspaceSecurity'));
const WorkspaceModules = React.lazy(() => import('../pages/settings/WorkspaceModules'));
const WorkspaceWorkflows = React.lazy(() => import('../pages/settings/WorkspaceWorkflows'));
const WorkspaceLeave = React.lazy(() => import('../pages/settings/WorkspaceLeave'));

// Onboarding
import OnboardingWizard from '../pages/onboarding/OnboardingWizard';


const LazyFallback: React.FC = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-text-muted font-medium animate-pulse">Loading...</p>
    </div>
  </div>
);

// PM Dashboard by role
import { isAdminOrManager } from '../constants/roles';

const PMDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const isAdminOrSuper = isAdminOrManager(user?.role);
  return isAdminOrSuper ? <AdminDashboard /> : <UserDashboard />;
};

const AppRouter: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      dispatch(getMe());
    }
  }, [dispatch]);

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/auth/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/auth/register" element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Module Selector — Landing page after login */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ModuleSelectorPage />
          </ProtectedRoute>
        }
      />

      {/* Onboarding Wizard (full-screen, no sidebar) */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingWizard />
          </ProtectedRoute>
        }
      />

      {/* ===== PROJECT MANAGEMENT MODULE ===== */}
      <Route
        element={
          <ProtectedRoute>
            <PageLayout />
          </ProtectedRoute>
        }
      >
        {/* PM Routes — root guarded by projectManagement feature flag */}
        <Route path="/pm" element={<FeatureRoute featureKey="projectManagement" redirectTo="/"><Suspense fallback={<LazyFallback />}><PMDashboard /></Suspense></FeatureRoute>} />
        <Route path="/pm/projects" element={<Suspense fallback={<LazyFallback />}><FeatureRoute featureKey="projectManagement" redirectTo="/pm"><ProjectsPage /></FeatureRoute></Suspense>} />
        <Route path="/pm/projects/:id" element={<Suspense fallback={<LazyFallback />}><FeatureRoute featureKey="projectManagement" redirectTo="/pm"><ProjectDetailPage /></FeatureRoute></Suspense>} />
        <Route path="/pm/tasks" element={<Suspense fallback={<LazyFallback />}><FeatureRoute featureKey="taskManagement" redirectTo="/pm"><TasksPage /></FeatureRoute></Suspense>} />
        <Route path="/pm/calendar" element={<Suspense fallback={<LazyFallback />}><FeatureRoute featureKey="calendar" redirectTo="/pm"><CalendarPage /></FeatureRoute></Suspense>} />
        <Route path="/pm/todo" element={<Suspense fallback={<LazyFallback />}><TodoPage /></Suspense>} />
        <Route path="/pm/chat" element={<Suspense fallback={<LazyFallback />}><FeatureRoute featureKey="teamChat" redirectTo="/pm"><ChatPage /></FeatureRoute></Suspense>} />
        <Route path="/pm/time-reports" element={<Suspense fallback={<LazyFallback />}><FeatureRoute featureKey="timeTracking" redirectTo="/pm"><TimeReportsPage /></FeatureRoute></Suspense>} />
        <Route path="/pm/reports" element={<Suspense fallback={<LazyFallback />}><FeatureRoute featureKey="analytics" redirectTo="/pm"><ReportsPage /></FeatureRoute></Suspense>} />
        <Route path="/pm/notifications" element={<Suspense fallback={<LazyFallback />}><NotificationsPage /></Suspense>} />

        {/* ===== GLOBAL SETTINGS (module-agnostic) ===== */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsLayout />
            </ProtectedRoute>
          }
        >
          {/* Default redirect to preferences */}
          <Route index element={<Navigate to="preferences" replace />} />
          
          <Route
            path="preferences"
            element={
              <Suspense fallback={<LazyFallback />}><PreferencesPage /></Suspense>
            }
          />
          <Route
            path="profile"
            element={
              <Suspense fallback={<LazyFallback />}><ProfilePage /></Suspense>
            }
          />
          {/* Workspace sub-routes */}
          <Route path="workspace/general" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<LazyFallback />}><WorkspaceGeneral /></Suspense></ProtectedRoute>} />
          <Route path="workspace/security" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<LazyFallback />}><WorkspaceSecurity /></Suspense></ProtectedRoute>} />
          <Route path="workspace/modules" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<LazyFallback />}><WorkspaceModules /></Suspense></ProtectedRoute>} />
          <Route path="workspace/workflows" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<LazyFallback />}><WorkspaceWorkflows /></Suspense></ProtectedRoute>} />
          <Route path="workspace/leave" element={<ProtectedRoute requiredRole="admin"><Suspense fallback={<LazyFallback />}><WorkspaceLeave /></Suspense></ProtectedRoute>} />

          <Route
            path="roles"
            element={
              <ProtectedRoute requiredRole="admin">
                <Suspense fallback={<LazyFallback />}><RolesPage /></Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="custom-fields"
            element={
              <ProtectedRoute requiredRole="admin">
                <Suspense fallback={<LazyFallback />}><CustomFieldsPage /></Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="data"
            element={
              <ProtectedRoute requiredRole="admin">
                <Suspense fallback={<LazyFallback />}><DataManagementPage /></Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="monitoring"
            element={
              <ProtectedRoute requiredRole="admin">
                <Suspense fallback={<LazyFallback />}><MonitoringDashboard /></Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="super-admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <Suspense fallback={<LazyFallback />}><CompanyList /></Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="super-admin/companies/:id/features"
            element={
              <ProtectedRoute requiredRole="admin">
                <Suspense fallback={<LazyFallback />}><CompanyFeatures /></Suspense>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* PM Admin Routes (lazy) */}
        <Route
          path="/pm/templates"
          element={
            <ProtectedRoute requiredRole="manager">
              <Suspense fallback={<LazyFallback />}><TemplatesPage /></Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pm/workload"
          element={
            <ProtectedRoute requiredRole="manager">
              <Suspense fallback={<LazyFallback />}><WorkloadPage /></Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pm/activity"
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<LazyFallback />}><ActivityLogsPage /></Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pm/live-monitoring"
          element={
            <ProtectedRoute requiredRole="admin">
              <FeatureRoute featureKey="activityMonitoring" redirectTo="/pm">
                <Suspense fallback={<LazyFallback />}><ActivityMonitorPage /></Suspense>
              </FeatureRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pm/clients"
          element={
            <ProtectedRoute requiredRole="manager">
              <Suspense fallback={<LazyFallback />}><ClientsPage /></Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pm/trash"
          element={
            <ProtectedRoute requiredRole="manager">
              <Suspense fallback={<LazyFallback />}><TrashPage /></Suspense>
            </ProtectedRoute>
          }
        />
        {/* Legacy /pm/settings/* redirects */}
        <Route path="/pm/settings/preferences" element={<Navigate to="/settings/preferences" replace />} />
        <Route path="/pm/settings/company" element={<Navigate to="/settings/company" replace />} />
        <Route path="/pm/settings/roles" element={<Navigate to="/settings/roles" replace />} />
        <Route path="/pm/settings/custom-fields" element={<Navigate to="/settings/custom-fields" replace />} />
        <Route path="/pm/settings/data" element={<Navigate to="/settings/data" replace />} />
        <Route path="/pm/settings/monitoring" element={<Navigate to="/settings/monitoring" replace />} />
        <Route path="/pm/settings/super-admin" element={<Navigate to="/settings/super-admin" replace />} />
        <Route path="/pm/settings/super-admin/companies/:id/features" element={<Navigate to="/settings/super-admin/companies/:id/features" replace />} />

        {/* ===== HR MANAGEMENT MODULE ===== */}
        <Route path="/hr" element={<FeatureRoute featureKey="hrManagement" redirectTo="/"><Suspense fallback={<LazyFallback />}><HRDashboard /></Suspense></FeatureRoute>} />
        <Route path="/hr/leaves" element={<Suspense fallback={<LazyFallback />}><FeatureRoute featureKey="leaveManagement" redirectTo="/hr"><LeavesPage /></FeatureRoute></Suspense>} />

        {/* HR Admin Routes (lazy) */}
        <Route
          path="/hr/employees"
          element={
            <ProtectedRoute requiredRole="hr">
              <Suspense fallback={<LazyFallback />}><UsersPage /></Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/employees/:id"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LazyFallback />}><EmployeeProfilePage /></Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/departments"
          element={
            <ProtectedRoute requiredRole="hr">
              <Suspense fallback={<LazyFallback />}><DepartmentsPage /></Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/payroll"
          element={
            <ProtectedRoute requiredRole="hr">
              <Suspense fallback={<LazyFallback />}><FeatureRoute featureKey="payroll" redirectTo="/hr"><PayrollPage /></FeatureRoute></Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/performance"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LazyFallback />}><FeatureRoute featureKey="performance" redirectTo="/hr"><PerformancePage /></FeatureRoute></Suspense>
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch all — redirect to module selector */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
