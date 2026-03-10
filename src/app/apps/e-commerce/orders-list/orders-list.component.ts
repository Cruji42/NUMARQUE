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

    constructor(private tableSvc: TableService, private service: UsersService, private brandService: BrandsService, private modal: NzModalService, private viewContainerRef: ViewContainerRef, public fb: FormBuilder) {

    }

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

        const statusControl = this.userForm.get('account_status');
        const roleControl = this.userForm.get('role_id');
        const brandControl = this.userForm.get('brand_ids');

        statusControl?.valueChanges.subscribe(status => {

            if (status === 'Active') {
                roleControl?.setValidators([Validators.required]);
            } else {
                roleControl?.clearValidators();
                roleControl?.setValue(null);

                brandControl?.clearValidators();
                brandControl?.setValue([]);
            }

            roleControl?.updateValueAndValidity();
        });

        // 👇 Cuando cambia el rol
        roleControl?.valueChanges.subscribe(role => {

            if (role === 1) {
                // 🔹 ADMIN
                brandControl?.clearValidators();
                brandControl?.setValue([]);

            } else if (role === 2) {
                // 🔹 HEAD COMERCIAL
                brandControl?.setValidators([Validators.required]);
                // this.loadAllBrands(); // 👈 TODAS las marcas

            } else if (role === 3) {
                // 🔹 PROVEEDOR
                brandControl?.setValidators([Validators.required]);
                // this.loadBrandsByCountry(); // 👈 Solo por país
            }

            brandControl?.updateValueAndValidity();
        });
    }

    getUsersData() {
        // Use the UsersService to fetch user data
        this.service.getUsers().subscribe({
            next: (users) => {
                // console.log('Fetched users:', users);
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
                // console.log('Fetched users:', brands);
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
            const formData = new FormData();

            const formValue = this.userForm.value;

            // Campos normales
            formData.append('user_id', String(formValue.user_id));
            formData.append('account_status', formValue.account_status);
            formData.append('role_id', String(formValue.role_id));

            // Array brand_ids
            formData.append('brand_ids', formValue.brand_ids);
            this.service.updateUser(formData, formValue.user_id).subscribe({
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