import { SideNavInterface } from '../../interfaces/side-nav.type';

// Helper para construir el path de category-view con query params
const cv = (brand: string, section?: string): string => {
    if (section) {
        return `/pages/category-view?brand=${encodeURIComponent(brand)}&section=${encodeURIComponent(section)}`;
    }
    return `/pages/category-view?brand=${encodeURIComponent(brand)}`;
};

// Subcategorías de PetFood — navegan directamente a category-view con brand + section
const petfoodSubmenu = (brand: string): SideNavInterface[] => [
    {
        path: cv(brand, 'ATL'),
        title: 'ATL',
        iconType: 'nzIcon',
        icon: '',
        iconTheme: 'outline',
        canAccess: [1, 2, 3],
        submenu: []
    },
    {
        path: cv(brand, 'DIGITAL'),
        title: 'DIGITAL',
        iconType: 'nzIcon',
        icon: '',
        iconTheme: 'outline',
        canAccess: [1, 2, 3],
        submenu: []
    },
    {
        path: cv(brand, 'TÉCNICO'),
        title: 'TÉCNICO',
        iconType: 'nzIcon',
        icon: '',
        iconTheme: 'outline',
        canAccess: [1, 2, 3],
        submenu: []
    },
    {
        path: cv(brand, 'EVENTOS Y BTL'),
        title: 'EVENTOS Y BTL',
        iconType: 'nzIcon',
        icon: '',
        iconTheme: 'outline',
        canAccess: [1, 2, 3],
        submenu: []
    }
];

export const ROUTES: SideNavInterface[] = [
    // ----------------------------------------------------------------
    // General
    // ----------------------------------------------------------------
    {
        path: '',
        title: 'General',
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: 'home',
        canAccess: [1],
        submenu: [
                        {
                path: '/welcome',
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
                path: '/dashboard/default',
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
            // {
            //     path: '/apps/file-manager',
            //     title: 'File Manager',
            //     iconType: 'nzIcon',
            //     icon: 'file',
            //     iconTheme: '',
            //     canAccess: [1, 2, 3],
            //     submenu: []
            // }
        ]
    },

    // ----------------------------------------------------------------
    // PetFood — cada marca abre el desplegable con sus secciones,
    // y cada sección navega a /pages/category-view?brand=X&section=Y
    // ----------------------------------------------------------------
    {
        path: '',
        title: 'PetFood',
        iconType: 'image',
        iconTheme: '',
        icon: 'assets/images/others/pet-food.svg',
        canAccess: [1, 2, 3],
        submenu: [
            {
                path: cv('NUPEC'),
                title: 'NUPEC',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/brands/logo-nupec.png',
                canAccess: [1, 2, 3],
                submenu: petfoodSubmenu('NUPEC')
            },
            {
                path: cv('NUCAN'),
                title: 'NUCAN',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/brands/logo-nucan.png',
                canAccess: [1, 2, 3],
                submenu: petfoodSubmenu('NUCAN')
            },
            {
                path: cv('NUCAT'),
                title: 'NUCAT',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/brands/logo-nucat.png',
                canAccess: [1, 2, 3],
                submenu: petfoodSubmenu('NUCAT')
            },
            {
                path: cv('NUFIT'),
                title: 'NUFIT',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/brands/logo-nufit.png',
                canAccess: [1, 2, 3],
                submenu: petfoodSubmenu('NUFIT')
            },
            {
                path: cv('ÓPTIMO SELECTO'),
                title: 'ÓPTIMO SELECTO',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/brands/logo-optimo-selecto.png',
                canAccess: [1, 2, 3],
                submenu: petfoodSubmenu('ÓPTIMO SELECTO')
            },
            {
                path: cv('ÓPTIMO FELINO'),
                title: 'ÓPTIMO FELINO',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/brands/logo-optimo-felino.png',
                canAccess: [1, 2, 3],
                submenu: petfoodSubmenu('ÓPTIMO FELINO')
            }
        ]
    },

    // ----------------------------------------------------------------
    // Pecuario — cada especie navega directamente a category-view
    // ----------------------------------------------------------------
    {
        path: '',
        title: 'Pecuario',
        iconType: 'image',
        iconTheme: '',
        icon: 'assets/images/others/pecuario.svg',
        canAccess: [1, 2, 3],
        submenu: [
            {
                path: cv('Aves'),
                title: 'Aves',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/species/icono-aves.png',
                canAccess: [1, 2, 3],
                submenu: []
            },
            {
                path: cv('Camarón'),
                title: 'Camarón',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/species/icono-camaron.png',
                canAccess: [1, 2, 3],
                submenu: []
            },
            {
                path: cv('Cerdos'),
                title: 'Cerdos',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/species/icono-cerdos.png',
                canAccess: [1, 2, 3],
                submenu: []
            },
            {
                path: cv('Equinos'),
                title: 'Equinos',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/species/icono-equinos.png',
                canAccess: [1, 2, 3],
                submenu: []
            },
            {
                path: cv('Gallos'),
                title: 'Gallos',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/species/icono-gallos.png',
                canAccess: [1, 2, 3],
                submenu: []
            },
            {
                path: cv('Peces'),
                title: 'Peces',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/species/icono-peces.png',
                canAccess: [1, 2, 3],
                submenu: []
            },
            {
                path: cv('Rumiantes'),
                title: 'Rumiantes',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/species/icono-rumiantes.png',
                canAccess: [1, 2, 3],
                submenu: []
            },
            {
                path: cv('Feed Solutions'),
                title: 'Feed Solutions',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/species/icono-feed-solutions.png',
                canAccess: [1, 2, 3],
                submenu: []
            },
        ]
    },

    // ----------------------------------------------------------------
    // Institucional — cada institución navega directamente a category-view
    // ----------------------------------------------------------------
    {
        path: '',
        title: 'Institucional',
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: 'bank',
        canAccess: [1, 2, 3],
        submenu: [
            {
                path: cv('NUTEC'),
                title: 'NUTEC',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/institutions/icono-institucional.png',
                canAccess: [1, 2, 3],
                submenu: []
            },
            {
                path: cv('INCASARA'),
                title: 'INCASARA',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/institutions/icono-incasara.png',
                canAccess: [1, 2, 3],
                submenu: []
            },
        ]
    }
];