import { Component } from '@angular/core';

@Component({
    selector: 'nz-demo-checkbox-basic',
    template: `
    <label nz-checkbox [(ngModel)]="checked">Checkbox</label>
  `,
    standalone: false
})
export class NzDemoCheckboxBasicComponent {
  checked = true;
}
