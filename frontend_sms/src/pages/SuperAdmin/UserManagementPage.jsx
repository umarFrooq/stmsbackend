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
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [totalUsers, setTotalUsers] = useState(0);

  // TODO: States for roles and branches to pass to UserFormDialog
  // const [availableRoles, setAvailableRoles] = useState(SUPERADMIN_MANAGEABLE_ROLES);
  // const [availableBranches, setAvailableBranches] = useState([]);


  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const fetchUsers = async (currentPage = paginationModel.page, currentSearchTerm = searchTerm) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage + 1, // API is 1-indexed
        limit: paginationModel.pageSize,
        // No role filter for SuperAdmin, or explicitly ask for all if API requires
      };
      if (currentSearchTerm) {
        params.name = 'fullname'; // Assuming search by fullname
        params.value = currentSearchTerm;
      }

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
  // useEffect(() => {
  //   const loadAuxData = async () => {
  //     try {
  //       // const rolesData = await roleService.getRoles(); // Replace with actual service
  //       // setAvailableRoles(rolesData.map(r => r.name)); // Or however roles are structured
  //       // const branchesData = await branchService.getBranches(); // Replace with actual service
  //       // setAvailableBranches(branchesData);
  //     } catch (e) {
  //       showToast('Failed to load roles/branches for form.', 'error');
  //     }
  //   };
  //   loadAuxData();
  // }, []);

  const debouncedFetchUsers = debounce(fetchUsers, 500);

  useEffect(() => {
    fetchUsers(paginationModel.page, searchTerm);
  }, [paginationModel.page, paginationModel.pageSize]);

  const handleSearchChange = (event) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    debouncedFetchUsers(0, newSearchTerm);
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

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}> {/* Responsive padding */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddUser}
        >
          Add User
        </Button>
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
