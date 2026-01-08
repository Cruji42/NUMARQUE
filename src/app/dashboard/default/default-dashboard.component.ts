import { Component } from '@angular/core'
import { ThemeConstantService } from '../../shared/services/theme-constant.service';

@Component({
    templateUrl: './default-dashboard.component.html'
})

export class DefaultDashboardComponent {

    themeColors = this.colorConfig.get().colors;
    blue = this.themeColors.blue;
    blueLight = this.themeColors.blueLight;
    cyan = this.themeColors.cyan;
    cyanLight = this.themeColors.cyanLight;
    gold = this.themeColors.gold;
    purple = this.themeColors.purple;
    purpleLight = this.themeColors.purpleLight;
    red = this.themeColors.red;

    taskListIndex: number = 0;

    constructor( private colorConfig:ThemeConstantService ) {}

    revenueChartFormat: string = 'revenueMonth';

    revenueChartDataObj: any = {
        labels: ["16th", "17th", "18th", "19th", "20th", "21th", "22th", "23th", "24th", "25th", "26th"],
        datasets: [{
            data: [30, 60, 40, 50, 40, 55, 85, 65, 75, 50, 70],
            label: 'Series A'
        }]
    };
    currentrevenueChartLabelsIdx = 1;
    revenueChartOptions: any = {
        maintainAspectRatio: false,
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
    revenueChartColors: Array<any> = [
        { 
            backgroundColor: this.themeColors.transparent,
            borderColor: this.blue,
            pointBackgroundColor: this.blue,
            pointBorderColor: this.themeColors.white,
            pointHoverBackgroundColor: this.blueLight,
            pointHoverBorderColor: this.blueLight
        }
    ];
    revenueChartType = 'line';

    customersChartDataObj: any = {
        labels: ['New', 'Returning', 'Others'],
        datasets: [{
            data: [350, 450, 100],
            backgroundColor: [this.cyan, this.purple, this.gold]
        }]
    };
    customersChartOptions: any = {
        cutoutPercentage: 75,
        maintainAspectRatio: false
    }
    customersChartType = 'doughnut';

    //Bar Chart
    avgProfitChartOptions: any = {
        scaleShowVerticalLines: false,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                display: true,
                stacked: true,
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
                stacked: true,
                grid: {
                    drawBorder: false,
                    drawTicks: false,
                    borderDash: [3, 4],
                    zeroLineWidth: 1,
                    zeroLineBorderDash: [3, 4]
                },
                ticks: {
                    stepSize: 40,
                    display: true,
                    font: {
                        size: 13
                    },
                    padding: 10
                }
            }
        }
    };
    avgProfitChartDataObj: any = {
        labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
        datasets: [
            {
                data: [38, 38, 30, 19, 56, 55, 31],
                label: 'Series A',
                categoryPercentage: 0.35,
                barPercentage: 0.3,
                backgroundColor: this.blue,
                borderWidth: 0
            },
            {
                data: [55, 69, 90, 81, 86, 27, 77],
                label: 'Series B',
                categoryPercentage: 0.35,
                barPercentage: 0.3,
                backgroundColor: this.blueLight,
                borderWidth: 0
            }
        ]
    };
    avgProfitChartType = 'bar';
    avgProfitChartLegend = false;

    productsList = [
        {
            name: 'Gray Sofa',
            avatar: 'assets/images/others/thumb-9.jpg',
            earn: 1912,
            sales: 81,
            stock: 82,
        },
        {
            name: 'Beat Headphone',
            avatar: 'assets/images/others/thumb-10.jpg',
            earn: 1377,
            sales: 26,
            stock: 61
        },
        {
            name: 'Wooden Rhino',
            avatar: 'assets/images/others/thumb-11.jpg',
            earn: 9212,
            sales: 71,
            stock: 23,
        },
        {
            name: 'Red Chair',
            avatar: 'assets/images/others/thumb-12.jpg',
            earn: 1298,
            sales: 79,
            stock: 54,
        },
        {
            name: 'Wristband',
            avatar: 'assets/images/others/thumb-13.jpg',
            earn: 7376,
            sales: 60,
            stock: 76,
        }
    ]    

    fileList = [
        {
            icon: "file-word",
            name: "Documentation.doc",
            color: this.blue,
            size: "1.2MB"
        },
        {
            icon: "file-excel",
            name: "Expensess.xls",
            color: this.cyan,
            size: "518KB"
        },
        {
            icon: "file-text",
            name: "Receipt.txt",
            color: this.purple,
            size: "355KB"
        },
        {
            icon: "file-word",
            name: "Project Requirement.doc",
            color: this.blue,
            size: "1.6MB"
        },
        {
            icon: "file-pdf",
            name: "App Flow.pdf",
            color: this.red,
            size: "19.8MB"
        },
        {
            icon: "file-ppt",
            name: "Presentation.ppt",
            color: this.gold,
            size: "2.7MB"
        },
    ]

    activityList = [
        {
            name: "Virgil Gonzales",
            avatar: this.blue,
            date: "10:44 PM",
            action: "Complete task",
            target: "Prototype Design",
            actionType: "completed"
        },
        {
            name: "Lilian Stone",
            avatar: this.cyan,
            date: "8:34 PM",
            action: "Attached file",
            target: "Mockup Zip",
            actionType: "upload"
        },
        {
            name: "Erin Gonzales",
            avatar: this.gold,
            date: "8:34 PM",
            action: "Commented",
            target: "'This is not our work!'",
            actionType: "comment"
        },
        {
            name: "Riley Newman",
            avatar: this.blue,
            date: "8:34 PM",
            action: "Commented",
            target: "'Hi, please done this before tommorow'",
            actionType: "comment"
        },
        {
            name: "Pamela Wanda",
            avatar: this.red,
            date: "8:34 PM",
            action: "Removed",
            target: "a file",
            actionType: "removed"
        },
        {
            name: "Marshall Nichols",
            avatar: this.purple,
            date: "5:21 PM",
            action: "Create",
            target: "this project",
            actionType: "created"
        }
    ]    

    taskListToday = [
        {
            title: "Define users and workflow",
            desc: "A cheeseburger is more than sandwich",
            checked: false
        },
        {
            title: "Schedule jobs",
            desc: "I'm gonna build me an airport",
            checked: true
        },
        {
            title: "Extend the data model",
            desc: "Let us wax poetic about cheeseburger.",
            checked: true
        },
        {
            title: "Change interface",
            desc: "Efficiently unleash cross-media information",
            checked: false
        },
        {
            title: "Create databases",
            desc: "Here's the story of a man named Brady",
            checked: false
        }
    ];
    
    taskListWeek = [
        {
            title: "Verify connectivity",
            desc: "Bugger bag egg's old boy willy jolly",
            checked: false
        },
        {
            title: "Order console machines",
            desc: "Value proposition alpha crowdsource",
            checked: false
        },
        {
            title: "Customize Template",
            desc: "Do you see any Teletubbies in here",
            checked: true
        },
        {
            title: "Batch schedule",
            desc: "Trillion a very small stage in a vast",
            checked: true
        },
        {
            title: "Prepare implementation",
            desc: "Drop in axle roll-in rail slide",
            checked: true
        }
    ];

    taskListMonth = [
        {
            title: "Create user groups",
            desc: "Nipperkin run a rig ballast chase",
            checked: false
        },
        {
            title: "Design Wireframe",
            desc: "Value proposition alpha crowdsource",
            checked: true
        },
        {
            title: "Project Launch",
            desc: "I'll be sure to note that",
            checked: false
        },
        {
            title: "Management meeting",
            desc: "Hand-crafted exclusive finest",
            checked: false
        },
        {
            title: "Extend data model",
            desc: "European minnow priapumfish mosshead",
            checked: true
        }
    ]
}  
