import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Select, MenuItem, FormControl, InputLabel, Button, CircularProgress, Alert, TableContainer, Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import attendanceService from '../../services/attendanceService';
import subjectService from '../../services/subjectService';
import useAuthStore from '../../store/auth.store';

const MyAttendancePage = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    subjectId: '',
    status: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuthStore();

  console.log("MyAttendancePage - user object from store (for school and gradeId check):", user);
  if (user) {
    console.log("MyAttendancePage - user.school:", user.school);
    console.log("MyAttendancePage - user.gradeId:", user.gradeId);
  }


  const attendanceStatuses = ["present", "absent", "leave", "sick_leave", "half_day_leave"];

  const fetchStudentSubjects = useCallback(async () => {
    console.log("MyAttendancePage - fetchStudentSubjects - user object (checking schoolId.id and gradeId):", user);
    if (!user || !user.id) {
        setError('User information is missing. Cannot load subjects.');
        console.warn('User object or user ID is missing for subject fetching. User:', user);
        setSubjects([]);
        return;
    }

    // Correctly access schoolId.id and gradeId
    const schoolIdValue = user.schoolId ? user.schoolId.id : null;
    const gradeIdValue = user.gradeId; // Assuming user.gradeId is already the string ID

    if (!schoolIdValue || !gradeIdValue) {
        let missingInfo = [];
        if (!schoolIdValue) missingInfo.push("school information (ID)");
        if (!gradeIdValue) missingInfo.push("grade information");
        const errorMessage = `User ${missingInfo.join(' and ')} is not available. Subjects cannot be loaded. Please ensure your profile is complete or try logging out and back in.`;
        setError(errorMessage);
        console.warn(`User information missing for subject fetching: ${missingInfo.join(', ')}. User:`, user);
        setSubjects([]);
        return;
    }

    setError(''); // Clear previous errors before new fetch
    setLoading(true); // Show loading indicator for subject fetching as well

    try {
      console.log(`Fetching subjects for school: ${schoolIdValue}, grade: ${gradeIdValue}`);
      const response = await subjectService.getSubjects({
          schoolId: schoolIdValue,
          gradeId: gradeIdValue
      });
      setSubjects(response.results || []);
      if (!response.results || response.results.length === 0) {
        console.warn(`No subjects found for school: ${schoolIdValue}, grade: ${gradeIdValue}`);
        // Optionally, set a soft error or message indicating no subjects found for this criteria
        // setError(`No subjects found for your school and grade.`);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError(`Failed to load subjects: ${err.message || 'Unknown error'}`);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchAttendance = useCallback(async () => {
    if (!user || !user.id) {
      setError("User not identified. Cannot fetch attendance.");
      setAttendanceRecords([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const params = {
        // studentId: user.id, // Backend will enforce this based on logged-in student
        populate: 'subjectId,gradeId,branchId', // Populate for display
      };
      if (filters.startDate) {
        params.startDate = new Date(filters.startDate).toISOString().split('T')[0];
      }
      if (filters.endDate) {
        params.endDate = new Date(filters.endDate).toISOString().split('T')[0];
      }
      if (filters.subjectId) {
        params.subjectId = filters.subjectId;
      }
      if (filters.status) {
        params.status = filters.status;
      }

      const data = await attendanceService.getAttendances(params);
      setAttendanceRecords(data.results || []);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError(err.message || 'Failed to fetch attendance records.');
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  useEffect(() => {
    fetchStudentSubjects();
  }, [fetchStudentSubjects]);

  useEffect(() => {
    // Fetch initial attendance or when filters change
    fetchAttendance();
  }, [fetchAttendance]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleDateRangeChange = (newDateRange) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      dateRange: newDateRange,
    }));
  };

  const handleDateChange = (name, date) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: date,
    }));
  };

  const handleApplyFilters = () => {
      fetchAttendance(); // This will be called automatically on filter change by useEffect if desired, or manually via button.
                        // For now, keeping manual button press via handleApplyFilters
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>My Attendance</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="flex-start"> {/* Changed to flex-start for better alignment with DatePickers */}
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => handleDateChange('startDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => handleDateChange('endDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
                minDate={filters.startDate}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="subject-select-label">Subject</InputLabel>
                <Select
                  labelId="subject-select-label"
                  name="subjectId"
                  value={filters.subjectId}
                  label="Subject"
                  onChange={handleFilterChange}
                >
                  <MenuItem value=""><em>All Subjects</em></MenuItem>
                  {subjects.map((subject) => (
                    <MenuItem key={subject.id || subject._id} value={subject.id || subject._id}> {/* Use subject.id or subject._id */}
                      {subject.name || subject.title} {subject.subjectCode && `(${subject.subjectCode})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel id="status-select-label">Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  name="status"
                  value={filters.status}
                  label="Status"
                  onChange={handleFilterChange}
                >
                  <MenuItem value=""><em>All Statuses</em></MenuItem>
                  {attendanceStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={1} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button variant="contained" onClick={handleApplyFilters} fullWidth disabled={loading}>
                Filter
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}
        {!loading && error && (
            <Alert severity="warning" sx={{ mb: 2 }}>Could not load attendance data. {error}</Alert>
        )}

        {!loading && !error && (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table aria-label="attendance table">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendanceRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No attendance records found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  attendanceRecords.map((record) => (
                    <TableRow key={record.id || record._id}>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>{record.subjectId?.name || record.subjectId?.title || 'N/A'}</TableCell>
                      <TableCell>{record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('_', ' ')}</TableCell>
                      <TableCell>{record.gradeId?.title || 'N/A'}</TableCell>
                      <TableCell>{record.section}</TableCell>
                      <TableCell>{record.branchId?.name || 'N/A'}</TableCell>
                      <TableCell>{record.remarks || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default MyAttendancePage;
