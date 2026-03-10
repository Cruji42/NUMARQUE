import { Component } from '@angular/core';
import { ThemeConstantService } from '../../services/theme-constant.service';
import { AuthService } from 'src/app/core/service/auth-service';
import { Router } from '@angular/router';
import { UsersService } from 'src/app/core/service/users.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    standalone: false
})

export class HeaderComponent {

    searchVisible: boolean = false;
    quickViewVisible: boolean = false;
    isFolded: boolean;
    isExpand: boolean;

    profile_picture_url: string;
    userData: any;

    constructor(private service: UsersService, private themeService: ThemeConstantService, private authService: AuthService, private router: Router) { }

    ngOnInit(): void {
        this.themeService.isMenuFoldedChanges.subscribe(isFolded => this.isFolded = isFolded);
        this.themeService.isExpandChanges.subscribe(isExpand => this.isExpand = isExpand);
        this.getUserData()
    }

    toggleFold() {
        this.isFolded = !this.isFolded;
        this.themeService.toggleFold(this.isFolded);
    }

    toggleExpand() {
        this.isFolded = false;
        this.isExpand = !this.isExpand;
        this.themeService.toggleExpand(this.isExpand);
        this.themeService.toggleFold(this.isFolded);
    }


    logOut(): void {

        this.authService.logout();
        // this.authService.isAuthenticated();
        // console.log(this.authService.isAuthenticated())
        this.router.navigateByUrl('/authentication/login');



    }




    getUserData() {

        this.service.getUser().subscribe({
            next: (user: any) => {
                // console.log('Fetched users:', user);
                // this.form.patchValue({
                //     ...user,
                //     user_id: user.id
                // })
                this.profile_picture_url = user.profile_picture_url
                this.userData = user
                // this.brands_data = user.brands

            },
            error: (error) => {
                console.error('Error fetching users:', error);
            }
        })
    }

    searchToggle(): void {
        this.searchVisible = !this.searchVisible;
    }

    quickViewToggle(): void {
        this.quickViewVisible = !this.quickViewVisible;
    }

    notificationList = [
        {
            title: 'You received a new message',
            time: '8 min',
            icon: 'mail',
            color: 'ant-avatar-' + 'blue'
        },
        {
            title: 'New user registered',
            time: '7 hours',
            icon: 'user-add',
            color: 'ant-avatar-' + 'cyan'
        },
        {
            title: 'System Alert',
            time: '8 hours',
            icon: 'warning',
            color: 'ant-avatar-' + 'red'
        },
        {
            title: 'You have a new update',
            time: '2 days',
            icon: 'sync',
            color: 'ant-avatar-' + 'gold'
        }
    ];
}
