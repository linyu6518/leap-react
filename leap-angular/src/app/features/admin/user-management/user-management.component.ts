import { Component, OnInit } from '@angular/core';

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: 'maker' | 'checker' | 'admin' | 'finance';
  department: string;
  active: boolean;
  lastLogin: Date | null;
}

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  displayedColumns: string[] = ['username', 'fullName', 'email', 'role', 'department', 'active', 'lastLogin', 'actions'];
  users: User[] = [];
  editingUser: User | null = null;

  roles = ['maker', 'checker', 'admin', 'finance'];
  departments = [
    'Liquidity Management',
    'Treasury',
    'Risk Management',
    'Finance',
    'Compliance',
    'IT'
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.users = [
      {
        id: 1,
        username: 'maker1',
        fullName: 'John Doe',
        email: 'john.doe@tdbank.com',
        role: 'maker',
        department: 'Liquidity Management',
        active: true,
        lastLogin: new Date('2024-01-15T09:30:00')
      },
      {
        id: 2,
        username: 'checker1',
        fullName: 'Jane Smith',
        email: 'jane.smith@tdbank.com',
        role: 'checker',
        department: 'Risk Management',
        active: true,
        lastLogin: new Date('2024-01-15T10:15:00')
      },
      {
        id: 3,
        username: 'admin1',
        fullName: 'Mike Johnson',
        email: 'mike.johnson@tdbank.com',
        role: 'admin',
        department: 'IT',
        active: true,
        lastLogin: new Date('2024-01-15T08:45:00')
      },
      {
        id: 4,
        username: 'finance1',
        fullName: 'Sarah Williams',
        email: 'sarah.williams@tdbank.com',
        role: 'finance',
        department: 'Finance',
        active: true,
        lastLogin: new Date('2024-01-14T16:20:00')
      },
      {
        id: 5,
        username: 'maker2',
        fullName: 'David Brown',
        email: 'david.brown@tdbank.com',
        role: 'maker',
        department: 'Treasury',
        active: true,
        lastLogin: new Date('2024-01-15T11:00:00')
      },
      {
        id: 6,
        username: 'olduser',
        fullName: 'Emily Davis',
        email: 'emily.davis@tdbank.com',
        role: 'maker',
        department: 'Liquidity Management',
        active: false,
        lastLogin: new Date('2023-12-01T14:30:00')
      }
    ];
  }

  addUser(): void {
    const newUser: User = {
      id: Math.max(...this.users.map(u => u.id), 0) + 1,
      username: 'newuser',
      fullName: 'New User',
      email: 'newuser@tdbank.com',
      role: 'maker',
      department: this.departments[0],
      active: true,
      lastLogin: null
    };
    this.users = [newUser, ...this.users];
    this.editingUser = { ...newUser };
  }

  editUser(user: User): void {
    this.editingUser = { ...user };
  }

  saveUser(): void {
    if (this.editingUser) {
      const index = this.users.findIndex(u => u.id === this.editingUser!.id);
      if (index > -1) {
        this.users[index] = { ...this.editingUser };
        this.users = [...this.users];
      }
      this.editingUser = null;
    }
  }

  cancelEdit(): void {
    this.editingUser = null;
  }

  deleteUser(user: User): void {
    if (confirm(`Delete user "${user.fullName}"?`)) {
      this.users = this.users.filter(u => u.id !== user.id);
    }
  }

  toggleActive(user: User): void {
    user.active = !user.active;
    this.users = [...this.users];
  }

  isEditing(user: User): boolean {
    return this.editingUser?.id === user.id;
  }

  getRoleBadgeClass(role: string): string {
    const roleClasses: any = {
      'maker': 'role-maker',
      'checker': 'role-checker',
      'admin': 'role-admin',
      'finance': 'role-finance'
    };
    return roleClasses[role] || '';
  }

  resetPassword(user: User): void {
    if (confirm(`Reset password for "${user.fullName}"?`)) {
      alert(`Password reset link sent to ${user.email}`);
    }
  }

  exportUsers(): void {
    console.log('Exporting users...');
    alert('User list exported to CSV');
  }
}
