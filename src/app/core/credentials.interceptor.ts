import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Ensures every request is sent with credentials so the browser includes and
 * accepts the HttpOnly auth cookie issued by the backend.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};
