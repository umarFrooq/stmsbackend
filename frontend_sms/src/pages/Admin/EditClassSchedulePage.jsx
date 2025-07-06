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

  // Ensure user and user.schoolId are available and schoolId is a string.
  let schoolIdString = null;
  if (user?.schoolId) {
    if (typeof user.schoolId === 'object' && user.schoolId?.id) {
      schoolIdString = user.schoolId.id;
    } else if (typeof user.schoolId === 'string') {
      schoolIdString = user.schoolId;
    }
  }

  const handleSave = () => {
    navigate('/admin/schedules'); // Navigate back to the list after save
  };

  const handleCancel = () => {
    navigate('/admin/schedules'); // Navigate back to the list
  };

  if (!user && !scheduleId) {
      return <LoadingSpinner fullScreen />;
  }

  if (!schoolIdString && user && user.role !== 'rootUser' && user.role !== 'superadmin') {
     return (
      <Container sx={{mt: 2}}>
        <Typography color="error" paragraph>
          School information is missing or in an incorrect format for your admin account. Cannot edit schedules.
        </Typography>
        <Typography variant="body2">
            Please ensure your user profile is correctly associated with a school. (Expected string ID, got: {JSON.stringify(user?.schoolId)})
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
        schoolIdFromAdmin={schoolIdString}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </Container>
  );
};

export default EditClassSchedulePage;
