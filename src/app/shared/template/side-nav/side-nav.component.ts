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

        const [targetPathRaw, targetQueryRaw = ''] = (path || '').split('?');
        const currentUrl = this.router.url || '';
        const [currentPathRaw, currentQueryRaw = ''] = currentUrl.split('?');

        if (targetPathRaw !== currentPathRaw) return false;

        const targetParams = this.parseQuery(targetQueryRaw);
        const currentParams = this.parseQuery(currentQueryRaw);

        // Solo comparar params relevantes para selección en category-view
        const keys = ['brandId', 'sectionId', 'subcategoryId'];

        for (const key of keys) {
            const targetValue = targetParams[key] || '';
            const currentValue = currentParams[key] || '';
            if (targetValue !== currentValue) return false;
        }

        return true;
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
