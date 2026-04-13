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

    canAccessRoute(item: any): boolean {
        if (!this.userData?.role_id) {
            return false;
        }
        return item?.canAccess?.includes(this.userData.role_id);
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

        // Match jerárquico estricto para evitar multi-selección:
        // - Si target tiene subcategoryId, exige brandId + sectionId + subcategoryId
        // - Si target tiene sectionId, exige brandId + sectionId
        // - Si target solo tiene brandId, exige solo brandId
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
