import { Component } from '@angular/core';

@Component({
    selector: 'nz-demo-result-info',
    template: `
    <nz-result nzStatus="info" nzTitle="Your operation has been executed">
      <div nz-result-extra>
        <button nz-button nzType="primary">Go Console</button>
      </div>
    </nz-result>
  `,
    standalone: false
})
export class NzDemoResultInfoComponent {}
