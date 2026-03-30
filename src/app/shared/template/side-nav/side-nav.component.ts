import { Component, OnInit } from '@angular/core';
import { ThemeConstantService } from '../../services/theme-constant.service';
import { UsersService } from 'src/app/core/service/users.service';
import { SideNavMenuService } from '../../../core/service/sidenav.service'; // ajusta la ruta según tu proyecto
import { SideNavInterface } from '../../interfaces/side-nav.type';

@Component({
    selector: 'app-sidenav',
    templateUrl: './side-nav.component.html',
    standalone: false
})
export class SideNavComponent implements OnInit {

    menuItems: SideNavInterface[] = [];
    isFolded: boolean;
    isSideNavDark: boolean;
    isExpand: boolean;
    userData: any;

    constructor(
        private themeService: ThemeConstantService,
        public usersService: UsersService,
        private menuService: SideNavMenuService
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
}