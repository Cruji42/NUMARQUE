import { Observable, catchError, map, of, throwError } from 'rxjs';
import { EndPointUsersService } from '../apis/end-point-users.service';
import { computed, Injectable, signal } from '@angular/core';
import { User } from '../interfaces';
import { jwtDecode, JwtDecodeOptions } from 'jwt-decode';


@Injectable({
    providedIn: 'root'
})
export class UsersService {
    constructor(private endPointUsersService: EndPointUsersService) { }

    decodeToken() {
        let token:any = localStorage.getItem('token');
        let data = jwtDecode(token)        
        return data
    }

    createUser(userData: User): Observable<any> {
        return this.endPointUsersService.createUser(userData).pipe(
            map((response: any) => {
                return response;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    getUsers(): Observable<User[]> {
        return this.endPointUsersService.getUsers().pipe(            
            map((users: any) => {
                return users.users;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    getUserById(userId: number): Observable<User> {
        return this.endPointUsersService.getUserById(userId).pipe(
            map((user: User) => {
                return user;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }
    updateUser(userData: any, id: number): Observable<any> {
        return this.endPointUsersService.updateUser(userData, id).pipe(
            map((response: any) => {
                return response;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    uploadPhoto(userData: any, id: number): Observable<any> {
        return this.endPointUsersService.uploadPhoto(userData, id).pipe(
            map((response: any) => {
                return response;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    getUser() {
        let user_data: any = this.decodeToken()
        // console.log( user_data)
        return this.endPointUsersService.getUser(user_data.id).pipe(
            map((users: User) => {
                return users;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );

    }

    getMetricsSummary(): Observable<any> {
        return this.endPointUsersService.getMetricsSummary().pipe(
            map((summary: any) => {
                return summary;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    getMetricsActivity(limit: number = 10): Observable<any> {
        return this.endPointUsersService.getMetricsActivity(limit).pipe(
            map((activityResponse: any) => {
                return activityResponse;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    getMetricsTopFiles(limit: number = 5): Observable<any> {
        return this.endPointUsersService.getMetricsTopFiles(limit).pipe(
            map((topFilesResponse: any) => {
                return topFilesResponse;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    getDownloadsByBrand(): Observable<any> {
        return this.endPointUsersService.getDownloadsByBrand().pipe(
            map((downloadsByBrandResponse: any) => {
                return downloadsByBrandResponse;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    getDownloadLogs(): Observable<any> {
        return this.endPointUsersService.getDownloadLogs().pipe(
            map((response: any) => {
                return response;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    getUploadLogs(): Observable<any> {
        return this.endPointUsersService.getUploadLogs().pipe(
            map((response: any) => {
                return response;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    getSharedLogs(): Observable<any> {
        return this.endPointUsersService.getSharedLogs().pipe(
            map((response: any) => {
                return response;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    getUploadedLogs(): Observable<any> {
        return this.endPointUsersService.getUploadedLogs().pipe(
            map((response: any) => {
                return response;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    searchSemantic(query: string, limit: number = 20): Observable<any> {
        return this.endPointUsersService.searchSemantic({ query, limit }).pipe(
            map((response: any) => {
                return response;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    getContentPreviewUrl(contentId: number): Observable<any> {
        return this.endPointUsersService.getContentPreviewUrl(contentId).pipe(
            map((response: any) => {
                return response;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    getNotifications(page: number = 1, perPage: number = 20): Observable<any> {
        return this.endPointUsersService.getNotifications(page, perPage).pipe(
            map((response: any) => {
                return response;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    getUnreadNotificationsCount(): Observable<any> {
        return this.endPointUsersService.getUnreadNotificationsCount().pipe(
            map((response: any) => {
                return response;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    markNotificationAsRead(id: number): Observable<any> {
        return this.endPointUsersService.markNotificationAsRead(id).pipe(
            map((response: any) => {
                return response;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    markAllNotificationsAsRead(): Observable<any> {
        return this.endPointUsersService.markAllNotificationsAsRead().pipe(
            map((response: any) => {
                return response;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }

    getWeeklyNews(userId: number): Observable<any> {
        return this.endPointUsersService.getRandomRecentContent(userId).pipe(
            map((response: any) => {
                return response.data;
            }),
            catchError((error) => {
                return throwError(() => error);
            })
        );
    }
}
