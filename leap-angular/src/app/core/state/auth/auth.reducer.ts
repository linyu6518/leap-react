import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { User } from './auth.actions';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: any;
}

export const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

export const authReducer = createReducer(
  initialState,
  on(AuthActions.login, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AuthActions.loginSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    isAuthenticated: true,
    loading: false,
    error: null
  })),
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(AuthActions.logoutSuccess, () => initialState),
  on(AuthActions.loadUserProfileSuccess, (state, { user }) => ({
    ...state,
    user
  })),
  on(AuthActions.checkAuthSuccess, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true
  })),
  on(AuthActions.checkAuthFailure, () => initialState),
  on(AuthActions.updatePermissions, (state, { permissions }) => ({
    ...state,
    user: state.user ? { ...state.user, permissions } : null
  }))
);
