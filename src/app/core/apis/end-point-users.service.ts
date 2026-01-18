import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { User } from "../interfaces";

@Injectable({
  providedIn: 'root'
})

export class EndPointUsersService {
        private apiUrl = environment.apiUrl;

    constructor(
        private http: HttpClient,
   
    ) { }


    createUser(userData: User): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/users`, userData, { observe: 'response' });
    }

    
}