import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DemoComponentsShareModule } from '../demo-components-share/demo-components-share.module';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { NzDemoBadgeBasicComponent } from './basic';
import { NzDemoBadgeChangeComponent } from './change';
import { NzDemoBadgeColorfulComponent } from './colorful';
import { NzDemoBadgeDotComponent } from './dot';
import { NzDemoBadgeLinkComponent } from './link';
import { NzDemoBadgeNoWrapperComponent } from './no-wrapper';
import { NzDemoBadgeOverflowComponent } from './overflow';
import { NzDemoBadgeStatusComponent } from './status';
import { NzDemoBadgeZhComponent } from './zh.component';
import { NzDemoBadgeEnComponent } from './en.component';


@NgModule({
  imports     : [
    DemoComponentsShareModule,
    NzBadgeModule,
    NzButtonModule,
    NzSwitchModule,
    NzIconModule,
    RouterModule.forChild([
      { path: 'en', component: NzDemoBadgeEnComponent },
      { path: 'zh', component: NzDemoBadgeZhComponent }
    ])
  ],
  declarations: [
		NzDemoBadgeBasicComponent,
		NzDemoBadgeChangeComponent,
		NzDemoBadgeColorfulComponent,
		NzDemoBadgeDotComponent,
		NzDemoBadgeLinkComponent,
		NzDemoBadgeNoWrapperComponent,
		NzDemoBadgeOverflowComponent,
		NzDemoBadgeStatusComponent,
		NzDemoBadgeZhComponent,
		NzDemoBadgeEnComponent,

  ],
  schemas: [NO_ERRORS_SCHEMA]
})
export class NzDemoBadgeModule {

}
