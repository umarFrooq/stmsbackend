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
  Chip,
} from '@mui/material';
import { Formik, Form } from 'formik'; // Removed Field as it's not directly used
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { getAllBranches } from '../../services/branchService';

const UserFormDialog = ({ open, onClose, user, onSubmit, availableRoles = [] }) => {
  const isEditing = Boolean(user);

  // ... (state for branches remains the same) ...
  const [availableBranches, setAvailableBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchError, setBranchError] = useState(null);

  useEffect(() => {
    if (open) {
      setLoadingBranches(true);
      setBranchError(null);
      getAllBranches()
        .then((branches) => {
          setAvailableBranches(branches || []);
        })
        .catch((error) => {
          console.error("Failed to fetch branches for form:", error);
          setBranchError("Failed to load branches. Please try again.");
          setAvailableBranches([]);
        })
        .finally(() => {
          setLoadingBranches(false);
        });
    }
  }, [open]);


  const initialValues = {
    fullname: user?.fullname || '',
    email: user?.email || '', // Will be handled by conditional rendering
    password: '', // Will be handled by conditional rendering
    confirmPassword: '', // Will be handled by conditional rendering
    role: user?.role || '',
    branchId: user?.branchId || '',
    status: user?.status || 'active',
  };

  // Using the validation schema you provided in the last message
  // This schema makes fullname, role, branchId, status ALWAYS OPTIONAL 
  // Email & Password are required for CREATE.
  // For EDIT mode, password and confirmPassword are made explicitly optional as fields are hidden.
  const validationSchema = Yup.object().shape({
    fullname: Yup.string(), 
    email: Yup.string()
      .email('Invalid email address')
      .when('$isEditing', {
        is: false, 
        then: (schema) => schema.required('Email is required'),
        otherwise: (schema) => schema.optional(), 
      }),
    password: Yup.string().when('$isEditing', (isEditingValue, schema) => {
        if (isEditingValue) {
            // Field is not rendered in edit mode, so it should be optional.
            // Any minLength here would only apply if a value was programmatically set,
            // but since it's not in the form, it will be initialValue ('') or undefined.
            return schema.optional(); 
        }
        // Create mode:
        return schema.required('Password is required').min(8, 'Password must be at least 8 characters');
    }),
    confirmPassword: Yup.string().when('$isEditing', (isEditingValue, schema) => {
        if (isEditingValue) {
            // Field is not rendered in edit mode, so it should be optional.
            return schema.optional(); 
        }
        // Create mode (only then is it relevant):
        // Check actual password value (from `values.password` via Yup's context)
        return schema.when('password', (passwordAttempt, currentSchema) => {
            if (passwordAttempt && passwordAttempt.length > 0) {
                return currentSchema.oneOf([Yup.ref('password'), null], 'Passwords must match')
                                 .required('Confirm password is required');
            }
            // If password in create mode is empty (which it shouldn't be due to its own validation, but for robustness)
            // then confirmPassword is not strictly required to match an empty string.
            return currentSchema.optional(); 
        });
    }),
    role: Yup.string(), 
    branchId: Yup.string(), 
    status: Yup.string(), 
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    alert("DEBUG: UserFormDialog handleSubmit CALLED! isEditing: " + isEditing); // DEBUG ALERT
    console.log("UserFormDialog: Top of handleSubmit. isEditing:", isEditing, "Formik values:", JSON.stringify(values));
    console.log("UserFormDialog: handleSubmit - Original user prop:", JSON.stringify(user));

    let submissionPayload = {};

    if (isEditing) {
      console.log("UserFormDialog: Edit mode processing.");
      if (values.fullname !== user?.fullname) {
        submissionPayload.fullname = values.fullname;
        console.log("UserFormDialog: Fullname changed or set to:", values.fullname);
      }
      if (values.role !== user?.role) {
        submissionPayload.role = values.role;
        console.log("UserFormDialog: Role changed or set to:", values.role);
      }
      const initialBranchId = user?.branchId || '';
      if (values.branchId !== initialBranchId) {
        submissionPayload.branchId = values.branchId;
        console.log("UserFormDialog: BranchId changed or set to:", values.branchId);
      }
      if (values.status !== user?.status) {
        submissionPayload.status = values.status;
        console.log("UserFormDialog: Status changed or set to:", values.status);
      }
      // Email and Password fields are not rendered in edit mode.
      // Formik typically does not include values for fields that are not rendered,
      // so they shouldn't be in `values`.
    } else { // Create mode
      console.log("UserFormDialog: Create mode processing.");
      submissionPayload = { ...values };
      delete submissionPayload.confirmPassword;
    }

    console.log("UserFormDialog: Final submissionPayload for parent onSubmit:", JSON.stringify(submissionPayload));

    if (!isEditing || Object.keys(submissionPayload).length > 0) {
      console.log("UserFormDialog: Conditions met to call parent onSubmit. isEditing:", isEditing, "Payload length:", Object.keys(submissionPayload).length);
      await onSubmit(submissionPayload, isEditing, user?.id);
    } else { // isEditing && Object.keys(submissionPayload).length === 0
      console.log("UserFormDialog: Edit mode, but no changes detected. Calling parent onSubmit with empty payload.");
      await onSubmit({}, isEditing, user?.id); // Send empty object if no changes
    }

    setSubmitting(false);
    console.log("UserFormDialog: handleSubmit finished.");
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
        validateOnMount // DEBUG: Validate on mount
        context={{ isEditing }}
      >
        {({ errors, touched, isSubmitting, values, handleChange, handleBlur }) => {
          // DEBUG: Log Formik state on each render if dialog is open
          if (open) {
            // console.log("UserFormDialog RENDER - isEditing:", isEditing, "isValid:", isValid, "dirty:", dirty);
            // console.log("UserFormDialog RENDER - values:", JSON.stringify(values));
            // console.log("UserFormDialog RENDER - errors:", JSON.stringify(errors));
            // console.log("UserFormDialog RENDER - touched:", JSON.stringify(touched));
          }
          if (open && Object.keys(errors).length > 0 && (Object.keys(touched).length > 0 || isSubmitting) ) { // Log errors if form is touched/submitting and has errors
            console.error("UserFormDialog: Formik validation errors (touched/submitting):", JSON.stringify(errors));
          }
          return (
          <Form>
            <DialogContent dividers>
              {/* Grid container and fields */}
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

                {!isEditing && (
                  <>
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
                        disabled={isSubmitting}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Password"
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
                        disabled={isSubmitting || !values.password}
                      />
                    </Grid>
                  </>
                )}

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
                      {availableRoles.map((role) => (
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
                      {availableBranches.map((branch) => (
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
                      <MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                    {touched.status && errors.status && <FormHelperText>{errors.status}</FormHelperText>}
                  </FormControl>
                </Grid>
              </Grid>
              {/* TEMPORARY DEBUG DISPLAY */}
              {open && <pre style={{ fontSize: '10px', marginTop: '20px', border: '1px solid #ccc', padding: '10px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                DEBUG INFO (Dialog Open):{'\n'}
                Is Editing: {JSON.stringify(isEditing)}{'\n'}
                Formik Touched: {JSON.stringify(touched, null, 2)}{'\n'}
                Formik Errors: {JSON.stringify(errors, null, 2)}{'\n'}
                Formik Values: {JSON.stringify(values, null, 2)}
              </pre>}
            </DialogContent>

            <DialogActions sx={{ p: '16px 24px' }}>
              <Button onClick={() => onClose(false)} color="inherit" disabled={isSubmitting}>Cancel</Button>
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
        )}}
      </Formik>
    </Dialog>
  );
};

UserFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  availableRoles: PropTypes.arrayOf(PropTypes.string), // Added prop type for roles
};

export default UserFormDialog;
