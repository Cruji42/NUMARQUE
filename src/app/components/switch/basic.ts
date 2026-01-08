import { Component } from '@angular/core';

@Component({
    selector: 'nz-demo-switch-basic',
    template: `
    <nz-switch [(ngModel)]="switchValue"></nz-switch>
  `,
    standalone: false
})
export class NzDemoSwitchBasicComponent {
  switchValue = false;
}
