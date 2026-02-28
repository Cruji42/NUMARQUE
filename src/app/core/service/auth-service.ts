import { Observable, catchError, map, of, throwError } from 'rxjs';
import { EndPointAuthService } from '../apis/end-point-auth.service';
import { computed, Injectable, signal } from '@angular/core';
import { UsersService } from './users.service';

import { AuthStatus, JwtPayload } from '../interfaces/index';
import { jwtDecode } from 'jwt-decode';


@Injectable({
    providedIn: 'root'
})
export class AuthService {
    constructor(
        private endPointAuthService: EndPointAuthService,
        private usersService: UsersService
    ) { }


    public reload = signal<boolean>(false);
    public _currentUser = signal<any>(null);
    public _authStatus = signal<AuthStatus>(AuthStatus.checking);


    public currentUser = computed(() => this._currentUser());
    public authStatus = computed(() => this._authStatus());

    private _token = signal<string | null>(this.getTokenFromStorage());

    user = computed<JwtPayload | null>(() => { const token = this._token(); return token ? this.decodeToken(token) : null; });

    isAuthenticated(): boolean {
        const token = this._token() ?? localStorage.getItem('token');

        if (!token) return false;

        if (this.isTokenExpired(token)) {
            this.clearAuth();
            return false;
        }

        return true;
    }

    clearAuth(): void {
        localStorage.removeItem('token');
        this._token.set(null);
    }


    setToken(token: string): void {
        localStorage.setItem('token', token);
        this._token.set(token);
    }


    logout(): void {
        localStorage.removeItem('token');
        this._token.set(null);
        this.isAuthenticated();

    }

    getToken(): string | null {
        return this._token();
    }


    login(email: string, password: string): Observable<any> {
        return this.endPointAuthService.login({ email, password }).pipe(
            map(response => {
                // Handle successful login, e.g., store token
                this.setToken(response.access_token);

                this.isAuthenticated()
                return response;
            }),
           catchError(error => {
                return throwError(() => error);
            })
        );

    }

    loginWithGoogle(token: string): Observable<any> {
        return this.endPointAuthService.loginGoogle({ token }).pipe(
            map(response => {
                // Handle successful login, e.g., store token
                // console.log(response);
                this.setToken(response.access_token);
                this.isAuthenticated();
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

    validateUserStatus(): Observable<boolean> {
        const token = this._token() ?? localStorage.getItem('token');
        
        if (!token) {
            return of(false);
        }

        try {
            const decoded = jwtDecode<JwtPayload>(token);
            
            const userId = decoded.user_id || decoded.id;
            
            if (!userId) {
                return of(false);
            }

            return this.usersService.getUserById(Number(userId)).pipe(
                map((user) => {
                    const userAny = user as any;
                    const isActive = userAny.account_status === 'Active';
                    return isActive;
                }),
                catchError((error) => {
                    return of(false);
                })
            );
        } catch (error) {
            return of(false);
        }
    }
}
