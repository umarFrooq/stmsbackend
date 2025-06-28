import React from 'react';
import { Typography, Container, Paper, Grid, Box } from '@mui/material';
import InfoCard from '../../components/common/InfoCard'; // Assuming InfoCard component

// Icons
import ClassIcon from '@mui/icons-material/Class';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const TeacherDashboardPage = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Teacher Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            title="My Classes"
            value="Manage Rosters"
            icon={<ClassIcon fontSize="large" color="primary" />}
            linkTo="/teacher/classes" // Define this route
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            title="Attendance"
            value="Take & View"
            icon={<HowToRegIcon fontSize="large" color="secondary" />}
            linkTo="/teacher/attendance" // Define this route
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            title="Grades"
            value="Enter & Manage"
            icon={<AssessmentIcon fontSize="large" color="success" />}
            linkTo="/teacher/grades" // Define this route
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            title="My Profile"
            value="Manage Account"
            icon={<AccountCircleIcon fontSize="large" color="info" />}
            linkTo="/profile"
          />
        </Grid>
        {/* Add more cards for timetable, communication, etc. */}
      </Grid>
      <Paper sx={{ p: 2, mt: 4 }}>
        <Typography variant="h6">Pending Tasks</Typography>
        <Typography variant="body2" color="textSecondary">
          - Grade assignments for Class X.
        </Typography>
        <Typography variant="body2" color="textSecondary">
          - Finalize attendance for last week.
        </Typography>
        {/* Placeholder for task list */}
      </Paper>
    </Container>
  );
};

export default TeacherDashboardPage;
