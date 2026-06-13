import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { AppUser } from '../core/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent {
  user: AppUser | null;
  loggingOut = false;

  constructor(private auth: AuthService, private router: Router) {
    this.user = this.auth.currentUser;
  }

  logout(): void {
    this.loggingOut = true;
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
