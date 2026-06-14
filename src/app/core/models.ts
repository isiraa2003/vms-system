// Shared domain types for the VMS frontend.

export type Role = 'ADMIN' | 'GUARD' | 'VISITOR';

export type OtpPurpose = 'REGISTRATION' | 'LOGIN';

export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  idNumber?: string;
  role: Role;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone?: string;
  idNumber: string;
  password: string;
  role: 'VISITOR' | 'GUARD';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface OtpChallengeResponse {
  message: string;
  email: string;
  purpose: OtpPurpose;
}

export interface AuthResponse {
  message: string;
  user: AppUser;
}

/** Response to the password step of login. If otpRequired is false (admins),
 *  the cookie is already set and `user` is populated. */
export interface LoginResponse {
  otpRequired: boolean;
  message: string;
  email: string;
  purpose?: OtpPurpose;
  user?: AppUser;
}

export interface MessageResponse {
  message: string;
}

export interface QrTokenResponse {
  token: string;
  issuedAt: string;
  expiresInSeconds: number;
  refreshInSeconds: number;
}

export type AccessResult = 'GRANTED' | 'DENIED';
export type ScanDirection = 'CHECK_IN' | 'CHECK_OUT';

export interface ScanResultResponse {
  granted: boolean;
  message: string;
  visitorName?: string;
  visitorRole?: string;
  direction?: ScanDirection;
  scannedAt: string;
}

export interface ScanLog {
  visitorName?: string;
  visitorRole?: string;
  result: AccessResult;
  direction?: ScanDirection;
  reason: string;
  scannedAt: string;
}

export interface VisitorEvent {
  direction?: ScanDirection;
  result: AccessResult;
  reason: string;
  scannedAt: string;
}

export interface VisitorHistory {
  inside: boolean;
  since?: string;
  totalVisits: number;
  events: VisitorEvent[];
}

export interface PresentVisitor {
  visitorId: string;
  visitorName?: string;
  visitorRole?: string;
  since?: string;
}

/** Prefix that identifies a legitimate VMS-issued encrypted QR payload. */
export const QR_PREFIX = 'VMS1.';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  idNumber?: string;
  role: Role;
  enabled: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export interface AccessLogRow {
  id: string;
  visitorName?: string;
  visitorRole?: string;
  guardName?: string;
  result: AccessResult;
  direction?: ScanDirection;
  reason: string;
  scannedAt: string;
}

export interface AdminStats {
  totalUsers: number;
  visitors: number;
  guards: number;
  admins: number;
  currentlyInside: number;
  grantedToday: number;
  deniedToday: number;
}
