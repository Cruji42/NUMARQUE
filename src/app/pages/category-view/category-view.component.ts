import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, ViewContainerRef, ElementRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EndPointFilesService } from '../../core/apis/end-point-files.service';
import { SideNavMenuService, ApiDepartment } from '../../core/service/sidenav.service';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FilesService } from 'src/app/core/service/files.service';
import { NzContextMenuService, NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown';
import { EndPointUsersService } from '../../core/apis/end-point-users.service';
import { UsersService } from 'src/app/core/service/users.service';

// ----------------------------------------------------------------
// Interfaces
// ----------------------------------------------------------------
export interface CategoryCard {
    key: string;
    title: string;
    description: string;
    logo?: string | null;
    icon: string;
    color: string;
    bgColor: string;
    nodeId?: number;
    id?: number;
}

export interface FolderItem {
    id: number;
    name: string;
    count: number;
    favorite: boolean;
    parentId: number | null;
    brand?: string;
    entityId?: number | null;
    subcategoryId?: number | null;
}

export interface FileItem {
    id: number;
    name: string;
    description: string;
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
    s3Key?: string;
}

export interface BreadcrumbItem {
    label: string;
    folderId: number | null;
    crumbType?: 'department' | 'entity' | 'subcategory' | 'folder';
    entityId?: number | null;
    subcategoryId?: number | null;
    departmentId?: number | null;
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

interface SubcategoriesApiResponse {
    status: number;
    message: string;
    data: SubcategoryItem[];
}

interface BrandInfoItem {
    id?: number;
    name?: string;
    brand_name?: string;
    title?: string;
    logo?: string | null;
    logo_url?: string | null;
    description?: string;
    [key: string]: any;
}

interface FolderTreeNode {
    id: number;
    name: string;
    fullPath: string;
    folders: FolderTreeNode[];
    files: FileItem[];
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
    readonly MAX_TAGS = 10;

    private destroy$ = new Subject<void>();

    // viewMode ahora incluye 'favorites'
    viewMode: 'categories' | 'files' | 'favorites' = 'categories';
    fileViewMode: 'grid' | 'list' = 'grid';

    activeBrand = '';
    activeBrandId: number | null = null;
    activeSection = '';
    activeSubcategory = '';
    activeSectionId: number | null = null;
    activeSubcategoryId: number | null = null;
    departmentId: number | null = null;
    pendingSelectContentId: number | null = null;
    pendingOpenFolderId: number | null = null;

    userData: any = null;
    private readonly ROLE_ADMIN = 1;
    private readonly ROLE_HEAD_COMERCIAL = 2;
    private readonly ROLE_PROVEEDOR = 3;

    activeEntityTrail: string[] = [];

    categoryCards: CategoryCard[] = [];
    departmentEntities: DepartmentEntityItem[] = [];
    currentEntityId: number | null = null;
    currentDepartmentSubcategories: SubcategoryItem[] = [];
    brandInfo: BrandInfoItem | null = null;
    modalRef!: NzModalRef;
    uploadMaterialFile: File | null = null;
    uploadMaterialTitle = '';
    uploadMaterialDescription = '';
    uploadMaterialTags: string[] = [];
    uploadMaterialTagInput = '';
    currentBreadcrumbPath = '';

    private menuDepartments: ApiDepartment[] = [];

    // File manager state
    searchQuery = '';
    selectedFile: FileItem | null = null;
    currentFolderId: number | null = null;
    fileManagerFolderTrail: BreadcrumbItem[] = [];
    breadcrumbs: BreadcrumbItem[] = [];
    filteredFolders: FolderItem[] = [];
    filteredFiles: FileItem[] = [];
    allFolders: FolderItem[] = [];
    allFiles: FileItem[] = [];
    private folderTreeRoot: FolderTreeNode | null = null;
    private currentTreePath: string[] = [];

    // ── Favorites state ──────────────────────────────────────────────
    favoritesLoading = false;
    favoritesSearchQuery = '';
    allFavFolders: FolderItem[] = [];
    allFavFiles: FileItem[] = [];
    filteredFavFolders: FolderItem[] = [];
    filteredFavFiles: FileItem[] = [];

    uploadForm!: FormGroup;
    file!: File;
    selectedContextItem: FileItem | FolderItem | null = null;
    selectedContextType: 'file' | 'folder' | null = null;
    renamingFileId: number | null = null;
    renamingFileName = '';
    previewModalUrl: SafeResourceUrl | null = null;
    previewModalVideoUrl: SafeUrl | null = null;
    previewModalType: 'pdf' | 'video' | 'image' | null = null;
    previewModalImageUrl: SafeUrl | null = null;
    isUploading = false;

    @ViewChild('tplContent', { static: true }) tplContent!: TemplateRef<any>;
    @ViewChild('tplFooter', { static: true }) tplFooter!: TemplateRef<any>;
    @ViewChild('fileInputRef') fileInputRef?: ElementRef<HTMLInputElement>;
    @ViewChild('previewModalTpl', { static: true }) previewModalTpl!: TemplateRef<any>;

    constructor(
        private message: NzMessageService,
        private route: ActivatedRoute,
        private router: Router,
        private endPointFilesService: EndPointFilesService,
        private sideNavMenuService: SideNavMenuService,
        private modal: NzModalService,
        private viewContainerRef: ViewContainerRef,
        private fb: FormBuilder,
        private service: FilesService,
        private nzContextMenuService: NzContextMenuService,
        private endPointUsersService: EndPointUsersService,
        private sanitizer: DomSanitizer,
        private usersService: UsersService,
    ) { }

    ngOnInit(): void {
        combineLatest([
            this.sideNavMenuService.getDepartments(),
            this.route.queryParamMap,
            this.usersService.getUser()
        ])
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ([departments, params, user]) => {
                    this.userData = user;
                    this.menuDepartments = departments;
                    this.activeBrandId = this.parseNumberParam(params.get('brandId'));
                    this.departmentId = this.parseNumberParam(params.get('departmentId'));
                    this.activeSubcategoryId = this.parseNumberParam(params.get('subcategoryId'));
                    this.activeBrand = params.get('brand') || '';
                    this.activeSubcategory = params.get('subcategory') || '';
                    const contentId = this.parseNumberParam(params.get('contentId'));
                    if (contentId) {
                        this.pendingSelectContentId = contentId;
                    }

                    const folderId = this.parseNumberParam(params.get('folderId'));
                    if (folderId) {
                        this.pendingOpenFolderId = folderId;
                    }
                    this.activeEntityTrail = [];

                    // ── Activar modo favoritos desde query param ─────────────
                    if (params.get('favorites') === 'true') {
                        this.enterFavoritesMode();
                        return;
                    }

                    if (!this.canAccessBrand(this.activeBrandId)) {
                        this.message.warning('No tienes acceso a esta marca.');
                        this.router.navigate(['/welcome']);
                        return;
                    }

                    if (this.departmentId) {
                        this.enterDepartmentMode();
                    } else if (this.activeBrandId) {
                        this.loadBrandInfo(this.activeBrandId, () => {
                            if (this.activeSubcategoryId) {
                                this.enterFileManager();
                            } else {
                                this.enterCategoryMode();
                            }
                        });
                    } else {
                        this.brandInfo = null;
                        if (this.activeSubcategoryId) {
                            this.enterFileManager();
                        } else {
                            this.enterCategoryMode();
                        }
                    }

                    this.ensureSubcategoryContextForBreadcrumb();
                },
                error: () => {
                    this.message.warning('No se pudo cargar la estructura del menú.');
                }
            });

        this.uploadForm = this.fb.group({
            type: ['file'],
            title: ['', Validators.required],
            description: [''],
            tags: [[]]
        });
    }

    // ----------------------------------------------------------------
    // Control de acceso por rol y marcas
    // ----------------------------------------------------------------
    canAccessBrand(brandId: number | null): boolean {
        if (!this.userData || !brandId) return true;

        const roleId: number = this.userData.role_id;
        if (roleId === this.ROLE_ADMIN || roleId === this.ROLE_HEAD_COMERCIAL) return true;

        if (roleId === this.ROLE_PROVEEDOR) {
            const brands: any[] = this.userData.brands ?? [];
            return brands.some((b: any) => Number(b?.id) === brandId);
        }

        return false;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ================================================================
    // FAVORITES MODE
    // ================================================================

    /**
     * Activa la vista de favoritos. Se puede llamar desde el sidenav
     * navegando a la misma ruta con ?view=favorites, o directamente.
     */
    enterFavoritesMode(): void {
        this.viewMode = 'favorites';
        this.selectedFile = null;
        this.favoritesSearchQuery = '';
        this.breadcrumbs = [{ label: '⭐ Favoritos', folderId: null }];
        this.loadFavorites();
    }

    private loadFavorites(): void {
        this.favoritesLoading = true;
        this.allFavFolders = [];
        this.allFavFiles = [];
        this.filteredFavFolders = [];
        this.filteredFavFiles = [];

        this.endPointFilesService.getFavorites().subscribe({
            next: (resp: any) => {
                const items: any[] = Array.isArray(resp?.data)
                    ? resp.data
                    : Array.isArray(resp?.items)
                        ? resp.items
                        : Array.isArray(resp)
                            ? resp
                            : [];

                // Separar carpetas de archivos por file_type === 'folder'
                this.allFavFolders = items
                    .filter((item: any) => (item?.file_type || '').toLowerCase() === 'folder')
                    .map((item: any): FolderItem => ({
                        id: Number(item.id),
                        name: (item.title || item.name || 'Carpeta').toString(),
                        count: 0,
                        favorite: true,
                        parentId: item.folder_id ?? null,
                        entityId: item.entity_id ?? null,      // ← agrega
                        subcategoryId: item.subcategory_id ?? null, // ← agrega
                    }));

                this.allFavFiles = items
                    .filter((item: any) => (item?.file_type || '').toLowerCase() !== 'folder')
                    .map((item: any) => this.toFavFileItem(item));

                this.filteredFavFolders = [...this.allFavFolders];
                this.filteredFavFiles = [...this.allFavFiles];

                this.loadImagePreviews(this.filteredFavFiles);
                this.favoritesLoading = false;
            },
            error: () => {
                this.message.warning('No se pudieron cargar los favoritos.');
                this.favoritesLoading = false;
            }
        });
    }
    private toFavFileItem(item: any): FileItem {
        const rawType = (
            item?.file_type || item?.extension || item?.type ||
            item?.mime_type || item?.mimetype || ''
        ).toString().trim();

        const type = rawType.includes('/')
            ? rawType.split('/').pop()!.toLowerCase()
            : rawType.replace('.', '').toLowerCase() || 'file';

        const size = item?.file_size_bytes
            ? (item.file_size_bytes / (1024 * 1024)).toFixed(2) + ' MB'
            : item?.file_size
                ? item.file_size.toString()
                : '—';

        // Nombre: intenta todos los campos comunes
        const name = (
            item?.title || item?.name || item?.file_name ||
            item?.filename || item?.hidden_file || 'Archivo'
        ).toString().trim();

        // Marca: puede venir del item o del contexto activo
        const brand = (
            item?.brand || item?.brand_name ||
            item?.entity?.name || item?.entity_name ||
            this.getBrandDisplayName() || this.activeBrand || 'N/A'
        ).toString();

        // Categoría
        const category = (
            item?.category || item?.subcategory ||
            item?.subcategory_name || this.activeSubcategory || '—'
        ).toString();

        return {
            id: Number(item?.id) || Math.floor(Math.random() * 1e9),
            name,
            description: (item?.description || '').toString(),
            type,
            size,
            uploaded_at: (item?.uploaded_at || item?.created_at || new Date().toISOString()).toString(),
            uploaded_by: (item?.uploaded_by || item?.user_name || item?.owner || 'N/A').toString(),
            brand,
            category,
            downloads: Number(item?.downloads || item?.download_count || 0),
            favorite: true,
            folderId: item?.folder_id ?? null,
            url: (item?.url || item?.file_url || item?.download_url || item?.preview_url || '').toString() || undefined,
            s3Key: (item?.s3_key || item?.key || '').toString() || undefined,
        };
    }

    applyFavoritesSearch(): void {
        const q = this.favoritesSearchQuery.trim().toLowerCase();
        if (!q) {
            this.filteredFavFolders = [...this.allFavFolders];
            this.filteredFavFiles = [...this.allFavFiles];
            return;
        }
        this.filteredFavFolders = this.allFavFolders.filter(f =>
            f.name.toLowerCase().includes(q)
        );
        this.filteredFavFiles = this.allFavFiles.filter(f =>
            f.name.toLowerCase().includes(q) ||
            f.type.toLowerCase().includes(q) ||
            f.brand.toLowerCase().includes(q)
        );
    }

    openFavoriteFolder(folder: FolderItem): void {
        const queryParams: any = {
            brandId: folder.entityId || this.activeBrandId,
            subcategoryId: folder.subcategoryId,
            folderId: folder.id,   // ← para abrir la carpeta directo
        };
        this.router.navigate(['/pages/category-view'], { queryParams });
    }

    removeFolderFromFavorites(folder: FolderItem): void {
        this.endPointFilesService.toggleFavorite(folder.id).subscribe({
            next: () => {
                this.allFavFolders = this.allFavFolders.filter(f => f.id !== folder.id);
                this.applyFavoritesSearch();
                // Sincroniza estado en la vista de files
                const inAll = this.allFolders.find(f => f.id === folder.id);
                if (inAll) inAll.favorite = false;
                this.message.success(`"${folder.name}" eliminado de favoritos`);
            },
            error: () => this.message.error('No se pudo actualizar favoritos.')
        });
    }

    removeFileFromFavorites(file: FileItem): void {
        this.endPointFilesService.toggleFavorite(file.id).subscribe({
            next: () => {
                this.allFavFiles = this.allFavFiles.filter(f => f.id !== file.id);
                this.applyFavoritesSearch();
                const inAll = this.allFiles.find(f => f.id === file.id);
                if (inAll) inAll.favorite = false;
                if (this.selectedFile?.id === file.id) this.selectedFile = null;
                this.message.success(`"${file.name}" eliminado de favoritos`);
            },
            error: () => this.message.error('No se pudo actualizar favoritos.')
        });
    }

    // ── Alias usado desde el template de favoritos ───────────────────
    removeFavFile(file: FileItem): void {
        this.removeFileFromFavorites(file);
    }

    removeFavFolder(folder: FolderItem): void {
        this.endPointFilesService.toggleFavorite(folder.id).subscribe({
            next: () => {
                this.allFavFolders = this.allFavFolders.filter(f => f.id !== folder.id);
                this.filteredFavFolders = this.filteredFavFolders.filter(f => f.id !== folder.id);
                const inAll = this.allFolders.find(f => f.id === folder.id);
                if (inAll) inAll.favorite = false;
                this.message.success(`"${folder.name}" eliminado de favoritos`);
            },
            error: () => this.message.error('No se pudo actualizar favoritos.')
        });
    }
    // ================================================================
    // MODE SWITCHING
    // ================================================================
    private enterCategoryMode(): void {
        this.viewMode = 'categories';
        this.currentEntityId = null;
        const departmentLabel = this.getCurrentDepartmentName();
        const departmentId = this.getCurrentDepartmentId();

        this.activeEntityTrail = this.buildEntityTrail(this.activeBrandId);
        const entityCrumbItems = this.buildEntityCrumbItems(this.activeBrandId);

        this.breadcrumbs = [
            ...(departmentLabel ? [{ label: departmentLabel, folderId: null, crumbType: 'department' as const, departmentId }] : []),
            ...entityCrumbItems,
        ];
        this.loadCategoriesFromDepartmentHierarchy();
    }

    private loadCategoriesFromDepartmentHierarchy(): void {
        const departmentId = this.getCurrentDepartmentId();

        if (!departmentId) {
            this.categoryCards = [];
            this.allFolders = [];
            return;
        }

        const deptFromMenu = this.menuDepartments.find(d => d.department_id === departmentId);
        const entities: DepartmentEntityItem[] = deptFromMenu
            ? deptFromMenu.entities.map(e => ({
                id: e.id,
                name: e.name,
                logo: e.logo,
                parent_entity_id: e.parent_entity_id
            }))
            : [];

        this.departmentEntities = entities;
        this.allFolders = this.mapEntitiesToFolders(entities);

        this.endPointFilesService.getSubcategoriesByDepartment(departmentId).subscribe({
            next: (resp: SubcategoriesApiResponse) => {
                const subcategories: SubcategoryItem[] = Array.isArray(resp?.data) ? resp.data : [];
                this.currentDepartmentSubcategories = subcategories;

                const brandEntity = this.activeBrandId
                    ? entities.find(e => e.id === this.activeBrandId) || null
                    : this.findEntityByName(entities, this.activeBrand);

                if (!this.activeSection && !this.activeSubcategory && !this.activeSectionId && !this.activeSubcategoryId) {
                    if (brandEntity) {
                        this.currentEntityId = brandEntity.id;
                        this.categoryCards = this.filterCardsByAccess(this.buildCardsForEntityLevel(brandEntity.id, entities, subcategories));
                    } else {
                        this.categoryCards = this.mapSubcategoriesToCards(subcategories);
                    }
                    return;
                }

                if (!brandEntity) {
                    this.categoryCards = this.mapSubcategoriesToCards(subcategories);
                    return;
                }

                this.currentEntityId = brandEntity.id;

                const sectionEntity = this.activeSectionId
                    ? entities.find(e => e.id === this.activeSectionId) || null
                    : (this.activeSection ? this.findEntityByName(entities, this.activeSection) : null);

                if (sectionEntity) {
                    this.currentEntityId = sectionEntity.id;
                    this.categoryCards = this.mapSubcategoriesToCards(subcategories);
                    return;
                }

                this.categoryCards = this.filterCardsByAccess(this.buildCardsForEntityLevel(brandEntity.id, entities, subcategories));
            },
            error: () => {
                this.categoryCards = [];
                this.currentDepartmentSubcategories = [];
                this.message.warning('No se pudieron cargar las categorías.');
            }
        });
    }

    private getDepartmentIdByBrand(brand: string): number | null {
        if (!brand || !this.menuDepartments.length) return null;
        const normalized = this.normalizeText(brand);
        const found = this.menuDepartments.find(dept =>
            dept.entities.some(entity => this.normalizeText(entity.name) === normalized)
        );
        return found ? found.department_id : null;
    }

    private getCurrentDepartmentId(): number | null {
        if (!this.menuDepartments.length) return null;

        if (this.activeBrandId) {
            const foundByEntityId = this.menuDepartments.find(dept =>
                dept.entities.some(entity => entity.id === this.activeBrandId)
            );
            if (foundByEntityId) return foundByEntityId.department_id;
        }

        return this.getDepartmentIdByBrand(this.activeBrand);
    }

    // ----------------------------------------------------------------
    // Card builders
    // ----------------------------------------------------------------
    private filterCardsByAccess(cards: CategoryCard[]): CategoryCard[] {
        if (!this.userData) return cards;

        const roleId: number = this.userData.role_id;
        if (roleId === this.ROLE_ADMIN || roleId === this.ROLE_HEAD_COMERCIAL) return cards;

        if (roleId === this.ROLE_PROVEEDOR) {
            const assignedIds = new Set<number>(
                (this.userData.brands ?? []).map((b: any) => Number(b?.id))
            );
            return cards.filter(card => {
                if (!card.nodeId) return true;
                return assignedIds.has(card.nodeId);
            });
        }

        return cards;
    }

    private buildCardsForEntityLevel(entityId: number, entities: DepartmentEntityItem[], subcategories: SubcategoryItem[]): CategoryCard[] {
        const children = entities.filter(e => e.parent_entity_id === entityId);
        return children.length > 0
            ? children.map((child, index) => this.toEntityCard(child, index))
            : this.mapSubcategoriesToCards(subcategories);
    }

    private toEntityCard(entity: DepartmentEntityItem, index: number): CategoryCard {
        const style = this.getPaletteStyle(index);
        return {
            key: entity.name.toUpperCase(),
            title: entity.name,
            description: `Explorar línea ${entity.name}.`,
            logo: entity.logo || null,
            icon: style.icon,
            color: style.color,
            bgColor: style.bgColor,
            nodeId: entity.id
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
                const name = (item?.name || '').trim();
                if (!name) return null;
                const style = this.getPaletteStyle(index);
                return {
                    key: name.toUpperCase(),
                    title: name,
                    description: item?.description || `Materiales de ${name}.`,
                    icon: style.icon,
                    color: style.color,
                    bgColor: style.bgColor,
                    id: item?.id
                } as CategoryCard;
            })
            .filter((v): v is CategoryCard => !!v);
    }

    openCategory(card: CategoryCard): void {
        if (this.departmentId && card.nodeId) {
            const children = this.departmentEntities.filter(e => e.parent_entity_id === card.nodeId);

            if (children.length > 0) {
                this.currentEntityId = card.nodeId;
                this.activeEntityTrail = [...this.activeEntityTrail, card.title];
                this.breadcrumbs = [...this.breadcrumbs, {
                    label: card.title, folderId: null, crumbType: 'entity', entityId: card.nodeId
                }];
                this.categoryCards = this.filterCardsByAccess(children.map((child, index) => this.toEntityCard(child, index)));
                return;
            }

            this.router.navigate([], { relativeTo: this.route, queryParams: { brandId: card.nodeId } });
            return;
        }

        if (this.viewMode === 'categories' && card.nodeId) {
            const children = this.departmentEntities.filter(e => e.parent_entity_id === card.nodeId);
            this.currentEntityId = card.nodeId;
            this.activeEntityTrail = [...this.activeEntityTrail, card.title];
            this.breadcrumbs = [...this.breadcrumbs, {
                label: card.title, folderId: null, crumbType: 'entity', entityId: card.nodeId
            }];

            if (children.length > 0) {
                this.categoryCards = this.filterCardsByAccess(children.map((child, index) => this.toEntityCard(child, index)));
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
                brandId: this.currentEntityId || this.activeBrandId || this.getDepartmentIdByBrand(this.activeBrand),
                subcategoryId: card.id || null
            },
        });
    }

    // ----------------------------------------------------------------
    // File manager navigation
    // ----------------------------------------------------------------
    private enterFileManager(): void {
        this.viewMode = 'files';
        this.currentFolderId = null;
        this.currentTreePath = [];
        this.fileManagerFolderTrail = [];
        this.searchQuery = '';
        this.selectedFile = null;

        if (!this.departmentEntities.length && this.activeBrandId) {
            const deptId = this.getCurrentDepartmentId();
            const deptFromMenu = deptId ? this.menuDepartments.find(d => d.department_id === deptId) : null;
            if (deptFromMenu) {
                this.departmentEntities = deptFromMenu.entities.map(e => ({
                    id: e.id, name: e.name, logo: e.logo, parent_entity_id: e.parent_entity_id
                }));
            }
        }

        this.activeEntityTrail = this.buildEntityTrail(this.activeBrandId);
        this.rebuildFileManagerBreadcrumb();

        // ── Cargar favoritos en paralelo para saber qué carpetas/archivos
        //    están marcados, sin bloquear la carga del contenido ──────────
        if (!this.allFavFolders.length && !this.allFavFiles.length) {
            this.endPointFilesService.getFavorites().subscribe({
                next: (resp: any) => {
                    const items: any[] = Array.isArray(resp?.data)
                        ? resp.data
                        : Array.isArray(resp?.items)
                            ? resp.items
                            : Array.isArray(resp)
                                ? resp
                                : [];

                    this.allFavFolders = items
                        .filter((item: any) => (item?.file_type || '').toLowerCase() === 'folder')
                        .map((item: any): FolderItem => ({
                            id: Number(item.id),
                            name: (item.title || item.name || 'Carpeta').toString(),
                            count: 0,
                            favorite: true,
                            parentId: item.folder_id ?? null,
                        }));

                    this.allFavFiles = items
                        .filter((item: any) => (item?.file_type || '').toLowerCase() !== 'folder')
                        .map((item: any) => this.toFavFileItem(item));

                    // Re-renderiza para que las carpetas reflejen el estado de favorito
                    this.renderCurrentTreeLevel();
                },
                error: () => { } // silencioso, no bloquea la vista
            });
        }

        this.loadFilesBySubcategory();
    }

    loadCurrentLevel(): void {
        if (this.activeSubcategoryId) return;

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
        this.loadImagePreviews(this.filteredFiles);
    }

    openFolder(folder: FolderItem): void {
        this.currentFolderId = folder.id;
        this.fileManagerFolderTrail = [...this.fileManagerFolderTrail, { label: folder.name, folderId: folder.id }];
        this.searchQuery = '';

        if (this.activeSubcategoryId && this.folderTreeRoot) {
            this.currentTreePath = [...this.currentTreePath, folder.name];
            this.renderCurrentTreeLevel();
            return;
        }

        if (this.activeSubcategoryId) {
            this.refreshBreadcrumbs();
            this.loadFilesBySubcategory(folder.id);
            return;
        }

        this.refreshBreadcrumbs();
        this.loadCurrentLevel();
    }

    navigateToBreadcrumb(crumb: BreadcrumbItem, index: number): void {
        if (crumb.crumbType === 'department' || index === 0 && this.departmentId) {
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { departmentId: crumb.departmentId ?? this.departmentId },
            });
            return;
        }

        if (crumb.crumbType === 'entity' && crumb.entityId != null) {
            const targetEntityId = crumb.entityId;
            this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
            this.activeEntityTrail = this.breadcrumbs.filter(b => b.crumbType === 'entity').map(b => b.label);
            this.fileManagerFolderTrail = [];
            this.currentFolderId = null;
            this.currentTreePath = [];
            this.searchQuery = '';
            this.selectedFile = null;
            this.viewMode = 'categories';
            this.currentEntityId = targetEntityId;

            const children = this.departmentEntities.filter(e => e.parent_entity_id === targetEntityId);
            if (children.length > 0) {
                this.categoryCards = this.filterCardsByAccess(children.map((child, i) => this.toEntityCard(child, i)));
            } else {
                this.categoryCards = this.mapSubcategoriesToCards(this.currentDepartmentSubcategories);
            }
            return;
        }

        if (crumb.crumbType === 'subcategory') {
            this.fileManagerFolderTrail = [];
            this.currentFolderId = null;
            this.currentTreePath = [];
            this.searchQuery = '';
            this.selectedFile = null;
            this.refreshBreadcrumbs();

            if (this.activeSubcategoryId && this.folderTreeRoot) {
                this.renderCurrentTreeLevel();
            } else if (this.activeSubcategoryId) {
                this.loadFilesBySubcategory();
            } else {
                this.loadCurrentLevel();
            }
            return;
        }

        const baseCount = this.getBaseBreadcrumbCount();
        const folderTrailIndex = index - baseCount;

        if (folderTrailIndex >= 0) {
            this.fileManagerFolderTrail = this.fileManagerFolderTrail.slice(0, folderTrailIndex + 1);
            this.currentTreePath = this.fileManagerFolderTrail.map(b => b.label);
            this.currentFolderId = this.fileManagerFolderTrail.length
                ? this.fileManagerFolderTrail[this.fileManagerFolderTrail.length - 1].folderId
                : null;
            this.searchQuery = '';
            this.refreshBreadcrumbs();

            if (this.activeSubcategoryId && this.folderTreeRoot) {
                this.renderCurrentTreeLevel();
            } else if (this.activeSubcategoryId) {
                this.loadFilesBySubcategory(this.currentFolderId);
            } else {
                this.loadCurrentLevel();
            }
            return;
        }

        if (index === 0) {
            if (this.departmentId) {
                this.router.navigate([], { relativeTo: this.route, queryParams: { departmentId: this.departmentId } });
            } else {
                this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams: { brandId: this.activeBrandId || this.getDepartmentIdByBrand(this.activeBrand) },
                });
            }
        }
    }

    // ----------------------------------------------------------------
    // Search
    // ----------------------------------------------------------------
    applySearch(): void {
        const q = this.searchQuery.trim().toLowerCase();
        if (!q) {
            this.filteredFolders = [...this.allFolders];
            this.filteredFiles = [...this.allFiles];
            return;
        }
        this.filteredFolders = this.allFolders.filter(f => f.name.toLowerCase().includes(q));
        this.filteredFiles = this.allFiles.filter(f =>
            f.name.toLowerCase().includes(q) ||
            f.type.toLowerCase().includes(q) ||
            f.brand.toLowerCase().includes(q)
        );
    }

    private renderCurrentTreeLevel(): void {
        if (!this.folderTreeRoot) {
            this.allFolders = [];
            this.filteredFolders = [];
            this.allFiles = [];
            this.filteredFiles = [];
            return;
        }

        let node: FolderTreeNode | null = this.folderTreeRoot;
        for (const segment of this.currentTreePath) {
            node = node.folders.find(f => f.name === segment) || null;
            if (!node) break;
        }

        if (!node) {
            this.allFolders = [];
            this.filteredFolders = [];
            this.allFiles = [];
            this.filteredFiles = [];
            return;
        }

        const folders: FolderItem[] = node.folders.map((folderNode) => ({
            id: folderNode.id,
            name: folderNode.name,
            count: folderNode.files.length + folderNode.folders.length,
            favorite: this.allFavFolders.some(f => f.id === folderNode.id),
            parentId: this.currentFolderId,
            brand: (this.activeBrand || this.getBrandDisplayName() || '').toString() || undefined
        }));

        this.allFolders = folders;
        this.filteredFolders = folders;
        this.allFiles = [...node.files];
        this.filteredFiles = [...node.files];
        this.selectedFile = null;
        this.loadImagePreviews(this.filteredFiles);

        // ── Breadcrumb antes de cualquier navegación pendiente ───────────
        this.fileManagerFolderTrail = this.currentTreePath.map((segment, idx) => ({
            label: segment,
            folderId: idx + 1
        }));
        this.refreshBreadcrumbs();

        // ── Abrir carpeta pendiente (viene de favoritos) ─────────────────
        if (this.pendingOpenFolderId) {
            const target = folders.find(f => f.id === this.pendingOpenFolderId);
            if (target) {
                this.pendingOpenFolderId = null;
                this.openFolder(target);
                return;
            }
        }

        // ── Seleccionar archivo pendiente (viene de notificaciones) ──────
        if (this.pendingSelectContentId) {
            const target = this.filteredFiles.find(f => f.id === this.pendingSelectContentId);
            if (target) {
                this.selectFile(target);
                this.pendingSelectContentId = null;
            }
        }
    }

    // ----------------------------------------------------------------
    // File actions
    // ----------------------------------------------------------------
    selectFile(file: FileItem): void {
        this.selectedFile = this.selectedFile?.id === file.id ? null : file;

        if (this.selectedFile?.id) {
            // Preview URL
            this.endPointUsersService.getContentPreviewUrl(this.selectedFile.id).subscribe({
                next: (resp: any) => {
                    const previewUrl = (resp?.preview_url || resp?.url || '').toString().trim();
                    if (previewUrl && this.selectedFile) {
                        this.selectedFile = { ...this.selectedFile, url: previewUrl };
                    }
                },
                error: () => { }
            });

            // ── Verificar si está en favoritos ───────────────────────────
            this.endPointFilesService.checkFavorite(this.selectedFile.id).subscribe({
                next: (resp: any) => {
                    const isFav = !!(resp?.is_favorite ?? resp?.favorite ?? resp?.data?.is_favorite ?? false);
                    if (this.selectedFile) {
                        this.selectedFile = { ...this.selectedFile, favorite: isFav };
                    }
                },
                error: () => { }
            });
        }
    }
    /**
     * Toggle favorito de carpeta — llama al API POST /api/v1/favorites/{content_id}
     * y sincroniza la lista local de favoritos en tiempo real.
     */
    toggleFolderFav(folder: FolderItem): void {
        this.endPointFilesService.toggleFavorite(folder.id).subscribe({
            next: () => {
                folder.favorite = !folder.favorite;
                if (folder.favorite) {
                    if (!this.allFavFolders.find(f => f.id === folder.id)) {
                        this.allFavFolders = [...this.allFavFolders, { ...folder }];
                        this.applyFavoritesSearch();
                    }
                } else {
                    this.allFavFolders = this.allFavFolders.filter(f => f.id !== folder.id);
                    this.applyFavoritesSearch();
                }
                this.message.success(folder.favorite
                    ? `"${folder.name}" agregado a favoritos`
                    : `"${folder.name}" eliminado de favoritos`);
            },
            error: () => this.message.error('No se pudo actualizar favoritos.')
        });
    }

    /**
     * Toggle favorito de archivo — llama al API POST /api/v1/favorites/{content_id}
     * y sincroniza la lista local de favoritos en tiempo real.
     */
    toggleFileFav(file: FileItem): void {
        this.endPointFilesService.toggleFavorite(file.id).subscribe({
            next: () => {
                file.favorite = !file.favorite;
                if (this.selectedFile?.id === file.id) {
                    this.selectedFile = { ...file };
                }
                if (file.favorite) {
                    if (!this.allFavFiles.find(f => f.id === file.id)) {
                        this.allFavFiles = [...this.allFavFiles, { ...file }];
                        this.applyFavoritesSearch();
                    }
                } else {
                    this.allFavFiles = this.allFavFiles.filter(f => f.id !== file.id);
                    this.applyFavoritesSearch();
                }
                this.message.success(file.favorite
                    ? `"${file.name}" agregado a favoritos`
                    : `"${file.name}" eliminado de favoritos`);
            },
            error: () => this.message.error('No se pudo actualizar favoritos.')
        });
    }

    shareFile(file: FileItem): void {
        this.endPointUsersService.getContentPreviewUrl(file.id).subscribe({
            next: (resp: any) => {
                const previewUrl = (resp?.preview_url || resp?.url || '').toString().trim();
                if (previewUrl) {
                    file.url = previewUrl;
                    navigator.clipboard.writeText(previewUrl)
                        .then(() => this.message.success('URL copiada al portapapeles.'))
                        .catch(() => this.message.error('No se pudo copiar la URL al portapapeles.'));
                }
            },
            error: () => this.message.error('No se pudo obtener la previsualización.')
        });
    }

    openFilePreview(file: FileItem): void {
        if (!file?.id) return;

        const openWithUrl = (previewUrl: string) => {
            if (!previewUrl) {
                this.message.warning('No se encontró URL de preview.');
                return;
            }

            const isPdf = this.isPdfType(file.type);
            const isVideo = this.isVideoType(file.type);
            const isImage = this.isImageType(file.type);

            if (!isPdf && !isVideo && !isImage) {
                this.message.info('La previsualización no está disponible para este tipo de archivo.');
                return;
            }

            this.previewModalType = isPdf ? 'pdf' : isVideo ? 'video' : 'image';
            this.previewModalUrl = isPdf ? this.sanitizer.bypassSecurityTrustResourceUrl(previewUrl) : null;
            this.previewModalVideoUrl = isVideo ? this.sanitizer.bypassSecurityTrustUrl(previewUrl) : null;
            this.previewModalImageUrl = isImage ? this.sanitizer.bypassSecurityTrustUrl(previewUrl) : null;

            this.modal.create({
                nzTitle: file.name || 'Previsualización',
                nzContent: this.previewModalTpl,
                nzFooter: null,
                nzWidth: 980,
                nzMaskClosable: true
            });
        };

        if (file.url) {
            openWithUrl(file.url);
            return;
        }

        this.endPointUsersService.getContentPreviewUrl(file.id).subscribe({
            next: (resp: any) => {
                const previewUrl = (resp?.preview_url || resp?.url || '').toString().trim();
                if (previewUrl) file.url = previewUrl;
                openWithUrl(previewUrl);
            },
            error: () => this.message.error('No se pudo obtener la previsualización.')
        });
    }

    contextMenu(event: MouseEvent, menu: NzDropdownMenuComponent, item: FileItem | FolderItem, type: 'file' | 'folder'): void {
        event.preventDefault();
        event.stopPropagation();
        this.selectedContextItem = item;
        this.selectedContextType = type;
        this.nzContextMenuService.create(event, menu);
    }

    closeContextMenu(): void { this.nzContextMenuService.close(); }

    contextDownload(): void {
        if (this.selectedContextType !== 'file' || !this.selectedContextItem) {
            this.message.info('Solo se pueden descargar archivos.');
            this.closeContextMenu();
            return;
        }
        this.downloadFile(this.selectedContextItem as FileItem);
        this.closeContextMenu();
    }

    contextRename(): void {
        if (this.selectedContextType !== 'file' || !this.selectedContextItem) {
            this.message.info('Solo se pueden renombrar archivos.');
            this.closeContextMenu();
            return;
        }
        const file = this.selectedContextItem as FileItem;
        this.renamingFileId = file.id;
        this.renamingFileName = file.name || '';
        this.closeContextMenu();
    }

    cancelRename(): void { this.renamingFileId = null; this.renamingFileName = ''; }

    onRenameKeydown(event: KeyboardEvent, file: FileItem): void {
        if (event.key === 'Enter') { event.preventDefault(); this.confirmRename(file); return; }
        if (event.key === 'Escape') { event.preventDefault(); this.cancelRename(); }
    }

    confirmRename(file: FileItem): void {
        const newTitle = (this.renamingFileName || '').trim();
        if (!newTitle) { this.cancelRename(); return; }
        if (!file?.id) { this.message.warning('No se pudo identificar el archivo a renombrar.'); this.cancelRename(); return; }

        this.service.renameContent(file.id, newTitle).subscribe({
            next: () => {
                file.name = newTitle;
                if (this.selectedFile?.id === file.id) this.selectedFile = { ...this.selectedFile, name: newTitle };
                this.message.success('Archivo renombrado correctamente.');
                this.cancelRename();
            },
            error: () => { this.message.error('No se pudo renombrar el archivo.'); this.cancelRename(); }
        });
    }

    contextMove(): void {
        if (!this.selectedContextItem) { this.closeContextMenu(); return; }
        const name = (this.selectedContextItem as any)?.name || 'ítem';
        this.message.info(`Mover "${name}" (pendiente integración API).`);
        this.closeContextMenu();
    }

    contextDelete(): void {
        if (!this.selectedContextItem) { this.closeContextMenu(); return; }
        const target = this.selectedContextItem as any;
        const id = Number(target?.id);
        const name = target?.name || 'ítem';

        if (!id) { this.message.warning('No se pudo identificar el elemento a eliminar.'); this.closeContextMenu(); return; }

        this.service.deleteContent(id).subscribe({
            next: () => {
                this.message.success(`"${name}" eliminado correctamente.`);
                this.closeContextMenu();
                this.selectedFile = null;
                this.loadFilesBySubcategory();
            },
            error: () => { this.message.error(`No se pudo eliminar "${name}".`); this.closeContextMenu(); }
        });
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

    private parseNumberParam(value: string | null): number | null {
        if (!value) return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    private loadBrandInfo(brandId: number, done: () => void): void {
        this.endPointFilesService.getBrandById(brandId).subscribe({
            next: (resp: any) => {
                const data = this.extractBrandData(resp);
                this.brandInfo = data;
                const resolvedName = this.resolveBrandName(data);
                if (resolvedName) this.activeBrand = resolvedName;
                done();
            },
            error: () => { this.brandInfo = null; done(); }
        });
    }

    private extractBrandData(resp: any): BrandInfoItem | null {
        if (!resp) return null;
        if (resp.data && typeof resp.data === 'object') {
            if (Array.isArray(resp.data)) return resp.data[0] || null;
            return resp.data;
        }
        if (Array.isArray(resp)) return resp[0] || null;
        if (typeof resp === 'object') return resp;
        return null;
    }

    private resolveBrandName(brand: BrandInfoItem | null): string {
        if (!brand) return '';
        return (brand.name || brand.brand_name || brand.title || '').toString().trim();
    }

    getBrandDisplayName(): string { return this.resolveBrandName(this.brandInfo) || this.activeBrand; }
    getBrandDisplayDescription(): string { return (this.brandInfo?.description || '').toString().trim(); }
    getBrandDisplayLogo(): string {
        return (this.brandInfo?.logo || this.brandInfo?.logo_url || '').toString().trim();
    }

    isImageType(type: string): boolean {
        return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes((type || '').toLowerCase());
    }
    isVideoType(type: string): boolean {
        return ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes((type || '').toLowerCase());
    }
    isPdfType(type: string): boolean { return (type || '').toLowerCase() === 'pdf'; }

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

    private loadFilesBySubcategory(folderId?: number | null): void {
        const brandId = this.activeBrandId || this.getDepartmentIdByBrand(this.activeBrand);
        const subcategoryId = this.activeSubcategoryId;

        if (!brandId || !subcategoryId) {
            this.filteredFolders = [];
            this.filteredFiles = [];
            this.allFolders = [];
            this.allFiles = [];
            this.folderTreeRoot = null;
            return;
        }

        const apiFolderId = this.activeSubcategoryId ? undefined : (folderId ?? this.currentFolderId);

        this.endPointFilesService.getContentBySubcategory(brandId, subcategoryId, apiFolderId).subscribe({
            next: (resp: any) => {
                const items = this.extractFilesFromContentResponse(resp);

                if (this.activeSubcategoryId) {
                    this.folderTreeRoot = this.buildTreeFromPathItems(items);
                    if (folderId === null || folderId === undefined) {
                        this.currentTreePath = [];
                        this.fileManagerFolderTrail = [];
                    }
                    this.renderCurrentTreeLevel();
                    if (this.pendingSelectContentId) {
                        const target = this.filteredFiles.find(f => f.id === this.pendingSelectContentId);
                        if (target) { this.selectFile(target); this.pendingSelectContentId = null; }
                    }
                    return;
                }

                const folders = items.filter((item: any) => this.isFolderItem(item)).map((item: any) => this.toFolderItem(item));
                const files = items.filter((item: any) => !this.isFolderItem(item)).map((item: any) => this.toFileItem(item));

                this.currentFolderId = folderId ?? this.currentFolderId ?? null;
                this.allFolders = folders;
                this.filteredFolders = folders;
                this.allFiles = files;
                this.filteredFiles = files;
                this.selectedFile = null;
                this.refreshBreadcrumbs();

                if (this.pendingSelectContentId) {
                    const target = this.filteredFiles.find(f => f.id === this.pendingSelectContentId);
                    if (target) { this.selectFile(target); this.pendingSelectContentId = null; }
                }
            },
            error: () => {
                this.allFolders = []; this.filteredFolders = [];
                this.allFiles = []; this.filteredFiles = [];
                this.selectedFile = null; this.folderTreeRoot = null;
                this.message.warning('No se pudo cargar el contenido de la subcategoría.');
            }
        });
    }

    private extractFilesFromContentResponse(resp: any): any[] {
        if (!resp) return [];
        if (Array.isArray(resp?.data)) return resp.data;
        if (Array.isArray(resp)) return resp;
        if (Array.isArray(resp?.items)) return resp.items;
        if (Array.isArray(resp?.files)) return resp.files;
        return [];
    }

    private isFolderItem(item: any): boolean {
        const candidates = [
            item?.type, item?.item_type, item?.content_type, item?.kind,
            item?.resource_type, item?.mime_type, item?.mimetype, item?.file_type, item?.extension
        ].map((v: any) => (v || '').toString().toLowerCase().trim());

        if (item?.is_folder === true || item?.folder === true) return true;
        if (item?.is_file === false) return true;
        if (item?.folder_id === null && Number(item?.id) > 0 && String(item?.name || item?.hidden_file || '').trim().length > 0) {
            if (candidates.some(v => v.includes('folder') || v.includes('directory') || v.includes('carpeta'))) return true;
        }
        if (candidates.some(v => v === 'folder' || v === 'directory' || v === 'carpeta')) return true;
        if (candidates.some(v => v === 'application/folder' || v === 'inode/directory')) return true;
        if (item?.children_count !== undefined || item?.items_count !== undefined) return true;
        if ((item?.hidden_file || '').toString().trim().length > 0 && candidates.some(v => v.includes('folder') || v === '')) return true;
        if ((item?.hidden_file || '').toString().trim().length > 0 && (item?.file_url || item?.download_url || item?.url)) return false;
        if ((item?.name || '').toString().trim().length > 0 && !item?.file_url && !item?.download_url && !item?.url && candidates.includes('folder')) return true;
        return false;
    }

    private toFolderItem(item: any): FolderItem {
        console.log(item)
        const childrenCount = Number(item?.children_count ?? item?.items_count ?? item?.count ?? 0);
        return {
            id: Number(item?.id) || Math.floor(Math.random() * 1000000000),
            name: (item?.title || item?.name || item?.folder_name || item?.hidden_file || 'Carpeta').toString(),
            count: Number.isFinite(childrenCount) ? childrenCount : 0,
            favorite: !!item?.favorite,
            parentId: item?.parent_id ?? this.currentFolderId ?? null,
            brand: (this.activeBrand || this.getBrandDisplayName() || '').toString() || undefined
        };
    }

    private toFileItem(item: any): FileItem {
        const rawType = (item?.file_type || item?.extension || item?.mime_type || '').toString().trim();
        const normalizedRawType = rawType.replace('.', '').toLowerCase();
        const type = normalizedRawType.includes('/') ? normalizedRawType.split('/').pop() || 'file' : (normalizedRawType || 'file');
        const size_to_mb = item?.file_size_bytes
            ? (item.file_size_bytes / (1024 * 1024)).toFixed(2) + ' MB'
            : (item?.file_size || '—').toString();

        const nameFromKey = (() => {
            const key = (item?.s3_key || item?.key || '').toString().trim();
            if (!key) return '';
            const segments = key.split('/').filter(Boolean);
            return segments.length ? segments[segments.length - 1] : '';
        })();

        return {
            id: Number(item?.id) || Math.floor(Math.random() * 1000000000),
            name: (item?.title || item?.name || item?.file_name || nameFromKey || item?.hidden_file || 'Archivo').toString(),
            description: (item?.description || '').toString(),
            type,
            size: size_to_mb,
            uploaded_at: (item?.uploaded_at || item?.created_at || new Date().toISOString()).toString(),
            uploaded_by: (item?.uploaded_by || item?.user_name || item?.owner || 'N/A').toString(),
            brand: (this.activeBrand || this.getBrandDisplayName() || this.activeBrand || 'N/A').toString(),
            category: (item?.category || this.activeSubcategory || `Subcategoría ${this.activeSubcategoryId || ''}`).toString(),
            downloads: Number(item?.downloads || item?.download_count || 0),
            favorite: !!item?.favorite,
            folderId: item?.folder_id ?? null,
            url: (item?.url || item?.file_url || item?.download_url || '').toString() || undefined,
            s3Key: (item?.s3_key || item?.key || '').toString() || undefined
        };
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

    addNewMaterial(): void {
        this.resetUploadMaterialForm();
        this.modalRef = this.modal.create({
            nzTitle: 'Agregar nuevo material',
            nzContent: this.tplContent,
            nzFooter: this.tplFooter,
            nzViewContainerRef: this.viewContainerRef,
            nzData: {},
            nzMaskClosable: false,
            nzClosable: true,
            nzWidth: 560,
        });
    }

    triggerFileInput(): void { this.fileInputRef?.nativeElement.click(); }

    onMaterialFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.uploadMaterialFile = input?.files?.[0] || null;
    }

    onTagInputKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); this.addTagFromInput(); }
    }

    addTagFromInput(): void {
        const normalized = (this.uploadMaterialTagInput || '').trim();
        if (!normalized) return;
        if (this.uploadMaterialTags.includes(normalized)) { this.uploadMaterialTagInput = ''; return; }
        if (this.uploadMaterialTags.length >= this.MAX_TAGS) { this.message.warning(`Máximo ${this.MAX_TAGS} tags`); return; }
        this.uploadMaterialTags = [...this.uploadMaterialTags, normalized];
        this.uploadMaterialTagInput = '';
    }

    removeTag(tag: string): void { this.uploadMaterialTags = this.uploadMaterialTags.filter(t => t !== tag); }

    removeSelectedFile(): void {
        this.uploadMaterialFile = null;
        if (this.fileInputRef?.nativeElement) this.fileInputRef.nativeElement.value = '';
    }

    saveNewMaterial(): void {
        if (!this.uploadMaterialTitle.trim()) { this.message.warning('El título es obligatorio.'); return; }
        if (!this.uploadMaterialFile) { this.message.warning('Debes seleccionar un archivo.'); return; }
        this.message.success('Material agregado correctamente (pendiente integración API).');
        this.modalRef?.close();
        this.resetUploadMaterialForm();
    }

    cancelNewMaterial(): void { this.modalRef?.close(); this.resetUploadMaterialForm(); }

    preventOpen(open: boolean): void { /* noop */ }

    private resetUploadMaterialForm(): void {
        this.uploadMaterialFile = null;
        this.uploadMaterialTitle = '';
        this.uploadMaterialDescription = '';
        this.uploadMaterialTags = [];
        this.uploadMaterialTagInput = '';
        if (this.fileInputRef?.nativeElement) this.fileInputRef.nativeElement.value = '';
    }

    private resolveSubcategoryDisplayName(): string {
        if (this.activeSubcategory?.trim()) return this.activeSubcategory.trim();
        if (!this.activeSubcategoryId) return '';
        const found = this.currentDepartmentSubcategories.find(s => Number(s.id) === Number(this.activeSubcategoryId));
        return (found?.name || '').toString().trim();
    }

    private getBaseBreadcrumbCount(): number {
        const departmentLabel = this.getCurrentDepartmentName();
        const subcategoryLabel = this.resolveSubcategoryDisplayName();
        const entityCrumbs = this.activeEntityTrail.length > 0
            ? this.activeEntityTrail
            : (this.getBrandDisplayName() || this.activeBrand ? [this.getBrandDisplayName() || this.activeBrand] : []);

        return [
            ...(departmentLabel ? [departmentLabel] : []),
            ...entityCrumbs,
            ...(subcategoryLabel ? [subcategoryLabel] : [])
        ].filter(v => (v || '').trim().length > 0).length;
    }

    private refreshBreadcrumbs(): void { this.rebuildFileManagerBreadcrumb(); }

    private enterDepartmentMode(): void {
        const dept = this.menuDepartments.find(d => d.department_id === this.departmentId);
        if (!dept || !dept.entities.length) {
            this.message.warning('No se encontraron entidades para este departamento.');
            return;
        }
        const rootEntities = dept.entities.filter(e => e.parent_entity_id === null);
        this.departmentEntities = dept.entities.map(e => ({
            id: e.id, name: e.name, logo: e.logo, parent_entity_id: e.parent_entity_id
        }));
        this.categoryCards = this.filterCardsByAccess(rootEntities.map((entity, index) => this.toEntityCard(entity, index)));
        this.currentEntityId = null;
        this.activeEntityTrail = [];
        this.viewMode = 'categories';
        this.breadcrumbs = [{ label: dept.department_name, folderId: null, crumbType: 'department', departmentId: dept.department_id }];
        this.brandInfo = null;

        this.endPointFilesService.getSubcategoriesByDepartment(dept.department_id).subscribe({
            next: (resp: SubcategoriesApiResponse) => {
                this.currentDepartmentSubcategories = Array.isArray(resp?.data) ? resp.data : [];
            },
            error: () => { this.currentDepartmentSubcategories = []; }
        });
    }

    private rebuildFileManagerBreadcrumb(): void {
        const departmentLabel = this.getCurrentDepartmentName();
        const departmentId = this.getCurrentDepartmentId();
        const subcategoryLabel = this.resolveSubcategoryDisplayName();

        const entityCrumbs = this.activeEntityTrail.length > 0
            ? this.activeEntityTrail
            : (this.getBrandDisplayName() || this.activeBrand ? [this.getBrandDisplayName() || this.activeBrand] : []);

        const entityCrumbItems = this.buildEntityCrumbItemsFromTrail(entityCrumbs);

        this.breadcrumbs = [
            ...(departmentLabel ? [{ label: departmentLabel, folderId: null, crumbType: 'department' as const, departmentId }] : []),
            ...entityCrumbItems,
            ...(subcategoryLabel ? [{ label: subcategoryLabel, folderId: null, crumbType: 'subcategory' as const, subcategoryId: this.activeSubcategoryId }] : []),
            ...this.fileManagerFolderTrail.map(f => ({ ...f, crumbType: 'folder' as const }))
        ];

        const uploadEntityParts = entityCrumbs;
        this.currentBreadcrumbPath = this.buildBreadcrumbPathForUpload(
            uploadEntityParts, subcategoryLabel, this.currentTreePath
        );
    }

    private ensureSubcategoryContextForBreadcrumb(): void {
        if (!this.activeSubcategoryId) return;
        if (!this.getCurrentDepartmentId()) return;

        if (this.resolveSubcategoryDisplayName()) { this.rebuildFileManagerBreadcrumb(); return; }

        const departmentId = this.getCurrentDepartmentId();
        if (!departmentId) return;

        this.endPointFilesService.getSubcategoriesByDepartment(departmentId).subscribe({
            next: (resp: SubcategoriesApiResponse) => {
                const subcategories: SubcategoryItem[] = Array.isArray(resp?.data) ? resp.data : [];
                this.currentDepartmentSubcategories = subcategories;
                const resolved = this.resolveSubcategoryDisplayName();
                if (resolved) { this.activeSubcategory = resolved; this.rebuildFileManagerBreadcrumb(); }
            },
            error: () => { }
        });
    }

    private getCurrentDepartmentName(): string {
        const departmentId = this.getCurrentDepartmentId();
        if (!departmentId) return '';
        const found = this.menuDepartments.find(d => d.department_id === departmentId);
        return (found?.department_name || '').toString().trim();
    }

    private buildEntityCrumbItems(entityId: number | null): BreadcrumbItem[] {
        if (!entityId || !this.departmentEntities.length) {
            const name = this.getBrandDisplayName() || this.activeBrand;
            return name ? [{ label: name, folderId: null, crumbType: 'entity', entityId }] : [];
        }

        const items: BreadcrumbItem[] = [];
        let current: DepartmentEntityItem | undefined = this.departmentEntities.find(e => e.id === entityId);

        while (current) {
            items.unshift({ label: current.name, folderId: null, crumbType: 'entity', entityId: current.id });
            const parentId = current.parent_entity_id;
            current = parentId != null ? this.departmentEntities.find(e => e.id === parentId) : undefined;
        }

        return items;
    }

    private buildEntityCrumbItemsFromTrail(trail: string[]): BreadcrumbItem[] {
        return trail.map(name => {
            const entity = this.departmentEntities.find(e => this.normalizeText(e.name) === this.normalizeText(name));
            return { label: name, folderId: null, crumbType: 'entity' as const, entityId: entity?.id ?? null };
        });
    }

    private buildEntityTrail(entityId: number | null): string[] {
        if (!entityId || !this.departmentEntities.length) {
            const name = this.getBrandDisplayName() || this.activeBrand;
            return name ? [name] : [];
        }

        const trail: string[] = [];
        let current: DepartmentEntityItem | undefined = this.departmentEntities.find(e => e.id === entityId);

        while (current) {
            trail.unshift(current.name);
            const parentId = current.parent_entity_id;
            current = parentId != null ? this.departmentEntities.find(e => e.id === parentId) : undefined;
        }

        return trail;
    }

    private slugifyPathPart(value: string): string {
        return (value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    private getSubcategorySlug(): string {
        return this.slugifyPathPart(this.resolveSubcategoryDisplayName() || this.activeSubcategory || '');
    }

    private extractPathParts(pathValue: string): string[] {
        return (pathValue || '').split('/').map(p => (p || '').trim()).filter(Boolean);
    }

    private buildTreeFromPathItems(items: any[]): FolderTreeNode {
        const root: FolderTreeNode = { id: 0, name: '__root__', fullPath: '', folders: [], files: [] };
        const subcategorySlug = this.getSubcategorySlug();

        for (const rawItem of items) {
            const itemPath = (rawItem?.path || rawItem?.folder_path || rawItem?.s3_key || rawItem?.key || '').toString().trim();
            const parts = this.extractPathParts(itemPath);
            const fileLikeName = (rawItem?.name || rawItem?.file_name || rawItem?.title || rawItem?.hidden_file || '').toString().trim();
            const isFolder = this.isFolderItem(rawItem);

            if (!parts.length) {
                if (isFolder) { this.ensureFolderNode(root, fileLikeName || 'Carpeta', Number(rawItem?.id) || undefined); }
                else { root.files.push(this.toFileItem(rawItem)); }
                continue;
            }

            const subIndex = subcategorySlug ? parts.findIndex(p => this.slugifyPathPart(p) === subcategorySlug) : -1;
            const relativeParts = subIndex >= 0 ? parts.slice(subIndex + 1) : [];

            if (relativeParts.length === 0) {
                if (isFolder) { this.ensureFolderNode(root, fileLikeName || parts[parts.length - 1] || 'Carpeta', Number(rawItem?.id) || undefined); }
                else { root.files.push(this.toFileItem(rawItem)); }
                continue;
            }

            let currentNode = root;

            if (isFolder) {
                const folderId = Number(rawItem?.id) || undefined;
                relativeParts.forEach((segment, idx) => {
                    // El id real solo aplica al último segmento (la carpeta en sí)
                    const id = idx === relativeParts.length - 1 ? folderId : undefined;
                    currentNode = this.ensureFolderNode(currentNode, segment, id);
                });
            } else {
                const mappedFile = this.toFileItem(rawItem);
                const effectiveFileName = (mappedFile.name || fileLikeName || '').toString().trim();
                const parents = relativeParts.slice(0, -1);
                for (const segment of parents) { currentNode = this.ensureFolderNode(currentNode, segment); }
                if (!mappedFile.name || mappedFile.name === 'Archivo') {
                    mappedFile.name = effectiveFileName || relativeParts[relativeParts.length - 1] || 'Archivo';
                }
                currentNode.files.push(mappedFile);
            }
        }

        return root;
    }

    private ensureFolderNode(parent: FolderTreeNode, folderName: string, realId?: number): FolderTreeNode {
        const normalized = this.slugifyPathPart(folderName || '');
        let found = parent.folders.find(f => this.slugifyPathPart(f.name) === normalized);

        if (!found) {
            found = {
                id: realId ?? Math.floor(Math.random() * 1000000000),
                name: folderName || 'Carpeta',
                fullPath: parent.fullPath ? `${parent.fullPath}/${folderName}` : folderName,
                folders: [],
                files: []
            };
            parent.folders.push(found);
        } else if (realId && found.id !== realId) {
            // Si ya existía el nodo (creado desde path de archivo), actualiza con el id real
            found.id = realId;
        }

        return found;
    }


    private buildBreadcrumbPathForUpload(entityParts: string[], subcategory: string, folderTrail: string[] = []): string {
        const parts = [...entityParts, subcategory]
            .map(v => (v || '').trim()).filter(Boolean)
            .map(v => this.slugifyPathPart(v)).filter(Boolean);

        const folderParts = (folderTrail || [])
            .map(v => (v || '').trim()).filter(Boolean)
            .map(v => this.slugifyPathPart(v)).filter(Boolean);

        return [...parts, ...folderParts].join('/');
    }

    getUploadBreadcrumbPath(): string { return this.currentBreadcrumbPath; }

    beforeUpload = (file: File): boolean => {
        this.file = file;
        if (!this.uploadForm.value.title) { this.uploadForm.patchValue({ title: file.name }); }
        return false;
    };

    enviarArchivo(): void {
        const tipo = this.uploadForm.value.type;
        const uploadPath = this.getUploadBreadcrumbPath();
        const brandId = this.activeBrandId;
        const subcategoryId = this.activeSubcategoryId;

        if (!brandId || !subcategoryId || !uploadPath) {
            this.message.warning('No se pudo generar el contexto de carga (brand, subcategoría y path).');
            return;
        }

        if (tipo === 'file' && !this.file) { this.message.warning('No hay archivo seleccionado.'); return; }

        this.isUploading = true;

        if (tipo === 'file') {
            const formData = new FormData();
            formData.append('file', this.file);
            formData.append('title', this.uploadForm.value.title);
            formData.append('description', this.uploadForm.value.description);
            formData.append('tags', this.uploadForm.value.tags);
            formData.append('path', uploadPath);
            formData.append('entity_id', String(brandId));
            formData.append('subcategory_id', String(subcategoryId));
            formData.append('id_country', '1');

            this.service.uploadFile(formData).subscribe({
                next: (resp: any) => { console.log('Archivo subido', resp); this.onSuccess('Archivo subido correctamente.'); },
                error: (error: any) => { console.error('Error', error); this.message.error('Error al subir el archivo.'); },
                complete: () => { this.isUploading = false; }
            });
        } else {
            const payload = {
                title: this.uploadForm.value.title,
                description: this.uploadForm.value.description,
                path: uploadPath + '/' + this.slugifyPathPart(this.uploadForm.value.title),
                entity_id: brandId,
                subcategory_id: subcategoryId,
                id_country: 1
            };

            this.service.createFolder(payload).subscribe({
                next: (resp: any) => { console.log('Carpeta creada', resp); this.onSuccess('Carpeta creada correctamente.'); },
                error: (error: any) => { console.error('Error', error); this.message.error('Error al crear la carpeta.'); },
                complete: () => { this.isUploading = false; }
            });
        }
    }

    private onSuccess(mensaje: string): void {
        this.modalRef.close();
        if (this.activeSubcategoryId) { this.loadFilesBySubcategory(); } else { this.loadCurrentLevel(); }
        this.message.success(mensaje);
    }

    downloadFile(file: any): void {
        this.service.downloadFile(file.id).subscribe({
            next: (url: any) => {
                console.log(url);
                const link = document.createElement('a');
                link.href = url;
                link.download = (file?.name || 'archivo').toString();
                link.click();
            },
            error: (err: any) => { console.log(err); }
        });
    }

    private loadImagePreviews(files: FileItem[]): void {
        files.forEach(file => {
            if (this.isImageType(file.type) && !file.url) {
                this.endPointUsersService.getContentPreviewUrl(file.id).subscribe({
                    next: (resp: any) => {
                        const previewUrl = (resp?.preview_url || resp?.url || '').toString().trim();
                        if (previewUrl) file.url = previewUrl;
                    },
                    error: () => { }
                });
            }
        });
    }


}