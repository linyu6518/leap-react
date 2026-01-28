import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {
  // Login effect
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ credentials }) => {
        // Mock login - in real app, this would call an auth service
        const mockUser = {
          id: 1,
          username: credentials.username,
          email: `${credentials.username}@example.com`,
          fullName: credentials.username.charAt(0).toUpperCase() + credentials.username.slice(1),
          role: (credentials.username.includes('checker') ? 'checker' : 'maker') as any,
          productLines: ['Deposits', 'BuyBack'],
          regions: ['North America', 'Europe'],
          permissions: ['read', 'write', 'submit']
        };
        const mockToken = 'mock-jwt-token-' + Date.now();

        return of({ user: mockUser, token: mockToken }).pipe(
          map(({ user, token }) => AuthActions.loginSuccess({ user, token })),
          catchError(error => of(AuthActions.loginFailure({ error })))
        );
      })
    )
  );

  // Login success - navigate to dashboard
  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ token }) => {
          localStorage.setItem('auth_token', token);
          this.router.navigate(['/dashboard']);
        })
      ),
    { dispatch: false }
  );

  // Logout effect
  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      map(() => {
        localStorage.removeItem('auth_token');
        return AuthActions.logoutSuccess();
      })
    )
  );

  // Logout success - navigate to dashboard (no login required)
  logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => this.router.navigate(['/dashboard']))
      ),
    { dispatch: false }
  );

  // Check authentication
  checkAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.checkAuth),
      switchMap(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Mock user from token - in real app, validate token with backend
          const mockUser = {
            id: 1,
            username: 'current_user',
            email: 'user@example.com',
            fullName: 'Current User',
            role: 'maker' as any,
            productLines: ['Deposits'],
            regions: ['North America'],
            permissions: ['read', 'write']
          };
          return of(AuthActions.checkAuthSuccess({ user: mockUser }));
        }
        return of(AuthActions.checkAuthFailure());
      })
    )
  );

  // Load user profile
  loadUserProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUserProfile),
      switchMap(() => {
        // Mock user profile - in real app, fetch from API
        const mockUser = {
          id: 1,
          username: 'current_user',
          email: 'user@example.com',
          fullName: 'Current User',
          role: 'maker' as any,
          productLines: ['Deposits', 'BuyBack'],
          regions: ['North America'],
          permissions: ['read', 'write', 'submit']
        };
        return of(AuthActions.loadUserProfileSuccess({ user: mockUser }));
      }),
      catchError(error => of(AuthActions.loadUserProfileFailure({ error })))
    )
  );

  constructor(
    private actions$: Actions,
    private router: Router
  ) {}
}
