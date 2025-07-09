import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import useAuthStore from '../../store/auth.store'; // To potentially get current user's roles/permissions for context

// Mock service for fetching roles and their permissions
// In a real app, this would come from an API endpoint protected for SuperAdmins.
// The data structure should ideally match what `config/roles.js` and `app/rbac/permissions.js` define.
const mockRbacService = {
  getRolePermissions: async () => {
    await new Promise(resolve => setTimeout(resolve, 700));
    // This mock data should reflect the backend's role-permission mapping.
    // It's simplified here. A real backend would provide a more structured list.
    return {
      superAdmin: ['manageSystemSettings', 'manageUserAccounts', 'manageBranches', 'viewAuditLogs', 'manageRolesAndPermissions', 'ALL_ACCESS'],
      admin: ['manageStudentEnrollment',"manageOwnAssignments", 'manageTeacherAccounts', 'manageStudentAccounts', 'manageParentAccounts', 'manageCourseCatalog', 'manageClassScheduling', 'viewBranchReports'],
      teacher: ['manageClassAttendanceRecords', 'enterStudentGrades', 'viewAssignedStudents', 'uploadLearningMaterials', 'viewOwnProfile',"manageOwnAssignments"],
      student: ['viewOwnGrades', 'viewOwnAttendance', 'viewOwnTimetable', 'accessLearningMaterials', 'viewOwnProfile'],
      parent: ['viewChildGrades', 'viewChildAttendance', 'viewChildTimetable', 'viewOwnProfile'],
    };
  },
  // getAllPermissionsList: async () => { // To show a master list of all possible permissions
  //   await new Promise(resolve => setTimeout(resolve, 300));
  //   return [
  //     'manageSystemSettings', 'manageUserAccounts', 'manageBranches', ...
  //   ];
  // }
};

const RolePermissionViewerPage = () => {
  const [rolePermissions, setRolePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRole, setExpandedRole] = useState(false);

  const { roles: currentUserRoles } = useAuthStore(); // Current user's roles for context if needed

  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await mockRbacService.getRolePermissions();
        setRolePermissions(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch role and permission data.');
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedRole(isExpanded ? panel : false);
  };

  if (loading) {
    return (
      <Container sx={{py:3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <CircularProgress />
        <Typography sx={{ml:2}}>Loading roles and permissions...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{py:3}}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3 }}>
          System Roles and Permissions Viewer
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{mb: 3}}>
          This page provides a read-only view of the permissions associated with each role in the system.
          Actual management of roles and permissions might require direct backend changes or a more advanced UI (not implemented here).
          {currentUserRoles.includes('superAdmin') ? '' : ' (Your view might be limited based on your role)'}
        </Typography>

        {Object.keys(rolePermissions).length === 0 && !loading && (
            <Typography>No role data found.</Typography>
        )}

        {Object.entries(rolePermissions).map(([role, permissions]) => (
          <Accordion
            key={role}
            expanded={expandedRole === role}
            onChange={handleAccordionChange(role)}
            TransitionProps={{ unmountOnExit: true }} // For better performance
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${role}-content`}
              id={`${role}-header`}
            >
              <Typography variant="h6" component="div" sx={{ textTransform: 'capitalize', flexGrow: 1 }}>
                {role.replace(/([A-Z])/g, ' $1')} {/* Add space before capital letters for display */}
              </Typography>
              <Chip label={`${permissions.length} permissions`} size="small" />
            </AccordionSummary>
            <AccordionDetails sx={{ backgroundColor: 'action.hover' }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {permissions.length > 0 ? permissions.map((permission) => (
                  <Chip key={permission} label={permission} variant="outlined" size="small" />
                )) : (
                  <Typography variant="caption">No specific permissions listed for this role (may have implicit access or none).</Typography>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>
    </Container>
  );
};

export default RolePermissionViewerPage;
