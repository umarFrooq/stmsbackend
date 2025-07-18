import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Grid,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { getAssignmentById } from '../../services/assignmentService';
import { getSubmissions } from '../../services/submissionService';
import useAuthStore from '../../store/auth.store';

const StudentAssignmentMarksPage = () => {
  const { assignmentId } = useParams();
  const { user } = useAuthStore();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAssignmentAndMarks = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const assignmentData = await getAssignmentById(assignmentId);
      setAssignment(assignmentData);

      const submissionParams = {
        assignmentId,
        studentId: user._id,
      };
      const submissionData = await getSubmissions(submissionParams);
      if (submissionData.results && submissionData.results.length > 0) {
        setSubmission(submissionData.results[0]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data.');
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, user._id]);

  useEffect(() => {
    fetchAssignmentAndMarks();
  }, [fetchAssignmentAndMarks]);

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Marks for {assignment?.title}
      </Typography>

      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {assignment && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6">Assignment Details</Typography>
              <Typography><strong>Subject:</strong> {assignment.subjectId?.name}</Typography>
              <Typography><strong>Total Marks:</strong> {assignment.totalMarks}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6">Your Marks</Typography>
              {submission ? (
                <Typography>
                  <strong>Obtained Marks:</strong> {submission.obtainedMarks}
                </Typography>
              ) : (
                <Typography>Marks have not been assigned yet.</Typography>
              )}
            </Grid>
          </Grid>
        </Paper>
      )}
    </Container>
  );
};

export default StudentAssignmentMarksPage;
