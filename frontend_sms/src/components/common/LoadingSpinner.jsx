import React from 'react';
import { Spinner } from 'react-bootstrap';
import PropTypes from 'prop-types';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({
  size = 'md', // Bootstrap sizes: 'sm', 'md' (default), or use CSS for custom
  // thickness is not a direct prop for Bootstrap spinner
  message = null,
  fullScreen = false,
  height = 'auto', // Specify height if not fullScreen but want specific area
  variant = 'primary', // Bootstrap spinner color variant
}) => {

  const spinnerSizeMapping = {
    // MUI size (pixels) to Bootstrap named size or undefined for default
    20: 'sm', // Example: MUI CircularProgress size={20} maps to 'sm'
    40: undefined, // Default Bootstrap Spinner size (maps to MUI size=40 roughly)
    // Add more mappings if other MUI sizes were commonly used
  };
  // If `size` is a number from MUI, try to map it. If it's already 'sm' or 'md', use it.
  const bsSpinnerSize = typeof size === 'number' ? spinnerSizeMapping[size] : size;


  const containerClasses = [
    styles.spinnerContainer,
    fullScreen ? styles.fullScreen : '',
  ].join(' ').trim();

  const containerStyle = !fullScreen ? { height: height, minHeight: message ? '100px' : 'auto' } : {};

  return (
    <div className={containerClasses} style={containerStyle}>
      <Spinner animation="border" variant={variant} size={bsSpinnerSize} role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      {message && (
        <p className={styles.spinnerMessage}>
          {message}
        </p>
      )}
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), // Can be number (MUI legacy) or 'sm', 'md'
  // thickness: PropTypes.number, // Not directly applicable to Bootstrap Spinner
  message: PropTypes.string,
  fullScreen: PropTypes.bool,
  height: PropTypes.string,
  variant: PropTypes.string, // Bootstrap color variant
};

export default LoadingSpinner;
