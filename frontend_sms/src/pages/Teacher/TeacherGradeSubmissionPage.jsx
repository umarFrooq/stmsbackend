import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  TextField,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link as MuiLink,
  Divider,
} from '@mui/material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArticleIcon from '@mui/icons-material/Article';
import SaveIcon from '@mui/icons-material/Save';

import { submissionService } from '../../services';
import useAuthStore from '../../store/auth.store';
import { format } from 'date-fns';

const TeacherGradeSubmissionPage = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [submission, setSubmission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [gradeData, setGradeData] = useState({
    obtainedMarks: '',
    teacherRemarks: '',
  });

  const fetchSubmissionDetails = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const subData = await submissionService.getSubmissionById(submissionId);
      // Authorization: Ensure the teacher is allowed to grade this.
      // The backend service for grading will do the final check, but a client-side check is good UX.
      if (subData.assignmentId?.teacherId?._id !== user.id && subData.assignmentId?.teacherId !== user.id) {
           if(user.role !== 'admin' && user.role !== 'superadmin' && user.role !== 'rootUser'){
             setError("You are not authorized to grade this submission.");
             setIsLoading(false);
             return;
           }
      }
      setSubmission(subData);
      setGradeData({
        obtainedMarks: subData.obtainedMarks ?? '',
        teacherRemarks: subData.teacherRemarks || '',
      });
    } catch (err) {
      console.error('Error fetching submission details:', err);
      setError(err.message || 'Failed to fetch submission details.');
    } finally {
      setIsLoading(false);
    }
  }, [submissionId, user?.id, user?.role]);

  useEffect(() => {
    fetchSubmissionDetails();
  }, [fetchSubmissionDetails]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setGradeData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitGrade = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    if (gradeData.obtainedMarks === '' || gradeData.obtainedMarks === null) {
        setError('Obtained marks are required.');
        setIsSubmitting(false);
        return;
    }
    const marks = parseFloat(gradeData.obtainedMarks);
    if (isNaN(marks) || marks < 0 || marks > (submission?.assignmentId?.totalMarks ?? Infinity)) {
      setError(`Obtained marks must be a number between 0 and ${submission?.assignmentId?.totalMarks || 'the total marks'}.`);
      setIsSubmitting(false);
      return;
    }


    try {
      await submissionService.gradeSubmission(submissionId, {
        obtainedMarks: marks,
        teacherRemarks: gradeData.teacherRemarks,
      });
      setSuccess('Submission graded successfully!');
      setTimeout(() => {
        // Navigate back to the list of submissions for that assignment
        navigate(`/teacher/assignments/${submission?.assignmentId?._id || submission?.assignmentId}/submissions`);
      }, 1500);
    } catch (err) {
      console.error('Error grading submission:', err);
      setError(err.message || 'Failed to grade submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignmentLink = submission?.assignmentId?._id
    ? `/teacher/assignments/${submission.assignmentId._id}/submissions`
    : "/teacher/assignments";


  if (isLoading) {
    return (
      <Container sx={{ py: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Loading submission...</Typography>
      </Container>
    );
  }

  if (error && !submission) { // Critical error
    return (
      <Container sx={{ py: 3 }}>
        <Alert severity="error">{error}</Alert>
         <Button startIcon={<ArrowBackIcon />} component={RouterLink} to={assignmentLink} variant="outlined" sx={{ mt: 2 }}>
            Back
        </Button>
      </Container>
    );
  }

  if (!submission) {
      return (
          <Container sx={{py: 3, textAlign: 'center'}}>
              <Typography>Submission not found.</Typography>
               <Button startIcon={<ArrowBackIcon />} component={RouterLink} to={assignmentLink} variant="outlined" sx={{ mt: 2 }}>
                    Back
                </Button>
          </Container>
      )
  }


  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        component={RouterLink}
        to={assignmentLink}
        variant="outlined"
        sx={{ mb: 2 }}
      >
        Back to Submissions
      </Button>

      <Typography variant="h4" component="h1" gutterBottom>
        Grade Submission
      </Typography>

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Assignment: {submission.assignmentId?.title || 'N/A'}</Typography>
        <Typography variant="body1">Student: {submission.studentId?.firstName || ''} {submission.studentId?.lastName || ''} ({submission.studentId?.email || 'N/A'})</Typography>
        <Typography variant="body2" color="text.secondary">
          Submitted On: {submission.submissionDate ? format(new Date(submission.submissionDate), 'PPpp') : 'N/A'}
          {submission.isLateSubmission && <Chip label="Late Submission" color="error" size="small" sx={{ ml: 1 }} />}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Marks for Assignment: {submission.assignmentId?.totalMarks ?? 'N/A'}
        </Typography>
      </Paper>

      {submission.submittedFiles && submission.submittedFiles.length > 0 && (
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Submitted Files</Typography>
          <List dense>
            {submission.submittedFiles.map((file, index) => (
              <ListItem key={index} disableGutters>
                <ListItemIcon><ArticleIcon /></ListItemIcon>
                <ListItemText
                  primary={
                    <MuiLink href={file.filePath} target="_blank" rel="noopener noreferrer" underline="hover">
                      {file.fileName || 'View File'}
                    </MuiLink>
                  }
                  secondary={file.fileType || 'Unknown type'}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {submission.studentRemarks && (
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Student Remarks</Typography>
            <Typography variant="body1" sx={{whiteSpace: 'pre-wrap'}}>{submission.studentRemarks}</Typography>
        </Paper>
      )}

      <Divider sx={{my:3}} />

      <Typography variant="h5" component="h2" gutterBottom>
        Enter Grade
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box component="form" onSubmit={handleSubmitGrade} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              name="obtainedMarks"
              label={`Obtained Marks (Out of ${submission.assignmentId?.totalMarks || 'N/A'})`}
              type="number"
              value={gradeData.obtainedMarks}
              onChange={handleInputChange}
              required
              fullWidth
              InputProps={{
                  inputProps: {
                      min: 0,
                      max: submission.assignmentId?.totalMarks ?? undefined
                  }
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="teacherRemarks"
              label="Teacher Remarks / Feedback (Optional)"
              value={gradeData.teacherRemarks}
              onChange={handleInputChange}
              multiline
              rows={4}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting || isLoading || !!success}
              fullWidth
              startIcon={<SaveIcon />}
            >
              {isSubmitting ? <CircularProgress size={24} /> : (submission.status === 'graded' ? 'Update Grade' : 'Submit Grade')}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default TeacherGradeSubmissionPage;
