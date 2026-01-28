import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppSelector } from '@store/hooks'
import { UserRole } from '@store/slices/authSlice'

interface RoleRouteProps {
  children: ReactNode
  allowedRoles: UserRole[]
}

function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const user = useAppSelector((state) => state.auth.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    // User doesn't have required role - redirect to dashboard
    console.warn(`Access denied: User role '${user.role}' not in allowed roles:`, allowedRoles)
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default RoleRoute
