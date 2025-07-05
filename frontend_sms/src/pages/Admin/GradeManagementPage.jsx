import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, Chip, Alert, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';

import StyledDataGrid from '../../components/common/StyledDataGrid';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import GradeFormDialog from '../../components/grade/GradeFormDialog';
import NotificationToast from '../../components/common/NotificationToast';
import { TextField } from '@mui/material';
import debounce from 'lodash.debounce';

import gradeService from '../../services/gradeService';
import useAuthStore from '../../store/auth.store';
// Assuming branchApi.js exists and has getBranches method for the filter
// import { getBranches as fetchBranchesForFilterService } from '../../services/branchApi';

// Placeholder for enums, should ideally be imported
const USER_STATUS_ENUM = { ACTIVE: 'active', INACTIVE: 'inactive' }; // Not used for grades, but example

const GradeManagementPage = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isGradeFormOpen, setIsGradeFormOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [totalGrades, setTotalGrades] = useState(0);

  const { user } = useAuthStore();
  const currentSchoolId = user?.schoolScope || user?.school?.id || user?.school;

  // --- Search and Filter State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); // For debounced fetching
  const [filterBranch, setFilterBranch] = useState('');
  const [availableBranches, setAvailableBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const fetchGrades = useCallback(async (page, search, branch, limit) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page + 1,
        limit: limit,
        populate: 'branchId,nextGradeId',
      };
      if (search) params.search = search;
      if (branch) params.branchId = branch;

      if (user?.role === 'rootUser' && currentSchoolId) {
        params.schoolId = currentSchoolId;
      } else if (user?.role === 'rootUser' && !currentSchoolId) {
        // For root user to list all grades, backend requires schoolId.
        // This scenario should ideally be handled by UI (e.g., school selector for root user)
        // or this page might not be accessible/functional for root without a school context.
        // For now, if no schoolId for root, we might not fetch or show an error.
        // showToast("School ID is required for root user to list grades.", "warning");
        // return; // Or let backend handle validation
      }

      const response = await gradeService.getGrades(params);
      if (response && Array.isArray(response.results)) {
        setGrades(response.results);
        setTotalGrades(response.totalResults || 0);
      } else {
        console.error("Unexpected grades list response structure:", response);
        setGrades([]);
        setTotalGrades(0);
        showToast('Failed to fetch grades: Unexpected response.', 'error');
      }
    } catch (err) {
      const errorMessage = err.message || err.data?.message || 'Failed to fetch grades.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      setGrades([]);
      setTotalGrades(0);
    } finally {
      setLoading(false);
    }
  }, [user?.role, currentSchoolId]); // Removed gradeService.getGrades as it's stable

  useEffect(() => {
    setLoadingBranches(true);
    const branchParams = { limit: 500, sortBy: 'name:asc' };
    // If current user is admin/superadmin and scoped to a school, you might want to filter branches by their schoolId.
    // if (currentSchoolId && user?.role !== 'rootUser') {
    //   branchParams.schoolId = currentSchoolId; // Assuming branchApi.getBranches supports this
    // }
    const fetchBranchListForFilter = async () => {
      try {
        const { getBranches: fetchBranchesApi } = await import('../../services/branchApi.js');
        const branchesResponse = await fetchBranchesApi(branchParams);
        setAvailableBranches(branchesResponse.results || []);
      } catch (e) {
        showToast('Failed to load branches for filter.', 'error');
        setAvailableBranches([]);
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranchListForFilter();
  }, []); // Fetch branches once

  // Effect for debouncing search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      if (searchTerm !== debouncedSearchTerm) { // Prevent initial unnecessary trigger if searchTerm is empty
          setPaginationModel(prev => ({ ...prev, page: 0 }));
          setDebouncedSearchTerm(searchTerm);
      } else if (!searchTerm && debouncedSearchTerm) { // Handle clearing search
          setPaginationModel(prev => ({ ...prev, page: 0 }));
          setDebouncedSearchTerm('');
      }
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchTerm]); // Intentionally not including debouncedSearchTerm here

  // Main data fetching useEffect
  useEffect(() => {
    fetchGrades(paginationModel.page, debouncedSearchTerm, filterBranch, paginationModel.pageSize);
  }, [
    paginationModel.page,
    paginationModel.pageSize,
    debouncedSearchTerm, // Use the debounced version for fetching
    filterBranch,
    fetchGrades,
  ]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value); // Update searchTerm immediately for input field
  };

  const handleBranchFilterChange = (event) => {
    setFilterBranch(event.target.value);
    setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset page
    // Main useEffect will pick up filterBranch change and refetch.
  };

  const handleRefresh = () => {
    // Call fetchGrades with current states
    fetchGrades(paginationModel.page, debouncedSearchTerm, filterBranch, paginationModel.pageSize);
  };

  const handleAddGrade = () => {
    setEditingGrade(null);
    setIsGradeFormOpen(true);
  };

  const handleEditGrade = (grade) => {
    setEditingGrade(grade);
    setIsGradeFormOpen(true);
  };

  const handleDeleteGrade = (grade) => {
    setGradeToDelete(grade);
    setConfirmDialogOpen(true);
  };

  const confirmGradeDelete = async () => {
    if (!gradeToDelete) return;
    setIsDeleting(true);
    try {
      const params = {};
      if (user?.role === 'rootUser' && currentSchoolId) {
        params.schoolIdToScopeTo = currentSchoolId;
      }
      await gradeService.deleteGrade(gradeToDelete.id, params);
      showToast(`Grade "${gradeToDelete.title}" deleted successfully.`, 'success');
      setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset to page 0
      // Main useEffect will trigger refetch due to paginationModel change (if page actually changes)
      // or call fetchGrades directly if preferred to ensure immediate update with current filters.
      fetchGrades(0, debouncedSearchTerm, filterBranch, paginationModel.pageSize);

    } catch (err) {
      showToast(err.message || err.data?.message || "Failed to delete grade.", 'error');
    } finally {
      setIsDeleting(false);
      setConfirmDialogOpen(false);
      setGradeToDelete(null);
    }
  };

  const handleGradeFormSubmit = async (values, isEditingMode, gradeId) => {
    try {
      let payload = { ...values };
      if (user?.role === 'rootUser' && currentSchoolId && !isEditingMode) {
        payload.schoolIdForGrade = currentSchoolId;
      }
      if (user?.role === 'rootUser' && currentSchoolId && isEditingMode) {
        payload.schoolIdToScopeTo = currentSchoolId;
      }

      if (isEditingMode) {
        await gradeService.updateGrade(gradeId, payload);
        showToast('Grade updated successfully!', 'success');
      } else {
        await gradeService.createGrade(payload);
        showToast('Grade created successfully!', 'success');
      }
      setIsGradeFormOpen(false);
      setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset to page 0
      fetchGrades(0, debouncedSearchTerm, filterBranch, paginationModel.pageSize);
      return true;
    } catch (apiError) {
      showToast(apiError.message || apiError.data?.message || `Failed to ${isEditingMode ? 'update' : 'create'} grade.`, 'error');
      return false;
    }
  };

  const handleGradeFormClose = (submittedSuccessfully) => {
    setIsGradeFormOpen(false);
    setEditingGrade(null);
  };

  const handlePaginationModelChange = (newModel) => {
    setPaginationModel(newModel);
  };

  const columns = [
    { field: 'title', headerName: 'Grade Title', flex: 1, minWidth: 180 },
    { field: 'levelCode', headerName: 'Level Code', width: 130, renderCell: params => params.value || 'N/A' },
    {
      field: 'branch',
      headerName: 'Branch/Campus',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => params?.row?.branchId?.name || 'N/A',
    },
    {
      field: 'sections',
      headerName: 'Sections',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        Array.isArray(params.row.sections) && params.row.sections.length > 0
          ? params.row.sections.map(section => <Chip key={section} label={section} size="small" sx={{ mr: 0.5, mb: 0.5 }} />)
          : 'No sections'
      )
    },
    {
      field: 'nextGrade',
      headerName: 'Next Grade',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => params?.row?.nextGradeId?.title || 'N/A',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit Grade">
            <IconButton onClick={() => handleEditGrade(params.row)} size="small">
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Grade">
            <IconButton onClick={() => handleDeleteGrade(params.row)} size="small" color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  if (loading && grades.length === 0 && !searchTerm && !filterBranch ) { // Adjusted condition
    return <LoadingSpinner fullScreen message="Loading grades..." />;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" component="h1">
          Grade Management
        </Typography>
        <Box>
            <Tooltip title="Refresh Grades">
                <IconButton onClick={handleRefresh} sx={{ mr: 1 }}>
                    <RefreshIcon />
                </IconButton>
            </Tooltip>
            <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddGrade}
            >
            Add Grade
            </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: '4px' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Search (Title, Level Code)"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" variant="outlined" disabled={loadingBranches}>
              <InputLabel>Filter by Branch</InputLabel>
              <Select
                value={filterBranch}
                onChange={handleBranchFilterChange}
                label="Filter by Branch"
              >
                <MenuItem value="">
                  <em>All Branches</em>
                </MenuItem>
                {loadingBranches && <MenuItem value="" disabled><em>Loading branches...</em></MenuItem>}
                {!loadingBranches && availableBranches.length === 0 && <MenuItem value="" disabled><em>No branches found</em></MenuItem>}
                {availableBranches.map((branch) => (
                  <MenuItem key={branch.id || branch._id} value={branch.id || branch._id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {error && !loading && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}

      <StyledDataGrid
        rows={grades}
        columns={columns}
        loading={loading}
        rowCount={totalGrades}
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationModelChange} // Changed to use the new handler
        paginationMode="server"
        getRowId={(row) => row.id}
        autoHeight
        minHeight={400}
      />

      <GradeFormDialog
        open={isGradeFormOpen}
        onClose={handleGradeFormClose}
        grade={editingGrade}
        onSubmit={handleGradeFormSubmit}
        currentSchoolId={user?.role === 'rootUser' ? currentSchoolId : undefined}
      />

      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmGradeDelete}
        title="Confirm Deletion"
        contentText={`Are you sure you want to delete grade "${gradeToDelete?.title}"? This action cannot be undone.`}
        isLoading={isDeleting}
        confirmButtonColor="error"
      />

      <NotificationToast
        open={toastOpen}
        message={toastMessage}
        severity={toastSeverity}
        handleClose={() => setToastOpen(false)}
      />
    </Box>
  );
};

export default GradeManagementPage;
