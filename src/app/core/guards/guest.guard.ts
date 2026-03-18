import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth-service';
import { UsersService } from '../service/users.service';
import { map, take } from 'rxjs/operators';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const usersService = inject(UsersService);

  if (auth.isAuthenticated()) {
    return usersService.getUser().pipe(
      take(1),
      map((user: any) => {
        const roleId = user?.role_id;
        return roleId == 1 ? router.parseUrl('/dashboard/default') : router.parseUrl('/apps/file-manager');
      })
    );
  }

  return true;
};
