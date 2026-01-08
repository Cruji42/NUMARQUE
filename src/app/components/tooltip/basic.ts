import { Component } from '@angular/core';

@Component({
    selector: 'nz-demo-tooltip-basic',
    template: `
    <span nz-tooltip nzTooltipTitle="prompt text">Tooltip will show when mouse enter.</span>
  `,
    standalone: false
})
export class NzDemoTooltipBasicComponent {}
