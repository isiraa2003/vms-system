import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

type UserType = 'student-staff' | 'security' | 'admin' | 'visitor';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: false
})
export class LoginComponent implements OnInit {
  activeTab: UserType = 'student-staff';
  email = '';
  password = '';
  rememberMe = false;
  showPassword = false;
  isLoading = false;

  // Form validation errors
  emailError = '';
  passwordError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get user type from query params
    this.route.queryParams.subscribe(params => {
      if (params['type']) {
        this.activeTab = params['type'] as UserType;
        this.updateEmailPlaceholder();
      }
    });
  }

  updateEmailPlaceholder(): void {
    if (this.activeTab === 'student-staff') {
      this.email = 'you@cinec.edu';
    } else if (this.activeTab === 'security') {
      this.email = 'admin@vms.com';
    } else {
      this.email = '';
    }
  }

  selectTab(tab: UserType): void {
    this.activeTab = tab;
    this.updateEmailPlaceholder();
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

    if (this.activeTab === 'student-staff' && !this.email.endsWith('@cinec.edu')) {
      this.emailError = 'Please use your @cinec.edu email';
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
    const isEmailValid = this.validateEmail();
    const isPasswordValid = this.validatePassword();

    if (isEmailValid && isPasswordValid) {
      this.isLoading = true;

      // Simulate API call
      setTimeout(() => {
        console.log('Login attempt:', {
          type: this.activeTab,
          email: this.email,
          password: this.password,
          rememberMe: this.rememberMe
        });

        this.isLoading = false;
        alert('Login successful! (Add your authentication logic here)');
        // Navigate to dashboard
        // this.router.navigate(['/dashboard']);
      }, 1500);
    }
  }

  forgotPassword(): void {
    alert('Forgot password feature coming soon!');
  }

  createAccount(): void {
    this.router.navigate(['/register']);
  }

  visitorCheckIn(): void {
    this.router.navigate(['/login'], { queryParams: { type: 'visitor' } });
  }

  getEmailPlaceholder(): string {
    switch (this.activeTab) {
      case 'student-staff':
        return 'you@cinec.edu';
      case 'security':
        return 'admin@vms.com';
      default:
        return 'Enter your email';
    }
  }

  getEmailLabel(): string {
    return this.activeTab === 'student-staff' ? 'Institutional Email' : 'Email Address';
  }
}
