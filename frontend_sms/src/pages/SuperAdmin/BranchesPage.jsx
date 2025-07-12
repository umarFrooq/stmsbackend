import React, { useState, useCallback, useEffect } from 'react';
import { Container, Typography, Alert, Snackbar } from '@mui/material';
import BranchList from '../../components/branch/BranchList.jsx';
import BranchForm from '../../components/branch/BranchForm.jsx';
import { branchApi } from '../../services';
import { TextField, Select, MenuItem, FormControl, InputLabel, Box, Grid } from '@mui/material'; // Added imports for filter UI
import debounce from 'lodash.debounce'; // For debouncing search input

// Assuming your enums are available, e.g.
// import { braches as branchTypeEnum } from '../../../../config/enums'; // Adjust path as needed from project root
// For now, let's define them here for simplicity if not easily importable
const branchTypeEnum = { MAIN: 'main', SUB: 'sub' };
const branchStatusEnum = { ACTIVE: 'active', INACTIVE: 'inactive' };


const BranchesPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // For list loading errors

  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // --- Search and Filter State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // 'active', 'inactive', or '' for all
  const [filterType, setFilterType] = useState('');   // 'main', 'sub', or '' for all

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10); // Default to 10
  const [totalBranches, setTotalBranches] = useState(0);

  const fetchBranchesList = useCallback(async (currentPage = page, currentSearch = searchTerm, currentStatus = filterStatus, currentType = filterType) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage + 1, // API expects page to be 1-indexed
        limit: rowsPerPage,
        sortBy: 'name:asc', // Default sort
      };
      if (currentSearch) {
        params.search = currentSearch;
      }
      if (currentStatus) {
        params.status = currentStatus;
      }
      if (currentType) {
        params.type = currentType;
      }

      const data = await branchApi.getBranches(params);
      setBranches(data.results || []);
      setTotalBranches(data.totalResults || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch branches.');
      setBranches([]);
      setTotalBranches(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, filterStatus, filterType]); // Include all dependencies that trigger re-fetch

  // Debounced version of fetchBranchesList specifically for search term changes
  const debouncedFetchBranches = useCallback(debounce((newSearchTerm) => {
    setPage(0); // Reset to first page on new search
    fetchBranchesList(0, newSearchTerm, filterStatus, filterType);
  }, 500), [filterStatus, filterType, rowsPerPage, fetchBranchesList]); // fetchBranchesList is now stable due to its own useCallback deps

  useEffect(() => {
    // Initial fetch, and fetch when page or rowsPerPage changes directly
    fetchBranchesList(page, searchTerm, filterStatus, filterType);
  }, [page, rowsPerPage]); // Note: searchTerm, filterStatus, filterType changes are handled by their respective handlers triggering fetch or debounced fetch

  // Handlers for filter changes
  const handleSearchChange = (event) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    debouncedFetchBranches(newSearchTerm);
  };

  const handleStatusChange = (event) => {
    const newStatus = event.target.value;
    setFilterStatus(newStatus);
    setPage(0); // Reset to first page
    fetchBranchesList(0, searchTerm, newStatus, filterType);
  };

  const handleTypeChange = (event) => {
    const newType = event.target.value;
    setFilterType(newType);
    setPage(0); // Reset to first page
    fetchBranchesList(0, searchTerm, filterStatus, newType);
  };


  const handlePageChange = (event, newPage) => {
    setPage(newPage);
    // fetchBranchesList will be called by useEffect due to page change
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
        await branchApi.deleteBranch(branchId);
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
        await branchApi.updateBranch(editingBranch.id || editingBranch._id, branchData); // Handle _id from mongo
        setSnackbar({ open: true, message: 'Branch updated successfully!', severity: 'success' });
      } else {
        await branchApi.createBranch(branchData);
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

      {/* Filter and Search Controls */}
      <Box sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: '4px' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Search (Name/Code)"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={handleStatusChange}
                label="Status"
              >
                <MenuItem value=""><em>All Statuses</em></MenuItem>
                {Object.entries(branchStatusEnum).map(([key, value]) => (
                  <MenuItem key={key} value={value}>{key.charAt(0) + key.slice(1).toLowerCase()}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel>Type</InputLabel>
              <Select
                value={filterType}
                onChange={handleTypeChange}
                label="Type"
              >
                <MenuItem value=""><em>All Types</em></MenuItem>
                 {Object.entries(branchTypeEnum).map(([key, value]) => (
                  <MenuItem key={key} value={value}>{key.charAt(0) + key.slice(1).toLowerCase()}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

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
