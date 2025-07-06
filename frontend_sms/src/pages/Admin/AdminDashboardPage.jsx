import React from 'react';
import { Typography, Container, Paper, Grid, Box } from '@mui/material';
import InfoCard from '../../components/common/InfoCard'; // Assuming InfoCard component

// Icons
import PeopleIcon from '@mui/icons-material/People'; // User Management
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'; // Subject/Course Management
import EventNoteIcon from '@mui/icons-material/EventNote'; // Scheduling/Timetable
import BarChartIcon from '@mui/icons-material/BarChart'; // Reports

const AdminDashboardPage = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Administrator Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            title="User Management"
            description="Manage Teachers, Students, Parents"
            icon={<PeopleIcon fontSize="large" color="primary" />}
            linkTo="/admin/users" // Define this route
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            title="Subject Management"
            description="Define & Assign Subjects/Courses"
            icon={<LibraryBooksIcon fontSize="large" color="secondary" />}
            linkTo="/admin/subjects" // Define this route
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            title="Class Scheduling"
            description="Manage Timetables & Assignments"
            icon={<EventNoteIcon fontSize="large" color="success" />}
            linkTo="/admin/schedules" // Define this route
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            title="Academic Reports"
            description="Generate & View Reports"
            icon={<BarChartIcon fontSize="large" color="info" />}
            linkTo="/admin/reports" // Define this route
          />
        </Grid>
         <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            title="Enrollment"
            description="Manage Student Admissions"
            icon={<HowToRegIcon fontSize="large" color="warning" />} // Using HowToRegIcon from teacher page
            linkTo="/admin/enrollment" // Define this route
          />
        </Grid>
      </Grid>
      <Paper sx={{ p: 2, mt: 4 }}>
        <Typography variant="h6">System Overview</Typography>
        {/* Placeholder for some quick stats */}
        <Typography variant="body2" color="textSecondary">Total Students: 500</Typography>
        <Typography variant="body2" color="textSecondary">Total Teachers: 30</Typography>
      </Paper>
    </Container>
  );
};

// Need to import HowToRegIcon if it's used here
import HowToRegIcon from '@mui/icons-material/HowToReg';

export default AdminDashboardPage;
