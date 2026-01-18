import { Observable, catchError, map, of, throwError} from 'rxjs';
import { EndPointUsersService } from '../apis/end-point-users.service';
import { computed, Injectable, signal } from '@angular/core';
import { User } from '../interfaces';


@Injectable({
  providedIn: 'root'
})
export class UsersService {
    constructor(private endPointUsersService: EndPointUsersService) { }

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
}