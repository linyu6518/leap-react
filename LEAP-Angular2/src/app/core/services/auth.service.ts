import { Injectable } from '@angular/core'

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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly MOCK_USERS = [
    {
      username: 'maker1',
      password: 'password',
      user: {
        id: 1,
        username: 'maker1',
        email: 'maker1@leap.com',
        fullName: 'John Maker',
        role: 'maker' as UserRole,
        productLines: ['Deposits', 'BuyBack'],
        regions: ['North America', 'Europe'],
        permissions: ['read', 'write', 'submit', 'export'],
      },
    },
    {
      username: 'checker1',
      password: 'password',
      user: {
        id: 2,
        username: 'checker1',
        email: 'checker1@leap.com',
        fullName: 'Jane Checker',
        role: 'checker' as UserRole,
        productLines: ['Deposits', 'BuyBack', 'Loan Commitments'],
        regions: ['North America', 'Europe', 'Asia Pacific'],
        permissions: ['read', 'approve', 'reject', 'escalate', 'export'],
      },
    },
    {
      username: 'admin',
      password: 'admin',
      user: {
        id: 3,
        username: 'admin',
        email: 'admin@leap.com',
        fullName: 'Admin User',
        role: 'admin' as UserRole,
        productLines: ['All'],
        regions: ['All'],
        permissions: ['read', 'write', 'submit', 'approve', 'reject', 'escalate', 'export', 'admin'],
      },
    },
    {
      username: 'finance1',
      password: 'password',
      user: {
        id: 4,
        username: 'finance1',
        email: 'finance1@leap.com',
        fullName: 'Finance User',
        role: 'finance' as UserRole,
        productLines: ['All'],
        regions: ['All'],
        permissions: ['read', 'export'],
      },
    },
  ]

  private currentUser: User | null = null
  private token: string | null = null

  login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const mockUser = this.MOCK_USERS.find(
          (u) => u.username === credentials.username && u.password === credentials.password
        )
        if (mockUser) {
          const token = this.generateMockToken(mockUser.user)
          this.token = token
          this.currentUser = mockUser.user
          this.setToken(token)
          resolve({ user: mockUser.user, token })
        } else {
          reject({ error: 'Invalid username or password' })
        }
      }, 500)
    })
  }

  logout(): void {
    this.removeToken()
    this.currentUser = null
    this.token = null
  }

  get user(): User | null {
    return this.currentUser
  }

  get isAuthenticated(): boolean {
    const t = this.getToken()
    return !!t && !this.isTokenExpired(t)
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  setToken(token: string): void {
    localStorage.setItem('auth_token', token)
  }

  removeToken(): void {
    localStorage.removeItem('auth_token')
  }

  getCurrentUser(): User | null {
    const token = this.getToken()
    if (!token || this.isTokenExpired(token)) return null
    const userData = this.decodeToken(token)
    if (userData) this.currentUser = userData
    return this.currentUser
  }

  hasRole(user: User | null, role: UserRole): boolean {
    return user?.role === role
  }

  private generateMockToken(user: User): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(
      JSON.stringify({
        sub: user.id,
        username: user.username,
        role: user.role,
        exp: Date.now() + 24 * 60 * 60 * 1000,
      })
    )
    return `${header}.${payload}.${btoa('mock-signature')}`
  }

  private decodeToken(token: string): User | null {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return null
      const payload = JSON.parse(atob(parts[1]))
      const mockUser = this.MOCK_USERS.find((u) => u.user.username === payload.username)
      return mockUser ? mockUser.user : null
    } catch {
      return null
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return true
      const payload = JSON.parse(atob(parts[1]))
      return payload.exp < Date.now()
    } catch {
      return true
    }
  }
}
