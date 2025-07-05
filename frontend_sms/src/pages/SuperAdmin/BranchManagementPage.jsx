import React, { useState, useEffect, useCallback } from 'react';
// Removed Box, Typography, Button, Alert from @mui/material
// Kept IconButton, Tooltip, Chip from @mui/material for the DataGrid's custom cell renderers for now
import { IconButton, Tooltip, Chip } from '@mui/material';
import { Container, Button as BsButton, Alert as BsAlert, Row, Col } from 'react-bootstrap'; // Added BsButton and BsAlert
import AddIcon from '@mui/icons-material/Add'; // Keep MUI icon for now
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import StyledDataGrid from '../../components/common/StyledDataGrid'; // Still MUI based internally
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmationDialog from '../../components/common/ConfirmationDialog'; // Already Bootstrap
import NotificationToast from '../../components/common/NotificationToast';   // Already Bootstrap
import BranchFormDialog from './BranchFormDialog'; // Already Bootstrap based on UserFormDialog conversion pattern

import styles from './BranchManagementPage.module.css'; // Import CSS module

// Mock service (remains unchanged)
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

  const handleBranchFormClose = () => {
    setIsBranchFormOpen(false);
    setEditingBranch(null);
  };

  const columns = [
    { field: 'name', headerName: 'Branch Name', flex: 1, minWidth: 200 },
    { field: 'location', headerName: 'Location', flex: 1, minWidth: 250 },
    { field: 'contactPerson', headerName: 'Contact Person', width: 180 },
    { field: 'contactEmail', headerName: 'Contact Email', width: 200 },
    { field: 'contactPhone', headerName: 'Contact Phone', width: 150 },
    { field: 'status', headerName: 'Status', width: 100,
      renderCell: (params) => <Chip label={params.value} size="small" color={params.value === 'active' ? 'success' : 'error'} />
    },
    { field: 'actions', headerName: 'Actions', width: 130, sortable: false, filterable: false,
      renderCell: (params) => (
        // This Box and its children are still MUI. To be addressed when/if StyledDataGrid is converted.
        <div style={{ display: 'flex' }}> {/* Temporary div, ideally Bootstrap icons or custom components */}
          <Tooltip title="Edit Branch">
            <IconButton onClick={() => handleEditBranch(params.row)} size="small">
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Branch">
            <IconButton onClick={() => handleDeleteBranch(params.row)} size="small" color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </div>
      ),
    },
  ];

  if (loading && branches.length === 0) {
    return <LoadingSpinner fullScreen message="Loading branches..." />; // This component also needs conversion eventually
  }

  return (
    <Container fluid className="p-3 p-md-4"> {/* Outermost container with padding */}
      <div className={styles.pageHeader}> {/* Sticky header div */}
        <h2 className={styles.pageTitle}>Branch Management</h2>
        <BsButton variant="primary" onClick={handleAddBranch}>
          <AddIcon fontSize="small" style={{ marginRight: '0.5rem' }} /> {/* MUI Icon with manual spacing */}
          Add Branch
        </BsButton>
      </div>

      {error && !loading && <BsAlert variant="danger" className="mt-3">{error}</BsAlert>}

      {/* This Box wrapper for StyledDataGrid was from previous sticky header work, and is fine. */}
      <div style={{ width: '100%', overflow: 'hidden' }} className="mt-3">
        <StyledDataGrid
          rows={branches}
          columns={columns}
          loading={loading}
          error={null} // Error prop for StyledDataGrid, not the page error
          getRowId={(row) => row.id}
          minHeight={500}
        />
      </div>

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
        confirmButtonColor="error" // This maps to 'danger' in our Bootstrap ConfirmationDialog
      />

      <NotificationToast
        open={toastOpen}
        message={toastMessage}
        severity={toastSeverity}
        handleClose={() => setToastOpen(false)}
      />
    </Container>
  );
};

export default BranchManagementPage;
