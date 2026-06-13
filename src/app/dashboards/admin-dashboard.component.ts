import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { AdminService } from '../core/admin.service';
import { AccessLogRow, AdminStats, AdminUser, AppUser, Role } from '../core/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  user: AppUser | null;
  loggingOut = false;

  tab: 'users' | 'logs' = 'users';
  stats: AdminStats | null = null;
  users: AdminUser[] = [];
  logs: AccessLogRow[] = [];
  loadingUsers = true;
  loadingLogs = false;
  error = '';
  readonly roles: Role[] = ['VISITOR', 'GUARD', 'ADMIN'];

  constructor(
    private auth: AuthService,
    private router: Router,
    private admin: AdminService,
    private cdr: ChangeDetectorRef
  ) {
    this.user = this.auth.currentUser;
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadUsers();
  }

  selectTab(tab: 'users' | 'logs'): void {
    this.tab = tab;
    if (tab === 'logs' && this.logs.length === 0) {
      this.loadLogs();
    }
  }

  loadStats(): void {
    this.admin.getStats().subscribe({
      next: (s) => {
        this.stats = s;
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.admin.getUsers().subscribe({
      next: (u) => {
        this.users = u;
        this.loadingUsers = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingUsers = false;
        this.error = err?.error?.message || 'Failed to load users.';
        this.cdr.detectChanges();
      },
    });
  }

  loadLogs(): void {
    this.loadingLogs = true;
    this.admin.getLogs().subscribe({
      next: (l) => {
        this.logs = l;
        this.loadingLogs = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingLogs = false;
        this.cdr.detectChanges();
      },
    });
  }

  toggleEnabled(u: AdminUser): void {
    this.admin.setEnabled(u.id, !u.enabled).subscribe({
      next: (updated) => {
        u.enabled = updated.enabled;
        this.loadStats();
        this.cdr.detectChanges();
      },
      error: (err) => this.flash(err),
    });
  }

  changeRole(u: AdminUser, role: Role): void {
    if (role === u.role) {
      return;
    }
    this.admin.setRole(u.id, role).subscribe({
      next: (updated) => {
        u.role = updated.role;
        this.loadStats();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.flash(err);
        this.loadUsers(); // revert the dropdown to the server's truth
      },
    });
  }

  isSelf(u: AdminUser): boolean {
    return this.user?.id === u.id;
  }

  private flash(err: any): void {
    this.error = err?.error?.message || 'Action failed.';
    this.cdr.detectChanges();
    setTimeout(() => {
      this.error = '';
      this.cdr.detectChanges();
    }, 4000);
  }

  logout(): void {
    this.loggingOut = true;
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
