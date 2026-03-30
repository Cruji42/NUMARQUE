import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { EndPointFilesService } from 'src/app/core/apis/end-point-files.service';

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
    nodeId?: number;
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
const PETFOOD_CATEGORIES: CategoryCard[] = [];

const PECUARIO_CATEGORIES: CategoryCard[] = [];

const INSTITUCIONAL_CATEGORIES: CategoryCard[] = [];

interface DepartmentItem {
    id: number;
    name: string;
}

interface SubcategoryItem {
    id?: number;
    name?: string;
    title?: string;
    key?: string;
    description?: string;
    icon_url?: string | null;
}

interface DepartmentEntityItem {
    id: number;
    name: string;
    logo?: string | null;
    parent_entity_id: number | null;
}

interface DepartmentHierarchyResponse {
    department_id: number;
    entities: DepartmentEntityItem[];
    subcategories: SubcategoryItem[];
}

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
    activeSubcategory = '';

    categoryCards: CategoryCard[] = [];
    departments: DepartmentItem[] = [];
    departmentEntities: DepartmentEntityItem[] = [];
    currentEntityId: number | null = null;
    currentDepartmentSubcategories: SubcategoryItem[] = [];

    // File manager state
    searchQuery = '';
    selectedFile: FileItem | null = null;
    currentFolderId: number | null = null;
    breadcrumbs: BreadcrumbItem[] = [];
    filteredFolders: FolderItem[] = [];
    filteredFiles: FileItem[] = [];

    // Folders dinámicos desde API (entities por departamento/marca)
    allFolders: FolderItem[] = [];

    allFiles: FileItem[] = [
        // { id: 1, name: 'Adulto_hero.png', type: 'png', size: '4.2 MB', uploaded_at: '2026-03-10', uploaded_by: 'Mario_', brand: 'NUPEC', category: 'ATL', downloads: 23, favorite: false, folderId: 20 },
        // { id: 2, name: 'Spot_TV_30s.mp4', type: 'mp4', size: '84 MB', uploaded_at: '2026-03-08', uploaded_by: 'Mario_', brand: 'NUPEC', category: 'ATL', downloads: 11, favorite: true, folderId: 20 },
        // { id: 3, name: 'Brief_campana_Q2.pdf', type: 'pdf', size: '1.8 MB', uploaded_at: '2026-03-05', uploaded_by: 'Edgar Alejandro', brand: 'NUPEC', category: 'ATL', downloads: 45, favorite: false, folderId: 20 },
        // { id: 4, name: 'Banner_web_728x90.png', type: 'png', size: '220 KB', uploaded_at: '2026-03-01', uploaded_by: 'Mario_', brand: 'NUPEC', category: 'DIGITAL', downloads: 30, favorite: false, folderId: 21 },
        // { id: 5, name: 'Guia_uso_logo.ai', type: 'ai', size: '12 MB', uploaded_at: '2026-02-20', uploaded_by: 'Edgar Alejandro', brand: 'NUPEC', category: 'ATL', downloads: 7, favorite: false, folderId: 10 },
    ];

    constructor(
        private message: NzMessageService,
        private route: ActivatedRoute,
        private router: Router,
        private endPointFilesService: EndPointFilesService
    ) { }

    ngOnInit(): void {
        this.route.queryParamMap.subscribe(params => {
            this.activeBrand = params.get('brand') || '';
            this.activeSection = params.get('section') || '';
            this.activeSubcategory = params.get('subcategory') || '';

            // Siempre mostrar cards de categorías/subcategorías en esta vista.
            // El file manager se abre solo cuando se navega explícitamente al flujo de archivos.
            this.enterCategoryMode();
        });
    }

    // ----------------------------------------------------------------
    // Mode switching
    // ----------------------------------------------------------------
    private enterCategoryMode(): void {
        this.viewMode = 'categories';
        this.currentEntityId = null;
        this.breadcrumbs = [
            { label: this.activeBrand, folderId: null },
            ...(this.activeSection ? [{ label: this.activeSection, folderId: null }] : []),
            ...(this.activeSubcategory ? [{ label: this.activeSubcategory, folderId: null }] : []),
        ];
        this.loadCategoriesFromDepartmentHierarchy();
    }

    private loadCategoriesFromDepartmentHierarchy(): void {
        const fallback = this.getFallbackCategoriesByBrand(this.activeBrand);
        const departmentId = this.getDepartmentIdByBrand(this.activeBrand);

        if (!departmentId) {
            this.categoryCards = fallback;
            this.allFolders = [];
            return;
        }

        this.endPointFilesService.getSubcategoriesByDepartment(departmentId).subscribe({
            next: (resp: DepartmentHierarchyResponse) => {
                const entities = Array.isArray(resp?.entities) ? resp.entities : [];
                const subcategories = Array.isArray(resp?.subcategories) ? resp.subcategories : [];
                this.departmentEntities = entities;
                this.currentDepartmentSubcategories = subcategories;
                this.allFolders = this.mapEntitiesToFolders(entities);

                const brandEntity = this.findEntityByName(entities, this.activeBrand);

                // Caso base solicitado:
                // /pages/category-view?brand=NUPEC  => mostrar cards de categorías (subcategories)
                // aunque no exista entity "NUPEC" en este endpoint.
                if (!this.activeSection && !this.activeSubcategory) {
                    this.categoryCards = this.mapSubcategoriesToCards(subcategories);
                    if (!this.categoryCards.length) {
                        this.categoryCards = fallback;
                    }
                    return;
                }

                if (!brandEntity) {
                    this.categoryCards = this.mapSubcategoriesToCards(subcategories);
                    if (!this.categoryCards.length) {
                        this.categoryCards = fallback;
                    }
                    return;
                }

                this.currentEntityId = brandEntity.id;

                // Soporta deep-link:
                // /pages/category-view?brand=Aves&section=NUPIO&subcategory=EVENTOS
                // debe mostrar cards de subcategorías (no entrar a file manager).
                const sectionEntity = this.activeSection
                    ? this.findEntityByName(entities, this.activeSection)
                    : null;

                if (sectionEntity) {
                    this.currentEntityId = sectionEntity.id;
                    this.categoryCards = this.mapSubcategoriesToCards(subcategories);
                    return;
                }

                this.categoryCards = this.buildCardsForEntityLevel(brandEntity.id, entities, subcategories);
            },
            error: () => {
                this.categoryCards = fallback;
                this.allFolders = [];
                this.currentDepartmentSubcategories = [];
                this.message.warning('No se pudo cargar el menú jerárquico desde API, usando categorías por defecto.');
            }
        });
    }

    private buildCardsForEntityLevel(
        entityId: number,
        entities: DepartmentEntityItem[],
        subcategories: SubcategoryItem[]
    ): CategoryCard[] {
        const children = entities.filter(e => e.parent_entity_id === entityId);

        if (children.length > 0) {
            return children.map((child, index) => this.toEntityCard(child, index));
        }

        return this.mapSubcategoriesToCards(subcategories);
    }

    private toEntityCard(entity: DepartmentEntityItem, index: number): CategoryCard {
        const style = this.getPaletteStyle(index);
        return {
            key: entity.name.toUpperCase(),
            title: entity.name,
            description: `Explorar línea ${entity.name}.`,
            icon: style.icon,
            color: style.color,
            bgColor: style.bgColor,
            nodeId: entity.id
        };
    }

    private mapEntitiesToFolders(entities: DepartmentEntityItem[]): FolderItem[] {
        const childrenCountByParent = entities.reduce<Record<number, number>>((acc, entity) => {
            if (entity.parent_entity_id !== null) {
                const parent = entity.parent_entity_id;
                acc[parent] = (acc[parent] || 0) + 1;
            }
            return acc;
        }, {});

        return entities.map((entity) => ({
            id: entity.id,
            name: entity.name,
            count: childrenCountByParent[entity.id] || 0,
            favorite: false,
            parentId: entity.parent_entity_id,
            brand: entity.parent_entity_id === null ? entity.name : undefined
        }));
    }

    private mapSubcategoriesToCards(items: SubcategoryItem[]): CategoryCard[] {
        return items
            .map((item, index) => {
                const name = (item?.name || item?.title || item?.key || '').trim();
                if (!name) return null;
                const style = this.getPaletteStyle(index);

                return {
                    key: name.toUpperCase(),
                    title: name,
                    description: item?.description || `Materiales de ${name}.`,
                    icon: style.icon,
                    color: style.color,
                    bgColor: style.bgColor
                } as CategoryCard;
            })
            .filter((v): v is CategoryCard => !!v);
    }

    private getPaletteStyle(index: number): { color: string; bgColor: string; icon: string } {
        const palette = [
            { color: '#1E4FC2', bgColor: '#EFF6FF', icon: '📁' },
            { color: '#0891B2', bgColor: '#ECFEFF', icon: '💻' },
            { color: '#059669', bgColor: '#F0FDF4', icon: '📋' },
            { color: '#D97706', bgColor: '#FFFBEB', icon: '🎪' },
            { color: '#7C3AED', bgColor: '#F5F3FF', icon: '📢' },
        ];
        return palette[index % palette.length];
    }

    private findEntityByName(entities: DepartmentEntityItem[], name: string): DepartmentEntityItem | null {
        const normalized = this.normalizeText(name);
        return entities.find(e => this.normalizeText(e.name) === normalized) || null;
    }

    private normalizeText(value: string): string {
        return (value || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    }

    private getDepartmentIdByBrand(brand: string): number | null {
        const key = (brand || '').toUpperCase();

        const petfoodBrands = ['NUPEC', 'NUCAN', 'NUCAT', 'NUFIT', 'ÓPTIMO SELECTO', 'ÓPTIMO FELINO'];
        const pecuarioBrands = ['AVES', 'CAMARÓN', 'CERDOS', 'EQUINOS', 'GALLOS', 'PECES', 'RUMIANTES', 'FEED SOLUTIONS'];
        const institucionalBrands = ['NUTEC', 'INCASARA'];

        if (petfoodBrands.includes(key)) return 1;
        if (pecuarioBrands.includes(key)) return 2;
        if (institucionalBrands.includes(key)) return 3;

        return null;
    }

    private matchDepartmentFromBrand(brand: string, departments: DepartmentItem[]): DepartmentItem | null {
        const key = (brand || '').toUpperCase();
        const normalized = (v: string) => (v || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        const byMap = this.getDepartmentIdByBrand(brand);
        if (byMap) {
            const foundById = departments.find(d => Number(d.id) === Number(byMap));
            if (foundById) return foundById;
        }

        const nameMap: Record<string, string[]> = {
            PETFOOD: ['NUPEC', 'NUCAN', 'NUCAT', 'NUFIT', 'OPTIMO SELECTO', 'OPTIMO FELINO'],
            PECUARIO: ['AVES', 'CAMARON', 'CERDOS', 'EQUINOS', 'GALLOS', 'PECES', 'RUMIANTES', 'FEED SOLUTIONS'],
            INSTITUCIONAL: ['NUTEC', 'INCASARA']
        };

        return departments.find(dep => {
            const depName = normalized(dep.name);
            if (!nameMap[depName]) return false;
            return nameMap[depName].includes(normalized(key));
        }) || null;
    }

    private getFallbackCategoriesByBrand(brand: string): CategoryCard[] {
        const key = (brand || '').toUpperCase();

        const petfoodBrands = ['NUPEC', 'NUCAN', 'NUCAT', 'NUFIT', 'ÓPTIMO SELECTO', 'ÓPTIMO FELINO'];
        const pecuarioBrands = ['AVES', 'CAMARÓN', 'CERDOS', 'EQUINOS', 'GALLOS', 'PECES', 'RUMIANTES', 'FEED SOLUTIONS'];
        const institucionalBrands = ['NUTEC', 'INCASARA'];

        if (petfoodBrands.includes(key)) return PETFOOD_CATEGORIES;
        if (pecuarioBrands.includes(key)) return PECUARIO_CATEGORIES;
        if (institucionalBrands.includes(key)) return INSTITUCIONAL_CATEGORIES;
        return PETFOOD_CATEGORIES;
    }

    private enterFileManager(): void {
        this.viewMode = 'files';
        this.currentFolderId = null;
        this.searchQuery = '';
        this.selectedFile = null;
        this.breadcrumbs = [
            { label: this.activeBrand, folderId: null },
            ...(this.activeSection ? [{ label: this.activeSection, folderId: null }] : []),
            ...(this.activeSubcategory ? [{ label: this.activeSubcategory, folderId: null }] : []),
        ];
        this.loadCurrentLevel();
    }

    openCategory(card: CategoryCard): void {
        if (this.viewMode === 'categories' && card.nodeId) {
            const nextEntityId = card.nodeId;
            const children = this.departmentEntities.filter(e => e.parent_entity_id === nextEntityId);

            this.currentEntityId = nextEntityId;
            this.breadcrumbs = [...this.breadcrumbs, { label: card.title, folderId: null }];

            if (children.length > 0) {
                this.categoryCards = children.map((child, index) => this.toEntityCard(child, index));
                return;
            }

            // Si no hay más entidades hijas, mostrar subcategorías del departamento completo
            const subcategoryCards = this.mapSubcategoriesToCards(this.currentDepartmentSubcategories);
            if (subcategoryCards.length > 0) {
                this.categoryCards = subcategoryCards;
                return;
            }
        }

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                brand: this.activeBrand,
                section: this.activeSection || card.title,
                subcategory: card.key
            },
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
        if (this.viewMode === 'files') {
            if (index === 1) {
                // Volver al nivel de sección (sin subcategoría)
                this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams: { brand: this.activeBrand, section: this.activeSection },
                });
                return;
            }

            if (index === 2) {
                // Volver a la raíz del file manager (subcategoría sin subfolder)
                this.currentFolderId = null;
                this.breadcrumbs = this.breadcrumbs.slice(0, 3);
                this.searchQuery = '';
                this.loadCurrentLevel();
                return;
            }
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