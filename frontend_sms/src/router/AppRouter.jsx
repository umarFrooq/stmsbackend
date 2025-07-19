import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/auth.store';

// Pages
import LoginPage from '../pages/Auth/LoginPage.jsx'; // Ensured .jsx
import DashboardLayout from '../components/layout/DashboardLayout.jsx'; // Ensured .jsx
import HomePage from '../pages/HomePage.jsx'; // Ensured .jsx
import StudentDashboardPage from '../pages/Student/StudentDashboardPage.jsx'; // Ensured .jsx
import MyAttendancePage from '../pages/Student/MyAttendancePage.jsx'; // Added for student attendance

// Teacher Pages
import TeacherDashboardPage from '../pages/Teacher/TeacherDashboardPage';
import MyClassesPageTeacher from '../pages/Teacher/MyClassesPage';
import AttendanceTakingPageTeacher from '../pages/Teacher/AttendanceTakingPage';
import GradeEntryPageTeacher from '../pages/Teacher/GradeEntryPage'; // Added
// Teacher Assignment Pages
import TeacherAssignmentsPage from '../pages/Teacher/TeacherAssignmentsPage.jsx';
import TeacherCreateAssignmentPage from '../pages/Teacher/TeacherCreateAssignmentPage.jsx';
import TeacherEditAssignmentPage from '../pages/Teacher/TeacherEditAssignmentPage.jsx';
import TeacherSubmissionsPage from '../pages/Teacher/TeacherSubmissionsPage.jsx';

// Student Assignment Pages
import StudentAssignmentsPage from '../pages/Student/StudentAssignmentsPage.jsx';
import StudentAssignmentMarksPage from '../pages/Student/StudentAssignmentMarksPage.jsx';


// Admin Pages
import AdminDashboardPage from '../pages/Admin/AdminDashboardPage';
import AdminUserManagementPage from '../pages/Admin/UserManagementPage';
import StudentEnrollmentPageAdmin from '../pages/Admin/StudentEnrollmentPage';
import SubjectManagementPageAdmin from '../pages/Admin/SubjectManagementPage';
// import ClassSchedulingPageAdmin from '../pages/Admin/ClassSchedulingPage'; // Original, to be replaced or complemented
import AttendanceOversightPageAdmin from '../pages/Admin/AttendanceOversightPage';
import GradeOversightPageAdmin from '../pages/Admin/GradeOversightPage';
import GradeManagementPage from '../pages/Admin/GradeManagementPage.jsx';

// New Class Schedule Management Pages for Admin
import ClassScheduleManagementPage from '../pages/Admin/ClassScheduleManagementPage.jsx';
import AddClassSchedulePage from '../pages/Admin/AddClassSchedulePage.jsx';
import EditClassSchedulePage from '../pages/Admin/EditClassSchedulePage.jsx';

// Admin Assignment Pages
import AdminAssignmentsListPage from '../pages/Admin/AdminAssignmentsListPage.jsx';
import AdminViewAssignmentDetailsPage from '../pages/Admin/AdminViewAssignmentDetailsPage.jsx';
import AdminViewSubmissionsPage from '../pages/Admin/AdminViewSubmissionsPage.jsx';


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

// Shared Pages
import AttendanceLogPage from '../pages/Shared/AttendanceLogPage.jsx'; // Added for shared attendance log

// Payroll Pages
import PayrollPage from '../pages/Payroll/PayrollPage.jsx';
import LeavePolicyPage from '../pages/Payroll/LeavePolicyPage.jsx';
import TeacherAttendancePage from '../pages/Payroll/TeacherAttendancePage.jsx';
// import TeacherDashboardPage from '../pages/Payroll/TeacherDashboardPage.jsx';


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

          {/* Shared Attendance Log Page */}
          <Route
            path="attendance-log"
            element={
              <ProtectedRoute roles={['admin', 'superadmin', 'teacher']} permission="viewAttendances">
                <AttendanceLogPage />
              </ProtectedRoute>
            }
          />

          {/* Super Admin Routes */}
          <Route
            path="superadmin"
            element={<ProtectedRoute role="superadmin"><Outlet /></ProtectedRoute>}
          >
            <Route index element={<SuperAdminDashboardPage />} />
            <Route path="users" element={<UserManagementPageSAC />} />
            {/* Use the new BranchesPage for the "branches" route */}
            <Route path="branches" element={<BranchesPage />} />
            <Route path="grades" element={<GradeManagementPage />} /> {/* Added Grade Management for SuperAdmin */}
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
            element={<ProtectedRoute roles={['admin', 'superadmin']}><Outlet /></ProtectedRoute>}
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUserManagementPage />} />
            <Route path="enrollment" element={<StudentEnrollmentPageAdmin />} />
            <Route path="subjects" element={<SubjectManagementPageAdmin />} />
            {/* <Route path="scheduling" element={<ClassSchedulingPageAdmin />} /> Replaced by new schedule routes */}
            <Route path="schedules" element={
              <ProtectedRoute roles={['admin', 'superadmin']} permission="viewClassSchedules">
                <ClassScheduleManagementPage />
              </ProtectedRoute>
            } />
            <Route path="schedules/new" element={
              <ProtectedRoute roles={['admin', 'superadmin']} permission="manageClassSchedules">
                <AddClassSchedulePage />
              </ProtectedRoute>
            } />
            <Route path="schedules/edit/:scheduleId" element={
              <ProtectedRoute roles={['admin', 'superadmin']} permission="manageClassSchedules">
                <EditClassSchedulePage />
              </ProtectedRoute>
            } />
            <Route path="attendance-oversight" element={<AttendanceOversightPageAdmin />} />
            <Route path="grade-oversight" element={<GradeOversightPageAdmin />} />
            <Route path="grades" element={<GradeManagementPage />} /> {/* Added Grade Management for Admin */}

            {/* Admin Assignment Routes */}
            <Route path="assignments" element={<ProtectedRoute permission="viewAllAssignmentsSchool"><AdminAssignmentsListPage /></ProtectedRoute>} />
            <Route path="assignments/:assignmentId/details" element={<ProtectedRoute permission="viewAllAssignmentsSchool"><AdminViewAssignmentDetailsPage /></ProtectedRoute>} />
            <Route path="submissions" element={<ProtectedRoute permission="viewAllSubmissionsSchool"><AdminViewSubmissionsPage /></ProtectedRoute>} />
            {/* Admin view/grade submission might reuse teacher's page or have its own */}
            <Route path="submissions/:submissionId/details" element={<ProtectedRoute permission="viewAllSubmissionsSchool"><div /></ProtectedRoute>} />
            <Route path="submissions/:submissionId/grade" element={<ProtectedRoute permission="gradeSubmission"><div /></ProtectedRoute>} />

            {/* Payroll Routes */}
            <Route path="payrolls" element={<ProtectedRoute permission="managePayrolls"><PayrollPage /></ProtectedRoute>} />
            <Route path="leave-policies" element={<ProtectedRoute permission="manageLeavePolicies"><LeavePolicyPage /></ProtectedRoute>} />
            <Route path="teacher-attendances" element={<ProtectedRoute permission="manageTeacherAttendances"><TeacherAttendancePage /></ProtectedRoute>} />
          </Route>

          {/* Teacher Routes */}
          <Route
            path="teacher"
            element={<ProtectedRoute roles={['teacher', 'superadmin']}><Outlet /></ProtectedRoute>}
          >
            <Route index element={<TeacherDashboardPage />} />
            <Route path="my-classes" element={<MyClassesPageTeacher />} />
            <Route path="class/:classId/attendance" element={<AttendanceTakingPageTeacher />} />
            <Route path="class/:classId/grades" element={<GradeEntryPageTeacher />} /> {/* Added */}

            {/* Teacher Assignment Routes */}
            <Route path="assignments" element={<ProtectedRoute permission="manageOwnAssignments"><TeacherAssignmentsPage /></ProtectedRoute>} />
            <Route path="assignments/new" element={<ProtectedRoute permission="manageOwnAssignments"><TeacherCreateAssignmentPage /></ProtectedRoute>} />
            <Route path="assignments/edit/:assignmentId" element={<ProtectedRoute permission="manageOwnAssignments"><TeacherEditAssignmentPage /></ProtectedRoute>} />
            <Route path="assignments/:assignmentId/submissions" element={<ProtectedRoute permission="manageOwnAssignments"><TeacherSubmissionsPage /></ProtectedRoute>} />

            {/* Payroll Routes */}
            <Route path="dashboard" element={<ProtectedRoute permission="getPayrolls"><TeacherDashboardPage /></ProtectedRoute>} />
          </Route>

          {/* Student Routes */}
          <Route
            path="student"
            element={<ProtectedRoute roles={['student', 'superadmin']}><Outlet /></ProtectedRoute>}
          >
            <Route index element={<StudentDashboardPage />} />
            {/* <Route path="grades" element={<StudentGradesPage />} /> */}
            <Route path="assignments" element={<ProtectedRoute permission="viewAssignmentsGrade"><StudentAssignmentsPage /></ProtectedRoute>} />
            <Route path="assignments/:assignmentId/marks" element={<ProtectedRoute permission="viewAssignmentsGrade"><StudentAssignmentMarksPage /></ProtectedRoute>} />
            {/* Submission form is part of StudentViewAssignmentPage */}
            <Route
              path="my-attendance"
              element={
                <ProtectedRoute roles={['student']} permission="viewAttendances">
                  <MyAttendancePage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Parent Routes */}
           <Route
            path="parent"
            element={<ProtectedRoute roles={['parent', 'superadmin']}><Outlet /></ProtectedRoute>}
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
