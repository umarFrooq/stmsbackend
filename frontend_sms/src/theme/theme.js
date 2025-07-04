import { createTheme } from '@mui/material/styles';

// Example theme configuration
// You can customize colors, typography, spacing, breakpoints, component defaults, etc.

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Example: A shade of blue
      // light: '#42a5f5',
      // dark: '#1565c0',
      // contrastText: '#fff',
    },
    secondary: {
      main: '#dc004e', // Example: A shade of pink/red
      // light: '#ff7961',
      // dark: '#ba000d',
      // contrastText: '#000',
    },
    background: {
      default: '#f4f6f8', // A light grey for the app background
      paper: '#ffffff',    // White for Paper components like Cards
    },
    // You can also define 'error', 'warning', 'info', 'success'
    // error: { main: colors.red[500] },
    // warning: { main: colors.orange[500] },
    // info: { main: colors.blue[500] },
    // success: { main: colors.green[500] },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1.1rem',
      fontWeight: 500,
    },
    // You can customize other variants like subtitle1, body1, button, caption, etc.
  },
  shape: {
    borderRadius: 8, // Slightly more rounded corners for components
  },
  components: {
    // Example: Default props for MuiButton
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // No uppercase buttons by default
          // You can add more default styles here
        },
      },
      defaultProps: {
        // disableElevation: true, // Example: Flat buttons by default
      }
    },
    MuiAppBar: {
        styleOverrides: {
            colorPrimary: {
                // backgroundColor: '#333' // Example: Darker AppBar
            }
        }
    },
    MuiDrawer: {
        styleOverrides: {
            paper: {
                // backgroundColor: '#f9f9f9', // Example: Light grey drawer
            }
        }
    }
    // You can override styles for other components as well
    // MuiTextField, MuiCard, etc.
  },
  // You can also define custom spacing, breakpoints, zIndex, etc.
  // spacing: 8, // default is 8
  // breakpoints: { ... }
});

export default theme;
