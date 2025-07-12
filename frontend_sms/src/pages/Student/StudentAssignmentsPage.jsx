import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  MenuItem,
  Pagination,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import AssignmentListItem from '../../components/assignment/AssignmentListItem'; // Student version will have different actions
import { getAssignments } from '../../services/assignmentService';
import subjectService from '../../services/subjectService'; // Placeholder for student's subjects
import useAuthStore from '../../store/auth.store';

const StudentAssignmentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore(); // Student user object should have gradeId, enrolled subjects

  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    subjectId: '',
    dueDateFrom: '',
    dueDateTo: '',
  });
  const [subjects, setSubjects] = useState([]); // Subjects student is enrolled in or all for their grade
  const [loadingFilterData, setLoadingFilterData] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 10;

  const fetchStudentAssignments = useCallback(async () => {
    if (!user?.gradeId) {
      setError("Your grade information is not available. Cannot fetch assignments.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const params = {
        sortBy: 'dueDate:asc', // Show upcoming due dates first
        limit,
        page,
      };
      if (filters.subjectId) params.subjectId = filters.subjectId;
      if (filters.dueDateFrom) params.dueDateFrom = filters.dueDateFrom;
      if (filters.dueDateTo) params.dueDateTo = filters.dueDateTo;


      const data = await getAssignments(params);
      setAssignments(data.results || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error('Error fetching student assignments:', err);
      setError(err.message || 'Failed to fetch assignments.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.gradeId, filters, page, limit]);

  const fetchStudentSubjects = useCallback(async () => {
    if (user?.enrolledSubjects && user.enrolledSubjects.length > 0) {
      setSubjects(user.enrolledSubjects);
      return;
    }

    // Fallback to fetching subjects by grade if not in user object
    if (!user?.gradeId || !user?.schoolId?._id) {
      return;
    }

    setLoadingFilterData(true);
    try {
      const subjectParams = { schoolId: user.schoolId._id, gradeId: user.gradeId, limit: 200, sortBy: 'name:asc' };
      const subjectsForGrade = await subjectService.getSubjects(subjectParams);
      setSubjects(subjectsForGrade.results || []);
    } catch (error) {
      console.error("Error fetching student's subjects: ", error);
    } finally {
      setLoadingFilterData(false);
    }
  }, [user]);


  useEffect(() => {
    if (user?.gradeId) {
      fetchStudentAssignments();
      fetchStudentSubjects();
    }
  }, [fetchStudentAssignments, fetchStudentSubjects, user?.gradeId]);


  const handleViewDetails = (assignmentId) => {
    navigate(`/student/assignments/${assignmentId}`);
  };

  // For student, onSubmitAssignment is essentially viewing details where they can submit
  const handleSubmitAssignmentRedirect = (assignmentId) => {
      navigate(`/student/assignments/${assignmentId}/submit`); // Or just /student/assignments/:assignmentId
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset page on filter change
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };


  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Assignments
      </Typography>

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Filter Assignments</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Subject"
              name="subjectId"
              value={filters.subjectId}
              onChange={handleFilterChange}
              fullWidth
              size="small"
              disabled={loadingFilterData || subjects.length === 0}
            >
              <MenuItem value=""><em>All Subjects</em></MenuItem>
              {subjects.map(subject => (
                <MenuItem key={subject._id} value={subject._id}>{subject.name} ({subject.code})</MenuItem>
              ))}
            </TextField>
             {loadingFilterData && <CircularProgress size={20} sx={{mt:1}}/>}
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              type="date"
              label="Due Date From"
              name="dueDateFrom"
              value={filters.dueDateFrom}
              onChange={handleFilterChange}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              type="date"
              label="Due Date To"
              name="dueDateTo"
              value={filters.dueDateTo}
              onChange={handleFilterChange}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!isLoading && assignments.length === 0 && !error && (
        <Typography variant="subtitle1" sx={{ textAlign: 'center', my: 3 }}>
          No assignments available for you at the moment, or none match your filters.
        </Typography>
      )}

      {!isLoading && assignments.length > 0 && (
         <Box>
          {assignments.map((assignment) => (
            <AssignmentListItem
              key={assignment.id}
              assignment={assignment}
              // For student, onViewDetails is the primary action
              onViewDetails={() => handleViewDetails(assignment.id)}
              // onSubmitAssignment can also be handled by onViewDetails if form is on that page
              onSubmitAssignment={() => handleSubmitAssignmentRedirect(assignment.id)}
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

export default StudentAssignmentsPage;
