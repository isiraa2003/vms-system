import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './login/login.component';
import { Register } from './register/register';
import { OtpPage } from './otp-page/otp-page';
import { VisitorDashboardComponent } from './dashboards/visitor-dashboard.component';
import { GuardDashboardComponent } from './dashboards/guard-dashboard.component';
import { AdminDashboardComponent } from './dashboards/admin-dashboard.component';
import { authGuard, roleGuard } from './core/auth.guard';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: Register },
  { path: 'verify-otp', component: OtpPage },
  {
    path: 'visitor',
    component: VisitorDashboardComponent,
    canActivate: [authGuard, roleGuard('VISITOR')]
  },
  {
    path: 'guard',
    component: GuardDashboardComponent,
    canActivate: [authGuard, roleGuard('GUARD')]
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard('ADMIN')]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
