import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'

export function ProtectedRoute({ role, children }) {
  const auth = useAuth()

  if (auth.loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (!auth.role) {
    return <Navigate to="/login" replace />
  }

  if (role && auth.role !== role) {
    return <Navigate to={`/${auth.role}`} replace />
  }

  return children
}
