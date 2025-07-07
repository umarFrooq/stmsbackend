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
  TextField,
  MenuItem,
  Pagination,
} from '@mui/material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import SubmissionListItem from '../../components/assignment/SubmissionListItem';
import { getSubmissionsForAssignment } from '../../services/submissionService';
import { getAssignmentById } from '../../services/assignmentService';
import useAuthStore from '../../store/auth.store';
import { format } from 'date-fns';

const TeacherViewSubmissionsPage = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    status: '', // e.g., 'submitted', 'graded'
    studentName: '', // Will require backend support for student name search on submissions
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const limit = 10; // Submissions per page


  const fetchAssignmentAndSubmissions = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch assignment details
      const assignmentData = await getAssignmentById(assignmentId);
      // Basic check: ensure teacher is the one who created this assignment or has rights
      if (assignmentData.teacherId?._id !== user._id && assignmentData.teacherId !== user._id) {
          if(user.role !== 'admin' && user.role !== 'superadmin' && user.role !== 'rootUser'){ // Admins can view
            setError("You are not authorized to view submissions for this assignment.");
            setIsLoading(false);
            return;
          }
      }
      setAssignment(assignmentData);

      // Fetch submissions for this assignment
      const submissionParams = {
          // assignmentId: assignmentId, // This is in the URL path for getSubmissionsForAssignment
          sortBy: 'submissionDate:asc',
          limit,
          page
      };
      if (filters.status) submissionParams.status = filters.status;
      // if (filters.studentName) submissionParams.studentName = filters.studentName; // Add if backend supports

      const submissionsData = await getSubmissionsForAssignment(assignmentId, submissionParams);
      setSubmissions(submissionsData.results || []);
      setTotalPages(submissionsData.totalPages || 0);
      setTotalResults(submissionsData.totalResults || 0);

    } catch (err) {
      console.error('Error fetching assignment/submissions:', err);
      setError(err.message || 'Failed to fetch data.');
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, user?._id, user?.role, filters, page, limit]);

  useEffect(() => {
    fetchAssignmentAndSubmissions();
  }, [fetchAssignmentAndSubmissions]);

  const handleGradeSubmission = (submissionId) => {
    navigate(`/teacher/submissions/${submissionId}/grade`);
  };

  const handleViewSubmissionDetails = (submissionId) => {
    // Could navigate to a more detailed view or expand inline
    navigate(`/teacher/submissions/${submissionId}/details`); // Placeholder for a detailed view page
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset page on filter change
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };


  if (isLoading && !assignment) { // Show main loader only if assignment isn't loaded yet
    return (
      <Container sx={{ py: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Loading submissions...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 3 }}>
        <Alert severity="error">{error}</Alert>
         <Button
            startIcon={<ArrowBackIcon />}
            component={RouterLink}
            to="/teacher/assignments"
            variant="outlined"
            sx={{ mt: 2 }}
          >
            Back to My Assignments
          </Button>
      </Container>
    );
  }

  if (!assignment) {
    return (
      <Container sx={{ py: 3, textAlign: 'center' }}>
        <Typography>Assignment details could not be loaded.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        component={RouterLink}
        to="/teacher/assignments"
        variant="outlined"
        sx={{ mb: 2 }}
      >
        Back to My Assignments
      </Button>

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Submissions for: {assignment.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Subject: {assignment.subjectId?.name || 'N/A'} | Grade: {assignment.gradeId?.title || 'N/A'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Due Date: {assignment.dueDate ? format(new Date(assignment.dueDate), 'PPpp') : 'N/A'} | Total Marks: {assignment.totalMarks}
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{p:2, mb:2}}>
        <Typography variant="h6" gutterBottom>Filter Submissions</Typography>
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                 <TextField
                    select
                    label="Status"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    fullWidth
                    size="small"
                >
                    <MenuItem value=""><em>All Statuses</em></MenuItem>
                    <MenuItem value="submitted">Submitted</MenuItem>
                    <MenuItem value="graded">Graded</MenuItem>
                    <MenuItem value="pending_review">Pending Review</MenuItem>
                </TextField>
            </Grid>
            {/* Add Student Name filter if backend supports it */}
            {/* <Grid item xs={12} sm={6}>
                <TextField
                    label="Student Name"
                    name="studentName"
                    value={filters.studentName}
                    onChange={handleFilterChange}
                    fullWidth
                    size="small"
                />
            </Grid> */}
        </Grid>
      </Paper>


      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress size="small" /></Box>}
      {!isLoading && error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!isLoading && submissions.length === 0 && !error && (
        <Typography variant="subtitle1" sx={{ textAlign: 'center', my: 3 }}>
          No submissions found for this assignment yet, or none match your filters.
        </Typography>
      )}

      {!isLoading && submissions.length > 0 && (
        <Box>
          {submissions.map((submission) => (
            <SubmissionListItem
              key={submission._id}
              submission={submission}
              onGrade={() => handleGradeSubmission(submission._id)}
              onView={() => handleViewSubmissionDetails(submission._id)} // Or pass specific detail view handler
            />
          ))}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
};

export default TeacherViewSubmissionsPage;
