import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';

// ----------------------------------------------------------------
// Interfaces
// ----------------------------------------------------------------
export interface CategoryCard {
    key: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    bgColor: string;
}

export interface FolderItem {
    id: number;
    name: string;
    count: number;
    favorite: boolean;
    parentId: number | null;
    brand?: string;
}

export interface FileItem {
    id: number;
    name: string;
    type: string;
    size: string;
    uploaded_at: string;
    uploaded_by: string;
    brand: string;
    category: string;
    downloads: number;
    favorite: boolean;
    folderId: number | null;
    url?: string;
}

export interface BreadcrumbItem {
    label: string;
    folderId: number | null;
}

// ----------------------------------------------------------------
// Catálogo de categorías
// ----------------------------------------------------------------
const PETFOOD_CATEGORIES: CategoryCard[] = [
    {
        key: 'ATL',
        title: 'ATL',
        description: 'Materiales Above The Line: televisión, radio, prensa y espectaculares.',
        icon: '📺',
        color: '#1E4FC2',
        bgColor: '#EFF6FF'
    },
    {
        key: 'DIGITAL',
        title: 'Digital',
        description: 'Contenido para redes sociales, banners web, email marketing y campañas digitales.',
        icon: '💻',
        color: '#0891B2',
        bgColor: '#ECFEFF'
    },
    {
        key: 'TÉCNICO',
        title: 'Técnico',
        description: 'Fichas técnicas, guías de nutrición, documentación de producto y materiales científicos.',
        icon: '📋',
        color: '#059669',
        bgColor: '#F0FDF4'
    },
    {
        key: 'EVENTOS Y BTL',
        title: 'Eventos y BTL',
        description: 'Activaciones, stands, exhibidores y material de punto de venta.',
        icon: '🎪',
        color: '#D97706',
        bgColor: '#FFFBEB'
    }
];

const PECUARIO_CATEGORIES: CategoryCard[] = [
    {
        key: 'FICHAS',
        title: 'Fichas técnicas',
        description: 'Especificaciones nutricionales y parámetros de uso por especie.',
        icon: '📄',
        color: '#059669',
        bgColor: '#F0FDF4'
    },
    {
        key: 'DIGITAL',
        title: 'Digital',
        description: 'Materiales para redes sociales y canales digitales.',
        icon: '💻',
        color: '#0891B2',
        bgColor: '#ECFEFF'
    },
    {
        key: 'EVENTOS',
        title: 'Eventos',
        description: 'Material de activaciones, ferias ganaderas y eventos de campo.',
        icon: '🎪',
        color: '#D97706',
        bgColor: '#FFFBEB'
    }
];

const INSTITUCIONAL_CATEGORIES: CategoryCard[] = [
    {
        key: 'CORPORATIVO',
        title: 'Corporativo',
        description: 'Presentaciones, logos, identidad visual y papelería institucional.',
        icon: '🏢',
        color: '#1E4FC2',
        bgColor: '#EFF6FF'
    },
    {
        key: 'COMUNICADOS',
        title: 'Comunicados',
        description: 'Boletines de prensa, cartas y documentos oficiales.',
        icon: '📢',
        color: '#7C3AED',
        bgColor: '#F5F3FF'
    }
];

const BRAND_CATEGORIES: Record<string, CategoryCard[]> = {
    NUPEC: PETFOOD_CATEGORIES,
    NUCAN: PETFOOD_CATEGORIES,
    NUCAT: PETFOOD_CATEGORIES,
    NUFIT: PETFOOD_CATEGORIES,
    'ÓPTIMO SELECTO': PETFOOD_CATEGORIES,
    'ÓPTIMO FELINO': PETFOOD_CATEGORIES,
    AVES: PECUARIO_CATEGORIES,
    'CAMARÓN': PECUARIO_CATEGORIES,
    CERDOS: PECUARIO_CATEGORIES,
    EQUINOS: PECUARIO_CATEGORIES,
    GALLOS: PECUARIO_CATEGORIES,
    PECES: PECUARIO_CATEGORIES,
    RUMIANTES: PECUARIO_CATEGORIES,
    'FEED SOLUTIONS': PECUARIO_CATEGORIES,
    NUTEC: INSTITUCIONAL_CATEGORIES,
    INCASARA: INSTITUCIONAL_CATEGORIES,
};

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
@Component({
    selector: 'app-category-view',
    templateUrl: './category-view.component.html',
    styleUrls: ['./category-view.component.scss'],
    standalone: false
})
export class CategoryViewComponent implements OnInit {

    // 'categories' = pantalla de cards de sección
    // 'files'      = file manager dentro de una sección
    viewMode: 'categories' | 'files' = 'categories';
    fileViewMode: 'grid' | 'list' = 'grid';

    activeBrand = '';
    activeSection = '';

    categoryCards: CategoryCard[] = [];

    // File manager state
    searchQuery = '';
    selectedFile: FileItem | null = null;
    currentFolderId: number | null = null;
    breadcrumbs: BreadcrumbItem[] = [];
    filteredFolders: FolderItem[] = [];
    filteredFiles: FileItem[] = [];

    // Mock data — reemplazar con servicio real
    allFolders: FolderItem[] = [
        { id: 1, name: 'NUPEC', count: 25, favorite: false, parentId: null, brand: 'NUPEC' },
        { id: 10, name: 'ATL', count: 12, favorite: false, parentId: 1 },
        { id: 11, name: 'BTL', count: 8, favorite: false, parentId: 1 },
        { id: 12, name: 'Digital', count: 15, favorite: true, parentId: 1 },
        { id: 20, name: 'Portadas', count: 12, favorite: false, parentId: 10 },
        { id: 21, name: 'Banners digitales', count: 8, favorite: true, parentId: 10 },
        { id: 22, name: 'Spots de TV', count: 5, favorite: false, parentId: 10 },
    ];

    allFiles: FileItem[] = [
        { id: 1, name: 'Adulto_hero.png', type: 'png', size: '4.2 MB', uploaded_at: '2026-03-10', uploaded_by: 'Mario_', brand: 'NUPEC', category: 'ATL', downloads: 23, favorite: false, folderId: 20 },
        { id: 2, name: 'Spot_TV_30s.mp4', type: 'mp4', size: '84 MB', uploaded_at: '2026-03-08', uploaded_by: 'Mario_', brand: 'NUPEC', category: 'ATL', downloads: 11, favorite: true, folderId: 20 },
        { id: 3, name: 'Brief_campana_Q2.pdf', type: 'pdf', size: '1.8 MB', uploaded_at: '2026-03-05', uploaded_by: 'Edgar Alejandro', brand: 'NUPEC', category: 'ATL', downloads: 45, favorite: false, folderId: 20 },
        { id: 4, name: 'Banner_web_728x90.png', type: 'png', size: '220 KB', uploaded_at: '2026-03-01', uploaded_by: 'Mario_', brand: 'NUPEC', category: 'DIGITAL', downloads: 30, favorite: false, folderId: 21 },
        { id: 5, name: 'Guia_uso_logo.ai', type: 'ai', size: '12 MB', uploaded_at: '2026-02-20', uploaded_by: 'Edgar Alejandro', brand: 'NUPEC', category: 'ATL', downloads: 7, favorite: false, folderId: 10 },
    ];

    constructor(
        private message: NzMessageService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.route.queryParamMap.subscribe(params => {
            this.activeBrand = params.get('brand') || '';
            this.activeSection = params.get('section') || '';

            if (this.activeSection) {
                this.enterFileManager();
            } else {
                this.enterCategoryMode();
            }
        });
    }

    // ----------------------------------------------------------------
    // Mode switching
    // ----------------------------------------------------------------
    private enterCategoryMode(): void {
        this.viewMode = 'categories';
        this.categoryCards = BRAND_CATEGORIES[this.activeBrand.toUpperCase()] || PETFOOD_CATEGORIES;
        this.breadcrumbs = [{ label: this.activeBrand, folderId: null }];
    }

    private enterFileManager(): void {
        this.viewMode = 'files';
        this.currentFolderId = null;
        this.searchQuery = '';
        this.selectedFile = null;
        this.breadcrumbs = [
            { label: this.activeBrand, folderId: null },
            { label: this.activeSection, folderId: null }
        ];
        this.loadCurrentLevel();
    }

    openCategory(card: CategoryCard): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { brand: this.activeBrand, section: card.key },
        });
    }

    // ----------------------------------------------------------------
    // File manager navigation
    // ----------------------------------------------------------------
    loadCurrentLevel(): void {
        this.selectedFile = null;

        let folders = this.allFolders.filter(f => f.parentId === this.currentFolderId);
        let files = this.allFiles.filter(f => f.folderId === this.currentFolderId);

        if (this.currentFolderId === null) {
            if (this.activeBrand) {
                folders = folders.filter(f => f.brand?.toUpperCase() === this.activeBrand.toUpperCase());
                files = files.filter(f => f.brand?.toUpperCase() === this.activeBrand.toUpperCase());
            }
            if (this.activeSection) {
                files = files.filter(f => f.category?.toUpperCase() === this.activeSection.toUpperCase());
            }
        }

        this.filteredFolders = folders;
        this.filteredFiles = files;
    }

    openFolder(folder: FolderItem): void {
        this.currentFolderId = folder.id;
        this.breadcrumbs = [...this.breadcrumbs, { label: folder.name, folderId: folder.id }];
        this.searchQuery = '';
        this.loadCurrentLevel();
    }

    navigateToBreadcrumb(crumb: BreadcrumbItem, index: number): void {
        if (index === 0) {
            // Volver al listado de categorías de la marca
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { brand: this.activeBrand },
            });
            return;
        }
        if (index === 1 && this.viewMode === 'files') {
            // Volver a la raíz del file manager (sección, sin subfolder)
            this.currentFolderId = null;
            this.breadcrumbs = this.breadcrumbs.slice(0, 2);
            this.searchQuery = '';
            this.loadCurrentLevel();
            return;
        }
        this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
        this.currentFolderId = crumb.folderId;
        this.searchQuery = '';
        this.loadCurrentLevel();
    }

    // ----------------------------------------------------------------
    // Search
    // ----------------------------------------------------------------
    applySearch(): void {
        const q = this.searchQuery.trim().toLowerCase();
        const baseFolders = this.allFolders.filter(f => f.parentId === this.currentFolderId);
        const baseFiles = this.allFiles.filter(f => f.folderId === this.currentFolderId);

        if (!q) { this.filteredFolders = baseFolders; this.filteredFiles = baseFiles; return; }

        this.filteredFolders = baseFolders.filter(f => f.name.toLowerCase().includes(q));
        this.filteredFiles = baseFiles.filter(f =>
            f.name.toLowerCase().includes(q) ||
            f.type.toLowerCase().includes(q) ||
            f.brand.toLowerCase().includes(q)
        );
    }

    // ----------------------------------------------------------------
    // File actions
    // ----------------------------------------------------------------
    selectFile(file: FileItem): void {
        this.selectedFile = this.selectedFile?.id === file.id ? null : file;
    }

    toggleFolderFav(folder: FolderItem): void {
        folder.favorite = !folder.favorite;
        this.message.success(folder.favorite ? `"${folder.name}" agregado a favoritos` : `"${folder.name}" eliminado de favoritos`);
    }

    toggleFileFav(file: FileItem): void {
        file.favorite = !file.favorite;
        if (this.selectedFile?.id === file.id) this.selectedFile = { ...file };
        this.message.success(file.favorite ? `"${file.name}" agregado a favoritos` : `"${file.name}" eliminado de favoritos`);
    }

    downloadFile(file: FileItem): void {
        if (file.url) {
            const a = document.createElement('a');
            a.href = file.url; a.download = file.name; a.click();
        } else {
            this.message.info(`Descargando "${file.name}"...`);
        }
    }

    shareFile(file: FileItem): void {
        this.message.info(`Enlace de "${file.name}" copiado al portapapeles`);
    }

    // ----------------------------------------------------------------
    // UI helpers
    // ----------------------------------------------------------------
    getFileIcon(type: string): string {
        const map: Record<string, string> = {
            png: '🖼️', jpg: '🖼️', jpeg: '🖼️', svg: '🖼️', gif: '🖼️', webp: '🖼️',
            mp4: '🎬', mov: '🎬', avi: '🎬', pdf: '📄',
            ai: '🎨', psd: '🎨', eps: '🎨',
            zip: '🗜️', rar: '🗜️',
            xlsx: '📊', xls: '📊', docx: '📝', doc: '📝', pptx: '📽️',
        };
        return map[type?.toLowerCase()] || '📎';
    }

    getBrandStyle(brand: string): string {
        const styles: Record<string, string> = {
            NUPEC: 'background:#EFF6FF;color:#1E4FC2',
            NUCAN: 'background:#F0FDF4;color:#15803D',
            GALOPE: 'background:#FFF7ED;color:#C2410C',
            'ÓPTIMO': 'background:#FAF5FF;color:#7E22CE',
            OPTIMO: 'background:#FAF5FF;color:#7E22CE',
        };
        return styles[brand?.toUpperCase()] || 'background:#F1F5F9;color:#475569';
    }
}