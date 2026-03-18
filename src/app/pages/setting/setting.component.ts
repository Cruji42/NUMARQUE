import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UsersService } from 'src/app/core/service/users.service';

@Component({
    templateUrl: './setting.component.html',
    styleUrls: ['./setting.component.scss'],
    standalone: false
})
export class SettingComponent implements OnInit {

    form!: UntypedFormGroup;
    changePWForm!: UntypedFormGroup;

    profile_picture_url: string = '';
    isConfirmLoading = false;
    brands_data: any[] = [];

    // Derived user info for the profile card
    userEmail: string = '';
    userRole: string = '';
    avatarGradient: string = 'linear-gradient(135deg,#1E4FC2,#3B82F6)';

    // Password visibility toggles
    showOldPw = false;
    showNewPw = false;

    file!: File;

    // Snapshot for cancel/reset
    private _originalValues: any = {};

    constructor(
        private fb: UntypedFormBuilder,
        private modalService: NzModalService,
        private message: NzMessageService,
        private service: UsersService
    ) {}

    ngOnInit(): void {
        this.form = this.fb.group({
            user_id:   [null, Validators.required],
            name:      [null, Validators.required],
            last_name: [null, Validators.required],
            company:   [null, Validators.required],
        });

        this.changePWForm = this.fb.group({
            oldPassword:     [null, Validators.required],
            newPassword:     [null, Validators.required],
            confirmPassword: [null, Validators.required],
        });

        this.getUserData();
    }

    // ----------------------------------------------------------------
    // Data
    // ----------------------------------------------------------------
    getUserData(): void {
        this.service.getUser().subscribe({
            next: (user: any) => {
                this.form.patchValue({
                    ...user,
                    user_id: user.id,
                });
                this._originalValues = { ...user, user_id: user.id };
                this.profile_picture_url = user.profile_picture_url || '';
                this.brands_data = user.brands || [];
                this.userEmail   = user.email || '';
                this.userRole    = this._resolveRoleLabel(user.role_id);
                this.avatarGradient = this._getAvatarGradient(user.name);
            },
            error: (err) => console.error('Error fetching user:', err)
        });
    }

    // ----------------------------------------------------------------
    // Basic info form
    // ----------------------------------------------------------------
    submitForm(): void {
        if (this.form.valid) {
            this.isConfirmLoading = true;
            const v = this.form.value;
            const formData = new FormData();
            formData.append('user_id',   String(v.user_id));
            formData.append('name',      v.name);
            formData.append('last_name', v.last_name);
            formData.append('company',   v.company);

            this.service.updateUser(formData, v.user_id).subscribe({
                next: () => {
                    this.isConfirmLoading = false;
                    this.message.success('Perfil actualizado correctamente');
                    this.getUserData();
                },
                error: (err) => {
                    this.isConfirmLoading = false;
                    console.error('Error updating user:', err);
                    this.message.error('Error al actualizar el perfil');
                }
            });
        } else {
            Object.values(this.form.controls).forEach(ctrl => {
                ctrl.markAsDirty();
                ctrl.updateValueAndValidity();
            });
        }
    }

    resetForm(): void {
        this.form.patchValue(this._originalValues);
        Object.values(this.form.controls).forEach(ctrl => ctrl.markAsPristine());
    }

    // ----------------------------------------------------------------
    // Password form
    // ----------------------------------------------------------------
    showConfirm(): void {
        if (this.changePWForm.invalid) {
            Object.values(this.changePWForm.controls).forEach(c => {
                c.markAsDirty();
                c.updateValueAndValidity();
            });
            return;
        }
        this.modalService.confirm({
            nzTitle: '¿Deseas cambiar tu contraseña?',
            nzOkText: 'Sí, cambiar',
            nzCancelText: 'Cancelar',
            nzOnOk: () => {
                this.message.success('Contraseña actualizada correctamente');
                this.changePWForm.reset();
            }
        });
    }

    // ----------------------------------------------------------------
    // Photo upload
    // ----------------------------------------------------------------
    beforeUpload = (file: File): boolean => {
        this.file = file;
        this.enviarArchivo();
        return false; // prevent auto upload
    };

    enviarArchivo(): void {
        if (!this.file) return;

        const formData = new FormData();
        formData.append('profile_picture', this.file);

        this.service.uploadPhoto(formData, this.form.value.user_id).subscribe({
            next: () => {
                this.message.success('Foto de perfil actualizada');
                this.getUserData();
            },
            error: (err) => {
                console.error('Error uploading photo:', err);
                this.message.error('Error al subir la foto');
            }
        });
    }

    // ----------------------------------------------------------------
    // UI helpers
    // ----------------------------------------------------------------
    getBrandColor(name: string): string {
        const map: Record<string, string> = {
            NUPEC:    '#2563EB',
            NUCAN:    '#10B981',
            GALOPE:   '#F97316',
            'ÓPTIMO': '#8B5CF6',
            OPTIMO:   '#8B5CF6',
            PECUARIO: '#CBD5E1',
        };
        return map[name?.toUpperCase()] || '#94A3B8';
    }

    private _resolveRoleLabel(roleId: number): string {
        const map: Record<number, string> = {
            1: 'Administrador',
            2: 'Head Comercial',
            3: 'Proveedor',
        };
        return map[roleId] || 'Usuario';
    }

    private _getAvatarGradient(name: string): string {
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
}