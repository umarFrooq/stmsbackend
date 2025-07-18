import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Paper, Box, Button, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, IconButton, Tooltip, CircularProgress, Grid, TextField, MenuItem
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';

import LoadingSpinner from '../../components/common/LoadingSpinner';
import NotificationToast from '../../components/common/NotificationToast';
import classScheduleService from '../../services/classScheduleService';
import branchService from '../../services/branchService';
import gradeService from '../../services/gradeService';
import userService from '../../services/userService';
import useAuthStore from '../../store/auth.store'; // To get schoolId for admin

// TODO: Implement ConfirmationDialog
// import ConfirmationDialog from '../../components/common/ConfirmationDialog';


const ClassScheduleManagementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore(); // Assuming admin user has schoolId in their user object or derived contextually

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  const [filters, setFilters] = useState({
    branchId: '',
    gradeId: '',
    teacherId: '',
  });

  const [branches, setBranches] = useState([]);
  const [grades, setGrades] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Toast notifications
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  // TODO: Confirmation Dialog state
  // const [confirmOpen, setConfirmOpen] = useState(false);
  // const [confirmAction, setConfirmAction] = useState(null); // Store the action (e.g., () => handleDelete(id)))
  // const [confirmTitle, setConfirmTitle] = useState('');
  // const [confirmMessage, setConfirmMessage] = useState('');

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page + 1, // API might be 1-indexed for page
        limit: rowsPerPage,
        sortBy: 'dayOfWeek,startTime', // Default sort
        populate: 'subjectId,gradeId,teacherId,branchId', // Populate for display
      };

      if (filters.branchId) params.branchId = filters.branchId;
      if (filters.gradeId) params.gradeId = filters.gradeId;
      if (filters.teacherId) params.teacherId = filters.teacherId;
      // If user is rootUser and a school filter is implemented, pass schoolId here
      // For now, assuming 'admin' role is scoped by middleware

      const response = await classScheduleService.queryClassSchedules(params);
      setSchedules(response.results || []);
      setTotalRows(response.totalResults || 0);
    } catch (err) {
      const message = err.message || 'Failed to fetch class schedules.';
      setError(message);
      setSchedules([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, user?.schoolId, filters]); // user.schoolId if used in params

  const fetchFilterData = useCallback(async () => {
    if (!user?.schoolId) return;
    try {
      const schoolId = typeof user.schoolId === 'object' ? user.schoolId.id : user.schoolId;
      const [branchRes, gradeRes, teacherRes] = await Promise.all([
        branchService.getAllBranches({ schoolId, limit: 500, sortBy: 'name:asc' }),
        gradeService.getGrades({ schoolId, limit: 1000, sortBy: 'title:asc' }),
        userService.getAllUsers({ schoolId, role: 'teacher', limit: 1000 })
      ]);
      setBranches(branchRes.results || []);
      setGrades(gradeRes.results || []);
      setTeachers(teacherRes.data?.results || []);
    } catch (err) {
      showToast(`Error fetching filter data: ${err.message}`, 'error');
    }
  }, [user?.schoolId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    fetchFilterData();
  }, [fetchFilterData]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    if (name === 'branchId') {
      setFilters(prev => ({ ...prev, gradeId: '' }));
    }
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      branchId: '',
      gradeId: '',
      teacherId: '',
    });
    setPage(0);
  };

  const handleAddSchedule = () => {
    navigate('/admin/schedules/new');
  };

  const handleEditSchedule = (scheduleId) => {
    navigate(`/admin/schedules/edit/${scheduleId}`);
  };

  const handleDeleteSchedule = async (scheduleId) => {
    // TODO: Implement with ConfirmationDialog
    console.log("Delete schedule clicked:", scheduleId);
    // setConfirmOpen(false); // Close dialog first
    // setLoading(true); // Or a specific deleting state
    try {
      await classScheduleService.deleteClassSchedule(scheduleId);
      showToast('Schedule deleted successfully!', 'success');
      fetchSchedules(); // Refresh list
    } catch (err) {
      const message = err.message || 'Failed to delete schedule.';
      setError(message);
      showToast(message, 'error');
      // setLoading(false);
    }
  };

  // const openDeleteConfirm = (scheduleId) => {
  //   setConfirmTitle('Confirm Delete');
  //   setConfirmMessage('Are you sure you want to delete this class schedule? This action cannot be undone.');
  //   setConfirmAction(() => () => handleDeleteSchedule(scheduleId));
  //   setConfirmOpen(true);
  // };


  if (loading && schedules.length === 0) { // Show full spinner only on initial load
    return <LoadingSpinner fullScreen message="Loading class schedules..." />;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">
            Manage Class Schedules
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleAddSchedule}
          >
            Add New Schedule
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                label="Filter by Branch"
                name="branchId"
                value={filters.branchId}
                onChange={handleFilterChange}
                variant="outlined"
                size="small"
              >
                <MenuItem value=""><em>All Branches</em></MenuItem>
                {branches.map(branch => (
                  <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                label="Filter by Grade"
                name="gradeId"
                value={filters.gradeId}
                onChange={handleFilterChange}
                variant="outlined"
                size="small"
                disabled={!filters.branchId}
              >
                <MenuItem value=""><em>All Grades</em></MenuItem>
                {grades.map(grade => (
                  <MenuItem key={grade.id} value={grade.id}>{grade.title}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                label="Filter by Teacher"
                name="teacherId"
                value={filters.teacherId}
                onChange={handleFilterChange}
                variant="outlined"
                size="small"
              >
                <MenuItem value=""><em>All Teachers</em></MenuItem>
                {teachers.map(teacher => (
                  <MenuItem key={teacher.id} value={teacher.id}>{teacher.fullname}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                fullWidth
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Box>

        {loading && <CircularProgress sx={{display: 'block', margin: 'auto', mb: 2}} />}

        <TableContainer>
          <Table stickyHeader aria-label="class schedules table">
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell>Grade & Section</TableCell>
                <TableCell>Teacher</TableCell>
                <TableCell>Day</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && schedules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No class schedules found.
                  </TableCell>
                </TableRow>
              )}
              {schedules.map((schedule) => (
                <TableRow hover key={schedule.id}>
                  <TableCell>{schedule.subjectId?.title || 'N/A'}</TableCell>
                  <TableCell>{`${schedule.gradeId?.title || 'N/A'} - ${schedule.section}`}</TableCell>
                  <TableCell>{schedule.teacherId?.fullname || 'N/A'}</TableCell>
                  <TableCell>{schedule.dayOfWeek}</TableCell>
                  <TableCell>{`${schedule.startTime} - ${schedule.endTime}`}</TableCell>
                  <TableCell>{schedule.branchId?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleEditSchedule(schedule.id)} size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDeleteSchedule(schedule.id)} size="small" color="error">
                        {/* <IconButton onClick={() => openDeleteConfirm(schedule.id)} size="small" color="error"> */}
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalRows}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      <NotificationToast open={toastOpen} message={toastMessage} severity={toastSeverity} handleClose={() => setToastOpen(false)} />
      {/* <ConfirmationDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={confirmAction}
        onCancel={() => setConfirmOpen(false)}
      /> */}
    </Container>
  );
};

export default ClassScheduleManagementPage;
