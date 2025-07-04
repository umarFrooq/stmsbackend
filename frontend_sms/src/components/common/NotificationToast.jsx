import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import PropTypes from 'prop-types';

// This component is more of a conceptual wrapper.
// Actual notification state management would typically live in a Zustand store or React Context.
// For this example, it takes props to be displayed.
// A more robust solution would use a global notification store.

const NotificationToast = ({
  open,
  message,
  severity = 'info', // 'error', 'warning', 'info', 'success'
  handleClose,
  autoHideDuration = 6000,
  vertical = 'top',
  horizontal = 'center',
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical, horizontal }}
      key={vertical + horizontal} // Needed if you change anchorOrigin dynamically
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant="filled" // Or "standard", "outlined"
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

NotificationToast.propTypes = {
  open: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  severity: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
  handleClose: PropTypes.func.isRequired,
  autoHideDuration: PropTypes.number,
  vertical: PropTypes.oneOf(['top', 'bottom']),
  horizontal: PropTypes.oneOf(['left', 'center', 'right']),
};

// Example of how to integrate with a global store (conceptual)
/*
// In your notificationStore.js (Zustand example)
import {create} from 'zustand';

const useNotificationStore = create((set) => ({
  open: false,
  message: '',
  severity: 'info',
  showNotification: (message, severity = 'info') => set({ open: true, message, severity }),
  closeNotification: () => set({ open: false, message: '', severity: 'info' }),
}));

export default useNotificationStore;

// In your App.jsx or main layout:
import NotificationToast from './components/common/NotificationToast';
import useNotificationStore from './store/notificationStore'; // Assuming you create this

function App() {
  const { open, message, severity, closeNotification } = useNotificationStore();
  return (
    <>
      // ... your app content ...
      <NotificationToast
        open={open}
        message={message}
        severity={severity}
        handleClose={closeNotification}
      />
    </>
  );
}
*/

export default NotificationToast;
