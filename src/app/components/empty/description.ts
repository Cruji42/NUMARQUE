import { Component } from '@angular/core';

@Component({
    selector: 'nz-demo-empty-description',
    template: `
    <nz-empty [nzNotFoundContent]="null"></nz-empty>
  `,
    standalone: false
})
export class NzDemoEmptyDescriptionComponent {}
