import { Component, OnInit, OnDestroy, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { OtpPurpose } from '../core/models';

@Component({
  selector: 'app-otp-page',
  standalone: false,
  templateUrl: './otp-page.html',
  styleUrl: './otp-page.css',
})
export class OtpPage implements OnInit, OnDestroy {
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;

  otpDigits: string[] = ['', '', '', '', '', ''];
  email = '';
  maskedEmail = '';
  isVerifying = false;
  isResending = false;
  hasError = false;
  errorMessage = '';
  resendTimer = 0;
  private timerInterval: any;

  // Why we're verifying: registration email-verification or login 2FA.
  purpose: OtpPurpose = 'REGISTRATION';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // Get email + purpose from navigation state (set by login/register).
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state ?? history.state;
    if (state) {
      this.email = state['email'] || '';
      this.purpose = (state['purpose'] as OtpPurpose) || 'REGISTRATION';
    }

    if (!this.email) {
      // No context — send the user back to log in.
      this.router.navigate(['/login']);
      return;
    }

    this.maskedEmail = this.maskEmail(this.email);

    // Auto-focus first input
    setTimeout(() => {
      const firstInput = this.otpInputs?.first?.nativeElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);

    // Start resend timer
    this.startResendTimer();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  maskEmail(email: string): string {
    if (!email) return '';

    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return email;

    // Show first character and mask the rest until @
    const visibleChars = 1;
    const maskedLocal = localPart.charAt(0) +
      '*'.repeat(Math.max(localPart.length - 1, 4)) +
      localPart.charAt(localPart.length - 1);

    return `${maskedLocal}@${domain}`;
  }

  onOtpInput(event: any, index: number): void {
    const input = event.target;
    const value = input.value;

    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      this.otpDigits[index] = '';
      return;
    }

    // Clear error when user starts typing
    if (this.hasError) {
      this.hasError = false;
      this.errorMessage = '';
    }

    // Move to next input if current is filled
    if (value && index < 5) {
      const nextInput = this.otpInputs.toArray()[index + 1]?.nativeElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    // Handle backspace
    if (event.key === 'Backspace') {
      if (!input.value && index > 0) {
        // Move to previous input if current is empty
        const prevInput = this.otpInputs.toArray()[index - 1]?.nativeElement;
        if (prevInput) {
          prevInput.focus();
          // Clear previous input value
          this.otpDigits[index - 1] = '';
        }
      } else if (input.value) {
        // Clear current input
        this.otpDigits[index] = '';
      }
      event.preventDefault();
    }

    // Handle left arrow
    if (event.key === 'ArrowLeft' && index > 0) {
      const prevInput = this.otpInputs.toArray()[index - 1]?.nativeElement;
      if (prevInput) {
        prevInput.focus();
      }
    }

    // Handle right arrow
    if (event.key === 'ArrowRight' && index < 5) {
      const nextInput = this.otpInputs.toArray()[index + 1]?.nativeElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const pastedData = event.clipboardData?.getData('text');
    if (!pastedData) return;

    // Extract only numbers
    const numbers = pastedData.replace(/\D/g, '');

    if (numbers.length === 6) {
      // Fill all inputs
      for (let i = 0; i < 6; i++) {
        this.otpDigits[i] = numbers[i];
      }

      // Focus last input
      const lastInput = this.otpInputs.toArray()[5]?.nativeElement;
      if (lastInput) {
        lastInput.focus();
      }

      // Clear any errors
      this.hasError = false;
      this.errorMessage = '';
    }
  }

  isOtpComplete(): boolean {
    return this.otpDigits.every(digit => digit !== '');
  }

  getOtpCode(): string {
    return this.otpDigits.join('');
  }

  verifyOTP(): void {
    if (!this.isOtpComplete() || this.isVerifying) {
      return;
    }

    this.isVerifying = true;
    this.hasError = false;
    this.errorMessage = '';

    const otpCode = this.getOtpCode();

    if (this.purpose === 'LOGIN') {
      this.auth.verifyLogin(this.email, otpCode).subscribe({
        next: (res) => {
          this.isVerifying = false;
          this.router.navigate([this.auth.dashboardRoute(res.user.role)]);
        },
        error: (err) => this.onVerifyError(err)
      });
    } else {
      this.auth.verifyRegistration(this.email, otpCode).subscribe({
        next: () => {
          this.isVerifying = false;
          this.router.navigate(['/login'], {
            state: { verified: true }
          });
        },
        error: (err) => this.onVerifyError(err)
      });
    }
  }

  private onVerifyError(err: any): void {
    this.isVerifying = false;
    this.hasError = true;
    this.errorMessage = err?.error?.message || 'Invalid verification code. Please try again.';
    this.otpDigits = ['', '', '', '', '', ''];
    setTimeout(() => {
      const firstInput = this.otpInputs?.first?.nativeElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  resendOTP(): void {
    if (this.resendTimer > 0 || this.isResending) {
      return;
    }

    this.isResending = true;

    this.auth.resendOtp(this.email, this.purpose).subscribe({
      next: () => {
        this.isResending = false;
        this.otpDigits = ['', '', '', '', '', ''];
        this.hasError = false;
        this.errorMessage = '';
        this.startResendTimer();
        setTimeout(() => {
          const firstInput = this.otpInputs?.first?.nativeElement;
          if (firstInput) {
            firstInput.focus();
          }
        }, 100);
      },
      error: (err) => {
        this.isResending = false;
        this.hasError = true;
        this.errorMessage = err?.error?.message || 'Could not resend the code. Please try again.';
      }
    });
  }

  startResendTimer(): void {
    this.resendTimer = 60; // 60 seconds

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      this.resendTimer--;

      if (this.resendTimer <= 0) {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  goBack(): void {
    this.router.navigate([this.purpose === 'LOGIN' ? '/login' : '/register']);
  }
}
