import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, Alert, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, FormControlLabel, TextField, Grid, CircularProgress, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns'; // For formatting date to YYYY-MM-DD

import LoadingSpinner from '../../components/common/LoadingSpinner';
import NotificationToast from '../../components/common/NotificationToast';

// Real services
import attendanceService from '../../services/attendanceService';
import userService from '../../services/userService'; // To get students
// import classScheduleService from '../../services/classScheduleService'; // Hypothetical service to get class details
// For now, classId is assumed to provide context like gradeId, subjectId, section, branchId directly or via a fetched class object

import useAuthStore from '../../store/auth.store';

const ATTENDANCE_STATUS_OPTIONS = ["present", "absent", "leave", "sick_leave", "half_day_leave"]; // Consider making 'late' an option if required

const AttendanceTakingPage = () => {
  const { classId } = useParams(); // This classId might be an ID of a class schedule or a specific session
  const navigate = useNavigate();
  const { user: teacherUser } = useAuthStore();

  const [students, setStudents] = useState([]);
  // attendance state: { studentId: { status: string, remarks: string, existingRecordId?: string, isMarked: boolean } }
  const [attendance, setAttendance] = useState({});
  // classContext will hold { subjectId, gradeId, section, branchId, subjectName, gradeName }
  const [classContext, setClassContext] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Use Date object for DatePicker

  const [loading, setLoading] = useState(true); // For initial class context and student load
  const [loadingAttendance, setLoadingAttendance] = useState(false); // For loading attendance records for a date
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pageMessage, setPageMessage] = useState(null); // For messages like "Attendance already taken"

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const showToast = (message, severity = 'success') => {
    setToastMessage(message); setToastSeverity(severity); setToastOpen(true);
  };

  // 1. Fetch Class Context (subject, grade, section etc.) based on classId
  useEffect(() => {
    const fetchClassContextDetails = async () => {
      if (!classId) return;
      setLoading(true); setError(null); setPageMessage(null);
      try {
        // HYPOTHETICAL: Replace with actual service call to get class details by classId
        // const classData = await classScheduleService.getClassDetailsById(classId);
        // For now, let's mock it. This data is CRUCIAL for other API calls.
        // This classData should contain subjectId, gradeId, section, branchId, subjectName, gradeName
        // Example:
        const mockClassData = {
          id: classId, // Assuming classId is the ID of the class/session
          subjectId: 'mockSubjectId1', // Replace with actual
          gradeId: 'mockGradeId1',     // Replace with actual
          section: 'A',                // Replace with actual
          branchId: 'mockBranchId1',   // Replace with actual
          subjectName: 'Mathematics',
          gradeName: 'Grade 5',
          // schoolId: teacherUser.schoolId // Might be needed if not inferred by backend
        };
        // TODO: Replace MOCK with actual service call
        if (!mockClassData.subjectId || !mockClassData.gradeId) {
            throw new Error("Class details (subject or grade) are missing. Cannot proceed.");
        }
        setClassContext(mockClassData);

      } catch (err) {
        setError(err.message || 'Failed to load class details.');
        showToast(err.message || 'Failed to load class details.', 'error');
        setLoading(false);
      }
      // setLoading(false) will be handled after students are also fetched in the next effect if classContext is set
    };
    fetchClassContextDetails();
  }, [classId]);


  // 2. Fetch Students once Class Context is available
  useEffect(() => {
    const fetchStudentsForClass = async () => {
      if (!classContext || !classContext.gradeId) { // Ensure classContext and necessary IDs are loaded
        // If classContext is null and not loading, it might mean an error in fetching it.
        if (!loading && !classContext) setError(prev => prev || "Class details not available to fetch students.");
        return;
      }
      setLoading(true); // Still loading overall page data
      setError(null);
      try {
        const studentParams = {
          gradeId: classContext.gradeId,
          section: classContext.section,
          branchId: classContext.branchId, // Assuming students are scoped to branch via grade/section
          // schoolId: classContext.schoolId, // If needed by API and not inferred
          role: 'student',
          limit: 500, // Assuming a class won't exceed this
          sortBy: 'fullname:asc',
        };
        const studentRes = await userService.getAllUsers(studentParams);
        setStudents(studentRes?.data?.results || []);
      } catch (err) {
        setError(err.message || 'Failed to load students for the class.');
        showToast(err.message || 'Failed to load students for the class.', 'error');
        setStudents([]); // Clear students on error
      } finally {
        setLoading(false); // Finished loading class context AND students
      }
    };

    fetchStudentsForClass();
  }, [classContext]); // Depends on classContext


  // 3. Fetch Existing Attendance Records when selectedDate or students list changes (after initial load)
  useEffect(() => {
    const fetchExistingAttendance = async () => {
      if (!selectedDate || students.length === 0 || !classContext || !classContext.subjectId) {
        // If students list is empty, reset attendance state
        if (students.length === 0) setAttendance({});
        return;
      }
      setLoadingAttendance(true);
      setPageMessage(null); // Clear previous messages
      setError(null);

      try {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const attendanceParams = {
          gradeId: classContext.gradeId,
          section: classContext.section,
          subjectId: classContext.subjectId,
          branchId: classContext.branchId,
          // schoolId: classContext.schoolId, // If needed
          date: formattedDate,
          limit: students.length, // Fetch records for all students in class
          populate: 'studentId', // We only need studentId to map
        };
        const existingRecordsResponse = await attendanceService.getAttendances(attendanceParams);
        const existingData = existingRecordsResponse.results || [];

        let allMarked = students.length > 0; // Assume all marked if students exist
        const newAttendanceState = {};

        students.forEach(student => {
          const record = existingData.find(r => r.studentId && (r.studentId.id === student.id || r.studentId._id === student.id));
          if (record) {
            newAttendanceState[student.id] = {
              status: record.status,
              remarks: record.remarks || '',
              existingRecordId: record.id || record._id, // Store ID if we need to update later (not in scope now)
              isMarked: true, // This student's attendance for this date is already recorded
            };
          } else {
            newAttendanceState[student.id] = { status: 'present', remarks: '', isMarked: false };
            allMarked = false; // At least one student is not marked
          }
        });
        setAttendance(newAttendanceState);

        if (allMarked && students.length > 0) {
          setPageMessage("Attendance for this date has already been fully recorded.");
        } else if (existingData.length > 0 && students.length > 0) {
          setPageMessage("Partial attendance found. Please complete for remaining students.");
        } else if (students.length > 0) {
          setPageMessage("Please mark attendance for all students.");
        }

      } catch (err) {
        showToast('Failed to load existing attendance records.', 'error');
        setError('Failed to load existing records. Please try changing the date or refreshing.');
        // On error, reset to default for all students to allow marking
        const defaultAttendance = {};
        students.forEach(s => { defaultAttendance[s.id] = { status: 'present', remarks: '', isMarked: false }; });
        setAttendance(defaultAttendance);
      } finally {
        setLoadingAttendance(false);
      }
    };

    if (!loading) { // Only run this if initial student/class load is complete
        fetchExistingAttendance();
    }
  }, [selectedDate, students, classContext, loading]); // `loading` ensures this runs after initial student load


  const handleAttendanceChange = (studentId, newStatus) => {
    // Only allow change if not already marked and saved for this session
    if (attendance[studentId]?.isMarked) {
        // Optionally allow editing if requirements change - for now, only new entries
        // showToast("This student's attendance is already recorded for this date.", "info");
        // return;
        // Allowing change even if pre-filled from partial save, backend unique index will handle conflicts if any for *new* bulk save.
        // Or, if we were to PATCH, then this would be different.
    }
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status: newStatus }
    }));
  };

  const handleRemarkChange = (studentId, remarks) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks }
    }));
  };

  const markAll = (newStatus) => {
    const newAttendanceState = { ...attendance };
    students.forEach(student => {
      // Only update if not already marked and saved, or if we decide to allow overwriting in this UI action
      if (!attendance[student.id]?.isMarked) {
        newAttendanceState[student.id] = { ...newAttendanceState[student.id], status: newStatus };
      }
    });
    setAttendance(newAttendanceState);
  };

  const handleSubmitAttendance = async () => {
    if (!classContext || !teacherUser) {
      showToast("Class details or user information is missing.", "error");
      return;
    }
    if (pageMessage === "Attendance for this date has already been fully recorded.") {
        showToast("Attendance is already fully recorded for this date.", "info");
        return;
    }

    setSaving(true);
    const recordsToSave = [];
    students.forEach(student => {
      const studentAtt = attendance[student.id];
      // Only save if it's not marked (i.e., it's a new entry for this session)
      if (studentAtt && !studentAtt.isMarked) {
        recordsToSave.push({
          studentId: student.id,
          schoolId: classContext.schoolId || teacherUser.schoolId, // Important: ensure schoolId is available
          subjectId: classContext.subjectId,
          gradeId: classContext.gradeId,
          section: classContext.section,
          branchId: classContext.branchId,
          date: format(selectedDate, 'yyyy-MM-dd'),
          status: studentAtt.status,
          remarks: studentAtt.remarks || '',
          markedBy: teacherUser.id,
        });
      }
    });

    if (recordsToSave.length === 0) {
      showToast("No new attendance data to save.", "info");
      setSaving(false);
      return;
    }

    try {
      // Using markBulkAttendance as it's more suitable for multiple entries
      const response = await attendanceService.markBulkAttendance(recordsToSave); // Assuming service expects array
      if (response.errors && response.errors.length > 0) {
        // Handle partial success / errors
        const errorMessages = response.errors.map(err => `Student ${students.find(s => s.id === err.entry?.studentId)?.fullname || err.entry?.studentId}: ${err.error}`).join('; ');
        showToast(`Some records failed: ${errorMessages}`, 'warning');
         // Re-fetch to update UI with successfully saved entries
        const currentLoading = loading; // Store current loading state to restore later
        if (!currentLoading) { // Avoid triggering fetch if already loading
            const tempStudents = [...students]; // Create a shallow copy
            setStudents([]); // Temporarily clear students to trigger useEffect for attendance fetch if it depends on students.length
            setTimeout(() => setStudents(tempStudents), 0); // Restore students to trigger the effect
        }

      } else {
        showToast('Attendance saved successfully!', 'success');
        // After successful save, re-fetch to update isMarked status for all
        // This will also naturally show the "fully recorded" message if applicable
        const currentLoading = loading; // Store current loading state to restore later
        if (!currentLoading) { // Avoid triggering fetch if already loading
            const tempStudents = [...students];
            setStudents([]);
            setTimeout(() => setStudents(tempStudents), 0);
        }
      }
    } catch (err) {
      const apiErrorMessage = err.message || (err.data && err.data.message) || 'Failed to save attendance.';
      showToast(apiErrorMessage, 'error');
      console.error("Save attendance error:", err);
    } finally {
      setSaving(false);
    }
  };

  const isAttendanceFullyMarked = students.length > 0 && students.every(s => attendance[s.id]?.isMarked);
  const isAnyStudentUnmarked = students.some(s => !attendance[s.id]?.isMarked);


  if (loading) { // Covers initial class context and student loading
    return <LoadingSpinner fullScreen message="Loading class and student data..." />;
  }
  if (error && students.length === 0) { // Show critical error if students couldn't be loaded
      return <Container sx={{ py: 3 }}><Alert severity="error">{error}</Alert></Container>;
  }


  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Take Attendance: {classContext?.subjectName || 'Loading class...'} ({classContext?.gradeName} - Sec {classContext?.section})
          </Typography>

          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={4}>
              <DatePicker
                label="Attendance Date"
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate || new Date())}
                disabled={saving || loadingAttendance}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={8} display="flex" justifyContent={{xs: 'flex-start', sm: 'flex-end'}} gap={1}>
              <Button onClick={() => markAll('present')} variant="outlined" size="small" disabled={saving || loadingAttendance || isAttendanceFullyMarked || !isAnyStudentUnmarked}>Mark All Unmarked Present</Button>
              <Button onClick={() => markAll('absent')} variant="outlined" size="small" color="secondary" disabled={saving || loadingAttendance || isAttendanceFullyMarked || !isAnyStudentUnmarked}>Mark All Unmarked Absent</Button>
            </Grid>
          </Grid>

          {pageMessage && <Alert severity={isAttendanceFullyMarked ? "info" : "warning"} sx={{ mb: 2 }}>{pageMessage}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>} {/* For errors during attendance fetch for a date */}


          {loadingAttendance && <CircularProgress sx={{display: 'block', margin: '20px auto'}}/>}

          {!loadingAttendance && !students.length && !loading && ( // Ensure not initial loading
              <Alert severity="warning" sx={{mt: 2}}>No students found for this class, or class details are missing.</Alert>
          )}

          {!loadingAttendance && students.length > 0 && (
            <TableContainer component={Paper} variant="outlined">
              <Table sx={{ minWidth: 650 }} aria-label="attendance table">
                <TableHead sx={{backgroundColor: 'grey.100'}}>
                  <TableRow>
                    <TableCell>Student Name</TableCell>
                    {ATTENDANCE_STATUS_OPTIONS.map(statusOption => (
                        <TableCell key={statusOption} align="center" sx={{textTransform: 'capitalize'}}>
                            {statusOption.replace('_', ' ')}
                        </TableCell>
                    ))}
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => {
                    const currentStudentAtt = attendance[student.id];
                    const isDisabled = saving || currentStudentAtt?.isMarked; // Disable if saving or already marked
                    return (
                      <TableRow key={student.id} sx={{ backgroundColor: currentStudentAtt?.isMarked ? 'grey.50' : 'inherit' }}>
                        <TableCell component="th" scope="row">
                          {student.fullname}
                          {currentStudentAtt?.isMarked && <Chip label="Recorded" size="small" sx={{ml: 1}} color="success" variant="outlined"/>}
                        </TableCell>
                        {ATTENDANCE_STATUS_OPTIONS.map(statusOption => (
                             <TableCell key={statusOption} align="center">
                                <Checkbox
                                    checked={currentStudentAtt?.status === statusOption}
                                    onChange={() => handleAttendanceChange(student.id, statusOption)}
                                    disabled={isDisabled}
                                />
                            </TableCell>
                        ))}
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            variant="outlined"
                            placeholder="Optional remarks"
                            value={currentStudentAtt?.remarks || ''}
                            onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                            disabled={isDisabled}
                            sx={{backgroundColor: isDisabled ? 'grey.100' : 'transparent' }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => navigate(-1)} sx={{mr:2}} disabled={saving}>Cancel</Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={saving ? <CircularProgress size={20} color="inherit"/> : <SaveIcon />}
              onClick={handleSubmitAttendance}
              disabled={saving || loading || loadingAttendance || students.length === 0 || !isAnyStudentUnmarked }
            >
              {saving ? 'Saving...' : 'Save Attendance'}
            </Button>
          </Box>
        </Paper>
        <NotificationToast open={toastOpen} message={toastMessage} severity={toastSeverity} handleClose={() => setToastOpen(false)} />
      </Container>
    </LocalizationProvider>
  );
};

export default AttendanceTakingPage;
