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

        const [path, queryString] = value.split('?');
        const params: Record<string, string> = {};

        queryString.split('&').forEach(pair => {
            const [key, val] = pair.split('=');
            if (key) {
                params[decodeURIComponent(key)] = decodeURIComponent(val || '');
            }
        });

        // Normalización específica para category-view:
        // no enviar nombres legacy, sino IDs.
        if (path?.includes('/pages/category-view')) {
            // brand -> brandId
            if (params.brand && !params.brandId) {
                const brandId = this.mapBrandToDepartmentId(params.brand);
                if (brandId) {
                    params.brandId = String(brandId);
                }
                delete params.brand;
            }

            // section (legacy name) -> sectionId
            if (params.section && !params.sectionId) {
                const sectionRaw = (params.section || '').trim();
                if (/^\d+$/.test(sectionRaw)) {
                    params.sectionId = sectionRaw;
                } else {
                    const maybeId = this.mapCategoryNameToId(sectionRaw);
                    if (maybeId) {
                        params.sectionId = String(maybeId);
                    }
                }
                delete params.section;
            }

            // subcategory (legacy name) -> subcategoryId
            if (params.subcategory && !params.subcategoryId) {
                const subcategoryRaw = (params.subcategory || '').trim();
                if (/^\d+$/.test(subcategoryRaw)) {
                    params.subcategoryId = subcategoryRaw;
                }
                delete params.subcategory;
            }
        }

        return Object.keys(params).length ? params : null;
    }

    private mapBrandToDepartmentId(brand: string): number | null {
        const normalized = this.normalizeText(brand);

        // Mapeo de contingencia para links legacy del menú.
        // Ajustar según IDs reales del backend/menú si difieren.
        const map: Record<string, number> = {
            NUPEC: 1,
            NUCAN: 2,
            GALOPE: 3,
            OPTIMO: 4
        };

        return map[normalized] || null;
    }

    private mapCategoryNameToId(category: string): number | null {
        const normalized = this.normalizeText(category);

        // Mapeo de contingencia para categorías legacy.
        // Reemplazar/ajustar con IDs reales del backend si difieren.
        const map: Record<string, number> = {
            ATL: 101,
            DIGITAL: 102,
            TRADE: 103
        };

        return map[normalized] || null;
    }

    private normalizeText(value: string): string {
        return (value || '')
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }
}
