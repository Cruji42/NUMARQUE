import { Component } from '@angular/core'
import { UntypedFormBuilder, UntypedFormGroup,  Validators } from '@angular/forms';


@Component({
    templateUrl: './login-3.component.html'
})

export class Login3Component {
    loginForm: UntypedFormGroup;

    submitForm(): void {
        for (const i in this.loginForm.controls) {
            this.loginForm.controls[ i ].markAsDirty();
            this.loginForm.controls[ i ].updateValueAndValidity();
        }
    }

    constructor(private fb: UntypedFormBuilder) {
    }

    ngOnInit(): void {
        this.loginForm = this.fb.group({
            userName: [ null, [ Validators.required ] ],
            password: [ null, [ Validators.required ] ]
        });
    }
}    