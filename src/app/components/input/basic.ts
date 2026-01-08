import { Component } from '@angular/core';

@Component({
    selector: 'nz-demo-input-basic',
    template: `
    <input nz-input placeholder="Basic usage" [(ngModel)]="value" />
    <br />
    <br />
    <input nz-input placeholder="Basic usage" [(ngModel)]="value" [disabled]="true" />
  `,
    standalone: false
})
export class NzDemoInputBasicComponent {
  value: string;
}
