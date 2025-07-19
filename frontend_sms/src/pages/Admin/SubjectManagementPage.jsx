import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, Chip, Alert, Grid, TextField, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, FormControl, InputLabel, Select, MenuItem, FormHelperText, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { debounce } from 'lodash';

import StyledDataGrid from '../../components/common/StyledDataGrid';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import NotificationToast from '../../components/common/NotificationToast';
import GradeDropdown from '../../components/common/GradeDropdown';

import subjectService from '../../services/subjectService';
import gradeService from '../../services/gradeService';
import userService from '../../services/userService';
import branchService from '../../services/branchService'; // Assuming you have this
import useAuthStore from '../../store/auth.store';




const SubjectFormDialog = ({ open, onClose, subject, onSubmit, teachers, branches }) => {
    const isEditing = Boolean(subject);

    const getInitialValues = () => ({
        title: subject?.title || '',
        subjectCode: subject?.subjectCode || '',
        description: subject?.description || '',
        creditHours: subject?.creditHours || 0,
        branchId: subject?.branchId?._id || subject?.branchId || '',
        defaultTeacher: subject?.defaultTeacher?._id || subject?.defaultTeacher || '',
        gradeId: subject?.gradeId?._id || subject?.gradeId || '',
    });

    const [initialValues, setInitialValues] = useState(getInitialValues());

    useEffect(() => {
        setInitialValues(getInitialValues());
    }, [subject]);

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
                )}
            </Formik>
        </Dialog>
    );
};

const SubjectManagementPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10, total: 0 }); // MUI DataGrid uses 0-indexed page
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [grades, setGrades] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [branches, setBranches] = useState([]);
  const { user } = useAuthStore(); // Get current user, e.g. for schoolId

  const [isSubjectFormOpen, setIsSubjectFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const [filters, setFilters] = useState({
    title: '',
    branchId: '',
    gradeId: '',
    defaultTeacher: '',
    creditHours: '',
  });
  const [searchTerm, setSearchTerm] = useState(''); // For debounced search

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const fetchDropdownData = useCallback(async () => {
    try {
        // const schoolId = user?.schoolId; // Assuming user object has schoolId - REMOVED
        const params = {limit: 1000 }; // High limit to fetch all for dropdowns. SchoolId handled by backend.

        const [gradesRes, teachersRes, branchesRes] = await Promise.all([
            gradeService.getGrades(params), // SchoolId should be handled by backend based on token
            userService.getAllUsers({ role: 'teacher', ...params }), // SchoolId should be handled by backend
            branchService.getAllBranches(params) // SchoolId should be handled by backend
        ]);
        setGrades(gradesRes.results || []);
        setTeachers(teachersRes.results || teachersRes.data?.results || []); // userService might have data nested
        setBranches(branchesRes.results || []);
    } catch (err) {
        showToast('Failed to load support data (grades, teachers, branches). Please try again.', 'error');
        console.error("Error fetching dropdown data:", err);
    }
  }, []); // Removed user?.schoolId from dependency array


  const fetchSubjects = useCallback(async (currentFilters, page = pagination.page, pageSize = pagination.pageSize) => {
    setLoading(true); setError(null);
    try {
      const apiParams = {
        page: page + 1, // API is 1-indexed
        limit: pageSize,
        sortBy: 'createdAt:desc', // Default sort
        // schoolId: user?.schoolId, // Filter by schoolId of logged-in admin - REMOVED (handled by backend)
        ...currentFilters // title, branchId, gradeId, defaultTeacher, creditHours
      };
      // Remove empty filter values
      Object.keys(apiParams).forEach(key => {
        if (apiParams[key] === '' || apiParams[key] === null || apiParams[key] === undefined) {
          delete apiParams[key];
        }
      });

      const data = await subjectService.getSubjects(apiParams);
      setSubjects(data.results || []);
      setPagination(prev => ({ ...prev, page, pageSize, total: data.totalResults || 0 }));
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch subjects.';
      setError(errorMsg); showToast(errorMsg, 'error');
    } finally { setLoading(false); }
  }, [user?.schoolId, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  useEffect(() => {
    fetchSubjects(filters, pagination.page, pagination.pageSize);
  }, [fetchSubjects, filters, pagination.page, pagination.pageSize]);


  const debouncedSearch = useCallback(debounce((newFilters) => {
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page on new search
    fetchSubjects(newFilters, 0, pagination.pageSize);
  }, 500), [fetchSubjects, pagination.pageSize]);


  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    if (name === 'title') {
        setSearchTerm(value); // Keep searchTerm for input field display
        debouncedSearch(newFilters);
    } else {
        setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
        fetchSubjects(newFilters, 0, pagination.pageSize);
    }
  };

  const handleClearFilters = () => {
    const clearedFilters = { title: '', branchId: '', gradeId: '', defaultTeacher: '', creditHours: '' };
    setFilters(clearedFilters);
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
    fetchSubjects(clearedFilters, 0, pagination.pageSize);
  };


  const handleAddSubject = () => { setEditingSubject(null); setIsSubjectFormOpen(true); };
  const handleEditSubject = (subject) => { setEditingSubject(subject); setIsSubjectFormOpen(true); };
  const handleDeleteSubject = (subject) => { setSubjectToDelete(subject); setConfirmDialogOpen(true); };

  const confirmSubjectDelete = async () => {
    if (!subjectToDelete) return;
    setIsDeleting(true);
    try {
      await subjectService.deleteSubject(subjectToDelete._id); // Use _id from backend
      showToast(`Subject "${subjectToDelete.title}" deleted.`, 'success');
      fetchSubjects(filters, pagination.page, pagination.pageSize); // Refetch current page
    } catch (err) { showToast(err.message || "Failed to delete subject.", 'error'); }
    finally { setIsDeleting(false); setConfirmDialogOpen(false); setSubjectToDelete(null); }
  };

  const handleSubjectFormSubmit = async (values, isEditingMode, subjectId) => {
    try {
      // const payload = { ...values, schoolId: user?.schoolId }; // REMOVED schoolId, backend handles it
      const payload = { ...values };
      if (isEditingMode) {
        await subjectService.updateSubject(subjectId, payload);
        showToast('Subject updated!', 'success');
      } else {
        await subjectService.createSubject(payload);
        showToast('Subject created!', 'success');
      }
      setIsSubjectFormOpen(false);
      fetchSubjects(filters, 0, pagination.pageSize); // Reset to first page after add/edit
      return true;
    } catch (apiError) {
      showToast(apiError.message || `Failed to ${isEditingMode ? 'update' : 'create'} subject.`, 'error');
      return false;
    }
  };

  const handleSubjectFormClose = () => { setIsSubjectFormOpen(false); setEditingSubject(null); };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({ ...prev, page: 0, pageSize: newPageSize })); // Reset to first page on size change
  };


  const columns = [
    { field: 'title', headerName: 'Subject Name', flex: 1, minWidth: 200 },
    { field: 'subjectCode', headerName: 'Code', width: 120 },
    { field: 'creditHours', headerName: 'Credit Hours', width: 120 },
    { field: 'branchId', headerName: 'Branch', flex: 1, minWidth: 150,
      renderCell: (params) => params.row.branchId?.name || 'N/A'
    },
    { field: 'gradeId', headerName: 'Grade', flex: 1, minWidth: 150,
      renderCell: (params) => params.row.gradeId?.title || 'N/A'
    },
    { field: 'defaultTeacher', headerName: 'Teacher', flex: 1, minWidth: 150,
      renderCell: (params) => params.row.defaultTeacher?.fullname || 'N/A'
    },
    // { field: 'status', headerName: 'Status', width: 100, renderCell: (params) => <Chip label={params.value} size="small" color={params.value === 'active' ? 'success' : 'error'} /> },
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

  if (loading && subjects.length === 0 && !error) return <LoadingSpinner fullScreen message="Loading subjects..." />;

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">Subject Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddSubject}>Add Subject</Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Filters</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Search by Title" name="title" value={searchTerm} onChange={handleFilterChange} InputProps={{ endAdornment: <SearchIcon /> }} />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Branch</InputLabel>
              <Select name="branchId" value={filters.branchId} label="Branch" onChange={handleFilterChange}>
                <MenuItem value=""><em>All Branches</em></MenuItem>
                {branches.map(b => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Grade</InputLabel>
              <Select name="gradeId" value={filters.gradeId} label="Grade" onChange={handleFilterChange}>
                <MenuItem value=""><em>All Grades</em></MenuItem>
                {grades.map(g => <MenuItem key={g._id} value={g._id}>{g.title}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Teacher</InputLabel>
              <Select name="defaultTeacher" value={filters.defaultTeacher} label="Teacher" onChange={handleFilterChange}>
                <MenuItem value=""><em>All Teachers</em></MenuItem>
                {teachers.map(t => <MenuItem key={t._id} value={t._id}>{t.fullname}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField fullWidth label="Credit Hours" name="creditHours" type="number" value={filters.creditHours} onChange={handleFilterChange} inputProps={{ min: 0 }} />
          </Grid>
          <Grid item xs={12} sm={6} md={1} sx={{display: 'flex', alignItems: 'center'}}>
            <Button onClick={handleClearFilters} startIcon={<ClearIcon />} variant="outlined" size="small">Clear</Button>
          </Grid>
        </Grid>
      </Paper>

      {error && !loading && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <StyledDataGrid
        rows={subjects}
        columns={columns}
        loading={loading}
        getRowId={(row) => row._id || row.id} // Use _id from backend, fallback to id
        rowCount={pagination.total}
        pageSize={pagination.pageSize}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        page={pagination.page}
        paginationMode="server" // Important for server-side pagination
        minHeight={500}
      />

      {isSubjectFormOpen && ( // Conditionally render to ensure fresh state for dropdowns
        <SubjectFormDialog
            open={isSubjectFormOpen}
            onClose={handleSubjectFormClose}
            subject={editingSubject}
            onSubmit={handleSubjectFormSubmit}
            teachers={teachers}
            branches={branches}
        />
      )}
      <ConfirmationDialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} onConfirm={confirmSubjectDelete} title="Confirm Deletion" contentText={`Delete subject "${subjectToDelete?.title}"?`} isLoading={isDeleting} confirmButtonColor="error" />
      <NotificationToast open={toastOpen} message={toastMessage} severity={toastSeverity} handleClose={() => setToastOpen(false)} />
    </Box>
  );
};

export default SubjectManagementPage;
