import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, Chip, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import StyledDataGrid from '../../components/common/StyledDataGrid';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import NotificationToast from '../../components/common/NotificationToast';
import BranchFormDialog from './BranchFormDialog';

// Mock service for branches (keeping as is, assuming it's for local dev/testing)
const mockBranchService = {
  getBranches: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    let branches = JSON.parse(localStorage.getItem('mock_branches'));
    if (!branches) {
      branches = [
        { id: 'branch1', name: 'Main Campus', location: '123 University Ave', contactPerson: 'Mr. Smith', contactEmail: 'smith@example.com', contactPhone: '555-1234', status: 'active' },
        { id: 'branch2', name: 'North Campus', location: '456 College Rd', contactPerson: 'Ms. Jones', contactEmail: 'jones@example.com', contactPhone: '555-5678', status: 'active' },
        { id: 'branch3', name: 'Online Academy', location: 'Virtual', contactPerson: 'Dr. Online', contactEmail: 'online@example.com', contactPhone: '555-0000', status: 'inactive' },
      ];
      localStorage.setItem('mock_branches', JSON.stringify(branches));
    }
    return branches;
  },
  addBranch: async (branchData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    let branches = JSON.parse(localStorage.getItem('mock_branches')) || [];
    const newBranch = { ...branchData, id: `branch_${Date.now()}` };
    branches.push(newBranch);
    localStorage.setItem('mock_branches', JSON.stringify(branches));
    return { success: true, data: newBranch };
  },
  updateBranch: async (branchId, branchData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    let branches = JSON.parse(localStorage.getItem('mock_branches')) || [];
    branches = branches.map(b => (b.id === branchId ? { ...b, ...branchData } : b));
    localStorage.setItem('mock_branches', JSON.stringify(branches));
    return { success: true, data: branches.find(b => b.id === branchId) };
  },
  deleteBranch: async (branchId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    let branches = JSON.parse(localStorage.getItem('mock_branches')) || [];
    branches = branches.filter(b => b.id !== branchId);
    localStorage.setItem('mock_branches', JSON.stringify(branches));
    return { success: true };
  }
};

const BranchManagementPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isBranchFormOpen, setIsBranchFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const showToast = useCallback((message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  }, [setToastMessage, setToastSeverity, setToastOpen]);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mockBranchService.getBranches();
      setBranches(data);
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch branches.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setBranches, showToast]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleAddBranch = () => {
    setEditingBranch(null);
    setIsBranchFormOpen(true);
  };

  const handleEditBranch = (branch) => {
    setEditingBranch(branch);
    setIsBranchFormOpen(true);
  };

  const handleDeleteBranch = (branch) => {
    setBranchToDelete(branch);
    setConfirmDialogOpen(true);
  };

  const confirmBranchDelete = async () => {
    if (!branchToDelete) return;
    setIsDeleting(true);
    try {
      await mockBranchService.deleteBranch(branchToDelete.id);
      showToast(`Branch "${branchToDelete.name}" deleted successfully.`, 'success');
      fetchBranches();
    } catch (err) {
      showToast(err.message || "Failed to delete branch.", 'error');
    } finally {
      setIsDeleting(false);
      setConfirmDialogOpen(false);
      setBranchToDelete(null);
    }
  };

  const handleBranchFormSubmit = async (values, isEditingMode, branchId) => {
    try {
      if (isEditingMode) {
        await mockBranchService.updateBranch(branchId, values);
        showToast('Branch updated successfully!', 'success');
      } else {
        await mockBranchService.addBranch(values);
        showToast('Branch created successfully!', 'success');
      }
      setIsBranchFormOpen(false);
      fetchBranches();
      return true;
    } catch (apiError) {
      showToast(apiError.message || `Failed to ${isEditingMode ? 'update' : 'create'} branch.`, 'error');
      return false;
    }
  };

  const handleBranchFormClose = () => { // Removed unused submittedSuccessfully parameter
    setIsBranchFormOpen(false);
    setEditingBranch(null);
  };

  const columns = [
    { field: 'name', headerName: 'Branch Name', flex: 1, minWidth: 200 },
    { field: 'location', headerName: 'Location', flex: 1, minWidth: 250 },
    { field: 'contactPerson', headerName: 'Contact Person', width: 180 },
    { field: 'contactEmail', headerName: 'Contact Email', width: 200 },
    { field: 'contactPhone', headerName: 'Contact Phone', width: 150 },
    { field: 'status', headerName: 'Status', width: 100, renderCell: (params) => <Chip label={params.value} size="small" color={params.value === 'active' ? 'success' : 'error'} /> },
    { field: 'actions', headerName: 'Actions', width: 130, sortable: false, filterable: false, renderCell: (params) => (
        <Box>
          <Tooltip title="Edit Branch"><IconButton onClick={() => handleEditBranch(params.row)} size="small"><EditIcon /></IconButton></Tooltip>
          <Tooltip title="Delete Branch"><IconButton onClick={() => handleDeleteBranch(params.row)} size="small" color="error"><DeleteIcon /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  if (loading && branches.length === 0) {
    return <LoadingSpinner fullScreen message="Loading branches..." />;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2, position: 'sticky', top: 0, zIndex: 1100, backgroundColor: 'background.paper' }}>
        <Typography variant="h5" component="h1">Branch Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddBranch}>Add Branch</Button>
      </Box>

      {error && !loading && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ width: '100%', overflow: 'hidden' }}>
        <StyledDataGrid
          rows={branches}
          columns={columns}
          loading={loading}
          error={null}
          getRowId={(row) => row.id}
          minHeight={500}
        />
      </Box>

      <BranchFormDialog
        open={isBranchFormOpen}
        onClose={handleBranchFormClose}
        branch={editingBranch}
        onSubmit={handleBranchFormSubmit}
      />

      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmBranchDelete}
        title="Confirm Deletion"
        contentText={`Are you sure you want to delete branch "${branchToDelete?.name}"? This action cannot be undone.`}
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

export default BranchManagementPage;
