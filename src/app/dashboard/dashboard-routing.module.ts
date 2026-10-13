import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DefaultDashboardComponent } from './default/default-dashboard.component';
import { EcommerceDashboardComponent } from './e-commerce/e-commerce-dashboard.component';
import { ProjectsDashboardComponent } from './projects/projects-dashboard.component';
import { CrmDashboardComponent } from './crm/crm-dashboard.component';
import { DownloadsReportComponent } from './downloads-report/downloads-report.component';

const routes: Routes = [
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
    },
    {
        path: 'downloads-report',
        component: DownloadsReportComponent,
        data: {
            title: 'Reporte de descargas',
            headerDisplay: "none"
        }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DashboardRoutingModule { }
