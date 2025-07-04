import React, { useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import AppRouter from './router/AppRouter';
import theme from './theme/theme';
import useAuthStore from './store/auth.store'; // Import the store

function App() {
  // Initialize auth state on app load.
  // The persist middleware in Zustand handles rehydration from localStorage.
  // We can call a specific hydrate action if we defined more complex logic,
  // or simply ensure isLoading is managed correctly.
  useEffect(() => {
    const { token, user, isLoading, setLoading, logout, setState: setAuthState } = useAuthStore.getState();

    // This logic is mostly handled by onRehydrateStorage in the store now.
    // However, a final check or trigger might be useful.
    if (isLoading) { // if still loading after initial persist rehydration
      if (token && user) {
        setAuthState({ isAuthenticated: true, isLoading: false });
      } else if (token && !user) {
        // Token exists but no user data - inconsistent.
        // Attempt to fetch user profile or log out.
        // For now, logging out if critical user data is missing.
        console.warn("App.jsx: Token found without user data on initial load, logging out.");
        logout(); // This will also set isLoading to false
      } else {
        setLoading(false); // No token, so not authenticated, finish loading.
      }
    }
  }, []);


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Normalize CSS and apply background from theme */}
      <AppRouter />
    </ThemeProvider>
  );
}

export default App;
