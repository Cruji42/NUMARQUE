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
        let token = localStorage.getItem('token');
        let data = jwtDecode(token)
        // console.log(data)
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
            map((users: User[]) => {
                return users;
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
}