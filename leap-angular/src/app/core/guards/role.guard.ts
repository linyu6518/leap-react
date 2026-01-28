import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../state/auth/auth.selectors';
import { UserRole } from '../state/auth/auth.actions';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private store: Store,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const allowedRoles = route.data['roles'] as UserRole[];

    if (!allowedRoles || allowedRoles.length === 0) {
      return true; // No role restriction
    }

    return this.store.select(selectCurrentUser).pipe(
      take(1),
      map(user => {
        if (!user) {
          // Not logged in - redirect to login
          return this.router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url }
          });
        }

        if (allowedRoles.includes(user.role)) {
          return true; // User has required role
        }

        // User doesn't have required role - redirect to dashboard with error
        console.warn(`Access denied: User role '${user.role}' not in allowed roles:`, allowedRoles);
        return this.router.createUrlTree(['/dashboard'], {
          queryParams: { error: 'access-denied' }
        });
      })
    );
  }
}
