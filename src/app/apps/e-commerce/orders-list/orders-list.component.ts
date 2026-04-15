import { Component, OnInit, TemplateRef, ViewContainerRef, ViewChild } from '@angular/core';
import { TableService } from '../../../shared/services/table.service';
import { UsersService } from '../../../core/service/users.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { BrandsService } from 'src/app/core/service/brands.service';
import * as XLSX from 'xlsx';

interface DataItem {
    id: number;
    name: string;
    email: string;
    created_at: string;
    company: string;
    brands: any[];
    role_id: number;
    account_status: string;
    profile_picture_url?: string;
    last_name?: string;
}

@Component({
    templateUrl: './orders-list.component.html',
    styleUrls: ['./orders-list.component.scss'],
    standalone: false,
})
export class OrdersListComponent implements OnInit {

    displayData: any[] = [];
    userData: any[] = [];
    catBrands: any[] = [];
    searchInput: string = '';
    searchSelect: string = '';
    filterRole: any = null;
    userForm!: FormGroup;
    modalRef!: NzModalRef;
    isConfirmLoading = false;
    modalMode: 'edit' | 'create' = 'edit';

    @ViewChild('tplContent', { static: true }) tplContent!: TemplateRef<any>;
    @ViewChild('tplFooter', { static: true }) tplFooter!: TemplateRef<any>;

    // ----------------------------------------------------------------
    // Password validators (igual que sign-up-3)
    // ----------------------------------------------------------------
    confirmationValidator = (control: FormControl): { [s: string]: boolean } => {
        if (!control.value) {
            return { required: true };
        } else if (control.value !== this.userForm?.get('password')?.value) {
            return { confirm: true, error: true };
        }
        return {};
    }

    updateConfirmValidator(): void {
        Promise.resolve().then(() => this.userForm?.get('checkPassword')?.updateValueAndValidity());
    }

    minLengthValidator(control: FormControl) {
        if (!control.value) return null;
        return control.value.length >= 8 ? null : { minLength: true };
    }
    uppercaseValidator(control: FormControl) {
        if (!control.value) return null;
        return /[A-Z]/.test(control.value) ? null : { uppercase: true };
    }
    lowercaseValidator(control: FormControl) {
        if (!control.value) return null;
        return /[a-z]/.test(control.value) ? null : { lowercase: true };
    }
    numberValidator(control: FormControl) {
        if (!control.value) return null;
        return /\d/.test(control.value) ? null : { number: true };
    }
    specialCharValidator(control: FormControl) {
        if (!control.value) return null;
        return /[@$!%*?&._-]/.test(control.value) ? null : { specialChar: true };
    }

    constructor(
        private tableSvc: TableService,
        private service: UsersService,
        private brandService: BrandsService,
        private modal: NzModalService,
        private viewContainerRef: ViewContainerRef,
        public fb: FormBuilder
    ) { }

    // ----------------------------------------------------------------
    // Sort columns
    // ----------------------------------------------------------------
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
            title: 'Fecha registro',
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
                this.getBrandsLabel(a.brands).localeCompare(this.getBrandsLabel(b.brands))
        },
        {
            title: 'Rol',
            compare: (a: DataItem, b: DataItem) =>
                this.getRoleLabel(a.role_id).localeCompare(this.getRoleLabel(b.role_id))
        },
        {
            title: 'Estado',
            compare: (a: DataItem, b: DataItem) =>
                (a.account_status || '').localeCompare(b.account_status || '')
        },
        { title: 'Acciones', compare: null }
    ];

    // ----------------------------------------------------------------
    // Lifecycle
    // ----------------------------------------------------------------
    ngOnInit(): void {
        this.getUsersData();
        this.getBrandData();
    }

    // ----------------------------------------------------------------
    // Data fetching
    // ----------------------------------------------------------------
    getUsersData(): void {
        this.service.getUsers().subscribe({
            next: (users) => {
                this.displayData = users;
                this.userData = users;
            },
            error: (err) => console.error('Error fetching users:', err)
        });
    }

    getBrandData(): void {
        this.brandService.getBrands().subscribe({
            next: (brands: any[]) => { this.catBrands = brands; },
            error: (err) => console.error('Error fetching brands:', err)
        });
    }

    // ----------------------------------------------------------------
    // Filters
    // ----------------------------------------------------------------
    get pendingCount(): number {
        return (this.userData || []).filter(u =>
            u.account_status?.toLowerCase() === 'pending'
        ).length;
    }

    filterPending(): void {
        this.searchSelect = 'pending';
        this.applyFilters();
    }

    applyFilters(): void {
        let data = [...this.userData];

        if (this.searchInput?.trim()) {
            data = this.tableSvc.search(this.searchInput, data);
        }

        if (this.searchSelect && this.searchSelect !== 'all') {
            data = data.filter(item =>
                item.account_status?.toLowerCase() === this.searchSelect.toLowerCase()
            );
        }

        if (this.filterRole && this.filterRole !== 'all') {
            data = data.filter(item => item.role_id === this.filterRole);
        }

        this.displayData = data;
    }

    // ----------------------------------------------------------------
    // Quick approve / reject (pending rows)
    // ----------------------------------------------------------------
    approveUser(item: DataItem): void {
        const formData = new FormData();
        formData.append('user_id', String(item.id));
        formData.append('account_status', 'Active');
        formData.append('role_id', String(item.role_id));
        formData.append('brand_ids', (item.brands?.map((b: any) => b.id) || []).join(','));

        this.service.updateUser(formData, item.id).subscribe({
            next: () => this.getUsersData(),
            error: (err) => console.error('Error approving user', err)
        });
    }

    rejectUser(item: DataItem): void {
        const formData = new FormData();
        formData.append('user_id', String(item.id));
        formData.append('account_status', 'Rejected');
        formData.append('role_id', String(item.role_id));
        formData.append('brand_ids', '');

        this.service.updateUser(formData, item.id).subscribe({
            next: () => this.getUsersData(),
            error: (err) => console.error('Error rejecting user', err)
        });
    }

    // ----------------------------------------------------------------
    // Edit modal
    // ----------------------------------------------------------------
    openEditModal(item: DataItem): void {
        this.modalMode = 'edit';

        this.userForm = this.fb.group({
            user_id: [item.id],
            brand_ids: [item.brands?.map((b: any) => b.id) || []],
            account_status: [item.account_status || 'Pending', Validators.required],
            role_id: [item.role_id, Validators.required]
        });

        this._bindFormLogic();

        this.modalRef = this.modal.create({
            nzTitle: 'Información de usuario',
            nzContent: this.tplContent,
            nzFooter: this.tplFooter,
            nzViewContainerRef: this.viewContainerRef,
            nzData: { item },
            nzMaskClosable: false,
            nzClosable: true,
            nzWidth: 480,
        });
    }

    private _bindFormLogic(): void {
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

        roleControl?.valueChanges.subscribe(role => {
            if (role === 1 || role === 2) {
                // Admin y Head Comercial → todas las marcas automáticamente ✅
                const allBrandIds = this.catBrands.map(b => b.id);
                brandControl?.clearValidators();
                brandControl?.setValue(allBrandIds);
            } else if (role === 3) {
                // Proveedor → selección manual
                brandControl?.setValidators([Validators.required]);
                brandControl?.setValue([]);
            } else {
                brandControl?.clearValidators();
                brandControl?.setValue([]);
            }
            brandControl?.updateValueAndValidity();
        });
    }

    closeModal(): void {
        this.modalRef.destroy();
    }

    submitForm(): void {
        if (this.userForm.valid) {
            this.isConfirmLoading = true;
            const v = this.userForm.value;

            if (this.modalMode === 'create') {
                // ── PASO 1: CREAR USUARIO (sin estatus ni marcas) ──────
                const createPayload = {
                    name: v.name,
                    last_name: v.last_name,
                    country_id: v.country_id,
                    email: v.email,
                    company: v.company,
                    password: v.password,
                };

                this.service.createUser(createPayload).subscribe({
                    next: (res: any) => {
                        // ── PASO 2: UPDATE con estatus, rol y marcas ───
                        console.log('Usuario creado con ID:', res);
                        const userId = res.id;
                        const updateData = new FormData();
                        updateData.append('user_id', String(userId));
                        updateData.append('account_status', v.account_status);
                        updateData.append('role_id', String(v.role_id));
                        updateData.append('brand_ids', (v.brand_ids || []).join(','));

                        this.service.updateUser(updateData, userId).subscribe({
                            next: () => {
                                this.isConfirmLoading = false;
                                this.modalRef.destroy();
                                this.getUsersData();
                            },
                            error: (err) => {
                                this.isConfirmLoading = false;
                                console.error('Error actualizando usuario recién creado', err);
                            }
                        });
                    },
                    error: (err) => {
                        this.isConfirmLoading = false;
                        console.error('Error creating user', err);
                    }
                });

            } else {
                // ── EDITAR USUARIO (lógica existente) ──────────────────
                const formData = new FormData();
                formData.append('user_id', String(v.user_id));
                formData.append('account_status', v.account_status);
                formData.append('role_id', String(v.role_id));
                formData.append('brand_ids', v.brand_ids);

                this.service.updateUser(formData, v.user_id).subscribe({
                    next: () => {
                        this.isConfirmLoading = false;
                        this.modalRef.destroy();
                        this.getUsersData();
                    },
                    error: (err) => {
                        this.isConfirmLoading = false;
                        console.error('Error updating user', err);
                    }
                });
            }

        } else {
            Object.values(this.userForm.controls).forEach(ctrl => {
                ctrl.markAsDirty();
                ctrl.updateValueAndValidity();
            });
        }
    }

    openCreateModal(): void {
        this.modalMode = 'create';

        this.userForm = this.fb.group({
            name: ['', Validators.required],
            last_name: ['', Validators.required],
            country_id: [1, Validators.required],
            company: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [
                Validators.required,
                this.minLengthValidator.bind(this),
                this.uppercaseValidator.bind(this),
                this.lowercaseValidator.bind(this),
                this.numberValidator.bind(this),
                this.specialCharValidator.bind(this)
            ]],
            checkPassword: ['', [Validators.required, this.confirmationValidator]],
            agree: [false, [Validators.requiredTrue]],
            account_status: ['Active', Validators.required],
            role_id: [null, Validators.required],
            brand_ids: [[]]
        });

        this._bindFormLogic();

        this.modalRef = this.modal.create({
            nzTitle: 'Nuevo usuario',
            nzContent: this.tplContent,
            nzFooter: this.tplFooter,
            nzViewContainerRef: this.viewContainerRef,
            nzData: { item: null },   // sin item → modo creación
            nzMaskClosable: false,
            nzClosable: true,
            nzWidth: 480,
        });
    }

    // ----------------------------------------------------------------
    // UI helpers
    // ----------------------------------------------------------------
    getRoleLabel(roleId: number): string {
        const map: Record<number, string> = {
            1: 'Administrador',
            2: 'Head Comercial',
            3: 'Proveedor',
        };
        return map[roleId] || 'Usuario';
    }

    getRoleClass(roleId: number): string {
        const map: Record<number, string> = {
            1: 'role-admin',
            2: 'role-head',
            3: 'role-proveedor',
        };
        return map[roleId] || 'role-usuario';
    }

    getStatusLabel(status: string): string {
        const map: Record<string, string> = {
            Active: 'Activo',
            Pending: 'Pendiente',
            Rejected: 'Rechazado',
        };
        return map[status] || status;
    }

    getStatusClass(status: string): string {
        const map: Record<string, string> = {
            Active: 'status-active',
            Pending: 'status-pending',
            Rejected: 'status-rejected',
        };
        return map[status] || '';
    }

    getBrandsLabel(brands: any[]): string {
        if (!Array.isArray(brands)) return '';
        return brands.map(b => b.name).join(', ');
    }

    /** Consistent avatar gradient per user name */
    getAvatarColor(name: string): string {
        const palettes = [
            'linear-gradient(135deg,#2563EB,#1E4FC2)',
            'linear-gradient(135deg,#10B981,#059669)',
            'linear-gradient(135deg,#8B5CF6,#7C3AED)',
            'linear-gradient(135deg,#F59E0B,#D97706)',
            'linear-gradient(135deg,#EF4444,#DC2626)',
            'linear-gradient(135deg,#06B6D4,#0284C7)',
        ];
        const idx = (name?.charCodeAt(0) || 0) % palettes.length;
        return palettes[idx];
    }

    /** Brand tag colors keyed by name */
    getBrandStyle(name: string): string {
        const styles: Record<string, string> = {
            NUPEC: 'background:#EFF6FF;color:#1E4FC2',
            NUCAN: 'background:#F0FDF4;color:#15803D',
            GALOPE: 'background:#FFF7ED;color:#C2410C',
            'ÓPTIMO': 'background:#FAF5FF;color:#7E22CE',
        };
        return 'background:#212121;color:#475569';
    }
    getBrandColor(name: string): string {
        const map: Record<string, string> = {
            NUPEC: '#2563EB',
            NUCAN: '#10B981',
            GALOPE: '#F97316',
            'ÓPTIMO': '#8B5CF6',
            OPTIMO: '#8B5CF6',
            PECUARIO: '#CBD5E1',
        };
        return map[name?.toUpperCase()] || '#94A3B8';
    }


    exportToExcel(): void {
        // 1. Mapear los datos al formato de columnas de la tabla
        const rows = this.displayData.map(item => ({
            'ID': item.id,
            'Usuario': `${item.name} ${item.last_name ?? ''}`.trim(),
            'Correo': item.email,
            'Fecha de registro': item.created_at
                ? new Date(item.created_at).toLocaleDateString('es-MX')
                : '',
            'Compañía': item.company,
            'Marcas': Array.isArray(item.brands)
                ? item.brands.map((b: any) => b.name).join(', ')
                : '',
            'Rol': this.getRoleLabel(item.role_id),
            'Estatus': this.getStatusLabel(item.account_status),
        }));

        // 2. Crear la hoja y el workbook
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');

        // 3. Ajustar ancho de columnas automáticamente
        const colWidths = Object.keys(rows[0] ?? {}).map(key => ({
            wch: Math.max(key.length, ...rows.map(r => String(r[key as keyof typeof r] ?? '').length))
        }));
        worksheet['!cols'] = colWidths;

        // 4. Descargar
        const fileName = `usuarios_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    }
}