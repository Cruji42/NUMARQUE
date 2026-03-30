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

    configHeaders() {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        return headers;
    }

      configHeadersFilea() {
        const token = localStorage.getItem('token');
        const headers = {
            'Authorization': `Bearer ${token}`
        };
        return headers;
    }

    createUser(userData: User): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/users`, userData, { observe: 'response' });
    }

    updateUser(userData: User, id: any): Observable<any>{
        return this.http.put<any>(`${this.apiUrl}/users/` + id, userData, { headers: this.configHeadersFilea() })
    }
    
    uploadPhoto(userData: any, id: number): Observable<any>{
        return this.http.put<any>(`${this.apiUrl}/users/` + id, userData, { headers: this.configHeadersFilea() })
    }


    getUsers(): Observable<User[]> {
        return this.http.get<User[]>(`${this.apiUrl}/users`, { headers: this.configHeaders() });
    }

    getUserById(userId: number): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/users/${userId}`, { headers: this.configHeaders() });
    }

    getUser(id: number): Observable<User>{        
        return this.http.get<User>(`${this.apiUrl}/users/` + id,{ headers: this.configHeaders()} )
    }

    
    

    
}
