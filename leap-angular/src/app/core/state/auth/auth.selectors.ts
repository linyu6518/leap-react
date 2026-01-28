import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

// Feature selector
export const selectAuthState = createFeatureSelector<AuthState>('auth');

// Basic selectors
export const selectCurrentUser = createSelector(
  selectAuthState,
  (state: AuthState) => state.user
);

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state: AuthState) => state.isAuthenticated
);

export const selectAuthToken = createSelector(
  selectAuthState,
  (state: AuthState) => state.token
);

export const selectAuthLoading = createSelector(
  selectAuthState,
  (state: AuthState) => state.loading
);

export const selectAuthError = createSelector(
  selectAuthState,
  (state: AuthState) => state.error
);

// User-specific selectors
export const selectUserRole = createSelector(
  selectCurrentUser,
  user => user?.role
);

export const selectUserPermissions = createSelector(
  selectCurrentUser,
  user => user?.permissions || []
);

export const selectUserProductLines = createSelector(
  selectCurrentUser,
  user => user?.productLines || []
);

export const selectUserRegions = createSelector(
  selectCurrentUser,
  user => user?.regions || []
);

export const selectUserFullName = createSelector(
  selectCurrentUser,
  user => user?.fullName || ''
);

export const selectUserEmail = createSelector(
  selectCurrentUser,
  user => user?.email || ''
);

// Permission check selectors
export const selectHasPermission = (permission: string) =>
  createSelector(selectUserPermissions, permissions =>
    permissions.includes(permission)
  );

export const selectCanSubmit = createSelector(
  selectUserPermissions,
  permissions => permissions.includes('submit')
);

export const selectCanApprove = createSelector(
  selectUserPermissions,
  permissions => permissions.includes('approve')
);

export const selectCanExport = createSelector(
  selectUserPermissions,
  permissions => permissions.includes('export')
);

// Role check selectors
export const selectIsMaker = createSelector(
  selectUserRole,
  role => role === 'maker'
);

export const selectIsChecker = createSelector(
  selectUserRole,
  role => role === 'checker'
);

export const selectIsAdmin = createSelector(
  selectUserRole,
  role => role === 'admin'
);

export const selectIsFinance = createSelector(
  selectUserRole,
  role => role === 'finance'
);

export const selectIsRegulatory = createSelector(
  selectUserRole,
  role => role === 'regulatory'
);
