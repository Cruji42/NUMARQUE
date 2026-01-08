import { Component } from '@angular/core';

@Component({
    selector: 'nz-demo-rate-disabled',
    template: `
    <nz-rate [ngModel]="2" nzDisabled></nz-rate>
  `,
    standalone: false
})
export class NzDemoRateDisabledComponent {}
