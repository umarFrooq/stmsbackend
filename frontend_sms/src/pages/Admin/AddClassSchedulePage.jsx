import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';

import ClassScheduleForm from '../../components/admin/ClassScheduleForm';
import useAuthStore from '../../store/auth.store';

const AddClassSchedulePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore(); // Get admin user to pass their schoolId

  // Admins are scoped to their school. schoolId is needed by the form.
  // Ensure user and user.schoolId are available and schoolId is a string.
  let schoolIdString = null;
  if (user?.schoolId) {
    if (typeof user.schoolId === 'object' && user.schoolId?.id) {
      schoolIdString = user.schoolId.id; // If schoolId is an object like { id: '...', name: '...' }
    } else if (typeof user.schoolId === 'string') {
      schoolIdString = user.schoolId; // If schoolId is already a string
    }
  }

  const handleSave = () => {
    navigate('/admin/schedules'); // Navigate back to the list after save
  };

  const handleCancel = () => {
    navigate('/admin/schedules'); // Navigate back to the list
  };

  if (!schoolIdString && user && user.role !== 'rootUser' && user.role !== 'superadmin') {
    // Allow superadmin/rootUser to potentially proceed if school selection is handled differently later,
    // but for 'admin', schoolId is critical.
    return (
      <Container sx={{mt: 2}}>
        <Typography color="error" paragraph>
          School information is missing or in an incorrect format for your admin account. Cannot add schedules.
        </Typography>
        <Typography variant="body2">
          Please ensure your user profile is correctly associated with a school. (Expected string ID, got: {JSON.stringify(user?.schoolId)})
        </Typography>
      </Container>
    );
  }
  // For rootUser/superadmin without a direct schoolId, the ClassScheduleForm would ideally have a school selector.
  // For now, if schoolIdString is null for these roles, they might not be able to use this specific page effectively
  // until the form is enhanced. This page is primarily for the 'admin' (school-scoped) role.

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handleCancel} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          Add New Class Schedule
        </Typography>
      </Box>
      <ClassScheduleForm
        schoolIdFromAdmin={schoolIdString}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </Container>
  );
};

export default AddClassSchedulePage;
