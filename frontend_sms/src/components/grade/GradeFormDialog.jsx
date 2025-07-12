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
  Autocomplete,
} from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import PropTypes from 'prop-types';

import { branchService, gradeService } from '../../services';

const GradeFormDialog = ({ open, onClose, grade, onSubmit, currentSchoolId }) => {
  const isEditing = Boolean(grade);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchError, setBranchError] = useState(null);

  const [availableNextGrades, setAvailableNextGrades] = useState([]);
  const [loadingNextGrades, setLoadingNextGrades] = useState(false);
  const [nextGradeError, setNextGradeError] = useState(null);

  useEffect(() => {
    if (open) {
      // Fetch Branches
      setLoadingBranches(true);
      setBranchError(null);
      branchService.getAllBranches() // Assuming this fetches branches relevant to the current user/school context
        .then((branches) => {
          setAvailableBranches(branches || []);
        })
        .catch((error) => {
          console.error("Failed to fetch branches for grade form:", error);
          setBranchError("Failed to load branches.");
          setAvailableBranches([]);
        })
        .finally(() => {
          setLoadingBranches(false);
        });

      // Fetch Grades for 'Next Grade' dropdown
      setLoadingNextGrades(true);
      setNextGradeError(null);
      // Pass currentSchoolId if available, backend service for getGrades should handle scoping
      const gradeParams = currentSchoolId ? { schoolId: currentSchoolId, limit: 200 } : { limit: 200 };
      gradeService.getGrades(gradeParams)
        .then((response) => {
          // Filter out the current grade being edited from the list of next possible grades
          const filteredGrades = response.results.filter(g => g.id !== grade?.id);
          setAvailableNextGrades(filteredGrades || []);
        })
        .catch((error) => {
          console.error("Failed to fetch grades for 'Next Grade' dropdown:", error);
          setNextGradeError("Failed to load other grades.");
          setAvailableNextGrades([]);
        })
        .finally(() => {
          setLoadingNextGrades(false);
        });
    }
  }, [open, currentSchoolId, grade?.id]);

  const initialValues = {
    title: grade?.title || '',
    levelCode: grade?.levelCode || '',
    description: grade?.description || '',
    branchId: grade?.branchId?._id || grade?.branchId || '', // Handle populated vs direct ID
    sections: Array.isArray(grade?.sections) ? grade.sections.join(', ') : '', // Stored as array, edited as CSV
    nextGradeId: grade?.nextGradeId?._id || grade?.nextGradeId || '',
  };

  const validationSchema = Yup.object().shape({
    title: Yup.string().trim().required('Title is required'),
    levelCode: Yup.string().trim().optional(),
    description: Yup.string().trim().optional(),
    branchId: Yup.string().required('Branch is required'),
    sections: Yup.string().optional().test(
        'is-valid-sections',
        'Sections must be comma-separated values without special characters other than space, hyphen, or underscore within a section name.',
        (value) => {
            if (!value) return true; // Optional field
            // Regex to match valid section names (alphanumeric, space, hyphen, underscore) separated by commas
            // Allows sections like "Section A", "Morning_Shift", "Grade1-Blue"
            const sectionRegex = /^[a-zA-Z0-9\s\-_]+(?:,\s*[a-zA-Z0-9\s\-_]+)*$/;
            return sectionRegex.test(value.trim());
        }
    ),
    nextGradeId: Yup.string().nullable().optional(),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    const sectionsArray = values.sections ? values.sections.split(',').map(s => s.trim().toUpperCase()).filter(s => s) : [];
    const payload = {
      ...values,
      sections: sectionsArray,
    };
    if (!payload.nextGradeId) { // Ensure null is sent if empty, not an empty string
        payload.nextGradeId = null;
    }

    // If the user is a rootUser, they might need to specify the schoolId for creation.
    // This dialog assumes schoolId is handled by the calling component (GradeManagementPage)
    // or implicitly by the backend for non-root users.
    // If `currentSchoolId` is available and user is root, it might need to be added to payload.
    // For now, let's assume the `onSubmit` prop handles adding `schoolIdForGrade` if needed.

    await onSubmit(payload, isEditing, grade?.id);
    setSubmitting(false);
    // onClose will be called by the parent component after successful submission
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>{isEditing ? 'Edit Grade' : 'Add New Grade'}</DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ errors, touched, isSubmitting, values, handleChange, handleBlur, setFieldValue }) => (
          <Form>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Grade Title"
                    name="title"
                    value={values.title}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.title && Boolean(errors.title)}
                    helperText={touched.title && errors.title}
                    disabled={isSubmitting}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Level Code (Optional)"
                    name="levelCode"
                    value={values.levelCode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.levelCode && Boolean(errors.levelCode)}
                    helperText={touched.levelCode && errors.levelCode}
                    disabled={isSubmitting}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description (Optional)"
                    name="description"
                    value={values.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    multiline
                    rows={2}
                    error={touched.description && Boolean(errors.description)}
                    helperText={touched.description && errors.description}
                    disabled={isSubmitting}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={touched.branchId && Boolean(errors.branchId)} disabled={isSubmitting || loadingBranches}>
                    <InputLabel id="branch-select-label" required>Branch/Campus</InputLabel>
                    <Select
                      labelId="branch-select-label"
                      name="branchId"
                      value={values.branchId}
                      label="Branch/Campus"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                    >
                      <MenuItem value="">
                        <em>{loadingBranches ? 'Loading...' : branchError ? 'Error loading' : 'Select Branch'}</em>
                      </MenuItem>
                      {availableBranches.map((branch) => (
                        <MenuItem key={branch.id || branch._id} value={branch.id || branch._id}>
                          {branch.name} ({branch.address?.city || 'N/A'})
                        </MenuItem>
                      ))}
                    </Select>
                    {(touched.branchId && errors.branchId) && <FormHelperText>{errors.branchId}</FormHelperText>}
                    {branchError && !loadingBranches && <FormHelperText error>{branchError}</FormHelperText>}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <Autocomplete
                        options={availableNextGrades}
                        getOptionLabel={(option) => option.title || ''}
                        value={availableNextGrades.find(g => g.id === values.nextGradeId) || null}
                        onChange={(event, newValue) => {
                            setFieldValue('nextGradeId', newValue ? newValue.id : '');
                        }}
                        loading={loadingNextGrades}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Next Grade (Optional)"
                                name="nextGradeId"
                                error={touched.nextGradeId && Boolean(errors.nextGradeId)}
                                helperText={(touched.nextGradeId && errors.nextGradeId) || nextGradeError}
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                    <>
                                        {loadingNextGrades ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                    ),
                                }}
                            />
                        )}
                        renderOption={(props, option) => (
                            <Box component="li" {...props} key={option.id}>
                                {option.title} {option.levelCode && `(${option.levelCode})`} - {option.branchId?.name || 'Unknown Branch'}
                            </Box>
                        )}
                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                        disabled={isSubmitting || loadingNextGrades}
                    />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Sections (Comma-separated, e.g., A, B, Morning)"
                    name="sections"
                    value={values.sections}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.sections && Boolean(errors.sections)}
                    helperText={touched.sections && errors.sections}
                    disabled={isSubmitting}
                    placeholder="e.g., Section A, Section B, Blue Group"
                  />
                   <FormHelperText>
                    Enter section names separated by commas. Sections will be stored in uppercase.
                  </FormHelperText>
                </Grid>

              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: '16px 24px' }}>
              <Button onClick={() => onClose(false)} color="inherit" disabled={isSubmitting}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting || loadingBranches || loadingNextGrades}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {isSubmitting ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Grade')}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

GradeFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  grade: PropTypes.object, // Grade object for editing, null for creating
  currentSchoolId: PropTypes.string, // Current school context, useful for fetching related data like 'Next Grade' for root users
};

export default GradeFormDialog;
