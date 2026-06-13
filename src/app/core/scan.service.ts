import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './api.config';
import { ScanLog, ScanResultResponse } from './models';

@Injectable({ providedIn: 'root' })
export class ScanService {
  constructor(private http: HttpClient) {}

  /** Send a structurally-valid QR payload to the backend for cryptographic validation. */
  validate(token: string): Observable<ScanResultResponse> {
    return this.http.post<ScanResultResponse>(`${API_BASE}/scan/validate`, { token });
  }

  recent(): Observable<ScanLog[]> {
    return this.http.get<ScanLog[]>(`${API_BASE}/scan/recent`);
  }
}
