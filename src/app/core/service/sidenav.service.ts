import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, map, tap, shareReplay } from 'rxjs';
import { SideNavInterface } from '../../shared/interfaces/side-nav.type';
import { ROUTES } from '../../shared/template/side-nav/side-nav-routes.config';
import { EndPointMenuService } from '../../core/apis/end-point-menu.service';

// ── Interfaces que describen la respuesta del API ─────────────────────────────

export interface ApiEntity {
    id: number;
    name: string;
    logo: string | null;
    parent_entity_id: number | null;
}

export interface ApiSubcategory {
    id: number;
    name: string;
    description: string;
    icon_url: string | null;
}

export interface ApiDepartment {
    department_id: number;
    department_name: string; // ✅ fix: el API devuelve "department_name", no "name"
    entities: ApiEntity[];
    subcategories: ApiSubcategory[];
}

export interface ApiMenuResponse {
    data: ApiDepartment[];
}

// ── Iconos de departamento ────────────────────────────────────────────────────

const DEPARTMENT_ICONS: Record<string, { iconType: string; icon: string; iconTheme: string }> = {
    'Petfood':       { iconType: 'image',  icon: 'assets/images/others/pet-food.svg', iconTheme: '' },
    'Pecuario':      { iconType: 'image',  icon: 'assets/images/others/pecuario.svg', iconTheme: '' },
    'Institucional': { iconType: 'nzIcon', icon: 'bank',                              iconTheme: 'outline' },
};

// ── Helper: construye el path hacia category-view ─────────────────────────────

const cv = (brand: string, section?: string): string => {
    if (section) {
        return `/pages/category-view?brand=${encodeURIComponent(brand)}&section=${encodeURIComponent(section)}`;
    }
    return `/pages/category-view?brand=${encodeURIComponent(brand)}`;
};

// ── Helper: convierte un logo del API al formato que espera el template ───────

function entityIcon(logo: string | null): { iconType: string; icon: string; iconTheme: string } {
    if (logo) {
        return { iconType: 'image', icon: logo, iconTheme: '' };
    }
    return { iconType: 'nzIcon', icon: '', iconTheme: 'outline' };
}

// ── Builders por tipo de departamento ─────────────────────────────────────────

/**
 * Petfood (dept 1)
 * Estructura: Departamento > Marca (con path a brand) > Subcategoría (con path a brand+section)
 */
function buildPetFoodSubmenu(entities: ApiEntity[], subcategories: ApiSubcategory[]): any {
    const rootEntities = entities.filter(e => e.parent_entity_id === null);

    return rootEntities.map(entity => ({
        path: cv(entity.name),         // ✅ fix: era entity.department_name (no existe en ApiEntity)
        title: entity.name,            // ✅ fix: era entity.department_name (no existe en ApiEntity)
        ...entityIcon(entity.logo),
        canAccess: [1, 2, 3],
        submenu: subcategories.map(sub => ({
            path: cv(entity.name, sub.name),
            title: sub.name,
            iconType: 'nzIcon' as const,
            icon: '',
            iconTheme: 'outline',
            canAccess: [1, 2, 3],
            submenu: []
        }))
    }));
}

/**
 * Pecuario (dept 2)
 * Estructura: Departamento > Especie (con path a brand)
 *               > Sub-marcas [si existen] > Subcategoría
 *               > Subcategoría directa   [si no hay sub-marcas]
 */
function buildPecuarioSubmenu(entities: ApiEntity[], subcategories: ApiSubcategory[]): any {
    const rootEntities  = entities.filter(e => e.parent_entity_id === null);
    const childEntities = entities.filter(e => e.parent_entity_id !== null);

    return rootEntities.map(entity => {
        const children = childEntities.filter(c => c.parent_entity_id === entity.id);

        let submenu: any;

        if (children.length > 0) {
            submenu = children.map(child => ({
                path: cv(child.name),
                title: child.name,
                ...entityIcon(child.logo),
                canAccess: [1, 2, 3],
                submenu: subcategories.map(sub => ({
                    path: cv(child.name, sub.name),
                    title: sub.name,
                    iconType: 'nzIcon' as const,
                    icon: '',
                    iconTheme: 'outline',
                    canAccess: [1, 2, 3],
                    submenu: []
                }))
            }));
        } else {
            submenu = subcategories.map(sub => ({
                path: cv(entity.name, sub.name),
                title: sub.name,
                iconType: 'nzIcon' as const,
                icon: '',
                iconTheme: 'outline',
                canAccess: [1, 2, 3],
                submenu: []
            }));
        }

        return {
            path: cv(entity.name),
            title: entity.name,
            ...entityIcon(entity.logo),
            canAccess: [1, 2, 3],
            submenu
        };
    });
}

/**
 * Institucional (dept 3)
 * Estructura: Departamento > Institución (navega directo, sin tercer nivel)
 */
function buildInstitucionalSubmenu(entities: ApiEntity[]): any {
    return entities
        .filter(e => e.parent_entity_id === null)
        .map(entity => ({
            path: cv(entity.name),
            title: entity.name,
            ...entityIcon(entity.logo),
            canAccess: [1, 2, 3],
            submenu: []
        }));
}

// ── Función principal de mapeo ────────────────────────────────────────────────

function mapDepartmentToNavItem(dept: ApiDepartment): any {
    // ✅ fix: usar dept.department_name (no dept.name) para buscar el icono
    const iconConfig = DEPARTMENT_ICONS[dept.department_name] ?? {
        iconType: 'nzIcon',
        icon: 'appstore',
        iconTheme: 'outline'
    };

    let submenu: any;

    switch (dept.department_id) {
        case 1: // Petfood
            submenu = buildPetFoodSubmenu(dept.entities, dept.subcategories);
            break;
        case 2: // Pecuario
            submenu = buildPecuarioSubmenu(dept.entities, dept.subcategories);
            break;
        case 3: // Institucional
            submenu = buildInstitucionalSubmenu(dept.entities);
            break;
        default:
            submenu = dept.entities
                .filter(e => e.parent_entity_id === null)
                .map(entity => ({
                    path: cv(entity.name),
                    title: entity.name,
                    ...entityIcon(entity.logo),
                    canAccess: [1, 2, 3],
                    submenu: []
                }));
    }

    return {
        path: '',
        title: dept.department_name,          // ✅ fix: era dept.name (no existe en ApiDepartment)
        iconType: iconConfig.iconType as any,
        icon: iconConfig.icon,                // ✅ fix: era 'nzIcon' hardcodeado en lugar de iconConfig.icon
        iconTheme: iconConfig.iconTheme,      // ✅ fix: era 'fill' hardcodeado en lugar de iconConfig.iconTheme
        canAccess: [1, 2, 3],
        submenu
    };
}

// ── Servicio Angular ──────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class SideNavMenuService {

    /**
     * Observable cacheado con shareReplay(1): el API se llama UNA sola vez
     * y todos los suscriptores (SideNav + CategoryView) reciben la misma respuesta
     * sin importar el orden en que se suscriban.
     */
    private menu$: Observable<ApiMenuResponse> = this.endPointMenuService.getMenu().pipe(
        shareReplay(1)
    );

    constructor(private endPointMenuService: EndPointMenuService) {}

    /** Menú completo transformado a SideNavInterface[] (para el side-nav) */
    getMenuItems(): Observable<SideNavInterface[]> {
        return this.menu$.pipe(
            map((response: ApiMenuResponse) => {
                const generalSection  = ROUTES.find(r => r.title === 'General')!;
                const dynamicSections = response.data.map(mapDepartmentToNavItem);
                return [generalSection, ...dynamicSections];
            })
        );
    }

    /**
     * Departamentos crudos del API.
     * CategoryViewComponent los usa para resolver brand → department_id
     * sin listas hardcodeadas y sin hacer una segunda llamada al API.
     */
    getDepartments(): Observable<ApiDepartment[]> {
        return this.menu$.pipe(
            map((response: ApiMenuResponse) => response.data)
        );
    }
}