import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, Chip, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import StyledDataGrid from '../../components/common/StyledDataGrid';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import UserFormDialog from './UserFormDialog'; // Import the actual form dialog
import NotificationToast from '../../components/common/NotificationToast'; // For success/error messages

// Mock service - replace with actual API calls from auth.service.js or a new user.service.js
const mockUserService = {
  // NOTE: In a real app, these would be API calls.
  // SuperAdmin can manage all roles, Admin can manage teacher, student, parent.
  // This mock service doesn't yet distinguish.
  getUsers: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Retrieve from localStorage or return a default list for mocking
    let users = JSON.parse(localStorage.getItem('mock_users'));
    if (!users) {
      users = [
        { id: 'sa1', fullname: 'Super Admin User', email: 'super@example.com', role: 'superAdmin', branchId: 'branch1', branch: 'Main Campus', status: 'active' },
        { id: 'ad1', fullname: 'Alice Admin', email: 'alice@example.com', role: 'admin', branchId: 'branch1', branch: 'Main Campus', status: 'active' },
        { id: 't1', fullname: 'Bob Teacher', email: 'bob@example.com', role: 'teacher', branchId: 'branch1', branch: 'Main Campus', status: 'active' },
        { id: 's1', fullname: 'Charlie Student', email: 'charlie@example.com', role: 'student', branchId: 'branch2', branch: 'North Campus', status: 'inactive' },
        { id: 'p1', fullname: 'Diana Parent', email: 'diana@example.com', role: 'parent', branchId: 'branch1', branch: 'Main Campus', status: 'active' },
      ];
      localStorage.setItem('mock_users', JSON.stringify(users));
    }
    return users;
  },
  addUser: async (userData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    let users = JSON.parse(localStorage.getItem('mock_users')) || [];
    const newUser = { ...userData, id: `user_${Date.now()}` };
    // Simulate branch name if only ID is passed
    if (newUser.branchId && !newUser.branch) {
        const branches = JSON.parse(localStorage.getItem('mock_branches')) || [{ id: 'branch1', name: 'Main Campus' }, { id: 'branch2', name: 'North Campus' }];
        newUser.branch = branches.find(b => b.id === newUser.branchId)?.name || 'N/A';
    }
    users.push(newUser);
    localStorage.setItem('mock_users', JSON.stringify(users));
    console.log('User added (mocked):', newUser);
    return { success: true, data: newUser };
  },
  updateUser: async (userId, userData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    let users = JSON.parse(localStorage.getItem('mock_users')) || [];
    // Simulate branch name update
    if (userData.branchId && (!userData.branch || users.find(u=>u.id===userId)?.branchId !== userData.branchId)) {
        const branches = JSON.parse(localStorage.getItem('mock_branches')) || [{ id: 'branch1', name: 'Main Campus' }, { id: 'branch2', name: 'North Campus' }];
        userData.branch = branches.find(b => b.id === userData.branchId)?.name || 'N/A';
    }
    users = users.map(u => (u.id === userId ? { ...u, ...userData } : u));
    localStorage.setItem('mock_users', JSON.stringify(users));
    console.log(`User ${userId} updated (mocked):`, userData);
    return { success: true, data: users.find(u => u.id === userId) };
  },
  deleteUser: async (userId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    let users = JSON.parse(localStorage.getItem('mock_users')) || [];
    users = users.filter(u => u.id !== userId);
    localStorage.setItem('mock_users', JSON.stringify(users));
    console.log(`User ${userId} deleted (mocked)`);
    return { success: true };
  }
};


const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // For grid errors

  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');


  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mockUserService.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch users.');
      showToast(err.message || 'Failed to fetch users.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // localStorage.removeItem('mock_users'); // Uncomment to reset mock data on load for testing
    fetchUsers();
  }, []);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsUserFormOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsUserFormOpen(true);
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setConfirmDialogOpen(true);
  };

  const confirmUserDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await mockUserService.deleteUser(userToDelete.id);
      showToast(`User "${userToDelete.fullname}" deleted successfully.`, 'success');
      fetchUsers(); // Refetch to update the grid
    } catch (err) {
      showToast(err.message || "Failed to delete user.", 'error');
    } finally {
      setIsDeleting(false);
      setConfirmDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleUserFormSubmit = async (values, isEditingMode, userId) => {
    // This function will be passed to UserFormDialog
    // It should handle the actual API call for add/edit
    try {
      if (isEditingMode) {
        await mockUserService.updateUser(userId, values);
        showToast('User updated successfully!', 'success');
      } else {
        await mockUserService.addUser(values);
        showToast('User created successfully!', 'success');
      }
      setIsUserFormOpen(false); // Close dialog on success
      fetchUsers(); // Refresh data
      return true; // Indicate success
    } catch (apiError) {
      showToast(apiError.message || `Failed to ${isEditingMode ? 'update' : 'create'} user.`, 'error');
      return false; // Indicate failure
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
