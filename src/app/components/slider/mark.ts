import { Component } from '@angular/core';
import { NzMarks } from 'ng-zorro-antd/slider';

@Component({
    selector: 'nz-demo-slider-mark',
    template: `
    <div>
      <h4>included=true</h4>
      <nz-slider [nzMarks]="marks" [ngModel]="37"></nz-slider>
      <nz-slider [nzMarks]="marks" nzIncluded nzRange [ngModel]="[26, 37]"></nz-slider>
      <h4>included=false</h4>
      <nz-slider [nzMarks]="marks" [nzIncluded]="false" [ngModel]="37"></nz-slider>
      <h4>marks & step</h4>
      <nz-slider [nzMarks]="marks" [nzStep]="10" [ngModel]="37"></nz-slider>
      <h4>step=null || dots=true</h4>
      <nz-slider [nzMarks]="marks" [nzStep]="null" [ngModel]="37"></nz-slider>
      <nz-slider [nzMarks]="marks" nzDots [ngModel]="37"></nz-slider>
      Change nzMarks dynamically: <button nz-button (click)="changeMarks()">Change nzMarks</button>
    </div>
  `,
    styles: [
        `
      h4 {
        margin: 0 0 16px;
      }

      .ant-slider-with-marks {
        margin-bottom: 44px;
      }
    `
    ],
    standalone: false
})
export class NzDemoSliderMarkComponent {
  marks: NzMarks = {
    0: '0°C',
    26: '26°C',
    37: '37°C',
    100: {
      style: {
        color: '#f50'
      },
      label: '<strong>100°C</strong>'
    }
  };

  changeMarks(): void {
    this.marks = {
      20: '20%',
      99: '99%'
    };
  }
}
