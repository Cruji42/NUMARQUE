import { Component, OnInit, OnDestroy } from '@angular/core';
import { UsersService } from 'src/app/core/service/users.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// ── Interfaces ──────────────────────────────────────────────
export interface SearchResult {
  id: number;
  name: string;
  type: string;
  brand: string;
  size: string;
  relevance: number;
  previewBg: string;
  previewUrl?: string;
  fileTypeRaw?: string;
}

export interface RecentFile {
  icon: string;
  ext: string;
  name: string;
  size: string;
  date: string;
  brand: string;
  brandColor: string;
}

export interface Stat {
  icon: string;
  value: string;
  label: string;
  color: string;
}

export interface BrowseCategory {
  id: number;
  name: string;
  icon: string;
  count: number;
  gradient: string;
}

export interface WeeklyHighlight {
  tag: string;
  title: string;
  description: string;
  cta: string;
}

// ── Component ────────────────────────────────────────────────
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: false
})
export class HomeComponent implements OnInit, OnDestroy {

  constructor(private usersService: UsersService) { }

  // ── Search state ──────────────────────────────────────────
  searchQuery: string = '';
  selectedCategory: string = 'all';
  searchActive: boolean = false;
  isSearching: boolean = false;
  searchFocused: boolean = false;
  searchResults: SearchResult[] = [];
  totalResults: number = 0;
  viewMode: 'grid' | 'list' = 'grid';
  sortBy: string = 'relevance';
  activeTypeFilter: string = 'all';

  // ── Browse state ──────────────────────────────────────────
  browseTab: string = 'explore';

  // ── Category dropdown options ─────────────────────────────
  categories = [
    { value: 'all', label: 'Todas las categorías' },
    { value: 'photos', label: 'Fotos' },
    { value: 'videos', label: 'Videos' },
    { value: 'documents', label: 'Documentos' },
    { value: 'presentations', label: 'Presentaciones' },
    { value: 'audio', label: 'Audio' },
  ];

  // ── Quick category pills ──────────────────────────────────
  quickCategories = [
    { label: 'Fotos', icon: '🖼️', value: 'photos' },
    { label: 'Videos', icon: '🎬', value: 'videos' },
    { label: 'Documentos', icon: '📄', value: 'documents' },
    { label: 'Presentaciones', icon: '📊', value: 'presentations' },
    { label: 'Audio', icon: '🎵', value: 'audio' },
  ];

  // ── Suggestion chips ──────────────────────────────────────
  recentSearches: string[] = [];
  popularSearches: string[] = ['Identidad visual', 'Campaña verano', 'Material ATL', 'Redes sociales'];

  // ── Type filter chips ─────────────────────────────────────
  typeFilters = [
    { label: 'Todos', value: 'all' },
    { label: 'PDF', value: 'pdf' },
    { label: 'PNG', value: 'png' },
    { label: 'MP4', value: 'mp4' },
    { label: 'PPT', value: 'ppt' },
    { label: 'DOC', value: 'doc' },
  ];


  // ── Stats bar ─────────────────────────────────────────────
  stats: Stat[] = [
    { icon: '⬇️', value: '0', label: 'Material descargado', color: 'var(--blue)' },
    { icon: '👥', value: '0', label: 'Usuarios activos', color: 'var(--cyan)' },
    { icon: '⬆️', value: '0', label: 'Material subido', color: '#a78bfa' },
    { icon: '🔗', value: '0', label: 'Materiales compartidos', color: '#34d399' },
  ];

  metricsSummary = {
    total_downloads: 0,
    active_users: 0,
    total_files: 0,
    total_shared: 0
  };

  homeWeeklyNews: any = null;
  isLoadingHomeWeeklyNews = false;

  // ── Browse categories ─────────────────────────────────────
  browseCategories: BrowseCategory[] = [
    { id: 1, name: 'Identidad Visual', icon: '🎨', count: 342, gradient: 'linear-gradient(135deg, var(--card) 0%, rgba(27,94,165,0.18) 100%)' },
    { id: 2, name: 'Fotografía', icon: '📷', count: 1204, gradient: 'linear-gradient(135deg, var(--card) 0%, rgba(0,133,202,0.18) 100%)' },
    { id: 3, name: 'Video & Motion', icon: '🎬', count: 567, gradient: 'linear-gradient(135deg, var(--card) 0%, rgba(79,22,87,0.22) 100%)' },
    { id: 4, name: 'Documentos', icon: '📄', count: 891, gradient: 'linear-gradient(135deg, var(--card) 0%, rgba(33,40,68,0.40) 100%)' },
    { id: 5, name: 'Presentaciones', icon: '📊', count: 423, gradient: 'linear-gradient(135deg, var(--card) 0%, rgba(27,94,165,0.18) 100%)' },
    { id: 6, name: 'Material ATL', icon: '📺', count: 218, gradient: 'linear-gradient(135deg, var(--card) 0%, rgba(0,133,202,0.18) 100%)' },
    { id: 7, name: 'Redes Sociales', icon: '📱', count: 756, gradient: 'linear-gradient(135deg, var(--card) 0%, rgba(79,22,87,0.22) 100%)' },
    { id: 8, name: 'Audio', icon: '🎵', count: 134, gradient: 'linear-gradient(135deg, var(--card) 0%, rgba(33,40,68,0.40) 100%)' },
    { id: 9, name: 'Packaging', icon: '📦', count: 289, gradient: 'linear-gradient(135deg, var(--card) 0%, rgba(27,94,165,0.18) 100%)' },
    { id: 10, name: 'Campañas', icon: '🚀', count: 445, gradient: 'linear-gradient(135deg, var(--card) 0%, rgba(0,133,202,0.18) 100%)' },
  ];

  // ── Weekly highlight ──────────────────────────────────────
  weeklyHighlight: WeeklyHighlight = {
    tag: 'Novedades de la semana',
    title: 'Nueva campaña Nupec — Temporada Verano 2025',
    description: 'Se han subido 47 nuevos materiales para la campaña de verano. Incluye fotografías, videos y material digital listo para usar.',
    cta: 'Ver novedades'
  };

  // ── Recent files ──────────────────────────────────────────
  recentFiles: RecentFile[] = [];

  // ── Private ───────────────────────────────────────────────
  private searchTimeout: any;


  placeholders = [
    'Quiero hacer un anuncio de NUPEC para Mercado Libre...',
    'Necesito materiales de lanzamiento para NUCAN...',
    'Busco videos institucionales de GRUPO NUTEC®...',
    'Quiero imágenes de producto de NUFIT para redes sociales...',
    'Necesito una presentación de ventas del sector pecuario...'
  ];

  currentPlaceholder = 0;
  displayPlaceholder = this.placeholders[0];
  isTyping = false;

  private interval: any;

  // ── Lifecycle ─────────────────────────────────────────────
  ngOnInit(): void {
    this.loadRecentSearches();
    this.getMetricsSummary();
    this.getLatestUploadedContent();
    this.loadWeeklyHighlight();
    this.interval = setInterval(() => {
      this.rotatePlaceholder();
    }, 3000);
  }

  loadWeeklyHighlight(): void {
    this.usersService.getUser().subscribe({
      next: (user: any) => {
        if (user?.id) {
          this.isLoadingHomeWeeklyNews = true;
          this.usersService.getWeeklyNews(user.id).subscribe({
            next: (data: any) => {
              this.homeWeeklyNews = data;
              this.updateWeeklyHighlight();
              this.isLoadingHomeWeeklyNews = false;
            },
            error: (error) => {
              console.error('Error loading weekly highlight:', error);
              this.homeWeeklyNews = null;
              this.isLoadingHomeWeeklyNews = false;
            }
          });
        }
      },
      error: (error) => {
        console.error('Error fetching user for weekly highlight:', error);
      }
    });
  }

  updateWeeklyHighlight(): void {
    if (this.homeWeeklyNews) {
      this.weeklyHighlight = {
        tag: 'Novedades del mes',
        title: this.homeWeeklyNews.title,
        description: this.homeWeeklyNews.description,
        cta: 'Ver material'
      };
    }
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    clearInterval(this.interval);
  }

  // ── Search methods ────────────────────────────────────────

  onSearchFocus(): void {
    this.searchFocused = true;
  }

  rotatePlaceholder(): void {
  const el = document.getElementById('ph-text');
  el?.classList.add('ph-out');

  setTimeout(() => {
    this.currentPlaceholder =
      (this.currentPlaceholder + 1) % this.placeholders.length;
    this.displayPlaceholder =
      this.placeholders[this.currentPlaceholder];

    el?.classList.remove('ph-out');
    el?.classList.add('ph-in');
    setTimeout(() => el?.classList.remove('ph-in'), 300);
  }, 300);
}

  onSearchBlur(): void {
    // Small delay so chip clicks register before panel hides
    setTimeout(() => {
      this.searchFocused = false;
    }, 200);
  }

  /** Apply a suggestion chip term and trigger search */
  applySearch(term: string): void {
    this.searchQuery = term;
    this.searchFocused = false;
    this.executeSearch();
  }

  getMetricsSummary(): void {
    this.usersService.getMetricsSummary().subscribe({
      next: (summary: any) => {
        this.metricsSummary = {
          total_downloads: Number(summary?.total_downloads) || 0,
          active_users: Number(summary?.active_users) || 0,
          total_files: Number(summary?.total_files) || 0,
          total_shared: Number(summary?.total_shared) || 0
        };

        this.stats = [
          { icon: '⬇️', value: this.metricsSummary.total_downloads.toLocaleString('es-MX'), label: 'Material descargado', color: 'var(--blue)' },
          { icon: '👥', value: this.metricsSummary.active_users.toLocaleString('es-MX'), label: 'Usuarios activos', color: 'var(--cyan)' },
          { icon: '⬆️', value: this.metricsSummary.total_files.toLocaleString('es-MX'), label: 'Material subido', color: '#a78bfa' },
          { icon: '🔗', value: this.metricsSummary.total_shared.toLocaleString('es-MX'), label: 'Materiales compartidos', color: '#34d399' }
        ];
      },
      error: (error) => {
        console.error('Error fetching metrics summary:', error);
      }
    });
  }

  private getUserCacheKey(): string {
    try {
      const userData: any = this.usersService.decodeToken?.() ?? {};
      const userId = userData?.id ?? userData?.user_id ?? userData?.sub ?? 'anonymous';
      return `numarque_recent_searches_${userId}`;
    } catch {
      return 'numarque_recent_searches_anonymous';
    }
  }

  private loadRecentSearches(): void {
    const key = this.getUserCacheKey();
    const raw = localStorage.getItem(key);

    if (!raw) {
      this.recentSearches = [];
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      this.recentSearches = Array.isArray(parsed)
        ? parsed.filter((v: any) => typeof v === 'string').slice(0, 8)
        : [];
    } catch {
      this.recentSearches = [];
    }
  }

  private saveRecentSearches(): void {
    const key = this.getUserCacheKey();
    localStorage.setItem(key, JSON.stringify(this.recentSearches.slice(0, 8)));
  }

  private addRecentSearch(term: string): void {
    const normalized = (term || '').trim();
    if (!normalized) return;

    const withoutDup = this.recentSearches.filter(
      (t) => t.toLowerCase() !== normalized.toLowerCase()
    );

    this.recentSearches = [normalized, ...withoutDup].slice(0, 8);
    this.saveRecentSearches();
  }

  getLatestUploadedContent(): void {
    this.usersService.getUploadedLogs().subscribe({
      next: (response: any) => {
        const uploaded = response?.data ?? response?.logs ?? response ?? [];
        const list = Array.isArray(uploaded) ? uploaded : [];

        this.recentFiles = list.slice(0, 6).map((item: any) => {
          const fileName = item?.content_title ?? item?.title ?? item?.file_name ?? 'Archivo sin título';
          const ext = this.extractExtension(fileName, item?.file_type);
          const bytes = item?.file_size_bytes ?? item?.size_bytes ?? item?.file_size ?? null;
          const brand = item?.brand_name ?? this.extractBrandFromS3Key(item?.s3_key) ?? 'General';
          const createdAt = item?.created_at ?? item?.timestamp ?? item?.date ?? '';

          return {
            icon: this.getFileIcon(ext),
            ext: ext,
            name: fileName,
            size: this.formatBytes(bytes),
            date: this.formatLogDate(createdAt),
            brand: brand,
            brandColor: this.getBrandColor(brand)
          };
        });
      },
      error: (error) => {
        console.error('Error fetching latest uploaded content:', error);
        this.recentFiles = [];
      }
    });
  }

  private formatLogDate(value: string): string {
    if (!value) return '-';
    const normalized = String(value).replace(' ', 'T');
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  private getBrandColor(brand: string): string {
    const key = (brand || '').toLowerCase();
    if (key.includes('nupec')) return 'rgb(0,133,202)';
    if (key.includes('nucan')) return 'rgb(79,22,87)';
    if (key.includes('galope')) return 'rgb(27,94,165)';
    if (key.includes('pecuario')) return 'rgb(33,40,68)';
    return 'rgb(100,116,139)';
  }

  /** Main search execution with semantic API */
  executeSearch(): void {
    const trimmedQuery = this.searchQuery.trim();

    if (!trimmedQuery) {
      this.searchActive = false;
      this.searchResults = [];
      this.totalResults = 0;
      return;
    }

    this.addRecentSearch(trimmedQuery);

    this.isSearching = true;
    this.searchActive = true;
    this.searchFocused = false;

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.usersService.searchSemantic(trimmedQuery, 20).subscribe({
      
      next: (response: any) => {
        console.log(response);
        const rawResults = response?.results ?? response?.data ?? [];


        const mappedResults: SearchResult[] = rawResults.map((item: any, index: number) => {
          const file = item?.file ?? item ?? {};

          const fileName =
            file?.title ??
            file?.name ??
            file?.file_name ??
            'Sin título';

          const extension = this.extractExtension(fileName, file?.file_type);
          const brand = this.extractBrandFromS3Key(file?.s3_key) ?? item?.detected_brand_name ?? 'Sin marca';
          const size = file?.file_size_bytes ?? file?.size ?? file?.file_size ?? '-';
          const relevance = item?.score ?? file?.score ?? item?.relevance ?? 0;

          return {
            id: file?.id ?? item?.id ?? index + 1,
            name: fileName,
            type: extension.toUpperCase(),
            brand,
            size: this.formatBytes(size),
            relevance: Number(relevance) || 0,
            previewBg: this.getPreviewGradientByBrand(brand),
            previewUrl: '',
            fileTypeRaw: file?.file_type ?? ''
          };
        });

        const previewRequests = mappedResults.map((result) =>
          this.usersService.getContentPreviewUrl(result.id).pipe(
            map((previewRes: any) => ({
              ...result,
              previewUrl: previewRes?.preview_url ?? previewRes?.url ?? ''
            })),
            catchError(() => of(result))
          )
        );

        if (previewRequests.length === 0) {
          this.searchResults = [];
          this.totalResults = 0;
          this.isSearching = false;
          return;
        }

        forkJoin(previewRequests).subscribe({
          next: (resultsWithPreview: SearchResult[]) => {
            let finalResults = resultsWithPreview;
            if (this.activeTypeFilter !== 'all') {
              finalResults = finalResults.filter(r => r.type.toLowerCase() === this.activeTypeFilter.toLowerCase());
            }

            this.searchResults = finalResults;
            this.totalResults = finalResults.length;
            this.isSearching = false;
          },
          error: () => {
            let fallbackResults = mappedResults;
            if (this.activeTypeFilter !== 'all') {
              fallbackResults = fallbackResults.filter(r => r.type.toLowerCase() === this.activeTypeFilter.toLowerCase());
            }

            this.searchResults = fallbackResults;
            this.totalResults = fallbackResults.length;
            this.isSearching = false;
          }
        });
      },
      error: (error) => {
        console.error('Error semantic search:', error);
        this.searchResults = [];
        this.totalResults = 0;
        this.isSearching = false;
      }
    });
  }

  /** Clear search and return to explore view */
  clearSearch(): void {
    this.searchQuery = '';
    this.searchActive = false;
    this.isSearching = false;
    this.searchResults = [];
    this.totalResults = 0;
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  /** Set active type filter and re-run search */
  setTypeFilter(type: string): void {
    this.activeTypeFilter = type;
    if (this.searchActive) {
      this.executeSearch();
    }
  }

  /** Browse a category by clicking its card */
  browseCategory(id: number): void {
    const cat = this.browseCategories.find(c => c.id === id);
    if (cat) {
      this.searchQuery = cat.name;
      this.executeSearch();
    }
  }

  private extractExtension(fileName: string, fallbackType?: string): string {
    if (fallbackType) {
      return String(fallbackType).replace('.', '').toLowerCase();
    }
    const cleanName = String(fileName || '');
    if (!cleanName.includes('.')) return 'file';
    return cleanName.split('.').pop()?.toLowerCase() || 'file';
  }

  private extractBrandFromS3Key(s3Key?: string): string | null {
    if (!s3Key) return null;
    const parts = s3Key.split('/').filter(Boolean);
    // expected path style: user/depto/subcategory/brand/...
    if (parts.length >= 4) {
      return parts[3];
    }
    return null;
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

  private getPreviewGradientByBrand(brand: string): string {
    const key = (brand || '').toLowerCase();
    if (key.includes('nupec')) return 'linear-gradient(135deg, #0a1628 0%, rgba(0,133,202,0.18) 100%)';
    if (key.includes('nucan')) return 'linear-gradient(135deg, #0a1628 0%, rgba(79,22,87,0.22) 100%)';
    if (key.includes('galope')) return 'linear-gradient(135deg, #0a1628 0%, rgba(27,94,165,0.22) 100%)';
    return 'linear-gradient(135deg, #0a1628 0%, rgba(33,40,68,0.35) 100%)';
  }

  /** Returns emoji icon for a given file extension */
  getFileIcon(ext: string): string {
    const icons: { [key: string]: string } = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      ppt: '📊',
      pptx: '📊',
      png: '🖼️',
      jpg: '🖼️',
      jpeg: '🖼️',
      mp4: '📹',
      mp3: '🎵',
      svg: '🎨',
      txt: '📃',
    };
    return icons[ext.toLowerCase()] || '📁';
  }

  /** Returns an array of 10 items for skeleton rendering */
  getSkeletonArray(): number[] {
    return Array(10).fill(0);
  }
}
