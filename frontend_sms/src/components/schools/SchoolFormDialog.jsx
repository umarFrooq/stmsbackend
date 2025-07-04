import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Box,
} from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import PropTypes from 'prop-types';

const SchoolFormDialog = ({ open, onClose, school, onSubmit, isLoading }) => {
  const isEditing = Boolean(school && school._id); // Use _id for existing school check

  const initialValues = {
    nameOfSchool: school?.name || '', // Backend school model uses 'name'
    adminEmail: '', // Only for creation, not pre-filled for edit
  };

  const validationSchema = Yup.object().shape({
    nameOfSchool: Yup.string()
      .required('School name is required')
      .min(3, 'School name must be at least 3 characters'),
    adminEmail: Yup.string().email('Invalid email address').when('$isEditing', {
        is: (isEditingVal) => !isEditingVal, // Apply only when not editing
        then: (schema) => schema.required('Admin email is required for new schools'),
        otherwise: (schema) => schema.notRequired(),
    }),
  });

  const handleSubmitDialog = async (values, { setSubmitting }) => {
    // The parent component's onSubmit expects (values, isEditingMode)
    // For editing, we only send nameOfSchool. For creation, both.
    const submissionValues = {
      nameOfSchool: values.nameOfSchool,
    };
    if (!isEditing) {
      submissionValues.adminEmail = values.adminEmail;
    }

    const success = await onSubmit(submissionValues, isEditing);
    setSubmitting(false);
    if (success) {
      onClose(); // Close dialog if submission was successful
    }
    // If not successful, dialog remains open for corrections
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Edit School' : 'Add New School'}</DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmitDialog}
        enableReinitialize // Important if `school` prop changes for editing
        context={{ isEditing }} // Pass isEditing to Yup context
      >
        {({ errors, touched, isSubmitting: formikIsSubmitting, values, handleChange, handleBlur }) => (
          <Form>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="School Name"
                    name="nameOfSchool"
                    value={values.nameOfSchool}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.nameOfSchool && Boolean(errors.nameOfSchool)}
                    helperText={touched.nameOfSchool && errors.nameOfSchool}
                    disabled={isLoading || formikIsSubmitting}
                    autoFocus
                  />
                </Grid>
                {!isEditing && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Admin Email"
                      name="adminEmail"
                      type="email"
                      value={values.adminEmail}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.adminEmail && Boolean(errors.adminEmail)}
                      helperText={touched.adminEmail && errors.adminEmail}
                      disabled={isLoading || formikIsSubmitting}
                    />
                  </Grid>
                )}
              </Grid>
              {/* Optional: Display a general submission error from parent if needed */}
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
              <Button onClick={onClose} color="inherit" disabled={isLoading || formikIsSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isLoading || formikIsSubmitting}
                startIcon={(isLoading || formikIsSubmitting) ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {(isLoading || formikIsSubmitting)
                  ? (isEditing ? 'Saving...' : 'Creating...')
                  : (isEditing ? 'Save Changes' : 'Create School')}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

SchoolFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  school: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    // other school properties if needed for pre-fill
  }),
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool, // Prop to indicate parent component's loading state (e.g., context's loadingSchoolAction)
};

SchoolFormDialog.defaultProps = {
  school: null,
  isLoading: false,
};

export default SchoolFormDialog;
