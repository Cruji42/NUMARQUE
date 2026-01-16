import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { JwtInterceptor } from "src/app/shared/interceptor/token.interceptor";


@Injectable({
  providedIn: 'root'
})

export class EndPointAuthService {

      private apiUrl = environment.apiUrl;

    constructor(
        private http: HttpClient,
   
    ) { }

    login(credentials: { email: string; password: string }): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/auth/login`, credentials);
    }

    loginGoogle(token: { token: string }): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/auth/google-login`, token);
    }


    // checkExpiredToken( token: string): Observable<any> {


    // }
}
