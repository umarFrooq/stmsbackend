import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton, // For better click behavior and styling
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'; // SuperAdmin
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount'; // Admin
import SchoolIcon from '@mui/icons-material/School'; // Teacher
import FaceIcon from '@mui/icons-material/Face'; // Student & Parent (use different for parent if needed)
import SettingsIcon from '@mui/icons-material/Settings'; // Generic settings
import DomainIcon from '@mui/icons-material/Domain'; // For School Management (Root Admin)
import ClassIcon from '@mui/icons-material/Class'; // For Grade Management
import EventNoteIcon from '@mui/icons-material/EventNote'; // For Attendance Log
import AssignmentIcon from '@mui/icons-material/Assignment'; // For Assignments

import useAuthStore from '../../store/auth.store';

const drawerWidth = 240;

const DashboardLayout = (props) => {
  const { window } = props;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const navigate = useNavigate();

  const { user, roles, logout, hasRole, hasPermission } = useAuthStore();
  // Fallback for user if it's null or undefined during initial render or after logout
  const userName = user?.fullname || user?.email || 'User';
  const userEmail = user?.email || '';


  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleCloseUserMenu();
  };

  const handleProfile = () => {
    navigate('/profile');
    handleCloseUserMenu();
  }

  // Define navigation items based on roles/permissions
  // This can be further refined and moved to a separate config file if it grows large
  const navItems = [
    { text: 'Dashboard', icon: <HomeIcon />, path: '/dashboard', requiredRoles: ['student', 'teacher', 'admin', 'superadmin', 'rootUser', 'parent'] }, // Added rootUser here for general dashboard access

    // Shared Pages
    {
      text: 'Attendance Log',
      icon: <EventNoteIcon />,
      path: '/attendance-log',
      requiredRoles: ['admin', 'superadmin', 'teacher'],
      permission: 'viewAttendances'
    },

    // Root Admin specific (New)
    { text: 'School Management', icon: <DomainIcon />, path: '/rootadmin/schools', requiredRoles: ['rootUser'] },
    // Potentially other rootUser links like a Root Dashboard
    // { text: 'Root Dashboard', icon: <AdminPanelSettingsIcon />, path: '/rootadmin', requiredRoles: ['rootUser'] },


    // Super Admin specific (school admin)
    { text: 'School Dashboard', icon: <AdminPanelSettingsIcon />, path: '/superadmin', requiredRoles: ['superadmin'] }, // Main dashboard for superadmin
    { text: 'School Users', icon: <SupervisorAccountIcon />, path: '/superadmin/users', requiredRoles: ['superadmin'], permission: 'viewSchoolUsers' }, // Link to user management for their school
    { text: 'School Branches', icon: <DomainIcon />, path: '/superadmin/branches', requiredRoles: ['superadmin'], permission: 'viewBranches' }, // Link to branch management for their school
    { text: 'Grade Management', icon: <ClassIcon />, path: '/superadmin/grades', requiredRoles: ['superadmin'], permission: 'manageGrades' }, // Added for SuperAdmin
    // Add links for other modules a superadmin should manage, e.g.:
    // { text: 'School Subjects', icon: <SomeIcon />, path: '/superadmin/subjects', requiredRoles: ['superadmin'], permission: 'viewSubjects' },
    // { text: 'School Settings', icon: <SettingsIcon />, path: '/superadmin/settings', requiredRoles: ['superadmin'], permission: 'manageOwnSchoolDetails' }, // Example


    // Admin specific (This might be a different type of admin, or could be merged/clarified based on system design)
    { text: 'Admin Dashboard', icon: <SupervisorAccountIcon />, path: '/admin', requiredRoles: ['admin', 'superadmin'] }, // If superadmin also has 'admin' rights
    // Show Admin's Grade Management link only if the user is 'admin' BUT NOT 'superadmin' (to avoid duplicate links if a superadmin also has admin role)
    {
      text: 'Grade Management',
      icon: <ClassIcon />,
      path: '/admin/grades',
      requiredRoles: ['admin'],
      permission: 'manageGrades',
      condition: (userRoles) => userRoles.includes('admin') && !userRoles.includes('superadmin')
    },

    // Teacher specific
    { text: 'Teacher Dashboard', icon: <SchoolIcon />, path: '/teacher', requiredRoles: ['teacher', 'superadmin'] },

    // Student specific
    { text: 'Student Dashboard', icon: <FaceIcon />, path: '/student', requiredRoles: ['student', 'superadmin'] },

    // Parent specific - Assuming 'parent' role exists
    // { text: 'Parent Dashboard', icon: <FaceIcon />, path: '/parent', requiredRoles: ['parent', 'superadmin'] },

    // Assignment Links - general "Assignments" label, specific path and permission per role group
    {
      text: 'Assignments',
      icon: <AssignmentIcon />,
      path: '/student/assignments',
      requiredRoles: ['student'],
      permission: 'viewAssignmentsGrade' // Students view assignments
    },
    {
      text: 'Assignments',
      icon: <AssignmentIcon />,
      path: '/teacher/assignments',
      requiredRoles: ['teacher'],
      permission: 'manageOwnAssignments' // Teachers manage their assignments
    },
    {
      text: 'Assignments',
      icon: <AssignmentIcon />,
      path: '/admin/assignments', // Admins and SuperAdmins use this path as per AppRouter.jsx
      requiredRoles: ['admin', 'superadmin'],
      // Users with EITHER of these permissions should see the link.
      // The ProtectedRoute on /admin/assignments uses 'viewAllAssignmentsSchool'.
      // For a "Create & Manage" link, 'manageAllAssignmentsSchool' is more appropriate.
      // If a superadmin has 'manageAllAssignmentsRoot', they'd also fit this.
      // We'll use a function for the permission check to handle multiple possibilities or rely on AppRouter's protection.
      // For simplicity in nav, 'manageAllAssignmentsSchool' covers the primary admin/superadmin case for managing school assignments.
      permission: 'manageAllAssignmentsSchool'
      // If rootUser needs a link to a global assignment view, it would be a separate entry or handled by their 'Root Dashboard'
    },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          SMS Portal
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => {
          const hasRequiredRole = item.requiredRoles.some(role => hasRole(role));
          const hasRequiredPermission = !item.permission || hasPermission(item.permission);
          // Check additional condition if it exists
          const meetsCondition = !item.condition || item.condition(roles); // `roles` from useAuthStore

          if (hasRequiredRole && hasRequiredPermission && meetsCondition) {
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton onClick={() => navigate(item.path)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            );
          }
          return null;
        })}
      </List>
      <Divider />
      {/* Example for a settings link with permission check */}
      {hasPermission('manageSystemSettings') && ( // Example permission
         <List>
            <ListItem disablePadding>
                <ListItemButton onClick={() => navigate('/settings')}> {/* Define /settings route */}
                    <ListItemIcon><SettingsIcon /></ListItemIcon>
                    <ListItemText primary="System Settings" />
                </ListItemButton>
            </ListItem>
        </List>
      )}
    </div>
  );

  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Student Management System
          </Typography>
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt={userName}>
                  {userName ? userName.charAt(0).toUpperCase() : <PersonIcon />}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem disabled>
                <Typography textAlign="center" fontWeight="bold">{userName}</Typography>
              </MenuItem>
              <MenuItem disabled sx={{ justifyContent: 'center', fontSize: '0.8rem', pb:1, pt:0 }}>
                <Typography variant="caption">{userEmail}</Typography>
              </MenuItem>
              <Divider sx={{mb: 1}}/>
              <MenuItem onClick={handleProfile}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">Profile</Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                 <ListItemIcon>
                  <ExitToAppIcon fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px', // For AppBar height
        }}
      >
        {/* Toolbar spacer for content to be below AppBar - already handled by mt above */}
        {/* <Toolbar />  */}
        <Outlet /> {/* This is where nested route components will render */}
      </Box>
    </Box>
  );
};

export default DashboardLayout;
