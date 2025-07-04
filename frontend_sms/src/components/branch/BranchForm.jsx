import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { TextField, Button, Grid, MenuItem, Paper, Typography, Box } from '@mui/material';

// Updated branch types based on user feedback
const branchTypes = [
  { value: 'main', label: 'main' },
  { value: 'sub', label: 'sub' },
];

// Yup validation schema based on Joi
const validationSchema = Yup.object().shape({
  name: Yup.string().trim().required('Branch name is required'), // Assuming name is required
  address: Yup.object().shape({
    street: Yup.string().required('Street is required'),
    city: Yup.string().required('City is required'),
    postalCode: Yup.string().required('Postal code is required'),
    // country: Yup.string().required('Country is required'), // Making country optional for now
    country: Yup.string(),
  }).required('Address is required'),
  branchCode: Yup.string().trim().required('Branch code is required'),
  type: Yup.string().required('Branch type is required').oneOf(branchTypes.map(bt => bt.value)),
});

const BranchForm = ({ initialData, onSubmit, onCancel }) => {
  const isEditing = Boolean(initialData);

  const initialValues = {
    name: initialData?.name || '',
    address: {
      street: initialData?.address?.street || '',
      city: initialData?.address?.city || '',
      postalCode: initialData?.address?.postalCode || '',
      country: initialData?.address?.country || '',
    },
    branchCode: initialData?.branchCode || '',
    type: initialData?.type || '',
  };

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h5" gutterBottom component="h2">
        {isEditing ? 'Edit Branch' : 'Create New Branch'}
      </Typography>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          onSubmit(values); // Pass values to parent handler
          setSubmitting(false);
        }}
        enableReinitialize // This allows the form to reset when initialData changes
      >
        {({ errors, touched, isSubmitting, dirty, isValid }) => (
          <Form>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Field
                  as={TextField}
                  name="name"
                  label="Branch Name"
                  fullWidth
                  required
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field
                  as={TextField}
                  name="branchCode"
                  label="Branch Code"
                  fullWidth
                  required
                  error={touched.branchCode && Boolean(errors.branchCode)}
                  helperText={touched.branchCode && errors.branchCode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field
                  as={TextField}
                  select
                  name="type"
                  label="Branch Type"
                  fullWidth
                  required
                  error={touched.type && Boolean(errors.type)}
                  helperText={touched.type && errors.type}
                >
                  {branchTypes.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Field>
              </Grid>

              {/* Address Fields */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{mt: 1}}>Address</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field
                  as={TextField}
                  name="address.street"
                  label="Street"
                  fullWidth
                  required
                  error={touched.address?.street && Boolean(errors.address?.street)}
                  helperText={touched.address?.street && errors.address?.street}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field
                  as={TextField}
                  name="address.city"
                  label="City"
                  fullWidth
                  required
                  error={touched.address?.city && Boolean(errors.address?.city)}
                  helperText={touched.address?.city && errors.address?.city}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field
                  as={TextField}
                  name="address.postalCode"
                  label="Postal Code"
                  fullWidth
                  required
                  error={touched.address?.postalCode && Boolean(errors.address?.postalCode)}
                  helperText={touched.address?.postalCode && errors.address?.postalCode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field
                  as={TextField}
                  name="address.country"
                  label="Country"
                  fullWidth
                  required
                  error={touched.address?.country && Boolean(errors.address?.country)}
                  helperText={touched.address?.country && errors.address?.country}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button onClick={onCancel} sx={{ mr: 1 }} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting || !dirty || !isValid}
                  >
                    {isEditing ? 'Save Changes' : 'Create Branch'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    </Paper>
  );
};

export default BranchForm;
