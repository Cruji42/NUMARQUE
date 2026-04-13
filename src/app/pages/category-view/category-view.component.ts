import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, ViewContainerRef, ElementRef } from '@angular/core';
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

    @ViewChild('tplContent', { static: true }) tplContent!: TemplateRef<any>;
    @ViewChild('tplFooter', { static: true }) tplFooter!: TemplateRef<any>;
    @ViewChild('fileInputRef') fileInputRef?: ElementRef<HTMLInputElement>;

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
                    this.activeSubcategoryId = this.parseNumberParam(params.get('subcategoryId'));
                    this.activeBrand = params.get('brand') || '';
                    // this.activeSection     = params.get('section')     || '';
                    this.activeSubcategory = params.get('subcategory') || '';

                    if (this.activeBrandId) {
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
            tags: [[], ]
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
            ...(this.activeSection ? [{ label: this.activeSection, folderId: null }] : []),
            ...(this.activeSubcategory ? [{ label: this.activeSubcategory, folderId: null }] : []),
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

                // Sin section/subcategory (ni ids) → mostrar cards de subcategorías directamente
                if (!this.activeSection && !this.activeSubcategory && !this.activeSectionId && !this.activeSubcategoryId) {
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
                brandId: this.activeBrandId || this.getDepartmentIdByBrand(this.activeBrand),
                sectionId: card.nodeId || this.activeSectionId || null,
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
        const baseCount = this.getBaseBreadcrumbCount();

        if (index === 0) {
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { brandId: this.activeBrandId || this.getDepartmentIdByBrand(this.activeBrand) },
            });
            return;
        }

        if (this.viewMode === 'files' && !this.activeSubcategoryId) {
            if (index === 1) {
                this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams: {
                        brandId: this.activeBrandId || this.getDepartmentIdByBrand(this.activeBrand),
                        sectionId: this.activeSectionId
                    },
                });
                return;
            }
            if (index === 2) {
                this.currentFolderId = null;
                this.fileManagerFolderTrail = [];
                this.searchQuery = '';
                this.refreshBreadcrumbs();
                this.loadCurrentLevel();
                return;
            }
        }

        if (index < baseCount) {
            this.fileManagerFolderTrail = [];
            this.currentFolderId = null;
            this.currentTreePath = [];
            this.searchQuery = '';
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

        const folderTrailIndex = index - baseCount;
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
        console.log('Archivo seleccionado:', this.selectedFile);
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
        this.message.info(`Enlace de "${file.name}" copiado al portapapeles`);
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
        if (!this.selectedContextItem) {
            this.closeContextMenu();
            return;
        }

        const name = (this.selectedContextItem as any)?.name || 'ítem';
        this.message.info(`Renombrar "${name}" (pendiente integración API).`);
        this.closeContextMenu();
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
            name: (item?.name || item?.folder_name || item?.title || item?.hidden_file || 'Carpeta').toString(),
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
            name: (item?.name || item?.file_name || item?.title || nameFromKey || item?.hidden_file || 'Archivo').toString(),
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
            url: (item?.url || item?.file_url || item?.download_url || '').toString() || undefined
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
        const brandLabel = this.getBrandDisplayName() || this.activeBrand || '';
        const sectionLabel = this.activeSection || '';
        const subcategoryLabel = this.resolveSubcategoryDisplayName();

        return [
            departmentLabel,
            brandLabel,
            sectionLabel,
            subcategoryLabel
        ].filter(v => (v || '').trim().length > 0).length;
    }

    private refreshBreadcrumbs(): void {
        this.rebuildFileManagerBreadcrumb();
    }

    private rebuildFileManagerBreadcrumb(): void {
        const departmentLabel = this.getCurrentDepartmentName();
        const brandLabel = this.getBrandDisplayName() || this.activeBrand || '';
        const sectionLabel = this.activeSection || '';
        const subcategoryLabel = this.resolveSubcategoryDisplayName();

        this.breadcrumbs = [
            ...(departmentLabel ? [{ label: departmentLabel, folderId: null }] : []),
            ...(brandLabel ? [{ label: brandLabel, folderId: null }] : []),
            ...(sectionLabel ? [{ label: sectionLabel, folderId: null }] : []),
            ...(subcategoryLabel ? [{ label: subcategoryLabel, folderId: null }] : []),
            ...this.fileManagerFolderTrail
        ];

        this.currentBreadcrumbPath = this.buildBreadcrumbPathForUpload(
            departmentLabel,
            brandLabel,
            sectionLabel,
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
        department: string,
        brand: string,
        section: string,
        subcategory: string,
        folderTrail: string[] = []
    ): string {
        const parts = [department, brand, section, subcategory]
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
                link.download = file.name; // opcional (el backend define el nombre)
                // link.target = '_blank'; // opcional
                link.click();

            }, error: (err: any) => {
                console.log(err)
            }
        })

    }
}
