import { Component } from '@angular/core'
import { ThemeConstantService } from '../../shared/services/theme-constant.service';
import { UsersService } from 'src/app/core/service/users.service';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { FilesService } from 'src/app/core/service/files.service';

@Component({
    templateUrl: './default-dashboard.component.html',
    standalone: false,
    styles: ['default-dashboard.component.scss']
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
    black = this.themeColors.black;

    taskListIndex: number = 0;

    user: any;
    today: Date = new Date();
    weeklyNews: any = null;
    isLoadingWeeklyNews = false;
    metricsSummary = {
        total_downloads: 0,
        active_users: 0,
        total_files: 0,
        total_shared: 0
    };

    constructor(
        private service: FilesService,
        private colorConfig: ThemeConstantService, private userService: UsersService, private router: Router) {
        // this.user = this.userService.decodeToken();
        // console.log(this.user)
    }

    ngOnInit() {
        this.getUserData();
        this.getMetricsSummary();
        this.getActivityList();
        this.getTopFilesList();
        this.getDownloadsByBrand();
        this.getMaterialsByMonth();
        this.getSharedByMonth();
        this.getLatestUploadedContent();
        console.log(this.user);
    }


    getUserData() {

        this.userService.getUser().subscribe({
            next: (user: any) => {
                // console.log('Fetched users:', user);
                // this.form.patchValue({
                //     ...user,
                //     user_id: user.id
                // })
                // this.profile_picture_url = user.profile_picture_url
                this.user = user
                console.log(this.user)
                // this.brands_data = user.brands

                // Fetch weekly news after user is loaded
                if (this.user?.id) {
                    this.isLoadingWeeklyNews = true;
                    this.userService.getWeeklyNews(this.user.id).subscribe({
                        next: (news: any) => {
                            console.log('Fetched weekly news:', news);
                            this.weeklyNews = news;
                            this.isLoadingWeeklyNews = false;
                            
                        },
                        error: (error) => {
                            console.error('Error fetching weekly news:', error);
                            this.weeklyNews = null;
                            this.isLoadingWeeklyNews = false;
                        }
                    });
                }
            },
            error: (error) => {
                console.error('Error fetching users:', error);
            }
        })
    }

    getMetricsSummary() {
        this.userService.getMetricsSummary().subscribe({
            next: (summary: any) => {
                this.metricsSummary = {
                    total_downloads: summary?.total_downloads ?? 0,
                    active_users: summary?.active_users ?? 0,
                    total_files: summary?.total_files ?? 0,
                    total_shared: summary?.total_shared ?? 0
                };
            },
            error: (error) => {
                console.error('Error fetching metrics summary:', error);
            }
        });
    }

    getActivityList() {
        this.userService.getMetricsActivity(10).subscribe({
            next: (response: any) => {
                const activity = response?.activity ?? [];
                this.activityList = activity.map((item: any) => ({
                    name: item?.user_name ?? '',
                    avatar: this.getAvatarColorByType(item?.type_log),
                    date: this.formatActivityDate(item?.timestamp),
                    action: item?.action ?? '',
                    target: item?.content_title ?? '',
                    actionType: item?.type_log ?? ''
                }));
            },
            error: (error) => {
                console.error('Error fetching activity list:', error);
                this.activityList = [];
            }
        });
    }

    getAvatarColorByType(typeLog: string): string {
        const type = (typeLog || '').toUpperCase();

        if (type === 'DOWNLOADED') {
            return this.cyan;
        }
        if (type === 'UPLOADED') {
            return this.blue;
        }
        if (type === 'SHARED') {
            return this.purple;
        }
        if (type === 'DELETED') {
            return this.red;
        }

        return this.gold;
    }

    formatActivityDate(timestamp: string): string {
        if (!timestamp) {
            return '';
        }

        const normalized = timestamp.replace(' ', 'T');
        const date = new Date(normalized);

        if (isNaN(date.getTime())) {
            return timestamp;
        }

        return date.toLocaleString('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    getTopFilesList() {
        this.userService.getMetricsTopFiles(5).subscribe({
            next: (response: any) => {
                const topFiles = response?.top_files ?? [];
                this.downloadsList = topFiles.map((file: any) => {
                    const fileName = file?.title ?? '';
                    const extension = fileName.includes('.') ? (fileName.split('.').pop()?.toUpperCase() ?? 'FILE') : 'FILE';

                    return {
                        name: fileName,
                        avatar: this.getFileIconByName(fileName),
                        earn: file?.brand_name ?? '',
                        sales: extension,
                        stock: file?.bar_width ?? 0,
                        download_count: file?.download_count ?? 0
                    };
                });
            },
            error: (error) => {
                console.error('Error fetching top files:', error);
                this.downloadsList = [];
            }
        });
    }

    getDownloadsByBrand() {
        this.userService.getDownloadsByBrand().subscribe({
            next: (response: any) => {
                const brands = response?.downloads_by_brand ?? [];

                const chartColors = [this.cyan, this.purple, this.black, this.blue, this.gold, this.red];

                this.downloadsByBrand = brands.map((brand: any, index: number) => ({
                    brand_name: brand?.brand_name ?? '',
                    count: brand?.count ?? 0,
                    percentage: brand?.percentage ?? 0,
                    color: chartColors[index % chartColors.length]
                }));

                this.customersChartDataObj = {
                    labels: this.downloadsByBrand.map((item: any) => item.brand_name),
                    datasets: [{
                        data: this.downloadsByBrand.map((item: any) => item.count),
                        backgroundColor: this.downloadsByBrand.map((item: any) => item.color)
                    }]
                };
            },
            error: (error) => {
                console.error('Error fetching downloads by brand:', error);
                this.downloadsByBrand = [];
            }
        });
    }

    getMaterialsByMonth() {
        forkJoin({
            downloads: this.userService.getDownloadLogs(),
            uploads: this.userService.getUploadLogs()
        }).subscribe({
            next: ({ downloads, uploads }) => {
                const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                const currentYear = new Date().getFullYear();

                const downloadCounts = new Array(12).fill(0);
                const uploadCounts = new Array(12).fill(0);

                const downloadsData = downloads?.data ?? [];
                const uploadsData = uploads?.data ?? [];

                downloadsData.forEach((item: any) => {
                    const date = new Date(item?.created_at);
                    if (!isNaN(date.getTime()) && date.getFullYear() === currentYear) {
                        downloadCounts[date.getMonth()] += 1;
                    }
                });

                uploadsData.forEach((item: any) => {
                    const date = new Date(item?.created_at);
                    if (!isNaN(date.getTime()) && date.getFullYear() === currentYear) {
                        uploadCounts[date.getMonth()] += 1;
                    }
                });

                this.avgProfitChartDataObj = {
                    labels: monthLabels,
                    datasets: [
                        {
                            data: downloadCounts,
                            label: 'Descargas',
                            categoryPercentage: 0.35,
                            barPercentage: 0.3,
                            backgroundColor: this.blue,
                            borderWidth: 0
                        },
                        {
                            data: uploadCounts,
                            label: 'Subidos',
                            categoryPercentage: 0.35,
                            barPercentage: 0.3,
                            backgroundColor: this.blueLight,
                            borderWidth: 0
                        }
                    ]
                };
            },
            error: (error) => {
                console.error('Error fetching monthly materials data:', error);
            }
        });
    }

    sharedDataByYear: { [year: number]: number[] } = {};
    availableSharedYears: number[] = [];
    selectedSharedYear: number = new Date().getFullYear();

    getSharedByMonth() {
        this.userService.getSharedLogs().subscribe({
            next: (response: any) => {
                const sharedData = response?.data ?? [];
                const groupedByYear: { [year: number]: number[] } = {};

                sharedData.forEach((item: any) => {
                    const date = new Date(item?.created_at);
                    if (isNaN(date.getTime())) return;

                    const year = date.getFullYear();
                    const month = date.getMonth();

                    if (!groupedByYear[year]) {
                        groupedByYear[year] = new Array(12).fill(0);
                    }

                    groupedByYear[year][month] += 1;
                });

                this.sharedDataByYear = groupedByYear;
                this.availableSharedYears = Object.keys(groupedByYear)
                    .map(Number)
                    .sort((a, b) => b - a);

                const currentYear = new Date().getFullYear();
                this.selectedSharedYear = this.availableSharedYears.includes(currentYear)
                    ? currentYear
                    : (this.availableSharedYears[0] ?? currentYear);

                this.updateSharedChartBySelectedYear();
            },
            error: (error) => {
                console.error('Error fetching shared logs:', error);
            }
        });
    }

    updateSharedChartBySelectedYear() {
        const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const sharedCounts = this.sharedDataByYear[this.selectedSharedYear] ?? new Array(12).fill(0);

        this.revenueChartDataObj = {
            labels: monthLabels,
            datasets: [{
                data: sharedCounts,
                label: `Compartidos ${this.selectedSharedYear}`
            }]
        };
    }

    onRevenueChartFormatChange() {
        if (this.revenueChartFormat === 'revenueYear' && this.availableSharedYears.length > 0) {
            this.selectedSharedYear = this.availableSharedYears[0];
        }
        this.updateSharedChartBySelectedYear();
    }

    getLatestUploadedContent() {
        this.userService.getUploadedLogs().subscribe({
            next: (response: any) => {
                console.log('Latest uploaded content response:', response);
                const uploaded = response?.data ?? response?.logs ?? response ?? [];
                const list = Array.isArray(uploaded) ? uploaded : [];

                this.fileList = list.slice(0, 6).map((item: any) => {
                    const fileName = item?.content_title ?? item?.title ?? item?.file_name ?? 'Archivo sin título';
                    const extension = fileName.includes('.') ? (fileName.split('.').pop()?.toLowerCase() ?? '') : '';

                    return {
                        id: item?.content_id ?? item?.id ?? null,           // ✅ NUEVO
                        entity_id: item?.entity_id ?? null,                        // ✅ NUEVO
                        subcategory_id: item?.subcategory_id ?? null,                   // ✅ NUEVO
                        icon: this.getFileIconByExtension(extension),
                        name: fileName,
                        color: this.getBrandColor(item?.brand_name ?? this.extractBrandFromS3Key(item?.s3_key) ?? ''),
                        size: this.formatBytes(item?.file_size_bytes ?? item?.size_bytes ?? item?.file_size ?? null)
                    };
                });
            },
            error: (error) => {
                console.error('Error fetching latest uploaded content:', error);
                this.fileList = [];
            }
        });
    }

    goToFile(item: any): void {
        if (!item?.entity_id || !item?.subcategory_id) return;

        this.router.navigate(['/pages/category-view'], {
            queryParams: {
                brandId: item.entity_id,
                subcategoryId: item.subcategory_id,
                contentId: item.id
            }
        });

    }

        downloadFile(file: any): void {
        // console.log(this.selectedItem)
        this.service.downloadFile(file.id).subscribe({
            next: (url: any) => {
                console.log(url)
                const link = document.createElement('a');
                link.href = url;
                link.download = (file?.name || 'archivo').toString();
                // link.target = '_blank'; // opcional
                link.click();

            }, error: (err: any) => {
                console.log(err)
            }
        })

    }

    getFileIconByExtension(extension: string): string {
        const ext = (extension || '').toLowerCase();

        if (['pdf'].includes(ext)) return 'file-pdf';
        if (['doc', 'docx'].includes(ext)) return 'file-word';
        if (['xls', 'xlsx', 'csv'].includes(ext)) return 'file-excel';
        if (['ppt', 'pptx'].includes(ext)) return 'file-ppt';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'file-image';
        if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video-camera';
        if (['txt', 'md', 'json', 'xml'].includes(ext)) return 'file-text';
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'file-zip';

        return 'file';
    }

    private extractBrandFromS3Key(s3Key?: string): string | null {
        if (!s3Key) return null;
        const parts = s3Key.split('/').filter(Boolean);
        if (parts.length >= 4) {
            return parts[3];
        }
        return null;
    }

    private getBrandColor(brand: string): string {
        const key = (brand || '').toLowerCase();
        if (key.includes('nupec')) return this.blue;
        if (key.includes('nucan')) return this.purple;
        if (key.includes('galope')) return this.cyan;
        if (key.includes('pecuario')) return this.black;
        return this.gold;
    }

    private formatBytes(value: any): string {
        const bytes = Number(value);
        if (!Number.isFinite(bytes) || bytes < 0) return '-';
        if (bytes < 1024) return `${bytes} B`;
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        const mb = kb / 1024;
        if (mb < 1024) return `${mb.toFixed(1)} MB`;
        const gb = mb / 1024;
        return `${gb.toFixed(1)} GB`;
    }

    getFileIconByName(fileName: string): string {
        if (!fileName || fileName.indexOf('.') === -1) {
            return 'file';
        }

        const extension = fileName.split('.').pop()?.toLowerCase() ?? '';

        if (['pdf'].includes(extension)) return 'file-pdf';
        if (['doc', 'docx'].includes(extension)) return 'file-word';
        if (['xls', 'xlsx', 'csv'].includes(extension)) return 'file-excel';
        if (['ppt', 'pptx'].includes(extension)) return 'file-ppt';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'file-image';
        if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension)) return 'video-camera';
        if (['txt', 'md', 'json', 'xml'].includes(extension)) return 'file-text';
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return 'file-zip';

        return 'file';
    }

    revenueChartFormat: string = 'revenueMonth';

    testData = {
        labels: ['A', 'B', 'C'],
        datasets: [
            {
                data: [10, 20, 30],
                label: 'Test'
            }
        ]
    };


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
        animation: {
            duration: 1000, // 2 segundos
            easing: 'easeOutQuart'
        },
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
        labels: ['Nupec', 'Nucan', 'Galope'],
        datasets: [{
            data: [350, 450, 100],
            backgroundColor: [this.cyan, this.purple, this.black]
        }]
    };
    customersChartOptions: any = {
        cutoutPercentage: 75,
        maintainAspectRatio: false,
        animation: {
            duration: 1000, // 2 segundos
            easing: 'easeOutQuart'
        }
    }
    customersChartType = 'doughnut';

    //Bar Chart
    avgProfitChartOptions: any = {
        scaleShowVerticalLines: false,
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1000, // 2 segundos
            easing: 'easeOutQuart'
        },
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
                label: 'Descargas',
                categoryPercentage: 0.35,
                barPercentage: 0.3,
                backgroundColor: this.blue,
                borderWidth: 0
            },
            {
                data: [55, 69, 90, 81, 86, 27, 77],
                label: 'Subidos',
                categoryPercentage: 0.35,
                barPercentage: 0.3,
                backgroundColor: this.blueLight,
                borderWidth: 0
            }
        ]
    };
    avgProfitChartType = 'bar';
    avgProfitChartLegend = false;

    downloadsList: any[] = []
    downloadsByBrand: any[] = []

    fileList: any[] = []

    activityList: any[] = []

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
