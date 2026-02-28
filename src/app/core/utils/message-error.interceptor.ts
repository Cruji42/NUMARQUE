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

@Injectable()
export class MessageErrorInterceptor implements HttpInterceptor {

  constructor(private errorService: ErrorHandlingService) {
     console.log('🔥 INTERCEPTOR INSTANCIADO');
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
     console.log('➡️ Interceptando request:', req);

     console.log('Interceptor ejecutándose'); // 👈 agrega esto

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