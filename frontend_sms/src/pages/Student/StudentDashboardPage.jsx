import React from 'react';
import { Typography, Container, Paper, Grid, Box } from '@mui/material';
import InfoCard from '../../components/common/InfoCard'; // Assuming InfoCard component will be created

// Icons for cards (examples)
import GradeIcon from '@mui/icons-material/Grade';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const StudentDashboardPage = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Student Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            title="My Grades"
            value="View Details" // Or display a summary like "A Average"
            icon={<GradeIcon fontSize="large" color="primary" />}
            linkTo="/student/grades" // Define this route later
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            title="My Attendance"
            value="View Records" // Or display "95% Present"
            icon={<EventAvailableIcon fontSize="large" color="secondary" />}
            linkTo="/student/attendance" // Define this route later
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            title="My Timetable"
            value="View Schedule"
            icon={<AssignmentIcon fontSize="large" color="success" />}
            linkTo="/student/timetable" // Define this route later
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
        {/* Add more cards for other student features as needed */}
      </Grid>
      <Paper sx={{ p: 2, mt: 4 }}>
        <Typography variant="h6">Announcements</Typography>
        <Typography variant="body2" color="textSecondary">
          No new announcements at this time.
        </Typography>
        {/* Placeholder for announcements list */}
      </Paper>
    </Container>
  );
};

export default StudentDashboardPage;
