import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, Alert, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';

import StyledDataGrid from '../../components/common/StyledDataGrid'; // Adjust path if needed
import LoadingSpinner from '../../components/common/LoadingSpinner'; // Adjust path
import ConfirmationDialog from '../../components/common/ConfirmationDialog'; // Adjust path
import NotificationToast from '../../components/common/NotificationToast'; // Adjust path
import SchoolFormDialog from '../../components/schools/SchoolFormDialog.jsx'; // Corrected import

import { useSchools } from '../../contexts/SchoolContext'; // Adjust path

const SchoolManagementPage = () => {
  const {
    schools,
    pagination,
    loadingSchools,
    loadingSchoolAction,
    error,
    fetchSchools,
    addSchool,
    editSchool,
    removeSchool,
    clearSchoolError,
  } = useSchools();

  const [isSchoolFormOpen, setIsSchoolFormOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null); // null for add, school object for edit

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState(null);

  const [toastInfo, setToastInfo] = useState({ open: false, message: '', severity: 'success' });

  const showToast = (message, severity = 'success') => {
    setToastInfo({ open: true, message, severity });
  };

  const handleFetchSchools = useCallback((params = {}) => {
    clearSchoolError();
    fetchSchools(params);
  }, [fetchSchools, clearSchoolError]);

  useEffect(() => {
    handleFetchSchools({ page: 1, limit: 10 }); // Initial fetch
  }, [handleFetchSchools]);

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
      await removeSchool(schoolToDelete._id); // Assuming school object has _id
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
      if (isEditingMode && editingSchool) {
        await editSchool(editingSchool._id, values);
        showToast('School updated successfully!', 'success');
      } else {
        await addSchool(values);
        showToast('School created successfully!', 'success');
      }
      setIsSchoolFormOpen(false);
      // Data is re-fetched or optimistically updated by context
      return true;
    } catch (apiError) {
      showToast(apiError.message || `Failed to ${isEditingMode ? 'update' : 'create'} school.`, 'error');
      // Keep dialog open for correction by returning false or not closing
      return false;
    }
  };

  const handleSchoolFormClose = () => {
    setIsSchoolFormOpen(false);
    setEditingSchool(null);
  };

  const handlePageChange = (params) => {
    handleFetchSchools({ page: params.page + 1, limit: params.pageSize });
  };

  const handlePageSizeChange = (params) => {
    handleFetchSchools({ page: 1, limit: params.pageSize });
  };

  const columns = [
    { field: 'name', headerName: 'School Name', flex: 1, minWidth: 250 },
    {
      field: 'adminUser',
      headerName: 'Admin Email',
      flex: 1,
      minWidth: 250,
      // This assumes the backend `createSchool` response includes the user object
      // and the `schools` array in context might store this or it needs to be fetched separately.
      // For now, let's assume the school object might eventually hold adminEmail directly or via populated field.
      // If not, this column needs adjustment or removal.
      // The backend returns { school, user } for create. The list `/schools` only returns schools.
      // So, this column won't work for the list view without modification.
      // For now, I will leave it as a placeholder or comment it out.
      // Let's remove it for now to avoid issues, as the GET /schools doesn't populate admin.
      valueGetter: (params) => params.row.adminEmail || 'N/A', // Placeholder if adminEmail is part of school object
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      valueGetter: (params) => new Date(params.row.createdAt).toLocaleDateString(),
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

  // Adjust columns if adminUser/adminEmail is not directly available on school objects from GET /schools
  const finalColumns = columns.filter(col => col.field !== 'adminUser');


  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          School Management
        </Typography>
        <Box>
           <Tooltip title="Refresh Schools List">
            <IconButton onClick={() => handleFetchSchools()} disabled={loadingSchools || loadingSchoolAction} sx={{mr: 1}}>
              {loadingSchools && !loadingSchoolAction ? <CircularProgress size={24} /> : <RefreshIcon />}
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

      {error && !loadingSchools && (
        <Alert severity="error" onClose={clearSchoolError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ flexGrow: 1, width: '100%' }}>
        <StyledDataGrid
          rows={schools}
          columns={finalColumns}
          loading={loadingSchools || loadingSchoolAction}
          getRowId={(row) => row._id} // Assuming school objects have _id
          rowCount={pagination.totalResults}
          pageSize={pagination.limit}
          page={pagination.page - 1} // DataGrid is 0-indexed
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          paginationMode="server" // Important for server-side pagination
          checkboxSelection={false}
          disableSelectionOnClick
          autoHeight={false} // Use flexGrow for height
        />
      </Box>

      {isSchoolFormOpen && ( // Conditionally render to ensure it's mounted only when needed
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
