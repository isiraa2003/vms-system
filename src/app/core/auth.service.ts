import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_BASE } from './api.config';
import {
  AppUser,
  AuthResponse,
  LoginPayload,
  MessageResponse,
  OtpChallengeResponse,
  OtpPurpose,
  RegisterPayload,
  Role,
} from './models';

const USER_KEY = 'vms_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${API_BASE}/auth`;
  private readonly userSubject: BehaviorSubject<AppUser | null>;
  readonly currentUser$: Observable<AppUser | null>;

  constructor(private http: HttpClient) {
    const stored = localStorage.getItem(USER_KEY);
    this.userSubject = new BehaviorSubject<AppUser | null>(stored ? JSON.parse(stored) : null);
    this.currentUser$ = this.userSubject.asObservable();
  }

  get currentUser(): AppUser | null {
    return this.userSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.userSubject.value !== null;
  }

  register(payload: RegisterPayload): Observable<OtpChallengeResponse> {
    return this.http.post<OtpChallengeResponse>(`${this.base}/register`, payload);
  }

  verifyRegistration(email: string, code: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.base}/register/verify-otp`, { email, code });
  }

  login(payload: LoginPayload): Observable<OtpChallengeResponse> {
    return this.http.post<OtpChallengeResponse>(`${this.base}/login`, payload);
  }

  verifyLogin(email: string, code: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/login/verify-otp`, { email, code })
      .pipe(tap((res) => this.setUser(res.user)));
  }

  resendOtp(email: string, purpose: OtpPurpose): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.base}/resend-otp`, { email, purpose });
  }

  logout(): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.base}/logout`, {})
      .pipe(tap(() => this.clearUser()));
  }

  /** Re-hydrate the session from the cookie (used on app load / refresh). */
  me(): Observable<AppUser> {
    return this.http.get<AppUser>(`${this.base}/me`).pipe(tap((user) => this.setUser(user)));
  }

  dashboardRoute(role: Role): string {
    switch (role) {
      case 'ADMIN':
        return '/admin';
      case 'GUARD':
        return '/guard';
      default:
        return '/visitor';
    }
  }

  private setUser(user: AppUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }

  private clearUser(): void {
    localStorage.removeItem(USER_KEY);
    this.userSubject.next(null);
  }
}
