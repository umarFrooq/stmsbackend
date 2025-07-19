import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, Chip, Alert, Grid, TextField, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import gradeService from '../../services/gradeService';

const SubjectFormDialog = ({ open, onClose, subject, onSubmit, teachers, branches }) => {
    const isEditing = Boolean(subject);

    const initialValues = {
        title: subject?.title || '',
        subjectCode: subject?.subjectCode || '',
        description: subject?.description || '',
        creditHours: subject?.creditHours || 0,
        branchId: subject?.branchId?._id || subject?.branchId || '',
        defaultTeacher: subject?.defaultTeacher?._id || subject?.defaultTeacher || '',
        gradeId: subject?.gradeId?._id || subject?.gradeId || '',
    };

    const validationSchema = Yup.object().shape({
        title: Yup.string().required('Subject name/title is required'),
        subjectCode: Yup.string().required('Subject code is required'),
        description: Yup.string().nullable(),
        creditHours: Yup.number().min(0, 'Credit hours cannot be negative').required('Credit hours are required'),
        branchId: Yup.string()
          .matches(/^[0-9a-fA-F]{24}$/, 'Invalid Branch ID')
          .required('Branch is required'),
        defaultTeacher: Yup.string()
          .test(
            'is-object-id',
            'Invalid Teacher ID',
            (value) => !value || (Yup.string().matches(/^[0-9a-fA-F]{24}$/).isValidSync(value))
          )
          .nullable(), // Teacher can be optional
        gradeId: Yup.string()
          .test(
            'is-object-id',
            'Invalid Grade ID',
            (value) => !value || (Yup.string().matches(/^[0-9a-fA-F]{24}$/).isValidSync(value))
          )
          .nullable(), // Grade can be optional
    });

    return (
        <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
            <DialogTitle>{isEditing ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={async (values, { setSubmitting }) => {
                    const payload = { ...values };
                    if (payload.defaultTeacher === '') payload.defaultTeacher = null;
                    if (payload.gradeId === '') payload.gradeId = null;

                    await onSubmit(payload, isEditing, subject?._id);
                    setSubmitting(false);
                }}
                enableReinitialize
            >
                {({ errors, touched, isSubmitting, values, handleChange, handleBlur, setFieldValue }) => {
                    const [grades, setGrades] = useState([]);
                    const [loadingGrades, setLoadingGrades] = useState(false);

                    useEffect(() => {
                        if (values.branchId) {
                            setLoadingGrades(true);
                            gradeService.getGrades({ branchId: values.branchId, limit: 500 })
                                .then(data => {
                                    setGrades(data.results || []);
                                })
                                .catch(err => {
                                    console.error("Failed to fetch grades for branch:", err);
                                    setGrades([]);
                                })
                                .finally(() => setLoadingGrades(false));
                        } else {
                            setGrades([]);
                        }
                    }, [values.branchId]);

                    return (
                        <Form>
                            <DialogContent dividers>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Subject Name/Title" name="title" value={values.title} onChange={handleChange} onBlur={handleBlur} error={touched.title && Boolean(errors.title)} helperText={touched.title && errors.title} disabled={isSubmitting} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Subject Code" name="subjectCode" value={values.subjectCode} onChange={handleChange} onBlur={handleBlur} error={touched.subjectCode && Boolean(errors.subjectCode)} helperText={touched.subjectCode && errors.subjectCode} disabled={isSubmitting} />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField fullWidth multiline rows={3} label="Description (Optional)" name="description" value={values.description} onChange={handleChange} onBlur={handleBlur} disabled={isSubmitting} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth type="number" label="Credit Hours" name="creditHours" value={values.creditHours} onChange={handleChange} onBlur={handleBlur} error={touched.creditHours && Boolean(errors.creditHours)} helperText={touched.creditHours && errors.creditHours} disabled={isSubmitting} inputProps={{ min: 0 }} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth error={touched.branchId && Boolean(errors.branchId)} disabled={isSubmitting}>
                                            <InputLabel id="branch-select-label">Branch</InputLabel>
                                            <Select
                                                labelId="branch-select-label"
                                                name="branchId"
                                                value={values.branchId}
                                                label="Branch"
                                                onChange={(e) => {
                                                    setFieldValue('branchId', e.target.value);
                                                    setFieldValue('gradeId', '');
                                                }}
                                                onBlur={handleBlur}
                                            >
                                                <MenuItem value=""><em>None</em></MenuItem>
                                                {branches.map(b => (<MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>))}
                                            </Select>
                                            {touched.branchId && errors.branchId && <FormHelperText>{errors.branchId}</FormHelperText>}
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth error={touched.gradeId && Boolean(errors.gradeId)} disabled={isSubmitting || !values.branchId || loadingGrades}>
                                            <InputLabel id="grade-select-label">Grade (Optional)</InputLabel>
                                            <Select
                                                labelId="grade-select-label"
                                                name="gradeId"
                                                value={values.gradeId}
                                                label="Grade (Optional)"
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            >
                                                <MenuItem value=""><em>{loadingGrades ? 'Loading...' : 'None'}</em></MenuItem>
                                                {grades.map(g => (<MenuItem key={g._id} value={g._id}>{g.title}</MenuItem>))}
                                            </Select>
                                            {touched.gradeId && errors.gradeId && <FormHelperText>{errors.gradeId}</FormHelperText>}
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth error={touched.defaultTeacher && Boolean(errors.defaultTeacher)} disabled={isSubmitting}>
                                            <InputLabel id="teacher-select-label">Default Teacher (Optional)</InputLabel>
                                            <Select labelId="teacher-select-label" name="defaultTeacher" value={values.defaultTeacher} label="Default Teacher (Optional)" onChange={(e) => setFieldValue('defaultTeacher', e.target.value)} onBlur={handleBlur}>
                                            <MenuItem value=""><em>None</em></MenuItem>
                                                {teachers.map(t => (<MenuItem key={t._id} value={t._id}>{t.fullname}</MenuItem>))}
                                            </Select>
                                            {touched.defaultTeacher && errors.defaultTeacher && <FormHelperText>{errors.defaultTeacher}</FormHelperText>}
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </DialogContent>
                            <DialogActions sx={{ p: '16px 24px' }}>
                                <Button onClick={() => onClose(false)} color="inherit" disabled={isSubmitting}>Cancel</Button>
                                <Button type="submit" variant="contained" color="primary" disabled={isSubmitting} startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}>
                                    {isSubmitting ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Subject')}
                                </Button>
                            </DialogActions>
                        </Form>
                    )
                }}
            </Formik>
        </Dialog>
    );
};

export default SubjectFormDialog;
