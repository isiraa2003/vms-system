import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './api.config';
import { QrTokenResponse, VisitorHistory } from './models';

@Injectable({ providedIn: 'root' })
export class QrService {
  constructor(private http: HttpClient) {}

  /** Fetch a fresh dynamic QR access token for the current visitor. */
  getToken(): Observable<QrTokenResponse> {
    return this.http.get<QrTokenResponse>(`${API_BASE}/qr/token`);
  }

  /** The current visitor's attendance summary + recent events. */
  getHistory(): Observable<VisitorHistory> {
    return this.http.get<VisitorHistory>(`${API_BASE}/qr/history`);
  }
}
