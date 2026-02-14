import { Component } from '@angular/core';
import { Router } from '@angular/router';

type UserType = 'student' | 'staff';
type PasswordStrength = 'weak' | 'medium' | 'strong';

interface RegistrationForm {
  fullName: string;
  email: string;
  phone: string;
  idNumber: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  idNumber?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
}

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  currentStep = 1;
  totalSteps = 2;
  userType: UserType = 'student';
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  passwordStrength: PasswordStrength = 'weak';

  formData: RegistrationForm = {
    fullName: '',
    email: '',
    phone: '',
    idNumber: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  };

  errors: FormErrors = {};

  constructor(private router: Router) {}

  selectUserType(type: UserType): void {
    this.userType = type;
    // Update email placeholder when user type changes
    if (type === 'student') {
      this.formData.email = this.formData.email.replace(/@staff\.cinec\.edu$/, '@cinec.edu');
    } else {
      this.formData.email = this.formData.email.replace(/@cinec\.edu$/, '@staff.cinec.edu');
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  validateField(fieldName: keyof RegistrationForm): boolean {
    switch (fieldName) {
      case 'fullName':
        return this.validateFullName();
      case 'email':
        return this.validateEmail();
      case 'phone':
        return this.validatePhone();
      case 'idNumber':
        return this.validateIdNumber();
      case 'password':
        return this.validatePassword();
      case 'confirmPassword':
        return this.validateConfirmPassword();
      case 'agreeToTerms':
        return this.validateTerms();
      default:
        return true;
    }
  }

  validateFullName(): boolean {
    delete this.errors.fullName;

    if (!this.formData.fullName.trim()) {
      this.errors.fullName = 'Full name is required';
      return false;
    }

    if (this.formData.fullName.trim().length < 3) {
      this.errors.fullName = 'Full name must be at least 3 characters';
      return false;
    }

    const namePattern = /^[a-zA-Z\s]+$/;
    if (!namePattern.test(this.formData.fullName)) {
      this.errors.fullName = 'Full name should only contain letters';
      return false;
    }

    return true;
  }

  validateEmail(): boolean {
    delete this.errors.email;

    if (!this.formData.email) {
      this.errors.email = 'Email is required';
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.formData.email)) {
      this.errors.email = 'Please enter a valid email';
      return false;
    }

    // Check institutional email
    const expectedDomain = this.userType === 'student' ? '@cinec.edu' : '@staff.cinec.edu';
    if (!this.formData.email.endsWith(expectedDomain)) {
      this.errors.email = `Please use your institutional email (${expectedDomain})`;
      return false;
    }

    return true;
  }

  validatePhone(): boolean {
    delete this.errors.phone;

    if (!this.formData.phone) {
      this.errors.phone = 'Phone number is required';
      return false;
    }

    // Remove spaces and special characters for validation
    const cleanPhone = this.formData.phone.replace(/[\s\-\(\)]/g, '');

    // Check if it's a valid Sri Lankan phone number
    const phonePattern = /^(\+94|0)?[0-9]{9,10}$/;
    if (!phonePattern.test(cleanPhone)) {
      this.errors.phone = 'Please enter a valid phone number';
      return false;
    }

    return true;
  }

  validateIdNumber(): boolean {
    delete this.errors.idNumber;

    if (!this.formData.idNumber) {
      this.errors.idNumber = `${this.userType === 'student' ? 'Student' : 'Staff'} ID is required`;
      return false;
    }

    // Check ID format (example: F20031212002 for student, S20031212002 for staff)
    const expectedPrefix = this.userType === 'student' ? 'F' : 'S';
    const idPattern = new RegExp(`^${expectedPrefix}[0-9]{11}$`);

    if (!idPattern.test(this.formData.idNumber)) {
      this.errors.idNumber = `Please enter a valid ${this.userType} ID (e.g., ${expectedPrefix}20031212002)`;
      return false;
    }

    return true;
  }

  validatePassword(): boolean {
    delete this.errors.password;

    if (!this.formData.password) {
      this.errors.password = 'Password is required';
      return false;
    }

    if (this.formData.password.length < 8) {
      this.errors.password = 'Password must be at least 8 characters';
      return false;
    }

    // Check for password strength
    const hasUpperCase = /[A-Z]/.test(this.formData.password);
    const hasLowerCase = /[a-z]/.test(this.formData.password);
    const hasNumbers = /\d/.test(this.formData.password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(this.formData.password);

    if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
      this.errors.password = 'Password must contain uppercase, lowercase, and numbers';
      return false;
    }

    return true;
  }

  validateConfirmPassword(): boolean {
    delete this.errors.confirmPassword;

    if (!this.formData.confirmPassword) {
      this.errors.confirmPassword = 'Please confirm your password';
      return false;
    }

    if (this.formData.password !== this.formData.confirmPassword) {
      this.errors.confirmPassword = 'Passwords do not match';
      return false;
    }

    return true;
  }

  validateTerms(): boolean {
    delete this.errors.agreeToTerms;

    if (!this.formData.agreeToTerms) {
      this.errors.agreeToTerms = 'You must agree to the terms and conditions';
      return false;
    }

    return true;
  }

  checkPasswordStrength(): void {
    const password = this.formData.password;

    if (!password) {
      this.passwordStrength = 'weak';
      return;
    }

    let strength = 0;

    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;

    // Character variety checks
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    // Determine strength level
    if (strength <= 2) {
      this.passwordStrength = 'weak';
    } else if (strength <= 4) {
      this.passwordStrength = 'medium';
    } else {
      this.passwordStrength = 'strong';
    }
  }

  getPasswordStrengthPercentage(): number {
    switch (this.passwordStrength) {
      case 'weak':
        return 33;
      case 'medium':
        return 66;
      case 'strong':
        return 100;
      default:
        return 0;
    }
  }

  getPasswordStrengthText(): string {
    switch (this.passwordStrength) {
      case 'weak':
        return 'Weak';
      case 'medium':
        return 'Medium';
      case 'strong':
        return 'Strong';
      default:
        return '';
    }
  }

  validateStep1(): boolean {
    const isFullNameValid = this.validateFullName();
    const isEmailValid = this.validateEmail();
    const isPhoneValid = this.validatePhone();
    const isIdNumberValid = this.validateIdNumber();

    return isFullNameValid && isEmailValid && isPhoneValid && isIdNumberValid;
  }

  validateStep2(): boolean {
    const isPasswordValid = this.validatePassword();
    const isConfirmPasswordValid = this.validateConfirmPassword();
    const isTermsValid = this.validateTerms();

    return isPasswordValid && isConfirmPasswordValid && isTermsValid;
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      if (this.validateStep1()) {
        this.currentStep = 2;
        this.errors = {}; // Clear errors when moving to next step
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errors = {}; // Clear errors when going back
    }
  }

  submitRegistration(): void {
    if (this.validateStep2()) {
      this.isLoading = true;

      // Simulate API call
      setTimeout(() => {
        console.log('Registration data:', {
          userType: this.userType,
          ...this.formData,
          password: '***hidden***',
          confirmPassword: '***hidden***'
        });

        this.isLoading = false;

        // Navigate to OTP verification page with email and registration data
        this.router.navigate(['/verify-otp'], {
          state: {
            email: this.formData.email,
            registrationData: {
              userType: this.userType,
              fullName: this.formData.fullName,
              email: this.formData.email,
              phone: this.formData.phone,
              idNumber: this.formData.idNumber
            }
          }
        });
      }, 2000);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
