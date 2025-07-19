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
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link as MuiLink,
  Pagination,
  Chip,
} from '@mui/material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArticleIcon from '@mui/icons-material/Article';

import SubmissionListItem from '../../components/assignment/SubmissionListItem';
import { getSubmissionsForAssignment } from '../../services/submissionService';
import { getAssignmentById } from '../../services/assignmentService';
import useAuthStore from '../../store/auth.store';

const AdminViewAssignmentDetailsPage = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore(); // Admin user

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 10; // Submissions per page


  const fetchAssignmentAndSubmissionsDetails = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch assignment details - admin should have access within their scope (schoolId or all for root)
      const assignmentData = await getAssignmentById(assignmentId, {
          // For root/superadmin, if they selected a school in a previous filter,
          // that schoolId might need to be passed if getAssignmentById service requires it for scoping.
          // However, assignmentId is globally unique, so it might not be needed if permissions are right.
          // For now, assuming service handles admin/root access correctly.
      });
      setAssignment(assignmentData);

      // Fetch submissions for this assignment
      const submissionParams = {
          sortBy: 'submissionDate:asc',
          limit,
          page
      };
      const submissionsData = await getSubmissionsForAssignment(assignmentId, submissionParams);
      setSubmissions(submissionsData.results || []);
      setTotalPages(submissionsData.totalPages || 0);

    } catch (err) {
      console.error('Error fetching assignment/submissions for admin view:', err);
      setError(err.message || 'Failed to fetch data.');
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, page, limit]);

  useEffect(() => {
    fetchAssignmentAndSubmissionsDetails();
  }, [fetchAssignmentAndSubmissionsDetails]);

  const handleGradeSubmission = (submissionId) => {
    // Admin might have a different grading page or use the teacher's if permissions align
    navigate(`/admin/submissions/${submissionId}/grade`); // Or /teacher/submissions/... if using same page
  };

  const handleViewSubmissionDetails = (submissionId) => {
    navigate(`/admin/submissions/${submissionId}/details`); // Placeholder for a detailed admin view of submission
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  if (isLoading && !assignment) {
    return (
      <Container sx={{ py: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Loading assignment details and submissions...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 3 }}>
        <Alert severity="error">{error}</Alert>
         <Button startIcon={<ArrowBackIcon />} component={RouterLink} to="/admin/assignments" variant="outlined" sx={{ mt: 2 }}>
            Back to Assignments List
          </Button>
      </Container>
    );
  }

  if (!assignment) {
    return (
      <Container sx={{ py: 3, textAlign: 'center' }}>
        <Typography>Assignment details could not be loaded.</Typography>
         <Button startIcon={<ArrowBackIcon />} component={RouterLink} to="/admin/assignments" variant="outlined" sx={{ mt: 2 }}>
            Back to Assignments List
          </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        component={RouterLink}
        to="/admin/assignments" // Link back to the admin list page
        variant="outlined"
        sx={{ mb: 2 }}
      >
        Back to Assignments List
      </Button>

      <Paper elevation={3} sx={{ p: {xs:2, md:3}, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Assignment: {assignment.title}
        </Typography>
        <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">
                    Subject: {assignment.subjectId?.name || 'N/A'} ({assignment.subjectId?.code || ''})
                </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">
                    Grade: {assignment.gradeId?.title || 'N/A'} {assignment.branchId?.name ? `(${assignment.branchId.name})` : ''}
                </Typography>
            </Grid>
             <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">
                    Teacher: {assignment.teacherId?.firstName || ''} {assignment.teacherId?.lastName || ''}
                </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
                 <Typography variant="body2" color="text.secondary">
                    Status: <Chip label={assignment.status || "N/A"} size="small" color={assignment.status === 'published' ? 'success' : (assignment.status === 'draft' ? 'default' : 'warning')} />
                </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                Due Date: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : 'N/A'}
                </Typography>
            </Grid>
             <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                Total Marks: {assignment.totalMarks}
                </Typography>
            </Grid>
        </Grid>

        {assignment.description && (
           <Box sx={{ my: 2, p:2, border: '1px dashed #ccc', borderRadius:1, whiteSpace: 'pre-wrap', background: '#f9f9f9' }}>
            <Typography variant="h6" component="h3" gutterBottom sx={{fontSize: '1.1rem'}}>Description:</Typography>
            <Typography variant="body1" component="div">{assignment.description}</Typography>
          </Box>
        )}

        {assignment.fileAttachments && assignment.fileAttachments.length > 0 && (
          <>
            <Typography variant="h6" component="h3" sx={{ mt: 2, fontSize: '1.1rem' }}>Teacher Attachments:</Typography>
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

      <Divider sx={{my:2}} />
      <Typography variant="h5" component="h2" gutterBottom>
          Submissions ({totalResults})
      </Typography>

      {isLoading && submissions.length === 0 && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress size="small" /></Box>}

      {!isLoading && submissions.length === 0 && !error && (
        <Typography variant="subtitle1" sx={{ textAlign: 'center', my: 3 }}>
          No submissions found for this assignment yet.
        </Typography>
      )}

      {!isLoading && submissions.length > 0 && (
        <Box>
          {submissions.map((submission) => (
            <SubmissionListItem
              key={submission._id}
              submission={submission}
              // Admin might have different grade/view actions or use teacher's
              onGrade={user.permissions?.includes('gradeSubmission') ? () => handleGradeSubmission(submission._id) : undefined}
              onView={() => handleViewSubmissionDetails(submission._id)}
            />
          ))}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
};

export default AdminViewAssignmentDetailsPage;
