import { Component } from '@angular/core'
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup,  Validators } from '@angular/forms';
import { UsersService } from '../../core/service/users.service';


@Component({
    templateUrl: './sign-up-3.component.html',
    standalone: false
})

export class SignUp3Component {

    signUpForm: UntypedFormGroup;

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

    confirmationValidator = (control: UntypedFormControl): { [s: string]: boolean } => {
        if (!control.value) {
            return { required: true };
        } else if (control.value !== this.signUpForm.controls.password.value) {
            return { confirm: true, error: true };
        }
    }

    constructor(private fb: UntypedFormBuilder, private usersService: UsersService) {
    }

    ngOnInit(): void {
        this.signUpForm = this.fb.group({
            name         : [ null, [ Validators.required ] ],
            last_name         : [ null, [ Validators.required ] ],
            company         : [ null, [ Validators.required ] ],
            email            : [ null, [ Validators.required, Validators.email ] ],
            password         : [ null, [ Validators.required, Validators.pattern(this.patternPassword) ] ],
            checkPassword    : [ null, [ Validators.required, this.confirmationValidator ] ],
            agree            : [ false, [Validators.requiredTrue ] ]
        });
    }


    submitForm(): void {
        if( this.signUpForm.valid ){
            this.usersService.createUser(this.signUpForm.value).subscribe({
                next: (res) => {
                    console.log('User created successfully', res); 
                },
                error: (err) => {
                    console.error('Error creating user', err);
                }
            });
        } else {
            for (const i in this.signUpForm.controls) {
                this.signUpForm.controls[ i ].markAsDirty();
                this.signUpForm.controls[ i ].updateValueAndValidity();
            }
        }
    }
}    