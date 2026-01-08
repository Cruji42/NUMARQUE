import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentsRoutingModule } from './components-routing.module';
import { IconDefinition } from '@ant-design/icons-angular';
import { LeftOutline, RightOutline } from '@ant-design/icons-angular/icons';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NZ_CONFIG } from 'ng-zorro-antd/core/config';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzI18nModule } from 'ng-zorro-antd/i18n';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMenuModule } from 'ng-zorro-antd/menu';

import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { ComponentsComponent } from './components.component';
const icons: IconDefinition[] = [LeftOutline, RightOutline];

@NgModule({
  declarations: [ComponentsComponent],
  imports: [
    ComponentsRoutingModule,
    NzIconModule.forRoot(icons),
    NzGridModule,
    NzAffixModule,
    NzMenuModule,
    NzI18nModule,
    NzSelectModule,
    NzPopoverModule,
    NzButtonModule,
    NzInputModule,
    NzIconModule,
    NzBadgeModule

  ],
  schemas: [NO_ERRORS_SCHEMA]
})
export class ComponentsModule {
}
