import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from './models';

/** Blocks access unless a user session exists. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

/** Blocks access unless the session has the required role. */
export const roleGuard = (required: Role): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.currentUser;
    if (!user) {
      return router.createUrlTree(['/login']);
    }
    if (user.role === required) {
      return true;
    }
    // Logged in but wrong role → send to their own dashboard.
    return router.createUrlTree([auth.dashboardRoute(user.role)]);
  };
};
