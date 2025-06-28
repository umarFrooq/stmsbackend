import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  CircularProgress,
} from '@mui/material';
import PropTypes from 'prop-types';

const ConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  contentText,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false, // To show a loader on the confirm button
  confirmButtonColor = 'primary', // 'primary', 'secondary', 'error', etc.
  children, // Optional: To render custom content within the dialog
}) => {
  return (
    <Dialog
      open={open}
      onClose={isLoading ? null : onClose} // Prevent closing while loading
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
    >
      <DialogTitle id="confirmation-dialog-title">{title}</DialogTitle>
      <DialogContent>
        {contentText && (
          <DialogContentText id="confirmation-dialog-description">
            {contentText}
          </DialogContentText>
        )}
        {children}
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onClose} color="inherit" disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          color={confirmButtonColor}
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
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
  confirmButtonColor: PropTypes.oneOf([
    'inherit',
    'primary',
    'secondary',
    'success',
    'error',
    'info',
    'warning',
  ]),
};

export default ConfirmationDialog;
