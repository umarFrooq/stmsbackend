import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { getSubmissionsForAssignment, gradeSubmission } from '../../services/submissionService';
import { getAssignmentById } from '../../services/assignmentService';
import { getUsers } from '../../services/userService';
import useAuthStore from '../../store/auth.store';

const TeacherSubmissionsPage = () => {
  const { assignmentId } = useParams();
  const { user } = useAuthStore();
  const [assignment, setAssignment] = useState(null);
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [marks, setMarks] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAssignmentAndStudents = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const assignmentData = await getAssignmentById(assignmentId);
      setAssignment(assignmentData);

      const studentParams = {
        school: user.schoolId,
        grade: assignmentData.gradeId._id,
        role: 'student',
        limit: 500,
        sortBy: 'firstName:asc',
      };
      const studentData = await getUsers(studentParams);
      setStudents(studentData.results || []);

      const submissionData = await getSubmissionsForAssignment(assignmentId);
      setSubmissions(submissionData.results || []);

      const initialMarks = {};
      (submissionData.results || []).forEach(submission => {
        initialMarks[submission.studentId._id] = submission.obtainedMarks || '';
      });
      setMarks(initialMarks);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data.');
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, user.schoolId]);

  useEffect(() => {
    fetchAssignmentAndStudents();
  }, [fetchAssignmentAndStudents]);

  const handleMarksChange = (studentId, value) => {
    setMarks(prev => ({ ...prev, [studentId]: value }));
  };

  const handleSaveMarks = async (studentId) => {
    const obtainedMarks = marks[studentId];
    if (obtainedMarks === '' || isNaN(obtainedMarks)) {
      setError('Please enter valid marks.');
      return;
    }

    const submission = submissions.find(s => s.studentId._id === studentId);
    if (submission) {
      try {
        await gradeSubmission(submission._id, { obtainedMarks });
        setSuccess('Marks updated successfully!');
      } catch (err) {
        console.error('Error updating marks:', err);
        setError(err.message || 'Failed to update marks.');
      }
    } else {
        setError('No submission found for this student.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Submissions for {assignment?.title}
      </Typography>

      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Marks</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map(student => (
                <TableRow key={student._id}>
                  <TableCell>{student.firstName} {student.lastName}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={marks[student._id] || ''}
                      onChange={(e) => handleMarksChange(student._id, e.target.value)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      onClick={() => handleSaveMarks(student._id)}
                    >
                      Save
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default TeacherSubmissionsPage;
