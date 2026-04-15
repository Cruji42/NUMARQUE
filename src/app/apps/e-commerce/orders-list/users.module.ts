// users.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';

import { OrdersListComponent } from './orders-list.component';
import { TableService } from '../../../shared/services/table.service'; // ← importar

const routes: Routes = [
    { path: '', component: OrdersListComponent }
];

@NgModule({
    declarations: [OrdersListComponent],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule.forChild(routes),
        NzTableModule,
        NzButtonModule,
        NzInputModule,
        NzModalModule,
        NzFormModule,
        NzSelectModule,
        NzIconModule.forChild([]),
        NzTagModule,
        NzPopconfirmModule,
    ],
    providers: [
        TableService  // ← agregar aquí
    ]
})
export class UsersModule { }