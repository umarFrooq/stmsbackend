import React from 'react';
import { Typography, Container, Paper, Grid, Box } from '@mui/material';
import InfoCard from '../../components/common/InfoCard'; // Assuming InfoCard component

// Icons
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount'; // Manage Admins/Users
import BusinessIcon from '@mui/icons-material/Business'; // Branch Management
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications'; // System Settings
import VpnKeyIcon from '@mui/icons-material/VpnKey'; // Roles/Permissions

const SuperAdminDashboardPage = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Super Administrator Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            title="Global User Management"
            description="Manage Admins, Teachers, etc."
            icon={<SupervisorAccountIcon fontSize="large" color="primary" />}
            linkTo="/superadmin/users" // Define this route
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            title="Branch Management"
            description="Manage School Branches/Campuses"
            icon={<BusinessIcon fontSize="large" color="secondary" />}
            linkTo="/superadmin/branches" // Define this route
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            title="System Settings"
            description="Configure Global Parameters"
            icon={<SettingsApplicationsIcon fontSize="large" color="success" />}
            linkTo="/superadmin/settings" // Define this route
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            title="Roles & Permissions"
            description="View System Roles (Viewer)"
            icon={<VpnKeyIcon fontSize="large" color="info" />}
            linkTo="/superadmin/roles" // Define this route
          />
        </Grid>
        {/* Add more cards as needed */}
      </Grid>
      <Paper sx={{ p: 2, mt: 4 }}>
        <Typography variant="h6">System Health & Analytics</Typography>
        {/* Placeholder for system health info */}
        <Typography variant="body2" color="textSecondary">Overall System Status: Nominal</Typography>
        <Typography variant="body2" color="textSecondary">Active Users Today: 150</Typography>
      </Paper>
    </Container>
  );
};

export default SuperAdminDashboardPage;
