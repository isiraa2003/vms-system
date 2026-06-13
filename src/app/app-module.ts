import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { AppComponent } from './app';
import { LoginComponent } from './login/login.component';
import { LandingComponent } from './landing/landing.component';
import { Register } from './register/register';
import { OtpPage } from './otp-page/otp-page';
import { VisitorDashboardComponent } from './dashboards/visitor-dashboard.component';
import { GuardDashboardComponent } from './dashboards/guard-dashboard.component';
import { AdminDashboardComponent } from './dashboards/admin-dashboard.component';
import { credentialsInterceptor } from './core/credentials.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    LandingComponent,
    Register,
    OtpPage,
    VisitorDashboardComponent,
    GuardDashboardComponent,
    AdminDashboardComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [
    provideHttpClient(withInterceptors([credentialsInterceptor]))
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
