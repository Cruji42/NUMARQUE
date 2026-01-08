import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DemoComponentsShareModule } from '../demo-components-share/demo-components-share.module';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { NzDemoProgressCircleDynamicComponent } from './circle-dynamic';
import { NzDemoProgressCircleMiniComponent } from './circle-mini';
import { NzDemoProgressCircleComponent } from './circle';
import { NzDemoProgressDashboardComponent } from './dashboard';
import { NzDemoProgressDynamicComponent } from './dynamic';
import { NzDemoProgressFormatComponent } from './format';
import { NzDemoProgressGradientComponent } from './gradient';
import { NzDemoProgressLineMiniComponent } from './line-mini';
import { NzDemoProgressLineComponent } from './line';
import { NzDemoProgressRoundComponent } from './round';
import { NzDemoProgressSegmentComponent } from './segment';
import { NzDemoProgressStepComponent } from './step';
import { NzDemoProgressZhComponent } from './zh.component';
import { NzDemoProgressEnComponent } from './en.component';


@NgModule({
  imports     : [
    DemoComponentsShareModule,
    NzProgressModule,
    NzButtonModule,
    NzIconModule,
    RouterModule.forChild([
      { path: 'en', component: NzDemoProgressEnComponent },
      { path: 'zh', component: NzDemoProgressZhComponent }
    ])
  ],
  declarations: [
		NzDemoProgressCircleDynamicComponent,
		NzDemoProgressCircleMiniComponent,
		NzDemoProgressCircleComponent,
		NzDemoProgressDashboardComponent,
		NzDemoProgressDynamicComponent,
		NzDemoProgressFormatComponent,
		NzDemoProgressGradientComponent,
		NzDemoProgressLineMiniComponent,
		NzDemoProgressLineComponent,
		NzDemoProgressRoundComponent,
		NzDemoProgressSegmentComponent,
		NzDemoProgressStepComponent,
		NzDemoProgressZhComponent,
		NzDemoProgressEnComponent,

  ],
  schemas: [NO_ERRORS_SCHEMA]
})
export class NzDemoProgressModule {

}
