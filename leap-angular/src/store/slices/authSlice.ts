import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { authService } from '@services/authService'

export type UserRole = 'maker' | 'checker' | 'finance' | 'regulatory' | 'admin'

export interface User {
  id: number
  username: string
  email: string
  fullName: string
  role: UserRole
  productLines?: string[]
  regions?: string[]
  permissions: string[]
}

export interface LoginCredentials {
  username: string
  password: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: any
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

// Async thunks
export const loginAsync = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials)
      authService.setToken(response.token)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed')
    }
  }
)

export const checkAuthAsync = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getCurrentUser()
      if (!user) {
        throw new Error('Not authenticated')
      }
      return user
    } catch (error: any) {
      return rejectWithValue(error.message || 'Auth check failed')
    }
  }
)

export const logoutAsync = createAsyncThunk(
  'auth/logout',
  async () => {
    await authService.logout()
    authService.removeToken()
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updatePermissions: (state, action: PayloadAction<string[]>) => {
      if (state.user) {
        state.user.permissions = action.payload
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.isAuthenticated = false
      })
      // Check auth
      .addCase(checkAuthAsync.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(checkAuthAsync.rejected, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
      })
      // Logout
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.error = null
      })
  },
})

export const { clearError, updatePermissions } = authSlice.actions
export default authSlice.reducer
