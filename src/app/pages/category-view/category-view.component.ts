import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EndPointFilesService } from '../../core/apis/end-point-files.service';
import { SideNavMenuService, ApiDepartment } from '../../core/service/sidenav.service'; // ajusta la ruta según tu proyecto

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

interface DepartmentEntityItem {
    id: number;
    name: string;
    logo?: string | null;
    parent_entity_id: number | null;
}

interface SubcategoryItem {
    id?: number;
    name?: string;
    description?: string;
    icon_url?: string | null;
    department_id?: number;
    created_at?: string;
}

// Respuesta real del API: { status, message, data: SubcategoryItem[] }
interface SubcategoriesApiResponse {
    status: number;
    message: string;
    data: SubcategoryItem[];
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
export class CategoryViewComponent implements OnInit, OnDestroy {

    private destroy$ = new Subject<void>();

    viewMode: 'categories' | 'files' = 'categories';
    fileViewMode: 'grid' | 'list' = 'grid';

    activeBrand = '';
    activeSection = '';
    activeSubcategory = '';

    categoryCards: CategoryCard[] = [];
    departmentEntities: DepartmentEntityItem[] = [];
    currentEntityId: number | null = null;
    currentDepartmentSubcategories: SubcategoryItem[] = [];

    // Departamentos cargados desde el API del menú (se usan para resolver brand → department_id)
    private menuDepartments: ApiDepartment[] = [];

    // File manager state
    searchQuery = '';
    selectedFile: FileItem | null = null;
    currentFolderId: number | null = null;
    breadcrumbs: BreadcrumbItem[] = [];
    filteredFolders: FolderItem[] = [];
    filteredFiles: FileItem[] = [];
    allFolders: FolderItem[] = [];
    allFiles: FileItem[] = [];

    constructor(
        private message: NzMessageService,
        private route: ActivatedRoute,
        private router: Router,
        private endPointFilesService: EndPointFilesService,
        private sideNavMenuService: SideNavMenuService
    ) { }

    ngOnInit(): void {
        // combineLatest emite cada vez que cambia cualquiera de los dos streams.
        // Como menu$ tiene shareReplay(1), ya tiene valor en caché cuando
        // queryParamMap emite — así no hay race condition.
        combineLatest([
            this.sideNavMenuService.getDepartments(),
            this.route.queryParamMap
        ])
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: ([departments, params]) => {
                this.menuDepartments   = departments;
                this.activeBrand       = params.get('brand')       || '';
                this.activeSection     = params.get('section')     || '';
                this.activeSubcategory = params.get('subcategory') || '';
                this.enterCategoryMode();
            },
            error: () => {
                this.message.warning('No se pudo cargar la estructura del menú.');
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ----------------------------------------------------------------
    // Mode switching
    // ----------------------------------------------------------------
    private enterCategoryMode(): void {
        this.viewMode = 'categories';
        this.currentEntityId = null;
        this.breadcrumbs = [
            { label: this.activeBrand, folderId: null },
            ...(this.activeSection    ? [{ label: this.activeSection,    folderId: null }] : []),
            ...(this.activeSubcategory ? [{ label: this.activeSubcategory, folderId: null }] : []),
        ];
        this.loadCategoriesFromDepartmentHierarchy();
    }

    private loadCategoriesFromDepartmentHierarchy(): void {
        const departmentId = this.getDepartmentIdByBrand(this.activeBrand);

        if (!departmentId) {
            this.categoryCards = [];
            this.allFolders    = [];
            return;
        }

        // Tomar las entities del menú cacheado para este departamento
        const deptFromMenu = this.menuDepartments.find(d => d.department_id === departmentId);
        const entities: DepartmentEntityItem[] = deptFromMenu
            ? deptFromMenu.entities.map(e => ({
                id:               e.id,
                name:             e.name,
                logo:             e.logo,
                parent_entity_id: e.parent_entity_id
            }))
            : [];

        this.departmentEntities = entities;
        this.allFolders         = this.mapEntitiesToFolders(entities);

        // Llamar al endpoint de subcategorías del departamento
        this.endPointFilesService.getSubcategoriesByDepartment(departmentId).subscribe({
            next: (resp: SubcategoriesApiResponse) => {
                const subcategories: SubcategoryItem[] = Array.isArray(resp?.data) ? resp.data : [];
                this.currentDepartmentSubcategories = subcategories;

                // Sin section ni subcategory → mostrar cards de subcategorías directamente
                if (!this.activeSection && !this.activeSubcategory) {
                    this.categoryCards = this.mapSubcategoriesToCards(subcategories);
                    return;
                }

                const brandEntity = this.findEntityByName(entities, this.activeBrand);

                if (!brandEntity) {
                    // brand no es una entity (ej: NUPEC en PetFood) → mostrar subcategorías
                    this.categoryCards = this.mapSubcategoriesToCards(subcategories);
                    return;
                }

                this.currentEntityId = brandEntity.id;

                // Deep-link: brand=Aves&section=NUPIO → mostrar subcategorías de esa sub-entidad
                const sectionEntity = this.activeSection
                    ? this.findEntityByName(entities, this.activeSection)
                    : null;

                if (sectionEntity) {
                    this.currentEntityId = sectionEntity.id;
                    this.categoryCards   = this.mapSubcategoriesToCards(subcategories);
                    return;
                }

                this.categoryCards = this.buildCardsForEntityLevel(brandEntity.id, entities, subcategories);
            },
            error: () => {
                this.categoryCards                  = [];
                this.currentDepartmentSubcategories = [];
                this.message.warning('No se pudieron cargar las categorías.');
            }
        });
    }

    // ----------------------------------------------------------------
    // Resolución dinámica brand → department_id
    // Busca la entidad por nombre dentro de los departamentos del menú
    // (ya no hay listas hardcodeadas)
    // ----------------------------------------------------------------
    private getDepartmentIdByBrand(brand: string): number | null {
        if (!brand || !this.menuDepartments.length) return null;

        const normalized = this.normalizeText(brand);

        const found = this.menuDepartments.find(dept =>
            dept.entities.some(entity => this.normalizeText(entity.name) === normalized)
        );

        return found ? found.department_id : null;
    }

    // ----------------------------------------------------------------
    // Card builders
    // ----------------------------------------------------------------
    private buildCardsForEntityLevel(
        entityId: number,
        entities: DepartmentEntityItem[],
        subcategories: SubcategoryItem[]
    ): CategoryCard[] {
        const children = entities.filter(e => e.parent_entity_id === entityId);
        return children.length > 0
            ? children.map((child, index) => this.toEntityCard(child, index))
            : this.mapSubcategoriesToCards(subcategories);
    }

    private toEntityCard(entity: DepartmentEntityItem, index: number): CategoryCard {
        const style = this.getPaletteStyle(index);
        return {
            key:         entity.name.toUpperCase(),
            title:       entity.name,
            description: `Explorar línea ${entity.name}.`,
            icon:        style.icon,
            color:       style.color,
            bgColor:     style.bgColor,
            nodeId:      entity.id
        };
    }

    private mapEntitiesToFolders(entities: DepartmentEntityItem[]): FolderItem[] {
        const childrenCountByParent = entities.reduce<Record<number, number>>((acc, entity) => {
            if (entity.parent_entity_id !== null) {
                acc[entity.parent_entity_id] = (acc[entity.parent_entity_id] || 0) + 1;
            }
            return acc;
        }, {});

        return entities.map(entity => ({
            id:       entity.id,
            name:     entity.name,
            count:    childrenCountByParent[entity.id] || 0,
            favorite: false,
            parentId: entity.parent_entity_id,
            brand:    entity.parent_entity_id === null ? entity.name : undefined
        }));
    }

    private mapSubcategoriesToCards(items: SubcategoryItem[]): CategoryCard[] {
        return items
            .map((item, index) => {
                const name = (item?.name || '').trim();
                if (!name) return null;
                const style = this.getPaletteStyle(index);
                return {
                    key:         name.toUpperCase(),
                    title:       name,
                    description: item?.description || `Materiales de ${name}.`,
                    icon:        style.icon,
                    color:       style.color,
                    bgColor:     style.bgColor
                } as CategoryCard;
            })
            .filter((v): v is CategoryCard => !!v);
    }

    openCategory(card: CategoryCard): void {
        if (this.viewMode === 'categories' && card.nodeId) {
            const children = this.departmentEntities.filter(e => e.parent_entity_id === card.nodeId);
            this.currentEntityId = card.nodeId!;
            this.breadcrumbs = [...this.breadcrumbs, { label: card.title, folderId: null }];

            if (children.length > 0) {
                this.categoryCards = children.map((child, index) => this.toEntityCard(child, index));
                return;
            }

            const subcategoryCards = this.mapSubcategoriesToCards(this.currentDepartmentSubcategories);
            if (subcategoryCards.length > 0) {
                this.categoryCards = subcategoryCards;
                return;
            }
        }

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                brand:       this.activeBrand,
                section:     this.activeSection || card.title,
                subcategory: card.key
            },
        });
    }

    // ----------------------------------------------------------------
    // File manager navigation
    // ----------------------------------------------------------------
    private enterFileManager(): void {
        this.viewMode = 'files';
        this.currentFolderId = null;
        this.searchQuery = '';
        this.selectedFile = null;
        this.breadcrumbs = [
            { label: this.activeBrand, folderId: null },
            ...(this.activeSection    ? [{ label: this.activeSection,    folderId: null }] : []),
            ...(this.activeSubcategory ? [{ label: this.activeSubcategory, folderId: null }] : []),
        ];
        this.loadCurrentLevel();
    }

    loadCurrentLevel(): void {
        this.selectedFile = null;

        let folders = this.allFolders.filter(f => f.parentId === this.currentFolderId);
        let files   = this.allFiles.filter(f => f.folderId === this.currentFolderId);

        if (this.currentFolderId === null) {
            if (this.activeBrand) {
                folders = folders.filter(f => f.brand?.toUpperCase() === this.activeBrand.toUpperCase());
                files   = files.filter(f => f.brand?.toUpperCase() === this.activeBrand.toUpperCase());
            }
            if (this.activeSection) {
                files = files.filter(f => f.category?.toUpperCase() === this.activeSection.toUpperCase());
            }
        }

        this.filteredFolders = folders;
        this.filteredFiles   = files;
    }

    openFolder(folder: FolderItem): void {
        this.currentFolderId = folder.id;
        this.breadcrumbs = [...this.breadcrumbs, { label: folder.name, folderId: folder.id }];
        this.searchQuery = '';
        this.loadCurrentLevel();
    }

    navigateToBreadcrumb(crumb: BreadcrumbItem, index: number): void {
        if (index === 0) {
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { brand: this.activeBrand },
            });
            return;
        }
        if (this.viewMode === 'files') {
            if (index === 1) {
                this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams: { brand: this.activeBrand, section: this.activeSection },
                });
                return;
            }
            if (index === 2) {
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
        const baseFiles   = this.allFiles.filter(f => f.folderId === this.currentFolderId);

        if (!q) { this.filteredFolders = baseFolders; this.filteredFiles = baseFiles; return; }

        this.filteredFolders = baseFolders.filter(f => f.name.toLowerCase().includes(q));
        this.filteredFiles   = baseFiles.filter(f =>
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
            NUPEC:    'background:#EFF6FF;color:#1E4FC2',
            NUCAN:    'background:#F0FDF4;color:#15803D',
            GALOPE:   'background:#FFF7ED;color:#C2410C',
            'ÓPTIMO': 'background:#FAF5FF;color:#7E22CE',
            OPTIMO:   'background:#FAF5FF;color:#7E22CE',
        };
        return styles[brand?.toUpperCase()] || 'background:#F1F5F9;color:#475569';
    }
}