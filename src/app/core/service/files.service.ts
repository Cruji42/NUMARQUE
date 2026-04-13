import { Observable, catchError, map, of, throwError } from 'rxjs';
import { computed, Injectable, signal } from '@angular/core';
import { EndPointFilesService } from '../apis/end-point-files.service';
import { EndPointUsersService } from '../apis/end-point-users.service';
import { UsersService } from './users.service';


@Injectable({
    providedIn: 'root'
})
export class FilesService {
    constructor(private endPointFilesService: EndPointFilesService, private userService: UsersService) { }




    getDirMenu(): Observable<any[]> {
        let user_data: any = this.userService.decodeToken()

        return this.endPointFilesService.getDirMenu(user_data.id).pipe(
            map((root: any) => {
                return root.data;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    downloadFile(id: number): Observable<any[]> {
        return this.endPointFilesService.downloadFile(id).pipe(
            map((res: any) => {
                return res.download_url;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        )
    }

    uploadFile(formData: FormData): Observable<any> {
        return this.endPointFilesService.uploadFile(formData).pipe(
            map((res: any) => {
                return res;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        )
    }

    createFolder(data: any): Observable<any> {
        return this.endPointFilesService.createFolder(data).pipe(
            map((res: any) => {
                return res;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        )
    }

    deleteContent(id: number): Observable<any> {
        return this.endPointFilesService.deleteContent(id).pipe(
            map((res: any) => {
                return res;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        )
    }


}