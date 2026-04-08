import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";


@Injectable({
    providedIn: 'root'
})

export class EndPointFilesService {

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



    getDirMenu(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/contents/menu/${id}`, { headers: this.configHeaders() });
    }

    getDepartments(): Observable<any> {
        return this.http.get(`${this.apiUrl}/departments/`, { headers: this.configHeaders() });
    }

    getBrandById(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/brands/${id}`, { headers: this.configHeaders() });
    }

    getContentBySubcategory(brandId: number, subCategoryId: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/files/contents?entity_id=${brandId}&subcategory_id=${subCategoryId}`, { headers: this.configHeaders() });
    }


    getSubcategoriesMenu(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/subcategories/menu/${id}`, { headers: this.configHeaders() });
    }

    getSubcategoriesByDepartment(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/subcategories/by-department/${id}`, { headers: this.configHeaders() });
    }

    downloadFile(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/files/${id}/download`, { headers: this.configHeaders() })
    }

    uploadFile(formData: FormData): Observable<any> {
        return this.http.post(`${this.apiUrl}/files/upload`, formData, { headers: this.configHeadersFilea() })
    }

}