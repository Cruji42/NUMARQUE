import { Component } from '@angular/core';

@Component({
    selector: 'nz-demo-rate-character',
    template: `
    <nz-rate [ngModel]="0" nzAllowHalf [nzCharacter]="characterIcon"></nz-rate>
    <br />
    <nz-rate [ngModel]="0" nzAllowHalf class="large" [nzCharacter]="characterEnLetter"></nz-rate>
    <br />
    <nz-rate [ngModel]="0" nzAllowHalf [nzCharacter]="characterZhLetter"></nz-rate>
    <ng-template #characterIcon><i nz-icon nzType="heart"></i></ng-template>
    <ng-template #characterZhLetter>好</ng-template>
    <ng-template #characterEnLetter>A</ng-template>
  `,
    styles: [
        `
      .large ::ng-deep .ant-rate-star {
        font-size: 36px;
      }
    `
    ],
    standalone: false
})
export class NzDemoRateCharacterComponent {}
