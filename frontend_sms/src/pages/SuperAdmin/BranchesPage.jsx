import React, { useState, useCallback, useEffect } from 'react';
import { Container, Typography, Alert, Snackbar } from '@mui/material';
import BranchList from '../../components/branch/BranchList.jsx';
import BranchForm from '../../components/branch/BranchForm.jsx';
import { getBranches, createBranch, updateBranch, deleteBranch as deleteBranchApi } from '../../services/branchApi.js';
// Assuming your enums are available, e.g.
// import { branches as branchEnumValues } from '../../../config/enums'; // Adjust path as needed from project root

const BranchesPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // For list loading errors

  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalBranches, setTotalBranches] = useState(0);

  const fetchBranchesList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // API expects page to be 1-indexed
      const data = await getBranches({ page: page + 1, limit: rowsPerPage, sortBy: 'name:asc' });
      setBranches(data.results || []);
      setTotalBranches(data.totalResults || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch branches.');
      setBranches([]); // Clear branches on error
      setTotalBranches(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchBranchesList();
  }, [fetchBranchesList]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page
  };

  const handleCreateNew = useCallback(() => {
    setEditingBranch(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((branch) => {
    // Ensure address is an object, even if null/undefined from API
    const branchToEdit = {
      ...branch,
      address: branch.address || { street: '', city: '', postalCode: '', country: '' }
    };
    setEditingBranch(branchToEdit);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async (branchId) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      setLoading(true); // Can use a specific loading state for delete if preferred
      try {
        await deleteBranchApi(branchId);
        setSnackbar({ open: true, message: 'Branch deleted successfully!', severity: 'success' });
        fetchBranchesList(); // Refresh list
      } catch (err) {
        setSnackbar({ open: true, message: err.message || 'Failed to delete branch.', severity: 'error' });
        setLoading(false);
      }
    }
  }, [fetchBranchesList]);

  const handleFormSubmit = useCallback(async (branchData) => {
    setLoading(true); // Indicate loading state for form submission
    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id || editingBranch._id, branchData); // Handle _id from mongo
        setSnackbar({ open: true, message: 'Branch updated successfully!', severity: 'success' });
      } else {
        await createBranch(branchData);
        setSnackbar({ open: true, message: 'Branch created successfully!', severity: 'success' });
      }
      setShowForm(false);
      setEditingBranch(null);
      fetchBranchesList(); // Refresh list
    } catch (err) {
      // The error from branchApi should be an object with a message property
      const errorMessage = err.message || (err.error ? `${err.error}: ${err.message}` : `Failed to ${editingBranch ? 'update' : 'create'} branch.`);
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      setLoading(false); // Ensure loading is turned off on error
    }
  }, [editingBranch, fetchBranchesList]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingBranch(null);
  }, []);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // const branchTypeValues = Object.values(branchEnumValues || { MAIN: 'main', SUB: 'sub'}); // Fallback if enum not loaded

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="h1">
        Branch Management
      </Typography>

      {showForm ? (
        <BranchForm
          initialData={editingBranch}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          // Pass the actual enum values for the 'type' field
          // branchTypesConfig={branchEnumValues} // Example: { MAIN: 'Main', SUB: 'Sub-Branch' }
          // The BranchForm component itself will map these to {value, label} pairs
        />
      ) : (
        <BranchList
          branches={branches}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreate={handleCreateNew}
          loading={loading}
          error={error}
          page={page}
          rowsPerPage={rowsPerPage}
          totalBranches={totalBranches}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      )}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BranchesPage;
