import { inject } from '@angular/core'
import { Router, CanActivateFn } from '@angular/router'
import { AuthService } from '../services/auth.service'

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService)
  const router = inject(Router)
  const user = auth.getCurrentUser()
  if (user || auth.isAuthenticated) {
    return true
  }
  return router.createUrlTree(['/login'])
}
