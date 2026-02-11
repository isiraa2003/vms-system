import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { AppComponent } from './app';
import { LoginComponent } from './login/login.component';
import { LandingComponent } from './landing/landing.component';
import { Register } from './register/register';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    LandingComponent,
    Register
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
