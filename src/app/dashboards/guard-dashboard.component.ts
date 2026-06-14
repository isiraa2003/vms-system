import {
  AfterViewInit, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { AuthService } from '../core/auth.service';
import { ScanService } from '../core/scan.service';
import { AppUser, QR_PREFIX, ScanDirection, ScanLog, ScanResultResponse } from '../core/models';

type Outcome = { granted: boolean; title: string; detail: string; direction?: ScanDirection } | null;

@Component({
  selector: 'app-guard-dashboard',
  standalone: false,
  templateUrl: './guard-dashboard.component.html',
})
export class GuardDashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;

  user: AppUser | null;
  loggingOut = false;

  mode: ScanDirection = 'CHECK_IN';
  scanning = false;
  cameraError = '';
  processing = false;
  outcome: Outcome = null;
  recent: ScanLog[] = [];
  manualToken = '';

  cameras: { id: string; label: string }[] = [];
  selectedCamera = '';

  private reader: BrowserMultiFormatReader;
  private controls?: IScannerControls;
  private cooldownUntil = 0;
  private lastHandled = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private scan: ScanService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.user = this.auth.currentUser;
    // QR-only + TRY_HARDER greatly improves reading a QR shown on a phone screen.
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    this.reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
  }

  ngAfterViewInit(): void {
    this.loadRecent();
    this.startScanner();
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  setMode(m: ScanDirection): void {
    this.mode = m;
  }

  async startScanner(): Promise<void> {
    this.cameraError = '';
    this.stopScanner();
    try {
      const device = this.selectedCamera || undefined;
      this.controls = await this.reader.decodeFromVideoDevice(
        device,
        this.videoRef.nativeElement,
        (result) => {
          if (result) {
            this.zone.run(() => this.onDecoded(result.getText()));
          }
        }
      );
      this.scanning = true;
      this.populateCameras();
      this.cdr.detectChanges();
    } catch (e: any) {
      this.scanning = false;
      this.cameraError =
        e?.name === 'NotAllowedError'
          ? 'Camera permission denied. Allow access, switch camera, or upload a QR image below.'
          : 'No camera available. Upload a QR image or paste a token below.';
      this.cdr.detectChanges();
    }
  }

  private async populateCameras(): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.cameras = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, i) => ({ id: d.deviceId, label: d.label || `Camera ${i + 1}` }));
      this.cdr.detectChanges();
    } catch {
      /* ignore */
    }
  }

  switchCamera(id: string): void {
    this.selectedCamera = id;
    this.startScanner();
  }

  stopScanner(): void {
    this.controls?.stop();
    this.controls = undefined;
    this.scanning = false;
  }

  private onDecoded(text: string): void {
    const now = Date.now();
    if (this.processing || now < this.cooldownUntil) {
      return;
    }
    if (text === this.lastHandled && now < this.cooldownUntil + 3000) {
      return;
    }
    this.lastHandled = text;
    this.cooldownUntil = now + 3000;
    this.handle(text);
  }

  /** Decode a QR from an uploaded image (robust fallback for laptops). */
  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    const url = URL.createObjectURL(file);
    this.processing = true;
    this.cdr.detectChanges();
    this.reader
      .decodeFromImageUrl(url)
      .then((res) => {
        this.processing = false;
        this.handle(res.getText());
      })
      .catch(() => {
        this.processing = false;
        this.outcome = { granted: false, title: 'No QR found', detail: 'Could not read a QR code from that image.' };
        this.cdr.detectChanges();
      })
      .finally(() => {
        URL.revokeObjectURL(url);
        input.value = '';
      });
  }

  submitManual(): void {
    const t = this.manualToken.trim();
    if (t) {
      this.handle(t);
    }
  }

  private handle(rawText: string): void {
    this.outcome = null;

    // Scanner-side structural validation (quishing / injection defense).
    const block = this.structuralBlockReason(rawText);
    if (block) {
      this.outcome = { granted: false, title: 'Blocked at scanner', detail: block };
      this.cdr.detectChanges();
      return;
    }

    this.processing = true;
    this.cdr.detectChanges();
    this.scan.validate(rawText, this.mode).subscribe({
      next: (res: ScanResultResponse) => {
        this.processing = false;
        this.outcome = {
          granted: res.granted,
          direction: res.direction,
          title: res.granted ? (res.direction === 'CHECK_OUT' ? 'Checked Out' : 'Checked In') : 'Access Denied',
          detail: res.granted ? `${res.visitorName ?? 'Visitor'} · ${res.visitorRole ?? ''}` : res.message,
        };
        this.loadRecent();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.processing = false;
        this.outcome = { granted: false, title: 'Access Denied', detail: err?.error?.message || 'Validation failed.' };
        this.loadRecent();
        this.cdr.detectChanges();
      },
    });
  }

  private structuralBlockReason(text: string): string | null {
    if (!text) return 'Empty code.';
    if (/^\s*(https?:\/\/|www\.)/i.test(text)) return 'This QR opens a web link — possible phishing. Not a VMS pass.';
    if (/[<>"';]|--|\bunion\b|\bselect\b|<script/i.test(text)) return 'This QR contains unsafe characters — rejected.';
    if (!text.startsWith(QR_PREFIX)) return 'Not a VMS access pass (unrecognised / unencrypted format).';
    return null;
  }

  loadRecent(): void {
    this.scan.recent().subscribe({
      next: (rows) => {
        this.recent = rows;
        this.cdr.detectChanges();
      },
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
