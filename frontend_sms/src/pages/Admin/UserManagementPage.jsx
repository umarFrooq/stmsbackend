import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, Chip, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import StyledDataGrid from '../../components/common/StyledDataGrid';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
// Re-use SuperAdmin's UserFormDialog for now, but ideally, it might have slight variations
// or be passed different role/branch options.
import UserFormDialog from '../SuperAdmin/UserFormDialog';
import NotificationToast from '../../components/common/NotificationToast';
import {  InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import debounce from 'lodash.debounce';

// Import actual user service
import userService from '../../services/userService';

import { TextField, Select, MenuItem, FormControl, InputLabel,  Grid } from '@mui/material'; // Added imports for filter UI
import useAuthStore from '../../store/auth.store'; // For current user context if needed

const ADMIN_MANAGEABLE_ROLES = ['teacher', 'student', 'parent', 'admin']; // Define manageable roles for Admin
// Placeholder for enums, should be imported from a central config if possible
const userStatusEnum = { ACTIVE: 'active', INACTIVE: 'inactive' };


// Added imports for filter UI elements
// import { TextField, Select, MenuItem, FormControl, InputLabel, Box, Grid } from '@mui/material'; 
// useAuthStore is already imported
// debounce is already imported

// const ADMIN_MANAGEABLE_ROLES = ['teacher', 'student', 'parent', 'admin']; // Defined
// const userStatusEnum = { ACTIVE: 'active', INACTIVE: 'inactive' }; // Defined

const AdminUserManagementPage = () => {
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
    cPage = paginationModel.page,
    cSearch = searchTerm,
    cStatus = filterStatus,
    cBranch = filterBranch
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: cPage + 1,
        limit: paginationModel.pageSize,
        role: ADMIN_MANAGEABLE_ROLES.join(','), // Crucial for Admin page
        sortBy: 'fullname:asc',
      };
      if (cSearch) params.search = cSearch;
      if (cStatus) params.status = cStatus;
      if (cBranch) params.branchId = cBranch;

      const response = await userService.getAllUsers(params);
      if (response && response.data && Array.isArray(response.data.results)) {
        setUsers(response.data.results);
        setTotalUsers(response.totalResults || 0);
      } else {
        console.error("Unexpected response structure:", response);
        setUsers([]);
        setTotalUsers(0);
        setError('Failed to fetch users: Unexpected response structure.');
        showToast('Failed to fetch users: Unexpected response structure.', 'error');
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
  }, [paginationModel.page, paginationModel.pageSize]); // Removed other deps, they are passed as args

 useEffect(() => {
    setLoadingBranches(true);
    const branchParams = { limit: 500, sortBy: 'name:asc' };
    const fetchBranchListForFilter = async () => {
        try {
            const branchesResponse = await (await import('../../services/branchApi.js')).getBranches(branchParams);
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


  const debouncedFetchUsers = useCallback(debounce((s, st, b) => {
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    fetchUsers(0, s, st, b);
  }, 500), [fetchUsers]);


  useEffect(() => {
    fetchUsers(paginationModel.page, searchTerm, filterStatus, filterBranch);
  }, [paginationModel.page, paginationModel.pageSize, fetchUsers]);

  const handleSearchChange = (event) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    debouncedFetchUsers(newSearchTerm, filterStatus, filterBranch);
  };

  const handleFilterChange = (setterFunction, newValue) => {
    setterFunction(newValue);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    const currentFilters = {s: searchTerm, st: filterStatus, b: filterBranch};
    if(setterFunction === setSearchTerm) currentFilters.s = newValue; // Should not happen here
    else if(setterFunction === setFilterStatus) currentFilters.st = newValue;
    else if(setterFunction === setFilterBranch) currentFilters.b = newValue;
    fetchUsers(0, currentFilters.s, currentFilters.st, currentFilters.b);
  };
  const handleStatusFilterChange = (event) => handleFilterChange(setFilterStatus, event.target.value);
  const handleBranchFilterChange = (event) => handleFilterChange(setFilterBranch, event.target.value);


  const handleAddUser = () => {
    setEditingUser(null);
    setIsUserFormOpen(true);
  };

  const handleEditUser = (user) => {
    if (!ADMIN_MANAGEABLE_ROLES.includes(user.role)) {
        showToast("You do not have permission to edit this user's role.", "warning");
        return;
    }
    setEditingUser(user);
    setIsUserFormOpen(true);
  };

  const handleDeleteUser = (user) => {
    if (!ADMIN_MANAGEABLE_ROLES.includes(user.role)) {
        showToast("You do not have permission to delete this user.", "warning");
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
      fetchUsers(paginationModel.page, searchTerm, filterStatus, filterBranch);
    } catch (err) {
      showToast(err.message || (err.data && err.data.message) || "Failed to delete user.", 'error');
    } finally {
      setIsDeleting(false);
      setConfirmDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleUserFormSubmit = async (values, isEditingMode, userId) => {
    if (!ADMIN_MANAGEABLE_ROLES.includes(values.role)) {
        showToast(`Admin cannot ${isEditingMode ? 'edit to' : 'create'} users with the role: ${values.role}. Allowed roles: ${ADMIN_MANAGEABLE_ROLES.join(', ')}.`, "error");
        return false;
    }
    try {
      if (isEditingMode) {
        await userService.updateUser(userId, values); 
        showToast('User updated successfully!', 'success');
      } else {
        await userService.addUser(values); 
        showToast('User created successfully!', 'success');
      }
      setIsUserFormOpen(false);
      fetchUsers(paginationModel.page, searchTerm, filterStatus, filterBranch);
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
      renderCell: (params) => <Chip label={params.value} size="small" />
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
          <Tooltip title="Delete User">
            <IconButton onClick={() => handleDeleteUser(params.row)} size="small" color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  if (loading && users.length === 0 && !searchTerm && !filterStatus && !filterBranch) {
    return <LoadingSpinner fullScreen message="Loading users..." />;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" component="h1">
          User Management (Teachers, Students, Parents, Admins)
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddUser}>
          Add User
        </Button>
      </Box>

      {/* Filter and Search UI */}
      <Box sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: '4px' }}>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12} sm={6} md={4}> {/* Adjusted grid size */}
            <TextField
              fullWidth
              label="Search (Name, Email, Phone)"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}> {/* Adjusted grid size */}
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} onChange={handleStatusFilterChange} label="Status">
                <MenuItem value=""><em>All Statuses</em></MenuItem>
                {Object.entries(userStatusEnum).map(([key, value]) => (
                  <MenuItem key={key} value={value}>{key.charAt(0) + key.slice(1).toLowerCase()}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}> {/* Adjusted grid size */}
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


      {error && !loading && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}

      <StyledDataGrid
        rows={users}
        columns={columns}
        loading={loading}
        error={null}
        getRowId={(row) => row.id}
        minHeight={500}
      />

      {/* For Admin, UserFormDialog should be restricted to roles like teacher, student, parent */}
      {/* This can be handled by passing allowed roles to UserFormDialog or creating a specific AdminUserFormDialog */}
      <UserFormDialog
        open={isUserFormOpen}
        onClose={handleUserFormClose}
        user={editingUser}
        onSubmit={handleUserFormSubmit}
        // Pass props to UserFormDialog to restrict role selection if needed:
        availableRoles={['teacher', 'student', 'parent']}
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

export default AdminUserManagementPage;
