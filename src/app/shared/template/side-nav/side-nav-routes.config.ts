import { SideNavInterface } from '../../interfaces/side-nav.type';

export const ROUTES: SideNavInterface[] = [
    {
        path: '',
        title: 'General',
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: '',
        canAccess: [1],
        submenu: [
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
            },
            {
                path: '/apps/file-manager',
                title: 'File Manager',
                iconType: 'nzIcon',
                icon: 'file',
                iconTheme: '',
                canAccess: [1, 2, 3],
                submenu: []
            }
        ]
    },
    {
        path: '',
        title: 'PetFood',
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: '',
        canAccess: [1],
        submenu: [
            {
                path: '',
                title: null,
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/brands/logo-nupec.png',
                canAccess: [1],
                submenu: [
                    {
                        path: '',
                        title: 'ATL',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    },
                    {
                        path: '',
                        title: 'DIGITAL',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    },
                    {
                        path: '',
                        title: 'TÉCNICO',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    },
                    {
                        path: '',
                        title: 'EVENTOS Y BTL',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    }
                ]
            },
            {
                path: '',
                title: null,
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/brands/logo-nucan.png',
                canAccess: [1],
                submenu: [
                    {
                        path: '',
                        title: 'ATL',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    },
                    {
                        path: '',
                        title: 'DIGITAL',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    },
                    {
                        path: '',
                        title: 'TÉCNICO',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    },
                    {
                        path: '',
                        title: 'EVENTOS Y BTL',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    }
                ]
            },
            {
                path: '',
                title: null,
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/brands/logo-nucat.png',
                canAccess: [1],
                submenu: [
                    {
                        path: '',
                        title: 'ATL',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    },
                    {
                        path: '',
                        title: 'DIGITAL',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    },
                    {
                        path: '',
                        title: 'TÉCNICO',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    },
                    {
                        path: '',
                        title: 'EVENTOS Y BTL',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    }
                ]
            },
            {
                path: '',
                title: null,
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/brands/logo-nufit.png',
                canAccess: [1],
                submenu: [
                    {
                        path: '',
                        title: 'ATL',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    },
                    {
                        path: '',
                        title: 'DIGITAL',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    },
                    {
                        path: '',
                        title: 'TÉCNICO',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    },
                    {
                        path: '',
                        title: 'EVENTOS Y BTL',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    }
                ]
            },
            {
                path: '',
                title: null,
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/brands/logo-optimo-selecto.png',
                canAccess: [1],
                submenu: [
                    {
                        path: '',
                        title: 'ATL',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    },
                    {
                        path: '',
                        title: 'DIGITAL',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    },
                    {
                        path: '',
                        title: 'TÉCNICO',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    },
                    {
                        path: '',
                        title: 'EVENTOS Y BTL',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    }
                ]
            },
            {
                path: '',
                title: null,
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/brands/logo-optimo-felino.png',
                canAccess: [1],
                submenu: [
                    {
                        path: '',
                        title: 'ATL',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    },
                    {
                        path: '',
                        title: 'DIGITAL',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    },
                    {
                        path: '',
                        title: 'TÉCNICO',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    },
                    {
                        path: '',
                        title: 'EVENTOS Y BTL',
                        iconType: 'nzIcon',
                        icon: '',
                        iconTheme: 'outline',
                        canAccess: [1],
                        submenu: []
                    }
                ]
            }



        ]
    },
    {
        path: '',
        title: 'Pecuario',
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: '',
        canAccess: [1],
        submenu: [
            {
                path: '',
                title: 'Aves',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/species/icono-aves.png',
                canAccess: [1],
                submenu: []
            },
            {
                path: '',
                title: 'Camarón',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/species/icono-camaron.png',
                canAccess: [1],
                submenu: []
            },
            {
                path: '',
                title: 'Cerdos',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/species/icono-cerdos.png',
                canAccess: [1],
                submenu: []
            },
            {
                path: '',
                title: 'Equinos',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/species/icono-equinos.png',
                canAccess: [1],
                submenu: []
            },
            {
                path: '',
                title: 'Gallos',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/species/icono-gallos.png',
                canAccess: [1],
                submenu: []
            },
            {
                path: '',
                title: 'Peces',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/species/icono-peces.png',
                canAccess: [1],
                submenu: []
            },
            {
                path: '',
                title: 'Rumiantes',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/species/icono-rumiantes.png',
                canAccess: [1],
                submenu: []
            },
            {
                path: '',
                title: 'Feed Solutions',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/species/icono-feed-solutions.png',
                canAccess: [1],
                submenu: []
            },
        ]
    },
    {
        path: '',
        title: 'Institucional',
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: '',
        canAccess: [1],
        submenu: [
            {
                path: '',
                title: 'NUTEC',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/institutions/icono-institucional.png',
                canAccess: [1],
                submenu: []
            },
            {
                path: '',
                title: 'INCASARA',
                iconType: 'image',
                iconTheme: '',
                icon: 'assets/images/logo/institutions/icono-incasara.png',
                canAccess: [1],
                submenu: []
            },
        ]
    }
]    