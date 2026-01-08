import { Component } from '@angular/core';

@Component({
    selector: 'nz-demo-checkbox-disabled',
    template: `
    <label nz-checkbox nzDisabled [ngModel]="false"></label>
    <br />
    <label nz-checkbox nzDisabled [ngModel]="true"></label>
  `,
    standalone: false
})
export class NzDemoCheckboxDisabledComponent {}
