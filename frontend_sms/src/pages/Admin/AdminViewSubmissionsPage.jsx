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

import SubmissionListItem from '../../components/assignment/SubmissionListItem';
import { getSubmissions } from '../../services/submissionService';
// Assuming services to fetch filter data
import schoolService from '../../services/schoolService';
import branchService from '../../services/branchService';
import gradeService from '../../services/gradeService';
import subjectService from '../../services/subjectService'; // To filter by assignment's subject
import userService from '../../services/userService'; // To filter by student or teacher
import assignmentService from '../../services/assignmentService'; // To filter by assignment
import useAuthStore from '../../store/auth.store';

const AdminViewSubmissionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    schoolId: user?.role === 'admin' ? user.schoolId : '',
    branchId: user?.role === 'branchAdmin' ? user.branchId : '',
    gradeId: '', // Filter by assignment's grade
    subjectId: '', // Filter by assignment's subject
    assignmentId: '',
    studentId: '',
    status: '', // Submission status: 'submitted', 'graded'
  });

  const [schools, setSchools] = useState([]);
  const [branches, setBranches] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignmentsForFilter, setAssignmentsForFilter] = useState([]); // Assignments in selected school/grade/subject
  const [studentsForFilter, setStudentsForFilter] = useState([]); // Students in selected school/grade
  const [loadingFilterData, setLoadingFilterData] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 10;
  const isSuperAdminOrRoot = user?.role === 'superadmin' || user?.role === 'rootUser';

  const fetchSubmissionsForAdmin = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {
        sortBy: 'submissionDate:desc',
        limit,
        page,
        ...filters,
      };
      // Ensure schoolId/gradeId are passed if filtering by them indirectly (e.g. assignmentId is set)
      // The backend submission query might need to be smart about this or accept these directly.
      // For now, direct filters on submission model or populated fields are assumed.
      // If filters.assignmentId is set, schoolId/gradeId might be redundant if backend can infer.
      // If filtering directly by gradeId (meaning submissions for assignments in that grade), backend needs to support this.

      if (!isSuperAdminOrRoot && !params.schoolId && user?.schoolId) {
          params.schoolId = user.schoolId; // Scope admin to their school
      }
      if (params.schoolId === '') delete params.schoolId;


      const data = await getSubmissions(params); // General getSubmissions endpoint
      setSubmissions(data.results || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error('Error fetching submissions for admin:', err);
      setError(err.message || 'Failed to fetch submissions.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, limit, user?.schoolId, isSuperAdminOrRoot]);

  useEffect(() => {
    fetchSubmissionsForAdmin();
  }, [fetchSubmissionsForAdmin]);

  // Fetch data for filter dropdowns
  const fetchFilterDropdowns = useCallback(async () => {
    setLoadingFilterData(true);
    try {
        const currentSchoolId = filters.schoolId || (isSuperAdminOrRoot ? '' : user?.schoolId);

        if (isSuperAdminOrRoot) {
            const schoolRes = await schoolService.getAllSchools({ limit: 500, sortBy: 'name:asc' });
            setSchools(schoolRes.results || []);
        }

        if (currentSchoolId) {
            const commonParams = { schoolId: currentSchoolId, limit: 500 };
            const [branchRes, gradeRes, subjectRes, studentRes, assignmentRes] = await Promise.all([
                branchService.getBranches({ ...commonParams, sortBy: 'name:asc' }),
                gradeService.getGrades({ ...commonParams, sortBy: 'title:asc' }),
                subjectService.getSubjects({ ...commonParams, sortBy: 'name:asc' }),
                userService.getUsers({ school: currentSchoolId, role: 'student', ...commonParams, sortBy: 'firstName:asc' }),
                assignmentService.getAssignments({ schoolId: currentSchoolId, limit:1000, sortBy: 'title:asc', status:'published' }) // For assignment filter
            ]);
            setBranches(branchRes.results || []);
            setGrades(gradeRes.results || []);
            setSubjects(subjectRes.results || []);
            setStudentsForFilter(studentRes.results || []);
            setAssignmentsForFilter(assignmentRes.results || []);
        } else {
            setBranches([]); setGrades([]); setSubjects([]); setStudentsForFilter([]); setAssignmentsForFilter([]);
        }
    } catch (err) {
        console.error("Error fetching filter data for admin submissions:", err);
    } finally {
        setLoadingFilterData(false);
    }
  }, [user?.schoolId, isSuperAdminOrRoot, filters.schoolId]);

  useEffect(() => {
    fetchFilterDropdowns();
  }, [fetchFilterDropdowns]);

   useEffect(() => {
    if (isSuperAdminOrRoot) {
        setFilters(f => ({ ...f, branchId: '', gradeId: '', subjectId: '', studentId:'', assignmentId:''}));
        fetchFilterDropdowns();
    }
  }, [filters.schoolId, isSuperAdminOrRoot]);


  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleGradeAction = (submissionId) => navigate(`/admin/submissions/${submissionId}/grade`);
  const handleViewDetailsAction = (submissionId) => navigate(`/admin/submissions/${submissionId}/details`);


  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        View All Submissions
      </Typography>

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Filter Submissions</Typography>
        <Grid container spacing={2}>
          {isSuperAdminOrRoot && (
            <Grid item xs={12} md={3}><TextField select label="School" name="schoolId" value={filters.schoolId} onChange={handleFilterChange} fullWidth size="small" disabled={loadingFilterData}><MenuItem value=""><em>All Schools</em></MenuItem>{schools.map(s => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}</TextField></Grid>
          )}
          <Grid item xs={12} md={isSuperAdminOrRoot ? 3: 2}><TextField select label="Branch" name="branchId" value={filters.branchId} onChange={handleFilterChange} fullWidth size="small" disabled={loadingFilterData || branches.length === 0}><MenuItem value=""><em>All Branches</em></MenuItem>{branches.map(b => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}</TextField></Grid>
          <Grid item xs={12} md={isSuperAdminOrRoot ? 3: 2}><TextField select label="Grade (Assignment's)" name="gradeId" value={filters.gradeId} onChange={handleFilterChange} fullWidth size="small" disabled={loadingFilterData || grades.length === 0}><MenuItem value=""><em>All Grades</em></MenuItem>{grades.map(g => <MenuItem key={g._id} value={g._id}>{g.title}</MenuItem>)}</TextField></Grid>
          <Grid item xs={12} md={isSuperAdminOrRoot ? 3: 2}><TextField select label="Subject (Assignment's)" name="subjectId" value={filters.subjectId} onChange={handleFilterChange} fullWidth size="small" disabled={loadingFilterData || subjects.length === 0}><MenuItem value=""><em>All Subjects</em></MenuItem>{subjects.map(s => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}</TextField></Grid>
          <Grid item xs={12} md={isSuperAdminOrRoot ? 4: 3}><TextField select label="Assignment" name="assignmentId" value={filters.assignmentId} onChange={handleFilterChange} fullWidth size="small" disabled={loadingFilterData || assignmentsForFilter.length === 0}><MenuItem value=""><em>All Assignments</em></MenuItem>{assignmentsForFilter.map(a => <MenuItem key={a._id} value={a._id}>{a.title}</MenuItem>)}</TextField></Grid>
          <Grid item xs={12} md={isSuperAdminOrRoot ? 4: 3}><TextField select label="Student" name="studentId" value={filters.studentId} onChange={handleFilterChange} fullWidth size="small" disabled={loadingFilterData || studentsForFilter.length === 0}><MenuItem value=""><em>All Students</em></MenuItem>{studentsForFilter.map(s => <MenuItem key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.email})</MenuItem>)}</TextField></Grid>
          <Grid item xs={12} md={isSuperAdminOrRoot ? 4: 3}><TextField select label="Status" name="status" value={filters.status} onChange={handleFilterChange} fullWidth size="small"><MenuItem value=""><em>All Statuses</em></MenuItem><MenuItem value="submitted">Submitted</MenuItem><MenuItem value="graded">Graded</MenuItem><MenuItem value="pending_review">Pending Review</MenuItem></TextField></Grid>
        </Grid>
        {loadingFilterData && <CircularProgress size={20} sx={{mt:1}}/>}
      </Paper>

      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!isLoading && submissions.length === 0 && !error && (<Typography sx={{ textAlign: 'center', my: 3 }}>No submissions found.</Typography>)}

      {!isLoading && submissions.length > 0 && (
        <Box>
          {submissions.map((submission) => (
            <SubmissionListItem
              key={submission._id}
              submission={submission}
              onGrade={user.permissions?.includes('gradeSubmission') ? () => handleGradeAction(submission._id) : undefined}
              onView={() => handleViewDetailsAction(submission._id)}
            />
          ))}
          {totalPages > 1 && (<Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}><Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" /></Box>)}
        </Box>
      )}
    </Container>
  );
};

export default AdminViewSubmissionsPage;
