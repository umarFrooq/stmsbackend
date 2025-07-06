import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Paper,
  Chip
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import debounce from 'lodash.debounce';

import StyledDataGrid from '../../components/common/StyledDataGrid';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import NotificationToast from '../../components/common/NotificationToast';

// Services
import attendanceService from '../../services/attendanceService';
import userService from '../../services/userService';
import gradeService from '../../services/gradeService';
// import branchService from '../../services/branchService'; // Uncomment if branch filter is added
// import subjectService from '../../services/subjectService'; // For subject filter if added

import useAuthStore from '../../store/auth.store';

const ATTENDANCE_STATUSES = ["present", "absent", "leave", "sick_leave", "half_day_leave"];

const AttendanceLogPage = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters State
  const [filters, setFilters] = useState({
    studentId: '',
    teacherId: '', // Will be mapped to 'markedBy'
    gradeId: '',
    section: '',
    // branchId: '', // Uncomment if branch filter is added
    // subjectId: '', // Uncomment if subject filter is added
    status: '',
    startDate: null,
    endDate: null,
  });

  // Data for filter dropdowns
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  // const [branches, setBranches] = useState([]); // Uncomment if branch filter is added
  // const [subjects, setSubjects] = useState([]); // Uncomment if subject filter is added

  const [loadingFilters, setLoadingFilters] = useState({
    students: false,
    teachers: false,
    grades: false,
    // branches: false, // Uncomment if branch filter is added
    // subjects: false, // Uncomment if subject filter is added
  });

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [totalRecords, setTotalRecords] = useState(0);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const { user } = useAuthStore(); // To get current user, potentially for schoolId or branchId scoping if needed

  // Extract stable primitives from user for useCallback dependency
  const userRole = user?.role;
  let actualSchoolId = null;
  if (user?.schoolId) {
    if (typeof user.schoolId === 'object' && user.schoolId.id) {
      actualSchoolId = user.schoolId.id;
    } else if (typeof user.schoolId === 'string') {
      actualSchoolId = user.schoolId;
    }
  }

  const showToast = useCallback((message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  }, []); // Assuming setToastMessage etc are stable from useState

  // Fetch data for filter dropdowns
  const fetchFilterData = useCallback(async () => {
    setLoadingFilters(prev => ({ ...prev, students: true, teachers: true, grades: true }));

    // Use actualSchoolId and userRole derived from props/state for logic
    // schoolIdForFilter is effectively actualSchoolId if role requires scoping
    let schoolIdForFilterLogic = null;
    if (userRole && userRole !== 'rootUser' && userRole !== 'superadmin' && actualSchoolId) {
      schoolIdForFilterLogic = actualSchoolId;
    }

    try {
      // Fetch Students
      const studentParams = { role: 'student', limit: 1000 };
      if (schoolIdForFilterLogic) studentParams.schoolId = schoolIdForFilterLogic;
      const studentRes = await userService.getAllUsers(studentParams);
      setStudents(studentRes?.data?.results || []);

      // Fetch Teachers
      const teacherParams = { role: 'teacher', limit: 1000 };
      if (schoolIdForFilterLogic) teacherParams.schoolId = schoolIdForFilterLogic;
      const teacherRes = await userService.getAllUsers(teacherParams);
      setTeachers(teacherRes?.data?.results || []);

      // Fetch Grades
      const gradeParams = { limit: 1000, sortBy: 'title:asc' };
      if (schoolIdForFilterLogic) gradeParams.schoolId = schoolIdForFilterLogic;
      const gradeRes = await gradeService.getGrades(gradeParams);
      setGrades(gradeRes?.results || []);

    } catch (err) {
      showToast('Error loading filter options: ' + (err.message || 'Unknown error'), 'error');
      console.error("Error fetching filter data:", err);
      // Ensure lists are empty on error so UI doesn't break with old/partial data
      setStudents([]);
      setTeachers([]);
      setGrades([]);
    } finally {
      setLoadingFilters(prev => ({ ...prev, students: false, teachers: false, grades: false }));
    }
  }, [userRole, actualSchoolId, showToast]); // Depends on stable primitives

  useEffect(() => {
    fetchFilterData();
  }, [fetchFilterData]);

  // Fetch Attendance Records
  const fetchAttendance = useCallback(async (currentFilters, currentPage, currentPageSize) => {
    setLoading(true);
    setError(null);

    const params = {
      page: currentPage + 1,
      limit: currentPageSize,
      sortBy: 'date:desc', // Default sort
      populate: 'studentId,subjectId,markedBy,gradeId,branchId', // Crucial for display
    };

    // Add active filters to params
    for (const key in currentFilters) {
      if (currentFilters[key] !== '' && currentFilters[key] !== null) {
        if (key === 'startDate' || key === 'endDate') {
          params[key] = new Date(currentFilters[key]).toISOString().split('T')[0];
        } else {
          params[key] = currentFilters[key];
        }
      }
    }

    try {
      const response = await attendanceService.getAttendances(params);
      setAttendanceRecords(response.results || []);
      setTotalRecords(response.totalResults || 0);
    } catch (err) {
      const errMsg = err.message || (err.data && err.data.message) || 'Failed to fetch attendance records.';
      setError(errMsg);
      showToast(errMsg, 'error');
      setAttendanceRecords([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced version of fetchAttendance for filter changes
  const debouncedFetchAttendance = useCallback(debounce(fetchAttendance, 500), [fetchAttendance]);

  useEffect(() => {
    debouncedFetchAttendance(filters, paginationModel.page, paginationModel.pageSize);
  }, [filters, paginationModel.page, paginationModel.pageSize, debouncedFetchAttendance]);


  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    if (name === 'gradeId') {
        const selectedGrade = grades.find(g => g.id === value);
        setSections(selectedGrade?.sections || []);
        setFilters(prev => ({ ...prev, section: '' })); // Reset section if grade changes
    }
  };

  const handleDateChange = (name, date) => {
    setFilters(prev => ({ ...prev, [name]: date }));
  };

  const handleResetFilters = () => {
    setFilters({
      studentId: '',
      teacherId: '',
      gradeId: '',
      section: '',
      status: '',
      startDate: null,
      endDate: null,
    });
    setSections([]);
    // paginationModel will trigger useEffect to refetch
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  const handleSearch = () => {
    // Trigger fetch by updating pagination model (or directly call fetch if not debounced through useEffect)
    // The useEffect listening to `filters` will already trigger the debounced fetch.
    // If immediate fetch is desired on button click:
    fetchAttendance(filters, paginationModel.page, paginationModel.pageSize);
  };


  const columns = [
    {
      field: 'studentName',
      headerName: 'Student',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.row.studentId?.fullname || params.row.studentId?.name || 'N/A'
    },
    {
      field: 'subjectName',
      headerName: 'Subject',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        if (!params || !params.row) {
          return 'N/A';
        }
        return params.row.subjectId?.title || params.row.subjectId?.name || 'N/A';
      }
    },
    {
      field: 'gradeName',
      headerName: 'Grade',
      width: 120,
      valueGetter: (params) => params.row.gradeId?.title || params.row.gradeId?.name || 'N/A'
    },
    { field: 'section', headerName: 'Section', width: 100 },
    {
      field: 'date',
      headerName: 'Date',
      width: 120,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : '',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        let color = 'default';
        if (params.value === 'present') color = 'success';
        else if (params.value === 'absent') color = 'error';
        else if (params.value?.includes('leave')) color = 'warning';
        return <Chip label={params.value} size="small" color={color} />;
      }
    },
    {
      field: 'markedBy',
      headerName: 'Marked By',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.row.markedBy?.fullname || params.row.markedBy?.name || 'N/A'
    },
    { field: 'remarks', headerName: 'Remarks', flex: 1, minWidth: 150 },
  ];

  if (loadingFilters.students || loadingFilters.teachers || loadingFilters.grades) {
      return <LoadingSpinner fullScreen message="Loading filter options..." />;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
          Attendance Log
        </Typography>

        <Paper sx={{ mb: 3, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Student Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Student</InputLabel>
                <Select name="studentId" value={filters.studentId} label="Student" onChange={handleFilterChange}>
                  <MenuItem value=""><em>All Students</em></MenuItem>
                  {students.map(s => <MenuItem key={s.id} value={s.id}>{s.fullname || s.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            {/* Teacher (Marked By) Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Teacher (Marked By)</InputLabel>
                <Select name="teacherId" value={filters.teacherId} label="Teacher (Marked By)" onChange={handleFilterChange}>
                  <MenuItem value=""><em>All Teachers</em></MenuItem>
                  {teachers.map(t => <MenuItem key={t.id} value={t.id}>{t.fullname || t.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            {/* Grade Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Grade</InputLabel>
                <Select name="gradeId" value={filters.gradeId} label="Grade" onChange={handleFilterChange}>
                  <MenuItem value=""><em>All Grades</em></MenuItem>
                  {grades.map(g => <MenuItem key={g.id} value={g.id}>{g.title || g.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            {/* Section Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small" disabled={!filters.gradeId || sections.length === 0}>
                <InputLabel>Section</InputLabel>
                <Select name="section" value={filters.section} label="Section" onChange={handleFilterChange}>
                  <MenuItem value=""><em>All Sections</em></MenuItem>
                  {sections.map(sec => <MenuItem key={sec} value={sec}>{sec}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            {/* Status Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select name="status" value={filters.status} label="Status" onChange={handleFilterChange}>
                  <MenuItem value=""><em>All Statuses</em></MenuItem>
                  {ATTENDANCE_STATUSES.map(s => <MenuItem key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            {/* Start Date Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => handleDateChange('startDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
              />
            </Grid>

            {/* End Date Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => handleDateChange('endDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button
                variant="contained"
                onClick={handleSearch}
                startIcon={<SearchIcon />}
                disabled={loading}
                sx={{ flexGrow: 1 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Search"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleResetFilters}
                startIcon={<ClearIcon />}
                disabled={loading}
                sx={{ flexGrow: 1 }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Error Display */}
        {error && !loading && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

        {/* Data Grid */}
        <StyledDataGrid
          rows={attendanceRecords}
          columns={columns}
          loading={loading}
          error={null} // Error is handled above the grid
          getRowId={(row) => row.id || row._id} // Use _id if id is not present
          minHeight={500}
          rowCount={totalRecords}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          paginationMode="server"
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </Box>

      <NotificationToast
        open={toastOpen}
        message={toastMessage}
        severity={toastSeverity}
        handleClose={() => setToastOpen(false)}
      />
    </LocalizationProvider>
  );
};

export default AttendanceLogPage;
