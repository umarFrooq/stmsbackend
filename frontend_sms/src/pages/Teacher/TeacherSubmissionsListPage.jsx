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
import { useParams, Link as RouterLink } from 'react-router-dom';
import { getSubmissionsForAssignment, updateSubmissionMarks } from '../../services/submissionService';
import { getAssignmentById } from '../../services/assignmentService';
import useAuthStore from '../../store/auth.store';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const TeacherSubmissionsListPage = () => {
  const { assignmentId } = useParams();
  const { user } = useAuthStore();
  const [submissions, setSubmissions] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [marks, setMarks] = useState({});
  const [remarks, setRemarks] = useState({});

  const fetchSubmissions = useCallback(async () => {
    if (!assignmentId) return;
    setIsLoading(true);
    setError('');
    try {
      const [assignmentData, submissionsData] = await Promise.all([
        getAssignmentById(assignmentId),
        getSubmissionsForAssignment(assignmentId, {}, user.id),
      ]);
      setAssignment(assignmentData);
      setSubmissions(submissionsData.results || []);
      const initialMarks = {};
      const initialRemarks = {};
      (submissionsData.results || []).forEach(sub => {
        initialMarks[sub._id] = sub.obtainedMarks || '';
        initialRemarks[sub._id] = sub.teacherRemarks || '';
      });
      setMarks(initialMarks);
      setRemarks(initialRemarks);
    } catch (err) {
      setError(err.message || 'Failed to fetch data.');
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleMarksChange = (submissionId, value) => {
    setMarks(prev => ({ ...prev, [submissionId]: value }));
  };

  const handleRemarksChange = (submissionId, value) => {
    setRemarks(prev => ({ ...prev, [submissionId]: value }));
  };

  const handleUpdateMarks = async (submissionId) => {
    const obtainedMarks = marks[submissionId];
    const teacherRemarks = remarks[submissionId];
    if (obtainedMarks === '' || isNaN(obtainedMarks)) {
      alert('Please enter valid marks.');
      return;
    }
    try {
      await updateSubmissionMarks(submissionId, { obtainedMarks, teacherRemarks });
      alert('Marks updated successfully!');
    } catch (err) {
      alert(err.message || 'Failed to update marks.');
    }
  };

  if (isLoading) {
    return (
        <Container sx={{ py: 3, textAlign: 'center' }}>
            <CircularProgress />
            <Typography>Loading submissions...</Typography>
        </Container>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        component={RouterLink}
        to="/teacher/assignments"
        variant="outlined"
        sx={{ mb: 2 }}
      >
        Back to Assignments
      </Button>
      <Typography variant="h4" component="h1" gutterBottom>
        Submissions for {assignment?.title}
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Submission Date</TableCell>
              <TableCell>Obtained Marks</TableCell>
              <TableCell>Teacher Remarks</TableCell>
              <TableCell>Total Marks</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.map(submission => (
              <TableRow key={submission._id}>
                <TableCell>{submission.studentId.firstName} {submission.studentId.lastName}</TableCell>
                <TableCell>{submission.studentId.email}</TableCell>
                <TableCell>{new Date(submission.submissionDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    value={marks[submission._id] || ''}
                    onChange={(e) => handleMarksChange(submission._id, e.target.value)}
                    sx={{ width: '100px' }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={remarks[submission._id] || ''}
                    onChange={(e) => handleRemarksChange(submission._id, e.target.value)}
                  />
                </TableCell>
                <TableCell>{assignment.totalMarks}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    onClick={() => handleUpdateMarks(submission._id)}
                  >
                    Update
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default TeacherSubmissionsListPage;
