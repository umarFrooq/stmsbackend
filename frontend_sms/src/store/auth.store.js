import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Helper function to parse JWT -
// In a real app, you might use a library like jwt-decode if you need to extract claims directly on client.
// However, for basic role/permission checking, the backend should send this info separately after login.
const parseJwtClaims = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to parse JWT claims:", error);
    return null;
  }
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null, // To store user profile information (e.g., id, name, email)
      roles: [], // To store user roles (e.g., ['admin', 'teacher'])
      permissions: [], // To store user permissions (e.g., ['manageUsers', 'viewGrades'])
      isAuthenticated: false,
      isLoading: true, // To track if auth state is being loaded (e.g. from localStorage)

      // Login action
      login: (token, userData, userRoles, userPermissions) => {
        set({
          token,
          user: userData,
          roles: userRoles || [],
          permissions: userPermissions || [],
          isAuthenticated: true,
          isLoading: false,
        });
      },

      // Logout action
      logout: () => {
        set({
          token: null,
          user: null,
          roles: [],
          permissions: [],
          isAuthenticated: false,
          isLoading: false,
        });
      },

      // Action to set loading state (e.g., during initial load from storage)
      setLoading: (loading) => set({ isLoading: loading }),

      // Hydrate initial state (optional, if you need to do more than persist)
      // This is an example if you wanted to re-validate token on load
      // For now, persist middleware handles loading from localStorage automatically
      hydrate: () => {
        const token = get().token;
        if (token) {
          // Potentially validate token with backend here if needed on app load
          // For this example, we assume if token exists, it's valid until API call fails
          // The backend should send user data, roles, permissions upon login
          // For now, we just ensure isAuthenticated is true if token is present from storage
          // and user data is also present.
          if (get().user) {
             set({ isAuthenticated: true, isLoading: false });
          } else {
            // If token is there but no user, it's an inconsistent state, clear it or try to fetch user
            console.warn("Token found but no user data in store, logging out.");
            get().logout(); // Or attempt to re-fetch user profile
          }
        } else {
          set({ isLoading: false });
        }
      },

      // Selector to check if user has a specific role
      hasRole: (role) => get().roles.includes(role),

      // Selector to check if user has a specific permission
      hasPermission: (permission) => get().permissions.includes(permission),

      // Selector to check if user has all specified permissions
      hasAllPermissions: (requiredPermissions) => {
        const userPerms = get().permissions;
        console.log("roolessss",userPerms)
        return requiredPermissions.every(rp => userPerms.includes(rp));
      },

      // Selector to check if user has any of the specified permissions
      hasAnyPermission: (requiredPermissions) => {
        const userPerms = get().permissions;
        return requiredPermissions.some(rp => userPerms.includes(rp));
      },
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      // Only persist token. User profile, roles, permissions should be fetched on app load if token exists.
      // Or, for simplicity in this example, we'll persist them too but be mindful of stale data.
      // A better approach for sensitive/frequently changing data (roles/permissions) is to re-fetch it.
      partialize: (state) => ({
        token: state.token,
        user: state.user, // Persisting user for convenience
        roles: state.roles, // Persisting roles for convenience
        permissions: state.permissions, // Persisting permissions for convenience
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        // This is called when storage is rehydrated
        // We can update isAuthenticated based on the rehydrated token and user
        if (state.token && state.user) {
          state.isAuthenticated = true;
        } else {
          state.isAuthenticated = false;
        }
        state.isLoading = false;
      }
    }
  )
);

// Call hydrate on initial load if you have custom logic in it.
// Persist middleware calls onRehydrateStorage which is now handling basic re-auth state.
// useAuthStore.getState().hydrate(); // Call this in your main App component or similar entry point if needed.

export default useAuthStore;
