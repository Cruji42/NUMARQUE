import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';

import { RouterModule } from "@angular/router";
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { ThemeConstantService } from './services/theme-constant.service';
import { SearchPipe } from './pipes/search.pipe';
import { NavQueryPipe } from './pipes/nav-query.pipe';
import { NavPathPipe } from './pipes/nav-path.pipe';

@NgModule({
    exports: [
        CommonModule,
        FormsModule,

        NzIconModule,
        SearchPipe,
        NavPathPipe,
        NavQueryPipe
    ],
    imports: [
        RouterModule,
        CommonModule,
        NzIconModule,
        NzToolTipModule
    ],
    declarations: [
        SearchPipe,
        NavPathPipe,
        NavQueryPipe
    ],
    providers: [
        ThemeConstantService
    ]
})

export class SharedModule { }
