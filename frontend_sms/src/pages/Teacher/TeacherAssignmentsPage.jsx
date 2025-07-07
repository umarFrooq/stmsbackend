import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  MenuItem,
  Pagination,
  Paper,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';

import AssignmentListItem from '../../components/assignment/AssignmentListItem';
import { getAssignments, deleteAssignment } from '../../services/assignmentService';
import subjectService from '../../services/subjectService'; // Placeholder
import gradeService from '../../services/gradeService';     // Placeholder
import useAuthStore from '../../store/auth.store';

const TeacherAssignmentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    status: '',
    subjectId: '',
    gradeId: '',
  });
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loadingFilterData, setLoadingFilterData] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const limit = 10; // Assignments per page

  const fetchTeacherAssignments = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {
        teacherId: user?._id, // Backend service will use this if user is teacher
        schoolId: user?.schoolId, // Scope to teacher's school
        sortBy: 'dueDate:desc',
        limit,
        page,
      };
      if (filters.status) params.status = filters.status;
      if (filters.subjectId) params.subjectId = filters.subjectId;
      if (filters.gradeId) params.gradeId = filters.gradeId;

      const data = await getAssignments(params);
      setAssignments(data.results || []);
      setTotalPages(data.totalPages || 0);
      setTotalResults(data.totalResults || 0);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err.message || 'Failed to fetch assignments.');
    } finally {
      setIsLoading(false);
    }
  }, [user?._id, user?.schoolId, filters, page, limit]);

  const fetchFilterDropdownData = useCallback(async () => {
    if (!user?.schoolId) return;
    setLoadingFilterData(true);
    try {
      const subjectParams = { schoolId: user.schoolId, limit: 500, sortBy: 'name:asc' };
      const subjectRes = await subjectService.getSubjects(subjectParams);
      setSubjects(subjectRes.results || []);

      // Fetch grades relevant to the teacher (e.g., grades they are assigned to or all in school)
      // For simplicity, fetching all grades in the school. Teacher might only create for specific grades.
      const gradeParams = { schoolId: user.schoolId, limit: 500, sortBy: 'title:asc' };
      const gradeRes = await gradeService.getGrades(gradeParams);
      setGrades(gradeRes.results || []);

    } catch (error) {
      console.error("Error fetching filter data: ", error);
      setError("Could not load filter options.");
    } finally {
      setLoadingFilterData(false);
    }
  }, [user?.schoolId]);


  useEffect(() => {
    if (user?._id && user?.schoolId) {
      fetchTeacherAssignments();
    }
  }, [fetchTeacherAssignments, user?._id, user?.schoolId]);

  useEffect(() => {
    if (user?.schoolId) {
      fetchFilterDropdownData();
    }
  }, [fetchFilterDropdownData, user?.schoolId]);


  const handleEdit = (assignmentId) => {
    navigate(`/teacher/assignments/edit/${assignmentId}`);
  };

  const handleDelete = async (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this assignment? This may also delete related submissions.')) {
      setIsLoading(true); // Consider a specific loading state for delete
      try {
        await deleteAssignment(assignmentId);
        // Refetch assignments after delete
        setAssignments(prev => prev.filter(a => a._id !== assignmentId));
        setTotalResults(prev => prev -1);
        // If current page becomes empty, go to previous page
        if (assignments.length === 1 && page > 1) {
            setPage(page - 1);
        } else {
            fetchTeacherAssignments(); // Or just refetch current page if not empty
        }

      } catch (err) {
        console.error('Error deleting assignment:', err);
        setError(err.message || 'Failed to delete assignment.');
      } finally {
        setIsLoading(false); // Reset specific loading state
      }
    }
  };

  const handleViewSubmissions = (assignmentId) => {
    navigate(`/teacher/assignments/${assignmentId}/submissions`);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          My Assignments
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/teacher/assignments/new"
        >
          Create Assignment
        </Button>
      </Box>

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Filter Assignments</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              fullWidth
              size="small"
              disabled={loadingFilterData}
            >
              <MenuItem value=""><em>All Statuses</em></MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
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
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Grade"
              name="gradeId"
              value={filters.gradeId}
              onChange={handleFilterChange}
              fullWidth
              size="small"
              disabled={loadingFilterData || grades.length === 0}
            >
              <MenuItem value=""><em>All Grades</em></MenuItem>
              {grades.map(grade => (
                <MenuItem key={grade._id} value={grade._id}>{grade.title}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
         {loadingFilterData && <CircularProgress size={20} sx={{mt:1}}/>}
      </Paper>


      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!isLoading && assignments.length === 0 && !error && (
        <Typography variant="subtitle1" sx={{ textAlign: 'center', my: 3 }}>
          You have not created any assignments yet, or no assignments match your filters.
        </Typography>
      )}

      {!isLoading && assignments.length > 0 && (
        <Box>
          {assignments.map((assignment) => (
            <AssignmentListItem
              key={assignment._id}
              assignment={assignment}
              onEdit={() => handleEdit(assignment._id)}
              onDelete={() => handleDelete(assignment._id)}
              onViewSubmissions={() => handleViewSubmissions(assignment._id)}
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

export default TeacherAssignmentsPage;
