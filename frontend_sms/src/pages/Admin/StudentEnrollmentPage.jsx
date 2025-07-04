import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Box,
  CircularProgress,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox, FormGroup,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import dayjs from 'dayjs'; // For date handling if using DatePicker
// import { DatePicker } from '@mui/x-date-pickers/DatePicker'; // If using MUI X DatePicker
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import NotificationToast from '../../components/common/NotificationToast';

// Mock data - replace with API calls
const mockGradeLevels = [ // Should come from API
  { id: 'grade1', name: 'Grade 1' },
  { id: 'grade2', name: 'Grade 2' },
  { id: 'grade10', name: 'Grade 10 (Science)' },
  { id: 'grade10arts', name: 'Grade 10 (Arts)' },
];
const mockBranches = JSON.parse(localStorage.getItem('mock_branches')) || [
    { id: 'branch1', name: 'Main Campus' },
    { id: 'branch2', name: 'North Campus' },
]; // From localStorage or API


const steps = ['Student Information', 'Parent/Guardian Information', 'Previous Education', 'Review & Submit'];

// Yup Schemas for each step
const studentInfoSchema = Yup.object().shape({
  fullname: Yup.string().required('Full name is required').min(3),
  dateOfBirth: Yup.date().required('Date of birth is required').max(dayjs().subtract(3, 'year').toDate(), 'Student must be at least 3 years old'), // Example age validation
  gender: Yup.string().required('Gender is required'),
  nationality: Yup.string().required('Nationality is required'),
  admissionForGrade: Yup.string().required('Admission for grade is required'),
  branchId: Yup.string().required('Branch is required'),
  studentEmail: Yup.string().email('Invalid student email').nullable(),
  studentPhone: Yup.string().nullable(),
  address: Yup.string().required('Address is required'),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State/Province is required'),
  zipCode: Yup.string().required('Zip/Postal Code is required'),
});

const parentInfoSchema = Yup.object().shape({
  parents: Yup.array().of(
    Yup.object().shape({
      parentType: Yup.string().required('Parent/Guardian type is required'),
      fullname: Yup.string().required('Parent full name is required'),
      occupation: Yup.string().nullable(),
      email: Yup.string().email('Invalid email').required('Parent email is required'),
      phone: Yup.string().required('Parent phone is required'),
      addressSameAsStudent: Yup.boolean(),
      address: Yup.string().when('addressSameAsStudent', {
        is: false,
        then: schema => schema.required('Parent address is required if different'),
        otherwise: schema => schema.nullable(),
      }),
    })
  ).min(1, 'At least one parent/guardian is required'),
});

const prevEducationSchema = Yup.object().shape({
  previousSchoolName: Yup.string().nullable(),
  lastGradeCompleted: Yup.string().nullable(),
  transferCertificateAttached: Yup.boolean().nullable(),
  reasonForLeaving: Yup.string().nullable(),
});


const StudentEnrollmentPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const currentValidationSchema = () => {
    switch (activeStep) {
      case 0: return studentInfoSchema;
      case 1: return parentInfoSchema;
      case 2: return prevEducationSchema;
      default: return Yup.object(); // No validation for review or other steps
    }
  };

  const initialValues = {
    // Student Info
    fullname: '', dateOfBirth: null, gender: '', nationality: 'Pakistani', admissionForGrade: '', branchId: '',
    studentEmail: '', studentPhone: '', address: '', city: '', state: '', zipCode: '',
    // Parent Info
    parents: [{ parentType: 'Father', fullname: '', occupation: '', email: '', phone: '', addressSameAsStudent: true, address: '' }],
    // Previous Education
    previousSchoolName: '', lastGradeCompleted: '', transferCertificateAttached: false, reasonForLeaving: '',
    // Documents (conceptual)
    // birthCertificate: null, photo: null,
  };


  const handleNext = () => setActiveStep((prevActiveStep) => prevActiveStep + 1);
  const handleBack = () => setActiveStep((prevActiveStep) => prevActiveStep - 1);

  const handleSubmitEnrollment = async (values) => {
    setIsSubmittingForm(true);
    console.log('Submitting Enrollment Data:', values);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Mock success, in real app, check API response
    showToast('Student enrolled successfully!', 'success');
    setIsSubmittingForm(false);
    setActiveStep(0); // Reset stepper or redirect
    // Ideally, you'd reset the form values too, Formik's resetForm can be used here.
    // formikProps.resetForm(); // if formikProps are available in this scope
  };

  const renderStepContent = (step, formikProps) => {
    const { values, errors, touched, handleChange, handleBlur, setFieldValue } = formikProps;
    switch (step) {
      case 0: // Student Information
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Full Name" name="fullname" value={values.fullname} onChange={handleChange} onBlur={handleBlur} error={touched.fullname && Boolean(errors.fullname)} helperText={touched.fullname && errors.fullname} />
            </Grid>
            <Grid item xs={12} sm={6}>
              {/* Basic text input for DOB for simplicity, use MUI X DatePicker for better UX */}
              <TextField fullWidth label="Date of Birth (YYYY-MM-DD)" name="dateOfBirth" type="date" InputLabelProps={{ shrink: true }} value={values.dateOfBirth || ''} onChange={handleChange} onBlur={handleBlur} error={touched.dateOfBirth && Boolean(errors.dateOfBirth)} helperText={touched.dateOfBirth && errors.dateOfBirth} />
            </Grid>
             <Grid item xs={12} sm={6}>
              <FormControl component="fieldset" error={touched.gender && Boolean(errors.gender)}>
                <FormLabel component="legend">Gender</FormLabel>
                <RadioGroup row name="gender" value={values.gender} onChange={handleChange}>
                  <FormControlLabel value="male" control={<Radio />} label="Male" />
                  <FormControlLabel value="female" control={<Radio />} label="Female" />
                  <FormControlLabel value="other" control={<Radio />} label="Other" />
                </RadioGroup>
                {touched.gender && errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Nationality" name="nationality" value={values.nationality} onChange={handleChange} onBlur={handleBlur} error={touched.nationality && Boolean(errors.nationality)} helperText={touched.nationality && errors.nationality} />
            </Grid>
            <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={touched.admissionForGrade && Boolean(errors.admissionForGrade)}>
                    <InputLabel>Admission for Grade/Class</InputLabel>
                    <Select name="admissionForGrade" value={values.admissionForGrade} label="Admission for Grade/Class" onChange={handleChange} onBlur={handleBlur}>
                        {mockGradeLevels.map(grade => <MenuItem key={grade.id} value={grade.id}>{grade.name}</MenuItem>)}
                    </Select>
                    {touched.admissionForGrade && errors.admissionForGrade && <FormHelperText>{errors.admissionForGrade}</FormHelperText>}
                </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={touched.branchId && Boolean(errors.branchId)}>
                    <InputLabel>Branch/Campus</InputLabel>
                    <Select name="branchId" value={values.branchId} label="Branch/Campus" onChange={handleChange} onBlur={handleBlur}>
                        {mockBranches.map(branch => <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>)}
                    </Select>
                    {touched.branchId && errors.branchId && <FormHelperText>{errors.branchId}</FormHelperText>}
                </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Student Email (Optional)" name="studentEmail" type="email" value={values.studentEmail} onChange={handleChange} onBlur={handleBlur} error={touched.studentEmail && Boolean(errors.studentEmail)} helperText={touched.studentEmail && errors.studentEmail} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Student Phone (Optional)" name="studentPhone" value={values.studentPhone} onChange={handleChange} onBlur={handleBlur} error={touched.studentPhone && Boolean(errors.studentPhone)} helperText={touched.studentPhone && errors.studentPhone} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Address" name="address" value={values.address} onChange={handleChange} onBlur={handleBlur} error={touched.address && Boolean(errors.address)} helperText={touched.address && errors.address} /></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth label="City" name="city" value={values.city} onChange={handleChange} onBlur={handleBlur} error={touched.city && Boolean(errors.city)} helperText={touched.city && errors.city} /></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth label="State/Province" name="state" value={values.state} onChange={handleChange} onBlur={handleBlur} error={touched.state && Boolean(errors.state)} helperText={touched.state && errors.state} /></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth label="Zip/Postal Code" name="zipCode" value={values.zipCode} onChange={handleChange} onBlur={handleBlur} error={touched.zipCode && Boolean(errors.zipCode)} helperText={touched.zipCode && errors.zipCode} /></Grid>
          </Grid>
        );
      case 1: // Parent/Guardian Information
        return (
          <FieldArray name="parents">
            {({ push, remove }) => (
              <Box>
                {values.parents.map((parent, index) => (
                  <Accordion key={index} defaultExpanded={index === 0} sx={{mb:1}}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>Parent/Guardian {index + 1} {parent.fullname ? `(${parent.fullname})` : ''}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <FormControl fullWidth error={touched.parents?.[index]?.parentType && Boolean(errors.parents?.[index]?.parentType)}>
                            <InputLabel>Type</InputLabel>
                            <Select name={`parents.${index}.parentType`} value={parent.parentType} label="Type" onChange={handleChange} onBlur={handleBlur}>
                              <MenuItem value="Father">Father</MenuItem><MenuItem value="Mother">Mother</MenuItem><MenuItem value="Guardian">Guardian</MenuItem>
                            </Select>
                            {touched.parents?.[index]?.parentType && errors.parents?.[index]?.parentType && <FormHelperText>{errors.parents?.[index]?.parentType}</FormHelperText>}
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={8}><TextField fullWidth label="Full Name" name={`parents.${index}.fullname`} value={parent.fullname} onChange={handleChange} onBlur={handleBlur} error={touched.parents?.[index]?.fullname && Boolean(errors.parents?.[index]?.fullname)} helperText={touched.parents?.[index]?.fullname && errors.parents?.[index]?.fullname} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Occupation (Optional)" name={`parents.${index}.occupation`} value={parent.occupation} onChange={handleChange} onBlur={handleBlur} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Email" name={`parents.${index}.email`} type="email" value={parent.email} onChange={handleChange} onBlur={handleBlur} error={touched.parents?.[index]?.email && Boolean(errors.parents?.[index]?.email)} helperText={touched.parents?.[index]?.email && errors.parents?.[index]?.email} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" name={`parents.${index}.phone`} value={parent.phone} onChange={handleChange} onBlur={handleBlur} error={touched.parents?.[index]?.phone && Boolean(errors.parents?.[index]?.phone)} helperText={touched.parents?.[index]?.phone && errors.parents?.[index]?.phone} /></Grid>
                        <Grid item xs={12}>
                          <FormControlLabel control={<Checkbox name={`parents.${index}.addressSameAsStudent`} checked={parent.addressSameAsStudent} onChange={handleChange} />} label="Address same as student" />
                        </Grid>
                        {!parent.addressSameAsStudent && (
                          <Grid item xs={12}><TextField fullWidth label="Parent's Address" name={`parents.${index}.address`} value={parent.address} onChange={handleChange} onBlur={handleBlur} error={touched.parents?.[index]?.address && Boolean(errors.parents?.[index]?.address)} helperText={touched.parents?.[index]?.address && errors.parents?.[index]?.address} /></Grid>
                        )}
                        {values.parents.length > 1 && <Grid item xs={12}><Button size="small" color="error" onClick={() => remove(index)}>Remove Parent/Guardian</Button></Grid>}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
                <Button size="small" onClick={() => push({ parentType: '', fullname: '', occupation: '', email: '', phone: '', addressSameAsStudent: true, address: '' })}>Add Another Parent/Guardian</Button>
              </Box>
            )}
          </FieldArray>
        );
      case 2: // Previous Education
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Previous School Name (if any)" name="previousSchoolName" value={values.previousSchoolName} onChange={handleChange} onBlur={handleBlur} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Last Grade/Class Completed" name="lastGradeCompleted" value={values.lastGradeCompleted} onChange={handleChange} onBlur={handleBlur} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Reason for Leaving (Optional)" name="reasonForLeaving" value={values.reasonForLeaving} onChange={handleChange} onBlur={handleBlur} /></Grid>
            <Grid item xs={12}><FormControlLabel control={<Checkbox name="transferCertificateAttached" checked={values.transferCertificateAttached} onChange={handleChange} />} label="Transfer Certificate / School Leaving Certificate Attached" /></Grid>
          </Grid>
        );
      case 3: // Review & Submit
        return (
            <Box>
                <Typography variant="h6" gutterBottom>Review Enrollment Details</Typography>
                <Paper variant="outlined" sx={{p:2}}>
                    <Typography variant="subtitle1" gutterBottom><strong>Student Information:</strong></Typography>
                    <Typography>Name: {values.fullname}</Typography>
                    <Typography>DOB: {values.dateOfBirth ? dayjs(values.dateOfBirth).format('DD MMM YYYY') : 'N/A'}</Typography>
                    <Typography>Gender: {values.gender}</Typography>
                    <Typography>Grade: {mockGradeLevels.find(g=>g.id === values.admissionForGrade)?.name || 'N/A'}</Typography>
                    <Typography>Branch: {mockBranches.find(b=>b.id === values.branchId)?.name || 'N/A'}</Typography>
                    <Divider sx={{my:1}}/>
                    <Typography variant="subtitle1" gutterBottom><strong>Parent/Guardian Information:</strong></Typography>
                    {values.parents.map((p,i) => (<Typography key={i}>{p.parentType} - {p.fullname} ({p.email})</Typography>))}
                     <Divider sx={{my:1}}/>
                    <Typography variant="subtitle1" gutterBottom><strong>Previous Education:</strong></Typography>
                    <Typography>School: {values.previousSchoolName || 'N/A'}</Typography>
                </Paper>
            </Box>
        );
      default: return 'Unknown step';
    }
  };

  return (
    // <LocalizationProvider dateAdapter={AdapterDayjs}> {/* Needed for MUI X DatePicker */}
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h5" component="h1" gutterBottom align="center" sx={{ mb: 3 }}>
          New Student Enrollment
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        <Formik
          initialValues={initialValues}
          validationSchema={currentValidationSchema()}
          onSubmit={(values, actions) => {
            if (activeStep === steps.length - 1) {
              handleSubmitEnrollment(values);
            } else {
              handleNext();
            }
            actions.setTouched({}); // Clear touched state for next step
            actions.setSubmitting(false);
          }}
        >
          {(formikProps) => (
            <Form>
              <Box sx={{minHeight: '300px', p:2 }}> {/* Content area */}
                {renderStepContent(activeStep, formikProps)}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, pt:2, borderTop: '1px solid lightgrey' }}>
                <Button color="inherit" disabled={activeStep === 0 || isSubmittingForm} onClick={handleBack}>
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmittingForm || formikProps.isSubmitting} // Disable while formik is validating or global submit is happening
                >
                  {isSubmittingForm && activeStep === steps.length -1 ? <CircularProgress size={24} color="inherit"/> : (activeStep === steps.length - 1 ? 'Submit Enrollment' : 'Next')}
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Paper>
      <NotificationToast
        open={toastOpen}
        message={toastMessage}
        severity={toastSeverity}
        handleClose={() => setToastOpen(false)}
      />
    </Container>
    // </LocalizationProvider>
  );
};

export default StudentEnrollmentPage;
