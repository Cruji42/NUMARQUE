import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/service/auth-service';
import { Router, ActivatedRoute } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  templateUrl: './reset-password-1.component.html',
  standalone: false
})
export class ResetPassword1Component implements OnInit {
  resetForm!: UntypedFormGroup;
  passwordResetForm!: UntypedFormGroup;
  isLoading = false;
  isSuccess = false;
  isResetMode = false;
  token: string | null = null;

  constructor(
    private fb: UntypedFormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    // Check for token in URL query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      
      if (this.token) {
        this.isResetMode = true;
        this.initPasswordResetForm();
      } else {
        this.isResetMode = false;
        this.initForgotPasswordForm();
      }
    });
  }

  initForgotPasswordForm(): void {
    this.resetForm = this.fb.group({
      email: [null, [Validators.required, Validators.email]]
    });
  }

  initPasswordResetForm(): void {
    this.passwordResetForm = this.fb.group({
      newPassword: [null, [Validators.required, Validators.minLength(8)]],
      confirmPassword: [null, [Validators.required]]
    });
  }

  submitForm(): void {
    if (this.isResetMode) {
      this.submitPasswordReset();
    } else {
      this.submitForgotPassword();
    }
  }

  submitForgotPassword(): void {
    if (this.resetForm.valid) {
      this.isLoading = true;
      const { email } = this.resetForm.value;

      this.authService.forgotPassword(email).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.isSuccess = true;
          this.message.success('Se ha enviado un correo de recuperación a tu bandeja de entrada');
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error requesting password reset:', err);
          this.message.error('Error al solicitar la recuperación de contraseña. Verifica tu correo electrónico.');
        }
      });
    } else {
      for (const i in this.resetForm.controls) {
        this.resetForm.controls[i].markAsDirty();
        this.resetForm.controls[i].updateValueAndValidity();
      }
    }
  }

  submitPasswordReset(): void {
    if (this.passwordResetForm.valid) {
      const { newPassword, confirmPassword } = this.passwordResetForm.value;

      // Validate password match
      if (newPassword !== confirmPassword) {
        this.message.error('Las contraseñas no coinciden');
        return;
      }

      this.isLoading = true;

      this.authService.resetPassword(this.token!, newPassword).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.message.success('Contraseña actualizada correctamente');
          this.router.navigate(['/authentication/login']);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error resetting password:', err);
          this.message.error('Error al restablecer la contraseña. El enlace puede haber expirado.');
        }
      });
    } else {
      for (const i in this.passwordResetForm.controls) {
        this.passwordResetForm.controls[i].markAsDirty();
        this.passwordResetForm.controls[i].updateValueAndValidity();
      }
    }
  }

  goBackToLogin(): void {
    this.router.navigate(['/authentication/login']);
  }
}
