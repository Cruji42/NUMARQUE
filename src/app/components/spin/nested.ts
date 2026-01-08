import { Component } from '@angular/core';

@Component({
    selector: 'nz-demo-spin-nested',
    template: `
    <nz-spin [nzSpinning]="isSpinning">
      <nz-alert [nzType]="'info'" [nzMessage]="'Alert message title'" [nzDescription]="'Further details about the context of this alert.'">
      </nz-alert>
    </nz-spin>
    <br />
    <div>
      Loading state：
      <nz-switch [(ngModel)]="isSpinning"></nz-switch>
    </div>
  `,
    standalone: false
})
export class NzDemoSpinNestedComponent {
  isSpinning = false;
}
