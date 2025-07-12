import React, { useState } from 'react';
import { Container, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AssignmentForm from '../../components/assignment/AssignmentForm';
import { assignmentService } from '../../services';
import useAuthStore from '../../store/auth.store';

const TeacherCreateAssignmentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    const assignmentData = {
      ...formData,
      // teacherId is set by backend from user token
      // schoolId is also set by backend from user token (for teacher role)
      // If schoolId or branchId needs to be explicitly passed for teachers (e.g., if they teach in multiple branches/schools)
      // this logic would need adjustment, but current backend for teacher implies it from user's context.
    };

    // For rootUser creating, schoolId would be passed in formData.schoolId or a separate prop to AssignmentForm

    try {
      const newAssignment = await assignmentService.createAssignment(assignmentData);
      setSuccess(`Assignment "${newAssignment.title}" created successfully!`);
      setTimeout(() => {
        navigate('/teacher/assignments'); // Redirect to the list page
      }, 1500);
    } catch (err) {
      console.error('Error creating assignment:', err);
      const errorMsg = err.message || (err.errors && err.errors.map(e => e.msg).join(', ')) || 'Failed to create assignment.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Create New Assignment
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {isSubmitting && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
          <Typography sx={{ml: 2}}>Submitting assignment...</Typography>
        </Box>
      )}

      {!success && ( // Hide form after successful submission and before redirect
        <AssignmentForm
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          // schoolIdFromProps and branchIdFromProps would be for root/admin context if they use this form
          // For teacher, their schoolId and potentially branchId are in their user object
        />
      )}
    </Container>
  );
};

export default TeacherCreateAssignmentPage;
