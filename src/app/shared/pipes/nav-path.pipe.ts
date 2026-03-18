import { Pipe, PipeTransform } from '@angular/core';

/**
 * Extrae la parte del path antes del '?' para usarla en [routerLink].
 * Ejemplo: '/pages/category-view?brand=NUPEC' → '/pages/category-view'
 */
@Pipe({ name: 'navPath', standalone: false })
export class NavPathPipe implements PipeTransform {
    transform(value: string): string {
        if (!value) return '';
        return value.split('?')[0];
    }
}
