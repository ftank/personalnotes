import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';

// Pages
import Login from './pages/Login';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';

// Protected Route Component
function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loading = useAuthStore((state) => state.loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  const initAuthListener = useAuthStore((state) => state.initAuthListener);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initTheme = useThemeStore((state) => state.initTheme);
  const loadFromBackend = useThemeStore((state) => state.loadFromBackend);

  useEffect(() => {
    // Initialize Firebase auth listener
    initAuthListener();

    // Initialize theme
    initTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load theme from backend when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadFromBackend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/chat" /> : <Login />
          }
        />

        {/* Protected Routes */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Redirect root to chat or login */}
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? "/chat" : "/login"} />}
        />

        {/* 404 - Redirect to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
