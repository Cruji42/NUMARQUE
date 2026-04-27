import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { HttpParams, HttpUrlEncodingCodec } from '@angular/common/http';


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

    getContentBySubcategory(brandId: number, subCategoryId: number, folderId?: number | null): Observable<any> {
        const params = new URLSearchParams({
            entity_id: String(brandId),
            subcategory_id: String(subCategoryId)
        });

        if (folderId !== null && folderId !== undefined) {
            params.set('folder_id', String(folderId));
        }

        return this.http.get(`${this.apiUrl}/files/contents?${params.toString()}`, { headers: this.configHeaders() });
    }


    getSubcategoriesMenu(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/subcategories/menu/${id}`, { headers: this.configHeaders() });
    }

    getSubcategoriesByDepartment(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/subcategories/by-department/${id}`, { headers: this.configHeaders() });
    }

    downloadFile(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/files/contents/${id}/download-url`, { headers: this.configHeaders() })
    }

    uploadFile(formData: FormData): Observable<any> {
        return this.http.post(`${this.apiUrl}/files/upload`, formData, { headers: this.configHeadersFilea() })
    }

    createFolder(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/files/new-folder`, data, { headers: this.configHeaders() });
    }

    deleteContent(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/files/contents/${id}`, { headers: this.configHeaders() });
    }


    renameContent(id: number, title: string): Observable<any> {
        return this.http.put(
            `${this.apiUrl}/contents/${id}`,
            { title },
            { headers: this.configHeaders() }
        );
    }

    getFavorites(): Observable<any> {
        return this.http.get(`${this.apiUrl}/favorites`, { headers: this.configHeaders() });
    }

    toggleFavorite(contentId: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/favorites/${contentId}`, {}, { headers: this.configHeaders() });
    }


    checkFavorite(contentId: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/favorites/${contentId}/check`, { headers: this.configHeaders() });
    }

    editInfoContent(data: any): Observable<any>{
        return this.http.put(`${this.apiUrl}/contents/${data.content_id}`, data, { headers: this.configHeaders()})
    }

}