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

import subjectService from '../../services/subjectService'; // Import the real service
import { getBranches } from '../../services/branchApi'; // For branch filter
import { getGrades } from '../../services/gradeService'; // For grade filter (if applicable to subjects)
import useAuthStore from '../../store/auth.store'; // For schoolId, if needed for Admin context

// Mock data for grade levels (should come from API or shared context)
// const mockGradeLevels = JSON.parse(localStorage.getItem('mock_grade_levels')) || [
//     { id: 'grade1', name: 'Grade 1' }, { id: 'grade2', name: 'Grade 2' },
//     { id: 'grade10sci', name: 'Grade 10 (Science)'}, { id: 'grade10art', name: 'Grade 10 (Arts)'}
// ];
// Mock data for teachers (should come from API or shared context)
// const mockTeachers = JSON.parse(localStorage.getItem('mock_users'))?.filter(u => u.role === 'teacher') || [
//     { id: 't1', fullname: 'Bob Teacher' }, { id: 't2', fullname: 'Alice TeachingPro'}
// ];
// Mock service for subjects is removed


// Subject Form Dialog Component - This should ideally be moved to its own file.
// For now, keeping it here but noting that it needs to use real data sources for dropdowns.
const SubjectFormDialog = ({ open, onClose, subject, onSubmit, availableBranches = [], /* availableGrades = [], availableTeachers = [] */ }) => {
    const isEditing = Boolean(subject);
    const initialValues = {
        title: subject?.title || '', // Changed from name
        subjectCode: subject?.subjectCode || '', // Changed from code
        description: subject?.description || '',
        creditHours: subject?.creditHours || 0,
        branchId: subject?.branchId?._id || subject?.branchId || '', // Handle populated object or just ID
        defaultTeacher: subject?.defaultTeacher?._id || subject?.defaultTeacher || '', // Handle populated or just ID
        // gradeId: subject?.gradeId || '', // If subjects are linked to a single grade
    };

    const validationSchema = Yup.object().shape({
        title: Yup.string().required('Subject title is required'),
        subjectCode: Yup.string().required('Subject code is required').uppercase(),
        description: Yup.string().nullable(),
        creditHours: Yup.number().required('Credit hours are required').min(0, 'Credit hours cannot be negative'),
        branchId: Yup.string().required('Branch is required'),
        defaultTeacher: Yup.string().nullable(), // Optional
        // gradeId: Yup.string().required('Grade is required'), // If applicable
    });

    // TODO: Fetch actual teachers for the defaultTeacher dropdown
    const mockTeachers = [{id: 'teacher1', fullname: 'Mock Teacher 1'}]; // Placeholder

    return (
        <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
            <DialogTitle>{isEditing ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={async (values, { setSubmitting }) => {
                    await onSubmit(values, isEditing, subject?.id || subject?._id);
                    setSubmitting(false);
                }}
                enableReinitialize
            >
                {({ errors, touched, isSubmitting, values, handleChange, handleBlur, setFieldValue }) => (
                    <Form>
                        <DialogContent dividers>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Subject Title" name="title" value={values.title} onChange={handleChange} onBlur={handleBlur} error={touched.title && Boolean(errors.title)} helperText={touched.title && errors.title} disabled={isSubmitting} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Subject Code" name="subjectCode" value={values.subjectCode} onChange={handleChange} onBlur={handleBlur} error={touched.subjectCode && Boolean(errors.subjectCode)} helperText={touched.subjectCode && errors.subjectCode} disabled={isSubmitting} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth multiline rows={3} label="Description (Optional)" name="description" value={values.description} onChange={handleChange} onBlur={handleBlur} disabled={isSubmitting} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth type="number" label="Credit Hours" name="creditHours" value={values.creditHours} onChange={handleChange} onBlur={handleBlur} error={touched.creditHours && Boolean(errors.creditHours)} helperText={touched.creditHours && errors.creditHours} disabled={isSubmitting} InputProps={{ inputProps: { min: 0 } }}/>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                     <FormControl fullWidth error={touched.branchId && Boolean(errors.branchId)} disabled={isSubmitting}>
                                        <InputLabel id="branch-select-label">Branch *</InputLabel>
                                        <Select
                                            labelId="branch-select-label"
                                            name="branchId"
                                            value={values.branchId}
                                            label="Branch *"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        >
                                            <MenuItem value=""><em>Select Branch</em></MenuItem>
                                            {availableBranches.map(branch => (
                                                <MenuItem key={branch.id || branch._id} value={branch.id || branch._id}>{branch.name}</MenuItem>
                                            ))}
                                        </Select>
                                        {touched.branchId && errors.branchId && <FormHelperText>{errors.branchId}</FormHelperText>}
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                     <FormControl fullWidth error={touched.defaultTeacher && Boolean(errors.defaultTeacher)} disabled={isSubmitting}>
                                        <InputLabel id="teacher-select-label">Default Teacher (Optional)</InputLabel>
                                        <Select
                                            labelId="teacher-select-label"
                                            name="defaultTeacher"
                                            value={values.defaultTeacher}
                                            label="Default Teacher (Optional)"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        >
                                            <MenuItem value=""><em>None</em></MenuItem>
                                            {/* TODO: Replace mockTeachers with actual fetched teacher list */}
                                            {mockTeachers.map(teacher => (
                                                <MenuItem key={teacher.id} value={teacher.id}>{teacher.fullname}</MenuItem>
                                            ))}
                                        </Select>
                                        {touched.defaultTeacher && errors.defaultTeacher && <FormHelperText>{errors.defaultTeacher}</FormHelperText>}
                                    </FormControl>
                                </Grid>
                                {/* Add GradeId select if subjects are directly linked to grades in your model */}
                                {/* <Grid item xs={12} sm={6}> ... Grade Select ... </Grid> */}
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

  // --- Search and Filter State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  // const [filterGrade, setFilterGrade] = useState(''); // Add if subjects are directly linked to Grade for filtering

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [totalSubjects, setTotalSubjects] = useState(0);

  const [allBranches, setAllBranches] = useState([]); // For filter dropdown
  const [loadingAllBranches, setLoadingAllBranches] = useState(false);
  // const [allGrades, setAllGrades] = useState([]); // For filter dropdown
  // const [loadingAllGrades, setLoadingAllGrades] = useState(false);

  const { user: currentUser } = useAuthStore(); // For schoolId context

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const fetchSubjects = useCallback(async (page, search, branch, limit) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page + 1,
        limit,
        sortBy: 'title:asc',
        populate: 'branchId,defaultTeacher', // Populate for display
      };
      if (search) params.search = search;
      if (branch) params.branchId = branch;
      // if (grade) params.gradeId = grade; // If filtering by grade

      // School ID should be handled by schoolScopeMiddleware for Admin users.
      // If rootUser were to use this page, schoolId would need to be handled.
      // The backend service for subjects now requires schoolId.
      // The controller needs to pass it. This page, running as Admin, relies on middleware.

      const data = await subjectService.getSubjects(params);
      setSubjects(data.results || []);
      setTotalSubjects(data.totalResults || 0);
      // Update paginationModel based on response if necessary, or let DataGrid handle it
      // setPaginationModel(prev => ({ ...prev, page: data.page -1, pageSize: data.limit }));

    } catch (err) {
      const errorMsg = err.message || (err.data && err.data.message) || 'Failed to fetch subjects.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      setSubjects([]);
      setTotalSubjects(0);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array for now, will be refined

  // Fetch branches for filter
  useEffect(() => {
    const loadBranches = async () => {
      setLoadingAllBranches(true);
      try {
        // Admin should see branches for their school. Root might see all or need a school selector.
        // Assuming getBranches from branchApi can be scoped if needed by backend.
        const branchParams = { limit: 500, sortBy: 'name:asc' };
        // if (currentUser?.schoolScope && currentUser.role !== 'rootUser') {
        //   branchParams.schoolId = currentUser.schoolScope;
        // }
        const response = await getBranches(branchParams); // from branchApi.js
        setAllBranches(response.results || []);
      } catch (error) {
        showToast('Failed to load branches for filter.', 'error');
      }
      setLoadingAllBranches(false);
    };
    loadBranches();
  }, [currentUser?.schoolScope, currentUser?.role]);

  // TODO: Fetch grades for filter if subjects are linked to grades for filtering purposes

  // Debounce search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      if (searchTerm !== debouncedSearchTerm) {
        setPaginationModel(prev => ({ ...prev, page: 0 }));
        setDebouncedSearchTerm(searchTerm);
      } else if (!searchTerm && debouncedSearchTerm) {
        setPaginationModel(prev => ({ ...prev, page: 0 }));
        setDebouncedSearchTerm('');
      }
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchTerm, debouncedSearchTerm]);

  // Main data fetching useEffect
  useEffect(() => {
    fetchSubjects(
      paginationModel.page,
      debouncedSearchTerm,
      filterBranch,
      // filterGrade,
      paginationModel.pageSize
    );
  }, [
    paginationModel.page,
    paginationModel.pageSize,
    debouncedSearchTerm,
    filterBranch,
    // filterGrade,
    fetchSubjects
  ]);


  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleBranchFilterChange = (event) => {
    setFilterBranch(event.target.value);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  // const handleGradeFilterChange = (event) => {
  //   setFilterGrade(event.target.value);
  //   setPaginationModel(prev => ({ ...prev, page: 0 }));
  // };

  const handlePaginationModelChange = (model) => {
    setPaginationModel(model);
  };

  const handleRefresh = () => {
     fetchSubjects(paginationModel.page, debouncedSearchTerm, filterBranch, paginationModel.pageSize);
  };


  const handleAddSubject = () => { setEditingSubject(null); setIsSubjectFormOpen(true); };
  const handleEditSubject = (subject) => { setEditingSubject(subject); setIsSubjectFormOpen(true); };
  const handleDeleteSubject = (subject) => { setSubjectToDelete(subject); setConfirmDialogOpen(true); };

  const confirmSubjectDelete = async () => {
    if (!subjectToDelete) return;
    setIsDeleting(true);
    try {
      // Admin user's schoolId should be passed or handled by middleware for service calls
      await subjectService.deleteSubject(subjectToDelete.id /*, { schoolId: currentUser?.schoolScope } */);
      showToast(`Subject "${subjectToDelete.name || subjectToDelete.title}" deleted.`, 'success');
      // Refetch with current filters and reset to page 0
      setPaginationModel(prev => ({ ...prev, page: 0 }));
      fetchSubjects(0, debouncedSearchTerm, filterBranch, paginationModel.pageSize);

    } catch (err) {
      showToast(err.message || (err.data && err.data.message) || "Failed to delete subject.", 'error');
    } finally {
      setIsDeleting(false); setConfirmDialogOpen(false); setSubjectToDelete(null);
    }
  };

  const handleSubjectFormSubmit = async (values, isEditingMode, subjectId) => {
    // The SubjectFormDialog passes 'name' and 'code', backend model uses 'title' and 'subjectCode'.
    // Map them here or ensure form dialog uses backend field names.
    // For now, assuming form dialog sends backend-compatible field names.
    // The createSubject service expects schoolId.
    const payload = { ...values };
    // if (currentUser?.schoolScope && !isEditingMode) { // Add schoolId if creating and admin is scoped
    //   payload.schoolId = currentUser.schoolScope;
    // }
    // For admin actions, schoolId is typically derived from their session/middleware on backend.

    try {
      if (isEditingMode) {
        await subjectService.updateSubject(subjectId, payload);
        showToast('Subject updated!', 'success');
      } else {
        await subjectService.createSubject(payload); // createSubject in service now takes schoolId as 2nd param
        showToast('Subject created!', 'success');
      }
      setIsSubjectFormOpen(false);
      setPaginationModel(prev => ({ ...prev, page: 0 }));
      fetchSubjects(0, debouncedSearchTerm, filterBranch, paginationModel.pageSize);
      return true;
    } catch (apiError) {
      showToast(apiError.message || (apiError.data && apiError.data.message) || `Failed to ${isEditingMode ? 'update' : 'create'} subject.`, 'error');
      return false;
    }
  };

  const handleSubjectFormClose = () => { setIsSubjectFormOpen(false); setEditingSubject(null); };

  const columns = [
    { field: 'title', headerName: 'Subject Name', flex: 1, minWidth: 200 }, // Changed from 'name' to 'title'
    { field: 'subjectCode', headerName: 'Code', width: 120 }, // Changed from 'code'
    {
      field: 'branch',
      headerName: 'Branch',
      width: 180,
      valueGetter: (params) => params.row.branchId?.name || 'N/A'
    },
    // { field: 'gradeLevels', headerName: 'Grade Levels', flex: 1, minWidth: 200,
    //   renderCell: (params) => <Tooltip title={params.value}><Typography noWrap sx={{overflow: 'hidden', textOverflow: 'ellipsis'}}>{params.value}</Typography></Tooltip>
    // }, // gradeLevels not directly on Subject model
    {
      field: 'defaultTeacher',
      headerName: 'Default Teacher',
      flex: 1,
      minWidth: 180,
      valueGetter: (params) => params.row.defaultTeacher?.fullname || 'N/A'
    },
    { field: 'creditHours', headerName: 'Credit Hours', width: 130 },
    // { field: 'status', headerName: 'Status', width: 100, renderCell: (params) => <Chip label={params.value} size="small" color={params.value === 'active' ? 'success' : 'error'} /> }, // Subject model doesn't have status yet
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

  if (loading && subjects.length === 0 && !searchTerm && !filterBranch) { // Adjusted for current filters
    return <LoadingSpinner fullScreen message="Loading subjects..." />;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" component="h1">Subject Management</Typography>
        <Box>
          <Tooltip title="Refresh Subjects">
            <IconButton onClick={handleRefresh} sx={{ mr: 1 }}><RefreshIcon /></IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddSubject}>Add Subject</Button>
        </Box>
      </Box>

      {/* Filter and Search Controls */}
      <Box sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: '4px' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Search (Title, Code)"
              variant="outlined"
              value={searchTerm} // Bind to the non-debounced searchTerm for immediate input feedback
              onChange={handleSearchChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" variant="outlined" disabled={loadingAllBranches}>
              <InputLabel>Filter by Branch</InputLabel>
              <Select
                value={filterBranch}
                onChange={handleBranchFilterChange}
                label="Filter by Branch"
              >
                <MenuItem value="">
                  <em>All Branches</em>
                </MenuItem>
                {loadingAllBranches && <MenuItem value="" disabled><em>Loading branches...</em></MenuItem>}
                {!loadingAllBranches && allBranches.length === 0 && <MenuItem value="" disabled><em>No branches found</em></MenuItem>}
                {allBranches.map((branch) => (
                  <MenuItem key={branch.id || branch._id} value={branch.id || branch._id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {/* Add Grade filter here if it becomes applicable */}
        </Grid>
      </Box>

      {error && !loading && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <StyledDataGrid
        rows={subjects}
        columns={columns}
        loading={loading}
        error={null}
        getRowId={(row) => row.id}
        minHeight={500}
        rowCount={totalSubjects}
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationModelChange}
        paginationMode="server"
      />

      <SubjectFormDialog
        open={isSubjectFormOpen}
        onClose={handleSubjectFormClose}
        subject={editingSubject}
        onSubmit={handleSubjectFormSubmit}
        availableBranches={allBranches} // Pass fetched branches
        // availableGrades={allGrades} // Pass fetched grades if implemented
      />
      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmSubjectDelete}
        title="Confirm Deletion"
        contentText={`Delete subject "${subjectToDelete?.title || subjectToDelete?.name}"?`} // Use title
        isLoading={isDeleting}
        confirmButtonColor="error" />
      <NotificationToast
        open={toastOpen}
        message={toastMessage}
        severity={toastSeverity}
        handleClose={() => setToastOpen(false)} />
    </Box>
  );
};

export default SubjectManagementPage;
