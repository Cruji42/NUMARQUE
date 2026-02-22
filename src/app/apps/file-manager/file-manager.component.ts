import { Component, TemplateRef } from '@angular/core';
import { ThemeConstantService } from '../../shared/services/theme-constant.service';
import { AppsService } from '../../shared/services/apps.service';
import { NzContextMenuService, NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown'

import { FileNode } from '../../shared/interfaces/files.interfaces';
import { FilesService } from '../../core/service/files.service';
import { UsersService } from '../../core/service/users.service';
import { error } from 'protractor';

@Component({
    templateUrl: './file-manager.component.html',
    standalone: false,
    styles: ['./file-manager.component.scss']
})

export class FileManagerComponent {

    // files : Files[];
    // user: any;


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



    constructor(
        private colorConfig: ThemeConstantService,
        private fileManagerSvc: AppsService,
        private nzContextMenuService: NzContextMenuService,
        private service: FilesService,
        private serviceUser: UsersService
    ) {
    }

    ngOnInit(): void {
        this.getDirs()

    }

    getDirs() {
        this.service.getDirMenu().subscribe({
            next: (data) => {
                this.rootTree = this.decorateNodes(data[0].sublevel);
                this.currentNodes = this.rootTree;
                console.log(this.currentNodes)
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

    downloadFile(){
        console.log(this.selectedItem)
        this.service.downloadFile(this.selectedItem.id).subscribe( {
            next: (url:any) =>{
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
}