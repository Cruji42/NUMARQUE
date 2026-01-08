import { Component } from '@angular/core'
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup,  Validators } from '@angular/forms';


@Component({
    templateUrl: './sign-up-2.component.html'
})

export class SignUp2Component {

    signUpForm: UntypedFormGroup;

    submitForm(): void {
        for (const i in this.signUpForm.controls) {
            this.signUpForm.controls[ i ].markAsDirty();
            this.signUpForm.controls[ i ].updateValueAndValidity();
        }
    }

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

    constructor(private fb: UntypedFormBuilder) {
    }

    ngOnInit(): void {
        this.signUpForm = this.fb.group({
            userName         : [ null, [ Validators.required ] ],
            email            : [ null, [ Validators.required ] ],
            password         : [ null, [ Validators.required ] ],
            checkPassword    : [ null, [ Validators.required, this.confirmationValidator ] ],
            agree            : [ false ]
        });
    }
}    