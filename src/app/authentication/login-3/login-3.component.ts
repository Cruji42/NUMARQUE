import { AfterViewInit, Component, NgZone } from '@angular/core'
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/service/auth-service';
import { UsersService } from '../../core/service/users.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  templateUrl: './login-3.component.html',
  standalone: false
})

export class Login3Component implements AfterViewInit {
  isPasswordVisible = false;
  loginForm!: UntypedFormGroup;
  private googleInitialized = false;

  constructor(
    private fb: UntypedFormBuilder,
    private authService: AuthService,
    private usersService: UsersService,
    public router: Router,
    private ngZone: NgZone
  ) {
  }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: [null, [Validators.required, Validators.email]],
      password: [null, [Validators.required]]
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

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  private navigateByRole(user: any): void {
    const roleId = user?.role_id;
    if (roleId == 1) {
      //this.router.navigateByUrl('/dashboard/default');
      this.router.navigateByUrl('/welcome');
    } else {
      this.router.navigateByUrl('/welcome');
    }
  }

  handleGoogleLogin(response: any) {
    const idToken = response.credential;

    this.authService.loginWithGoogle(idToken).subscribe(
      {
        next: (res) => {
          console.log('DEBUG: Google login successful, checking status...');
          // Check user validation status before redirecting
          this.authService.validateUserStatus().subscribe({
            next: (isActive) => {
              console.log('DEBUG: validateUserStatus result:', isActive);
              if (isActive) {
                console.log('DEBUG: User is active, getting user data for role-based redirect');
                this.usersService.getUser().subscribe({
                  next: (user) => {
                    this.navigateByRole(user);
                  },
                  error: (err) => {
                    console.error('DEBUG: Error getting user:', err);
                    // Default to dashboard on error
                    this.router.navigateByUrl('/dashboard');
                  }
                });
              } else {
                console.log('DEBUG: User is NOT active, navigating to waiting page');
                // Redirect to waiting validation page
                this.router.navigate(['/authentication/waiting-validation']);
              }
            },
            error: (err) => {
              console.error('DEBUG: Error checking user status:', err);
              // Default to dashboard on error
              this.router.navigateByUrl('/dashboard');
            }
          });
        },
        error: (err) => {
          console.error('Google login failed:', err);
        }
      }
    );
  }

  submitForm(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;

      console.log('HttpClient instance:', this.authService);

      this.authService.login(email, password).subscribe({
        next: (response) => {
          // Handle successful login, e.g., navigate to dashboard
          console.log('DEBUG: Login successful:', response);
          
          // Check user validation status before redirecting
          this.authService.validateUserStatus().subscribe({
            next: (isActive) => {
              console.log('DEBUG: validateUserStatus result:', isActive);
              if (isActive) {
                console.log('DEBUG: User is active, getting user data for role-based redirect');
                this.usersService.getUser().subscribe({
                  next: (user) => {
                    this.navigateByRole(user);
                  },
                  error: (err) => {
                    console.error('DEBUG: Error getting user:', err);
                    // Default to dashboard on error
                    this.router.navigate(['/dashboard']);
                  }
                });
              } else {
                console.log('DEBUG: User is NOT active, navigating to waiting page');
                // Redirect to waiting validation page
                this.router.navigate(['/authentication/waiting-validation']);
              }
            },
            error: (err) => {
              console.error('DEBUG: Error checking user status:', err);
              // Default to dashboard on error
              this.router.navigate(['/dashboard']);
            }
          });
        },
        error: (err) => {
          console.log('Error en componente:', err);
        }
      });
    } else {
      for (const i in this.loginForm.controls) {
        this.loginForm.controls[i].markAsDirty();
        this.loginForm.controls[i].updateValueAndValidity();
      }
    }
  }
}
