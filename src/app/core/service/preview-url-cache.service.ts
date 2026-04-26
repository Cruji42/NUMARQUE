import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { EndPointUsersService } from '../apis/end-point-users.service';

@Injectable({ providedIn: 'root' })
export class PreviewUrlCacheService {

    // Guarda el Observable compartido por file id.
    // shareReplay(1) garantiza que solo se hace UNA petición HTTP
    // sin importar cuántos suscriptores haya.
    private cache = new Map<number, Observable<string>>();

    constructor(private endPointUsersService: EndPointUsersService) {}

    getUrl(fileId: number): Observable<string> {
        if (!this.cache.has(fileId)) {
            const request$ = this.endPointUsersService.getContentPreviewUrl(fileId).pipe(
                map((resp: any) => (resp?.preview_url || resp?.url || '').toString().trim()),
                shareReplay(1)
            );
            this.cache.set(fileId, request$);
        }
        return this.cache.get(fileId)!;
    }

    /** Llama esto cuando un archivo se elimina o reemplaza */
    invalidate(fileId: number): void {
        this.cache.delete(fileId);
    }

    /** Limpia todo el caché (útil al cerrar sesión) */
    clear(): void {
        this.cache.clear();
    }
}