import React from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import PropTypes from 'prop-types';
import styles from './ConfirmationDialog.module.css'; // Assuming you might add styles later

const ConfirmationDialog = ({
  open, // Will be mapped to `show` for React-Bootstrap Modal
  onClose,
  onConfirm,
  title,
  contentText,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  confirmButtonColor = 'primary', // MUI color prop
  children,
}) => {
  // Map MUI color to Bootstrap variant
  const getButtonVariant = (muiColor) => {
    switch (muiColor) {
      case 'error':
        return 'danger';
      case 'secondary':
        return 'secondary';
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'primary':
      default:
        return 'primary';
    }
  };

  const buttonVariant = getButtonVariant(confirmButtonColor);

  return (
    <Modal
      show={open}
      onHide={isLoading ? null : onClose} // Prevent closing while loading by not providing onHide
      backdrop={isLoading ? 'static' : true} // 'static' prevents closing on backdrop click
      keyboard={!isLoading} // Prevent closing with Esc key while loading
      aria-labelledby="confirmation-dialog-title"
      centered
    >
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title id="confirmation-dialog-title">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {contentText && <p>{contentText}</p>}
        {children}
      </Modal.Body>
      <Modal.Footer className={styles.dialogFooter}>
        <Button
          variant="outline-secondary"
          onClick={onClose}
          disabled={isLoading}
          className={styles.cancelButton}
        >
          {cancelText}
        </Button>
        <Button
          variant={buttonVariant}
          onClick={onConfirm}
          disabled={isLoading}
          className={styles.confirmButton}
        >
          {isLoading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
              <span className="visually-hidden">Loading...</span>
            </>
          ) : (
            confirmText
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

ConfirmationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  contentText: PropTypes.string,
  children: PropTypes.node,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  isLoading: PropTypes.bool,
  confirmButtonColor: PropTypes.oneOf([ // Keep MUI names for now, map internally
    'inherit', // will map to default or secondary
    'primary',
    'secondary',
    'success',
    'error',
    'info',
    'warning',
  ]),
};

export default ConfirmationDialog;
