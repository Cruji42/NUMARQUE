export interface DownloadsReportPeriod {
    start_date: string;
    end_date: string;
    label: string;
    cut_label: string;
}

export interface DownloadsReportSummary {
    total_downloads: number;
    downloaded_files: number;
    new_users: number;
    avg_downloads_per_file: number;
    single_download_files: number;
}

export interface DownloadsReportInsight {
    title: string;
    text: string;
}

export interface DownloadsReportFile {
    file_name: string;
    content_type: string;
    brand: string;
    format: string;
    downloads: number;
    percentage: number;
    bar_width: number;
}

export interface DownloadsReportBreakdown {
    label: string;
    downloads: number;
    files: number;
    percentage: number;
}

export interface DownloadsReport {
    period: DownloadsReportPeriod;
    summary: DownloadsReportSummary;
    insights: DownloadsReportInsight[];
    top_files: DownloadsReportFile[];
    by_content_type: DownloadsReportBreakdown[];
    by_format: DownloadsReportBreakdown[];
    by_brand: DownloadsReportBreakdown[];
    files: DownloadsReportFile[];
}
