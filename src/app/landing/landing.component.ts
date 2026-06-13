import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
  standalone: false
})
export class LandingComponent {

  constructor(private router: Router) {}

  navigateToVisitor(): void {
    this.router.navigate(['/login'], { queryParams: { type: 'visitor' } });
  }

  navigateToSecurity(): void {
    this.router.navigate(['/login'], { queryParams: { type: 'security' } });
  }

  navigateToAdmin(): void {
    this.router.navigate(['/login'], { queryParams: { type: 'admin' } });
  }
}
