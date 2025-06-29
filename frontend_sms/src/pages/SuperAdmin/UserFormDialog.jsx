import React, { useState, useEffect } from 'react';
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
  Box,
  Chip,
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { getAllBranches } from '../../services/branchService'; // Import branch service

// availableRoles prop will be used instead of mockRoles
// availableBranches state will be populated from API instead of mockBranches

const UserFormDialog = ({ open, onClose, user, onSubmit, availableRoles = [] }) => { // Added availableRoles to props
  const isEditing = Boolean(user);

  const [availableBranches, setAvailableBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchError, setBranchError] = useState(null);

  useEffect(() => {
    if (open) { // Fetch branches when dialog opens
      setLoadingBranches(true);
      setBranchError(null);
      getAllBranches()
        .then((branches) => {
          setAvailableBranches(branches || []);
        })
        .catch((error) => {
          console.error("Failed to fetch branches for form:", error);
          setBranchError("Failed to load branches. Please try again.");
          setAvailableBranches([]); // Ensure it's an array on error
        })
        .finally(() => {
          setLoadingBranches(false);
        });
    } else {
      // Optionally reset branches when dialog closes to refetch next time,
      // or keep them cached if they don't change often.
      // setAvailableBranches([]);
    }
  }, [open]); // Dependency array ensures this runs when 'open' changes

  const initialValues = {
    fullname: user?.fullname || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
    role: user?.role || '',
    branchId: user?.branchId || '', // Ensure this aligns with what user object provides
    status: user?.status || 'active',
  };

  // Adjusted Validation Schema
  const validationSchema = Yup.object().shape({
    fullname: Yup.string().when('$isEditing', (isEditingActual, schema) =>
      isEditingActual ? schema : schema.required('Full name is required')
    ),
    email: Yup.string().when('$isEditing', (isEditingActual, schema) =>
      isEditingActual ? schema.email('Invalid email address') : schema.email('Invalid email address').required('Email is required')
    ),
    password: Yup.string().when('$isEditing', (isEditingActual, schema) =>
      isEditingActual
        ? schema.min(8, 'Password must be at least 8 characters if changing') // Optional password change
        : schema.required('Password is required').min(8, 'Password must be at least 8 characters')
    ),
    confirmPassword: Yup.string().when(['isEditing', 'password'], ([isEditingActual, password], schema) => {
      if (!isEditingActual || (password && password.length > 0)) { // Required for new user or if password is being changed
        return schema
          .oneOf([Yup.ref('password'), null], 'Passwords must match')
          .required('Confirm password is required');
      }
      return schema;
    }),
    role: Yup.string().when('$isEditing', (isEditingActual, schema) =>
      isEditingActual ? schema : schema.required('Role is required')
    ),
    branchId: Yup.string().when(['isEditing', 'role'], ([isEditingActual, role], schema) => {
      if (!isEditingActual && role && role !== 'student' && role !== 'parent') {
        return schema.required('Branch is required for this role (create mode)');
      }
      // In edit mode, or for roles like student/parent, branchId is optional
      return schema;
    }),
    status: Yup.string().when('$isEditing', (isEditingActual, schema) =>
      isEditingActual ? schema : schema.required('Status is required')
    ),
  });


  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    let submissionValues = {};

    if (isEditing) {
      // For editing, explicitly build the payload with only editable fields that have changed.
      // `user` prop contains the initial state of the user being edited.
      // `values` contains the current state of the form.

      if (values.fullname !== user?.fullname) {
        submissionValues.fullname = values.fullname;
      }
      if (values.role !== user?.role) {
        submissionValues.role = values.role;
      }
      // For branchId, also consider if user.branchId was null/undefined vs empty string
      const initialBranchId = user?.branchId || "";
      if (values.branchId !== initialBranchId) {
        submissionValues.branchId = values.branchId;
      }
      if (values.status !== user?.status) {
        submissionValues.status = values.status;
      }
      // Email and Password are not part of the form in edit mode, so not included.
    } else { // Create mode
      submissionValues = { ...values }; // Send all form values for create
      delete submissionValues.confirmPassword; // Already validated by Yup
    }

    // Only proceed with API call if it's a create operation,
    // or if it's an edit operation and there are actual changes to submit.
    if (!isEditing || Object.keys(submissionValues).length > 0) {
      await onSubmit(submissionValues, isEditing, user?.id);
    } else if (isEditing && Object.keys(submissionValues).length === 0) {
      // No changes were made in edit mode.
      // Optionally, show a toast message or simply close the dialog.
      // For now, we'll call onClose(false) to indicate no refresh needed,
      // assuming `onSubmit` in parent handles UI feedback like closing dialog.
      // Or, the parent's `onSubmit` could be called with empty `submissionValues`
      // and the parent can decide to not make an API call.
      // Let's call onSubmit as the parent page's logic closes the dialog.
       await onSubmit(submissionValues, isEditing, user?.id); // This will call the parent's submit handler
    }

    setSubmitting(false);
    // resetForm(); // Consider if reset is needed or if parent handles it by closing/remounting.
    // onClose(); // Parent will call onClose with refresh status
  };


  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize // Important to reinitialize form when 'user' prop changes for editing
        context={{ isEditing }} // Pass isEditing to Yup context
      >
        {({ errors, touched, isSubmitting, values, handleChange, handleBlur, setFieldValue }) => (
          <Form>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="fullname"
                    value={values.fullname}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.fullname && Boolean(errors.fullname)}
                    helperText={touched.fullname && errors.fullname}
                    disabled={isSubmitting}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                    disabled={isSubmitting || isEditing} // Often email is not editable after creation
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={isEditing ? "New Password (optional)" : "Password"}
                    name="password"
                    type="password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.password && Boolean(errors.password)}
                    helperText={touched.password && errors.password}
                    disabled={isSubmitting}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                    helperText={touched.confirmPassword && errors.confirmPassword}
                    disabled={isSubmitting || !values.password} // Disable if password field is empty
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={touched.role && Boolean(errors.role)} disabled={isSubmitting}>
                    <InputLabel id="role-select-label">Role</InputLabel>
                    <Select
                      labelId="role-select-label"
                      id="role"
                      name="role"
                      value={values.role}
                      label="Role"
                      onChange={handleChange}
                      onBlur={handleBlur}
                    >
                      {/* Use availableRoles prop from parent */}
                      {(availableRoles || []).map((role) => (
                        <MenuItem key={role} value={role}>
                          <Chip label={role.charAt(0).toUpperCase() + role.slice(1)} size="small" />
                        </MenuItem>
                      ))}
                    </Select>
                    {touched.role && errors.role && <FormHelperText>{errors.role}</FormHelperText>}
                  </FormControl>
                </Grid>
                 <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={touched.branchId && Boolean(errors.branchId)} disabled={isSubmitting || loadingBranches}>
                    <InputLabel id="branch-select-label">Branch/Campus</InputLabel>
                    <Select
                      labelId="branch-select-label"
                      id="branchId"
                      name="branchId"
                      value={values.branchId}
                      label="Branch/Campus"
                      onChange={handleChange}
                      onBlur={handleBlur}
                    >
                      <MenuItem value="">
                        <em>{loadingBranches ? 'Loading...' : branchError ? 'Error loading' : 'None'}</em>
                      </MenuItem>
                      {/* Use availableBranches state populated from API */}
                      {availableBranches.map((branch) => (
                        // Assuming branch object has 'id' and 'address.city' for name
                        // Or 'name' directly if that's the case. Using address.city as per API example.
                        <MenuItem key={branch.id} value={branch.id}>
                          {branch.address?.city || branch.name || branch.id}
                        </MenuItem>
                      ))}
                    </Select>
                    {touched.branchId && errors.branchId && <FormHelperText>{errors.branchId}</FormHelperText>}
                    {branchError && !loadingBranches && <FormHelperText error>{branchError}</FormHelperText>}
                  </FormControl>
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
                            {/* <MenuItem value="suspended">Suspended</MenuItem> */}
                        </Select>
                        {touched.status && errors.status && <FormHelperText>{errors.status}</FormHelperText>}
                    </FormControl>
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
                {isSubmitting ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create User')}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

UserFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object, // Null for add, object for edit
  onSubmit: PropTypes.func.isRequired, // Function to handle actual form submission (API call)
};

export default UserFormDialog;
