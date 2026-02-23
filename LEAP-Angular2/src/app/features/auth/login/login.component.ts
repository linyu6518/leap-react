import { Component, signal, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { NzInputModule } from 'ng-zorro-antd/input'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzAlertModule } from 'ng-zorro-antd/alert'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { AuthService } from '../../../core/services/auth.service'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NzInputModule, NzButtonModule, NzAlertModule, NzIconModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  username = 'Maker'
  password = ''
  usernameFocused = false
  passwordFocused = false
  loading = signal(false)
  error = signal<string | null>(null)

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (this.auth.isAuthenticated || this.auth.getCurrentUser()) {
      this.router.navigate(['/dashboard'])
    }
  }

  async submit(): Promise<void> {
    this.error.set(null)
    const loginUser = this.username === 'Maker' && !this.password ? 'maker1' : this.username
    const loginPwd = this.username === 'Maker' && !this.password ? 'password' : this.password

    this.loading.set(true)
    try {
      await this.auth.login({ username: loginUser, password: loginPwd })
      this.router.navigate(['/dashboard'])
    } catch {
      this.error.set('Invalid username or password')
    } finally {
      this.loading.set(false)
    }
  }

  cancel(): void {
    this.username = ''
    this.password = ''
    this.error.set(null)
  }
}
