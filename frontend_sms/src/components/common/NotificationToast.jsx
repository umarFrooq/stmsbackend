import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import PropTypes from 'prop-types';
import styles from './NotificationToast.module.css';

const NotificationToast = ({
  open,
  message,
  severity = 'info', // 'error', 'warning', 'info', 'success'
  handleClose,
  autoHideDuration = 6000,
  vertical = 'top', // 'top', 'bottom'
  horizontal = 'center', // 'left', 'center', 'right' -> maps to 'start', 'center', 'end'
}) => {
  // Map MUI severity to Bootstrap text/bg color classes
  const getToastBgColor = (sev) => {
    switch (sev) {
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info'; // Bootstrap 'info' bg color
    }
  };

  // Map MUI anchorOrigin to Bootstrap ToastContainer position or custom CSS classes
  const getPositionClass = () => {
    let positionKey = vertical.toLowerCase(); // top, bottom
    if (horizontal === 'left') positionKey += 'Start';
    else if (horizontal === 'right') positionKey += 'End';
    else positionKey += 'Center'; // for 'center'

    return styles[positionKey] || styles.topCenter; // Fallback
  };

  const bgColor = getToastBgColor(severity);
  // Text color will often be white for dark backgrounds, or dark for light backgrounds
  // Bootstrap's bg-* classes often handle this, but we can force it if needed.
  const textColor = (bgColor === 'warning' || bgColor === 'info' || bgColor === 'light') ? 'dark' : 'white';


  return (
    <ToastContainer className={`${styles.toastContainer} ${getPositionClass()}`} position={undefined}>
      <Toast
        onClose={handleClose}
        show={open}
        delay={autoHideDuration}
        autohide
        bg={bgColor} // Apply background color directly
        className={textColor === 'dark' ? 'text-dark' : 'text-white'} // Ensure text contrast
      >
        <Toast.Header closeButton={true} className={styles.toastHeader}>
          <strong className="me-auto">
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
          </strong>
        </Toast.Header>
        <Toast.Body>{message}</Toast.Body>
      </Toast>
    </ToastContainer>
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

export default NotificationToast;
