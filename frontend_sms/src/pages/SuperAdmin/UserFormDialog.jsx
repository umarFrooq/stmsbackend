import React, { useState, useEffect } from 'react';
import { Modal, Button as BsButton, Spinner, Form as BsForm, Col, Row } from 'react-bootstrap';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
} from '@mui/material'; // Keep necessary MUI form components for now
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { getAllBranches } from '../../services/branchService';
import gradeService from '../../services/gradeService';
// import useAuthStore from '../../store/auth.store'; // Not used after currentUser removal
import styles from './UserFormDialog.module.css';

const UserFormDialog = ({ open, onClose, user, onSubmit, availableRoles = [] }) => {
  const isEditing = Boolean(user);
  // const { user: currentUser } = useAuthStore(); // currentUser was not used after refactor

  const [availableBranches, setAvailableBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchError, setBranchError] = useState(null);

  const [availableGrades, setAvailableGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [gradeError, setGradeError] = useState(null);

  const initialValues = {
    fullname: user?.fullname || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
    role: user?.role || '',
    branchId: user?.branchId?._id || user?.branchId || '',
    gradeId: user?.gradeId?._id || user?.gradeId || '',
    status: user?.status || 'active',
    cnic: user?.cnic || '',
  };

  // Effect for fetching branches - This runs when the dialog opens.
  useEffect(() => {
    if (open) {
      setLoadingBranches(true);
      setBranchError(null);
      getAllBranches()
        .then((response) => {
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

  // Effect for fetching grades initially when dialog opens if user is student
  useEffect(() => {
    if (open && user && user.role === 'student' && (user.branchId?._id || user.branchId)) {
      setLoadingGrades(true);
      setGradeError(null);
      const currentBranchId = user.branchId?._id || user.branchId;
      let params = { limit: 200, populate: 'branchId', branchId: currentBranchId };

      gradeService.getGrades(params)
        .then(response => setAvailableGrades(response.results || []))
        .catch(error => {
          console.error("Failed to load initial grades:", error); // Added console.error
          setGradeError("Failed to load initial grades.");
          setAvailableGrades([]);
        })
        .finally(() => setLoadingGrades(false));
    } else if (open) {
        // Clear grades if not a student or no branch on open
        setAvailableGrades([]);
        setLoadingGrades(false);
        setGradeError(null);
    }
  }, [open, user]);


  const validationSchema = Yup.object().shape({
    fullname: Yup.string().trim()
      .when('$isEditing', {
        is: false,
        then: (schema) => schema.required('Full name is required'),
        otherwise: (schema) => schema.optional(),
      }),
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
    role: Yup.string()
      .when('$isEditing', {
        is: false,
        then: (schema) => schema.required('Role is required'),
        otherwise: (schema) => schema.optional(),
      }),
    branchId: Yup.string()
      .when('$isEditing', {
        is: false,
        then: (schema) => schema.required('Branch/Campus is required'),
        otherwise: (schema) => schema.optional(),
      }),
    status: Yup.string()
      .when('$isEditing', {
        is: false,
        then: (schema) => schema.required('Status is required'),
        otherwise: (schema) => schema.optional(),
      }),
    gradeId: Yup.string().when(['$isEditing', 'role'], ([isEditingValue, roleValue], schema) => {
      if (roleValue === 'student') {
        return isEditingValue ? schema.nullable().optional() : schema.required('Grade is required for students.');
      }
      return schema.nullable().optional();
    }),
    cnic: Yup.string().trim().optional().nullable()
      .matches(/^[0-9+]{5}-[0-9+]{7}-[0-9]{1}$/, 'Invalid CNIC format. Expected: XXXXX-XXXXXXX-X')
      .test('is-valid-cnic-length', 'CNIC must be exactly 15 characters including hyphens', value => {
        if (!value) return true;
        return value.length === 15;
      }),
  });

  const handleSubmitFormik = async (values, { setSubmitting }) => {
    let submissionPayload = {};
    if (isEditing) {
      if (values.fullname !== user?.fullname) submissionPayload.fullname = values.fullname;
      if (values.role !== user?.role) submissionPayload.role = values.role;
      const initialBranchId = user?.branchId?._id || user?.branchId || '';
      if (values.branchId !== initialBranchId) submissionPayload.branchId = values.branchId;
      const initialGradeId = user?.gradeId?._id || user?.gradeId || '';
      if (values.gradeId !== initialGradeId) {
        submissionPayload.gradeId = values.gradeId ? values.gradeId : null;
      } else if (values.role !== 'student' && initialGradeId) {
        submissionPayload.gradeId = null;
      }
      if (values.status !== user?.status) submissionPayload.status = values.status;
      if (values.cnic !== (user?.cnic || null)) {
        submissionPayload.cnic = values.cnic || null;
      }
    } else {
      submissionPayload = { ...values };
      delete submissionPayload.confirmPassword;
      if (submissionPayload.role !== 'student') {
        delete submissionPayload.gradeId;
      }
      submissionPayload.cnic = values.cnic || null;
    }

    if (values.role !== 'student') {
        submissionPayload.gradeId = null;
    } else if (!values.gradeId && isEditing && user?.gradeId) {
        submissionPayload.gradeId = null;
    }
    if (Object.prototype.hasOwnProperty.call(submissionPayload, 'cnic') && submissionPayload.cnic === '') {
        submissionPayload.cnic = null;
    }

    if (!isEditing || Object.keys(submissionPayload).length > 0) {
      await onSubmit(submissionPayload, isEditing, user?.id);
    } else {
      await onSubmit({}, isEditing, user?.id);
    }
    setSubmitting(false);
  };

  // This function will be called by Formik's Select onChange for Role and Branch
  // to dynamically fetch grades.
  const fetchGradesForFormValues = async (formikRole, formikBranchId) => {
    if (formikRole === 'student' && formikBranchId) {
      setLoadingGrades(true);
      setGradeError(null);
      let params = { limit: 200, populate: 'branchId', branchId: formikBranchId };
      // Potentially add schoolScope if no branchId and creating new student
      // if (!params.branchId && currentUser?.schoolScope) {
      //   params.schoolId = currentUser.schoolScope;
      // }

      try {
        const response = await gradeService.getGrades(params);
        setAvailableGrades(response.results || []);
      } catch (error) {
        console.error("Failed to load grades for form values:", error); // Added console.error
        setGradeError("Failed to load grades for selection.");
        setAvailableGrades([]);
      } finally {
        setLoadingGrades(false);
      }
    } else {
      setAvailableGrades([]); // Clear grades if role is not student or no branch
      setLoadingGrades(false);
      setGradeError(null);
    }
  };


  return (
    <Modal show={open} onHide={() => onClose(false)} size="lg" backdrop={isEditing ? true : "static"} keyboard={!isEditing}>
      <Modal.Header closeButton>
        <Modal.Title>{isEditing ? 'Edit User' : 'Add New User'}</Modal.Title>
      </Modal.Header>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmitFormik}
        enableReinitialize
        context={{ isEditing }}
      >
        {({ errors, touched, isSubmitting, values, handleChange, handleBlur, setFieldValue, getFieldProps }) => (
            // Formik's Form component provides context
            <Form>
              <Modal.Body>
                <Row className="mb-3">
                  <BsForm.Group as={Col} xs={12} controlId="formFullname">
                    <BsForm.Label>Full Name <span className="text-danger">*</span></BsForm.Label>
                    <BsForm.Control
                      type="text"
                      {...getFieldProps('fullname')}
                      isInvalid={touched.fullname && !!errors.fullname}
                      disabled={isSubmitting}
                    />
                    <BsForm.Control.Feedback type="invalid">
                      {errors.fullname}
                    </BsForm.Control.Feedback>
                  </BsForm.Group>
                </Row>

                {!isEditing && (
                  <>
                    <Row className="mb-3">
                      <BsForm.Group as={Col} xs={12} controlId="formEmail">
                        <BsForm.Label>Email Address <span className="text-danger">*</span></BsForm.Label>
                        <BsForm.Control
                          type="email"
                          {...getFieldProps('email')}
                          isInvalid={touched.email && !!errors.email}
                          disabled={isSubmitting}
                        />
                        <BsForm.Control.Feedback type="invalid">
                          {errors.email}
                        </BsForm.Control.Feedback>
                      </BsForm.Group>
                    </Row>
                    <Row className="mb-3">
                      <BsForm.Group as={Col} xs={12} sm={6} controlId="formPassword">
                        <BsForm.Label>Password <span className="text-danger">*</span></BsForm.Label>
                        <BsForm.Control
                          type="password"
                          {...getFieldProps('password')}
                          isInvalid={touched.password && !!errors.password}
                          disabled={isSubmitting}
                        />
                        <BsForm.Control.Feedback type="invalid">
                          {errors.password}
                        </BsForm.Control.Feedback>
                      </BsForm.Group>
                      <BsForm.Group as={Col} xs={12} sm={6} controlId="formConfirmPassword">
                        <BsForm.Label>Confirm Password <span className="text-danger">*</span></BsForm.Label>
                        <BsForm.Control
                          type="password"
                          {...getFieldProps('confirmPassword')}
                          isInvalid={touched.confirmPassword && !!errors.confirmPassword}
                          disabled={isSubmitting || !values.password}
                        />
                        <BsForm.Control.Feedback type="invalid">
                          {errors.confirmPassword}
                        </BsForm.Control.Feedback>
                      </BsForm.Group>
                    </Row>
                  </>
                )}

                <Grid container spacing={3}> {/* Still using MUI Grid for these selects */}
                  <Grid item xs={12} sm={values.role === 'student' ? 4 : 6}>
                    <FormControl fullWidth error={touched.role && Boolean(errors.role)} disabled={isSubmitting}>
                      <InputLabel id="role-select-label" required>Role</InputLabel>
                      <Select
                        labelId="role-select-label" name="role" value={values.role} label="Role"
                        onChange={(e) => {
                            handleChange(e); // Formik's default handler
                            const newRole = e.target.value;
                            if (values.role === 'student' && newRole !== 'student') {
                                setFieldValue('gradeId', ''); // Clear grade
                            }
                            fetchGradesForFormValues(newRole, values.branchId); // Fetch grades based on new role and current branch
                        }}
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

                 <Grid item xs={12} sm={values.role === 'student' ? 4 : 6}>
                    <FormControl fullWidth error={touched.branchId && Boolean(errors.branchId)} disabled={isSubmitting || loadingBranches}>
                      <InputLabel id="branch-select-label" required>Branch/Campus</InputLabel>
                      <Select
                        labelId="branch-select-label" name="branchId" value={values.branchId} label="Branch/Campus"
                        onChange={(e) => {
                            handleChange(e); // Formik's default handler
                            fetchGradesForFormValues(values.role, e.target.value); // Fetch grades based on current role and new branch
                        }}
                        onBlur={handleBlur} required
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

                  <Grid item xs={12} sm={values.role === 'student' ? 6 : 6}>
                    <BsForm.Group controlId="formCnic">
                        <BsForm.Label>CNIC (e.g., 12345-1234567-1)</BsForm.Label>
                        <BsForm.Control
                          type="text"
                          {...getFieldProps('cnic')}
                          isInvalid={touched.cnic && !!errors.cnic}
                          disabled={isSubmitting}
                          maxLength={15}
                        />
                        <BsForm.Control.Feedback type="invalid">
                          {errors.cnic}
                        </BsForm.Control.Feedback>
                      </BsForm.Group>
                  </Grid>

                  {values.role === 'student' && (
                    <Grid item xs={12} sm={6}>
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
                  <Grid item xs={12} sm={values.role === 'student' ? 12 : 6}>
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
              </Modal.Body>
              <Modal.Footer className={styles.dialogFooter}>
                <BsButton variant="outline-secondary" onClick={() => onClose(false)} disabled={isSubmitting}>
                  Cancel
                </BsButton>
                <BsButton
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting || loadingBranches || loadingGrades}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/>
                      <span style={{ marginLeft: '5px' }}>{isEditing ? 'Saving...' : 'Creating...'}</span>
                    </>
                  ) : (isEditing ? 'Save Changes' : 'Create User')}
                </BsButton>
              </Modal.Footer>
            </Form>
        )}
      </Formik>
    </Modal>
  );
};

UserFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  availableRoles: PropTypes.arrayOf(PropTypes.string),
};

export default UserFormDialog;
