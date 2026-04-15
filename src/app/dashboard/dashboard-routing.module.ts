import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DefaultDashboardComponent } from './default/default-dashboard.component';
import { EcommerceDashboardComponent } from './e-commerce/e-commerce-dashboard.component';
import { ProjectsDashboardComponent } from './projects/projects-dashboard.component';
import { CrmDashboardComponent } from './crm/crm-dashboard.component';
import { WelcomeComponent } from '../pages/welcome/welcome.component';

const routes: Routes = [
    {
        path: 'welcome',
        component: WelcomeComponent,
        data: {
            title: 'Welcome',
            headerDisplay: "none"
        }
    },
    {
        path: '',
        component: DefaultDashboardComponent,
        data: {
            title: 'Dashboard',
            headerDisplay: "none"
        }
    },
    {
        path: 'e-commerce',
        component: EcommerceDashboardComponent,
        data: {
            title: 'E-Commerce Dashboard ',
            headerDisplay: "none"
        }
    },
    {
        path: 'projects',
        component: ProjectsDashboardComponent,
        data: {
            title: 'Projects Dashboard ',
            headerDisplay: "none"
        }
    },
    {
        path: 'crm',
        component: CrmDashboardComponent,
        data: {
            title: 'CRM',
            headerDisplay: "none"
        }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DashboardRoutingModule { }
