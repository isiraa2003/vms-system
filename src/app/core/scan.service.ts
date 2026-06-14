import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './api.config';
import { ScanDirection, ScanLog, ScanResultResponse } from './models';

@Injectable({ providedIn: 'root' })
export class ScanService {
  constructor(private http: HttpClient) {}

  /** Send a structurally-valid QR payload to the backend for cryptographic validation. */
  validate(token: string, direction: ScanDirection): Observable<ScanResultResponse> {
    return this.http.post<ScanResultResponse>(`${API_BASE}/scan/validate`, { token, direction });
  }

  recent(): Observable<ScanLog[]> {
    return this.http.get<ScanLog[]>(`${API_BASE}/scan/recent`);
  }
}
