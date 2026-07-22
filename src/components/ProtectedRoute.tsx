import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { Role } from '../types'

interface Props {
  children: React.ReactNode
  allow: Role[]
}

/** Guards routes by role. If not logged in -> /login. If wrong role -> their own home. */
export default function ProtectedRoute({ children, allow }: Props) {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!allow.includes(user.role)) {
    const home = user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor' : '/user'
    return <Navigate to={home} replace />
  }

  return <>{children}</>
}
