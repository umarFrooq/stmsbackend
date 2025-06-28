import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, Alert, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, FormControlLabel, TextField, Grid, CircularProgress, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import dayjs from 'dayjs';

import LoadingSpinner from '../../components/common/LoadingSpinner';
import NotificationToast from '../../components/common/NotificationToast';

// Mock service
const mockAttendanceService = {
  getStudentsForClass: async (classId) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Simulate fetching students for a class.
    // This should ideally also fetch class details like subject name, grade.
    const allUsers = JSON.parse(localStorage.getItem('mock_users')) || [];
    // This is a very rough mock; a real API would link students to classes/sections.
    // For now, just returning some students.
    if (classId === 'class1') { // Math, Grade 2, Sec A
        return allUsers.filter(u => u.role === 'student').slice(0, 5).map(s => ({...s, id: s.id || `s_${Math.random()}`})); // First 5 students
    }
    if (classId === 'class2') { // English, Grade 1, Sec B
        return allUsers.filter(u => u.role === 'student').slice(5, 10).map(s => ({...s, id: s.id || `s_${Math.random()}`})); // Next 5
    }
    return allUsers.filter(u => u.role === 'student').slice(0,3).map(s => ({...s, id: s.id || `s_${Math.random()}`})); // Default small list
  },
  getAttendanceRecord: async (classId, date) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const records = JSON.parse(localStorage.getItem(`mock_attendance_${classId}_${date}`)) || [];
    return records;
  },
  saveAttendanceRecord: async (classId, date, attendanceData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    localStorage.setItem(`mock_attendance_${classId}_${date}`, JSON.stringify(attendanceData));
    console.log(`Attendance saved for class ${classId} on ${date}:`, attendanceData);
    return { success: true };
  }
};

const AttendanceTakingPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { studentId: { status: 'present' | 'absent' | 'late', remarks: '' } }
  const [classDetails, setClassDetails] = useState(null); // { name: 'Mathematics Grade 2A' }
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const showToast = (message, severity = 'success') => {
    setToastMessage(message); setToastSeverity(severity); setToastOpen(true);
  };

  // Fetch class details (name, subject) and students
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true); setError(null);
      try {
        // Mock class details based on classId (in real app, fetch this)
        const mockSubjects = JSON.parse(localStorage.getItem('mock_subjects')) || [];
        const mockGradeLevels = JSON.parse(localStorage.getItem('mock_grade_levels')) || [];
        // This is a placeholder for class details fetching
        const tempClassInfo = { // This should come from a better source based on classId
            class1: { subjectName: mockSubjects.find(s=>s.id==='subj1')?.name || 'Math', gradeLevelName: mockGradeLevels.find(g=>g.id==='grade2')?.name || 'Grade 2', section: 'A' },
            class2: { subjectName: mockSubjects.find(s=>s.id==='subj2')?.name || 'English', gradeLevelName: mockGradeLevels.find(g=>g.id==='grade1')?.name || 'Grade 1', section: 'B' },
            class3: { subjectName: mockSubjects.find(s=>s.id==='subj1')?.name || 'Math', gradeLevelName: mockGradeLevels.find(g=>g.id==='grade2')?.name || 'Grade 2', section: 'C' },
            class4: { subjectName: mockSubjects.find(s=>s.id==='subj3')?.name || 'Physics', gradeLevelName: mockGradeLevels.find(g=>g.id==='grade10sci')?.name || 'Grade 10 Sci', section: 'Sci-Alpha' },
        };
        const cDetails = tempClassInfo[classId] || { subjectName: 'Unknown Class', gradeLevelName: '', section: ''};
        setClassDetails(cDetails);

        const studentData = await mockAttendanceService.getStudentsForClass(classId);
        setStudents(studentData);
        // Initialize attendance: all present by default
        const initialAttendance = {};
        studentData.forEach(s => { initialAttendance[s.id] = { status: 'present', remarks: '' }; });
        setAttendance(initialAttendance);

      } catch (err) { setError(err.message || 'Failed to load data.'); showToast(err.message || 'Failed to load data.', 'error');}
      finally { setLoading(false); }
    };
    fetchInitialData();
  }, [classId]);

  // Fetch existing attendance when date changes
  useEffect(() => {
    const fetchRecord = async () => {
      if (!selectedDate || students.length === 0) return;
      setLoading(true); // Or a more subtle loading indicator
      try {
        const existingRecord = await mockAttendanceService.getAttendanceRecord(classId, selectedDate);
        if (existingRecord.length > 0) {
          const newAttendanceState = {};
          existingRecord.forEach(rec => { newAttendanceState[rec.studentId] = { status: rec.status, remarks: rec.remarks };});
          // Preserve students who might not be in the saved record but are in current roster
          students.forEach(s => {
            if (!newAttendanceState[s.id]) newAttendanceState[s.id] = { status: 'present', remarks: '' };
          });
          setAttendance(newAttendanceState);
        } else {
          // No record found, default all to present for the new date
          const defaultAttendance = {};
          students.forEach(s => { defaultAttendance[s.id] = { status: 'present', remarks: '' }; });
          setAttendance(defaultAttendance);
        }
      } catch (err) { showToast('Failed to load existing attendance record.', 'error'); }
      finally { setLoading(false); }
    };
    fetchRecord();
  }, [selectedDate, classId, students.length]); // Rerun if student list changes (though less likely for a fixed class)


  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const handleRemarkChange = (studentId, remarks) => {
     setAttendance(prev => ({ ...prev, [studentId]: { ...prev[studentId], remarks } }));
  };

  const markAll = (status) => {
    const newAttendance = {};
    students.forEach(s => { newAttendance[s.id] = { ...attendance[s.id], status }; });
    setAttendance(newAttendance);
  };

  const handleSubmitAttendance = async () => {
    setSaving(true);
    const attendanceDataToSave = Object.entries(attendance).map(([studentId, data]) => ({
      studentId,
      studentName: students.find(s=>s.id === studentId)?.fullname, // Good to save name for easier viewing of raw data
      status: data.status,
      remarks: data.remarks,
    }));
    try {
      await mockAttendanceService.saveAttendanceRecord(classId, selectedDate, attendanceDataToSave);
      showToast('Attendance saved successfully!', 'success');
    } catch (err) { showToast('Failed to save attendance.', 'error'); }
    finally { setSaving(false); }
  };


  if (loading && !classDetails) { // Initial full load
    return <LoadingSpinner fullScreen message="Loading class and student data..." />;
  }
  if (error) { return <Container sx={{ py: 3 }}><Alert severity="error">{error}</Alert></Container>; }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Take Attendance: {classDetails?.subjectName} ({classDetails?.gradeLevelName} - Sec {classDetails?.section})
        </Typography>

        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Attendance Date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={saving || loading}
            />
          </Grid>
          <Grid item xs={12} sm={8} display="flex" justifyContent={{xs: 'flex-start', sm: 'flex-end'}} gap={1}>
            <Button onClick={() => markAll('present')} variant="outlined" size="small" disabled={saving || loading}>Mark All Present</Button>
            <Button onClick={() => markAll('absent')} variant="outlined" size="small" color="secondary" disabled={saving || loading}>Mark All Absent</Button>
          </Grid>
        </Grid>

        {loading && students.length > 0 && <CircularProgress sx={{display: 'block', margin: '20px auto'}}/>}

        {!loading && students.length === 0 && (
            <Alert severity="warning">No students found for this class.</Alert>
        )}

        {students.length > 0 && (
          <TableContainer component={Paper} variant="outlined">
            <Table sx={{ minWidth: 650 }} aria-label="attendance table">
              <TableHead sx={{backgroundColor: 'grey.100'}}>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell align="center">Present</TableCell>
                  <TableCell align="center">Absent</TableCell>
                  <TableCell align="center">Late</TableCell>
                  <TableCell>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell component="th" scope="row">{student.fullname} ({student.email})</TableCell>
                    <TableCell align="center">
                      <Checkbox checked={attendance[student.id]?.status === 'present'} onChange={() => handleAttendanceChange(student.id, 'present')} disabled={saving}/>
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox checked={attendance[student.id]?.status === 'absent'} onChange={() => handleAttendanceChange(student.id, 'absent')} disabled={saving}/>
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox checked={attendance[student.id]?.status === 'late'} onChange={() => handleAttendanceChange(student.id, 'late')} disabled={saving}/>
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        variant="outlined"
                        placeholder="Optional remarks"
                        value={attendance[student.id]?.remarks || ''}
                        onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                        disabled={saving}
                      />
                    </TableCell>
                  </TableRow>
                ))}
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
            disabled={saving || loading || students.length === 0}
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
