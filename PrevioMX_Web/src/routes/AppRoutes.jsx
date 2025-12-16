import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.js'
import LoginView from '../views/LoginView'
import DashboardView from '../views/DashboardView'
import CaptureView from '../views/CaptureView'
import LoadingSpinner from '../components/common/LoadingSpinner'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return isAuthenticated ? children : <Navigate to="/" replace />
}

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <LoginView />
          </PublicRoute>
        }
      />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/capture/:reference"
        element={
          <ProtectedRoute>
            <CaptureView />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRoutes

