import React from 'react'; // Changed from { StrictMode } to React for consistency, StrictMode is used below
import ReactDOM from 'react-dom/client'; // Changed from { createRoot }
import App from './App.jsx';
import './index.css'; // Keep or replace with MUI's CssBaseline effects if preferred

// If you need to call something on initial load from the store, you can do it here.
// For example, if you had a specific `init` action in your store.
// import useAuthStore from './store/auth.store';
// useAuthStore.getState().someInitAction();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
