import { Component } from '@angular/core';
import { ROUTES } from './side-nav-routes.config';
import { ThemeConstantService } from '../../services/theme-constant.service';
import { UsersService } from 'src/app/core/service/users.service';

@Component({
    selector: 'app-sidenav',
    templateUrl: './side-nav.component.html',
    standalone: false
})

export class SideNavComponent {

    public menuItems: any[]
    isFolded: boolean;
    isSideNavDark: boolean;
    isExpand: boolean;

    userData: any;

    constructor(private themeService: ThemeConstantService, public usersService: UsersService) { }

    ngOnInit(): void {
        this.menuItems = ROUTES.filter(menuItem => menuItem);
        this.themeService.isMenuFoldedChanges.subscribe(isFolded => this.isFolded = isFolded);
        this.themeService.isExpandChanges.subscribe(isExpand => this.isExpand = isExpand);
        this.themeService.isSideNavDarkChanges.subscribe(isDark => this.isSideNavDark = isDark);
        this.getUserData()
    }

    closeMobileMenu(): void {
        if (window.innerWidth < 992) {
            this.isFolded = false;
            this.isExpand = !this.isExpand;
            this.themeService.toggleExpand(this.isExpand);
            this.themeService.toggleFold(this.isFolded);
        }
    }


    getUserData() {

        this.usersService.getUser().subscribe({
            next: (user: any) => {
                console.log('Fetched users:', user);
                // this.form.patchValue({
                //     ...user,
                //     user_id: user.id
                // })
                // this.profile_picture_url = user.profile_picture_url
                this.userData = user
                console.log(this.userData)
                // this.brands_data = user.brands

            },
            error: (error) => {
                console.error('Error fetching users:', error);
            }
        })
    }


    canAccessRoute(item: any): boolean {

        if (!this.userData?.role_id) {
            return false;
        }

        // convertir a string porque en el array están como string
        const roleId = this.userData.role_id;

        return item?.canAccess?.includes(roleId);
    }
}
