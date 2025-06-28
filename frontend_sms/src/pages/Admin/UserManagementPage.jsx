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

// Mock service - can be adapted from SuperAdmin's or a new one
// For Admin, it should ideally filter users or restrict creation to specific roles.
const mockAdminUserService = {
  getScopedUsers: async () => { // Simulates fetching users Admin can manage
    await new Promise(resolve => setTimeout(resolve, 500));
    let allUsers = JSON.parse(localStorage.getItem('mock_users')) || [];
    // Admin can manage teachers, students, parents. Not other admins or superAdmins.
    const manageableRoles = ['teacher', 'student', 'parent'];
    return allUsers.filter(user => manageableRoles.includes(user.role));
  },
  // Add, Update, Delete can reuse SuperAdmin's mock for now, but backend would enforce scope.
  addUser: async (userData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    let users = JSON.parse(localStorage.getItem('mock_users')) || [];
    // Ensure role is one that Admin can create
    const allowedRoles = ['teacher', 'student', 'parent'];
    if (!allowedRoles.includes(userData.role)) {
        throw new Error("Admin cannot create users with this role.");
    }
    const newUser = { ...userData, id: `user_${Date.now()}` };
     if (newUser.branchId && !newUser.branch) { // Simulate branch name
        const branches = JSON.parse(localStorage.getItem('mock_branches')) || [{ id: 'branch1', name: 'Main Campus' }];
        newUser.branch = branches.find(b => b.id === newUser.branchId)?.name || 'N/A';
    }
    users.push(newUser);
    localStorage.setItem('mock_users', JSON.stringify(users));
    return { success: true, data: newUser };
  },
  updateUser: async (userId, userData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    let users = JSON.parse(localStorage.getItem('mock_users')) || [];
     if (userData.branchId && (!userData.branch || users.find(u=>u.id===userId)?.branchId !== userData.branchId)) {
        const branches = JSON.parse(localStorage.getItem('mock_branches')) || [{ id: 'branch1', name: 'Main Campus' }];
        userData.branch = branches.find(b => b.id === userData.branchId)?.name || 'N/A';
    }
    users = users.map(u => (u.id === userId ? { ...u, ...userData } : u));
    localStorage.setItem('mock_users', JSON.stringify(users));
    return { success: true, data: users.find(u => u.id === userId) };
  },
  deleteUser: async (userId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    let users = JSON.parse(localStorage.getItem('mock_users')) || [];
    users = users.filter(u => u.id !== userId);
    localStorage.setItem('mock_users', JSON.stringify(users));
    return { success: true };
  }
};


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

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mockAdminUserService.getScopedUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch users.');
      showToast(err.message || 'Failed to fetch users.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsUserFormOpen(true);
  };

  const handleEditUser = (user) => {
    // Admin should not edit users with roles they cannot manage (e.g. other admins)
    const manageableRoles = ['teacher', 'student', 'parent'];
    if (!manageableRoles.includes(user.role)) {
        showToast("You do not have permission to edit this user's role.", "warning");
        return;
    }
    setEditingUser(user);
    setIsUserFormOpen(true);
  };

  const handleDeleteUser = (user) => {
     const manageableRoles = ['teacher', 'student', 'parent'];
    if (!manageableRoles.includes(user.role)) {
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
      await mockAdminUserService.deleteUser(userToDelete.id);
      showToast(`User "${userToDelete.fullname}" deleted successfully.`, 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.message || "Failed to delete user.", 'error');
    } finally {
      setIsDeleting(false);
      setConfirmDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleUserFormSubmit = async (values, isEditingMode, userId) => {
    try {
      if (isEditingMode) {
        await mockAdminUserService.updateUser(userId, values);
        showToast('User updated successfully!', 'success');
      } else {
        await mockAdminUserService.addUser(values);
        showToast('User created successfully!', 'success');
      }
      setIsUserFormOpen(false);
      fetchUsers();
      return true;
    } catch (apiError) {
      showToast(apiError.message || `Failed to ${isEditingMode ? 'update' : 'create'} user.`, 'error');
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
        // availableRoles={['teacher', 'student', 'parent']}
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
