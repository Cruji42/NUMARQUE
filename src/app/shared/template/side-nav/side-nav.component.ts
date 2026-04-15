import { Component, OnInit } from '@angular/core';
import { ThemeConstantService } from '../../services/theme-constant.service';
import { UsersService } from 'src/app/core/service/users.service';
import { SideNavMenuService } from '../../../core/service/sidenav.service'; // ajusta la ruta según tu proyecto
import { SideNavInterface } from '../../interfaces/side-nav.type';
import { Router } from '@angular/router';

@Component({
    selector: 'app-sidenav',
    templateUrl: './side-nav.component.html',
    standalone: false
})
export class SideNavComponent implements OnInit {

    menuItems: SideNavInterface[] = [];
    isFolded: boolean = false;
    isSideNavDark: boolean = false;
    isExpand: boolean = false;
    userData: any;

    constructor(
        private themeService: ThemeConstantService,
        public usersService: UsersService,
        private menuService: SideNavMenuService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.themeService.isMenuFoldedChanges.subscribe(isFolded => this.isFolded = isFolded);
        this.themeService.isExpandChanges.subscribe(isExpand => this.isExpand = isExpand);
        this.themeService.isSideNavDarkChanges.subscribe(isDark => this.isSideNavDark = isDark);

        this.getUserData();
        this.loadMenu();
    }

    loadMenu(): void {
        this.menuService.getMenuItems().subscribe({
            next: (items) => {
                this.menuItems = items;
            },
            error: (error) => {
                console.error('Error loading menu:', error);
            }
        });
    }

    closeMobileMenu(): void {
        if (window.innerWidth < 992) {
            this.isFolded = false;
            this.isExpand = !this.isExpand;
            this.themeService.toggleExpand(this.isExpand);
            this.themeService.toggleFold(this.isFolded);
        }
    }

    getUserData(): void {
        this.usersService.getUser().subscribe({
            next: (user: any) => {
                this.userData = user;
            },
            error: (error) => {
                console.error('Error fetching users:', error);
            }
        });
    }

    // ----------------------------------------------------------------
    // Constantes de roles
    // ----------------------------------------------------------------
    private readonly ROLE_ADMIN          = 1;
    private readonly ROLE_HEAD_COMERCIAL = 2;
    private readonly ROLE_PROVEEDOR      = 3;

    canAccessRoute(item: any): boolean {
        if (!this.userData?.role_id) return false;

        const roleId: number = this.userData.role_id;

        // 1. Verificar permiso de rol declarado en canAccess
        if (!item?.canAccess?.includes(roleId)) return false;

        // 2. Para proveedor: filtrar además por marcas asignadas
        if (roleId === this.ROLE_PROVEEDOR) {
            return this.proveedorCanSeeItem(item);
        }

        return true;
    }

    /**
     * Extrae las marcas asignadas al usuario como sets de IDs y nombres normalizados
     * para comparación eficiente.
     */
    private get assignedBrandSets(): { ids: Set<number>; names: Set<string> } {
        const brands: any[] = this.userData?.brands ?? [];
        return {
            ids:   new Set(brands.map((b: any) => Number(b?.id)).filter(Boolean)),
            names: new Set(brands.map((b: any) => this.normalizeText(b?.name ?? '')).filter(Boolean))
        };
    }

    /**
     * Un proveedor solo ve ítems cuyo brandId o título (o algún descendiente)
     * coincida con una de sus marcas asignadas.
     * Los ítems de utilidad (Inicio, Búsqueda, Perfil) siempre son visibles.
     */
    private proveedorCanSeeItem(item: any): boolean {
        // Secciones estáticas siempre visibles (la sección padre "General" y sus hijos de utilidad)
        const UTILITY_TITLES = ['GENERAL'];
        if (item.title && UTILITY_TITLES.includes(this.normalizeText(item.title))) return true;

const UTILITY_PATHS = ['/welcome', '/search', '/users', '/pages/setting'];
        if (item.path && UTILITY_PATHS.includes(item.path)) return true;

        const { ids, names } = this.assignedBrandSets;
        if (!ids.size && !names.size) return false;

        return this.itemMatchesBrands(item, ids, names);
    }

    /**
     * Comparación dual: primero por brandId numérico (extraído del path),
     * luego por nombre normalizado del título.
     * Recorre recursivamente el árbol de submenús.
     */
    private itemMatchesBrands(item: any, ids: Set<number>, names: Set<string>): boolean {
        if (item.path) {
            const brandIdFromPath = this.extractBrandIdFromPath(item.path);
            if (brandIdFromPath !== null && ids.has(brandIdFromPath)) return true;
        }

        const title = this.normalizeText(item?.title ?? '');
        if (title && names.has(title)) return true;

        if (item.submenu?.length) {
            return item.submenu.some((child: any) => this.itemMatchesBrands(child, ids, names));
        }

        return false;
    }

    /**
     * Extrae el brandId numérico del path de un ítem de menú.
     * Soporta: "?brandId=1" y "?brand=NUPEC" (resuelto vía mapBrandToDepartmentId)
     */
    private extractBrandIdFromPath(path: string): number | null {
        if (!path?.includes('?')) return null;

        const [, qs] = path.split('?');
        const params: Record<string, string> = {};
        qs.split('&').forEach(pair => {
            const [k, v] = pair.split('=');
            if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
        });

        if (params['brandId'] && /^\d+$/.test(params['brandId'])) {
            return Number(params['brandId']);
        }

        if (params['brand']) {
            return this.mapBrandToDepartmentId(params['brand']);
        }

        return null;
    }

    isCategoryViewLink(path?: string): boolean {
        return !!path && path.includes('/pages/category-view');
    }

    isCategoryViewActive(path?: string): boolean {
        if (!this.isCategoryViewLink(path)) return false;

        const [targetPathRaw] = (path || '').split('?');
        const currentUrl = this.router.url || '';
        const [currentPathRaw, currentQueryRaw = ''] = currentUrl.split('?');

        if (targetPathRaw !== currentPathRaw) return false;

        const targetParams = this.parseCategoryViewParams(path || '');
        const currentParams = this.parseQuery(currentQueryRaw);

        // Caso departmentId: el item del departamento se activa cuando la URL
        // trae ese mismo departmentId (independientemente de brandId, etc.)
        const targetDeptId = targetParams['departmentId'] || '';
        if (targetDeptId) {
            return targetDeptId === (currentParams['departmentId'] || '');
        }

        // Match jerárquico estricto para evitar multi-selección:
        const targetBrandId = targetParams['brandId'] || '';
        const targetSectionId = targetParams['sectionId'] || '';
        const targetSubcategoryId = targetParams['subcategoryId'] || '';

        const currentBrandId = currentParams['brandId'] || '';
        const currentSectionId = currentParams['sectionId'] || '';
        const currentSubcategoryId = currentParams['subcategoryId'] || '';

        if (!targetBrandId || targetBrandId !== currentBrandId) return false;

        if (targetSubcategoryId) {
            return targetSectionId === currentSectionId && targetSubcategoryId === currentSubcategoryId;
        }

        if (targetSectionId) {
            return targetSectionId === currentSectionId && !currentSubcategoryId;
        }

        return !currentSectionId && !currentSubcategoryId;
    }

    private parseCategoryViewParams(pathWithQuery: string): Record<string, string> {
        const out: Record<string, string> = {};
        if (!pathWithQuery || !pathWithQuery.includes('?')) return out;

        const [, queryString] = pathWithQuery.split('?');
        if (!queryString) return out;

        queryString.split('&').forEach(pair => {
            const [k, v] = pair.split('=');
            if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '');
        });

        // Pecuario: si brand es agrupador y section trae marca real, usar section como brand final
        if (!out.brandId && out.brand && out.section) {
            const maybeContainer = this.normalizeText(out.brand);
            const maybeRealBrand = (out.section || '').trim();
            if (this.isPecuarioContainer(maybeContainer) && maybeRealBrand) {
                out.brand = maybeRealBrand;
            }
        }

        // Misma normalización base de category-view usada en navQuery
        if (out.brand && !out.brandId) {
            const brandRaw = (out.brand || '').trim();
            if (/^\d+$/.test(brandRaw)) {
                out.brandId = brandRaw;
            } else {
                const mapped = this.mapBrandToDepartmentId(brandRaw);
                if (mapped) out.brandId = String(mapped);
            }
            delete out.brand;
        }

        if (out.section && !out.sectionId) {
            const sectionRaw = (out.section || '').trim();
            if (/^\d+$/.test(sectionRaw)) {
                out.sectionId = sectionRaw;
            } else {
                const mapped = this.mapCategoryNameToId(sectionRaw);
                if (mapped) out.sectionId = String(mapped);
            }
            delete out.section;
        }

        if (out.subcategory && !out.subcategoryId) {
            const subRaw = (out.subcategory || '').trim();
            if (/^\d+$/.test(subRaw)) {
                out.subcategoryId = subRaw;
            } else {
                const mapped = this.mapCategoryNameToId(subRaw);
                if (mapped) out.subcategoryId = String(mapped);
            }
            delete out.subcategory;
        }

        return out;
    }

    private mapBrandToDepartmentId(brand: string): number | null {
        const normalized = this.normalizeText(brand);
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

    private parseQuery(query: string): Record<string, string> {
        const out: Record<string, string> = {};
        if (!query) return out;

        query.split('&').forEach(pair => {
            const [k, v] = pair.split('=');
            if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '');
        });

        return out;
    }
}
