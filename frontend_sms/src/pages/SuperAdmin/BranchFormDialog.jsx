import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import PropTypes from 'prop-types';

const BranchFormDialog = ({ open, onClose, branch, onSubmit }) => {
  const isEditing = Boolean(branch);

  const initialValues = {
    name: branch?.name || '',
    location: branch?.location || '',
    contactPerson: branch?.contactPerson || '',
    contactEmail: branch?.contactEmail || '',
    contactPhone: branch?.contactPhone || '', // Assuming you might add this
    status: branch?.status || 'active',
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Branch name is required').min(3, 'Name must be at least 3 characters'),
    location: Yup.string().required('Location is required'),
    contactPerson: Yup.string().required('Contact person name is required'),
    contactEmail: Yup.string().email('Invalid email address').required('Contact email is required'),
    contactPhone: Yup.string().matches(/^[0-9+-]*$/, 'Invalid phone number format').nullable(), // Optional phone
    status: Yup.string().required('Status is required'),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    await onSubmit(values, isEditing, branch?.id);
    setSubmitting(false);
    // onClose will be called by parent component after submit to control refresh logic
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>{isEditing ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ errors, touched, isSubmitting, values, handleChange, handleBlur }) => (
          <Form>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Branch Name"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                    disabled={isSubmitting}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={touched.status && Boolean(errors.status)} disabled={isSubmitting}>
                    <InputLabel id="status-select-label">Status</InputLabel>
                    <Select
                      labelId="status-select-label"
                      id="status"
                      name="status"
                      value={values.status}
                      label="Status"
                      onChange={handleChange}
                      onBlur={handleBlur}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                    {touched.status && errors.status && <FormHelperText>{errors.status}</FormHelperText>}
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location / Address"
                    name="location"
                    value={values.location}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.location && Boolean(errors.location)}
                    helperText={touched.location && errors.location}
                    disabled={isSubmitting}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contact Person"
                    name="contactPerson"
                    value={values.contactPerson}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.contactPerson && Boolean(errors.contactPerson)}
                    helperText={touched.contactPerson && errors.contactPerson}
                    disabled={isSubmitting}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contact Email"
                    name="contactEmail"
                    type="email"
                    value={values.contactEmail}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.contactEmail && Boolean(errors.contactEmail)}
                    helperText={touched.contactEmail && errors.contactEmail}
                    disabled={isSubmitting}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contact Phone (Optional)"
                    name="contactPhone"
                    value={values.contactPhone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.contactPhone && Boolean(errors.contactPhone)}
                    helperText={touched.contactPhone && errors.contactPhone}
                    disabled={isSubmitting}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
              <Button onClick={() => onClose(false)} color="inherit" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {isSubmitting ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Branch')}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

BranchFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  branch: PropTypes.object, // Null for add, object for edit
  onSubmit: PropTypes.func.isRequired,
};

export default BranchFormDialog;
