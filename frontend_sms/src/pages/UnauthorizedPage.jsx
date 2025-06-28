import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb'; // Or any other suitable icon

const UnauthorizedPage = () => {
  return (
    <Container component="main" maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          mt: 8,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        <DoNotDisturbIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" paragraph>
          You do not have the necessary permissions to access this page.
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          If you believe this is an error, please contact your system administrator.
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/dashboard" // Or to "/" or "/login" depending on desired behavior
            sx={{ mr: 2 }}
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outlined"
            component={RouterLink}
            to={-1} // Go back to the previous page
          >
            Go Back
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default UnauthorizedPage;
