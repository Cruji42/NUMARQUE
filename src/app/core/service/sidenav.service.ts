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

const cv = (brandId: number, subcategoryId?: number): string => {
    if (subcategoryId) {
        return `/pages/category-view?brandId=${encodeURIComponent(String(brandId))}&subcategoryId=${encodeURIComponent(String(subcategoryId))}`;
    }
    return `/pages/category-view?brandId=${encodeURIComponent(String(brandId))}`;
};

// Helper: navega al departamento → category-view mostrará sus entities como cards
const cvDept = (departmentId: number): string =>
    `/pages/category-view?departmentId=${encodeURIComponent(String(departmentId))}`;

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
        path: cv(entity.id),
        title: entity.name,            // ✅ fix: era entity.department_name (no existe en ApiEntity)
        ...entityIcon(entity.logo),
        canAccess: [1, 2, 3],
        submenu: subcategories.map(sub => ({
            path: cv(entity.id, sub.id),
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
 *
 * Caso A — Especie CON sub-marcas (ej: Aves → NUPIO, PERFECT BROILER…):
 *   Pecuario > Aves (solo despliega) > NUPIO (navega a category-view) → cards de subcategorías
 *
 * Caso B — Especie SIN sub-marcas (ej: Camarón, Cerdos…):
 *   Pecuario > Camarón (navega a category-view) → cards de subcategorías
 */
function buildPecuarioSubmenu(entities: ApiEntity[], subcategories: ApiSubcategory[]): any {
    const rootEntities  = entities.filter(e => e.parent_entity_id === null);
    const childEntities = entities.filter(e => e.parent_entity_id !== null);

    return rootEntities.map(entity => {
        const children = childEntities.filter(c => c.parent_entity_id === entity.id);

        if (children.length > 0) {
            // Caso A: la especie tiene sub-marcas.
            // - El título de la especie navega a category-view y muestra las sub-marcas como cards.
            // - El submenú sigue desplegándose para acceso directo a cada sub-marca.
            return {
                path: cv(entity.id),   // especie: navega a category-view mostrando sus sub-marcas
                title: entity.name,
                ...entityIcon(entity.logo),
                canAccess: [1, 2, 3],
                submenu: children.map(child => ({
                    path: cv(child.id),   // sub-marca: navega a category-view
                    title: child.name,
                    ...entityIcon(child.logo),
                    canAccess: [1, 2, 3],
                    submenu: []
                }))
            };
        } else {
            // Caso B: la especie no tiene sub-marcas → navega directo a category-view.
            return {
                path: cv(entity.id),   // especie: navega a category-view
                title: entity.name,
                ...entityIcon(entity.logo),
                canAccess: [1, 2, 3],
                submenu: []              // sin tercer nivel en el sidenav
            };
        }
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
            path: cv(entity.id),
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
                    path: cv(entity.id),
                    title: entity.name,
                    ...entityIcon(entity.logo),
                    canAccess: [1, 2, 3],
                    submenu: []
                }));
    }

    return {
        path: cvDept(dept.department_id),
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
                //const generalSection  = ROUTES.find(r => r.title === 'General')!;
                const generalSection = ROUTES.find(r => r.title === 'MENU.SIDENAV.GENERAL')!;
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