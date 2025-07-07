import React, { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Box, Alert, CircularProgress, Paper } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import AssignmentForm from '../../components/assignment/AssignmentForm';
import { getAssignmentById, updateAssignment } from '../../services/assignmentService';
import useAuthStore from '../../store/auth.store';

const TeacherEditAssignmentPage = () => {
  const navigate = useNavigate();
  const { assignmentId } = useParams();
  const { user } = useAuthStore();

  const [initialData, setInitialData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // For fetching initial data
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAssignmentDetails = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // For teachers, the service getAssignmentById should scope to their school
      // and ensure they have permission (e.g. created it)
      const data = await getAssignmentById(assignmentId);
      if (data.teacherId?._id !== user._id && data.teacherId !== user._id) { // Check both populated and non-populated ID
          setError("You are not authorized to edit this assignment.");
          setInitialData(null);
          return;
      }
      setInitialData(data);
    } catch (err) {
      console.error('Error fetching assignment details:', err);
      setError(err.message || 'Failed to fetch assignment details.');
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, user?._id]);

  useEffect(() => {
    fetchAssignmentDetails();
  }, [fetchAssignmentDetails]);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    // Remove fields that shouldn't be sent or are derived (like teacherId)
    const { teacherId, schoolId, ...updateData } = formData;
    // Ensure IDs are strings if they were objects from initialData population
    if (updateData.subjectId && typeof updateData.subjectId === 'object') updateData.subjectId = updateData.subjectId._id;
    if (updateData.gradeId && typeof updateData.gradeId === 'object') updateData.gradeId = updateData.gradeId._id;
    if (updateData.branchId && typeof updateData.branchId === 'object') updateData.branchId = updateData.branchId._id;


    try {
      const updatedAssignment = await updateAssignment(assignmentId, updateData);
      setSuccess(`Assignment "${updatedAssignment.title}" updated successfully!`);
      // Optionally, update initialData if user might make further edits without navigating away
      // setInitialData(updatedAssignment);
      setTimeout(() => {
        navigate('/teacher/assignments'); // Redirect to the list page
      }, 1500);
    } catch (err) {
      console.error('Error updating assignment:', err);
      const errorMsg = err.message || (err.errors && err.errors.map(e => e.msg).join(', ')) || 'Failed to update assignment.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Container sx={{ py: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Loading assignment details...</Typography>
      </Container>
    );
  }

  if (error && !initialData) { // Critical error like not found or not authorized
    return (
      <Container sx={{ py: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }


  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Edit Assignment
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {isSubmitting && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
           <Typography sx={{ml: 2}}>Updating assignment...</Typography>
        </Box>
      )}

      {initialData && !success && ( // Hide form after successful submission and before redirect
        <AssignmentForm
          initialData={initialData}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          // schoolIdFromProps and branchIdFromProps not typically needed for teacher editing their own
        />
      )}
      {!initialData && !isLoading && !error && (
          <Paper sx={{p:2, textAlign:'center'}}>
            <Typography>Could not load assignment data to edit.</Typography>
          </Paper>
      )}
    </Container>
  );
};

export default TeacherEditAssignmentPage;
