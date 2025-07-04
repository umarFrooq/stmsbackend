import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import PropTypes from 'prop-types';

const LoadingSpinner = ({
  size = 40,
  thickness = 3.6,
  message = null,
  fullScreen = false, // If true, centers the spinner on the entire screen
  height = 'auto', // Specify height if not fullScreen but want specific area
}) => {
  const spinner = (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      sx={
        fullScreen
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(255, 255, 255, 0.7)', // Optional: semi-transparent overlay
              zIndex: (theme) => theme.zIndex.drawer + 100, // Ensure it's on top
            }
          : {
              width: '100%',
              height: height, // Use specified height or auto
              minHeight: message ? '100px' : 'auto', // Ensure some space if there's a message
            }
      }
    >
      <CircularProgress size={size} thickness={thickness} />
      {message && (
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
    </Box>
  );

  return spinner;
};

LoadingSpinner.propTypes = {
  size: PropTypes.number,
  thickness: PropTypes.number,
  message: PropTypes.string,
  fullScreen: PropTypes.bool,
  height: PropTypes.string,
};

export default LoadingSpinner;
