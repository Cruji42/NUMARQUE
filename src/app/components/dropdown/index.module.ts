import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DemoComponentsShareModule } from '../demo-components-share/demo-components-share.module';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { NzDemoDropdownBasicComponent } from './basic';
import { NzDemoDropdownContextMenuComponent } from './context-menu';
import { NzDemoDropdownDropdownButtonComponent } from './dropdown-button';
import { NzDemoDropdownEventComponent } from './event';
import { NzDemoDropdownItemComponent } from './item';
import { NzDemoDropdownOverlayVisibleComponent } from './overlay-visible';
import { NzDemoDropdownPlacementComponent } from './placement';
import { NzDemoDropdownSubMenuComponent } from './sub-menu';
import { NzDemoDropdownTriggerComponent } from './trigger';
import { NzDemoDropdownZhComponent } from './zh.component';
import { NzDemoDropdownEnComponent } from './en.component';


@NgModule({
  imports     : [
    DemoComponentsShareModule,
    NzDropDownModule,
    NzButtonModule,
    NzIconModule,
    RouterModule.forChild([
      { path: 'en', component: NzDemoDropdownEnComponent },
      { path: 'zh', component: NzDemoDropdownZhComponent }
    ])
  ],
  declarations: [
		NzDemoDropdownBasicComponent,
		NzDemoDropdownContextMenuComponent,
		NzDemoDropdownDropdownButtonComponent,
		NzDemoDropdownEventComponent,
		NzDemoDropdownItemComponent,
		NzDemoDropdownOverlayVisibleComponent,
		NzDemoDropdownPlacementComponent,
		NzDemoDropdownSubMenuComponent,
		NzDemoDropdownTriggerComponent,
		NzDemoDropdownZhComponent,
		NzDemoDropdownEnComponent,

  ],
  schemas: [NO_ERRORS_SCHEMA]
})
export class NzDemoDropdownModule {

}
