import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Grid, Card, CardContent, CardActions, Button, Box, Chip, Alert } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useAuthStore from '../../store/auth.store'; // To get logged-in teacher's ID
import classScheduleService from '../../services/classScheduleService'; // Real service

const MyClassesPage = () => {
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuthStore(); // Get current user

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user || user.role !== 'teacher') {
        setError("User is not a teacher or not logged in.");
        setLoading(false);
        setMyClasses([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // The backend route /my-classes uses the authenticated user's ID (teacherId)
        // We need to populate related fields to display names
        const params = {
          populate: 'subjectId,gradeId,branchId,schoolId', // Request population of these fields
          sortBy: 'dayOfWeek,startTime', // Optional: sort the classes
          limit: 100, // Assuming a teacher won't have more than 100 scheduled class types
        };
        const response = await classScheduleService.getTeacherClassSchedules(params);
        // The service now returns the paginated object directly if successful
        setMyClasses(response.results || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch your classes. Please try again later.');
        setMyClasses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [user]); // Re-fetch if user changes

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading your classes..." />;
  }

  if (error) {
    return (
      <Container sx={{ py: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3 }}>
        My Classes
      </Typography>

      {myClasses.length === 0 && !loading && (
        <Paper sx={{p:3, textAlign: 'center'}}>
            <Typography variant="subtitle1">You are not currently assigned to any scheduled classes, or classes could not be loaded.</Typography>
        </Paper>
      )}

      <Grid container spacing={3}>
        {myClasses.map((cls) => (
          // cls.id should be the unique _id of the ClassSchedule document
          <Grid item xs={12} sm={6} md={4} key={cls.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div">
                  {cls.subjectId?.title || 'N/A Subject'}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  {cls.gradeId?.title || 'N/A Grade'} - Section {cls.section || 'N/A'}
                </Typography>
                <Chip
                  label={`${cls.dayOfWeek} ${cls.startTime} - ${cls.endTime}`}
                  size="small"
                  sx={{mr:1, mb:1}}
                  color="primary"
                  variant="outlined"
                />
                {cls.branchId && <Chip label={`Branch: ${cls.branchId.name}`} size="small" sx={{mr:1, mb:1}} variant="outlined"/>}
                {/* Student count is not directly available on class schedule model, would require another query or aggregation */}
                {/* <Chip label={`Students: ${cls.studentCount || 'N/A'}`} size="small" sx={{mr:1, mb:1}}/> */}
                <Typography variant="body2" color="text.secondary" sx={{mt:1}}>
                  School: {cls.schoolId?.name || 'N/A School'}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-start', p:2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  component={RouterLink}
                  // cls.id is the ClassSchedule document's _id
                  to={`/teacher/class/${cls.id}/attendance`}
                >
                  Attendance
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  component={RouterLink}
                  to={`/teacher/class/${cls.id}/grades`}
                >
                  Grades
                </Button>
                 {/* Link to view students for this specific class setup (grade, section, branch) might need more context or a different page */}
                 {/* <Button
                  size="small"
                  variant="text"
                  component={RouterLink}
                  to={`/teacher/class/${cls.id}/students`}
                >
                  View Students
                </Button> */}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default MyClassesPage;
