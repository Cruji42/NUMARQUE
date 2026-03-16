import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-welcome',
  standalone: false,
  // imports: [CommonModule],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent {

  activeFilter: string = 'all';

  // ─── BRANDS DATA ──────────────────────────────────────────
  brands = [
    { icon: '🐾', name: 'NUPEC',    desc: 'Alimento premium para mascotas de todas las etapas',  count: 248 },
    { icon: '🌿', name: 'NUCAN',    desc: 'Nutrición canina especializada y balanceada',          count: 132 },
    { icon: '🐎', name: 'GALOPE',   desc: 'Nutrición equina de alto rendimiento',                 count: 97  },
    { icon: '⭐', name: 'ÓPTIMO',   desc: 'Fórmulas avanzadas para rendimiento máximo',           count: 86  },
    { icon: '🐄', name: 'PECUARIO', desc: 'Soluciones para ganadería y producción animal',        count: 73  },
  ];

  // ─── FILTERS ──────────────────────────────────────────────
  filters = [
    { label: 'Todo',         value: 'all'     },
    { label: '🐾 NUPEC',    value: 'nupec'   },
    { label: '🌿 NUCAN',    value: 'nucan'   },
    { label: '🐎 GALOPE',   value: 'galope'  },
    { label: '⭐ ÓPTIMO',   value: 'optimo'  },
    { label: '🐄 PECUARIO', value: 'pecuario'},
  ];

  // ─── MASONRY ITEMS ────────────────────────────────────────
  masonryItems = [
    {
      height: 180, icon: '🐾',
      bg: 'linear-gradient(135deg,#1E3A8A,#2563EB)',
      brandBg: 'rgba(37,99,235,.15)', brandColor: '#93C5FD',
      brandLabel: '🐾 NUPEC',
      name: 'Kit campaña Q2 2026 — Portada principal',
      type: 'PNG', category: 'ATL', downloads: 82
    },
    {
      height: 220, icon: '🐎',
      bg: 'linear-gradient(135deg,#7C2D12,#F97316)',
      brandBg: 'rgba(249,115,22,.15)', brandColor: '#FDBA74',
      brandLabel: '🐎 GALOPE',
      name: 'Video spot TV 30s — Alto rendimiento',
      type: 'MP4', category: 'ATL', downloads: 76
    },
    {
      height: 160, icon: '🌿',
      bg: 'linear-gradient(135deg,#064E3B,#10B981)',
      brandBg: 'rgba(16,185,129,.15)', brandColor: '#6EE7B7',
      brandLabel: '🌿 NUCAN',
      name: 'Banner digital 728×90px',
      type: 'PNG', category: 'Digital', downloads: 61
    },
    {
      height: 200, icon: '🐄',
      bg: 'linear-gradient(135deg,#831843,#EC4899)',
      brandBg: 'rgba(236,72,153,.15)', brandColor: '#F9A8D4',
      brandLabel: '🐄 PECUARIO',
      name: 'Anuncio Pecuario — Ganadería extensiva',
      type: 'MP4', category: 'BTL', downloads: 54
    },
    {
      height: 140, icon: '📄',
      bg: 'linear-gradient(135deg,#1E3A8A,#60A5FA)',
      brandBg: 'rgba(37,99,235,.15)', brandColor: '#93C5FD',
      brandLabel: '🐾 NUPEC',
      name: 'Brief campaña Adulto Hero',
      type: 'PDF', category: 'ATL', downloads: 48
    },
    {
      height: 240, icon: '⭐',
      bg: 'linear-gradient(135deg,#4C1D95,#8B5CF6)',
      brandBg: 'rgba(139,92,246,.15)', brandColor: '#C4B5FD',
      brandLabel: '⭐ ÓPTIMO',
      name: 'Presentación Comercial v3 — Distribuidores',
      type: 'PDF', category: 'Com. técnica', downloads: 42
    },
    {
      height: 170, icon: '🖼',
      bg: 'linear-gradient(135deg,#92400E,#FCD34D)',
      brandBg: 'rgba(249,115,22,.15)', brandColor: '#FDBA74',
      brandLabel: '🐎 GALOPE',
      name: 'Mockup Galope — Material POP',
      type: 'PDF', category: 'BTL', downloads: 38
    },
    {
      height: 190, icon: '🌱',
      bg: 'linear-gradient(135deg,#064E3B,#34D399)',
      brandBg: 'rgba(16,185,129,.15)', brandColor: '#6EE7B7',
      brandLabel: '🌿 NUCAN',
      name: 'Logo NUCAN — versión vectorial',
      type: 'AI', category: 'Identidad', downloads: 35
    },
    {
      height: 155, icon: '🎬',
      bg: 'linear-gradient(135deg,#1E40AF,#818CF8)',
      brandBg: 'rgba(37,99,235,.15)', brandColor: '#93C5FD',
      brandLabel: '🐾 NUPEC',
      name: 'Reel Instagram — Cachorros',
      type: 'MP4', category: 'Digital', downloads: 29
    },
    {
      height: 210, icon: '📊',
      bg: 'linear-gradient(135deg,#500724,#F43F5E)',
      brandBg: 'rgba(236,72,153,.15)', brandColor: '#F9A8D4',
      brandLabel: '🐄 PECUARIO',
      name: 'Ficha técnica — Evento Expoagro',
      type: 'PDF', category: 'Eventos', downloads: 27
    },
  ];

  // ─── HOW IT WORKS ────────────────────────────────────────
  steps = [
    {
      num: '01', icon: '🔍',
      title: 'Busca o explora',
      desc: 'Usa el buscador o navega por marca y categoría. Filtra por tipo de material, fecha o campaña.'
    },
    {
      num: '02', icon: '👁',
      title: 'Previsualiza',
      desc: 'Ve un preview del archivo antes de descargar: imágenes, PDFs, videos y presentaciones.'
    },
    {
      num: '03', icon: '⬇',
      title: 'Descarga o comparte',
      desc: 'Descarga en el formato original o comparte el enlace directo con tu equipo.'
    },
  ];

  constructor(private router: Router) {}

  // ─── NAVIGATION ──────────────────────────────────────────
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  setFilter(value: string): void {
    this.activeFilter = value;
    this.goToLogin();
  }
}