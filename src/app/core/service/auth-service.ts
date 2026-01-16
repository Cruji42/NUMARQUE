import { Observable, catchError, map, of, throwError} from 'rxjs';
import { EndPointAuthService } from '../apis/end-point-auth.service';
import { computed, Injectable, signal } from '@angular/core';

import { AuthStatus, JwtPayload } from '../interfaces/index';
import {jwtDecode} from 'jwt-decode';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
    constructor(private endPointAuthService: EndPointAuthService) { }


    public reload = signal<boolean>(false);
    public _currentUser = signal<any>(null);
    public _authStatus = signal<AuthStatus>(AuthStatus.checking);


    public currentUser = computed(() => this._currentUser());
    public authStatus = computed(() => this._authStatus());

    private _token = signal<string | null>(this.getTokenFromStorage());
     isAuthenticated = computed(() => { const token = this._token(); if (!token) return false; return !this.isTokenExpired(token);});
    user = computed<JwtPayload | null>(() => { const token = this._token(); return token ? this.decodeToken(token) : null; });



    setToken(token: string): void {
        localStorage.setItem('token', token);
        this._token.set(token);
    }


    logout(): void {
        localStorage.removeItem('token');
        this._token.set(null);
    }

    getToken(): string | null {
        return this._token();
    }


    login(email: string, password: string): Observable<any> {
        return this.endPointAuthService.login({ email, password }).pipe(
            map(response => {
                // Handle successful login, e.g., store token
                this.setToken(response.token);
                return response;
            }),
            catchError(error => {
                // Handle login error
                return throwError(() => error);
            })
        );

    }

    loginWithGoogle(token: string): Observable<any> {
        return this.endPointAuthService.loginGoogle({ token }).pipe(
            map(response => {
                // Handle successful login, e.g., store token
                this.setToken(response.token);
                return response;
            }),
            catchError(error => {
                // Handle login error
                return throwError(() => error);
            })
        );
    }

    private getTokenFromStorage(): string | null {
        return localStorage.getItem('token');
    }

    private decodeToken(token: string): JwtPayload | null {
        try {
            return jwtDecode<JwtPayload>(token);
        } catch {
            return null;
        }
    }

     private isTokenExpired(token: string): boolean {
        try {
        const decoded = jwtDecode<JwtPayload>(token);
        return Date.now() >= decoded.exp * 1000;
        } catch {
        return true;
        }
    }
}