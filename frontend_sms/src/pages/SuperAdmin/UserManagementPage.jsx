import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, Chip, Alert, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import StyledDataGrid from '../../components/common/StyledDataGrid';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import UserFormDialog from './UserFormDialog';
import NotificationToast from '../../components/common/NotificationToast';
import { TextField } from '@mui/material'; // Removed InputAdornment, SearchIcon if not used directly here
import debounce from 'lodash.debounce';

import userService from '../../services/userService';
import useAuthStore from '../../store/auth.store';
// Assuming branchApi.js will be used for fetching branches for filter
// import { getBranches as fetchBranchesForFilterService } from '../../services/branchApi';

const ALL_ROLES_FOR_FILTER = ['superAdmin', 'admin', 'teacher', 'student', 'parent', 'rootUser']; // Example
const USER_STATUS_ENUM = { ACTIVE: 'active', INACTIVE: 'inactive' };

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [availableBranches, setAvailableBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [totalUsers, setTotalUsers] = useState(0);

  const { user: currentUser } = useAuthStore();

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const fetchUsers = useCallback(async (
    cPage,
    cSearch,
    cStatus,
    cRole,
    cBranch,
    cLimit = paginationModel.pageSize // Use from closure if not passed
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: cPage + 1,
        limit: cLimit,
        sortBy: 'fullname:asc',
      };
      if (cSearch) params.search = cSearch;
      if (cStatus) params.status = cStatus;
      if (cRole) params.role = cRole;
      if (cBranch) params.branchId = cBranch;

      const response = await userService.getAllUsers(params);
      if (response && response.data && Array.isArray(response.data.results)) {
        setUsers(response.data.results);
        setTotalUsers(response.data.totalResults || 0);
      } else {
        console.error("Unexpected user list response structure:", response);
        setUsers([]);
        setTotalUsers(0);
        setError('Failed to fetch users: Unexpected response.');
        showToast('Failed to fetch users: Unexpected response.', 'error');
      }
    } catch (err) {
      const errorMessage = err.message || (err.data && err.data.message) || 'Failed to fetch users.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  }, [paginationModel.pageSize]); // Depends on pageSize from closure if cLimit not provided by caller.

  useEffect(() => {
    setLoadingBranches(true);
    const branchParams = { limit: 500, sortBy: 'name:asc' };
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
  }, []);

  const debouncedFetchUsers = useCallback(debounce((s, st, r, b, limit) => {
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    fetchUsers(0, s, st, r, b, limit);
  }, 500), [fetchUsers]);

  useEffect(() => {
    fetchUsers(paginationModel.page, searchTerm, filterStatus, filterRole, filterBranch, paginationModel.pageSize);
  }, [paginationModel.page, paginationModel.pageSize, searchTerm, filterStatus, filterRole, filterBranch, fetchUsers]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    // The useEffect above will catch the change in searchTerm and trigger debouncedFetchUsers indirectly
    // or we can call debouncedFetchUsers directly if we remove searchTerm from useEffect's deps
    // For simplicity with existing useEffect:
    // debouncedFetchUsers(event.target.value, filterStatus, filterRole, filterBranch, paginationModel.pageSize);
  };

  const handleFilterChange = (filterTypeChanged, newValue) => {
    // setPaginationModel(prev => ({ ...prev, page: 0 })); // Done by useEffect triggering fetch
    if (filterTypeChanged === 'status') {
      setFilterStatus(newValue);
    } else if (filterTypeChanged === 'role') {
      setFilterRole(newValue);
    } else if (filterTypeChanged === 'branch') {
      setFilterBranch(newValue);
    }
    // The main useEffect will pick up these state changes.
  };

  const handleStatusFilterChange = (event) => handleFilterChange('status', event.target.value);
  const handleRoleFilterChange = (event) => handleFilterChange('role', event.target.value);
  const handleBranchFilterChange = (event) => handleFilterChange('branch', event.target.value);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsUserFormOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsUserFormOpen(true);
  };

  const handleDeleteUser = (user) => {
    if (user.role === 'superAdmin' && users.filter(u => u.role === 'superAdmin').length <= 1) {
      showToast("Cannot delete the only SuperAdmin account.", "warning");
      return;
    }
    setUserToDelete(user);
    setConfirmDialogOpen(true);
  };

  const confirmUserDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await userService.deleteUser(userToDelete.id);
      showToast(`User "${userToDelete.fullname}" deleted successfully.`, 'success');
      fetchUsers(0, searchTerm, filterStatus, filterRole, filterBranch, paginationModel.pageSize); // Fetch from page 0
      setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset page
    } catch (err) {
      showToast(err.message || (err.data && err.data.message) || "Failed to delete user.", 'error');
    } finally {
      setIsDeleting(false);
      setConfirmDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleUserFormSubmit = async (values, isEditingMode, userId) => {
    try {
      if (isEditingMode) {
        await userService.updateUser(userId, values);
        showToast('User updated successfully!', 'success');
      } else {
        await userService.addUser(values);
        showToast('User created successfully!', 'success');
      }
      setIsUserFormOpen(false);
      fetchUsers(0, searchTerm, filterStatus, filterRole, filterBranch, paginationModel.pageSize); // Fetch from page 0
      setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset page
      return true;
    } catch (apiError) {
      showToast(apiError.message || (apiError.data && apiError.data.message) || `Failed to ${isEditingMode ? 'update' : 'create'} user.`, 'error');
      return false;
    }
  };

  const handleUserFormClose = () => {
    setIsUserFormOpen(false);
    setEditingUser(null);
  };

  const columns = [
    { field: 'fullname', headerName: 'Full Name', flex: 1, minWidth: 180 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: (params) => <Chip label={params.value} size="small"
        color={params.value === 'superAdmin' ? 'secondary' : params.value === 'admin' ? 'primary' : 'default'} />
    },
    {
      field: 'branch',
      headerName: 'Branch/Campus',
      width: 180,
      valueGetter: (params) => params.row.branchId?.name || 'N/A'
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => <Chip label={params.value} size="small" color={params.value === 'active' ? 'success' : 'error'} />
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit User">
            <IconButton onClick={() => handleEditUser(params.row)} size="small">
              <EditIcon />
            </IconButton>
          </Tooltip>
          {params.row.role !== 'superAdmin' && (
            <Tooltip title="Delete User">
              <IconButton onClick={() => handleDeleteUser(params.row)} size="small" color="error">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  if (loading && users.length === 0 && !searchTerm && !filterStatus && !filterRole && !filterBranch) {
    return <LoadingSpinner fullScreen message="Loading users..." />;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" component="h1">
          User Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddUser}>
          Add User
        </Button>
      </Box>

      <Box sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: '4px' }}>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search (Name, Email, Phone)"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} onChange={handleStatusFilterChange} label="Status">
                <MenuItem value=""><em>All Statuses</em></MenuItem>
                {Object.entries(USER_STATUS_ENUM).map(([key, value]) => (
                  <MenuItem key={key} value={value}>{key.charAt(0) + key.slice(1).toLowerCase()}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel>Role</InputLabel>
              <Select value={filterRole} onChange={handleRoleFilterChange} label="Role">
                <MenuItem value=""><em>All Roles</em></MenuItem>
                {ALL_ROLES_FOR_FILTER.map((role) => (
                  <MenuItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" variant="outlined" disabled={loadingBranches}>
              <InputLabel>Branch</InputLabel>
              <Select value={filterBranch} onChange={handleBranchFilterChange} label="Branch">
                <MenuItem value=""><em>All Branches</em></MenuItem>
                {loadingBranches && <MenuItem value="" disabled><em>Loading branches...</em></MenuItem>}
                {!loadingBranches && availableBranches.length === 0 && <MenuItem value="" disabled><em>No branches found</em></MenuItem>}
                {availableBranches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {error && !loading && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <StyledDataGrid
        rows={users}
        columns={columns}
        loading={loading}
        error={null}
        getRowId={(row) => row.id}
        minHeight={500}
        rowCount={totalUsers}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        paginationMode="server"
      />

      <UserFormDialog
        open={isUserFormOpen}
        onClose={handleUserFormClose}
        user={editingUser}
        onSubmit={handleUserFormSubmit}
        availableRoles={SUPERADMIN_MANAGEABLE_ROLES}
      />

      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmUserDelete}
        title="Confirm Deletion"
        contentText={`Are you sure you want to delete user "${userToDelete?.fullname}"? This action cannot be undone.`}
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

export default UserManagementPage;
