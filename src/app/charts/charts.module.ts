import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { SharedModule } from '../shared/shared.module';
import { ChartsRoutingModule } from './charts-routing.module';
import { ThemeConstantService } from '../shared/services/theme-constant.service';
import { NgChartsModule } from 'ng2-charts';
import { NzCardModule } from 'ng-zorro-antd/card';
import { ChartjsComponent } from './chartjs/chartjs.component';
import { DemoComponentsShareModule } from '../components/demo-components-share/demo-components-share.module';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        ChartsRoutingModule,
        NgChartsModule,
        NzCardModule,
        DemoComponentsShareModule
    ],
    declarations: [
        ChartjsComponent
    ],
    providers: [
        ThemeConstantService
    ]
})

export class ChartsModule {}