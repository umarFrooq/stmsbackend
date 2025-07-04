import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, Chip, Alert, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import StyledDataGrid from '../../components/common/StyledDataGrid';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import UserFormDialog from '../SuperAdmin/UserFormDialog';
import NotificationToast from '../../components/common/NotificationToast';
import { TextField } from '@mui/material';
import debounce from 'lodash.debounce';

import userService from '../../services/userService';
import { getGrades as fetchGradesService } from '../../services/gradeService'; // Import grade service
import useAuthStore from '../../store/auth.store';
// import { getBranches as fetchBranchesForFilterService } from '../../services/branchApi';


const ADMIN_MANAGEABLE_ROLES = ['teacher', 'student', 'parent', 'admin'];
const USER_STATUS_ENUM = { ACTIVE: 'active', INACTIVE: 'inactive' };

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
  const [filterEmail, setFilterEmail] = useState('');
  const [filterPhone, setFilterPhone] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [availableBranches, setAvailableBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [availableGrades, setAvailableGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [totalUsers, setTotalUsers] = useState(0);

  const { user: currentUser } = useAuthStore();

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  // Initial fetchUsers structure (to be refined by a subsequent diff)
  const fetchUsersOriginal = async (
    cPage = paginationModel.page,
    cSearch = searchTerm,
    cStatus = filterStatus,
    cBranch = filterBranch,
    cLimit = paginationModel.pageSize
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: cPage + 1,
        limit: cLimit,
        // role: ADMIN_MANAGEABLE_ROLES.join(','),
        // sortBy: 'fullname:asc',
      };
      if (cSearch) params.search = cSearch;
      if (cStatus) params.status = cStatus;
      if (cBranch) params.branchId = cBranch;

      const response = await userService.getAllUsers(params);
      if (response && response.data && Array.isArray(response.data.results)) {
        setUsers(response.data.results);
        setTotalUsers(response.data.totalResults || 0);
      } else {
        console.error("Unexpected response structure (Admin):", response);
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
  };
  // fetchUsersOriginal was a placeholder. This is the refined fetchUsers.
  const fetchUsers = useCallback(async (
    cPage,
    cSearch, // Will be used for name search
    cStatus,
    cBranch,
    cLimit = paginationModel.pageSize,
    cEmail, // New parameter for email filter
    cPhone,  // New parameter for phone filter
    cGrade // New parameter for grade filter
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: cPage + 1,
        limit: cLimit,
        // role: ADMIN_MANAGEABLE_ROLES.join(','),
        // sortBy: 'fullname:asc',
      };
      if (cSearch) params.search = cSearch; // Backend handles this as name search ideally
      if (cStatus) params.status = cStatus;
      if (cBranch) params.branchId = cBranch;
      if (cEmail) params.email = cEmail;
      if (cPhone) params.phone = cPhone;
      if (cGrade) params.gradeId = cGrade; // Add gradeId to params if provided

      const response = await userService.getAllUsers(params);
      if (response && response.data && Array.isArray(response.data.results)) {
        setUsers(response.data.results);
        setTotalUsers(response.data.totalResults || 0);
      } else {
        console.error("Unexpected response structure (Admin):", response);
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
  }, [paginationModel.pageSize]); // Stable: depends on pageSize for default cLimit. userService is stable.

  useEffect(() => {
    // Fetch Branches
    setLoadingBranches(true);
    const branchParams = { limit: 500, sortBy: 'name:asc' }; // Assuming admin is scoped by backend
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

    // Fetch Grades
    setLoadingGrades(true);
    const gradeParams = { limit: 500, sortBy: 'title:asc' }; // Assuming admin is scoped by backend
                                                          // and grades might be titled 'Grade X' or similar
    const fetchGradeListForFilter = async () => {
      try {
        const gradesResponse = await fetchGradesService(gradeParams);
        setAvailableGrades(gradesResponse.results || []);
      } catch (e) {
        showToast('Failed to load grades for filter.', 'error');
        setAvailableGrades([]);
      } finally {
        setLoadingGrades(false);
      }
    };
    fetchGradeListForFilter();
  }, []); // Runs once on mount

  // This useEffect is the single source of truth for triggering data fetches.
  useEffect(() => {
    // Debounce logic for searchTerm will be handled by how setSearchTerm is called if needed,
    // or by having a separate debounced effect for searchTerm that then calls fetchUsers.
    // For now, direct fetch on any change including searchTerm for simplicity of this effect.
    // If direct fetch on searchTerm is too much, handleSearchChange should use its own debounce.
  fetchUsers(paginationModel.page, searchTerm, filterStatus, filterBranch, paginationModel.pageSize, filterEmail, filterPhone, filterGrade);
}, [paginationModel.page, paginationModel.pageSize, searchTerm, filterStatus, filterBranch, filterEmail, filterPhone, filterGrade, fetchUsers]);

  // Debounced function specifically for search term changes to update state & trigger main useEffect
  const debouncedSetSearchTerm = useCallback(
    debounce((newSearchTerm) => {
      setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset page for new search
      setSearchTerm(newSearchTerm); // This will trigger the main useEffect
    }, 500),
    [] // No dependencies, it's a stable debouncer
  );

  const handleSearchChange = (event) => {
    debouncedSetSearchTerm(event.target.value);
  };

const debouncedSetFilter = useCallback(
  debounce((filterType, value) => {
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    if (filterType === 'email') {
      setFilterEmail(value);
    } else if (filterType === 'phone') {
      setFilterPhone(value);
    }
    // The main useEffect will pick up these changes
  }, 500),
  []
);

  const handleFilterChange = (filterTypeChanged, newValue) => {
    setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset page for any filter change
    if (filterTypeChanged === 'status') {
      setFilterStatus(newValue);
    } else if (filterTypeChanged === 'branch') {
      setFilterBranch(newValue);
  } else if (filterTypeChanged === 'grade') {
    setFilterGrade(newValue);
  } else if (filterTypeChanged === 'email') {
    debouncedSetFilter('email', newValue);
  } else if (filterTypeChanged === 'phone') {
    debouncedSetFilter('phone', newValue);
    }
  // The main useEffect will pick up changes.
  };

  const handleStatusFilterChange = (event) => handleFilterChange('status', event.target.value);
  const handleBranchFilterChange = (event) => handleFilterChange('branch', event.target.value);
const handleGradeFilterChange = (event) => handleFilterChange('grade', event.target.value);
const handleEmailFilterChange = (event) => {
  // Value is passed directly to the debounced handler
  debouncedSetFilter('email', event.target.value);
};
const handlePhoneFilterChange = (event) => {
  debouncedSetFilter('phone', event.target.value);
};


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
      fetchUsers(0, searchTerm, filterStatus, filterBranch, paginationModel.pageSize);
      setPaginationModel(prev => ({ ...prev, page: 0 }));
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
      fetchUsers(0, searchTerm, filterStatus, filterBranch, paginationModel.pageSize);
      setPaginationModel(prev => ({ ...prev, page: 0 }));
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
      valueGetter: (params) => params?.row?.branchId?.name || 'N/A'
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

      <Box sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: '4px' }}>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search by Name"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
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
          <Grid item xs={12} sm={6} md={3}> {/* Adjusted grid size */}
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
          <Grid item xs={12} sm={6} md={3}> {/* Adjusted grid size */}
            <TextField
              fullWidth
              label="Filter by Email"
              variant="outlined"
              value={filterEmail} // This should be the direct value for controlled component
              onChange={handleEmailFilterChange} // This calls the debounced updater
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}> {/* Adjusted grid size */}
            <TextField
              fullWidth
              label="Filter by Phone"
              variant="outlined"
              value={filterPhone} // This should be the direct value for controlled component
              onChange={handlePhoneFilterChange} // This calls the debounced updater
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" variant="outlined" disabled={loadingGrades}>
              <InputLabel>Grade</InputLabel>
              <Select value={filterGrade} onChange={handleGradeFilterChange} label="Grade">
                <MenuItem value=""><em>All Grades</em></MenuItem>
                {loadingGrades && <MenuItem value="" disabled><em>Loading grades...</em></MenuItem>}
                {!loadingGrades && availableGrades.length === 0 && <MenuItem value="" disabled><em>No grades found</em></MenuItem>}
                {availableGrades.map((grade) => (
                  <MenuItem key={grade.id} value={grade.id}>{grade.title || grade.name}</MenuItem> // Use grade.title or grade.name
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
        availableRoles={ADMIN_MANAGEABLE_ROLES.filter(role => role !== 'admin' && role !== 'superAdmin')}
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
