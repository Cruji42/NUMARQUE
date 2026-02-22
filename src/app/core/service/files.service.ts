import { Observable, catchError, map, of, throwError} from 'rxjs';
import { computed, Injectable, signal } from '@angular/core';
import { EndPointFilesService } from '../apis/end-point-files.service';


@Injectable({
  providedIn: 'root'
})
export class FilesService {
    constructor(private endPointFilesService: EndPointFilesService) { }

        getRoot(): Observable<any[]> {
            return this.endPointFilesService.getRoot().pipe(
                map((root: any) => {
                    return root.data ;
                }),
                catchError((error) => {
                    return throwError(() => error);
                })
            );
        }
}