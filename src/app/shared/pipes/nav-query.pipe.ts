import { Pipe, PipeTransform } from '@angular/core';

/**
 * Extrae los query params como objeto para usar en [queryParams].
 * Ejemplo: '/pages/category-view?brand=NUPEC&section=ATL'
 *       → { brand: 'NUPEC', section: 'ATL' }
 *
 * Si no hay query string, devuelve null (routerLink no agrega params).
 */
@Pipe({ name: 'navQuery', standalone: false })
export class NavQueryPipe implements PipeTransform {
    transform(value: string): Record<string, string> | null {
        if (!value || !value.includes('?')) return null;

        const queryString = value.split('?')[1];
        const params: Record<string, string> = {};

        queryString.split('&').forEach(pair => {
            const [key, val] = pair.split('=');
            if (key) {
                params[decodeURIComponent(key)] = decodeURIComponent(val || '');
            }
        });

        return Object.keys(params).length ? params : null;
    }
}
