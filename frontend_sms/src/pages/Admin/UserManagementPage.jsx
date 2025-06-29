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
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import debounce from 'lodash.debounce';

// Import actual user service
import userService from '../../services/userService';

const ADMIN_MANAGEABLE_ROLES = ['teacher', 'student', 'parent']; // Define manageable roles for Admin

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
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [totalUsers, setTotalUsers] = useState(0);


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
        role: "admin", // Send roles admin can manage
      };
      if (currentSearchTerm) {
        params.name = 'fullname'; // Assuming search by fullname
        params.value = currentSearchTerm;
      }

      const response = await userService.getAllUsers(params);
      // Assuming response.data contains { results: [], totalPages: X, totalResults: Y, page: Z, limit: A }
      // Adjust based on your actual API response structure from userService.getAllUsers
      console.log("dtasssssssss",response.data.results)
      if (response && response.data && Array.isArray(response.data.results)) {
        setUsers(response.data.results);
        setTotalUsers(response.totalResults || 0);
      } else {
        // Handle cases where response is not as expected
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
      setUsers([]); // Clear users on error
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchUsers = debounce(fetchUsers, 500);

  useEffect(() => {
    fetchUsers(paginationModel.page, searchTerm);
  }, [paginationModel.page, paginationModel.pageSize]); // Removed searchTerm from direct dependency here, will be handled by debounced search

  const handleSearchChange = (event) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset to first page on new search
    debouncedFetchUsers(0, newSearchTerm); // Call debounced search with page 0
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
      await userService.deleteUser(userToDelete.id); // Use actual service
      showToast(`User "${userToDelete.fullname}" deleted successfully.`, 'success');
      fetchUsers(paginationModel.page, searchTerm); // Refetch current page and search
    } catch (err) {
      showToast(err.message || (err.data && err.data.message) || "Failed to delete user.", 'error');
    } finally {
      setIsDeleting(false);
      setConfirmDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleUserFormSubmit = async (values, isEditingMode, userId) => {
    // Ensure role is one that Admin can create/edit if not already handled in UserFormDialog
    if (!ADMIN_MANAGEABLE_ROLES.includes(values.role)) {
        showToast(`Admin cannot ${isEditingMode ? 'edit to' : 'create'} users with the role: ${values.role}. Allowed roles: ${ADMIN_MANAGEABLE_ROLES.join(', ')}.`, "error");
        return false;
    }
    try {
      if (isEditingMode) {
        await userService.updateUser(userId, values); // Use actual service
        showToast('User updated successfully!', 'success');
      } else {
        await userService.addUser(values); // Use actual service
        showToast('User created successfully!', 'success');
      }
      setIsUserFormOpen(false);
      fetchUsers(paginationModel.page, searchTerm); // Refetch current page and search
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
    { field: 'branch', headerName: 'Branch/Campus', width: 150 },
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

  if (loading && users.length === 0) {
    return <LoadingSpinner fullScreen message="Loading users..." />;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          User Management (Teachers, Students, Parents)
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
