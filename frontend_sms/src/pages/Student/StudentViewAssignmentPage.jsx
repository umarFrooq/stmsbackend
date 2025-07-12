import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link as MuiLink,
  Chip,
} from '@mui/material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArticleIcon from '@mui/icons-material/Article';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import HourglassDisabledIcon from '@mui/icons-material/HourglassDisabled';


import SubmissionForm from '../../components/assignment/SubmissionForm';
import SubmissionListItem from '../../components/assignment/SubmissionListItem'; // To display their own submission
import { getAssignmentById } from '../../services/assignmentService';
import { createSubmission, getSubmissions } from '../../services/submissionService'; // getSubmissions to check existing
import useAuthStore from '../../store/auth.store';
import { format } from 'date-fns';

const StudentViewAssignmentPage = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [assignment, setAssignment] = useState(null);
  const [mySubmission, setMySubmission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const fetchAssignmentAndSubmissionStatus = useCallback(async () => {
    if (!user?._id || !assignmentId) return;
    setIsLoading(true);
    setError('');
    setMySubmission(null);
    try {
      // Fetch assignment details
      // Service should ensure student can only access assignments for their grade and are published
      const assignmentData = await getAssignmentById(assignmentId);
       if (assignmentData.gradeId?._id !== user.gradeId && assignmentData.gradeId !== user.gradeId) {
           setError("This assignment is not intended for your grade.");
           setIsLoading(false);
           return;
       }
       if (assignmentData.status !== 'published') {
           setError("This assignment is not currently active.");
           setIsLoading(false);
           return;
       }
      setAssignment(assignmentData);

      // Check if student has already submitted this assignment
      const submissionParams = {
        assignmentId: assignmentId,
        studentId: user.id,
        limit: 1
      };
      const existingSubmissions = await getSubmissions(submissionParams);
      if (existingSubmissions.results && existingSubmissions.results.length > 0) {
        setMySubmission(existingSubmissions.results[0]);
      }
    } catch (err) {
      console.error('Error fetching assignment/submission status:', err);
      setError(err.message || 'Failed to fetch assignment details.');
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, user?._id, user?.gradeId]);

  useEffect(() => {
    fetchAssignmentAndSubmissionStatus();
  }, [fetchAssignmentAndSubmissionStatus]);

  const handleSubmission = async (formData) => {
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      const newSubmission = await createSubmission(assignmentId, formData);
      setMySubmission(newSubmission); // Update view with the new submission
      setSubmitSuccess('Assignment submitted successfully!');
      // Optionally, navigate away or disable form
    } catch (err) {
      console.error('Error submitting assignment:', err);
      setSubmitError(err.message || (err.errors && err.errors.map(e => e.msg).join(', ')) || 'Failed to submit assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dueDate = assignment?.dueDate ? new Date(assignment.dueDate) : null;
  const isPastDue = dueDate && dueDate < new Date();
  const canSubmit = assignment?.status === 'published' && (!isPastDue || assignment.allowLateSubmission) && !mySubmission;


  if (isLoading) {
    return (
      <Container sx={{ py: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Loading assignment...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button startIcon={<ArrowBackIcon />} component={RouterLink} to="/student/assignments" variant="outlined" sx={{ mt: 2 }}>
            Back to My Assignments
        </Button>
      </Container>
    );
  }

  if (!assignment) {
    return (
      <Container sx={{ py: 3, textAlign: 'center' }}>
        <Typography>Assignment not found or not accessible.</Typography>
         <Button startIcon={<ArrowBackIcon />} component={RouterLink} to="/student/assignments" variant="outlined" sx={{ mt: 2 }}>
            Back to My Assignments
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        component={RouterLink}
        to="/student/assignments"
        variant="outlined"
        sx={{ mb: 2 }}
      >
        Back to My Assignments
      </Button>

      <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {assignment.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Subject: {assignment.subjectId?.name || 'N/A'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Due Date: {dueDate ? format(dueDate, 'PPpp') : 'N/A'}
          {isPastDue && <Chip label="Past Due" color="warning" size="small" icon={<HourglassDisabledIcon />} sx={{ ml: 1 }} />}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{mb:1}}>
          Total Marks: {assignment.totalMarks}
        </Typography>
        {assignment.description && (
          <Box sx={{ my: 2, p:2, border: '1px dashed grey', borderRadius:1, whiteSpace: 'pre-wrap' }}>
            <Typography variant="body1" component="div" >{assignment.description}</Typography>
          </Box>
        )}

        {assignment.fileAttachments && assignment.fileAttachments.length > 0 && (
          <>
            <Typography variant="h6" component="h3" sx={{ mt: 2 }}>Teacher Attachments:</Typography>
            <List dense>
              {assignment.fileAttachments.map((file, index) => (
                <ListItem key={index} disableGutters>
                  <ListItemIcon><ArticleIcon /></ListItemIcon>
                  <ListItemText
                    primary={
                      <MuiLink href={file.filePath} target="_blank" rel="noopener noreferrer" underline="hover">
                        {file.fileName || 'View Attachment'}
                      </MuiLink>
                    }
                    secondary={file.fileType}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Paper>

      <Divider sx={{ my: 3 }} />

      {mySubmission ? (
        <Box>
          <Typography variant="h5" component="h2" gutterBottom sx={{color:'success.main', display:'flex', alignItems:'center'}}>
            <CheckCircleOutlineIcon sx={{mr:1}}/> You have submitted this assignment.
          </Typography>
          <SubmissionListItem submission={mySubmission} />
        </Box>
      ) : canSubmit ? (
        <>
          {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
          {submitSuccess && <Alert severity="success" sx={{ mb: 2 }}>{submitSuccess}</Alert>}
          {!submitSuccess && ( // Hide form after successful submission
            <SubmissionForm
              assignmentTitle={assignment.title}
              onSubmit={handleSubmission}
              isLoading={isSubmitting}
            />
          )}
        </>
      ) : (
        <Alert severity={isPastDue && !assignment.allowLateSubmission ? "error" : "info"}>
          {isPastDue && !assignment.allowLateSubmission
            ? "The due date for this assignment has passed and late submissions are not allowed."
            : "Submissions are currently not being accepted for this assignment or you have already submitted."}
        </Alert>
      )}
    </Container>
  );
};

export default StudentViewAssignmentPage;
