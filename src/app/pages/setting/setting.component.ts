import { Component, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UsersService } from 'src/app/core/service/users.service';
import { EndPointAuthService } from 'src/app/core/apis/end-point-auth.service';
import { TranslationService } from 'src/app/shared/services/translation.service';
import { forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';

// Password policy — keep in sync with password_policy_errors() in the API (utils/auth_utils.py)
export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordRule {
    key: string;        // i18n key under SETTINGS.SECURITY.RULES
    test: (value: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
    { key: 'MIN_LENGTH', test: v => v.length >= PASSWORD_MIN_LENGTH },
    { key: 'UPPERCASE',  test: v => /[A-ZÁÉÍÓÚÑÜ]/.test(v) },
    { key: 'LOWERCASE',  test: v => /[a-záéíóúñü]/.test(v) },
    { key: 'NUMBER',     test: v => /\d/.test(v) },
    { key: 'SPECIAL',    test: v => /[^A-Za-z0-9ÁÉÍÓÚÑÜáéíóúñü\s]/.test(v) },
    { key: 'NO_SPACES',  test: v => v.length > 0 && !/\s/.test(v) },
];

/** Fails with { passwordPolicy: string[] } listing the unmet rule keys. */
export const passwordPolicyValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value || '') as string;
    if (!value) return null; // `required` handles empty
    const failed = PASSWORD_RULES.filter(r => !r.test(value)).map(r => r.key);
    return failed.length ? { passwordPolicy: failed } : null;
};

/** Group validator: confirm must match new, and new must differ from current. */
const passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const oldPw = group.get('oldPassword')?.value || '';
    const newPw = group.get('newPassword')?.value || '';
    const confirm = group.get('confirmPassword')?.value || '';
    const errors: ValidationErrors = {};
    if (confirm && newPw !== confirm) errors['passwordMismatch'] = true;
    if (newPw && oldPw && newPw === oldPw) errors['sameAsCurrent'] = true;
    return Object.keys(errors).length ? errors : null;
};

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
    showConfirmPw = false;
    isChangingPw = false;
    readonly passwordRules = PASSWORD_RULES;

    file!: File;

    // Snapshot for cancel/reset
    private _originalValues: any = {};

    constructor(
        private fb: UntypedFormBuilder,
        private modalService: NzModalService,
        private message: NzMessageService,
        private service: UsersService,
        private authApi: EndPointAuthService,
        private translationService: TranslationService
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
            newPassword:     [null, [Validators.required, passwordPolicyValidator]],
            confirmPassword: [null, Validators.required],
        }, { validators: passwordMatchValidator });

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
                this._resolveRoleLabel(user.role_id);
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
                    this.translationService.translate('SETTINGS.MESSAGES.PROFILE_UPDATED')
                        .pipe(take(1)).subscribe(msg => this.message.success(msg));
                    this.getUserData();
                },
                error: (err) => {
                    this.isConfirmLoading = false;
                    console.error('Error updating user:', err);
                    this.translationService.translate('SETTINGS.MESSAGES.PROFILE_ERROR')
                        .pipe(take(1)).subscribe(msg => this.message.error(msg));
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

        forkJoin({
            title:   this.translationService.translate('SETTINGS.SECURITY.CONFIRM_TITLE').pipe(take(1)),
            ok:      this.translationService.translate('SETTINGS.SECURITY.CONFIRM_OK').pipe(take(1)),
            cancel:  this.translationService.translate('SETTINGS.SECURITY.CONFIRM_CANCEL').pipe(take(1)),
            success: this.translationService.translate('SETTINGS.MESSAGES.PW_UPDATED').pipe(take(1)),
        }).subscribe(({ title, ok, cancel, success }) => {
            this.modalService.confirm({
                nzTitle:      title,
                nzOkText:     ok,
                nzCancelText: cancel,
                nzOnOk: () => this.submitPasswordChange(success)
            });
        });
    }

    /** Returns a Promise so the confirm modal keeps its OK button loading until the API answers. */
    private submitPasswordChange(successMsg: string): Promise<void> {
        const { oldPassword, newPassword } = this.changePWForm.value;
        this.isChangingPw = true;
        return new Promise<void>(resolve => {
            this.authApi.changePassword({ currentPassword: oldPassword, newPassword }).subscribe({
                next: () => {
                    this.isChangingPw = false;
                    this.message.success(successMsg);
                    this.changePWForm.reset();
                    this.showOldPw = this.showNewPw = this.showConfirmPw = false;
                    resolve();
                },
                error: (err) => {
                    this.isChangingPw = false;
                    const key = err?.status === 400 ? 'SETTINGS.MESSAGES.PW_WRONG_CURRENT'
                              : err?.status === 422 ? 'SETTINGS.MESSAGES.PW_POLICY'
                              : 'SETTINGS.MESSAGES.PW_ERROR';
                    this.translationService.translate(key).pipe(take(1))
                        .subscribe(msg => this.message.error(msg));
                    resolve();
                }
            });
        });
    }

    isRuleMet(rule: PasswordRule): boolean {
        return rule.test((this.changePWForm.get('newPassword')?.value || '') as string);
    }

    get newPwTouched(): boolean {
        return !!this.changePWForm.get('newPassword')?.value;
    }

    get confirmPwError(): boolean {
        return !!this.changePWForm.get('confirmPassword')?.value && this.changePWForm.hasError('passwordMismatch');
    }

    // ----------------------------------------------------------------
    // Photo upload
    // ----------------------------------------------------------------
    beforeUpload = (file: File): boolean => {
        this.file = file;
        this.enviarArchivo();
        return false;
    };

    enviarArchivo(): void {
        if (!this.file) return;

        const formData = new FormData();
        formData.append('profile_picture', this.file);

        this.service.uploadPhoto(formData, this.form.value.user_id).subscribe({
            next: () => {
                this.translationService.translate('SETTINGS.MESSAGES.PHOTO_UPDATED')
                    .pipe(take(1)).subscribe(msg => this.message.success(msg));
                this.getUserData();
            },
            error: (err) => {
                console.error('Error uploading photo:', err);
                this.translationService.translate('SETTINGS.MESSAGES.PHOTO_ERROR')
                    .pipe(take(1)).subscribe(msg => this.message.error(msg));
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

    private _resolveRoleLabel(roleId: number): void {
        const keyMap: Record<number, string> = {
            1: 'SETTINGS.ROLES.ADMIN',
            2: 'SETTINGS.ROLES.HEAD',
            3: 'SETTINGS.ROLES.PROVIDER',
        };
        const key = keyMap[roleId] || 'SETTINGS.ROLES.USER';
        this.translationService.translate(key).pipe(take(1)).subscribe(label => {
            this.userRole = label;
        });
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
