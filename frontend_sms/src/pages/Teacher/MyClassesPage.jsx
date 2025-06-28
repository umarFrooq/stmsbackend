import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Grid, Card, CardContent, CardActions, Button, Box, Chip, Alert } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
// import useAuthStore from '../../store/auth.store'; // If teacher ID is needed for API call

// Mock service for teacher's classes
const mockTeacherClassService = {
  getMyClasses: async (teacherId = 't1') => { // Assume teacherId is passed or derived from auth state
    await new Promise(resolve => setTimeout(resolve, 500));
    // In a real app, this would fetch classes assigned to the logged-in teacher.
    // Mock data should ideally reflect this relationship.
    // Using mock subjects and grades for context.
    const mockSubjects = JSON.parse(localStorage.getItem('mock_subjects')) || [];
    const mockGradeLevels = JSON.parse(localStorage.getItem('mock_grade_levels')) || [];

    let assignedClasses = [
      {
        id: 'class1',
        subjectId: 'subj1', // Mathematics
        gradeLevelId: 'grade2', // Grade 2
        section: 'A',
        studentCount: 25,
        schedule: 'Mon 9:00 AM, Wed 9:00 AM'
      },
      {
        id: 'class2',
        subjectId: 'subj2', // English Language
        gradeLevelId: 'grade1', // Grade 1
        section: 'B',
        studentCount: 22,
        schedule: 'Tue 10:00 AM, Thu 10:00 AM'
      },
      {
        id: 'class3',
        subjectId: 'subj1', // Mathematics
        gradeLevelId: 'grade2', // Grade 2
        section: 'C',
        studentCount: 28,
        schedule: 'Mon 11:00 AM, Fri 11:00 AM'
      },
       {
        id: 'class4',
        subjectId: 'subj3', // Physics
        gradeLevelId: 'grade10sci', // Grade 10 Science
        section: 'Sci-Alpha',
        studentCount: 18,
        schedule: 'Tue 1:00 PM, Thu 1:00 PM'
      },
    ];

    // Filter subjects/classes assigned to this mock teacher (t1)
    // This logic is a bit convoluted for mock data; real API would return filtered data.
    const teacherSubjects = mockSubjects.filter(s => s.teacherIds && s.teacherIds.includes(teacherId));

    let finalClasses = [];
    teacherSubjects.forEach(ts => {
        assignedClasses.forEach(ac => {
            if (ac.subjectId === ts.id) {
                const subject = mockSubjects.find(s => s.id === ac.subjectId);
                const gradeLevel = mockGradeLevels.find(gl => gl.id === ac.gradeLevelId);
                finalClasses.push({
                    ...ac,
                    subjectName: subject?.name || 'N/A',
                    gradeLevelName: gradeLevel?.name || 'N/A',
                });
            }
        })
    });
    // If no subjects are directly assigned via mock_subjects, show all assignedClasses for t1 for demo
     if(finalClasses.length === 0 && teacherId === 't1'){
        finalClasses = assignedClasses.map(ac => {
            const subject = mockSubjects.find(s => s.id === ac.subjectId);
            const gradeLevel = mockGradeLevels.find(gl => gl.id === ac.gradeLevelId);
            return {
                 ...ac,
                subjectName: subject?.name || 'N/A',
                gradeLevelName: gradeLevel?.name || 'N/A',
            }
        })
     }


    return finalClasses;
  }
};


const MyClassesPage = () => {
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const { user } = useAuthStore(); // Get current user to pass teacherId if needed

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      setError(null);
      try {
        // const teacherId = user?.id; // Or however teacher ID is stored
        const data = await mockTeacherClassService.getMyClasses('t1'); // Pass actual teacher ID
        setMyClasses(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch classes.');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []); // [user] if using user.id

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
            <Typography variant="subtitle1">You are not currently assigned to any classes.</Typography>
        </Paper>
      )}

      <Grid container spacing={3}>
        {myClasses.map((cls) => (
          <Grid item xs={12} sm={6} md={4} key={cls.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div">
                  {cls.subjectName}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  {cls.gradeLevelName} - Section {cls.section}
                </Typography>
                <Chip label={`Students: ${cls.studentCount}`} size="small" sx={{mr:1, mb:1}}/>
                <Typography variant="body2" color="text.secondary" sx={{mt:1}}>
                  Schedule: {cls.schedule}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-start', p:2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  component={RouterLink}
                  to={`/teacher/class/${cls.id}/attendance`} // Define this route
                >
                  Attendance
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  component={RouterLink}
                  to={`/teacher/class/${cls.id}/grades`} // Define this route
                >
                  Grades
                </Button>
                 <Button
                  size="small"
                  variant="text"
                  component={RouterLink}
                  to={`/teacher/class/${cls.id}/students`} // Define this route for student list
                >
                  View Students
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default MyClassesPage;
