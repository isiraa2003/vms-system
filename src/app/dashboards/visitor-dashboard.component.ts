import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as QRCode from 'qrcode';
import { AuthService } from '../core/auth.service';
import { QrService } from '../core/qr.service';
import { AppUser, VisitorHistory } from '../core/models';

@Component({
  selector: 'app-visitor-dashboard',
  standalone: false,
  templateUrl: './visitor-dashboard.component.html',
})
export class VisitorDashboardComponent implements OnInit, OnDestroy {
  user: AppUser | null;
  loggingOut = false;

  qrDataUrl = '';
  loading = true;
  refreshing = false;
  error = '';
  countdown = 0;
  ttl = 30;

  history: VisitorHistory | null = null;

  private tickHandle: any;

  constructor(
    private auth: AuthService,
    private router: Router,
    private qr: QrService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.user = this.auth.currentUser;
  }

  ngOnInit(): void {
    this.refreshQr();
    this.loadHistory();
    this.tickHandle = setInterval(() => this.tick(), 1000);
  }

  ngOnDestroy(): void {
    if (this.tickHandle) {
      clearInterval(this.tickHandle);
    }
  }

  private tick(): void {
    if (this.refreshing || this.error || !this.qrDataUrl) {
      return;
    }
    this.countdown--;
    if (this.countdown <= 0) {
      this.refreshQr();
      this.loadHistory();
    } else {
      // Update the countdown live every second (works with or without Zone.js).
      this.cdr.detectChanges();
    }
  }

  refreshQr(): void {
    if (this.refreshing) {
      return;
    }
    this.refreshing = true;
    this.error = '';

    this.qr.getToken().subscribe({
      next: (res) => {
        QRCode.toDataURL(res.token, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 320,
          color: { dark: '#0f172a', light: '#ffffff' },
        })
          .then((url: string) => {
            this.zone.run(() => {
              this.qrDataUrl = url;
              this.ttl = res.expiresInSeconds || 30;
              this.countdown = res.refreshInSeconds || 30;
              this.loading = false;
              this.refreshing = false;
              this.cdr.detectChanges();
            });
          })
          .catch(() => this.fail('Could not render the QR code.'));
      },
      error: (err) => this.fail(err?.error?.message || 'Could not load your QR pass.'),
    });
  }

  loadHistory(): void {
    this.qr.getHistory().subscribe({
      next: (h) => {
        this.history = h;
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  private fail(message: string): void {
    this.zone.run(() => {
      this.loading = false;
      this.refreshing = false;
      this.error = message;
      this.cdr.detectChanges();
    });
  }

  get progress(): number {
    return this.ttl > 0 ? Math.max(0, Math.min(100, (this.countdown / this.ttl) * 100)) : 0;
  }

  logout(): void {
    this.loggingOut = true;
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
