import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './api.config';
import { AccessLogRow, AdminStats, AdminUser, Role } from './models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly base = `${API_BASE}/admin`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.base}/stats`);
  }

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.base}/users`);
  }

  setEnabled(id: string, enabled: boolean): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.base}/users/${id}/enabled`, { enabled });
  }

  setRole(id: string, role: Role): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.base}/users/${id}/role`, { role });
  }

  getLogs(): Observable<AccessLogRow[]> {
    return this.http.get<AccessLogRow[]>(`${this.base}/logs`);
  }
}
