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
import gradeService from '../../services/gradeService'; // Import grade service
import useAuthStore from '../../store/auth.store'; // To get current user/school context

const UserFormDialog = ({ open, onClose, user, onSubmit, availableRoles = [] }) => {
  const isEditing = Boolean(user);
  const { user: currentUser } = useAuthStore(); // Get current logged-in user for schoolId if needed

  const [availableBranches, setAvailableBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchError, setBranchError] = useState(null);

  const [availableGrades, setAvailableGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [gradeError, setGradeError] = useState(null);

  // Moved initialValues declaration before useEffect hooks that might depend on it indirectly or directly.
  const initialValues = {
    fullname: user?.fullname || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
    role: user?.role || '',
    branchId: user?.branchId?._id || user?.branchId || '', // Handle populated vs direct ID for branch
    gradeId: user?.gradeId?._id || user?.gradeId || '', // Handle populated vs direct ID for grade
    status: user?.status || 'active',
  };

  // Effect for fetching branches
  useEffect(() => {
    if (open) {
      setLoadingBranches(true);
      setBranchError(null);
      getAllBranches() // This should ideally be scoped by school if not already
        .then((response) => { // Renamed to 'response' for clarity
          setAvailableBranches(response && response.results ? response.results : []);
        })
        .catch((error) => {
          console.error("Failed to fetch branches for user form:", error);
          setBranchError("Failed to load branches.");
          setAvailableBranches([]);
        })
        .finally(() => {
          setLoadingBranches(false);
        });
    }
  }, [open]);

  // Effect for fetching grades when role is student or form is open with a student user
  // Also re-fetch if selected branch changes and role is student
  useEffect(() => {
    const shouldFetchGrades = open && (
      (user?.role === 'student') || // Editing a student
      (initialValues.role === 'student') // Creating a student (initialValues.role might change via form interaction)
    );

    if (shouldFetchGrades) {
      setLoadingGrades(true);
      setGradeError(null);

      let params = { limit: 200, populate: 'branchId' }; // Fetch many, populate branch
      // Scoping:
      // 1. If a branchId is selected in the form, filter grades by that branch.
      // 2. If no branchId, but editing a user with a branchId, use that.
      // 3. Fallback to currentUser's schoolScope if available (especially for creating new student before branch selection)
      const formBranchId = initialValues.branchId; // This will be Formik's current value for branchId
      const userBranchId = user?.branchId;

      if (formBranchId) {
        params.branchId = formBranchId;
      } else if (userBranchId && isEditing) {
         // If editing a user who already has a branch, and form's branchId hasn't been set/changed yet
        params.branchId = typeof userBranchId === 'object' ? userBranchId._id : userBranchId;
      }

      // If no branchId is determined yet, we might need to filter by schoolId for broader selection
      // This is important if admin creates student, selects role, then branch, then grade.
      // Or, if admin edits a student and changes their branch.
      if (!params.branchId && currentUser?.schoolScope) {
        params.schoolId = currentUser.schoolScope;
      }
      // If user is rootUser and a school context is active (e.g. from a higher level component), use that.
      // This part depends on how `currentSchoolId` is passed or determined for root users.
      // For now, relying on branchId or general schoolScope from logged-in admin/superadmin.

      if (params.branchId || params.schoolId) { // Only fetch if we have a scope
        gradeService.getGrades(params)
          .then(response => {
            setAvailableGrades(response.results || []);
          })
          .catch(error => {
            console.error("Failed to fetch grades for user form:", error);
            setGradeError("Failed to load grades.");
            setAvailableGrades([]);
          })
          .finally(() => {
            setLoadingGrades(false);
          });
      } else {
        setAvailableGrades([]); // Clear grades if no branch/school scope
        setLoadingGrades(false);
        // Optionally set a message like "Select a branch to see grades"
      }
    } else if (open) { // If form is open but role is not student, clear grades
      setAvailableGrades([]);
      setLoadingGrades(false);
      setGradeError(null);
    }
  // The problematic useEffect was the one for fetching grades, which depended on initialValues.role and initialValues.branchId.
  // By moving initialValues above all useEffects, this specific ReferenceError should be resolved.
  // The Formik component itself will also use these initialValues when it mounts.
  }, [open, user?.role, initialValues.role, initialValues.branchId, isEditing, user?.branchId, currentUser?.schoolScope]);

  const validationSchema = Yup.object().shape({
    fullname: Yup.string().trim().required('Full name is required'),
    email: Yup.string()
      .email('Invalid email address')
      .when('$isEditing', {
        is: false,
        then: (schema) => schema.required('Email is required'),
        otherwise: (schema) => schema.optional(),
      }),
    password: Yup.string().when('$isEditing', (isEditingValue, schema) => {
      if (isEditingValue) return schema.optional();
      return schema.required('Password is required').min(8, 'Password must be at least 8 characters');
    }),
    confirmPassword: Yup.string().when('$isEditing', (isEditingValue, schema) => {
      if (isEditingValue) return schema.optional();
      return schema.when('password', (passwordAttempt, currentSchema) => {
        if (passwordAttempt && passwordAttempt.length > 0) {
          return currentSchema.oneOf([Yup.ref('password'), null], 'Passwords must match')
            .required('Confirm password is required');
        }
        return currentSchema.optional();
      });
    }),
    role: Yup.string().required('Role is required'),
    branchId: Yup.string().when('role', (role, schema) => {
      // Branch might be optional for superAdmin, but required for others like admin, teacher, student
      // For simplicity, let's make it generally required if role is not superAdmin (adjust as needed)
      // Or, make it always required if your system mandates a branch for all non-superAdmin users.
      // if (Array.isArray(role) && role.includes('superAdmin')) return schema.optional();
      return schema.required('Branch/Campus is required');
    }),
    status: Yup.string().required('Status is required'),
    gradeId: Yup.string().when('role', {
      is: 'student',
      then: (schema) => schema.required('Grade is required for students.'),
      otherwise: (schema) => schema.nullable().optional(), // Optional and can be null if not student
    }),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    let submissionPayload = {};

    if (isEditing) {
      // Only include fields that have changed or are always necessary
      if (values.fullname !== user?.fullname) submissionPayload.fullname = values.fullname;
      if (values.role !== user?.role) submissionPayload.role = values.role;

      const initialBranchId = user?.branchId?._id || user?.branchId || '';
      if (values.branchId !== initialBranchId) submissionPayload.branchId = values.branchId;

      const initialGradeId = user?.gradeId?._id || user?.gradeId || '';
      if (values.gradeId !== initialGradeId) {
        submissionPayload.gradeId = values.gradeId ? values.gradeId : null; // Send null if cleared
      } else if (values.role !== 'student' && initialGradeId) {
        // If role changed from student to something else, and there was a grade, clear it
        submissionPayload.gradeId = null;
      }


      if (values.status !== user?.status) submissionPayload.status = values.status;
      // Password and email are not changed in edit mode via this form typically
    } else { // Create mode
      submissionPayload = { ...values };
      delete submissionPayload.confirmPassword;
      if (submissionPayload.role !== 'student') {
        delete submissionPayload.gradeId; // Remove gradeId if not a student
      }
    }

    // Ensure gradeId is not sent if role is not student, or set to null if it was cleared
    if (values.role !== 'student') {
        submissionPayload.gradeId = null; // Explicitly nullify if not student
    } else if (!values.gradeId && isEditing && user?.gradeId) {
        submissionPayload.gradeId = null; // Student's grade was cleared
    }


    if (!isEditing || Object.keys(submissionPayload).length > 0) {
      await onSubmit(submissionPayload, isEditing, user?.id);
    } else {
      // If editing and no actual changes, we can skip the API call or inform the user.
      // For now, we call onSubmit which might then decide (e.g., show "no changes" toast from parent).
      await onSubmit({}, isEditing, user?.id); // Send empty object if no changes
    }

    setSubmitting(false);
  };


  // This function will run when Formik's values.role changes.
  // It's used to clear gradeId if the role is changed from 'student' to something else.
  const handleRoleChange = (event, formikHandleChange, setFieldValue, currentValues) => {
    const newRole = event.target.value;
    formikHandleChange(event); // Propagate change to Formik

    if (currentValues.role === 'student' && newRole !== 'student') {
      setFieldValue('gradeId', ''); // Clear grade if role changes away from student
      setAvailableGrades([]); // Clear grade dropdown options
    }
    // Update initialValues.role to trigger re-fetch of grades if newRole is 'student'
    // This is a bit of a hack; ideally, the useEffect for grades would depend on formik.values.role
    // For now, the existing useEffect for grades depends on `initialValues.role` which is based on `user.role`
    // or `''`. A better approach might be to pass `formik.values.role` to that useEffect.
    // Let's try updating initialValues.role directly in formik's state for now.
    // No, initialValues should not be mutated. We need to make the useEffect for grades
    // dependent on `formik.values.role`.
    // The current useEffect for grades already depends on `initialValues.role` which is based on `user.role` or `''`.
    // Let's refine the `useEffect` for fetching grades to depend on `values.role` from Formik.
  };


  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize // Important for initialValues to update when 'user' prop changes
        context={{ isEditing }} // Pass isEditing to Yup context if needed
      >
        {({ errors, touched, isSubmitting, values, handleChange, handleBlur, setFieldValue }) => {
          // Re-fetch grades if role or branch changes
          useEffect(() => {
            const shouldFetchGrades = open && values.role === 'student';
            if (shouldFetchGrades) {
              setLoadingGrades(true);
              setGradeError(null);
              let params = { limit: 200, populate: 'branchId' };
              if (values.branchId) {
                params.branchId = values.branchId;
              } else if (currentUser?.schoolScope) {
                params.schoolId = currentUser.schoolScope;
              }

              if (params.branchId || params.schoolId) {
                gradeService.getGrades(params)
                  .then(response => setAvailableGrades(response.results || []))
                  .catch(error => {
                    setGradeError("Failed to load grades.");
                    setAvailableGrades([]);
                  })
                  .finally(() => setLoadingGrades(false));
              } else {
                setAvailableGrades([]);
                setLoadingGrades(false);
              }
            } else if (open) {
              setAvailableGrades([]);
              setLoadingGrades(false);
              setGradeError(null);
            }
          }, [open, values.role, values.branchId, currentUser?.schoolScope]);

          return (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={3}>
                  {/* Full Name */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth label="Full Name" name="fullname"
                      value={values.fullname} onChange={handleChange} onBlur={handleBlur}
                      error={touched.fullname && Boolean(errors.fullname)}
                      helperText={touched.fullname && errors.fullname}
                      disabled={isSubmitting} required
                    />
                  </Grid>

                  {/* Email, Password, Confirm Password - only for create mode */}
                  {!isEditing && (
                    <>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth label="Email Address" name="email" type="email"
                          value={values.email} onChange={handleChange} onBlur={handleBlur}
                          error={touched.email && Boolean(errors.email)}
                          helperText={touched.email && errors.email}
                          disabled={isSubmitting} required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth label="Password" name="password" type="password"
                          value={values.password} onChange={handleChange} onBlur={handleBlur}
                          error={touched.password && Boolean(errors.password)}
                          helperText={touched.password && errors.password}
                          disabled={isSubmitting} required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth label="Confirm Password" name="confirmPassword" type="password"
                          value={values.confirmPassword} onChange={handleChange} onBlur={handleBlur}
                          error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                          helperText={touched.confirmPassword && errors.confirmPassword}
                          disabled={isSubmitting || !values.password} required
                        />
                      </Grid>
                    </>
                  )}

                  {/* Role */}
                  <Grid item xs={12} sm={values.role === 'student' ? 4 : 6}>
                    <FormControl fullWidth error={touched.role && Boolean(errors.role)} disabled={isSubmitting}>
                      <InputLabel id="role-select-label" required>Role</InputLabel>
                      <Select
                        labelId="role-select-label" name="role" value={values.role} label="Role"
                        onChange={(e) => handleRoleChange(e, handleChange, setFieldValue, values)}
                        onBlur={handleBlur} required
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

                  {/* Branch */}
                 <Grid item xs={12} sm={values.role === 'student' ? 4 : 6}>
                    <FormControl fullWidth error={touched.branchId && Boolean(errors.branchId)} disabled={isSubmitting || loadingBranches}>
                      <InputLabel id="branch-select-label" required>Branch/Campus</InputLabel>
                      <Select
                        labelId="branch-select-label" name="branchId" value={values.branchId} label="Branch/Campus"
                        onChange={handleChange} onBlur={handleBlur} required
                      >
                        <MenuItem value=""><em>{loadingBranches ? 'Loading...' : branchError ? 'Error loading' : 'Select Branch'}</em></MenuItem>
                        {availableBranches.map((branch) => (
                          <MenuItem key={branch.id} value={branch.id}>{branch.name || branch.id}</MenuItem>
                        ))}
                      </Select>
                      {touched.branchId && errors.branchId && <FormHelperText>{errors.branchId}</FormHelperText>}
                      {branchError && !loadingBranches && <FormHelperText error>{branchError}</FormHelperText>}
                    </FormControl>
                  </Grid>

                  {/* Grade Dropdown - only if role is student */}
                  {values.role === 'student' && (
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth error={touched.gradeId && Boolean(errors.gradeId)} disabled={isSubmitting || loadingGrades || !values.branchId}>
                        <InputLabel id="grade-select-label" required>Grade</InputLabel>
                        <Select
                          labelId="grade-select-label" name="gradeId" value={values.gradeId} label="Grade"
                          onChange={handleChange} onBlur={handleBlur} required
                        >
                          <MenuItem value="">
                            <em>{loadingGrades ? 'Loading...' : gradeError ? 'Error loading grades' : (!values.branchId && !availableGrades.length ? 'Select Branch first' : 'Select Grade')}</em>
                          </MenuItem>
                          {availableGrades.map((grade) => (
                            <MenuItem key={grade.id} value={grade.id}>
                              {grade.title} {grade.levelCode && `(${grade.levelCode})`}
                            </MenuItem>
                          ))}
                        </Select>
                        {touched.gradeId && errors.gradeId && <FormHelperText>{errors.gradeId}</FormHelperText>}
                        {gradeError && !loadingGrades && <FormHelperText error>{gradeError}</FormHelperText>}
                        {!values.branchId && !availableGrades.length && !loadingGrades && <FormHelperText>Please select a branch to see available grades.</FormHelperText>}
                      </FormControl>
                    </Grid>
                  )}

                  {/* Status */}
                  {/* Status */}
                  <Grid item xs={12} sm={values.role === 'student' ? 12 : 6}> {/* Full width if student, else half. Or always sm={6} if Grade takes the other half */}
                     <FormControl fullWidth error={touched.status && Boolean(errors.status)} disabled={isSubmitting}>
                        <InputLabel id="status-select-label" required>Status</InputLabel>
                        <Select
                          labelId="status-select-label" name="status" value={values.status} label="Status"
                          onChange={handleChange} onBlur={handleBlur} required
                        >
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                        </Select>
                        {touched.status && errors.status && <FormHelperText>{errors.status}</FormHelperText>}
                      </FormControl>
                  </Grid>

                </Grid>
              </DialogContent>

              <DialogActions sx={{ p: '16px 24px' }}>
                <Button onClick={() => onClose(false)} color="inherit" disabled={isSubmitting}>Cancel</Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting || loadingBranches || loadingGrades}
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
