import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, Alert, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Grid, CircularProgress, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

import LoadingSpinner from '../../components/common/LoadingSpinner';
import NotificationToast from '../../components/common/NotificationToast';

// Mock service
const mockGradeService = {
  getStudentsForGrading: async (classId, assessmentId) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Similar to attendance, fetch students for the class.
    // AssessmentId might determine if marks are already present.
    const allUsers = JSON.parse(localStorage.getItem('mock_users')) || [];
     if (classId === 'class1') {
        return allUsers.filter(u => u.role === 'student').slice(0, 5).map(s => ({...s, id: s.id || `s_${Math.random()}`}));
    }
    if (classId === 'class2') {
        return allUsers.filter(u => u.role === 'student').slice(5, 10).map(s => ({...s, id: s.id || `s_${Math.random()}`}));
    }
    return allUsers.filter(u => u.role === 'student').slice(0,3).map(s => ({...s, id: s.id || `s_${Math.random()}`}));
  },
  getExistingGrades: async (classId, assessmentId) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const records = JSON.parse(localStorage.getItem(`mock_grades_${classId}_${assessmentId}`)) || [];
    return records; // Format: [{ studentId, marks, comments }]
  },
  saveGrades: async (classId, assessmentId, gradeData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    localStorage.setItem(`mock_grades_${classId}_${assessmentId}`, JSON.stringify(gradeData));
    console.log(`Grades saved for class ${classId}, assessment ${assessmentId}:`, gradeData);
    return { success: true };
  },
  getAssessmentsForClass: async (classId) => { // To select an assessment
    await new Promise(resolve => setTimeout(resolve, 100));
    // This should come from backend, linked to subject/class
    if (classId === 'class1') return [{id: 'midterm1', name: 'Midterm Exam - Math G2A', maxMarks: 100}, {id: 'assign1', name: 'Assignment 1 - Algebra', maxMarks: 20}];
    if (classId === 'class2') return [{id: 'midterm_eng1', name: 'Midterm Exam - English G1B', maxMarks: 50}];
    return [{id: 'default_assess', name: 'Default Assessment', maxMarks: 100}];
  }
};

const GradeEntryPage = () => {
  const { classId } = useParams(); // classId to identify the class
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({}); // { studentId: { marks: '', comments: '' } }
  const [classDetails, setClassDetails] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [currentAssessment, setCurrentAssessment] = useState(null); // For maxMarks

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const showToast = (message, severity = 'success') => {
    setToastMessage(message); setToastSeverity(severity); setToastOpen(true);
  };

  // Fetch class details, assessments, and students
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true); setError(null);
      try {
        // Mock class details (similar to AttendanceTakingPage)
        const mockSubjects = JSON.parse(localStorage.getItem('mock_subjects')) || [];
        const mockGradeLevels = JSON.parse(localStorage.getItem('mock_grade_levels')) || [];
        const tempClassInfo = {
            class1: { subjectName: mockSubjects.find(s=>s.id==='subj1')?.name || 'Math', gradeLevelName: mockGradeLevels.find(g=>g.id==='grade2')?.name || 'Grade 2', section: 'A' },
            class2: { subjectName: mockSubjects.find(s=>s.id==='subj2')?.name || 'English', gradeLevelName: mockGradeLevels.find(g=>g.id==='grade1')?.name || 'Grade 1', section: 'B' },
        };
        setClassDetails(tempClassInfo[classId] || { subjectName: 'Unknown Class', gradeLevelName: '', section: ''});

        const assessmentData = await mockGradeService.getAssessmentsForClass(classId);
        setAssessments(assessmentData);
        if (assessmentData.length > 0) {
            setSelectedAssessmentId(assessmentData[0].id); // Select first assessment by default
            setCurrentAssessment(assessmentData[0]);
        }

        // Students are fetched after an assessment is selected (see next useEffect)
      } catch (err) { setError(err.message || 'Failed to load initial data.'); showToast(err.message || 'Failed to load initial data.', 'error');}
      finally { setLoading(false); } // Still loading until students are fetched
    };
    fetchInitialData();
  }, [classId]);

  // Fetch students and existing grades when assessment changes
  useEffect(() => {
    const fetchStudentsAndGrades = async () => {
      if (!selectedAssessmentId) {
        setStudents([]); // Clear students if no assessment selected
        setGrades({});
        return;
      }
      setLoading(true); // For student/grade loading
      try {
        const studentData = await mockGradeService.getStudentsForGrading(classId, selectedAssessmentId);
        setStudents(studentData);

        const existingGrades = await mockGradeService.getExistingGrades(classId, selectedAssessmentId);
        const newGradesState = {};
        studentData.forEach(s => {
            const record = existingGrades.find(g => g.studentId === s.id);
            newGradesState[s.id] = record ? { marks: record.marks, comments: record.comments } : { marks: '', comments: '' };
        });
        setGrades(newGradesState);
        setCurrentAssessment(assessments.find(a => a.id === selectedAssessmentId));

      } catch (err) { showToast('Failed to load students or grades for assessment.', 'error'); }
      finally { setLoading(false); }
    };

    if(classId) fetchStudentsAndGrades();
  }, [selectedAssessmentId, classId, assessments]); // Removed students.length dependency

  const handleGradeChange = (studentId, value) => {
    const maxMarks = currentAssessment?.maxMarks || 100;
    const numValue = value === '' ? '' : Number(value); // Allow empty string to clear
    if (value === '' || (numValue >= 0 && numValue <= maxMarks)) {
        setGrades(prev => ({ ...prev, [studentId]: { ...prev[studentId], marks: value === '' ? '' : numValue } }));
    } else if (numValue > maxMarks) {
        setGrades(prev => ({ ...prev, [studentId]: { ...prev[studentId], marks: maxMarks } }));
    } else if (numValue < 0) {
         setGrades(prev => ({ ...prev, [studentId]: { ...prev[studentId], marks: 0 } }));
    }
  };

  const handleCommentChange = (studentId, comments) => {
     setGrades(prev => ({ ...prev, [studentId]: { ...prev[studentId], comments } }));
  };

  const handleSubmitGrades = async () => {
    setSaving(true);
    const gradeDataToSave = Object.entries(grades)
        .filter(([_, data]) => data.marks !== '' || data.comments !== '') // Only save if marks or comments exist
        .map(([studentId, data]) => ({
            studentId,
            studentName: students.find(s=>s.id === studentId)?.fullname,
            marks: data.marks === '' ? null : Number(data.marks), // Store empty as null or handle as per backend
            comments: data.comments,
        }));

    if (gradeDataToSave.length === 0) {
        showToast("No grades entered to save.", "info");
        setSaving(false);
        return;
    }

    try {
      await mockGradeService.saveGrades(classId, selectedAssessmentId, gradeDataToSave);
      showToast('Grades saved successfully!', 'success');
    } catch (err) { showToast('Failed to save grades.', 'error'); }
    finally { setSaving(false); }
  };

  if (loading && !classDetails && assessments.length === 0) {
    return <LoadingSpinner fullScreen message="Loading class data..." />;
  }
  if (error) { return <Container sx={{ py: 3 }}><Alert severity="error">{error}</Alert></Container>; }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Grade Entry: {classDetails?.subjectName} ({classDetails?.gradeLevelName} - Sec {classDetails?.section})
        </Typography>

        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={saving || loading}>
              <InputLabel id="assessment-select-label">Select Assessment</InputLabel>
              <Select
                labelId="assessment-select-label"
                value={selectedAssessmentId}
                label="Select Assessment"
                onChange={(e) => setSelectedAssessmentId(e.target.value)}
              >
                {assessments.map(asm => (
                  <MenuItem key={asm.id} value={asm.id}>{asm.name} (Max: {asm.maxMarks})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {loading && <CircularProgress sx={{display: 'block', margin: '20px auto'}}/>}

        {!loading && !selectedAssessmentId && assessments.length > 0 && (
            <Alert severity="info">Please select an assessment to enter grades.</Alert>
        )}
        {!loading && assessments.length === 0 && (
            <Alert severity="warning">No assessments found for this class. Please create an assessment first.</Alert>
        )}
        {!loading && selectedAssessmentId && students.length === 0 && (
            <Alert severity="warning">No students found for this class and assessment.</Alert>
        )}

        {selectedAssessmentId && students.length > 0 && !loading && (
          <TableContainer component={Paper} variant="outlined">
            <Table sx={{ minWidth: 650 }} aria-label="grade entry table">
              <TableHead sx={{backgroundColor: 'grey.100'}}>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell align="right" sx={{width: '120px'}}>Marks (Max: {currentAssessment?.maxMarks || 'N/A'})</TableCell>
                  <TableCell>Comments/Feedback</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell component="th" scope="row">{student.fullname} ({student.email})</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        variant="outlined"
                        value={grades[student.id]?.marks ?? ''}
                        onChange={(e) => handleGradeChange(student.id, e.target.value)}
                        inputProps={{
                            min: 0,
                            max: currentAssessment?.maxMarks,
                            step: "0.5" // or "1" or "any"
                        }}
                        sx={{width: '100px'}}
                        disabled={saving}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        variant="outlined"
                        placeholder="Optional comments"
                        value={grades[student.id]?.comments || ''}
                        onChange={(e) => handleCommentChange(student.id, e.target.value)}
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
            onClick={handleSubmitGrades}
            disabled={saving || loading || students.length === 0 || !selectedAssessmentId}
          >
            {saving ? 'Saving...' : 'Save Grades'}
          </Button>
        </Box>
      </Paper>
      <NotificationToast open={toastOpen} message={toastMessage} severity={toastSeverity} handleClose={() => setToastOpen(false)} />
    </Container>
  );
};

export default GradeEntryPage;
