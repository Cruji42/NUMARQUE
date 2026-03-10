import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ThemeConstantService } from '../../shared/services/theme-constant.service';
import { AppsService } from '../../shared/services/apps.service';
import { NzContextMenuService, NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown'

import { FileNode } from '../../shared/interfaces/files.interfaces';
import { FilesService } from '../../core/service/files.service';
import { UsersService } from '../../core/service/users.service';
import { error } from 'protractor';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BrandsService } from 'src/app/core/service/brands.service';
import { NzModalRef } from 'ng-zorro-antd/modal';



@Component({
    templateUrl: './file-manager.component.html',
    standalone: false,
    styles: ['./file-manager.component.scss']
})

export class FileManagerComponent {

    // files : Files[];
    // user: any;

    uploadForm!: FormGroup;
    file!: File;
    catBrands: any[] = [];

    modalRef!: NzModalRef;


    rootTree: FileNode[] = [];        // Todo el árbol
    currentNodes: FileNode[] = [];    // Lo que estoy viendo
    breadcrumb: FileNode[] = [];
    selectedItem: any = null;

    themeColors = this.colorConfig.get().colors;
    selectedFile: string = '';
    listView: boolean = false;
    isDetailsOpen: boolean = false;
    isNavOpen: boolean = false;

    colorRed = this.themeColors.red;
    colorBlue = this.themeColors.blue;
    colorCyan = this.themeColors.cyan;
    colorGold = this.themeColors.gold;
    colorVolcano = this.themeColors.volcano;
    colorPurple = this.themeColors.purple;
    // file!: File;

    @ViewChild('tplTitle') tplTitle!: TemplateRef<any>;
    @ViewChild('tplContent') tplContent!: TemplateRef<any>;
    @ViewChild('tplFooter') tplFooter!: TemplateRef<any>



    constructor(
        private colorConfig: ThemeConstantService,
        private fileManagerSvc: AppsService,
        private nzContextMenuService: NzContextMenuService,
        private service: FilesService,
        private serviceUser: UsersService,
        private fb: FormBuilder,
        private modal: NzModalService,
        private brandService: BrandsService
    ) {
    }

    ngOnInit(): void {
        this.getDirs()
        this.getBrandData();

        this.uploadForm = this.fb.group({

            title: [''],
            description: [''],
            tags: [[]],
            path: ['/'],
            brand_id: [],
            category_id: [1]

        });

    }

    getDirs(restorePath: boolean = false) {

        this.service.getDirMenu().subscribe({
            next: (data) => {

                this.rootTree = this.decorateNodes(data[0].sublevel);

                if (restorePath) {
                    this.restoreNavigation();
                } else {
                    this.currentNodes = this.rootTree;
                }

            },
            error: (err) => {
                console.log(err)
            }
        });
    }

    openFolder(folder: FileNode) {

        if (!folder.is_dir) return;

        this.breadcrumb.push(folder);
        this.currentNodes = folder.sublevel as FileNode[];
    }

    navigateTo(index: number) {

        // console.log('si entra')
        // Si clic en "Root"
        if (index === -1) {
            this.currentNodes = this.rootTree;
            this.breadcrumb = [];
            return;
        }

        const selectedFolder = this.breadcrumb[index];
        this.currentNodes = selectedFolder.sublevel as FileNode[];

        // Cortamos el breadcrumb hasta donde hicieron click
        this.breadcrumb = this.breadcrumb.slice(0, index + 1);
    }

    getExtension(filename: string): string {
        if (!filename) return '';

        const parts = filename.split('.');
        return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
    }

    getFileType(filename: string): string {

        const ext = this.getExtension(filename);

        const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
        const pdfTypes = ['pdf'];
        const wordTypes = ['doc', 'docx'];
        const excelTypes = ['xls', 'xlsx'];
        const pptTypes = ['ppt', 'pptx'];
        const textTypes = ['txt'];

        if (imageTypes.includes(ext)) return 'image';
        if (pdfTypes.includes(ext)) return 'pdf';
        if (wordTypes.includes(ext)) return 'doc';
        if (excelTypes.includes(ext)) return 'xls';
        if (pptTypes.includes(ext)) return 'ppt';
        if (textTypes.includes(ext)) return 'txt';

        return 'default';
    }

    decorateNodes(nodes: FileNode[]): any[] {
        return nodes.map(node => ({
            ...node,
            fileType: node.is_dir ? 'folder' : this.getFileType(node.name),
            sublevel: Array.isArray(node.sublevel)
                ? this.decorateNodes(node.sublevel)
                : []
        }));
    }

    downloadFile() {
        console.log(this.selectedItem)
        this.service.downloadFile(this.selectedItem.id).subscribe({
            next: (url: any) => {
                console.log(url)
            }, error: (err: any) => {
                console.log(err)
            }
        })

    }
    changeView() {
        this.listView = !this.listView;
    }

    contextMenu(event: MouseEvent, menu: NzDropdownMenuComponent, item: any): void {
        event.preventDefault();

        this.selectedItem = item;   // 🔥 guardamos TODO el objeto
        this.nzContextMenuService.create(event, menu);
    }

    selectFile(selected: string) {
        this.selectedFile = selected;
        this.isDetailsOpen = true;
    }

    unselectFile() {
        this.selectedFile = '';
    }

    close(): void {
        this.nzContextMenuService.close();
    }

    closeContentDetails() {
        this.isDetailsOpen = false;
    }

    navToggler() {
        this.isNavOpen = !this.isNavOpen;
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

        if (!this.file) {
            console.log('No hay archivo seleccionado');
            return;
        }

        const formData = new FormData();

        console.log('Archivo seleccionado:', this.file);
        console.log('Datos del formulario:', this.uploadForm.value);

        formData.append('file', this.file);
        formData.append('title', this.uploadForm.value.title);
        formData.append('description', this.uploadForm.value.description);
        formData.append('tags', this.uploadForm.value.tags);
        formData.append('path', this.uploadForm.value.path);
        formData.append('category_id', this.uploadForm.value.category_id);
        formData.append('brand_id', this.uploadForm.value.brand_id);

        console.log('Datos enviados:', formData);

        this.service.uploadFile(formData)
            .subscribe({
                next: (resp: any) => {

                    console.log('Archivo subido', resp);

                    this.modalRef.close();   // cerrar modal

                    this.getDirs(true);      // recargar árbol y mantener ruta

                },
                error: (error: any) => {
                    console.error('Error', error);
                }
            });

    }



    openUploadModal(): void {


        const path = this.buildCurrentPath();

        this.uploadForm.patchValue({
            path: path
        });

        this.modalRef = this.modal.create({
            nzTitle: this.tplTitle,
            nzContent: this.tplContent,
            nzFooter: this.tplFooter,
            nzWidth: 600,
            nzMaskClosable: false
        });


    }

    preventOpen(open: boolean): void {
        if (open) {
            setTimeout(() => {
                const dropdown = document.querySelector('.ant-select-dropdown') as HTMLElement;
                if (dropdown) {
                    dropdown.style.display = 'none';
                }
            });
        }
    }

    getBrandData() {
        // Use the UsersService to fetch user data
        this.brandService.getBrands().subscribe({
            next: (brands) => {
                // console.log('Fetched users:', brands);
                this.catBrands = brands

            },
            error: (error) => {
                console.error('Error fetching users:', error);
            }
        })
    }


    buildCurrentPath(): string {

        if (this.breadcrumb.length === 0) {
            return '/';
        }

        return this.breadcrumb
            .map(folder => folder.name)
            .join('/');
    }

    restoreNavigation(): void {

        if (this.breadcrumb.length === 0) {
            this.currentNodes = this.rootTree;
            return;
        }

        let nodes = this.rootTree;

        for (const folder of this.breadcrumb) {

            const found = nodes.find(n => n.name === folder.name);

            if (found) {
                nodes = found.sublevel as FileNode[];
            }
        }

        this.currentNodes = nodes;
    }
}