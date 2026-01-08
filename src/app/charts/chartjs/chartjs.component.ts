import { Component, QueryList, ViewChildren } from '@angular/core';
import { ThemeConstantService } from '../../shared/services/theme-constant.service';
import { NzCodeBoxComponent } from '../../shared/components/codebox/codebox.component';

@Component({
    templateUrl: './chartjs.component.html',
    standalone: false
})

export class ChartjsComponent {

    expanded = false;
    @ViewChildren(NzCodeBoxComponent) codeBoxes: QueryList<NzCodeBoxComponent>;

    goLink(link: string): void {
        if (window) {
            window.location.hash = link;
        }
    }

    expandAllCode(): void {
        this.expanded = !this.expanded;
        this.codeBoxes.forEach(code => {
            code.nzExpanded = this.expanded;
            code.expandCode(this.expanded);
            code.check();
        });
    }

    themeColors = this.colorConfig.get().colors;

    constructor( private colorConfig:ThemeConstantService ) {
    }

    ngOnInit() {
    }    

    // lineChart
    lineChartDataObj: any = {
        labels: ["16th", "17th", "18th", "19th", "20th", "21th", "22th"],
        datasets: [
            { data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A' },
            { data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B' }
        ]
    };
    currentLineChartLabelsIdx = 1;
    lineChartOptions: any = {
        responsive: true,
        hover: {
            mode: 'nearest',
            intersect: true
        },
        plugins: {
            tooltip: {
                mode: 'index'
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    display: true,
                    color: this.themeColors.grayLight,
                    font: {
                        size: 13
                    },
                    padding: 10
                }
            },
            y: {
                grid: {
                    drawBorder: false,
                    drawTicks: false,
                    borderDash: [3, 4],
                    zeroLineWidth: 1,
                    zeroLineBorderDash: [3, 4]
                },
                ticks: {
                    display: true,
                    max: 100,
                    stepSize: 20,
                    color: this.themeColors.grayLight,
                    font: {
                        size: 13
                    },
                    padding: 10
                }
            }
        }
    };
    lineChartColors: Array<any> = [
        { 
            backgroundColor: this.themeColors.transparent,
            borderColor: this.themeColors.blue,
            pointBackgroundColor: this.themeColors.blue,
            pointBorderColor: this.themeColors.white,
            pointHoverBackgroundColor: this.themeColors.blueLight,
            pointHoverBorderColor: this.themeColors.blueLight
        },
        { 
            backgroundColor: this.themeColors.transparent,
            borderColor: this.themeColors.cyan,
            pointBackgroundColor: this.themeColors.cyan,
            pointBorderColor: this.themeColors.white,
            pointHoverBackgroundColor: this.themeColors.cyanLight,
            pointHoverBorderColor: this.themeColors.cyanLight
        }
    ];
    lineChartLegend = true;
    lineChartType = 'line';

    //Stacked Area Chart
    stackedAreaChartDataObj: any = {
        labels: ["16th", "17th", "18th", "19th", "20th", "21th", "22th"],
        datasets: [
            { data: [28, 48, 40, 55, 86, 55, 90]}
        ]
    };
    currentstackedAreaChartLabelsIdx = 2;
    stackedAreaChartOptions: any = {
        responsive: true,
        hover: {
            mode: 'nearest',
            intersect: true
        },
        elements: {
            line: {
                tension: 0.5
            },
            point: {
                radius: 0
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: this.themeColors.grayLight,
                    display: true,
                    font: {
                        size: 13
                    },
                    padding: 10
                }
            },
            y: {
                grid: {
                    drawBorder: false,
                    drawTicks: false,
                    borderDash: [3, 4],
                    zeroLineWidth: 1,
                    zeroLineBorderDash: [3, 4]
                },
                ticks: {
                    max: 100,
                    stepSize: 20,
                    display: true,
                    color: this.themeColors.grayLight,
                    font: {
                        size: 13
                    },
                    padding: 10
                }
            }
        }
    };
    stackedAreaChartColors: Array<any> = [
        { 
            backgroundColor: this.themeColors.blueLight,
            borderColor: this.themeColors.blue,
            pointBackgroundColor: this.themeColors.blue,
            pointBorderColor: this.themeColors.white,
            pointHoverBackgroundColor: this.themeColors.blueLight,
            pointHoverBorderColor: this.themeColors.blueLight
        }
    ];
    stackedAreaChartLegend = true;
    stackedAreaChartType = 'line';


    //Bar Chart
    barChartDataObj: any = {
        labels: ['2006', '2007', '2008', '2009', '2010', '2011'],
        datasets: [
            {
                data: [65, 59, 80, 81, 56, 55],
                label: 'Series A',
                categoryPercentage: 0.45,
                barPercentage: 0.70,
                backgroundColor: this.themeColors.blue,
                borderWidth: 0
            },
            {
                data: [28, 48, 40, 19, 86, 27],
                label: 'Series B',
                categoryPercentage: 0.45,
                barPercentage: 0.70,
                backgroundColor: this.themeColors.blueLight,
                borderWidth: 0
            }
        ]
    };
    barChartOptions: any = {
        scaleShowVerticalLines: false,
        responsive: true,
        scales: {
            x: {
                display: true,
                grid: {
                    display: false
                },
                ticks: {
                    display: true,
                    font: {
                        size: 13
                    },
                    padding: 10
                }
            },
            y: {
                display: true,
                grid: {
                    drawBorder: false,
                    drawTicks: false,
                    borderDash: [3, 4],
                    zeroLineWidth: 1,
                    zeroLineBorderDash: [3, 4]
                },
                ticks: {
                    max: 100,
                    stepSize: 20,
                    display: true,
                    font: {
                        size: 13
                    },
                    padding: 10
                }
            }
        }
    };
    barChartType = 'bar';


    //Radar Chart
    radarChartDataObj: any = {
        labels: ['Eating', 'Drinking', 'Sleeping', 'Designing', 'Coding', 'Cycling', 'Running'],
        datasets: [
            { data: [65, 59, 90, 81, 56, 55, 40], label: 'Series A', backgroundColor: this.themeColors.blueLight, borderWidth: 2, borderColor: this.themeColors.blue },
            { data: [28, 48, 40, 19, 96, 27, 100], label: 'Series B', backgroundColor: this.themeColors.cyanLight, borderWidth: 2, borderColor: this.themeColors.cyan }
        ]
    };
    radarChartOptions: any = {
        responsive: true,
        scales: {
            r: {
                ticks: {
                    max: 100,
                    stepSize: 25,
                },
                grid: {
                    color: this.themeColors.border
                },
                angleLines: {
                    color: this.themeColors.border
                }
            }
        }
    };
    radarChartType = 'radar';

    // Doughnut Chart
    doughnutChartDataObj: any = {
        labels: ['Download Sales', 'In-Store Sales', 'Mail Sales'],
        datasets: [{
            data: [350, 450, 100],
            backgroundColor: [this.themeColors.blue, this.themeColors.gold, this.themeColors.cyan]
        }]
    };
    doughnutChartType = 'doughnut';

    // PolarArea Chart
    polarAreaChartDataObj: any = {
        labels: ['Download Sales', 'In-Store Sales', 'Mail Sales', 'Telesales', 'Corporate Sales'],
        datasets: [{
            data: [300, 500, 100, 40, 120],
            backgroundColor: [
                this.themeColors.blueLight,
                this.themeColors.cyanLight,
                this.themeColors.goldLight,
                this.themeColors.purpleLight,
                this.themeColors.redLight,
            ],
            borderColor: [
                this.themeColors.blue,
                this.themeColors.cyan,
                this.themeColors.gold,
                this.themeColors.purple,
                this.themeColors.red,
            ]
        }]
    };
    polarAreaChartOptions: any = {
        responsive: true,
        scales: {
            r: {
                ticks: {
                    max: 500,
                    stepSize: 100,
                },
                grid: {
                    color: this.themeColors.border
                },
                angleLines: {
                    color: this.themeColors.border
                }
            }
        }
    };
    polarAreaChartType = 'polarArea'
}  