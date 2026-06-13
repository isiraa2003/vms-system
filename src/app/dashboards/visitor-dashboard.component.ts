import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as QRCode from 'qrcode';
import { AuthService } from '../core/auth.service';
import { QrService } from '../core/qr.service';
import { AppUser } from '../core/models';

@Component({
  selector: 'app-visitor-dashboard',
  standalone: false,
  templateUrl: './visitor-dashboard.component.html',
})
export class VisitorDashboardComponent implements OnInit, OnDestroy {
  user: AppUser | null;
  loggingOut = false;

  qrDataUrl = '';
  loading = true;         // first-load spinner
  refreshing = false;     // a fetch/render is in flight (re-entrancy guard)
  error = '';
  countdown = 0;          // seconds until the current QR expires
  ttl = 30;               // full validity window (for the progress bar)

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
    this.tickHandle = setInterval(() => this.tick(), 1000);
  }

  ngOnDestroy(): void {
    if (this.tickHandle) {
      clearInterval(this.tickHandle);
    }
  }

  private tick(): void {
    // Don't run the countdown while a refresh is in flight, on error, or before the first load.
    if (this.refreshing || this.error || !this.qrDataUrl) {
      return;
    }
    this.countdown--;
    if (this.countdown <= 0) {
      this.refreshQr();
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
          color: { dark: '#111827', light: '#ffffff' },
        })
          .then((url: string) => {
            // Ensure state changes are seen by Angular's change detection.
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

  /** On failure: stop the spinner, show the error, and do NOT auto-retry (manual Retry only). */
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
