import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { Brand } from "../interfaces";

@Injectable({
  providedIn: 'root'
})

export class EndPointBrandService {
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


     getBrands(): Observable<Brand[]> {
            return this.http.get<Brand[]>(`${this.apiUrl}/brands`, { headers: this.configHeaders() });
        }
    
}