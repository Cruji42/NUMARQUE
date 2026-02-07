import { Component, OnInit, Input, TemplateRef, ViewContainerRef, ViewChild } from '@angular/core';
import { TableService } from '../../../shared/services/table.service';
import { NzTableFilterFn, NzTableFilterList, NzTableSortFn, NzTableSortOrder } from 'ng-zorro-antd/table';
import { UsersService } from '../../../core/service/users.service';




import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';

interface DataItem {
    id: number;
    name: string;
    date: string;
    amount: number;
    status: string;
}

@Component({
    templateUrl: './orders-list.component.html',
    standalone: false
})

export class OrdersListComponent implements OnInit {

    allChecked: boolean = false;
    indeterminate: boolean = false;
    displayData = [];
    searchInput: string


    @ViewChild('tplTitle', { static: true }) tplTitle!: TemplateRef<any>;
    @ViewChild('tplContent', { static: true }) tplContent!: TemplateRef<any>;
    @ViewChild('tplFooter', { static: true }) tplFooter!: TemplateRef<any>;

    roleList = [
        { text: 'Administrador', value: '1' },
        { text: 'Vendedor', value: '2' },
        { text: 'Cliente', value: '3' },
    ];

    orderColumn = [
        {
            title: 'ID',
            compare: (a: DataItem, b: DataItem) => a.id - b.id,
        },
        {
            title: 'Usuario',
            compare: (a: DataItem, b: DataItem) => a.name.localeCompare(b.name)
        },
        {
            title: 'Fecha de registro',
            compare: (a: DataItem, b: DataItem) => a.name.localeCompare(b.name)
        },
        {
            title: 'Compañia',
            compare: (a: DataItem, b: DataItem) => a.amount - b.amount,
        },
        {
            title: 'Marcas',
            compare: (a: DataItem, b: DataItem) => a.name.localeCompare(b.name)
        },
        {
            title: 'Rol',
            compare: (a: DataItem, b: DataItem) => a.amount - b.amount,
        },
        {
            title: 'Estatus',
            compare: (a: DataItem, b: DataItem) => a.name.localeCompare(b.name)
        },
        {
            title: 'Opciones'
        }
    ]

    ordersList = [
        {
            id: 5331,
            name: 'Erin Gonzales',
            avatar: 'assets/images/avatars/thumb-1.jpg',
            date: '8 May 2019',
            amount: 137,
            status: 'approved',
            checked: false
        },
        {
            id: 5375,
            name: 'Darryl Day',
            avatar: 'assets/images/avatars/thumb-2.jpg',
            date: '6 May 2019',
            amount: 322,
            status: 'approved',
            checked: false
        },
        {
            id: 5762,
            name: 'Marshall Nichols',
            avatar: 'assets/images/avatars/thumb-3.jpg',
            date: '1 May 2019',
            amount: 543,
            status: 'approved',
            checked: false
        },
        {
            id: 5865,
            name: 'Virgil Gonzales',
            avatar: 'assets/images/avatars/thumb-4.jpg',
            date: '28 April 2019',
            amount: 876,
            status: 'pending',
            checked: false
        },
        {
            id: 5213,
            name: 'Nicole Wyne',
            avatar: 'assets/images/avatars/thumb-5.jpg',
            date: '28 April 2019',
            amount: 241,
            status: 'approved',
            checked: false
        },
        {
            id: 5311,
            name: 'Riley Newman',
            avatar: 'assets/images/avatars/thumb-6.jpg',
            date: '19 April 2019',
            amount: 872,
            status: 'rejected',
            checked: false
        },
        {
            id: 5387,
            name: 'Pamela Wanda',
            avatar: 'assets/images/avatars/thumb-7.jpg',
            date: '18 April 2019',
            amount: 728,
            status: 'approved',
            checked: false
        },
        {
            id: 5390,
            name: 'Pamela Wanda',
            avatar: 'assets/images/avatars/thumb-7.jpg',
            date: '16 April 2019',
            amount: 802,
            status: 'pending',
            checked: false
        },
        {
            id: 5317,
            name: 'Lilian Stone',
            avatar: 'assets/images/avatars/thumb-8.jpg',
            date: '12 April 2019',
            amount: 569,
            status: 'approved',
            checked: false
        },
        {
            id: 5291,
            name: 'Victor Terry',
            avatar: 'assets/images/avatars/thumb-9.jpg',
            date: '10 April 2019',
            amount: 132,
            status: 'approved',
            checked: false
        },
        {
            id: 5288,
            name: 'Wilma Young',
            avatar: 'assets/images/avatars/thumb-10.jpg',
            date: '8 April 2019',
            amount: 528,
            status: 'rejected',
            checked: false
        },
        {
            id: 5301,
            name: 'Jane Wilson',
            avatar: 'assets/images/avatars/thumb-11.jpg',
            date: '8 April 2019',
            amount: 632,
            status: 'approved',
            checked: false
        },
        {
            id: 5355,
            name: 'Evelyn Silva',
            avatar: 'assets/images/avatars/thumb-12.jpg',
            date: '6 April 2019',
            amount: 987,
            status: 'approved',
            checked: false
        },
    ]

    ngOnInit(): void {
        this.getUsersData();
    }


    constructor(private tableSvc: TableService, private service: UsersService, private modal: NzModalService, private viewContainerRef: ViewContainerRef) {
        // this.displayData = this.ordersList
    }

    getUsersData() {
        // Use the UsersService to fetch user data
        this.service.getUsers().subscribe({
            next: (users) => {
                console.log('Fetched users:', users);
                this.displayData = users;
                this.displayData.forEach((user: any) => {
                    // Map roles based on role_id
                    this.roleList.find((role: any) => {
                        // console.log('Comparing role:', role.value, 'with user role_id:', user.role_id);
                        if (role.value === user.role_id) {
                            // console.log('Match found for user:', user, 'with role:', role);
                            user.role_label = role.text;
                            return true; // Exit the loop early
                        }
                    })
                    //  role.value === user.role_id)?.text; 
                    // console.log('User role label:', user.role_label)
                })
            },
            error: (error) => {
                console.error('Error fetching users:', error);
            }
        })
    }


    search() {
        const data = this.ordersList
        this.displayData = this.tableSvc.search(this.searchInput, data)
    }


    // createTplModal(tplTitle: TemplateRef<{}>, tplContent: TemplateRef<{}>, tplFooter: TemplateRef<{}>): void {
    //     this.modal.create({
    //         nzTitle: tplTitle,
    //         nzContent: tplContent,
    //         nzFooter: tplFooter,
    //         nzMaskClosable: false,
    //         nzClosable: false,
    //         nzData: {
    //             value: 'Template Context'
    //         },
    //         nzOnOk: () => console.log('Click ok')
    //     });
    // }


openEditModal(item: any): void {
  console.log('ITEM QUE SE ENVÍA:', item);

  this.modal.create({
    nzTitle: 'Información de usuario',
    nzContent: this.tplContent,
    nzFooter: this.tplFooter,
    nzViewContainerRef: this.viewContainerRef,
    nzData: {
      item
    },
    nzMaskClosable: false,
    nzClosable: false
  });
}






}    