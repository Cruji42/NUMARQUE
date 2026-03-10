import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth-service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    //return auth.user().role_id == 1 ? router.parseUrl('/dashboard/default'): router.parseUrl('/apps/filemanager') 
  }

  return true;
};
