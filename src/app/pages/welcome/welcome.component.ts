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
  { id:1, icon: 'assets/images/logo/brands/logo-nupec.png', name: 'NUPEC', desc: 'Alimento premium para mascotas de todas las etapas', count: 248},
  { id:2, icon: 'assets/images/logo/brands/logo-nucan.png', name: 'NUCAN', desc: 'Nutrición canina especializada y balanceada', count: 132 },
  { id:3, icon: 'assets/images/logo/brands/logo-nucat.png', name: 'NUCAT', desc: 'Nutrición felina adaptada a cada etapa de vida', count: 97 },
  { id:4, icon: 'assets/images/logo/brands/logo-nufit.png', name: 'NUFIT', desc: 'Nutrición de alto rendimiento para perros activos', count: 73 },
  { id:6, icon: 'assets/images/logo/brands/logo-optimo-selecto.png', name: 'ÓPTIMO', desc: 'Alimento balanceado de calidad para tu mascota', count: 86 },
  { id:7, icon: 'assets/images/logo/brands/logo-optimo-felino.png', name: 'ÓPTIMO FELINO', desc: 'Fórmula especializada en la nutrición del gato', count: 86 }
];

species = [
  { id:8, icon: 'assets/images/logo/species/icono-aves-dark.png', name: 'AVES', desc: 'Nutrición especializada para aves de producción', count: 248 },
  { id:9, icon: 'assets/images/logo/species/icono-camaron-dark.png', name: 'CAMARONES', desc: 'Soluciones nutricionales para acuicultura de camarón', count: 132 },
  { id:10, icon: 'assets/images/logo/species/icono-cerdos-dark.png', name: 'CERDOS', desc: 'Alimentación balanceada para porcicultura', count: 97 },
  { id:11, icon: 'assets/images/logo/species/icono-equinos-dark.png', name: 'EQUINOS', desc: 'Nutrición equina de alto rendimiento', count: 73 },
  { id:12, icon: 'assets/images/logo/species/icono-gallos-dark.png', name: 'GALLOS', desc: 'Fórmulas especializadas para gallos de combate y exhibición', count: 86 },
  { id:13, icon: 'assets/images/logo/species/icono-peces-dark.png', name: 'PECES', desc: 'Nutrición acuícola para el crecimiento óptimo de peces', count: 86 },
  { id:14, icon: 'assets/images/logo/species/icono-rumiantes-dark.png', name: 'RUMIANTES', desc: 'Soluciones para ganadería bovina, ovina y caprina', count: 86 },
  { id:15, icon: 'assets/images/logo/species/icono-feed-solutions-dark.png', name: 'FEED SOLUTIONS', desc: 'Soluciones integrales de nutrición animal a medida', count: 86 }
];

  // ─── FILTERS ──────────────────────────────────────────────
  filters = [
    { label: 'TODO', value: 'all' },
    { label: 'PETFOOD', value: 'petfood' },
    { label: 'PECUARIO', value: 'pecuario' },
    { label: 'INSTITUCIONAL', value: 'institucional'}
  ];

  // ─── MASONRY ITEMS ────────────────────────────────────────
  masonryItems = [
    {
      height: 180, icon: '🐾',
      bg: 'linear-gradient(135deg,#1E3A8A,#2563EB)',
      brandBg: 'rgba(37,99,235,.15)', brandColor: 'var(--nupec-color)',
      brandLabel: 'NUPEC',
      name: 'Kit campaña Q2 2026 — Portada principal',
      type: 'PNG', category: 'ATL', downloads: 82
    },
    {
      height: 180, icon: '🐎',
      bg: 'linear-gradient(135deg,#7C2D12,#F97316)',
      brandBg: 'rgba(249,115,22,.15)', brandColor: '#FDBA74',
      brandLabel: 'GALOPE',
      name: 'Video spot TV 30s — Alto rendimiento',
      type: 'MP4', category: 'ATL', downloads: 76
    },
    {
      height: 180, icon: '🌿',
      bg: 'linear-gradient(135deg,#064E3B,#10B981)',
      brandBg: 'rgba(16,185,129,.15)', brandColor: 'var(--nucan-color)',
      brandLabel: 'NUCAN',
      name: 'Banner digital 728×90px',
      type: 'PNG', category: 'Digital', downloads: 61
    },
    {
      height: 180, icon: '🐄',
      bg: 'linear-gradient(135deg,#831843,#EC4899)',
      brandBg: 'rgba(236,72,153,.15)', brandColor: '#F9A8D4',
      brandLabel: 'PECUARIO',
      name: 'Anuncio Pecuario — Ganadería extensiva',
      type: 'MP4', category: 'BTL', downloads: 54
    },
    {
      height: 180, icon: '📄',
      bg: 'linear-gradient(135deg,#1E3A8A,#60A5FA)',
      brandBg: 'rgba(37,99,235,.15)', brandColor: 'var(--nupec-color)',
      brandLabel: 'NUPEC',
      name: 'Brief campaña Adulto Hero',
      type: 'PDF', category: 'ATL', downloads: 48
    },
    {
      height: 180, icon: '⭐',
      bg: 'linear-gradient(135deg,#4C1D95,#8B5CF6)',
      brandBg: 'rgba(139,92,246,.15)', brandColor: '#C4B5FD',
      brandLabel: 'ÓPTIMO',
      name: 'Presentación Comercial v3 — Distribuidores',
      type: 'PDF', category: 'Com. técnica', downloads: 42
    },
    {
      height: 180, icon: '🖼',
      bg: 'linear-gradient(135deg,#92400E,var(--nutec-secondary-color))',
      brandBg: 'rgba(249,115,22,.15)', brandColor: '#FDBA74',
      brandLabel: 'GALOPE',
      name: 'Mockup Galope — Material POP',
      type: 'PDF', category: 'BTL', downloads: 38
    },
    {
      height: 180, icon: '🌱',
      bg: 'linear-gradient(135deg,#064E3B,#34D399)',
      brandBg: 'rgba(16,185,129,.15)', brandColor: '#6EE7B7',
      brandLabel: 'NUCAN',
      name: 'Logo NUCAN — versión vectorial',
      type: 'AI', category: 'Identidad', downloads: 35
    },
    {
      height: 180, icon: '🎬',
      bg: 'linear-gradient(135deg,#1E40AF,#818CF8)',
      brandBg: 'rgba(255, 0, 0, 0.15)', brandColor: 'var(--nupec-color)',
      brandLabel: 'NUPEC',
      name: 'Reel Instagram — Cachorros',
      type: 'MP4', category: 'Digital', downloads: 29
    },
    {
      height: 180, icon: '📊',
      bg: 'linear-gradient(135deg,#500724,#F43F5E)',
      brandBg: 'rgba(236,72,153,.15)', brandColor: '#F9A8D4',
      brandLabel: 'PECUARIO',
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
      title: 'Descarga',
      desc: 'Descarga en el formato original'
    },
  ];

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

