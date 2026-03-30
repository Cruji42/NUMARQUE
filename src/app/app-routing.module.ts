import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';

import { FullLayoutComponent } from "./layouts/full-layout/full-layout.component";
import { CommonLayoutComponent } from "./layouts/common-layout/common-layout.component";

import { FullLayout_ROUTES } from "./shared/routes/full-layout.routes";
import { CommonLayout_ROUTES } from "./shared/routes/common-layout.routes";
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { WelcomeComponent } from './pages/welcome/welcome.component';

const appRoutes: Routes = [
    {
        path: '',
        redirectTo: '/authentication/login',
        pathMatch: 'full',
    },
    {
        path: '',
        component: FullLayoutComponent,
        children: FullLayout_ROUTES,
        canActivate: [guestGuard]
    },
    {
        path: '',
        component: CommonLayoutComponent,
        children: CommonLayout_ROUTES,
        canActivate: [authGuard]
    },
    {
        path: 'welcome',
        component: WelcomeComponent,
    }

];

@NgModule({
    imports: [
        RouterModule.forRoot(appRoutes, {
            preloadingStrategy: PreloadAllModules,
            anchorScrolling: 'enabled',
            scrollPositionRestoration: 'enabled'
        })
    ],
    exports: [
        RouterModule
    ]
})

export class AppRoutingModule {
}