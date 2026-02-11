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

  navigateToStudentStaff(): void {
    this.router.navigate(['/login'], { queryParams: { type: 'student-staff' } });
  }

  navigateToVisitorCheckIn(): void {
    this.router.navigate(['/login'], { queryParams: { type: 'visitor' } });
  }

  navigateToSecurityPortal(): void {
    this.router.navigate(['/login'], { queryParams: { type: 'security' } });
  }
}
