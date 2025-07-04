import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, Chip, Alert, Grid, TextField, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

import StyledDataGrid from '../../components/common/StyledDataGrid';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import NotificationToast from '../../components/common/NotificationToast';

// Mock data for grade levels (should come from API or shared context)
const mockGradeLevels = JSON.parse(localStorage.getItem('mock_grade_levels')) || [
    { id: 'grade1', name: 'Grade 1' }, { id: 'grade2', name: 'Grade 2' },
    { id: 'grade10sci', name: 'Grade 10 (Science)'}, { id: 'grade10art', name: 'Grade 10 (Arts)'}
];
// Mock data for teachers (should come from API or shared context)
const mockTeachers = JSON.parse(localStorage.getItem('mock_users'))?.filter(u => u.role === 'teacher') || [
    { id: 't1', fullname: 'Bob Teacher' }, { id: 't2', fullname: 'Alice TeachingPro'}
];


// Mock service for subjects
const mockSubjectService = {
  getSubjects: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    let subjects = JSON.parse(localStorage.getItem('mock_subjects'));
    if (!subjects) {
      subjects = [
        { id: 'subj1', name: 'Mathematics', code: 'MATH101', description: 'Core mathematics concepts', gradeLevelIds: ['grade1', 'grade2'], teacherIds: ['t1'], status: 'active' },
        { id: 'subj2', name: 'English Language', code: 'ENG101', description: 'Grammar and literature', gradeLevelIds: ['grade1'], teacherIds: ['t2'], status: 'active' },
        { id: 'subj3', name: 'Physics', code: 'PHY201', description: 'Fundamentals of Physics', gradeLevelIds: ['grade10sci'], teacherIds: ['t1'], status: 'inactive' },
      ];
      localStorage.setItem('mock_subjects', JSON.stringify(subjects));
    }
    // Simulate populating names for display
    return subjects.map(s => ({
        ...s,
        gradeLevels: s.gradeLevelIds?.map(gid => mockGradeLevels.find(gl => gl.id === gid)?.name).filter(Boolean).join(', ') || 'N/A',
        teachers: s.teacherIds?.map(tid => mockTeachers.find(t => t.id === tid)?.fullname).filter(Boolean).join(', ') || 'N/A',
    }));
  },
  addSubject: async (subjectData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    let subjects = JSON.parse(localStorage.getItem('mock_subjects')) || [];
    const newSubject = { ...subjectData, id: `subj_${Date.now()}` };
    subjects.push(newSubject);
    localStorage.setItem('mock_subjects', JSON.stringify(subjects));
    return { success: true, data: newSubject };
  },
  updateSubject: async (subjectId, subjectData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    let subjects = JSON.parse(localStorage.getItem('mock_subjects')) || [];
    subjects = subjects.map(s => (s.id === subjectId ? { ...s, ...subjectData } : s));
    localStorage.setItem('mock_subjects', JSON.stringify(subjects));
    return { success: true, data: subjects.find(s => s.id === subjectId) };
  },
  deleteSubject: async (subjectId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    let subjects = JSON.parse(localStorage.getItem('mock_subjects')) || [];
    subjects = subjects.filter(s => s.id !== subjectId);
    localStorage.setItem('mock_subjects', JSON.stringify(subjects));
    return { success: true };
  }
};

// Subject Form Dialog Component
const SubjectFormDialog = ({ open, onClose, subject, onSubmit }) => {
    const isEditing = Boolean(subject);
    const initialValues = {
        name: subject?.name || '',
        code: subject?.code || '',
        description: subject?.description || '',
        gradeLevelIds: subject?.gradeLevelIds || [], // Expecting array of IDs
        teacherIds: subject?.teacherIds || [],     // Expecting array of IDs
        status: subject?.status || 'active',
    };

    const validationSchema = Yup.object().shape({
        name: Yup.string().required('Subject name is required'),
        code: Yup.string().required('Subject code is required'),
        description: Yup.string().nullable(),
        gradeLevelIds: Yup.array().min(1, 'At least one grade level must be selected'),
        teacherIds: Yup.array().nullable(), // Teachers can be optional initially
        status: Yup.string().required('Status is required'),
    });

    return (
        <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
            <DialogTitle>{isEditing ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={async (values, { setSubmitting }) => {
                    await onSubmit(values, isEditing, subject?.id);
                    setSubmitting(false);
                }}
                enableReinitialize
            >
                {({ errors, touched, isSubmitting, values, handleChange, handleBlur, setFieldValue }) => (
                    <Form>
                        <DialogContent dividers>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Subject Name" name="name" value={values.name} onChange={handleChange} onBlur={handleBlur} error={touched.name && Boolean(errors.name)} helperText={touched.name && errors.name} disabled={isSubmitting} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Subject Code" name="code" value={values.code} onChange={handleChange} onBlur={handleBlur} error={touched.code && Boolean(errors.code)} helperText={touched.code && errors.code} disabled={isSubmitting} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth multiline rows={3} label="Description (Optional)" name="description" value={values.description} onChange={handleChange} onBlur={handleBlur} disabled={isSubmitting} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth error={touched.gradeLevelIds && Boolean(errors.gradeLevelIds)} disabled={isSubmitting}>
                                        <InputLabel id="gradeLevels-select-label">Applicable Grade Levels</InputLabel>
                                        <Select
                                            labelId="gradeLevels-select-label"
                                            multiple
                                            value={values.gradeLevelIds}
                                            onChange={(e) => setFieldValue('gradeLevelIds', e.target.value)}
                                            name="gradeLevelIds"
                                            label="Applicable Grade Levels"
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.map((value) => (<Chip key={value} label={mockGradeLevels.find(gl => gl.id === value)?.name || value} size="small" />))}
                                                </Box>
                                            )}
                                        >
                                            {mockGradeLevels.map(gl => (<MenuItem key={gl.id} value={gl.id}>{gl.name}</MenuItem>))}
                                        </Select>
                                        {touched.gradeLevelIds && errors.gradeLevelIds && <FormHelperText>{errors.gradeLevelIds}</FormHelperText>}
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth error={touched.teacherIds && Boolean(errors.teacherIds)} disabled={isSubmitting}>
                                        <InputLabel id="teachers-select-label">Assigned Teachers (Optional)</InputLabel>
                                        <Select
                                            labelId="teachers-select-label"
                                            multiple
                                            value={values.teacherIds}
                                            onChange={(e) => setFieldValue('teacherIds', e.target.value)}
                                            name="teacherIds"
                                            label="Assigned Teachers (Optional)"
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.map((value) => (<Chip key={value} label={mockTeachers.find(t => t.id === value)?.fullname || value} size="small" />))}
                                                </Box>
                                            )}
                                        >
                                            {mockTeachers.map(t => (<MenuItem key={t.id} value={t.id}>{t.fullname}</MenuItem>))}
                                        </Select>
                                        {touched.teacherIds && errors.teacherIds && <FormHelperText>{errors.teacherIds}</FormHelperText>}
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth error={touched.status && Boolean(errors.status)} disabled={isSubmitting}>
                                        <InputLabel id="status-select-label">Status</InputLabel>
                                        <Select labelId="status-select-label" name="status" value={values.status} label="Status" onChange={handleChange} onBlur={handleBlur}>
                                            <MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem>
                                        </Select>
                                        {touched.status && errors.status && <FormHelperText>{errors.status}</FormHelperText>}
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
                )}
            </Formik>
        </Dialog>
    );
};


const SubjectManagementPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isSubjectFormOpen, setIsSubjectFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const fetchSubjects = async () => {
    setLoading(true); setError(null);
    try {
      const data = await mockSubjectService.getSubjects();
      setSubjects(data);
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch subjects.';
      setError(errorMsg); showToast(errorMsg, 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const handleAddSubject = () => { setEditingSubject(null); setIsSubjectFormOpen(true); };
  const handleEditSubject = (subject) => { setEditingSubject(subject); setIsSubjectFormOpen(true); };
  const handleDeleteSubject = (subject) => { setSubjectToDelete(subject); setConfirmDialogOpen(true); };

  const confirmSubjectDelete = async () => {
    if (!subjectToDelete) return;
    setIsDeleting(true);
    try {
      await mockSubjectService.deleteSubject(subjectToDelete.id);
      showToast(`Subject "${subjectToDelete.name}" deleted.`, 'success');
      fetchSubjects();
    } catch (err) { showToast(err.message || "Failed to delete subject.", 'error'); }
    finally { setIsDeleting(false); setConfirmDialogOpen(false); setSubjectToDelete(null); }
  };

  const handleSubjectFormSubmit = async (values, isEditingMode, subjectId) => {
    try {
      if (isEditingMode) {
        await mockSubjectService.updateSubject(subjectId, values);
        showToast('Subject updated!', 'success');
      } else {
        await mockSubjectService.addSubject(values);
        showToast('Subject created!', 'success');
      }
      setIsSubjectFormOpen(false); fetchSubjects(); return true;
    } catch (apiError) {
      showToast(apiError.message || `Failed to ${isEditingMode ? 'update' : 'create'} subject.`, 'error');
      return false;
    }
  };

  const handleSubjectFormClose = () => { setIsSubjectFormOpen(false); setEditingSubject(null); };

  const columns = [
    { field: 'name', headerName: 'Subject Name', flex: 1, minWidth: 200 },
    { field: 'code', headerName: 'Code', width: 120 },
    { field: 'gradeLevels', headerName: 'Grade Levels', flex: 1, minWidth: 200,
      renderCell: (params) => <Tooltip title={params.value}><Typography noWrap sx={{overflow: 'hidden', textOverflow: 'ellipsis'}}>{params.value}</Typography></Tooltip>
    },
    { field: 'teachers', headerName: 'Teachers', flex: 1, minWidth: 200,
      renderCell: (params) => <Tooltip title={params.value}><Typography noWrap sx={{overflow: 'hidden', textOverflow: 'ellipsis'}}>{params.value}</Typography></Tooltip>
    },
    { field: 'status', headerName: 'Status', width: 100, renderCell: (params) => <Chip label={params.value} size="small" color={params.value === 'active' ? 'success' : 'error'} /> },
    {
      field: 'actions', headerName: 'Actions', width: 130, sortable: false, filterable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit Subject"><IconButton onClick={() => handleEditSubject(params.row)} size="small"><EditIcon /></IconButton></Tooltip>
          <Tooltip title="Delete Subject"><IconButton onClick={() => handleDeleteSubject(params.row)} size="small" color="error"><DeleteIcon /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  if (loading && subjects.length === 0) return <LoadingSpinner fullScreen message="Loading subjects..." />;

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">Subject Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddSubject}>Add Subject</Button>
      </Box>
      {error && !loading && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <StyledDataGrid rows={subjects} columns={columns} loading={loading} error={null} getRowId={(row) => row.id} minHeight={500} />
      <SubjectFormDialog open={isSubjectFormOpen} onClose={handleSubjectFormClose} subject={editingSubject} onSubmit={handleSubjectFormSubmit} />
      <ConfirmationDialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} onConfirm={confirmSubjectDelete} title="Confirm Deletion" contentText={`Delete subject "${subjectToDelete?.name}"?`} isLoading={isDeleting} confirmButtonColor="error" />
      <NotificationToast open={toastOpen} message={toastMessage} severity={toastSeverity} handleClose={() => setToastOpen(false)} />
    </Box>
  );
};

export default SubjectManagementPage;
