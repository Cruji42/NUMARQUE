import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { UsersService } from 'src/app/core/service/users.service';
import { DownloadsReport, DownloadsReportBreakdown, DownloadsReportFile } from 'src/app/core/interfaces';

type DatePreset = 'this-month' | 'last-month' | 'last-30-days';

interface FileColumn {
    title: string;
    compare: ((a: DownloadsReportFile, b: DownloadsReportFile) => number) | null;
}

@Component({
    selector: 'app-downloads-report',
    templateUrl: './downloads-report.component.html',
    styleUrls: ['./downloads-report.component.scss'],
    standalone: false
})
export class DownloadsReportComponent implements OnInit, OnDestroy {

    startDate: Date | null = null;
    endDate: Date | null = null;
    activePreset: DatePreset | null = 'this-month';

    report: DownloadsReport | null = null;
    isLoading = false;
    isExporting = false;
    formError = '';

    searchTerm = '';
    filteredFiles: DownloadsReportFile[] = [];
    stackGroups: { title: string; items: DownloadsReportBreakdown[] }[] = [];

    // Paleta Grupo NUTEC para barras apiladas (formato / marca)
    readonly stackPalette = ['#1B365D', '#0085CA', '#75787B', '#B1B3B3', '#5FB0DD', '#3D5A80'];

    readonly presets: { key: DatePreset; label: string }[] = [
        { key: 'this-month', label: 'Este mes' },
        { key: 'last-month', label: 'Mes anterior' },
        { key: 'last-30-days', label: 'Últimos 30 días' }
    ];

    fileColumns: FileColumn[] = [
        { title: 'Archivo', compare: (a, b) => (a.file_name || '').localeCompare(b.file_name || '') },
        { title: 'Tipo de contenido', compare: (a, b) => (a.content_type || '').localeCompare(b.content_type || '') },
        { title: 'Marca', compare: (a, b) => (a.brand || '').localeCompare(b.brand || '') },
        { title: 'Formato', compare: (a, b) => (a.format || '').localeCompare(b.format || '') },
        { title: 'Descargas', compare: (a, b) => a.downloads - b.downloads }
    ];

    private reportSub?: Subscription;
    private exportSub?: Subscription;

    constructor(private userService: UsersService) { }

    ngOnInit(): void {
        this.applyPreset('this-month');
        this.generate();
    }

    ngOnDestroy(): void {
        this.reportSub?.unsubscribe();
        this.exportSub?.unsubscribe();
    }

    // ----------------------------------------------------------------
    // Filtro de fechas
    // ----------------------------------------------------------------
    applyPreset(preset: DatePreset): void {
        const today = this.startOfDay(new Date());

        if (preset === 'this-month') {
            this.startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            this.endDate = today;
        } else if (preset === 'last-month') {
            this.startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            this.endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        } else {
            this.startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
            this.endDate = today;
        }

        this.activePreset = preset;
        this.formError = '';
    }

    onDateChange(): void {
        this.activePreset = null;
        this.formError = '';
    }

    disabledEndDate = (current: Date): boolean => {
        return !!this.startDate && this.startOfDay(current) < this.startOfDay(this.startDate);
    }

    private validateRange(): boolean {
        if (!this.startDate || !this.endDate) {
            this.formError = 'Selecciona la fecha de inicio y la fecha fin.';
            return false;
        }
        if (this.startOfDay(this.endDate) < this.startOfDay(this.startDate)) {
            this.formError = 'La fecha fin no puede ser anterior a la fecha de inicio.';
            return false;
        }
        this.formError = '';
        return true;
    }

    // ----------------------------------------------------------------
    // Carga del reporte
    // ----------------------------------------------------------------
    generate(): void {
        if (this.isLoading || !this.validateRange() || !this.startDate || !this.endDate) {
            return;
        }

        this.isLoading = true;
        this.reportSub?.unsubscribe();
        this.reportSub = this.userService.getDownloadsReport(this.toApiDate(this.startDate), this.toApiDate(this.endDate)).subscribe({
            next: (report: DownloadsReport) => {
                this.report = report;
                this.stackGroups = [
                    { title: 'Por formato', items: report.by_format ?? [] },
                    { title: 'Por marca', items: report.by_brand ?? [] }
                ];
                this.searchTerm = '';
                this.applySearch();
                this.isLoading = false;
            },
            error: (error: HttpErrorResponse) => {
                this.isLoading = false;
                if (error.status === 400) {
                    this.formError = error.error?.detail || 'El rango de fechas no es válido.';
                }
                // 401 / 500: el MessageErrorInterceptor ya muestra el modal global
                console.error('Error fetching downloads report:', error);
            }
        });
    }

    get hasDownloads(): boolean {
        return (this.report?.summary?.total_downloads ?? 0) > 0;
    }

    get canExport(): boolean {
        return this.hasDownloads && !this.isLoading && !this.isExporting;
    }

    // ----------------------------------------------------------------
    // Exportar PDF
    // ----------------------------------------------------------------
    exportPdf(): void {
        if (!this.canExport || !this.report) {
            return;
        }

        // Se exporta el periodo del reporte en pantalla, no lo que haya en el filtro sin generar
        const { start_date, end_date } = this.report.period;
        const start = this.fromApiDate(start_date);
        const end = this.fromApiDate(end_date);

        this.isExporting = true;
        this.exportSub = this.userService.exportDownloadsReport(start_date, end_date).subscribe({
            next: (response) => {
                this.isExporting = false;
                if (!response.body) {
                    return;
                }

                const url = URL.createObjectURL(response.body);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Corte_NUMARQUE_${this.toFileDate(start)}_a_${this.toFileDate(end)}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                // Revocar en el siguiente tick: algunos navegadores cancelan la descarga si se revoca de inmediato
                setTimeout(() => URL.revokeObjectURL(url));
            },
            error: async (error: HttpErrorResponse) => {
                this.isExporting = false;
                if (error.status === 400) {
                    this.formError = (await this.readBlobDetail(error.error)) || 'El rango de fechas no es válido.';
                }
                console.error('Error exporting downloads report:', error);
            }
        });
    }

    /** Con responseType 'blob' el cuerpo del error también llega como Blob */
    private async readBlobDetail(body: unknown): Promise<string> {
        if (!(body instanceof Blob)) {
            return '';
        }
        try {
            const parsed = JSON.parse(await body.text());
            return typeof parsed?.detail === 'string' ? parsed.detail : '';
        } catch {
            return '';
        }
    }

    // ----------------------------------------------------------------
    // Tabla de detalle
    // ----------------------------------------------------------------
    applySearch(): void {
        const files = this.report?.files ?? [];
        const term = this.normalizeText(this.searchTerm);
        this.filteredFiles = !term
            ? files
            : files.filter(f =>
                [f.file_name, f.content_type, f.brand, f.format].some(value => this.normalizeText(value).includes(term))
            );
    }

    // ----------------------------------------------------------------
    // Helpers de presentación
    // ----------------------------------------------------------------
    /** Formato decimal con coma: 1.35 → "1,35" */
    formatDecimal(value: number | null | undefined): string {
        return (value ?? 0).toFixed(2).replace('.', ',');
    }

    formatInt(value: number | null | undefined): string {
        return (value ?? 0).toLocaleString('es-MX');
    }

    stackColor(index: number): string {
        return this.stackPalette[index % this.stackPalette.length];
    }

    trackByLabel(_: number, item: { label: string }): string {
        return item.label;
    }

    trackByFile(_: number, item: DownloadsReportFile): string {
        return `${item.file_name}|${item.brand}|${item.format}`;
    }

    private startOfDay(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    /** YYYY-MM-DD en hora local (toISOString desplazaría el día por la zona horaria) */
    private toApiDate(date: Date): string {
        return `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())}`;
    }

    private fromApiDate(value: string): Date {
        const [year, month, day] = value.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    /** DD_MM_YYYY para el nombre del PDF */
    private toFileDate(date: Date): string {
        return `${this.pad(date.getDate())}_${this.pad(date.getMonth() + 1)}_${date.getFullYear()}`;
    }

    private pad(value: number): string {
        return String(value).padStart(2, '0');
    }

    private normalizeText(value: string): string {
        return (value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .trim();
    }
}
