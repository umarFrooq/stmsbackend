import React from 'react';
import { Typography, Container, Paper, Grid, Box } from '@mui/material';
import InfoCard from '../../components/common/InfoCard'; // Assuming InfoCard component will be created

// Icons for cards (examples)
import GradeIcon from '@mui/icons-material/Grade';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AssignmentIcon from '@mui/icons-material/Assignment'; // Used for Timetable, will use a different one for Assignments
import SchoolIcon from '@mui/icons-material/School'; // Example for Assignments
import AccountCircleIcon from '@mui/icons-material/AccountCircle';


const StudentDashboardPage = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Student Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}> {/* Adjusted grid size for more cards */}
          <InfoCard
            title="My Grades"
            value="View Details"
            icon={<GradeIcon fontSize="large" color="primary" />}
            linkTo="/student/grades"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}> {/* Adjusted grid size */}
          <InfoCard
            title="My Attendance"
            value="View Records"
            icon={<EventAvailableIcon fontSize="large" color="secondary" />}
            linkTo="/student/my-attendance"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}> {/* Adjusted grid size */}
          <InfoCard
            title="Assignments"
            value="View & Submit"
            icon={<SchoolIcon fontSize="large" color="warning" />} // Changed icon
            linkTo="/student/assignments" // Link to new assignments page
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}> {/* Adjusted grid size */}
          <InfoCard
            title="My Timetable"
            value="View Schedule"
            icon={<AssignmentIcon fontSize="large" color="success" />} // This icon was for Timetable
            linkTo="/student/timetable"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}> {/* Adjusted grid size */}
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
