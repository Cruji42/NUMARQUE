import { Component, OnInit, OnDestroy } from '@angular/core';

// ── Interfaces ──────────────────────────────────────────────
export interface SearchResult {
  id: number;
  name: string;
  type: string;
  brand: string;
  size: string;
  relevance: number;
  previewBg: string;
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

  // ── Mock search results ───────────────────────────────────
  private mockResults: SearchResult[] = [
    {
      id: 1,
      name: 'Logo Nupec Principal',
      type: 'PNG',
      brand: 'Nupec',
      size: '2.4 MB',
      relevance: 98,
      previewBg: 'linear-gradient(135deg, #0a1628 0%, rgba(0,133,202,0.18) 100%)'
    },
    {
      id: 2,
      name: 'Manual de Marca Nupec',
      type: 'PDF',
      brand: 'Nupec',
      size: '18.7 MB',
      relevance: 94,
      previewBg: 'linear-gradient(135deg, #0a1628 0%, rgba(0,133,202,0.12) 100%)'
    },
    {
      id: 3,
      name: 'Banner Digital Nucan',
      type: 'PNG',
      brand: 'Nucan',
      size: '4.1 MB',
      relevance: 91,
      previewBg: 'linear-gradient(135deg, #0a1628 0%, rgba(79,22,87,0.22) 100%)'
    },
    {
      id: 4,
      name: 'Video Campaña Galope',
      type: 'MP4',
      brand: 'Galope',
      size: '156 MB',
      relevance: 88,
      previewBg: 'linear-gradient(135deg, #0a1628 0%, rgba(27,94,165,0.22) 100%)'
    },
    {
      id: 5,
      name: 'Presentación Pecuario Q4',
      type: 'PPT',
      brand: 'Pecuario',
      size: '8.3 MB',
      relevance: 85,
      previewBg: 'linear-gradient(135deg, #0a1628 0%, rgba(33,40,68,0.35) 100%)'
    },
    {
      id: 6,
      name: 'Isotipo Nucan Vectorial',
      type: 'SVG',
      brand: 'Nucan',
      size: '0.8 MB',
      relevance: 82,
      previewBg: 'linear-gradient(135deg, #0a1628 0%, rgba(79,22,87,0.18) 100%)'
    },
    {
      id: 7,
      name: 'Spot Radio Galope',
      type: 'MP3',
      brand: 'Galope',
      size: '3.2 MB',
      relevance: 79,
      previewBg: 'linear-gradient(135deg, #0a1628 0%, rgba(27,94,165,0.18) 100%)'
    },
    {
      id: 8,
      name: 'Ficha Técnica Nupec',
      type: 'PDF',
      brand: 'Nupec',
      size: '1.1 MB',
      relevance: 76,
      previewBg: 'linear-gradient(135deg, #0a1628 0%, rgba(0,133,202,0.14) 100%)'
    },
    {
      id: 9,
      name: 'Mockup Empaque Pecuario',
      type: 'PNG',
      brand: 'Pecuario',
      size: '6.7 MB',
      relevance: 73,
      previewBg: 'linear-gradient(135deg, #0a1628 0%, rgba(33,40,68,0.30) 100%)'
    },
    {
      id: 10,
      name: 'Guía de Redes Sociales Nucan',
      type: 'PDF',
      brand: 'Nucan',
      size: '5.4 MB',
      relevance: 70,
      previewBg: 'linear-gradient(135deg, #0a1628 0%, rgba(79,22,87,0.15) 100%)'
    },
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

  /** Main search execution — simulates async with 1200ms delay */
  executeSearch(): void {
    if (!this.searchQuery.trim()) {
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

    this.searchTimeout = setTimeout(() => {
      const query = this.searchQuery.toLowerCase();
      let results = this.mockResults.filter(r => {
        const matchesQuery =
          r.name.toLowerCase().includes(query) ||
          r.brand.toLowerCase().includes(query) ||
          r.type.toLowerCase().includes(query);
        const matchesType =
          this.activeTypeFilter === 'all' ||
          r.type.toLowerCase() === this.activeTypeFilter.toLowerCase();
        return matchesQuery || matchesType;
      });

      // If no specific match, return all (demo behaviour)
      if (results.length === 0) {
        results = [...this.mockResults];
      }

      // Apply type filter
      if (this.activeTypeFilter !== 'all') {
        results = results.filter(r => r.type.toLowerCase() === this.activeTypeFilter.toLowerCase());
        if (results.length === 0) {
          results = [...this.mockResults];
        }
      }

      this.searchResults = results;
      this.totalResults = results.length;
      this.isSearching = false;
    }, 1200);
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
