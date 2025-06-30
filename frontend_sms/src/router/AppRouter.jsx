import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/auth.store';

// Pages
import LoginPage from '../pages/Auth/LoginPage.jsx'; // Ensured .jsx
import DashboardLayout from '../components/layout/DashboardLayout.jsx'; // Ensured .jsx
import HomePage from '../pages/HomePage.jsx'; // Ensured .jsx
import StudentDashboardPage from '../pages/Student/StudentDashboardPage.jsx'; // Ensured .jsx

// Teacher Pages
import TeacherDashboardPage from '../pages/Teacher/TeacherDashboardPage';
import MyClassesPageTeacher from '../pages/Teacher/MyClassesPage';
import AttendanceTakingPageTeacher from '../pages/Teacher/AttendanceTakingPage';
import GradeEntryPageTeacher from '../pages/Teacher/GradeEntryPage'; // Added

// Admin Pages
import AdminDashboardPage from '../pages/Admin/AdminDashboardPage';
import AdminUserManagementPage from '../pages/Admin/UserManagementPage';
import StudentEnrollmentPageAdmin from '../pages/Admin/StudentEnrollmentPage';
import SubjectManagementPageAdmin from '../pages/Admin/SubjectManagementPage';
import ClassSchedulingPageAdmin from '../pages/Admin/ClassSchedulingPage';
import AttendanceOversightPageAdmin from '../pages/Admin/AttendanceOversightPage';
import GradeOversightPageAdmin from '../pages/Admin/GradeOversightPage';


// Super Admin Pages
import SuperAdminDashboardPage from '../pages/SuperAdmin/SuperAdminDashboardPage';
import UserManagementPageSAC from '../pages/SuperAdmin/UserManagementPage';
// import BranchManagementPageSAC from '../pages/SuperAdmin/BranchManagementPage'; // Old or placeholder
import BranchesPage from '../pages/SuperAdmin/BranchesPage.jsx'; // New page
import SystemSettingsPageSAC from '../pages/SuperAdmin/SystemSettingsPage.jsx'; // Ensured .jsx
import RolePermissionViewerPageSAC from '../pages/SuperAdmin/RolePermissionViewerPage.jsx'; // Ensured .jsx

// Root Admin Pages (New)
import SchoolManagementPage from '../pages/RootAdmin/SchoolManagementPage.jsx'; // Ensured .jsx

// Context Providers
import { SchoolProvider } from '../contexts/SchoolContext.jsx'; // Ensured .jsx

import UnauthorizedPage from '../pages/UnauthorizedPage.jsx'; // Ensured .jsx
import NotFoundPage from '../pages/NotFoundPage.jsx'; // Ensured .jsx

// Protected Route HOC
import ProtectedRoute from './ProtectedRoute.jsx'; // Ensured .jsx

// Example Profile Page (generic for now)
const UserProfilePage = () => <div>User Profile Page (Accessible by all logged-in users)</div>;


const AppRouter = () => {
  const { isLoading, isAuthenticated, token, user } = useAuthStore();

  useEffect(() => {
    const currentToken = useAuthStore.getState().token;
    const currentUser = useAuthStore.getState().user;
    const currentIsAuthenticated = useAuthStore.getState().isAuthenticated;
    const currentIsLoading = useAuthStore.getState().isLoading;

    if (currentIsLoading) {
        if (currentToken && currentUser) {
            useAuthStore.setState({ isAuthenticated: true, isLoading: false });
        } else if (currentToken && !currentUser) {
            console.warn("AppRouter: Token exists but user data missing. Logging out.");
            useAuthStore.getState().logout();
        } else if (!currentToken && currentIsAuthenticated){
            console.warn("AppRouter: Authenticated but no token. Logging out.");
            useAuthStore.getState().logout();
        } else {
            useAuthStore.setState({ isLoading: false });
        }
    }
  }, [isAuthenticated, isLoading, token, user]);


  if (isLoading && !useAuthStore.persist?.hasHydrated?.()) {
     return <div>Loading Application...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<HomePage />}/>
          <Route path="profile" element={<UserProfilePage />} />

          {/* Super Admin Routes */}
          <Route
            path="superadmin"
            element={<ProtectedRoute role="supperAdmin"><Outlet /></ProtectedRoute>}
          >
            <Route index element={<SuperAdminDashboardPage />} />
            <Route path="users" element={<UserManagementPageSAC />} />
            {/* Use the new BranchesPage for the "branches" route */}
            <Route path="branches" element={<BranchesPage />} />
            <Route path="settings" element={<SystemSettingsPageSAC />} />
            <Route path="roles" element={<RolePermissionViewerPageSAC />} />
          </Route>

          {/* Root Admin Routes (New) */}
          <Route
            path="rootadmin" // Base path for root user functionalities
            element={
              <ProtectedRoute role="rootUser">
                <SchoolProvider>
                  <Outlet />
                </SchoolProvider>
              </ProtectedRoute>
            }
          >
            {/* Redirect /rootadmin to /rootadmin/schools or a rootadmin dashboard if one exists */}
            <Route index element={<Navigate to="schools" replace />} />
            <Route path="schools" element={<SchoolManagementPage />} />
            {/* Add other rootUser specific routes here, e.g., system overview, global settings */}
          </Route>

          {/* Admin Routes */}
          <Route
            path="admin"
            element={<ProtectedRoute roles={['admin', 'supperAdmin']}><Outlet /></ProtectedRoute>}
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUserManagementPage />} />
            <Route path="enrollment" element={<StudentEnrollmentPageAdmin />} />
            <Route path="subjects" element={<SubjectManagementPageAdmin />} />
            <Route path="scheduling" element={<ClassSchedulingPageAdmin />} />
            <Route path="attendance-oversight" element={<AttendanceOversightPageAdmin />} />
            <Route path="grade-oversight" element={<GradeOversightPageAdmin />} />
          </Route>

          {/* Teacher Routes */}
          <Route
            path="teacher"
            element={<ProtectedRoute roles={['teacher', 'supperAdmin']}><Outlet /></ProtectedRoute>}
          >
            <Route index element={<TeacherDashboardPage />} />
            <Route path="my-classes" element={<MyClassesPageTeacher />} />
            <Route path="class/:classId/attendance" element={<AttendanceTakingPageTeacher />} />
            <Route path="class/:classId/grades" element={<GradeEntryPageTeacher />} /> {/* Added */}
          </Route>

          {/* Student Routes */}
          <Route
            path="student"
            element={<ProtectedRoute roles={['student', 'supperAdmin']}><Outlet /></ProtectedRoute>}
          >
            <Route index element={<StudentDashboardPage />} />
            {/* <Route path="grades" element={<StudentGradesPage />} /> */}
          </Route>

          {/* Parent Routes */}
           <Route
            path="parent"
            element={<ProtectedRoute roles={['parent', 'supperAdmin']}><Outlet /></ProtectedRoute>}
          >
            {/* <Route index element={<ParentDashboardPage />} /> */}
          </Route>

        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
