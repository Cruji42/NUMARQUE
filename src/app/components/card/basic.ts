import { Component } from '@angular/core';

@Component({
    selector: 'nz-demo-card-basic',
    template: `
    <nz-card style="width:300px;" nzTitle="Card title" [nzExtra]="extraTemplate">
      <p>Card content</p>
      <p>Card content</p>
      <p>Card content</p>
    </nz-card>
    <ng-template #extraTemplate>
      <a>More</a>
    </ng-template>
  `,
    styles: [
        `
      p {
        margin: 0;
      }
    `
    ],
    standalone: false
})
export class NzDemoCardBasicComponent {}
