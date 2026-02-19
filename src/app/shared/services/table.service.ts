import { Injectable } from '@angular/core';
import { formatDate } from '@angular/common';

@Injectable()
export class TableService {

    deepCopy(object: any | any[]) {
        return JSON.parse(JSON.stringify(object));
    }

    /**
     * sort array via single
     * @param sortAttribute {key: property of the object, value: 'ascend' or 'descend'}
     * @param inputData
     */
    sort(sortAttribute: { key: string, value: string }, inputData: any[]) {
        const dataArr = this.deepCopy(inputData);
        if (sortAttribute.key === '' || sortAttribute.value === null) {
            return dataArr;
        }

        let outputDataList = dataArr.sort((a, b) => {
            const isAsc = sortAttribute.value === 'ascend';
            switch (sortAttribute.key) {
                case sortAttribute.key:
                    return this.compare(
                        typeof a[sortAttribute.key] !== "string" ? a[sortAttribute.key] : a[sortAttribute.key].toUpperCase(),
                        typeof b[sortAttribute.key] !== "string" ? b[sortAttribute.key] : b[sortAttribute.key].toUpperCase(), isAsc
                    );
                default:
                    return 0;
            }
        });
        return outputDataList;
    }

    /**
     * Wild card search on all property of the object
     * @param input
     * @param inputData
     */
    search(input: any, inputData: any[]) {
        if (!input) return inputData;

        const term = input.toString().toUpperCase();

        const searchText = (item: any): boolean => {

            /* =========================
               1️⃣ BUSCAR EN TODO EL OBJETO
               ========================= */
            for (const key in item) {
                const value = item[key];

                if (value == null) continue;

                // 🔢 números / timestamps
                if (typeof value === 'number') {
                    if (value.toString().includes(term)) {
                        return true;
                    }
                    continue;
                }

                // 📅 strings (incluye created_at crudo)
                if (
                    value.toString().toUpperCase().includes(term)
                ) {
                    return true;
                }
            }

            /* =========================
               2️⃣ CAMPOS DERIVADOS / TABLA
               ========================= */

            // 📅 Fecha formateada
            if (item.created_at) {
                const date = formatDate(item.created_at, 'dd/MM/yyyy', 'en');
                if (date.includes(term)) return true;
            }

            // 🏷️ Brands (array → string)
            if (Array.isArray(item.brands)) {
                const brands = item.brands
                    .map(b => b.name)
                    .join(' ')
                    .toUpperCase();

                if (brands.includes(term)) return true;
            }

            // 👤 Rol (id → label)
            if (item.role_id != null) {
                const role =
                    item.role_id === 1 ? 'ADMINISTRADOR' : 'USUARIO';

                if (role.includes(term)) return true;
            }

            // 🟢 Estatus cuenta
            if (item.account_status) {
                if (
                    item.account_status.toUpperCase().includes(term)
                ) {
                    return true;
                }
            }

            return false;
        };

        return inputData.filter(item => searchText(item));
    }
    /**
     * if isAsc is true
     * a > b    = 1
     * a === b  = 0
     * a < b    = -1
     *
     * if isAsc is false
     * a > b    = -1
     * a === b  = 0
     * a < b    = 1
     *
     * @param a
     * @param b
     * @param isAsc
     */
    private compare(a, b, isAsc: boolean) {
        // null value is - (dash)
        if (!a) a = '-';
        if (!b) b = '-';

        if (a === b) return 0;

        return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    }
}

// Usage


// import { Component } from '@angular/core';
// import { NzTableService } from 'ifast-ui-ng-framework/publish';

// @Component({
//     selector: 'nz-demo-table-default-filter',
//     template: `
//         <div class="ant-quick-search">
//             <input nz-input placeholder="Search" id="searchText" (input)="search()">
//         </div>
//         <nz-table #instantFilterTable [nzData]="displayData">
//             <thead (nzSortChange)="sort($event)" nzSingleSort>
//                 <tr>
//                     <th nzShowSort nzSortKey="name">Name</th>
//                     <th nzShowSort nzSortKey="age">Age</th>
//                     <th nzShowSort nzSortKey="address">Address</th>
//                     <th>Action</th>
//                 </tr>
//             </thead>
//             <tbody>
//                 <tr *ngFor="let data of instantFilterTable.data ">
//                     <td>{{data.name}}</td>
//                     <td>{{data.age}}</td>
//                     <td>{{data.address}}</td>
//                     <td>
//                         <a>Action 一 {{data.name}}</a>
//                         <nz-divider nzType="vertical"></nz-divider>
//                         <a>Delete</a>
//                     </td>
//                 </tr>
//             </tbody>
//         </nz-table>
//     `
// })

// export class NzDemoTableDefaultFilterComponent {

//     displayData = []

//     dataSet = [
//         {
//             key    : '1',
//             name   : 'John Brown',
//             age    : 32,
//             address: 'New York No. 1 Lake Park'
//         },
//         {
//             key    : '2',
//             name   : 'Jim Green',
//             age    : 42,
//             address: 'London No. 1 Lake Park'
//         },
//         {
//             key    : '3',
//             name   : 'Joe Black',
//             age    : 32,
//             address: 'Sidney No. 1 Lake Park'
//         }
//     ];

//     constructor(private tableService: NzTableService) {
//         this.displayData = this.dataSet;
//     }

//     sort(sortAttribute) {
//         this.displayData = this.tableService.sort(sortAttribute, this.dataSet);
//     }

//     search() {
//         this.displayData = this.dataSet;
//         this.displayData = this.tableService.search((<HTMLInputElement>document.getElementById("searchText")).value, this.displayData);
//     }
// }