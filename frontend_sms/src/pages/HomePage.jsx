import React from 'react';
import { Typography, Container, Paper, Box } from '@mui/material';
import useAuthStore from '../store/auth.store'; // To display user info

const HomePage = () => {
  const { user, roles } = useAuthStore();

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to the Student Management System
        </Typography>

        {user && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="h6">
              Hello, {user.fullname || user.email}!
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Your Role(s): {roles.join(', ')}
            </Typography>
          </Box>
        )}

        <Typography variant="body1" paragraph>
          This is your central dashboard. From here, you can navigate to various sections
          of the application based on your role and permissions.
        </Typography>
        <Typography variant="body1" paragraph>
          Please use the navigation menu on the left to access different modules.
        </Typography>

        {/* You can add more role-specific information or quick links here if desired */}
        {roles.includes('admin') && (
          <Typography variant="body2" color="textSecondary" sx={{mt:3}}>
            As an Admin, you can manage users, courses, and system settings.
          </Typography>
        )}
        {roles.includes('teacher') && (
          <Typography variant="body2" color="textSecondary" sx={{mt:3}}>
            As a Teacher, you can manage your classes, take attendance, and enter grades.
          </Typography>
        )}
         {roles.includes('student') && (
          <Typography variant="body2" color="textSecondary" sx={{mt:3}}>
            As a Student, you can view your grades, attendance, and timetable.
          </Typography>
        )}

      </Paper>
    </Container>
  );
};

export default HomePage;
