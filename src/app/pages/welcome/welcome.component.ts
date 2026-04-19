import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EndPointUsersService } from 'src/app/core/apis/end-point-users.service';
import { HttpClient } from '@angular/common/http';
import { Subscription, forkJoin } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TranslationService } from 'src/app/shared/services/translation.service';

@Component({
  selector: 'app-welcome',
  standalone: false,
  // imports: [CommonModule],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit, OnDestroy {

  private usersService = inject(EndPointUsersService);
  private http = inject(HttpClient);
  private subscription?: Subscription;
  private translationService = inject(TranslationService);

  stats: { materials: number; brands: number; downloads: number; users: number; } | null = null;
  loadingStats = true;
  errorStats = false;

  activeFilter: string = 'all';

  // Translated data observables
  brands$ = this.translationService.getTranslatedArray('BRANDS');
  chips$ = this.translationService.getTranslatedArray('WELCOME.CHIPS');
  steps$ = this.translationService.getTranslatedArray('WELCOME.STEPS');

  // Static brand data with translation keys (name/desc from JSON.BRANDS)
  staticBrands = [
    { id:1, icon: 'assets/images/logo/brands/logo-nupec.png', nameKey: 'WELCOME.BRANDS.NAME.NUPEC', descKey: 'WELCOME.BRANDS.DESC.NUPEC', count: 248},
    { id:2, icon: 'assets/images/logo/brands/logo-nucan.png', nameKey: 'WELCOME.BRANDS.NAME.NUCAN', descKey: 'WELCOME.BRANDS.DESC.NUCAN', count: 132 },
    { id:3, icon: 'assets/images/logo/brands/logo-nucat.png', nameKey: 'WELCOME.BRANDS.NAME.NUCAT', descKey: 'WELCOME.BRANDS.DESC.NUCAT', count: 97 },
    { id:4, icon: 'assets/images/logo/brands/logo-nufit.png', nameKey: 'WELCOME.BRANDS.NAME.NUFIT', descKey: 'WELCOME.BRANDS.DESC.NUFIT', count: 73 },
    { id:6, icon: 'assets/images/logo/brands/logo-optimo-selecto.png', nameKey: 'WELCOME.BRANDS.NAME.OPTIMO', descKey: 'WELCOME.BRANDS.DESC.OPTIMO', count: 86 },
    { id:7, icon: 'assets/images/logo/brands/logo-optimo-felino.png', nameKey: 'WELCOME.BRANDS.NAME.OPTIMO_FELINO', descKey: 'WELCOME.BRANDS.DESC.OPTIMO_FELINO', count: 86 }
  ];

  staticSpecies = [
    { id:8, icon: 'assets/images/logo/species/icono-aves-dark.png', nameKey: 'WELCOME.SPECIES.NAME.AVES', descKey: 'WELCOME.SPECIES.DESC.AVES', count: 248 },
    { id:9, icon: 'assets/images/logo/species/icono-camaron-dark.png', nameKey: 'WELCOME.SPECIES.NAME.CAMARONES', descKey: 'WELCOME.SPECIES.DESC.CAMARONES', count: 132 },
    { id:10, icon: 'assets/images/logo/species/icono-cerdos-dark.png', nameKey: 'WELCOME.SPECIES.NAME.CERDOS', descKey: 'WELCOME.SPECIES.DESC.CERDOS', count: 97 },
    { id:11, icon: 'assets/images/logo/species/icono-equinos-dark.png', nameKey: 'WELCOME.SPECIES.NAME.EQUINOS', descKey: 'WELCOME.SPECIES.DESC.EQUINOS', count: 73 },
    { id:12, icon: 'assets/images/logo/species/icono-gallos-dark.png', nameKey: 'WELCOME.SPECIES.NAME.GALLOS', descKey: 'WELCOME.SPECIES.DESC.GALLOS', count: 86 },
    { id:13, icon: 'assets/images/logo/species/icono-peces-dark.png', nameKey: 'WELCOME.SPECIES.NAME.PECES', descKey: 'WELCOME.SPECIES.DESC.PECES', count: 86 },
    { id:14, icon: 'assets/images/logo/species/icono-rumiantes-dark.png', nameKey: 'WELCOME.SPECIES.NAME.RUMIANTES', descKey: 'WELCOME.SPECIES.DESC.RUMIANTES', count: 86 },
    { id:15, icon: 'assets/images/logo/species/icono-feed-solutions-dark.png', nameKey: 'WELCOME.SPECIES.NAME.FEED_SOLUTIONS', descKey: 'WELCOME.SPECIES.DESC.FEED_SOLUTIONS', count: 86 }
  ];

  // Static data with translation keys (icons/count unchanged, name/desc translated via pipe in HTML)

  ngOnInit(): void {
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  loadStats(): void {
    this.loadingStats = true;
    this.errorStats = false;

    const headers = {
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
    };

    this.subscription = forkJoin({
      entities: this.http.get<any>(`${environment.apiUrl}/entities/`, { headers }),
      contents: this.http.get<any>(`${environment.apiUrl}/contents/`, { headers }),
      metrics: this.usersService.getMetricsSummary()
    }).subscribe({
      next: ({ entities, contents, metrics }) => {
        this.stats = {
          materials: metrics.total_files,
          brands: entities.count || entities.total || entities.length || entities.data?.length || 5,
          downloads: metrics.total_downloads || metrics.downloads || 23000,
          users: metrics.active_users || metrics.users || 17
        };
        this.loadingStats = false;
      },
      error: () => {
        this.errorStats = true;
        this.loadingStats = false;
        this.stats = { materials: 3685, brands: 5, downloads: 23000, users: 17 };
      }
    });
  }

  formatNumber(num: number): string {
    if (num >= 10000) {
      return (num / 1000).toFixed(0) + 'K+';
    } else if (num >= 1000) {
      return num.toLocaleString('es-ES');
    }
    return num.toString();
  }

  constructor(private router: Router) { }

  // ─── NAVIGATION ──────────────────────────────────────────
  goToLogin(path: string): void {
    this.router.navigateByUrl(path);
  }

  setFilter(value: string): void {
    this.activeFilter = value;
    this.goToLogin('/authentication/login-3');
  }
}

