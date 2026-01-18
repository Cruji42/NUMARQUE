import { AfterViewChecked, AfterViewInit, Component } from '@angular/core'
import { UntypedFormBuilder, UntypedFormGroup,  Validators } from '@angular/forms';
import { AuthService } from '../../core/service/auth-service';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { NgZone } from '@angular/core';

declare const google: any;


@Component({
    templateUrl: './login-3.component.html',
    standalone: false
})

export class Login3Component implements AfterViewInit {
    loginForm: UntypedFormGroup;
    private googleInitialized = false;

    // submitForm(): void {
    //     for (const i in this.loginForm.controls) {
    //         this.loginForm.controls[ i ].markAsDirty();
    //         this.loginForm.controls[ i ].updateValueAndValidity();
    //     }
    // }

    constructor(private fb: UntypedFormBuilder, private authService: AuthService, public router: Router, private ngZone: NgZone) {
    }

    ngOnInit(): void {
        this.loginForm = this.fb.group({
            email: [ null, [ Validators.required, Validators.email ] ],
            password: [ null, [ Validators.required ] ]
        });
    }

 ngAfterViewInit(): void {
    google.accounts.id.initialize({
      client_id: environment.GOOGLE_CLIENT_ID,
      callback: (response: any) => {
        this.handleGoogleLogin(response);
      }
    });

    google.accounts.id.renderButton(
      document.getElementById('googleBtn'),
      {
        theme: 'outline',
        size: 'large',
        text: 'signin_with'
      }
    );
  }

  handleGoogleLogin(response: any) {
    const idToken = response.credential;

    this.authService.loginWithGoogle(idToken).subscribe(
      {
        next: (res) => {
          // console.log('Google login successful:', res);
          this.router.navigateByUrl('/dashboard/default');
          // this.ngZone.run(() => {
          //   this.router.navigateByUrl('/dashboard/default');
          // });
        },
        error: (err) => {
          console.error('Google login failed:', err);
        }
      }
    );
  }

    // initGoogle() {
    //     if (this.googleInitialized) return;

    //     google.accounts.id.initialize({
    //     client_id: environment.GOOGLE_CLIENT_ID,
    //     callback: (response: any) => {
    //         this.authService.loginWithGoogle(response.credential).subscribe();
    //     },
    //      use_fedcm_for_prompt: true // IMPORTANTE
    //     });

    //     this.googleInitialized = true;
    // }

    // loginWithGoogle() {
    //     this.initGoogle();

    //     google.accounts.id.prompt((notification: any) => {
    //     if (notification.isNotDisplayed()) {
    //         console.warn('Google prompt no mostrado');
    //     }
    //     });
    // }

      submitForm(): void {
        if ( this.loginForm.valid ) {
            const { email, password } = this.loginForm.value;

            this.authService.login(email, password).subscribe({
                next: (response) => {
                    // Handle successful login, e.g., navigate to dashboard
                    console.log('Login successful:', response);
                    this.router.navigate(['/dashboard/default']);

                },
                error: (error) => {
                    // Handle login error, e.g., show error message
                    console.error('Login failed:', error);
                }
            });

        } else {
            for ( const i in this.loginForm.controls ) {
                this.loginForm.controls[ i ].markAsDirty();
                this.loginForm.controls[ i ].updateValueAndValidity();
            }
        }

      }
    
}    