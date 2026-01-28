import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { login } from '@core/state/auth/auth.actions';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  error = '';
  returnUrl = '/dashboard';

  // 示例账号
  sampleAccounts = [
    { username: 'maker1', password: 'password', role: 'Maker' },
    { username: 'checker1', password: 'password', role: 'Checker' },
    { username: 'admin', password: 'admin', role: 'Admin' },
    { username: 'finance1', password: 'password', role: 'Finance' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private store: Store
  ) {}

  ngOnInit(): void {
    // 如果已登录,直接跳转
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
      return;
    }

    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      key: ['', Validators.required]
    });

    // 获取返回URL
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    const { username, password } = this.loginForm.value;

    // Dispatch login action to NgRx store
    this.store.dispatch(login({ credentials: { username, password } }));

    // The auth effect will handle navigation and token storage
    // Just wait a bit for the effect to complete
    setTimeout(() => {
      // Check if login was successful
      if (!this.authService.isAuthenticated()) {
        this.error = 'Invalid username, password, or key';
        this.loading = false;
      }
    }, 1000);
  }

  quickLogin(username: string, password: string): void {
    this.loginForm.patchValue({ username, password, key: 'default' });
    this.onSubmit();
  }

  quickLoginMaker(): void {
    this.quickLogin('maker1', 'password');
  }

  quickLoginChecker(): void {
    this.quickLogin('checker1', 'password');
  }

  onCancel(): void {
    // Clear form and reset
    this.loginForm.reset();
    this.error = '';
  }
}
