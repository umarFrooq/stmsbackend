import React from 'react';
import { Container, Typography, Paper, Box, Alert } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';

import ClassScheduleForm from '../../components/admin/ClassScheduleForm';
import useAuthStore from '../../store/auth.store';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const EditClassSchedulePage = () => {
  const navigate = useNavigate();
  const { scheduleId } = useParams(); // Get scheduleId from URL
  const { user } = useAuthStore();

  const schoolId = user?.schoolId;

  const handleSave = () => {
    navigate('/admin/schedules'); // Navigate back to the list after save
  };

  const handleCancel = () => {
    navigate('/admin/schedules'); // Navigate back to the list
  };

  if (!user && !scheduleId) {
      return <LoadingSpinner fullScreen />;
  }

  if (!schoolId && user && user.role !== 'rootUser') {
    return (
      <Container>
        <Typography color="error">
          School information is missing for your account. Cannot edit schedules.
        </Typography>
      </Container>
    );
  }

  if (!scheduleId) {
    return (
      <Container>
        <Alert severity="error">No schedule ID provided for editing.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handleCancel} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          Edit Class Schedule
        </Typography>
      </Box>
      <ClassScheduleForm
        scheduleId={scheduleId}
        schoolIdFromAdmin={schoolId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </Container>
  );
};

export default EditClassSchedulePage;
