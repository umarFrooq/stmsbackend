import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  // AppBar, // Replaced
  Box,
  CssBaseline,
  Drawer,
  // IconButton, // Replaced where it was part of AppBar
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  // Toolbar, // Replaced
  Typography, // Still used in Drawer
  // Avatar, // Replaced
  // Menu, // Replaced
  // MenuItem, // Replaced
  Divider,
  Tooltip, // Can still be used, or use React-Bootstrap OverlayTrigger + Tooltip
} from '@mui/material';
import { Navbar, Nav, NavDropdown, Container, Image, Button as BsButton, Offcanvas } from 'react-bootstrap'; // Added BsButton for menu icon on mobile
import MenuIcon from '@mui/icons-material/Menu'; // Keep for toggle, or use Navbar.Toggle's default
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import SchoolIcon from '@mui/icons-material/School';
import FaceIcon from '@mui/icons-material/Face';
import SettingsIcon from '@mui/icons-material/Settings';
import DomainIcon from '@mui/icons-material/Domain';
import ClassIcon from '@mui/icons-material/Class';

import useAuthStore from '../../store/auth.store';
import styles from './DashboardLayout.module.css'; // Import CSS module

const drawerWidth = 240;

const DashboardLayout = (props) => {
  const { window } = props;
  const [mobileOpen, setMobileOpen] = useState(false);
  // const [anchorElUser, setAnchorElUser] = useState(null); // Not needed for NavDropdown
  const navigate = useNavigate();

  const { user, roles, logout, hasRole, hasPermission } = useAuthStore();
  const userName = user?.fullname || user?.email || 'User';
  const userEmail = user?.email || '';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // handleOpenUserMenu and handleCloseUserMenu are not strictly needed for NavDropdown
  // as it handles its own open/close state.

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/profile');
  }

  const navItems = [
    { text: 'Dashboard', icon: <HomeIcon />, path: '/dashboard', requiredRoles: ['student', 'teacher', 'admin', 'superadmin', 'rootUser', 'parent'] },
    { text: 'School Management', icon: <DomainIcon />, path: '/rootadmin/schools', requiredRoles: ['rootUser'] },
    { text: 'School Dashboard', icon: <AdminPanelSettingsIcon />, path: '/superadmin', requiredRoles: ['superadmin'] },
    { text: 'School Users', icon: <SupervisorAccountIcon />, path: '/superadmin/users', requiredRoles: ['superadmin'], permission: 'viewSchoolUsers' },
    { text: 'School Branches', icon: <DomainIcon />, path: '/superadmin/branches', requiredRoles: ['superadmin'], permission: 'viewBranches' },
    { text: 'Grade Management', icon: <ClassIcon />, path: '/superadmin/grades', requiredRoles: ['superadmin'], permission: 'manageGrades' },
    { text: 'Admin Dashboard', icon: <SupervisorAccountIcon />, path: '/admin', requiredRoles: ['admin', 'superadmin'] },
    {
      text: 'Grade Management',
      icon: <ClassIcon />,
      path: '/admin/grades',
      requiredRoles: ['admin'],
      permission: 'manageGrades',
      condition: (userRoles) => userRoles.includes('admin') && !userRoles.includes('superadmin')
    },
    { text: 'Teacher Dashboard', icon: <SchoolIcon />, path: '/teacher', requiredRoles: ['teacher', 'superadmin'] },
    { text: 'Student Dashboard', icon: <FaceIcon />, path: '/student', requiredRoles: ['student', 'superadmin'] },
  ];

  const drawerContent = ( // Renamed from drawer to avoid conflict with MUI Drawer
    <div>
      {/* Toolbar equivalent for spacing and title */}
      <div className="d-flex align-items-center justify-content-center p-3" style={{ height: '64px' }}> {/* Approx Toolbar height */}
        <Typography variant="h6" noWrap component="div">
          SMS Portal
        </Typography>
      </div>
      <Divider />
      <List>
        {navItems.map((item) => {
          const hasRequiredRole = item.requiredRoles.some(role => hasRole(role));
          const hasRequiredPermission = !item.permission || hasPermission(item.permission);
          const meetsCondition = !item.condition || item.condition(roles);

          if (hasRequiredRole && hasRequiredPermission && meetsCondition) {
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton onClick={() => { navigate(item.path); if(mobileOpen) handleDrawerToggle(); }}>
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
      {hasPermission('manageSystemSettings') && (
         <List>
            <ListItem disablePadding>
                <ListItemButton onClick={() => { navigate('/settings'); if(mobileOpen) handleDrawerToggle(); }}>
                    <ListItemIcon><SettingsIcon /></ListItemIcon>
                    <ListItemText primary="System Settings" />
                </ListItemButton>
            </ListItem>
        </List>
      )}
    </div>
  );

  const container = window !== undefined ? () => window().document.body : undefined;

  // Calculate style for Navbar based on drawer state (for larger screens)
  const navbarStyle = {
    transition: 'margin .2s ease-out, width .2s ease-out', // Smooth transition
  };
  // On small screens (sm and down), Navbar takes full width.
  // On medium screens (md and up) where permanent drawer is shown, adjust Navbar.
  // This logic can be tricky with media queries vs. dynamic styling.
  // Bootstrap's Navbar is typically full-width unless inside a container that limits it.
  // The `fixed="top"` makes it full viewport width.
  // The main content area then gets padding/margin.

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}> {/* Ensure Box takes full height */}
      <CssBaseline />

      <Navbar
        bg="primary"
        variant="dark"
        expand="sm" // Hamburger menu appears on 'sm' and smaller
        fixed="top"
        className={styles.appBar} // Base class
        style={navbarStyle} // Dynamic styles for drawer offset
      >
        <Container fluid style={{ paddingLeft: mobileOpen && document.documentElement.clientWidth >= 600 ? `${drawerWidth}px` : (document.documentElement.clientWidth >= 600 ? `${drawerWidth}px` : undefined) , width: mobileOpen && document.documentElement.clientWidth >= 600 ? `calc(100% - ${drawerWidth}px)` : (document.documentElement.clientWidth >= 600 ? `calc(100% - ${drawerWidth}px)` : '100%')}}>
          {/* IconButton for mobile drawer toggle - using Navbar.Toggle now */}
          <BsButton
            variant="outline-light"
            onClick={handleDrawerToggle}
            className="d-sm-none me-2" // Display only on extra-small to small screens
            aria-label="open drawer"
          >
            <MenuIcon />
          </BsButton>
          <Navbar.Brand href="#home" onClick={(e) => {e.preventDefault(); navigate('/dashboard');}} className={styles.title}>
            Student Management System
          </Navbar.Brand>
          {/* Navbar.Toggle for Bootstrap's built-in responsive menu (if we had Nav links in AppBar) */}
          {/* <Navbar.Toggle aria-controls="responsive-navbar-nav" /> */}
          {/* <Navbar.Collapse id="responsive-navbar-nav"> */}
            {/* <Nav className="me-auto"> */}
              {/* Future Nav.Link items if any */}
            {/* </Nav> */}
          {/* </Navbar.Collapse> */}
          <Nav className="ms-auto"> {/* ms-auto to push to the right */}
            <Tooltip title="User menu">
              <NavDropdown
                title={
                  <Image
                    src={user?.profilePictureUrl || undefined} // Placeholder or actual image
                    alt={userName}
                    roundedCircle
                    style={{ width: 32, height: 32, backgroundColor: '#fff', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {/* Fallback to initial if no image */}
                    {(!user?.profilePictureUrl && userName) ? userName.charAt(0).toUpperCase() : <PersonIcon style={{color: '#333'}}/>}
                  </Image>
                }
                id="user-nav-dropdown"
                align="end"
              >
                <NavDropdown.ItemText className="text-center">
                  <div className={styles.navDropdownItemHeader}>{userName}</div>
                  <div className={styles.navDropdownItemSubHeader}>{userEmail}</div>
                </NavDropdown.ItemText>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleProfile}>
                  <PersonIcon fontSize="small" className={styles.navDropdownItemIcon} /> Profile
                </NavDropdown.Item>
                <NavDropdown.Item onClick={handleLogout}>
                  <ExitToAppIcon fontSize="small" className={styles.navDropdownItemIcon} /> Logout
                </NavDropdown.Item>
              </NavDropdown>
            </Tooltip>
          </Nav>
        </Container>
      </Navbar>

      {/* Sidebar Navigation (Drawer) */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Temporary Drawer for mobile */}
        <Drawer // Using MUI Drawer for mobile off-canvas
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
        {/* Permanent Drawer for desktop */}
        <Drawer // Using MUI Drawer for permanent sidebar
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          // width: { sm: `calc(100% - ${drawerWidth}px)` }, // Width is handled by flexGrow
          mt: '64px', // AppBar height (Bootstrap default can be 56px or more)
          overflowX: 'hidden',
          marginLeft: { sm: `${drawerWidth}px` } // Adjust margin when drawer is permanent
        }}
        style={{ width: `calc(100% - ${drawerWidth}px)`}} // Ensure this works with flexGrow
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
