import { SideNavInterface } from '../../interfaces/side-nav.type';


/**
 * ROUTES contiene únicamente las secciones **estáticas** del menú.
 *
 * Las secciones dinámicas (PetFood, Pecuario, Institucional y cualquier
 * departamento futuro) se construyen en tiempo de ejecución a partir de la
 * respuesta del API mediante `SideNavMenuService.getMenuItems()`.
 */
export const ROUTES: SideNavInterface[] = [
    // ----------------------------------------------------------------
    // General — sección estática, siempre visible
    // ----------------------------------------------------------------
    {
        path: '',
        title: 'General',
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: 'home',
        canAccess: [1, 2, 3],
        submenu: [
            {
                path: '/dashboard/welcome',
                title: 'Inicio',
                iconType: 'nzIcon',
                icon: 'home',
                iconTheme: '',
                canAccess: [1, 2, 3],
                submenu: []
            },
            {
                path: '/home',
                title: 'Búsqueda',
                iconType: 'nzIcon',
                icon: 'search',
                iconTheme: '',
                canAccess: [1, 2, 3],
                submenu: []
            },
            {
                path: '/dashboard',
                title: 'Dashboard',
                iconType: 'nzIcon',
                icon: 'dashboard',
                iconTheme: '',
                canAccess: [1],
                submenu: []
            },
            {
                path: '/apps/e-commerce/orders-list',
                title: 'Usuarios',
                iconType: 'nzIcon',
                icon: 'ordered-list',
                iconTheme: 'outline',
                canAccess: [1],
                submenu: []
            },
            {
                path: '/pages/setting',
                title: 'Perfil',
                iconType: 'nzIcon',
                icon: 'user',
                iconTheme: 'outline',
                canAccess: [1, 2, 3],
                submenu: []
            }
        ]
    }
];