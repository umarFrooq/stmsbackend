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
import { assignmentService, subjectService } from '../../services';
import useAuthStore from '../../store/auth.store';

const StudentAssignmentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore(); // Student user object should have gradeId, enrolled subjects

  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    subjectId: '',
    // dueDateFrom: '', // Could add date filters if needed
    // dueDateTo: '',
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
      // Add other filters like date range if implemented

      const data = await assignmentService.getAssignments(params);
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
    // This logic depends on how student's subjects are determined.
    // Option 1: Student object has enrolledSubjectIds.
    // Option 2: Fetch all subjects for the student's gradeId.
    // For now, assume fetching subjects for the student's grade.
    if (!user?.gradeId || !user?.schoolId?._id) {
      // console.warn("User schoolId or schoolId._id is not available for fetching subjects.");
      // Optionally set an error or return if this data is critical for proceeding
      return;
    }

    setLoadingFilterData(true);
    try {
      // This might need a specific endpoint or adjustment if subjects are directly linked to students
      // or if we just show all subjects available for their grade in that school.
      // const subjectParams = { schoolId: user.schoolId._id, gradeId: user.gradeId, limit: 200, sortBy: 'name:asc' };
      // The backend getSubjects might need to support gradeId filter or we filter from all school subjects.
      // Let's assume for now subjectService.getSubjects can take gradeId or we fetch all school subjects and let user filter.
      // For simplicity, we can use the same subjectService.getSubjects as teachers, assuming student has access to these subjects.
      // A more robust solution would be to have a list of subjects the student is specifically enrolled in.
      const schoolSubjects = await subjectService.getSubjects({ schoolId: user.schoolId._id, limit: 500 });
      // TODO: Filter these subjects based on student's actual enrollment if that data is available.
      // For now, showing all subjects in the school as an example.
      setSubjects(schoolSubjects.results || []);

    } catch (error) {
      console.error("Error fetching student's subjects: ", error);
      // setError("Could not load subject filter options."); // Don't overwrite main error
    } finally {
      setLoadingFilterData(false);
    }
  }, [user?.gradeId, user?.schoolId?._id]);


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
          {/* Add Date Filters if needed */}
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
