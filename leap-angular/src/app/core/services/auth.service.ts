import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { User, UserRole, LoginCredentials } from '../state/auth/auth.actions';

@Injectable({
  providedIn: 'root'
})
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
        permissions: ['read', 'write', 'submit', 'export']
      }
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
        permissions: ['read', 'approve', 'reject', 'escalate', 'export']
      }
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
        permissions: ['read', 'write', 'submit', 'approve', 'reject', 'escalate', 'export', 'admin']
      }
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
        permissions: ['read', 'export']
      }
    }
  ];

  constructor() {}

  /**
   * Mock login - validates credentials and returns user + token
   */
  login(credentials: LoginCredentials): Observable<{ user: User; token: string }> {
    const mockUser = this.MOCK_USERS.find(
      u => u.username === credentials.username && u.password === credentials.password
    );

    if (mockUser) {
      const token = this.generateMockToken(mockUser.user);
      return of({ user: mockUser.user, token }).pipe(delay(500)); // Simulate network delay
    }

    return throwError(() => ({ error: 'Invalid username or password' })).pipe(delay(500));
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  /**
   * Get current auth token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Set auth token to localStorage
   */
  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  /**
   * Remove auth token from localStorage
   */
  removeToken(): void {
    localStorage.removeItem('auth_token');
  }

  /**
   * Get current user from token (mock implementation)
   */
  getCurrentUser(): Observable<User | null> {
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) {
      return of(null);
    }

    // Mock: decode token to get user
    const userData = this.decodeToken(token);
    return of(userData);
  }

  /**
   * Logout user
   */
  logout(): Observable<void> {
    this.removeToken();
    return of(void 0);
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(user: User | null, permission: string): boolean {
    return user?.permissions?.includes(permission) || false;
  }

  /**
   * Check if user has specific role
   */
  hasRole(user: User | null, role: UserRole): boolean {
    return user?.role === role;
  }

  /**
   * Check if user can access product line
   */
  canAccessProductLine(user: User | null, productLine: string): boolean {
    if (!user) return false;
    return user.productLines?.includes('All') || user.productLines?.includes(productLine) || false;
  }

  /**
   * Check if user can access region
   */
  canAccessRegion(user: User | null, region: string): boolean {
    if (!user) return false;
    return user.regions?.includes('All') || user.regions?.includes(region) || false;
  }

  // Private helper methods

  private generateMockToken(user: User): string {
    // Mock JWT token generation
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      username: user.username,
      role: user.role,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }));
    const signature = btoa('mock-signature');
    return `${header}.${payload}.${signature}`;
  }

  private decodeToken(token: string): User | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));

      // Find user from mock users
      const mockUser = this.MOCK_USERS.find(u => u.user.username === payload.username);
      return mockUser ? mockUser.user : null;
    } catch (error) {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;

      const payload = JSON.parse(atob(parts[1]));
      return payload.exp < Date.now();
    } catch (error) {
      return true;
    }
  }
}
