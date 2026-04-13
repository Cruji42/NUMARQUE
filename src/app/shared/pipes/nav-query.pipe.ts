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
            // Pecuario: si viene "brand" como agrupador (Aves/Porcino/etc.) y existe "section" con marca real,
            // se usa section como brand final para category-view.
            if (!params.brandId && params.brand && params.section) {
                const maybeContainer = this.normalizeText(params.brand);
                const maybeRealBrand = (params.section || '').trim();
                if (this.isPecuarioContainer(maybeContainer) && maybeRealBrand) {
                    params.brand = maybeRealBrand;
                }
            }

            // brand -> brandId (marca final)
            if (params.brand && !params.brandId) {
                const brandRaw = (params.brand || '').trim();
                if (/^\d+$/.test(brandRaw)) {
                    params.brandId = brandRaw;
                } else {
                    const brandId = this.mapBrandToDepartmentId(brandRaw);
                    if (brandId) {
                        params.brandId = String(brandId);
                    }
                }
                delete params.brand;
            }

            // Si venía section legacy y ya se usó para resolver brand (caso Pecuario), evitar contaminar sectionId
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
            }

            // section legacy no debe viajar en category-view
            if (params.section) {
                delete params.section;
            }

            // subcategory (legacy name) -> subcategoryId
            if (params.subcategory && !params.subcategoryId) {
                const subcategoryRaw = (params.subcategory || '').trim();
                if (/^\d+$/.test(subcategoryRaw)) {
                    params.subcategoryId = subcategoryRaw;
                } else {
                    const maybeId = this.mapCategoryNameToId(subcategoryRaw);
                    if (maybeId) {
                        params.subcategoryId = String(maybeId);
                    }
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
            TRADE: 103,
            TRAINING: 104,
            'EVENTOS Y BTL': 105,
            TECNICO: 106
        };

        return map[normalized] || null;
    }

    private isPecuarioContainer(value: string): boolean {
        const containers = new Set([
            'AVES',
            'PORCINO',
            'BOVINO',
            'RUMIANTES',
            'ACUICOLA',
            'EQUINO',
            'PECUARIO'
        ]);
        return containers.has(this.normalizeText(value));
    }

    private normalizeText(value: string): string {
        return (value || '')
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }
}
