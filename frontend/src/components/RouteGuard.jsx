import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center text-slate-500">
      Loading...
    </div>
  )
}

// Only logged-in users can see these routes
export function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

// Only logged-out users can see these routes (login, register)
export function GuestRoute() {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />
}