import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, NavLink as RouterNavLink } from 'react-router-dom'; // Imported NavLink
import {
  Box,
  CssBaseline,
  // List, ListItem, ListItemIcon, ListItemText, ListItemButton, // MUI List components removed
  Typography, // Still used for "SMS Portal" title in sidebar header
  Divider,
  Tooltip,
} from '@mui/material'; // Keep Tooltip for Navbar, Typography for sidebar header
// Added Nav from react-bootstrap for sidebar
import { Navbar, Nav, NavDropdown, Container, Image, Button as BsButton, Offcanvas } from 'react-bootstrap';
import MenuIcon from '@mui/icons-material/Menu'; // MUI Icons are kept
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
import styles from './DashboardLayout.module.css';

const drawerWidth = 240;

const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 600);
  const navigate = useNavigate();

  const { user, roles, logout, hasRole, hasPermission } = useAuthStore();
  const userName = user?.fullname || user?.email || 'User';
  const userEmail = user?.email || '';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const handleProfile = () => { navigate('/profile'); };

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

  const drawerContent = (
    <div className={styles.drawerContent}>
      <div className={styles.sidebarHeader}> {/* Use CSS Module for sidebar header */}
        {/* Typography was MUI, replace with simple h6 or styled div if needed */}
        <h5 className="m-0">SMS Portal</h5> {/* Bootstrap heading with no margin */}
      </div>
      <Divider /> {/* MUI Divider, can be replaced with <hr className="my-2" /> or similar */}
      <Nav className="flex-column p-2"> {/* React-Bootstrap Nav, flex-column for vertical layout */}
        {navItems.map((item) => {
          const hasRequiredRole = item.requiredRoles.some(role => hasRole(role));
          const hasRequiredPermission = !item.permission || hasPermission(item.permission);
          const meetsCondition = !item.condition || item.condition(roles);

          if (hasRequiredRole && hasRequiredPermission && meetsCondition) {
            return (
              <Nav.Item key={item.text}>
                <Nav.Link
                  as={RouterNavLink}
                  to={item.path}
                  onClick={() => { if(mobileOpen && !isDesktop) handleDrawerToggle(); }}
                  className={({ isActive }) => isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
                >
                  <span className={styles.navLinkIcon}>{item.icon}</span>
                  <span className={styles.navLinkText}>{item.text}</span>
                </Nav.Link>
              </Nav.Item>
            );
          }
          return null;
        })}
      </Nav>
      <Divider />
      {hasPermission('manageSystemSettings') && (
         <Nav className="flex-column p-2">
            <Nav.Item>
                <Nav.Link
                  as={RouterNavLink}
                  to="/settings"
                  onClick={() => { if(mobileOpen && !isDesktop) handleDrawerToggle();}}
                  className={({ isActive }) => isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
                >
                    <span className={styles.navLinkIcon}><SettingsIcon /></span>
                    <span className={styles.navLinkText}>System Settings</span>
                </Nav.Link>
            </Nav.Item>
        </Nav>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />

      <Navbar
        bg="primary"
        variant="dark"
        expand={false}
        fixed="top"
        className={styles.appBar}
        style={{
          width: isDesktop ? `calc(100% - ${drawerWidth}px)` : '100%',
          marginLeft: isDesktop ? `${drawerWidth}px` : '0',
          transition: 'margin .2s ease-out, width .2s ease-out',
        }}
      >
        <Container fluid>
          <BsButton
            variant="outline-light"
            onClick={handleDrawerToggle}
            className="d-sm-none me-2"
            aria-label="open drawer"
          >
            <MenuIcon />
          </BsButton>
          <Navbar.Brand href="#home" onClick={(e) => {e.preventDefault(); navigate('/dashboard');}} className={styles.title}>
            Student Management System
          </Navbar.Brand>
          <Nav className="ms-auto">
            <Tooltip title="User menu">
              <NavDropdown
                title={
                  <Image
                    src={user?.profilePictureUrl || undefined}
                    alt={userName}
                    roundedCircle
                    style={{ width: 32, height: 32, backgroundColor: '#fff', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
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

      <Offcanvas
        show={mobileOpen && !isDesktop}
        onHide={handleDrawerToggle}
        placement="start"
        className="d-sm-none"
        style={{ width: `${drawerWidth}px` }}
      >
        <Offcanvas.Header closeButton>
          {/* Offcanvas title can be here if different from drawerContent's title, or use the one in drawerContent */}
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          {drawerContent}
        </Offcanvas.Body>
      </Offcanvas>

      <div className={`d-none d-sm-block ${styles.desktopSidebar}`} style={{ width: `${drawerWidth}px` }}>
        {drawerContent}
      </div>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: '64px',
          overflowX: 'hidden',
          marginLeft: { xs: 0, sm: `${drawerWidth}px` },
          width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` }
        }}
      >
        <Outlet />
      </Box>
    </div>
  );
};

export default DashboardLayout;
