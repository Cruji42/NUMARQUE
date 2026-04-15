import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, ViewContainerRef, ElementRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EndPointFilesService } from '../../core/apis/end-point-files.service';
import { SideNavMenuService, ApiDepartment } from '../../core/service/sidenav.service'; // ajusta la ruta según tu proyecto
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FilesService } from 'src/app/core/service/files.service';
import { NzContextMenuService, NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown';
import { EndPointUsersService } from '../../core/apis/end-point-users.service';

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
    // Navigation metadata — populated when building breadcrumbs
    crumbType?: 'department' | 'entity' | 'subcategory' | 'folder';
    entityId?: number | null;        // for entity crumbs
    subcategoryId?: number | null;   // for subcategory crumbs
    departmentId?: number | null;    // for department crumbs
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

    viewMode: 'categories' | 'files' = 'categories';
    fileViewMode: 'grid' | 'list' = 'grid';

    activeBrand = '';
    activeBrandId: number | null = null;
    activeSection = '';
    activeSubcategory = '';
    activeSectionId: number | null = null;
    activeSubcategoryId: number | null = null;
    departmentId: number | null = null;
    pendingSelectContentId: number | null = null;

    // Trail de nombres de entity para construir el path de upload
    // Ej: PetFood->NUCAN->Digital  =>  ['NUCAN']
    // Ej: Pecuario->Aves->NUPIO->Digital  =>  ['Aves', 'NUPIO']
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

    // Departamentos cargados desde el API del menú (se usan para resolver brand → department_id)
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
                    this.menuDepartments = departments;
                    this.activeBrandId = this.parseNumberParam(params.get('brandId'));
                    // this.activeSectionId = this.parseNumberParam(params.get('sectionId'));
                    this.departmentId = this.parseNumberParam(params.get('departmentId'));
                    this.activeSubcategoryId = this.parseNumberParam(params.get('subcategoryId'));
                    this.activeBrand = params.get('brand') || '';
                    // this.activeSection     = params.get('section')     || '';
                    this.activeSubcategory = params.get('subcategory') || '';
                    const contentId = this.parseNumberParam(params.get('contentId'));
                    // const contentId = this.parseNumberParam(params.get('contentId'));
                    if (contentId) {
                        this.pendingSelectContentId = contentId; // guardamos para usarlo después de cargar
                    }
                    // Reset trail en cada navegación; se reconstruye en enterCategoryMode / enterFileManager
                    this.activeEntityTrail = [];

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
            type: ['file'], // valor por defecto
            title: ['', Validators.required],
            description: ['',],
            tags: [[],]
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
        const departmentLabel = this.getCurrentDepartmentName();
        const departmentId = this.getCurrentDepartmentId();

        // Construir el trail de entities para el breadcrumb visual y el path de upload.
        // El trail parte desde la entity activa (activeBrandId) y sube por sus ancestros
        // hasta la raíz, excluyendo siempre el departamento.
        this.activeEntityTrail = this.buildEntityTrail(this.activeBrandId);

        // Build entity crumbs with their entityId metadata so navigateToBreadcrumb
        // can reconstruct the correct navigation state for each level.
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

        // Tomar las entities del menú cacheado para este departamento
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

        // Llamar al endpoint de subcategorías del departamento
        this.endPointFilesService.getSubcategoriesByDepartment(departmentId).subscribe({

            next: (resp: SubcategoriesApiResponse) => {
                // console.log('Subcategories API response:', resp);
                const subcategories: SubcategoryItem[] = Array.isArray(resp?.data) ? resp.data : [];
                this.currentDepartmentSubcategories = subcategories;

                // Buscar la entity por brandId (id directo) o por nombre
                const brandEntity = this.activeBrandId
                    ? entities.find(e => e.id === this.activeBrandId) || null
                    : this.findEntityByName(entities, this.activeBrand);

                // Sin section/subcategory: decidir qué mostrar según si la entity tiene hijos
                if (!this.activeSection && !this.activeSubcategory && !this.activeSectionId && !this.activeSubcategoryId) {
                    if (brandEntity) {
                        // Entity encontrada: mostrar sus hijos si los tiene, si no → subcategorías
                        this.currentEntityId = brandEntity.id;
                        this.categoryCards = this.buildCardsForEntityLevel(brandEntity.id, entities, subcategories);
                    } else {
                        // No es una entity conocida (PetFood brands sin parent) → subcategorías directamente
                        this.categoryCards = this.mapSubcategoriesToCards(subcategories);
                    }
                    return;
                }

                if (!brandEntity) {
                    // brand no es una entity → mostrar subcategorías
                    this.categoryCards = this.mapSubcategoriesToCards(subcategories);
                    return;
                }

                this.currentEntityId = brandEntity.id;

                // Deep-link: brandId=Aves + sectionId=NUPIO → mostrar subcategorías de esa sub-entidad
                const sectionEntity = this.activeSectionId
                    ? entities.find(e => e.id === this.activeSectionId) || null
                    : (this.activeSection ? this.findEntityByName(entities, this.activeSection) : null);

                if (sectionEntity) {
                    this.currentEntityId = sectionEntity.id;
                    this.categoryCards = this.mapSubcategoriesToCards(subcategories);
                    return;
                }

                this.categoryCards = this.buildCardsForEntityLevel(brandEntity.id, entities, subcategories);
            },
            error: () => {
                this.categoryCards = [];
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

    private getCurrentDepartmentId(): number | null {
        // department_id debe resolverse por la entidad (brand) seleccionada,
        // no por activeBrandId directo (que es entity/brand id).
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
        // ── Modo departamento: venimos de ?departmentId=X ──────────────────
        if (this.departmentId && card.nodeId) {
            const children = this.departmentEntities.filter(e => e.parent_entity_id === card.nodeId);

            if (children.length > 0) {
                // Hay sub-entities: mostrarlas como cards, actualizar trail y breadcrumb
                this.currentEntityId = card.nodeId;
                this.activeEntityTrail = [...this.activeEntityTrail, card.title];
                this.breadcrumbs = [...this.breadcrumbs, {
                    label: card.title, folderId: null,
                    crumbType: 'entity', entityId: card.nodeId
                }];
                this.categoryCards = children.map((child, index) => this.toEntityCard(child, index));
                return;
            }

            // Sin sub-entities: navegar a la entity como brand (mostrará sus sub-entities o subcategorías)
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { brandId: card.nodeId },
            });
            return;
        }

        // ── Modo brand normal: card.nodeId = sub-entity, card.id = subcategory ──
        if (this.viewMode === 'categories' && card.nodeId) {
            const children = this.departmentEntities.filter(e => e.parent_entity_id === card.nodeId);
            this.currentEntityId = card.nodeId;
            this.activeEntityTrail = [...this.activeEntityTrail, card.title];
            this.breadcrumbs = [...this.breadcrumbs, {
                label: card.title, folderId: null,
                crumbType: 'entity', entityId: card.nodeId
            }];

            if (children.length > 0) {
                this.categoryCards = children.map((child, index) => this.toEntityCard(child, index));
                return;
            }

            // Sin hijos: mostrar subcategorías
            const subcategoryCards = this.mapSubcategoriesToCards(this.currentDepartmentSubcategories);
            if (subcategoryCards.length > 0) {
                this.categoryCards = subcategoryCards;
                return;
            }
        }

        // ── Navegar al file manager con la subcategoría seleccionada ──
        // brandId = la entity hoja actual (currentEntityId o activeBrandId)
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

        // Asegurar que departmentEntities esté poblado para poder construir el trail
        if (!this.departmentEntities.length && this.activeBrandId) {
            const deptId = this.getCurrentDepartmentId();
            const deptFromMenu = deptId ? this.menuDepartments.find(d => d.department_id === deptId) : null;
            if (deptFromMenu) {
                this.departmentEntities = deptFromMenu.entities.map(e => ({
                    id: e.id,
                    name: e.name,
                    logo: e.logo,
                    parent_entity_id: e.parent_entity_id
                }));
            }
        }

        // Construir el trail de entities (ej: ['Aves', 'NUPIO'] o ['NUCAN'])
        this.activeEntityTrail = this.buildEntityTrail(this.activeBrandId);

        this.rebuildFileManagerBreadcrumb();

        this.loadFilesBySubcategory();
    }

    loadCurrentLevel(): void {
        // Si estamos en contexto de subcategoría seleccionada, no recalcular desde allFolders/allFiles.
        if (this.activeSubcategoryId) {
            return;
        }

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
        // ── Department crumb ────────────────────────────────────────────────
        // Always navigate via URL so the full page re-initializes cleanly.
        if (crumb.crumbType === 'department' || index === 0 && this.departmentId) {
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { departmentId: crumb.departmentId ?? this.departmentId },
            });
            return;
        }

        // ── Entity crumb ────────────────────────────────────────────────────
        // We need to go back to showing category cards for this entity level.
        if (crumb.crumbType === 'entity' && crumb.entityId != null) {
            const targetEntityId = crumb.entityId;

            // Trim breadcrumbs and trail back to this crumb (inclusive).
            this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
            this.activeEntityTrail = this.breadcrumbs
                .filter(b => b.crumbType === 'entity')
                .map(b => b.label);

            // Reset file-manager state.
            this.fileManagerFolderTrail = [];
            this.currentFolderId = null;
            this.currentTreePath = [];
            this.searchQuery = '';
            this.selectedFile = null;

            // Switch to category view and show children of the target entity.
            this.viewMode = 'categories';
            this.currentEntityId = targetEntityId;

            const children = this.departmentEntities.filter(e => e.parent_entity_id === targetEntityId);
            if (children.length > 0) {
                this.categoryCards = children.map((child, i) => this.toEntityCard(child, i));
            } else {
                // Leaf entity — show subcategories.
                this.categoryCards = this.mapSubcategoriesToCards(this.currentDepartmentSubcategories);
            }
            return;
        }

        // ── Subcategory crumb ───────────────────────────────────────────────
        // Go back to root of the file manager (no folder selected).
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

        // ── Folder crumb ────────────────────────────────────────────────────
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

        // ── Fallback: first crumb without metadata (legacy) ─────────────────
        if (index === 0) {
            if (this.departmentId) {
                this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams: { departmentId: this.departmentId },
                });
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
        const baseFolders = [...this.allFolders];
        const baseFiles = [...this.allFiles];

        if (!q) {
            this.filteredFolders = baseFolders;
            this.filteredFiles = baseFiles;
            return;
        }

        this.filteredFolders = baseFolders.filter(f => f.name.toLowerCase().includes(q));
        this.filteredFiles = baseFiles.filter(f =>
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

        const folders: FolderItem[] = node.folders.map((folderNode, index) => ({
            id: folderNode.id || (index + 1),
            name: folderNode.name,
            count: folderNode.files.length + folderNode.folders.length,
            favorite: false,
            parentId: this.currentFolderId,
            brand: (this.activeBrand || this.getBrandDisplayName() || '').toString() || undefined
        }));

        this.allFolders = folders;
        this.filteredFolders = folders;
        this.allFiles = [...node.files];
        this.filteredFiles = [...node.files];
        this.selectedFile = null;
        this.loadImagePreviews(this.filteredFiles);

        if (this.pendingSelectContentId) {
            const target = this.filteredFiles.find(f => f.id === this.pendingSelectContentId);
            if (target) {
                this.selectFile(target);
                this.pendingSelectContentId = null;
            }
        }


        this.fileManagerFolderTrail = this.currentTreePath.map((segment, idx) => ({
            label: segment,
            folderId: idx + 1
        }));

        this.refreshBreadcrumbs();
    }

    // ----------------------------------------------------------------
    // File actions
    // ----------------------------------------------------------------
    selectFile(file: FileItem): void {
        this.selectedFile = this.selectedFile?.id === file.id ? null : file;

        if (this.selectedFile?.id) {
            this.endPointUsersService.getContentPreviewUrl(this.selectedFile.id).subscribe({
                next: (resp: any) => {
                    const previewUrl = (resp?.preview_url || resp?.url || '').toString().trim();
                    if (previewUrl && this.selectedFile) {
                        this.selectedFile = { ...this.selectedFile, url: previewUrl };
                    }
                },
                error: () => { }
            });
        }
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

    // downloadFile(file: FileItem): void {
    //     if (file.url) {
    //         const a = document.createElement('a');
    //         a.href = file.url; a.download = file.name; a.click();
    //     } else {
    //         this.message.info(`Descargando "${file.name}"...`);
    //     }
    // }

    shareFile(file: FileItem): void {
        // this.openFilePreview(file);
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
                if (previewUrl) {
                    file.url = previewUrl;
                }
                openWithUrl(previewUrl);
            },
            error: () => {
                this.message.error('No se pudo obtener la previsualización.');
            }
        });
    }

    contextMenu(event: MouseEvent, menu: NzDropdownMenuComponent, item: FileItem | FolderItem, type: 'file' | 'folder'): void {
        event.preventDefault();
        event.stopPropagation();
        this.selectedContextItem = item;
        this.selectedContextType = type;
        this.nzContextMenuService.create(event, menu);
    }

    closeContextMenu(): void {
        this.nzContextMenuService.close();
    }

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

    cancelRename(): void {
        this.renamingFileId = null;
        this.renamingFileName = '';
    }

    onRenameKeydown(event: KeyboardEvent, file: FileItem): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.confirmRename(file);
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            this.cancelRename();
        }
    }

    confirmRename(file: FileItem): void {
        const newTitle = (this.renamingFileName || '').trim();

        if (!newTitle) {
            this.cancelRename();
            return;
        }

        if (!file?.id) {
            this.message.warning('No se pudo identificar el archivo a renombrar.');
            this.cancelRename();
            return;
        }

        this.service.renameContent(file.id, newTitle).subscribe({
            next: () => {
                file.name = newTitle;
                if (this.selectedFile?.id === file.id) {
                    this.selectedFile = { ...this.selectedFile, name: newTitle };
                }
                this.message.success('Archivo renombrado correctamente.');
                this.cancelRename();
            },
            error: () => {
                this.message.error('No se pudo renombrar el archivo.');
                this.cancelRename();
            }
        });
    }

    contextMove(): void {
        if (!this.selectedContextItem) {
            this.closeContextMenu();
            return;
        }

        const name = (this.selectedContextItem as any)?.name || 'ítem';
        this.message.info(`Mover "${name}" (pendiente integración API).`);
        this.closeContextMenu();
    }

    contextDelete(): void {
        if (!this.selectedContextItem) {
            this.closeContextMenu();
            return;
        }

        const target = this.selectedContextItem as any;
        const id = Number(target?.id);
        const name = target?.name || 'ítem';

        if (!id) {
            this.message.warning('No se pudo identificar el elemento a eliminar.');
            this.closeContextMenu();
            return;
        }

        this.service.deleteContent(id).subscribe({
            next: () => {
                this.message.success(`"${name}" eliminado correctamente.`);
                this.closeContextMenu();
                this.selectedFile = null;
                this.loadFilesBySubcategory();
            },
            error: () => {
                this.message.error(`No se pudo eliminar "${name}".`);
                this.closeContextMenu();
            }
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
                if (resolvedName) {
                    this.activeBrand = resolvedName;
                }

                done();
            },
            error: () => {
                this.brandInfo = null;
                done();
            }
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
        return (
            brand.name ||
            brand.brand_name ||
            brand.title ||
            ''
        ).toString().trim();
    }

    getBrandDisplayName(): string {
        return this.resolveBrandName(this.brandInfo) || this.activeBrand;
    }

    getBrandDisplayDescription(): string {
        return (this.brandInfo?.description || '').toString().trim();
    }

    getBrandDisplayLogo(): string {
        return (
            this.brandInfo?.logo ||
            this.brandInfo?.logo_url ||
            ''
        ).toString().trim();
    }

    isImageType(type: string): boolean {
        const t = (type || '').toLowerCase();
        return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(t);
    }

    isVideoType(type: string): boolean {
        const t = (type || '').toLowerCase();
        return ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(t);
    }

    isPdfType(type: string): boolean {
        return (type || '').toLowerCase() === 'pdf';
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
                        if (target) {
                            this.selectFile(target);
                            this.pendingSelectContentId = null;
                        }
                    }
                    return;
                }

                const folders = items
                    .filter((item: any) => this.isFolderItem(item))
                    .map((item: any) => this.toFolderItem(item));
                const files = items
                    .filter((item: any) => !this.isFolderItem(item))
                    .map((item: any) => this.toFileItem(item));

                this.currentFolderId = folderId ?? this.currentFolderId ?? null;
                this.allFolders = folders;
                this.filteredFolders = folders;
                this.allFiles = files;
                this.filteredFiles = files;
                this.selectedFile = null;
                this.refreshBreadcrumbs();

                if (this.pendingSelectContentId) {
                    const target = this.filteredFiles.find(f => f.id === this.pendingSelectContentId);
                    if (target) {
                        this.selectFile(target);
                        this.pendingSelectContentId = null;
                    }
                }
            },
            error: () => {
                this.allFolders = [];
                this.filteredFolders = [];
                this.allFiles = [];
                this.filteredFiles = [];
                this.selectedFile = null;
                this.folderTreeRoot = null;
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
            item?.type,
            item?.item_type,
            item?.content_type,
            item?.kind,
            item?.resource_type,
            item?.mime_type,
            item?.mimetype,
            item?.file_type,
            item?.extension
        ]
            .map((v: any) => (v || '').toString().toLowerCase().trim());

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
        const size_to_mb = item?.file_size_bytes ? (item.file_size_bytes / (1024 * 1024)).toFixed(2) + ' MB' : (item?.file_size || '—').toString();

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

    triggerFileInput(): void {
        this.fileInputRef?.nativeElement.click();
    }

    onMaterialFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input?.files?.[0] || null;
        this.uploadMaterialFile = file;
    }

    onTagInputKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            this.addTagFromInput();
        }
    }

    addTagFromInput(): void {
        const normalized = (this.uploadMaterialTagInput || '').trim();
        if (!normalized) return;
        if (this.uploadMaterialTags.includes(normalized)) {
            this.uploadMaterialTagInput = '';
            return;
        }
        if (this.uploadMaterialTags.length >= this.MAX_TAGS) {
            this.message.warning(`Máximo ${this.MAX_TAGS} tags`);
            return;
        }
        this.uploadMaterialTags = [...this.uploadMaterialTags, normalized];
        this.uploadMaterialTagInput = '';
    }

    removeTag(tag: string): void {
        this.uploadMaterialTags = this.uploadMaterialTags.filter(t => t !== tag);
    }

    removeSelectedFile(): void {
        this.uploadMaterialFile = null;
        if (this.fileInputRef?.nativeElement) {
            this.fileInputRef.nativeElement.value = '';
        }
    }

    saveNewMaterial(): void {
        if (!this.uploadMaterialTitle.trim()) {
            this.message.warning('El título es obligatorio.');
            return;
        }

        if (!this.uploadMaterialFile) {
            this.message.warning('Debes seleccionar un archivo.');
            return;
        }

        this.message.success('Material agregado correctamente (pendiente integración API).');
        this.modalRef?.close();
        this.resetUploadMaterialForm();
    }

    cancelNewMaterial(): void {
        this.modalRef?.close();
        this.resetUploadMaterialForm();
    }

    private resetUploadMaterialForm(): void {
        this.uploadMaterialFile = null;
        this.uploadMaterialTitle = '';
        this.uploadMaterialDescription = '';
        this.uploadMaterialTags = [];
        this.uploadMaterialTagInput = '';
        if (this.fileInputRef?.nativeElement) {
            this.fileInputRef.nativeElement.value = '';
        }
    }

    private resolveSubcategoryDisplayName(): string {
        if (this.activeSubcategory?.trim()) return this.activeSubcategory.trim();
        if (!this.activeSubcategoryId) return '';

        const found = this.currentDepartmentSubcategories.find(
            s => Number(s.id) === Number(this.activeSubcategoryId)
        );

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

    private refreshBreadcrumbs(): void {
        this.rebuildFileManagerBreadcrumb();
    }

    private shouldSkipDepartment(deptName: string): boolean {
        if (!deptName) return false;
        const lower = deptName.toLowerCase();
        return lower.includes('petfood') || lower.includes('pet foot') || lower.includes('petfoot') || lower.includes('pecuario');
    }

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
        this.categoryCards = rootEntities.map((entity, index) => this.toEntityCard(entity, index));
        this.currentEntityId = null;
        this.activeEntityTrail = [];   // en nivel departamento el trail está vacío
        this.viewMode = 'categories';
        this.breadcrumbs = [{ label: dept.department_name, folderId: null, crumbType: 'department', departmentId: dept.department_id }];
        this.brandInfo = null;

        // Pre-cargar subcategorías para cuando se navegue a una entity hoja
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

        // Breadcrumb visual: Departamento > [trail de entities] > Subcategoría > [carpetas]
        const entityCrumbs = this.activeEntityTrail.length > 0
            ? this.activeEntityTrail
            : (this.getBrandDisplayName() || this.activeBrand ? [this.getBrandDisplayName() || this.activeBrand] : []);

        // Build entity crumb items with entityId metadata for correct back-navigation.
        const entityCrumbItems = this.buildEntityCrumbItemsFromTrail(entityCrumbs);

        this.breadcrumbs = [
            ...(departmentLabel ? [{ label: departmentLabel, folderId: null, crumbType: 'department' as const, departmentId }] : []),
            ...entityCrumbItems,
            ...(subcategoryLabel ? [{ label: subcategoryLabel, folderId: null, crumbType: 'subcategory' as const, subcategoryId: this.activeSubcategoryId }] : []),
            ...this.fileManagerFolderTrail.map(f => ({ ...f, crumbType: 'folder' as const }))
        ];

        // Upload path: NUNCA incluye el departamento, parte desde la primera entity
        // PetFood -> NUCAN -> Digital  =>  nucan/digital
        // Pecuario -> Aves -> NUPIO -> Digital  =>  aves/nupio/digital
        const uploadEntityParts = entityCrumbs;
        this.currentBreadcrumbPath = this.buildBreadcrumbPathForUpload(
            uploadEntityParts,
            subcategoryLabel,
            this.currentTreePath
        );
    }

    private ensureSubcategoryContextForBreadcrumb(): void {
        if (!this.activeSubcategoryId) return;
        if (!this.getCurrentDepartmentId()) return;

        // Si ya tenemos nombre, solo reconstruimos por consistencia.
        if (this.resolveSubcategoryDisplayName()) {
            this.rebuildFileManagerBreadcrumb();
            return;
        }

        const departmentId = this.getCurrentDepartmentId();
        if (!departmentId) return;

        this.endPointFilesService.getSubcategoriesByDepartment(departmentId).subscribe({
            next: (resp: SubcategoriesApiResponse) => {
                const subcategories: SubcategoryItem[] = Array.isArray(resp?.data) ? resp.data : [];
                this.currentDepartmentSubcategories = subcategories;

                const resolved = this.resolveSubcategoryDisplayName();
                if (resolved) {
                    this.activeSubcategory = resolved;
                    this.rebuildFileManagerBreadcrumb();
                }
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

    /**
     * Builds BreadcrumbItem array for the entity trail starting from entityId,
     * each crumb carrying its entityId so navigateToBreadcrumb can restore state.
     * Order: root → leaf  (same as buildEntityTrail).
     */
    private buildEntityCrumbItems(entityId: number | null): BreadcrumbItem[] {
        if (!entityId || !this.departmentEntities.length) {
            const name = this.getBrandDisplayName() || this.activeBrand;
            return name ? [{ label: name, folderId: null, crumbType: 'entity', entityId }] : [];
        }

        // Walk up the tree collecting ancestors, then reverse to root→leaf.
        const items: BreadcrumbItem[] = [];
        let current: DepartmentEntityItem | undefined = this.departmentEntities.find(e => e.id === entityId);

        while (current) {
            items.unshift({ label: current.name, folderId: null, crumbType: 'entity', entityId: current.id });
            const parentId = current.parent_entity_id;
            current = parentId != null ? this.departmentEntities.find(e => e.id === parentId) : undefined;
        }

        return items;
    }

    /**
     * Maps an already-computed string trail to BreadcrumbItems with entityId metadata.
     * Used when we only have the names (e.g. after entering file manager).
     */
    private buildEntityCrumbItemsFromTrail(trail: string[]): BreadcrumbItem[] {
        return trail.map(name => {
            const entity = this.departmentEntities.find(
                e => this.normalizeText(e.name) === this.normalizeText(name)
            );
            return {
                label: name,
                folderId: null,
                crumbType: 'entity' as const,
                entityId: entity?.id ?? null
            };
        });
    }

    /**
     * Construye el trail de nombres de entity desde entityId hasta la raíz,
     * excluyendo el departamento. Orden: raíz → hoja.
     * Ej: NUPIO (id=18, parent=Aves id=8) => ['Aves', 'NUPIO']
     * Ej: NUCAN (id=2, parent=null)        => ['NUCAN']
     */
    private buildEntityTrail(entityId: number | null): string[] {
        if (!entityId || !this.departmentEntities.length) {
            // Fallback: usar activeBrand si existe
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
        return (pathValue || '')
            .split('/')
            .map(p => (p || '').trim())
            .filter(Boolean);
    }

    private buildTreeFromPathItems(items: any[]): FolderTreeNode {
        const root: FolderTreeNode = {
            id: 0,
            name: '__root__',
            fullPath: '',
            folders: [],
            files: []
        };

        const subcategorySlug = this.getSubcategorySlug();

        for (const rawItem of items) {
            const itemPath = (
                rawItem?.path ||
                rawItem?.folder_path ||
                rawItem?.s3_key ||
                rawItem?.key ||
                ''
            ).toString().trim();

            const parts = this.extractPathParts(itemPath);
            const fileLikeName = (
                rawItem?.name ||
                rawItem?.file_name ||
                rawItem?.title ||
                rawItem?.hidden_file ||
                ''
            ).toString().trim();

            const isFolder = this.isFolderItem(rawItem);

            // Si no hay path usable: fallback en raíz
            if (!parts.length) {
                if (isFolder) {
                    this.ensureFolderNode(root, fileLikeName || 'Carpeta');
                } else {
                    root.files.push(this.toFileItem(rawItem));
                }
                continue;
            }

            const subIndex = subcategorySlug ? parts.findIndex(p => this.slugifyPathPart(p) === subcategorySlug) : -1;
            const relativeParts = subIndex >= 0 ? parts.slice(subIndex + 1) : [];

            // Si no se encontró subcategoría o queda vacío => elemento directo en raíz de subcategoría
            if (relativeParts.length === 0) {
                if (isFolder) {
                    this.ensureFolderNode(root, fileLikeName || parts[parts.length - 1] || 'Carpeta');
                } else {
                    root.files.push(this.toFileItem(rawItem));
                }
                continue;
            }

            let currentNode = root;

            if (isFolder) {
                // carpeta: todo relativeParts es ruta de carpetas
                for (const segment of relativeParts) {
                    currentNode = this.ensureFolderNode(currentNode, segment);
                }
            } else {
                // archivo: tomar nombre real desde metadata o s3_key y evitar crear carpeta con nombre de archivo
                const mappedFile = this.toFileItem(rawItem);
                const effectiveFileName = (mappedFile.name || fileLikeName || '').toString().trim();
                const effectiveFileSlug = this.slugifyPathPart(effectiveFileName);
                const lastSegment = relativeParts[relativeParts.length - 1] || '';
                const lastSegmentSlug = this.slugifyPathPart(lastSegment);

                const parents = effectiveFileSlug && effectiveFileSlug === lastSegmentSlug
                    ? relativeParts.slice(0, -1)
                    : relativeParts.slice(0, -1);

                for (const segment of parents) {
                    currentNode = this.ensureFolderNode(currentNode, segment);
                }

                if (!mappedFile.name || mappedFile.name === 'Archivo') {
                    mappedFile.name = effectiveFileName || lastSegment || 'Archivo';
                }

                currentNode.files.push(mappedFile);
            }
        }

        return root;
    }

    private ensureFolderNode(parent: FolderTreeNode, folderName: string): FolderTreeNode {
        const normalized = this.slugifyPathPart(folderName || '');
        let found = parent.folders.find(f => this.slugifyPathPart(f.name) === normalized);

        if (!found) {
            found = {
                id: Math.floor(Math.random() * 1000000000),
                name: folderName || 'Carpeta',
                fullPath: parent.fullPath ? `${parent.fullPath}/${folderName}` : folderName,
                folders: [],
                files: []
            };
            parent.folders.push(found);
        }

        return found;
    }

    private buildBreadcrumbPathForUpload(
        entityParts: string[],
        subcategory: string,
        folderTrail: string[] = []
    ): string {
        // entityParts: trail de entity names (sin departamento)
        // subcategory: nombre de la subcategoría activa
        // folderTrail: carpetas abiertas dentro del file manager
        const parts = [...entityParts, subcategory]
            .map(v => (v || '').trim())
            .filter(Boolean)
            .map(v => this.slugifyPathPart(v))
            .filter(Boolean);

        const folderParts = (folderTrail || [])
            .map(v => (v || '').trim())
            .filter(Boolean)
            .map(v => this.slugifyPathPart(v))
            .filter(Boolean);

        return [...parts, ...folderParts].join('/');
    }

    getUploadBreadcrumbPath(): string {
        return this.currentBreadcrumbPath;
    }

    beforeUpload = (file: File): boolean => {

        this.file = file;

        // opcional: autocompletar título si está vacío
        if (!this.uploadForm.value.title) {
            this.uploadForm.patchValue({
                title: file.name
            });
        }

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

        // Validación específica para archivo
        if (tipo === 'file' && !this.file) {
            this.message.warning('No hay archivo seleccionado.');
            return;
        }

        if (tipo === 'file') {
            // ── SUBIR ARCHIVO ──────────────────────────────────────
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
                next: (resp: any) => {
                    console.log('Archivo subido', resp);
                    this.onSuccess('Archivo subido correctamente.');
                },
                error: (error: any) => {
                    console.error('Error', error);
                    this.message.error('Error al subir el archivo.');
                }
            });

        } else {
            // ── CREAR CARPETA ──────────────────────────────────────
            const payload = {
                title: this.uploadForm.value.title,
                description: this.uploadForm.value.description,
                // tags: this.uploadForm.value.tags,
                path: uploadPath + '/' + this.slugifyPathPart(this.uploadForm.value.title),
                entity_id: brandId,
                subcategory_id: subcategoryId,
                id_country: 1
            };

            this.service.createFolder(payload).subscribe({
                next: (resp: any) => {
                    console.log('Carpeta creada', resp);
                    this.onSuccess('Carpeta creada correctamente.');
                },
                error: (error: any) => {
                    console.error('Error', error);
                    this.message.error('Error al crear la carpeta.');
                }
            });
        }
    }


    private onSuccess(mensaje: string): void {
        this.modalRef.close();
        if (this.activeSubcategoryId) {
            this.loadFilesBySubcategory();
        } else {
            this.loadCurrentLevel();
        }
        this.message.success(mensaje);
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


    private loadImagePreviews(files: FileItem[]): void {
        files.forEach(file => {
            if (this.isImageType(file.type) && !file.url) {
                this.endPointUsersService.getContentPreviewUrl(file.id).subscribe({
                    next: (resp: any) => {
                        const previewUrl = (resp?.preview_url || resp?.url || '').toString().trim();
                        if (previewUrl) {
                            file.url = previewUrl;
                        }
                    },
                    error: () => { }
                });
            }
        });
    }
}