import { Component, OnInit, OnDestroy, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

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

  // Registration data passed from register page
  registrationData: any = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get email from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.email = navigation.extras.state['email'];
      this.registrationData = navigation.extras.state['registrationData'];
    } else {
      // Try to get from query params as fallback
      this.route.queryParams.subscribe(params => {
        this.email = params['email'] || '';
      });
    }

    if (!this.email) {
      // If no email, redirect back to register
      this.router.navigate(['/register']);
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

    // Simulate API call to verify OTP
    setTimeout(() => {
      // For demo purposes, accept "123456" as valid OTP
      if (otpCode === '123456') {
        this.isVerifying = false;

        // Show success message
        alert('Email verified successfully! Your account has been created.');

        // Navigate to login page
        this.router.navigate(['/login']);
      } else {
        // Invalid OTP
        this.isVerifying = false;
        this.hasError = true;
        this.errorMessage = 'Invalid verification code. Please try again.';

        // Clear OTP inputs
        this.otpDigits = ['', '', '', '', '', ''];

        // Focus first input
        setTimeout(() => {
          const firstInput = this.otpInputs?.first?.nativeElement;
          if (firstInput) {
            firstInput.focus();
          }
        }, 100);
      }
    }, 2000);
  }

  resendOTP(): void {
    if (this.resendTimer > 0 || this.isResending) {
      return;
    }

    this.isResending = true;

    // Simulate API call to resend OTP
    setTimeout(() => {
      this.isResending = false;

      // Clear previous OTP and errors
      this.otpDigits = ['', '', '', '', '', ''];
      this.hasError = false;
      this.errorMessage = '';

      // Show success message
      alert(`Verification code has been resent to ${this.email}`);

      // Restart timer
      this.startResendTimer();

      // Focus first input
      setTimeout(() => {
        const firstInput = this.otpInputs?.first?.nativeElement;
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    }, 1500);
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
    this.router.navigate(['/register']);
  }
}
