import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, Alert, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, FormControlLabel, TextField, Grid, CircularProgress, MenuItem, Select, FormControl, InputLabel, Chip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import LoadingSpinner from '../../components/common/LoadingSpinner';
import NotificationToast from '../../components/common/NotificationToast';

// Real services
import attendanceService from '../../services/attendanceService';
import userService from '../../services/userService'; // To get students
import classScheduleService from '../../services/classScheduleService'; // Service to get class details by classId

import useAuthStore from '../../store/auth.store';

const ATTENDANCE_STATUS_OPTIONS = ["present", "absent", "leave", "sick_leave", "half_day_leave"];

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

  const showToast = useCallback((message, severity = 'success') => {
    setToastMessage(message); setToastSeverity(severity); setToastOpen(true);
  }, []); // setToastMessage, setToastSeverity, setToastOpen are stable

  // 1. Fetch Class Context (subject, grade, section etc.) based on classId
  useEffect(() => {
    const fetchClassContextDetails = async () => {
      if (!classId) {
        setError("No Class ID provided in the URL.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setPageMessage(null);
      setClassContext(null); // Reset class context on classId change
      setStudents([]); // Reset students
      setAttendance({}); // Reset attendance

      try {
        console.log(`Fetching class context for classId: ${classId}`);
        // Request population for fields needed for display (subjectName, gradeName)
        // The backend service getClassScheduleById populates based on the 'populate' query param.
        // The frontend service getClassScheduleById(scheduleId, populate) passes this along.
        const populateFields = 'subjectId,gradeId,branchId,schoolId'; // teacherId is part of the schedule doc itself
        const classData = await classScheduleService.getClassScheduleById(classId, populateFields);

        // classData should now include populated fields if successful, e.g.,
        // classData.subjectId = { id: 'xyz', title: 'Mathematics', ... }
        // classData.gradeId = { id: 'abc', title: 'Grade 10', ... }
        // The component expects classContext to have:
        // subjectId (as object), gradeId (as object), section, branchId (as object), schoolId (as object)
        // AND subjectName, gradeName for display.

        if (!classData || !classData.subjectId || !classData.gradeId || !classData.section || !classData.branchId || !classData.schoolId) {
          throw new Error("Fetched class details are incomplete. Missing one or more required IDs or populated objects (subject, grade, section, branch, school).");
        }
        console.log("Fetched class context:", classData);
        setClassContext(classData);
        // Student fetching will be triggered by the change in classContext in another useEffect
      } catch (err) {
        const errMsg = err.message || 'Failed to load class details.';
        setError(errMsg);
        showToast(errMsg, 'error');
        console.error("Error in fetchClassContextDetails:", err);
        setLoading(false); // Stop loading if class context fails, as students can't be fetched.
      }
      // Note: setLoading(false) is primarily handled in the student fetching useEffect,
      // but if class context fetching fails, we must stop loading here.
    };
    fetchClassContextDetails();
  }, [classId, showToast]); // Added showToast to dependencies


  // 2. Fetch Students once Class Context is available
  useEffect(() => {
    const fetchStudentsForClass = async () => {
      // Ensure classContext and necessary IDs (now as objects) are loaded
      if (!classContext || !classContext.gradeId?.id || !classContext.branchId?.id || !classContext.schoolId?.id) {
        if (!loading && !classContext) setError(prev => prev || "Class details not available to fetch students.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const studentParams = {
          gradeId: classContext.gradeId.id, // Use .id from populated object
          section: classContext.section,
          branchId: classContext.branchId.id, // Use .id
          schoolId: classContext.schoolId.id, // Use .id, assuming userService.getAllUsers needs it
          role: 'student',
          limit: 500,
          // sortBy: 'fullname:asc',
        };
        const studentRes = await userService.getAllUsers(studentParams);
        setStudents(studentRes?.data?.results || []);
      } catch (err) {
        const errMsg = err.message || 'Failed to load students for the class.';
        setError(errMsg);
        showToast(errMsg, 'error');
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsForClass();
  }, [classContext, showToast]); // REMOVED 'loading' from dependencies


  // 3. Fetch Existing Attendance Records when selectedDate or students list changes (after initial load)
  useEffect(() => {
    const fetchExistingAttendance = async () => {
      // Ensure classContext and necessary IDs from populated objects are available
      if (!selectedDate || students.length === 0 || !classContext ||
          !classContext.subjectId?.id || !classContext.gradeId?.id ||
          !classContext.branchId?.id || !classContext.schoolId?.id) {
        if (students.length === 0) setAttendance({});
        return;
      }
      setLoadingAttendance(true);
      setPageMessage(null);
      setError(null);

      try {
        const formattedDate = new Date(selectedDate).toISOString().split('T')[0];
        const attendanceParams = {
          gradeId: classContext.gradeId.id,       // Use .id
          section: classContext.section,
          subjectId: classContext.subjectId.id,   // Use .id
          branchId: classContext.branchId.id,     // Use .id
          schoolId: classContext.schoolId.id,     // Use .id
          date: formattedDate,
          limit: students.length,
          populate: 'studentId',
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

    // Removed `if (!loading)` wrapper as `loading` is no longer a dependency.
    // This effect now runs based on changes to selectedDate, students, or classContext.
    fetchExistingAttendance();
  }, [selectedDate, students, classContext, showToast]); // REMOVED 'loading', added showToast


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
        if (!classContext.schoolId?.id || !classContext.subjectId?.id || !classContext.gradeId?.id || !classContext.branchId?.id) {
            showToast(`Cannot save attendance for ${student.fullname}: Critical class information (school, subject, grade, or branch ID) is missing.`, 'error');
            // Potentially skip this record or halt the process
            return; // Or use `continue;` if this was in a for loop to skip this student
        }
        recordsToSave.push({
          studentId: student.id,
          schoolId: classContext.schoolId.id,     // Use .id
          subjectId: classContext.subjectId.id,   // Use .id
          gradeId: classContext.gradeId.id,       // Use .id
          section: classContext.section,
          branchId: classContext.branchId.id,     // Use .id
          date: new Date(selectedDate).toISOString().split('T')[0],
          status: studentAtt.status,
          remarks: studentAtt.remarks || '',
          markedBy: teacherUser.id, // teacherUser.id is already the ID
        });
      }
    });

    if (recordsToSave.length === 0) {
      showToast("No new attendance data to save.", "info");
      setSaving(false);
      return;
    }

    try {
      const response = await attendanceService.markBulkAttendance(recordsToSave);

      let successfulSaves = response.success ? response.success.length : 0;
      let errorsPresent = response.errors && response.errors.length > 0;

      if (errorsPresent) {
        const errorMessages = response.errors.map(err => {
            const studentName = students.find(s => s.id === err.entry?.studentId)?.fullname || err.entry?.studentId || "Unknown student";
            return `${studentName}: ${err.error}`;
        }).join('; ');
        showToast(`Some records failed: ${errorMessages}. ${successfulSaves} records saved.`, 'warning');
      } else {
        showToast('Attendance saved successfully!', 'success');
      }

      // Re-fetch attendance data to update the UI correctly, regardless of partial or full success
      // This ensures `isMarked` status is updated for all successfully saved entries.
      // Triggering the useEffect that fetches existing attendance:
      // A robust way is to ensure its dependencies correctly capture changes.
      // Forcing a re-fetch by slightly altering a dependency or using a dedicated refetch trigger.
      // One simple way is to re-set the students array, which is a dependency of the attendance fetching useEffect.
      // This ensures that the logic to determine `isMarked` runs again with fresh data.
      const currentStudents = [...students];
      setStudents([]); // Clear to ensure the effect re-runs when students are re-added
      setTimeout(() => setStudents(currentStudents), 0);


    } catch (err) {
      // This catch block is for network errors or unexpected errors from markBulkAttendance itself
      const apiErrorMessage = err.message || (err.data && err.data.message) || 'Failed to save attendance due to a system error.';
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
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Take Attendance: {classContext?.subjectId?.title || 'Loading class...'} ({classContext?.gradeId?.title} - Sec {classContext?.section})
        </Typography>

        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={4}>
            <DatePicker
              selected={selectedDate}
              onChange={(newDate) => setSelectedDate(newDate || new Date())}
              disabled={saving || loadingAttendance}
              customInput={<TextField fullWidth size="small" />}
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
  );
};

export default AttendanceTakingPage;
