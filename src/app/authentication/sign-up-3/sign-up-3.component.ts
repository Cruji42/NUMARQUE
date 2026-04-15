import { Component } from '@angular/core'
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { UsersService } from '../../core/service/users.service';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';


@Component({
    templateUrl: './sign-up-3.component.html',
    standalone: false
})

export class SignUp3Component {

    signUpForm!: UntypedFormGroup;
    
    isSubmitting = false;
    
    patternPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/

    // submitForm(): void {
    //     for (const i in this.signUpForm.controls) {
    //         this.signUpForm.controls[ i ].markAsDirty();
    //         this.signUpForm.controls[ i ].updateValueAndValidity();
    //     }
    // }

    updateConfirmValidator(): void {
        Promise.resolve().then(() => this.signUpForm.controls.checkPassword.updateValueAndValidity());
    }

  confirmationValidator = (control: UntypedFormControl): { [s: string]: boolean } | null => {
    if (!control.value) {
        return { required: true };
    } else if (control.value !== this.signUpForm.controls.password.value) {
        return { confirm: true, error: true };
    }

    return null; // 👈 importante
}


    // Mínimo 8 caracteres
    minLengthValidator(control: UntypedFormControl) {
        if (!control.value) return null;
        return control.value.length >= 8 ? null : { minLength: true };
    }

    // Al menos una mayúscula
    uppercaseValidator(control: UntypedFormControl) {
        if (!control.value) return null;
        return /[A-Z]/.test(control.value) ? null : { uppercase: true };
    }

    // Al menos una minúscula
    lowercaseValidator(control: UntypedFormControl) {
        if (!control.value) return null;
        return /[a-z]/.test(control.value) ? null : { lowercase: true };
    }

    // Al menos un número
    numberValidator(control: UntypedFormControl) {
        if (!control.value) return null;
        return /\d/.test(control.value) ? null : { number: true };
    }

    // Al menos un carácter especial
    specialCharValidator(control: UntypedFormControl) {
        if (!control.value) return null;
        return /[@$!%*?&._-]/.test(control.value) ? null : { specialChar: true };
    }

    constructor(private fb: UntypedFormBuilder, private usersService: UsersService, private route: Router) {
    }

    ngOnInit(): void {
        this.signUpForm = this.fb.group({
            name: [null, [Validators.required]],
            last_name: [null, [Validators.required]],
            country_id: [null, [Validators.required]],
            company: [null, [Validators.required]],
            email: [null, [Validators.required, Validators.email]],
            password: [null, [Validators.required, this.minLengthValidator,
            this.uppercaseValidator,
            this.lowercaseValidator,
            this.numberValidator,
            this.specialCharValidator]],
            checkPassword: [null, [Validators.required, this.confirmationValidator]],
            agree: [false, [Validators.requiredTrue]]
        });
    }


    submitForm(): void {
        if (this.signUpForm.valid) {
            this.isSubmitting = true;
            this.usersService.createUser(this.signUpForm.value).pipe(
                finalize(() => this.isSubmitting = false)
            ).subscribe({
                next: (res) => {
                    console.log('User created successfully', res);
                    this.route.navigate(['/authentication/login'])
                },
                error: (err) => {
                    console.error('Error creating user', err);
                }
            });
        } else {
            for (const i in this.signUpForm.controls) {
                this.signUpForm.controls[i].markAsDirty();
                this.signUpForm.controls[i].updateValueAndValidity();
            }
        }
    }
}    