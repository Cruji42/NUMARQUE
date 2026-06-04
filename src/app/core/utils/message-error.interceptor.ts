import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorHandlingService } from './error-handling.service';
import { AuthService } from '../service/auth-service';
import { Router } from '@angular/router';

@Injectable()
export class MessageErrorInterceptor implements HttpInterceptor {

  constructor(private errorService: ErrorHandlingService, private authService: AuthService, private router: Router) {
    //  console.log('🔥 INTERCEPTOR INSTANCIADO');
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    //  console.log('➡️ Interceptando request:', req);

    //  console.log('Interceptor ejecutándose'); // 👈 agrega esto
    if (!this.authService.isAuthenticated() && this.authService._currentUser()) {
      this.router.navigate(['/authentication/login']);
      this.errorService.handleHttpError({status: 0, message: 'Usuario no autenticado'} );
      return throwError(() => new Error('Usuario no autenticado'));
    }
    
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {

       this.errorService.handleHttpError(error);

         console.log('Interceptado globalmente:', error);

        // Aquí puedes mostrar modal, toast, etc.
        // this.message.error(errorMessage.title);

        return throwError(() => error);
      })
    );
  }
}