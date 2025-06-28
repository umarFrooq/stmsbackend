import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Box,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import NotificationToast from '../../components/common/NotificationToast'; // Assuming you have this

// Mock service for settings - replace with actual API calls
const mockSettingsService = {
  getSettings: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const settings = localStorage.getItem('mock_system_settings');
    return settings ? JSON.parse(settings) : {
      schoolName: 'Global Knowledge Academy',
      academicYear: '2024-2025',
      defaultLanguage: 'en',
      maintenanceMode: false,
      maxLoginAttempts: 5,
      sessionTimeout: 30, // in minutes
    };
  },
  saveSettings: async (settingsData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    localStorage.setItem('mock_system_settings', JSON.stringify(settingsData));
    console.log('System settings saved (mocked):', settingsData);
    return { success: true, data: settingsData };
  },
};

const SystemSettingsPage = () => {
  const [settings, setSettings] = useState({
    schoolName: '',
    academicYear: '',
    defaultLanguage: 'en',
    maintenanceMode: false,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Notification state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const data = await mockSettingsService.getSettings();
        setSettings(data);
      } catch (error) {
        showToast('Failed to load system settings.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await mockSettingsService.saveSettings(settings);
      showToast('System settings saved successfully!', 'success');
    } catch (error) {
      showToast('Failed to save system settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    // You can use your LoadingSpinner component here if you prefer
    return <Typography sx={{p:3}}>Loading system settings...</Typography>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 4 } }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3 }}>
          System Settings
        </Typography>

        <Grid container spacing={3}>
          {/* General Settings */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>General</Typography>
            <Divider sx={{mb:2}} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="School Name"
              name="schoolName"
              value={settings.schoolName}
              onChange={handleChange}
              variant="outlined"
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Current Academic Year"
              name="academicYear"
              value={settings.academicYear}
              onChange={handleChange}
              variant="outlined"
              helperText="e.g., 2024-2025"
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Default Language"
              name="defaultLanguage"
              value={settings.defaultLanguage}
              onChange={handleChange}
              variant="outlined"
              select
              SelectProps={{ native: true }}
              disabled={saving}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              {/* Add more languages as needed */}
            </TextField>
          </Grid>

          {/* Security Settings */}
          <Grid item xs={12} sx={{mt: 2}}>
            <Typography variant="h6" gutterBottom>Security</Typography>
            <Divider sx={{mb:2}} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Max Login Attempts"
              name="maxLoginAttempts"
              type="number"
              value={settings.maxLoginAttempts}
              onChange={handleChange}
              variant="outlined"
              InputProps={{ inputProps: { min: 1, max: 10 } }}
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Session Timeout (minutes)"
              name="sessionTimeout"
              type="number"
              value={settings.sessionTimeout}
              onChange={handleChange}
              variant="outlined"
              InputProps={{ inputProps: { min: 5 } }}
              disabled={saving}
            />
          </Grid>

          {/* Maintenance Mode */}
           <Grid item xs={12} sx={{mt: 2}}>
            <Typography variant="h6" gutterBottom>Maintenance</Typography>
            <Divider sx={{mb:2}} />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.maintenanceMode}
                  onChange={handleChange}
                  name="maintenanceMode"
                  color="warning"
                  disabled={saving}
                />
              }
              label="Enable Maintenance Mode"
            />
             <Typography variant="caption" display="block" color="textSecondary">
                When enabled, only Super Administrators can log in.
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Paper>
      <NotificationToast
        open={toastOpen}
        message={toastMessage}
        severity={toastSeverity}
        handleClose={() => setToastOpen(false)}
      />
    </Container>
  );
};

export default SystemSettingsPage;
