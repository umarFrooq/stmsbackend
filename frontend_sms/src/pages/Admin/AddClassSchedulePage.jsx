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
  // Ensure user and user.schoolId are available.
  // If not, display an error or loading state.
  const schoolId = user?.schoolId;

  const handleSave = () => {
    navigate('/admin/schedules'); // Navigate back to the list after save
  };

  const handleCancel = () => {
    navigate('/admin/schedules'); // Navigate back to the list
  };

  if (!schoolId && user && user.role !== 'rootUser') { // rootUser might not have a direct schoolId
    return (
      <Container>
        <Typography color="error">
          School information is missing for your account. Cannot add schedules.
        </Typography>
      </Container>
    );
  }
  // For rootUser, the form would need a school selector, which is not yet implemented in ClassScheduleForm.
  // This page is primarily for 'admin' role.

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
        schoolIdFromAdmin={schoolId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </Container>
  );
};

export default AddClassSchedulePage;
