import { Component } from '@angular/core';
import { ThemeConstantService } from '../../services/theme-constant.service';
import { AuthService } from 'src/app/core/service/auth-service';
import { Router } from '@angular/router';
import { UsersService } from 'src/app/core/service/users.service';
import { TranslationService } from 'src/app/shared/services/translation.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    standalone: false
})

export class HeaderComponent {
    currentLang$ = this.translationService.currentLang$;
    
    searchVisible: boolean = false;
    quickViewVisible: boolean = false;
    isFolded: boolean = false;
    isExpand: boolean = false;

    profile_picture_url: string = '';
    userData: any;

    notificationList: any[] = [];
    unreadCount: number = 0;
    notificationsPage: number = 1;
    notificationsPerPage: number = 20;

    constructor(
        private service: UsersService, 
        private themeService: ThemeConstantService, 
        private authService: AuthService, 
        private router: Router,
        private translationService: TranslationService
    ) { }

    switchToEnglish(): void {
        this.translationService.switchLanguage('en');
    }

    switchToSpanish(): void {
        this.translationService.switchLanguage('es');
    }

    ngOnInit(): void {
        this.themeService.isMenuFoldedChanges.subscribe(isFolded => this.isFolded = isFolded);
        this.themeService.isExpandChanges.subscribe(isExpand => this.isExpand = isExpand);
        this.getUserData();
        this.loadNotifications();
        this.loadUnreadCount();
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

    loadNotifications(): void {
        this.service.getNotifications(this.notificationsPage, this.notificationsPerPage).subscribe({
            next: (response: any) => {
                const items = response?.notifications ?? response?.data ?? response?.items ?? [];
                const list = Array.isArray(items) ? items : [];

                this.notificationList = list
                    .map((item: any) => {
                        const type = String(item?.type ?? item?.notification_type ?? '').toUpperCase();
                        const isRead = Boolean(item?.is_read ?? item?.read ?? false);

                        const rawMessage = String(item?.message ?? item?.title ?? 'Notificación');
                        return {
                            id: item?.id,
                            title: item?.title ?? item?.message ?? 'Notificación',
                            rawMessage,
                            time: this.getRelativeTime(item?.created_at ?? item?.timestamp),
                            icon: this.getNotificationIcon(type),
                            color: this.getNotificationColor(type),
                            isRead,
                            brandId: item?.brand_id ?? null,
                            contentId: item?.content_id ?? null,
                            subcategoryId: item?.subcategory_id ?? null,
                            targetRoute: this.getNotificationRoute(type, rawMessage, item?.brand_id, item?.content_id)
                        };
                    })
                    .filter((item: any) => !item.isRead);
            },
            error: (error) => {
                console.error('Error fetching notifications:', error);
                this.notificationList = [];
            }
        });
    }

    loadUnreadCount(): void {
        this.service.getUnreadNotificationsCount().subscribe({
            next: (response: any) => {
                this.unreadCount = Number(
                    response?.unread_count ??
                    response?.count ??
                    response?.data?.unread_count ??
                    0
                );
            },
            error: (error) => {
                console.error('Error fetching unread notifications count:', error);
                this.unreadCount = 0;
            }
        });
    }

    onNotificationClick(notification: any): void {
        if (!notification) return;

        const navigateToTarget = () => {
            if (!notification?.targetRoute) return;

            if (notification.brandId &&
                (notification.targetRoute as string).includes('category-view')) {
                const queryParams: any = { brandId: notification.brandId };
                if (notification.subcategoryId) queryParams['subcategoryId'] = notification.subcategoryId;  // ✅ NUEVO
                if (notification.contentId) queryParams['contentId'] = notification.contentId;
                this.router.navigate(['/pages/category-view'], { queryParams });
            } else {
                this.router.navigateByUrl(notification.targetRoute);
            }
        };
        if (!notification?.id || notification?.isRead) {
            navigateToTarget();
            return;
        }

        this.service.markNotificationAsRead(notification.id).subscribe({
            next: () => {
                notification.isRead = true;
                this.notificationList = this.notificationList.filter(item => item.id !== notification.id);
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                navigateToTarget();
            },
            error: (error) => {
                console.error('Error marking notification as read:', error);
                navigateToTarget();
            }
        });
    }

    markAllAsRead(): void {
        this.service.markAllNotificationsAsRead().subscribe({
            next: () => {
                this.notificationList = [];
                this.unreadCount = 0;
            },
            error: (error) => {
                console.error('Error marking all notifications as read:', error);
            }
        });
    }

    private getNotificationIcon(type: string): string {
        if (type.includes('MESSAGE')) return 'mail';
        if (type.includes('USER') || type.includes('REGISTER')) return 'user';
        if (type.includes('ALERT') || type.includes('ERROR') || type.includes('WARNING')) return 'warning';
        if (type.includes('UPLOAD')) return 'upload';
        if (type.includes('DOWNLOAD')) return 'download';
        if (type.includes('SHARE')) return 'share-alt';
        return 'notification';
    }

    private getNotificationRoute(
        type: string,
        text: string,
        brandId?: number | null,
        contentId?: number | null,
        subcategoryId?: number | null
    ): string | null {
        const source = `${type} ${text}`.toUpperCase();

        if (
            source.includes('USER') ||
            source.includes('REGISTER') ||
            source.includes('ROLE') ||
            source.includes('STATUS')
        ) {
return '/users';
        }

        if (
            source.includes('UPLOAD') ||
            source.includes('CONTENT') ||
            source.includes('FILE') ||
            source.includes('SHARE') ||
            source.includes('DOWNLOAD')
        ) {
            if (brandId) {
                const params = new URLSearchParams({ brandId: String(brandId) });
                if (contentId) params.set('contentId', String(contentId));
                return `/pages/category-view?${params.toString()}`;
            }
            return '/pages/category-view';
        }

        return null;
    }

    private getNotificationColor(type: string): string {
        if (type.includes('MESSAGE')) return 'ant-avatar-blue';
        if (type.includes('USER') || type.includes('REGISTER')) return 'ant-avatar-cyan';
        if (type.includes('ALERT') || type.includes('ERROR') || type.includes('WARNING')) return 'ant-avatar-red';
        if (type.includes('UPLOAD')) return 'ant-avatar-gold';
        if (type.includes('DOWNLOAD')) return 'ant-avatar-purple';
        if (type.includes('SHARE')) return 'ant-avatar-blue';
        return 'ant-avatar-blue';
    }

    private getRelativeTime(value: any): string {
        if (!value) return 'ahora';
        const date = new Date(String(value).replace(' ', 'T'));
        if (isNaN(date.getTime())) return 'ahora';

        const diffMs = Date.now() - date.getTime();
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;

        if (diffMs < hour) {
            const mins = Math.max(1, Math.floor(diffMs / minute));
            return `hace ${mins} min`;
        }
        if (diffMs < day) {
            const hours = Math.max(1, Math.floor(diffMs / hour));
            return `hace ${hours} h`;
        }

        const days = Math.max(1, Math.floor(diffMs / day));
        return `hace ${days} d`;
    }
}
