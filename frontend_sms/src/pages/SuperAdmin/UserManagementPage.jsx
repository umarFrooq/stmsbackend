import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, Chip, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import StyledDataGrid from '../../components/common/StyledDataGrid';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import UserFormDialog from './UserFormDialog';
import NotificationToast from '../../components/common/NotificationToast';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import debounce from 'lodash.debounce';

// Import actual user service
import userService from '../../services/userService';
// TODO: Import services for fetching roles and branches if they exist
// import roleService from '../../services/roleService';
// import branchService from '../../services/branchService';


// Define roles SuperAdmin can manage - typically all roles including 'superAdmin' itself
const SUPERADMIN_MANAGEABLE_ROLES = ['superAdmin', 'admin', 'teacher', 'student', 'parent'];

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
  const [availableBranches, setAvailableBranches] = useState([]); // For branch filter dropdown
  const [loadingBranches, setLoadingBranches] = useState(false);

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [totalUsers, setTotalUsers] = useState(0);

  const { user: currentUser } = useAuthStore(); // For schoolId if superadmin is school-scoped

  // const [availableRolesForFilter, setAvailableRolesForFilter] = useState(SUPERADMIN_MANAGEABLE_ROLES); // If needed for a dropdown

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const fetchUsers = useCallback(async (
    cPage = paginationModel.page,
    cSearch = searchTerm,
    cStatus = filterStatus,
    cRole = filterRole,
    cBranch = filterBranch
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: cPage + 1,
        limit: paginationModel.pageSize,
        sortBy: 'fullname:asc', // Default sort, can be made dynamic
      };
      if (cSearch) {
        params.search = cSearch; // Generic search term
      }
      if (cStatus) {
        params.status = cStatus;
      }
      if (cRole) {
        params.role = cRole;
      }
      if (cBranch) {
        params.branchId = cBranch;
      }
      // SuperAdmin might be global (rootUser like) or school-scoped.
      // If school-scoped, their schoolId should be sent if backend doesn't auto-scope v2/users/admin based on token.
      // The v2 user route has schoolScopeMiddleware, so backend should handle scoping for superadmin.
      // If a rootUser uses this page (hypothetically), they might need to select a school.
      // For now, assuming backend handles superadmin's school scope.

      const response = await userService.getAllUsers(params);
      if (response && response.data && Array.isArray(response.data.results)) {
        setUsers(response.data.results);
        setTotalUsers(response.data.totalResults || 0);
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
  };

  // TODO: Fetch available roles and branches for the form
  // Fetch available branches for the filter dropdown
  useEffect(() => {
    setLoadingBranches(true);
    // Assuming branchApi.getBranches can fetch all relevant branches
    // (e.g., for the superadmin's school or all if superadmin is global)
    // This might need to pass schoolId if superadmin is scoped and API needs it.
    // const branchParams = currentUser.schoolScope ? { schoolId: currentUser.schoolScope, limit: 500 } : { limit: 500 };
    const branchParams = { limit: 500, sortBy: 'name:asc' }; // Fetch a large number of branches

    // Using branchApi from previous task or assuming a similar one exists
    // For consistency, let's assume a getBranches function similar to the one in branchApi.js
    // If it's from branchService.js, ensure it's imported.
    // import { getBranches as getBranchList } from '../../services/branchService'; // Example import
    // For now, using a placeholder. This should be replaced with actual branch fetching.
    const fetchBranchListForFilter = async () => {
        try {
            // const branchesData = await actualBranchFetchingService(branchParams);
            // setAvailableBranches(branchesData.results || []);
            // This part needs to be implemented with the correct branch service.
            // For now, I'll mock it or leave it to be filled.
            // Using the `branchApi.getBranches` from previous task for consistency.
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
  }, [currentUser?.schoolScope]);


  const debouncedFetchUsers = useCallback(debounce((s, st, r, b) => {
    setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset page to 0
    fetchUsers(0, s, st, r, b);
  }, 500), [fetchUsers]); // fetchUsers is stable due to its own useCallback deps

  useEffect(() => {
    // Initial fetch and when pagination model changes (page, pageSize)
    fetchUsers(paginationModel.page, searchTerm, filterStatus, filterRole, filterBranch);
  }, [paginationModel.page, paginationModel.pageSize]);
  // Note: Direct changes to searchTerm, filterStatus, etc., trigger fetches via their handlers.

  const handleSearchChange = (event) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    debouncedFetchUsers(newSearchTerm, filterStatus, filterRole, filterBranch);
  };

  const handleFilterChange = (setter, value) => {
    setter(value);
    setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset page
    // Determine which filter changed to pass correct values to fetchUsers
    // This is a bit verbose, can be refactored if many filters
    if (setter === setFilterStatus) {
      fetchUsers(0, searchTerm, value, filterRole, filterBranch);
    } else if (setter === setFilterRole) {
      fetchUsers(0, searchTerm, filterStatus, value, filterBranch);
    } else if (setter === setFilterBranch) {
      fetchUsers(0, searchTerm, filterStatus, filterRole, value);
    }
  };


  const handleAddUser = () => {
    setEditingUser(null);
    setIsUserFormOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsUserFormOpen(true);
  };

  const handleDeleteUser = (user) => {
    // Potentially add a check here if a SuperAdmin should not delete their own account
    // For now, the backend should handle such logic if needed.
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
      fetchUsers(paginationModel.page, searchTerm);
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
      fetchUsers(paginationModel.page, searchTerm);
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
        color={params.value === 'superAdmin' ? 'secondary' : params.value === 'admin' ? 'primary' : 'default'}/>
    },
    { field: 'branch', headerName: 'Branch/Campus', width: 150 }, // Display branch name
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
          {params.row.role !== 'superAdmin' && ( // Prevent deleting superAdmin for safety in mock
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

  if (loading && users.length === 0) {
    return <LoadingSpinner fullScreen message="Loading users..." />;
  }

// Placeholder for role enum, ideally from a central config
const allRolesForFilter = ['superAdmin', 'admin', 'teacher', 'student', 'parent', 'rootUser']; // Example, adjust as per actual system roles
const userStatusEnum = { ACTIVE: 'active', INACTIVE: 'inactive' };


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
  const [availableBranches, setAvailableBranches] = useState([]); // For branch filter dropdown
  const [loadingBranches, setLoadingBranches] = useState(false);

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [totalUsers, setTotalUsers] = useState(0);

  const { user: currentUser } = useAuthStore(); // For schoolId if superadmin is school-scoped


  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const fetchUsers = useCallback(async (
    cPage = paginationModel.page,
    cSearch = searchTerm,
    cStatus = filterStatus,
    cRole = filterRole,
    cBranch = filterBranch
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: cPage + 1,
        limit: paginationModel.pageSize,
        sortBy: 'fullname:asc',
      };
      if (cSearch) params.search = cSearch;
      if (cStatus) params.status = cStatus;
      if (cRole) params.role = cRole;
      if (cBranch) params.branchId = cBranch;

      // School scoping for SuperAdmin should be handled by backend via schoolScopeMiddleware
      // or if SuperAdmin is global like rootUser, they might need a school selector (not implemented here)

      const response = await userService.getAllUsers(params);
      if (response && response.data && Array.isArray(response.data.results)) {
        setUsers(response.data.results);
        setTotalUsers(response.data.totalResults || 0);
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
  }, [paginationModel.page, paginationModel.pageSize]); // Removed other deps, they are passed as args now by callers

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


  const debouncedFetchUsers = useCallback(debounce((s, st, r, b) => {
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    fetchUsers(0, s, st, r, b);
  }, 500), [fetchUsers]);

  useEffect(() => {
    fetchUsers(paginationModel.page, searchTerm, filterStatus, filterRole, filterBranch);
  }, [paginationModel.page, paginationModel.pageSize, fetchUsers]); // Added fetchUsers as dependency

  const handleSearchChange = (event) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    debouncedFetchUsers(newSearchTerm, filterStatus, filterRole, filterBranch);
  };

  const handleFilterChange = (filterTypeChanged, newValue) => {
    setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset page

    let newSearchTerm = searchTerm;
    let newStatus = filterStatus;
    let newRole = filterRole;
    let newBranch = filterBranch;

    if (filterTypeChanged === 'status') {
      setFilterStatus(newValue);
      newStatus = newValue;
    } else if (filterTypeChanged === 'role') {
      setFilterRole(newValue);
      newRole = newValue;
    } else if (filterTypeChanged === 'branch') {
      setFilterBranch(newValue);
      newBranch = newValue;
    }
    // Search term changes are handled by handleSearchChange with debouncing
    fetchUsers(0, newSearchTerm, newStatus, newRole, newBranch);
  };

  const handleStatusFilterChange = (event) => handleFilterChange('status', event.target.value);
  const handleRoleFilterChange = (event) => handleFilterChange('role', event.target.value);
  const handleBranchFilterChange = (event) => handleFilterChange('branch', event.target.value);; // Added semicolon


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
      fetchUsers(paginationModel.page, searchTerm, filterStatus, filterRole, filterBranch);
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
      fetchUsers(paginationModel.page, searchTerm, filterStatus, filterRole, filterBranch);
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
        color={params.value === 'superAdmin' ? 'secondary' : params.value === 'admin' ? 'primary' : 'default'}/>
    },
    {
      field: 'branch',
      headerName: 'Branch/Campus',
      width: 180,
      valueGetter: (params) => params.row.branchId?.name || 'N/A' // Assuming branchId is populated with name
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

      {/* Filter and Search UI */}
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
                {Object.entries(userStatusEnum).map(([key, value]) => (
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
                {allRolesForFilter.map((role) => (
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

      {error && !loading && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}

      <StyledDataGrid
        rows={users}
        columns={columns}
        loading={loading}
        error={null} // Error is handled above the grid for general fetch errors
        getRowId={(row) => row.id}
        minHeight={500}
        // sx={{ p: 0 }} // Remove padding if Paper from StyledDataGrid has it
      />

      <UserFormDialog
        open={isUserFormOpen}
        onClose={handleUserFormClose}
        user={editingUser}
        onSubmit={handleUserFormSubmit}
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
