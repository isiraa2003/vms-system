import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { AuthService } from '../core/auth.service';
import { ScanService } from '../core/scan.service';
import { AppUser, QR_PREFIX, ScanLog, ScanResultResponse } from '../core/models';

type Outcome = { granted: boolean; title: string; detail: string } | null;

@Component({
  selector: 'app-guard-dashboard',
  standalone: false,
  templateUrl: './guard-dashboard.component.html',
})
export class GuardDashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;

  user: AppUser | null;
  loggingOut = false;

  scanning = false;
  cameraError = '';
  processing = false;
  outcome: Outcome = null;
  recent: ScanLog[] = [];
  manualToken = '';

  private reader = new BrowserMultiFormatReader();
  private controls?: IScannerControls;
  private cooldownUntil = 0;
  private lastHandled = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private scan: ScanService
  ) {
    this.user = this.auth.currentUser;
  }

  ngAfterViewInit(): void {
    this.loadRecent();
    this.startScanner();
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  async startScanner(): Promise<void> {
    this.cameraError = '';
    try {
      this.controls = await this.reader.decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        this.videoRef.nativeElement,
        (result) => {
          if (result) {
            this.onDecoded(result.getText());
          }
        }
      );
      this.scanning = true;
    } catch (e: any) {
      this.scanning = false;
      this.cameraError =
        e?.name === 'NotAllowedError'
          ? 'Camera permission denied. Allow camera access, or paste a token below.'
          : 'No camera available. You can paste a token below to validate it.';
    }
  }

  stopScanner(): void {
    this.controls?.stop();
    this.controls = undefined;
    this.scanning = false;
  }

  /** Called for every decoded frame; debounced so one QR isn't validated repeatedly. */
  private onDecoded(text: string): void {
    const now = Date.now();
    if (this.processing || now < this.cooldownUntil) {
      return;
    }
    if (text === this.lastHandled && now < this.cooldownUntil + 3000) {
      return;
    }
    this.lastHandled = text;
    this.cooldownUntil = now + 3000; // ignore further scans for 3s
    this.handle(text);
  }

  /** Manual paste path (camera-less testing / fallback). */
  submitManual(): void {
    const t = this.manualToken.trim();
    if (t) {
      this.handle(t);
    }
  }

  private handle(rawText: string): void {
    this.outcome = null;

    // ---- Scanner-side structural validation (quishing / injection defense) ----
    const block = this.structuralBlockReason(rawText);
    if (block) {
      this.outcome = { granted: false, title: 'Blocked at scanner', detail: block };
      this.loadRecent();
      return;
    }

    // ---- Structurally OK → server-side cryptographic validation ----
    this.processing = true;
    this.scan.validate(rawText).subscribe({
      next: (res: ScanResultResponse) => {
        this.processing = false;
        this.outcome = {
          granted: res.granted,
          title: res.granted ? 'Access Granted' : 'Access Denied',
          detail: res.granted
            ? `${res.visitorName ?? 'Visitor'} · ${res.visitorRole ?? ''}`
            : res.message,
        };
        this.loadRecent();
      },
      error: (err) => {
        this.processing = false;
        this.outcome = {
          granted: false,
          title: 'Access Denied',
          detail: err?.error?.message || 'Validation failed.',
        };
        this.loadRecent();
      },
    });
  }

  /**
   * Local, pre-network checks. A legitimate pass is "VMS1." + base64url only.
   * Anything else (plain URLs, raw text, SQL/script injection) is dropped here
   * and never sent to the backend.
   */
  private structuralBlockReason(text: string): string | null {
    if (!text) {
      return 'Empty code.';
    }
    if (/^\s*(https?:\/\/|www\.)/i.test(text)) {
      return 'This QR opens a web link — possible phishing. Not a VMS pass.';
    }
    if (/[<>"';]|--|\bunion\b|\bselect\b|<script/i.test(text)) {
      return 'This QR contains unsafe characters — rejected.';
    }
    if (!text.startsWith(QR_PREFIX)) {
      return 'Not a VMS access pass (unrecognised / unencrypted format).';
    }
    return null;
  }

  loadRecent(): void {
    this.scan.recent().subscribe({
      next: (rows) => (this.recent = rows),
      error: () => {},
    });
  }

  clearOutcome(): void {
    this.outcome = null;
  }

  logout(): void {
    this.loggingOut = true;
    this.stopScanner();
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
