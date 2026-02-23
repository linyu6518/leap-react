import { inject } from '@angular/core'
import { Router, CanActivateFn } from '@angular/router'
import { AuthService } from '../services/auth.service'
import { UserRole } from '../services/auth.service'

export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService)
    const router = inject(Router)
    const user = auth.getCurrentUser() ?? auth.user
    if (user && allowedRoles.includes(user.role)) {
      return true
    }
    return router.createUrlTree(['/dashboard'])
  }
}
