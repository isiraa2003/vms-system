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

export interface MessageResponse {
  message: string;
}
