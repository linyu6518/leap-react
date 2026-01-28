import { createAction, props } from '@ngrx/store';

export type UserRole = 'maker' | 'checker' | 'finance' | 'regulatory' | 'admin';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  productLines?: string[];
  regions?: string[];
  permissions: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// Login actions
export const login = createAction(
  '[Auth] Login',
  props<{ credentials: LoginCredentials }>()
);
export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: User; token: string }>()
);
export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: any }>()
);

// Logout actions
export const logout = createAction('[Auth] Logout');
export const logoutSuccess = createAction('[Auth] Logout Success');

// Load user profile
export const loadUserProfile = createAction('[Auth] Load User Profile');
export const loadUserProfileSuccess = createAction(
  '[Auth] Load User Profile Success',
  props<{ user: User }>()
);
export const loadUserProfileFailure = createAction(
  '[Auth] Load User Profile Failure',
  props<{ error: any }>()
);

// Check authentication
export const checkAuth = createAction('[Auth] Check Authentication');
export const checkAuthSuccess = createAction(
  '[Auth] Check Authentication Success',
  props<{ user: User }>()
);
export const checkAuthFailure = createAction('[Auth] Check Authentication Failure');

// Update user permissions
export const updatePermissions = createAction(
  '[Auth] Update Permissions',
  props<{ permissions: string[] }>()
);
