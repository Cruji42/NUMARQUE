import { SideNavInterface } from '../../interfaces/side-nav.type';

/**
 * ROUTES contiene únicamente las secciones **estáticas** del menú.
 *
 * Las secciones dinámicas (PetFood, Pecuario, Institucional y cualquier
 * departamento futuro) se construyen en tiempo de ejecución a partir de la
 * respuesta del API mediante `SideNavMenuService.getMenuItems()`.
 */
export const ROUTES: SideNavInterface[] = [
    {
        path: '',
        title: 'MENU.SIDENAV.GENERAL',   // ← antes: 'General'
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: 'home',
        canAccess: [1, 2, 3],
        submenu: [
            {
                path: '/welcome',
                title: 'MENU.SIDENAV.HOME',       // ← antes: 'Inicio'
                iconType: 'nzIcon',
                icon: 'home',
                iconTheme: '',
                canAccess: [1, 2, 3],
                submenu: []
            },
            {
                path: '/search',
                title: 'MENU.SIDENAV.SEARCH',     // ← antes: 'Búsqueda'
                iconType: 'nzIcon',
                icon: 'search',
                iconTheme: '',
                canAccess: [1, 2, 3],
                submenu: []
            },
            {
                path: '/dashboard',
                title: 'MENU.SIDENAV.DASHBOARD',  // ← antes: 'Dashboard'
                iconType: 'nzIcon',
                icon: 'dashboard',
                iconTheme: '',
                canAccess: [1],
                submenu: []
            },
            {
                path: '/users',
                title: 'MENU.SIDENAV.USERS',      // ← antes: 'Usuarios'
                iconType: 'nzIcon',
                icon: 'ordered-list',
                iconTheme: 'outline',
                canAccess: [1],
                submenu: []
            },
            {
                path: '/pages/setting',
                title: 'MENU.SIDENAV.PROFILE',    // ← antes: 'Perfil'
                iconType: 'nzIcon',
                icon: 'user',
                iconTheme: 'outline',
                canAccess: [1, 2, 3],
                submenu: []
            },
            {
                path: '/pages/category-view?favorites=true',
                title: 'MENU.SIDENAV.FAVORITES',  // ← antes: 'Favoritos'
                iconType: 'nzIcon',
                icon: 'star',
                iconTheme: 'outline',
                canAccess: [1, 2, 3],
                submenu: []
            }
        ]
    }
];