import React, { useState, useEffect } from 'react';
import { Modal, Button as BsButton, Spinner, Form as BsForm, Col, Row } from 'react-bootstrap';
// Removed MUI Select related imports, Chip. Kept Grid for now if any part is missed, but aim to remove.
// import { Grid } from '@mui/material'; // Will be fully replaced by Row/Col
import { Formik, Form } from 'formik'; // Formik's Form
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { getAllBranches } from '../../services/branchService';
import gradeService from '../../services/gradeService';
// import useAuthStore from '../../store/auth.store'; // Not used
import styles from './UserFormDialog.module.css';

const UserFormDialog = ({ open, onClose, user, onSubmit, availableRoles = [] }) => {
  const isEditing = Boolean(user);
  // const { user: currentUser } = useAuthStore(); // Not used

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

  useEffect(() => {
    if (open && user && user.role === 'student' && (user.branchId?._id || user.branchId)) {
      setLoadingGrades(true);
      setGradeError(null);
      const currentBranchId = user.branchId?._id || user.branchId;
      let params = { limit: 200, populate: 'branchId', branchId: currentBranchId };

      gradeService.getGrades(params)
        .then(response => setAvailableGrades(response.results || []))
        .catch(error => {
          console.error("Failed to load initial grades:", error);
          setGradeError("Failed to load initial grades.");
          setAvailableGrades([]);
        })
        .finally(() => setLoadingGrades(false));
    } else if (open) {
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

  const fetchGradesForFormValues = async (formikRole, formikBranchId) => {
    if (formikRole === 'student' && formikBranchId) {
      setLoadingGrades(true);
      setGradeError(null);
      let params = { limit: 200, populate: 'branchId', branchId: formikBranchId };
      try {
        const response = await gradeService.getGrades(params);
        setAvailableGrades(response.results || []);
      } catch (error) {
        console.error("Failed to load grades for form values:", error);
        setGradeError("Failed to load grades for selection.");
        setAvailableGrades([]);
      } finally {
        setLoadingGrades(false);
      }
    } else {
      setAvailableGrades([]);
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
        {({ errors, touched, isSubmitting, values, handleChange, setFieldValue, getFieldProps }) => ( // Removed handleBlur
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

                <Row className="mb-3">
                  <BsForm.Group as={Col} xs={12} sm={values.role === 'student' ? 4 : 6} controlId="formRole">
                    <BsForm.Label>Role <span className="text-danger">*</span></BsForm.Label>
                    <BsForm.Select
                      {...getFieldProps('role')}
                      isInvalid={touched.role && !!errors.role}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        handleChange(e); // Formik's default handler
                        const newRole = e.target.value;
                        if (values.role === 'student' && newRole !== 'student') {
                            setFieldValue('gradeId', '');
                        }
                        fetchGradesForFormValues(newRole, values.branchId);
                      }}
                    >
                      <option value="">Select Role</option>
                      {availableRoles.map((role) => (
                        <option key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </BsForm.Select>
                    <BsForm.Control.Feedback type="invalid">
                      {errors.role}
                    </BsForm.Control.Feedback>
                  </BsForm.Group>

                  <BsForm.Group as={Col} xs={12} sm={values.role === 'student' ? 4 : 6} controlId="formBranch">
                    <BsForm.Label>Branch/Campus <span className="text-danger">*</span></BsForm.Label>
                    <BsForm.Select
                      {...getFieldProps('branchId')}
                      isInvalid={touched.branchId && !!errors.branchId}
                      disabled={isSubmitting || loadingBranches}
                      onChange={(e) => {
                        handleChange(e);
                        fetchGradesForFormValues(values.role, e.target.value);
                      }}
                    >
                      <option value="">{loadingBranches ? 'Loading...' : branchError ? 'Error loading' : 'Select Branch'}</option>
                      {availableBranches.map((branch) => (
                        <option key={branch.id} value={branch.id}>{branch.name || branch.id}</option>
                      ))}
                    </BsForm.Select>
                    <BsForm.Control.Feedback type="invalid">
                      {errors.branchId}
                    </BsForm.Control.Feedback>
                    {branchError && !loadingBranches && <BsForm.Text muted className="text-danger">{branchError}</BsForm.Text>}
                  </BsForm.Group>

                  {values.role === 'student' && (
                     <BsForm.Group as={Col} xs={12} sm={4} controlId="formGrade">
                        <BsForm.Label>Grade <span className="text-danger">*</span></BsForm.Label>
                        <BsForm.Select
                          {...getFieldProps('gradeId')}
                          isInvalid={touched.gradeId && !!errors.gradeId}
                          disabled={isSubmitting || loadingGrades || !values.branchId}
                        >
                          <option value="">
                            {loadingGrades ? 'Loading...' : gradeError ? 'Error loading grades' : (!values.branchId && !availableGrades.length ? 'Select Branch first' : 'Select Grade')}
                          </option>
                          {availableGrades.map((grade) => (
                            <option key={grade.id} value={grade.id}>
                              {grade.title} {grade.levelCode && `(${grade.levelCode})`}
                            </option>
                          ))}
                        </BsForm.Select>
                        <BsForm.Control.Feedback type="invalid">
                          {errors.gradeId}
                        </BsForm.Control.Feedback>
                        {gradeError && !loadingGrades && <BsForm.Text muted className="text-danger">{gradeError}</BsForm.Text>}
                        {!values.branchId && !availableGrades.length && !loadingGrades && values.role === 'student' && <BsForm.Text muted>Please select a branch to see available grades.</BsForm.Text>}
                     </BsForm.Group>
                  )}
                </Row>

                <Row className="mb-3">
                    <BsForm.Group as={Col} xs={12} sm={6} controlId="formCnic">
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

                    <BsForm.Group as={Col} xs={12} sm={6} controlId="formStatus">
                        <BsForm.Label>Status <span className="text-danger">*</span></BsForm.Label>
                        <BsForm.Select
                          {...getFieldProps('status')}
                          isInvalid={touched.status && !!errors.status}
                          disabled={isSubmitting}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </BsForm.Select>
                        <BsForm.Control.Feedback type="invalid">
                          {errors.status}
                        </BsForm.Control.Feedback>
                    </BsForm.Group>
                </Row>

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
