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
  Button, // For potential actions like view details
  Tooltip,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
// import EditIcon from '@mui/icons-material/Edit'; // If admin can edit
// import DeleteIcon from '@mui/icons-material/Delete'; // If admin can delete

import AssignmentListItem from '../../components/assignment/AssignmentListItem'; // Reusable component
import { assignmentService, schoolService, branchService, gradeService, subjectService, userService } from '../../services';
import useAuthStore from '../../store/auth.store';

const AdminAssignmentsListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter states
  const [filters, setFilters] = useState({
    schoolId: user?.role === 'admin' ? user.schoolId : '', // Admin scoped to their school, SuperAdmin can select
    branchId: user?.role === 'branchAdmin' ? user.branchId : '',
    gradeId: '',
    subjectId: '',
    teacherId: '',
    status: '',
    // dueDateFrom: '',
    // dueDateTo: '',
  });

  // Data for filter dropdowns
  const [schools, setSchools] = useState([]);
  const [branches, setBranches] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loadingFilterData, setLoadingFilterData] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 10;

  const isSuperAdminOrRoot = user?.role === 'superadmin' || user?.role === 'rootUser';


  const fetchAssignmentsForAdmin = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {
        sortBy: 'dueDate:desc',
        limit,
        page,
        ...filters, // Spread all current filters
      };
      // Ensure schoolId is passed if not superadmin/root selecting "all schools"
      if (!isSuperAdminOrRoot && !params.schoolId && user?.schoolId) {
          params.schoolId = user.schoolId;
      }
      if (params.schoolId === '') delete params.schoolId; // Don't send empty schoolId for root if "All" is chosen

      const data = await assignmentService.getAssignments(params);
      setAssignments(data.results || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error('Error fetching assignments for admin:', err);
      setError(err.message || 'Failed to fetch assignments.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, limit, user?.schoolId, isSuperAdminOrRoot]);

  useEffect(() => {
    fetchAssignmentsForAdmin();
  }, [fetchAssignmentsForAdmin]);


  // Fetch data for filter dropdowns
  const fetchDropdownData = useCallback(async () => {
    setLoadingFilterData(true);
    try {
      const currentSchoolId = filters.schoolId || (isSuperAdminOrRoot ? '' : user?.schoolId);

      if (isSuperAdminOrRoot) {
        const schoolRes = await schoolService.getSchools({ limit: 500, sortBy: 'name:asc' }); // Assuming this service exists
        setSchools(schoolRes.results || []);
      }

      if (currentSchoolId) {
        const branchParams = { schoolId: currentSchoolId, limit: 200, sortBy: 'name:asc' };
        const branchRes = await branchApi.getBranches(branchParams);
        setBranches(branchRes.results || []);

        const gradeParams = { schoolId: currentSchoolId, limit: 500, sortBy: 'title:asc' };
        const gradeRes = await gradeService.getGrades(gradeParams);
        setGrades(gradeRes.results || []);

        const subjectParams = { schoolId: currentSchoolId, limit: 500, sortBy: 'name:asc' };
        const subjectRes = await subjectService.getSubjects(subjectParams);
        setSubjects(subjectRes.results || []);

        // Fetch users with role 'teacher' for the current school
        const teacherParams = { school: currentSchoolId, role: 'teacher', limit: 500, sortBy: 'firstName:asc' };
        const teacherRes = await userService.getAllUsers(teacherParams); // Assuming userService.getUsers exists
        setTeachers(teacherRes.results || []);

      } else { // If no school selected (SuperAdmin/Root viewing all), clear dependent filters
        setBranches([]);
        setGrades([]);
        setSubjects([]);
        setTeachers([]);
      }
    } catch (err) {
      console.error("Error fetching filter data:", err);
      setError("Could not load filter options.");
    } finally {
      setLoadingFilterData(false);
    }
  }, [user?.schoolId, isSuperAdminOrRoot, filters.schoolId]);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  // Refetch dependent dropdowns if schoolId filter changes
  useEffect(() => {
    if (isSuperAdminOrRoot) { // Only run if school selection can change
        setFilters(f => ({ ...f, branchId: '', gradeId: '', subjectId: '', teacherId: ''})); // Reset dependent filters
        fetchDropdownData(); // This will now use the new filters.schoolId
    }
  }, [filters.schoolId, isSuperAdminOrRoot]); // Removed fetchDropdownData from deps to avoid loop with its own state changes


  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset to first page
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleViewDetails = (assignmentId) => {
    // Navigate to a detailed view page for admin
    navigate(`/admin/assignments/${assignmentId}/details`);
  };

  // Admin Edit/Delete handlers (if permissions allow)
  // const handleAdminEdit = (assignmentId) => navigate(`/admin/assignments/edit/${assignmentId}`);
  // const handleAdminDelete = async (assignmentId) => { /* ... delete logic ... */ };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}> {/* Wider container for admin view */}
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Assignments {isSuperAdminOrRoot ? '(All Schools)' : `(${user?.school?.name || 'Your School'})`}
      </Typography>

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Filter Assignments</Typography>
        <Grid container spacing={2} alignItems="center">
          {isSuperAdminOrRoot && (
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                label="School"
                name="schoolId"
                value={filters.schoolId}
                onChange={handleFilterChange}
                fullWidth
                size="small"
                disabled={loadingFilterData}
              >
                <MenuItem value=""><em>All Schools</em></MenuItem>
                {schools.map(s => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
          )}
          <Grid item xs={12} sm={6} md={isSuperAdminOrRoot ? 2 : 3}>
            <TextField select label="Branch" name="branchId" value={filters.branchId} onChange={handleFilterChange} fullWidth size="small" disabled={loadingFilterData || (!filters.schoolId && !user?.schoolId) || branches.length === 0}>
              <MenuItem value=""><em>All Branches</em></MenuItem>
              {branches.map(b => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={isSuperAdminOrRoot ? 2 : 3}>
            <TextField select label="Grade" name="gradeId" value={filters.gradeId} onChange={handleFilterChange} fullWidth size="small" disabled={loadingFilterData || (!filters.schoolId && !user?.schoolId) || grades.length === 0}>
              <MenuItem value=""><em>All Grades</em></MenuItem>
              {grades.map(g => <MenuItem key={g._id} value={g._id}>{g.title}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={isSuperAdminOrRoot ? 2 : 3}>
            <TextField select label="Subject" name="subjectId" value={filters.subjectId} onChange={handleFilterChange} fullWidth size="small" disabled={loadingFilterData || (!filters.schoolId && !user?.schoolId) || subjects.length === 0}>
              <MenuItem value=""><em>All Subjects</em></MenuItem>
              {subjects.map(s => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={isSuperAdminOrRoot ? 3 : 3}>
            <TextField select label="Teacher" name="teacherId" value={filters.teacherId} onChange={handleFilterChange} fullWidth size="small" disabled={loadingFilterData || (!filters.schoolId && !user?.schoolId) || teachers.length === 0}>
              <MenuItem value=""><em>All Teachers</em></MenuItem>
              {teachers.map(t => <MenuItem key={t._id} value={t._id}>{t.firstName} {t.lastName}</MenuItem>)}
            </TextField>
          </Grid>
           <Grid item xs={12} sm={6} md={isSuperAdminOrRoot ? 2 : 3}>
            <TextField select label="Status" name="status" value={filters.status} onChange={handleFilterChange} fullWidth size="small">
              <MenuItem value=""><em>All Statuses</em></MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </TextField>
          </Grid>
        </Grid>
        {loadingFilterData && <CircularProgress size={20} sx={{mt:1}}/>}
      </Paper>

      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!isLoading && assignments.length === 0 && !error && (
        <Typography variant="subtitle1" sx={{ textAlign: 'center', my: 3 }}>
          No assignments found matching your criteria.
        </Typography>
      )}

      {!isLoading && assignments.length > 0 && (
        <Box>
          {assignments.map((assignment) => (
            <AssignmentListItem
              key={assignment._id}
              assignment={assignment}
              // Admin might not have direct edit/delete but a view details action
              onViewDetails={() => handleViewDetails(assignment._id)}
              // Pass admin-specific actions if implemented
              // onEdit={user.permissions?.includes('manageAllAssignmentsSchool') ? () => handleAdminEdit(assignment._id) : undefined}
              // onDelete={user.permissions?.includes('manageAllAssignmentsSchool') ? () => handleAdminDelete(assignment._id) : undefined}
              onViewSubmissions={() => navigate(`/admin/assignments/${assignment._id}/submissions`)} // Admin view submissions
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

export default AdminAssignmentsListPage;
