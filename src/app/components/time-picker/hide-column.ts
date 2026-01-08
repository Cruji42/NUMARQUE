import { Component } from '@angular/core';

@Component({
    selector: 'nz-demo-time-picker-hide-column',
    template: `
    <nz-time-picker [(ngModel)]="time" nzFormat="HH:mm"></nz-time-picker>
  `,
    standalone: false
})
export class NzDemoTimePickerHideColumnComponent {
  time = new Date();
}
