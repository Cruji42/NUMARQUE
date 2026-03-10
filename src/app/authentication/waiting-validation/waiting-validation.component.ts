import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { AuthService } from '../../core/service/auth-service';

@Component({
    template: `
        <div class="container-fluid p-h-0 p-v-20 h-100 bg" style="background-image: url('assets/images/others/login-3.png')">
            <div class="d-flex flex-column justify-content-between h-100">
                <div class="d-none d-md-block"></div>
                <div class="container">
                    <div class="row align-items-center">
                        <div class="col-md-7 col-lg-5 m-h-auto">
                            <nz-card class="m-b-100 shadow-lg">
                                <div class="text-center p-4">
                                    <div class="mb-4">
                                        <i nz-icon nzType="clock-circle" nzTheme="outline" style="font-size: 64px; color: #1890ff;"></i>
                                    </div>
                                    <h2 class="mb-3">Pendiente de Validación</h2>
                                    <p class="text-muted mb-4">
                                        Tu cuenta está pendiente de validación. <br>
                                        Por favor espera a que un administrador active tu cuenta.
                                    </p>
                                    <div class="d-flex justify-content-center">
                                        <nz-spin nzSize="large"></nz-spin>
                                    </div>
                                    <div class="mt-3">
                                        <small class="text-muted">
                                            <i nz-icon nzType="info-circle" nzTheme="outline"></i>
                                            Te redirigiremos automáticamente cuando tu cuenta esté activa.
                                        </small>
                                    </div>
                                </div>
                            </nz-card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    standalone: false
})
export class WaitingValidationComponent implements OnInit, OnDestroy {
    private pollingSubscription?: Subscription;

    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        // Poll every 5 seconds to check if account is now active
        this.pollingSubscription = interval(5000)
            .pipe(
                startWith(0),
                switchMap(() => this.authService.validateUserStatus())
            )
            .subscribe({
                next: (isActive) => {
                    if (isActive) {
                        this.router.navigate(['/dashboard/default']);
                    }
                },
                error: (err) => {
                    console.error('Error checking user status:', err);
                }
            });
    }

    ngOnDestroy(): void {
        if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
        }
    }
}

