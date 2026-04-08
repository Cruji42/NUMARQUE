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
  recentSearches: string[] = ['Logo Nupec', 'Banner Galope', 'Video campaña', 'Mockup Nucan'];
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
    { icon: '⬇️', value: '12,847', label: 'Material descargado', color: 'var(--blue)' },
    { icon: '👥', value: '284', label: 'Usuarios activos', color: 'var(--cyan)' },
    { icon: '⬆️', value: '3,621', label: 'Material subido', color: '#a78bfa' },
    { icon: '🔗', value: '1,094', label: 'Materiales compartidos', color: '#34d399' },
  ];

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
  recentFiles: RecentFile[] = [
    { icon: '📄', ext: 'pdf', name: 'Brief Campaña Nupec Q1.pdf', size: '2.1 MB', date: '15 ene 2025', brand: 'Nupec', brandColor: 'rgb(0,133,202)' },
    { icon: '📊', ext: 'ppt', name: 'Presentación Estrategia Nucan.pptx', size: '8.4 MB', date: '14 ene 2025', brand: 'Nucan', brandColor: 'rgb(79,22,87)' },
    { icon: '🖼️', ext: 'png', name: 'Logo Galope Horizontal.png', size: '1.8 MB', date: '13 ene 2025', brand: 'Galope', brandColor: 'rgb(27,94,165)' },
    { icon: '📹', ext: 'mp4', name: 'Spot TV Pecuario 30s.mp4', size: '245 MB', date: '12 ene 2025', brand: 'Pecuario', brandColor: 'rgb(33,40,68)' },
    { icon: '📝', ext: 'doc', name: 'Manual de Marca Nupec 2025.docx', size: '5.6 MB', date: '11 ene 2025', brand: 'Nupec', brandColor: 'rgb(0,133,202)' },
    { icon: '📊', ext: 'xls', name: 'Inventario Material Nucan.xlsx', size: '0.9 MB', date: '10 ene 2025', brand: 'Nucan', brandColor: 'rgb(79,22,87)' },
  ];

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
    this.interval = setInterval(() => {
      this.rotatePlaceholder();
    }, 3000);
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

  /** Main search execution with semantic API */
  executeSearch(): void {
    const trimmedQuery = this.searchQuery.trim();

    if (!trimmedQuery) {
      this.searchActive = false;
      this.searchResults = [];
      this.totalResults = 0;
      return;
    }

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
