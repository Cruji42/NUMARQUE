import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";


@Injectable({
    providedIn: 'root'
})

export class EndPointMenuService {
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

    getMenu(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/subcategories/menu`, { headers: this.configHeaders() });
    }   

}