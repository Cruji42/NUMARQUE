import { Component, OnInit, Input, TemplateRef, ViewContainerRef, ViewChild } from '@angular/core';
import { TableService } from '../../../shared/services/table.service';
import { NzTableFilterFn, NzTableFilterList, NzTableSortFn, NzTableSortOrder } from 'ng-zorro-antd/table';
import { UsersService } from '../../../core/service/users.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';





import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { BrandsService } from 'src/app/core/service/brands.service';
import { Brand } from 'src/app/core/interfaces';

interface DataItem {
    id: number;
    name: string;
    email: string;
    created_at: string;
    company: string;
    brands: any;
    role_id: number;
    account_status: string;
}

@Component({
    templateUrl: './orders-list.component.html',
    standalone: false,
    styles: './orders-list.component.sccs'
})

export class OrdersListComponent implements OnInit {

    allChecked: boolean = false;
    indeterminate: boolean = false;
    displayData = [];
    userData: any;
    auxUserData: any;
    catBrands = []
    searchInput: string
    searchSelect: any;
    userForm!: FormGroup;

    modalRef!: NzModalRef;
    isConfirmLoading = false;


    @ViewChild('tplTitle', { static: true }) tplTitle!: TemplateRef<any>;
    @ViewChild('tplContent', { static: true }) tplContent!: TemplateRef<any>;
    @ViewChild('tplFooter', { static: true }) tplFooter!: TemplateRef<any>;

    roleList = [
        { text: 'Administrador', value: '1' },
        { text: 'Vendedor', value: '2' },
        { text: 'Cliente', value: '3' },
    ];



    getRoleLabel(roleId: number): string {
        return roleId === 1 ? 'Administrador' : 'Usuario';
    }

    getBrandsLabel(brands: any[]): string {
        if (!Array.isArray(brands)) return '';
        return brands.map(b => b.name).join(', ');
    }


    orderColumn = [
        {
            title: 'ID',
            compare: (a: DataItem, b: DataItem) => a.id - b.id
        },
        {
            title: 'Usuario',
            compare: (a: DataItem, b: DataItem) =>
                (a.name || '').localeCompare(b.name || '')
        },
         {
            title: 'Correo',
            compare: (a: DataItem, b: DataItem) =>
                (a.email || '').localeCompare(b.email || '')
        },
        {
            title: 'Fecha de registro',
            compare: (a: DataItem, b: DataItem) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        },
        {
            title: 'Compañía',
            compare: (a: DataItem, b: DataItem) =>
                (a.company || '').localeCompare(b.company || '')
        },
        {
            title: 'Marcas',
            compare: (a: DataItem, b: DataItem) =>
                this.getBrandsLabel(a.brands)
                    .localeCompare(this.getBrandsLabel(b.brands))
        },
        {
            title: 'Rol',
            compare: (a: DataItem, b: DataItem) =>
                this.getRoleLabel(a.role_id)
                    .localeCompare(this.getRoleLabel(b.role_id))
        },
        {
            title: 'Estatus',
            compare: (a: DataItem, b: DataItem) =>
                (a.account_status || '').localeCompare(b.account_status || '')
        },
        {
            title: 'Opciones'
        }
    ];




    ngOnInit(): void {
        this.getUsersData();
        this.getBrandData()
    }


    constructor(private tableSvc: TableService, private service: UsersService, private brandService: BrandsService, private modal: NzModalService, private viewContainerRef: ViewContainerRef, public fb: FormBuilder) {

    }

    getUsersData() {
        // Use the UsersService to fetch user data
        this.service.getUsers().subscribe({
            next: (users) => {
                console.log('Fetched users:', users);
                this.displayData = users;
                this.userData = users;

            },
            error: (error) => {
                console.error('Error fetching users:', error);
            }
        })
    }

    getBrandData() {
        // Use the UsersService to fetch user data
        this.brandService.getBrands().subscribe({
            next: (brands) => {
                console.log('Fetched users:', brands);
                this.catBrands = brands

            },
            error: (error) => {
                console.error('Error fetching users:', error);
            }
        })
    }

    applyFilters() {
        let data = [...this.userData];

        // 🔍 Filtro por texto
        if (this.searchInput && this.searchInput.trim() !== '') {
            data = this.tableSvc.search(this.searchInput, data);
        }

        // 🟢 Filtro por estatus
        if (this.searchSelect && this.searchSelect !== 'all') {
            data = data.filter(item =>
                item.account_status?.toLowerCase() === this.searchSelect.toLowerCase()
            );
        }

        this.displayData = data;
    }






    openEditModal(item: any): void {
        console.log('ITEM QUE SE ENVÍA:', item);

        this.userForm = this.fb.group({
            user_id: [item.id],
            brand_ids: [item.brands?.map((b: any) => b.id) || []],
            account_status: [item.account_status || 'Pending', Validators.required],
            role_id: [item.role_id, Validators.required]
        });


        this.modalRef = this.modal.create({
            nzTitle: 'Información de usuario',
            nzContent: this.tplContent,
            nzFooter: this.tplFooter,
            nzViewContainerRef: this.viewContainerRef,
            nzData: {
                item
            },
            nzMaskClosable: false,
            nzClosable: false
        });
    }


    closeModal(): void {
        this.modalRef.destroy();
    }

    submitForm(): void {
        if (this.userForm.valid) {
            this.isConfirmLoading = true
            this.service.updateUser(this.userForm.value).subscribe({
                next: (res) => {
                    this.modalRef.destroy()
                    this.isConfirmLoading = false
                    this.getUsersData()
                    console.log('User updated successfully', res);

                },
                error: (err) => {
                    console.error('Error updating user', err);
                }
            });
        } else {
            for (const i in this.userForm.controls) {
                this.userForm.controls[i].markAsDirty();
                this.userForm.controls[i].updateValueAndValidity();
            }
        }
    }



}    