import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, Alert, CircularProgress, Grid, TextField, FormControl, InputLabel, Select, MenuItem, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';

import StyledDataGrid from '../../components/common/StyledDataGrid';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import NotificationToast from '../../components/common/NotificationToast';
import SchoolFormDialog from '../../components/schools/SchoolFormDialog.jsx';

import { useSchools } from '../../contexts/SchoolContext';

// Placeholder enums - ideally import from a shared config
const schoolStatusEnum = {
  active: 'Active',
  inactive: 'Inactive',
  pending_approval: 'Pending Approval',
  suspended: 'Suspended'
};
const schoolTypeEnum = {
  public: 'Public',
  private: 'Private',
  charter: 'Charter',
  international: 'International',
  special_education: 'Special Education',
  other: 'Other'
};


const SchoolManagementPage = () => {
  const {
    schools,
    pagination,
    setSchoolPaginationModel, // New context action
    loadingSchools,
    loadingSchoolAction,
    error,
    fetchSchools, // Context's core fetch function
    addSchool,
    editSchool,
    removeSchool,
    clearSchoolError,
    searchTerm,       // Consuming from context
    updateSearchTerm, // Action from context
    filterStatus,
    setSchoolFilterStatus,
    filterType,
    setSchoolFilterType,
    filterCity,
    setSchoolFilterCity,
  } = useSchools();

  // Local state for controlled search input, updates context on debounce
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '');

  const [isSchoolFormOpen, setIsSchoolFormOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState(null);

  const [toastInfo, setToastInfo] = useState({ open: false, message: '', severity: 'success' });

  const showToast = (message, severity = 'success') => {
    setToastInfo({ open: true, message, severity });
  };

  // Initial fetch and when context-driven filters change (context's useEffect handles actual API call)
  useEffect(() => {
    clearSchoolError();
    // The context's useEffect is now the primary driver for fetching when its internal dependencies change.
    // This page might only need to ensure an initial fetch if context doesn't do it by default,
    // or simply rely on context's initial state to trigger its own fetch.
    // If context's fetchSchools isn't called on its own init, trigger one here.
    // fetchSchools(pagination, searchTermFromContext, filterStatusFromContext...); // using current values from context
  }, [clearSchoolError]); // Minimal dependencies, context handles its own data loading logic

  // Update localSearchTerm if searchTerm from context changes (e.g. on mount if context had a value)
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);


  const handleLocalSearchChange = (event) => {
    const newSearch = event.target.value;
    setLocalSearchTerm(newSearch);
    updateSearchTerm(newSearch); // This will be debounced within the context
  };

  const handleStatusFilterChange = (event) => {
    setSchoolFilterStatus(event.target.value);
  };
  const handleTypeFilterChange = (event) => {
    setSchoolFilterType(event.target.value);
  };
  const handleCityFilterChange = (event) => {
    setSchoolFilterCity(event.target.value);
  };

  const handleAddSchool = () => {
    setEditingSchool(null);
    setIsSchoolFormOpen(true);
  };

  const handleEditSchool = (school) => {
    setEditingSchool(school);
    setIsSchoolFormOpen(true);
  };

  const handleDeleteSchool = (school) => {
    setSchoolToDelete(school);
    setConfirmDialogOpen(true);
  };

  const confirmSchoolDelete = async () => {
    if (!schoolToDelete) return;
    try {
      await removeSchool(schoolToDelete.id || schoolToDelete._id);
      showToast(`School "${schoolToDelete.name}" deleted successfully.`, 'success');
    } catch (apiError) {
      showToast(apiError.message || 'Failed to delete school.', 'error');
    } finally {
      setConfirmDialogOpen(false);
      setSchoolToDelete(null);
    }
  };

  const handleSchoolFormSubmit = async (values, isEditingMode) => {
    try {
      const schoolPayload = { // Map form values to expected backend structure
        nameOfSchool: values.name, // Assuming form uses 'name'
        adminEmail: values.adminEmail,
        schoolCode: values.schoolCode,
        status: values.status,
        type: values.type,
        address: values.address,
      };

      if (isEditingMode && editingSchool) {
        // Pass only changed values for patch if service handles partial updates,
        // or full object if backend expects full replace on PATCH.
        // The schoolService.updateSchool takes (id, data).
        await editSchool(editingSchool._id || editingSchool.id, schoolPayload);
        showToast('School updated successfully!', 'success');
      } else {
        await addSchool(schoolPayload);
        showToast('School created successfully!', 'success');
      }
      setIsSchoolFormOpen(false);
      return true;
    } catch (apiError) {
      showToast(apiError.message || `Failed to ${isEditingMode ? 'update' : 'create'} school.`, 'error');
      return false;
    }
  };

  const handleSchoolFormClose = () => {
    setIsSchoolFormOpen(false);
    setEditingSchool(null);
  };

  const handlePaginationModelChange = (model) => { // model = { page: newPage (0-indexed), pageSize: newPageSize }
    setSchoolPaginationModel(model); // Update context's pagination state
  };

  const handleRefresh = () => {
    clearSchoolError();
    // Trigger fetch using current context state for filters and pagination
    fetchSchools(pagination, searchTerm, filterStatus, filterType, filterCity);
  };


  const columns = [
    { field: 'name', headerName: 'School Name', flex: 1, minWidth: 200 },
    { field: 'schoolCode', headerName: 'Code', width: 120 },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => {
        const label = params.value ? schoolStatusEnum[params.value] || params.value : 'N/A';
        return <Chip label={label} size="small" color={params.value === 'active' ? 'success' : (params.value === 'pending_approval' ? 'warning' : 'default')} />;
      }
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 150,
      valueGetter: (params) => params.value ? schoolTypeEnum[params.value] || params.value : 'N/A'
    },
    {
      field: 'address.city', // DataGrid can access nested fields with dot notation if data is structured like that
      headerName: 'City',
      width: 150,
      valueGetter: (params) => params.row.address?.city || 'N/A'
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      valueGetter: (params) => params.value ? new Date(params.value).toLocaleDateString() : 'N/A',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit School">
            <IconButton onClick={() => handleEditSchool(params.row)} size="small" disabled={loadingSchoolAction}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete School">
            <IconButton onClick={() => handleDeleteSchool(params.row)} size="small" color="error" disabled={loadingSchoolAction}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, height: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}> {/* Adjust height based on layout */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" component="h1">
          School Management
        </Typography>
        <Box>
           <Tooltip title="Refresh Schools List">
            <IconButton onClick={handleRefresh} disabled={loadingSchools || loadingSchoolAction} sx={{mr: 1}}>
              {(loadingSchools && !loadingSchoolAction) ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddSchool}
            disabled={loadingSchoolAction}
          >
            Add School
          </Button>
        </Box>
      </Box>

      {/* Filter and Search UI - To be added in Part 2 */}
      <Box sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search (Name, Code)"
              variant="outlined"
              value={localSearchTerm} // Use local state for input responsiveness
              onChange={handleLocalSearchChange} // Updates local and calls debounced context update
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus} // From context
                onChange={handleStatusFilterChange} // Calls context action
                label="Status"
              >
                <MenuItem value=""><em>All Statuses</em></MenuItem>
                {Object.entries(schoolStatusEnum).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filterType} // From context
                onChange={handleTypeFilterChange} // Calls context action
                label="Type"
              >
                <MenuItem value=""><em>All Types</em></MenuItem>
                 {Object.entries(schoolTypeEnum).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
           <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Filter by City"
              variant="outlined"
              value={filterCity} // From context
              onChange={handleCityFilterChange} // Calls context action
              size="small"
            />
          </Grid>
        </Grid>
      </Box>


      {error && !loadingSchools && (
        <Alert severity="error" onClose={clearSchoolError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ flexGrow: 1, width: '100%' }}>
        <StyledDataGrid
          rows={schools}
          columns={columns}
          loading={loadingSchools || loadingSchoolAction}
          getRowId={(row) => row._id || row.id}
          rowCount={pagination.totalResults}
          paginationModel={{ page: pagination.page - 1, pageSize: pagination.limit }}
          onPaginationModelChange={handlePaginationModelChange}
          paginationMode="server"
          pageSizeOptions={[5, 10, 25, 50]}
          autoHeight={false}
        />
      </Box>

      {isSchoolFormOpen && (
        <SchoolFormDialog
            open={isSchoolFormOpen}
            onClose={handleSchoolFormClose}
            school={editingSchool}
            onSubmit={handleSchoolFormSubmit}
            isLoading={loadingSchoolAction}
        />
      )}

      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmSchoolDelete}
        title="Confirm Deletion"
        contentText={`Are you sure you want to delete school "${schoolToDelete?.name}"? This action cannot be undone.`}
        isLoading={loadingSchoolAction}
        confirmButtonColor="error"
      />

      <NotificationToast
        open={toastInfo.open}
        message={toastInfo.message}
        severity={toastInfo.severity}
        handleClose={() => setToastInfo(prev => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default SchoolManagementPage;
