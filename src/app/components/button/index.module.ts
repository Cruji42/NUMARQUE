import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DemoComponentsShareModule } from '../demo-components-share/demo-components-share.module';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { NzDemoButtonBasicComponent } from './basic';
import { NzDemoButtonBlockComponent } from './block';
import { NzDemoButtonButtonGroupComponent } from './button-group';
import { NzDemoButtonDangerComponent } from './danger';
import { NzDemoButtonDisabledComponent } from './disabled';
import { NzDemoButtonGhostComponent } from './ghost';
import { NzDemoButtonIconComponent } from './icon';
import { NzDemoButtonLoadingComponent } from './loading';
import { NzDemoButtonMultipleComponent } from './multiple';
import { NzDemoButtonSizeComponent } from './size';
import { NzDemoButtonZhComponent } from './zh.component';
import { NzDemoButtonEnComponent } from './en.component';


@NgModule({
  imports     : [
    DemoComponentsShareModule,
    NzButtonModule,
    NzDropDownModule,
    NzRadioModule,
    NzIconModule,
    RouterModule.forChild([
      { path: 'en', component: NzDemoButtonEnComponent },
      { path: 'zh', component: NzDemoButtonZhComponent }
    ])
  ],
  declarations: [
		NzDemoButtonBasicComponent,
		NzDemoButtonBlockComponent,
		NzDemoButtonButtonGroupComponent,
		NzDemoButtonDangerComponent,
		NzDemoButtonDisabledComponent,
		NzDemoButtonGhostComponent,
		NzDemoButtonIconComponent,
		NzDemoButtonLoadingComponent,
		NzDemoButtonMultipleComponent,
		NzDemoButtonSizeComponent,
		NzDemoButtonZhComponent,
		NzDemoButtonEnComponent,

  ],
  schemas: [NO_ERRORS_SCHEMA]
})
export class NzDemoButtonModule {

}
