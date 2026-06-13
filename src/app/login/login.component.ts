import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

type UserType = 'visitor' | 'security' | 'admin';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: false
})
export class LoginComponent implements OnInit {
  activeTab: UserType = 'visitor';
  email = '';
  password = '';
  rememberMe = false;
  showPassword = false;
  isLoading = false;

  // Form validation errors
  emailError = '';
  passwordError = '';
  serverError = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // Get user type from query params
    this.route.queryParams.subscribe(params => {
      if (params['type']) {
        this.activeTab = params['type'] as UserType;
      }
    });

    // Show a confirmation if we arrived here just after verifying registration.
    if (history.state?.verified) {
      this.successMessage = 'Email verified! Your account is active — please sign in.';
    }
  }

  selectTab(tab: UserType): void {
    this.activeTab = tab;
    this.clearErrors();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  clearErrors(): void {
    this.emailError = '';
    this.passwordError = '';
  }

  validateEmail(): boolean {
    this.emailError = '';

    if (!this.email) {
      this.emailError = 'Email is required';
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.email)) {
      this.emailError = 'Please enter a valid email';
      return false;
    }

    return true;
  }

  validatePassword(): boolean {
    this.passwordError = '';

    if (!this.password) {
      this.passwordError = 'Password is required';
      return false;
    }

    if (this.password.length < 6) {
      this.passwordError = 'Password must be at least 6 characters';
      return false;
    }

    return true;
  }

  onSubmit(): void {
    this.serverError = '';
    const isEmailValid = this.validateEmail();
    const isPasswordValid = this.validatePassword();

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    this.isLoading = true;
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Step 2: verify the login OTP (2FA).
        this.router.navigate(['/verify-otp'], {
          state: { email: res.email, purpose: 'LOGIN' }
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.serverError = err?.error?.message || 'Login failed. Please try again.';
      }
    });
  }

  forgotPassword(): void {
    alert('Forgot password feature coming soon!');
  }

  createAccount(): void {
    this.router.navigate(['/register']);
  }

  getEmailPlaceholder(): string {
    return 'you@example.com';
  }

  getEmailLabel(): string {
    return 'Email Address';
  }
}
