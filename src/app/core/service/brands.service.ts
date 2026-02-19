import { Observable, catchError, map, of, throwError} from 'rxjs';
import { computed, Injectable, signal } from '@angular/core';
import { Brand } from '../interfaces';
import { EndPointBrandService } from '../apis/end-point-brands.service';


@Injectable({
  providedIn: 'root'
})
export class BrandsService {
    constructor(private endPointBrandsService: EndPointBrandService) { }

        getBrands(): Observable<Brand[]> {
            return this.endPointBrandsService.getBrands().pipe(
                map((brand: any) => {
                    return brand.data ;
                }),
                catchError((error) => {
                    return throwError(() => error);
                })
            );
        }
}