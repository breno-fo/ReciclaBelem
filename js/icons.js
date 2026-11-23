/**
 * ReciclaBelém - Biblioteca de Ícones Vetoriais (SVG), Formatação e Metadados
 */

window.ReciclaIcons = {
  materialMeta: {
    plastico: { label: 'Plástico', color: '#EF4444', bg: '#FEF2F2', emoji: '🧴' },
    papel: { label: 'Papel', color: '#2563EB', bg: '#EFF6FF', emoji: '📦' },
    vidro: { label: 'Vidro', color: '#10B981', bg: '#ECFDF5', emoji: '🍾' },
    metal: { label: 'Metal', color: '#D97706', bg: '#FFFBEB', emoji: '🥫' },
    eletronicos: { label: 'Eletrônicos', color: '#7C3AED', bg: '#F5F3FF', emoji: '🔌' },
    oleo: { label: 'Óleo', color: '#EA580C', bg: '#FFF7ED', emoji: '🫗' },
    pilhas: { label: 'Pilhas', color: '#C2410C', bg: '#FFEDD5', emoji: '🔋' },
    organicos: { label: 'Orgânicos', color: '#78350F', bg: '#FEF3C7', emoji: '🌱' }
  },

  /**
   * Garante que todo ponto de reciclagem tenha obrigatoriamente "Ponto" antes do nome
   * caso ele ainda não comece com "Ponto", para não ser confundido com um local comum.
   */
  formatPointName(name) {
    const clean = String(name || '').trim();
    if (!clean) return 'Ponto de Reciclagem';
    if (/^ponto\b/i.test(clean)) return clean;
    return `Ponto ${clean}`;
  },

  recycleSVG(size = 16) {
    return `
      <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/>
        <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/>
        <path d="m14 16-3 3 3 3"/>
        <path d="M8.293 13.596 7.196 9.5 3.1 10.598"/>
        <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"/>
        <path d="m13.378 9.633 4.096 1.098 1.097-4.096"/>
      </svg>
    `;
  },

  placePinSVG(size = 16) {
    return `
      <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    `;
  },

  getMaterialIconSVG(slug, color, size = 12) {
    const common = `viewBox="0 0 24 24" width="${size}" height="${size}" fill="#ffffff" stroke="${color}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0;"`;
    switch (slug) {
      case 'plastico':
        return `<svg ${common}><path d="M10 2h4"/><path d="M10 2v3l-2 2.5V20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7.5L14 5V2"/></svg>`;
      case 'papel':
        return `<svg ${common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>`;
      case 'vidro':
        return `<svg ${common}><path d="M8 22h8"/><path d="M12 15v7"/><path d="M7 2h10l-1 8a4 4 0 0 1-4 3.5A4 4 0 0 1 8 10z"/></svg>`;
      case 'metal':
        return `<svg ${common}><ellipse cx="12" cy="5" rx="7" ry="2.5"/><path d="M5 5v14c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5V5"/><path d="M5 12c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5"/></svg>`;
      case 'eletronicos':
        return `<svg ${common}><rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3"/><path d="M15 2v3"/><path d="M9 19v3"/><path d="M15 19v3"/><path d="M2 9h3"/><path d="M2 15h3"/><path d="M19 9h3"/><path d="M19 15h3"/></svg>`;
      case 'oleo':
        return `<svg ${common}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
      case 'pilhas':
        return `<svg ${common}><rect x="6" y="4" width="12" height="18" rx="2"/><path d="M10 2h4"/><path d="M12 10v4"/><path d="M10 12h4"/></svg>`;
      case 'organicos':
        return `<svg ${common}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`;
      default:
        return `<svg ${common}><circle cx="12" cy="12" r="9"/></svg>`;
    }
  },

  getMaterialBadge(slug) {
    const m = this.materialMeta[slug] || { label: slug, color: '#059669', bg: '#ECFDF5', emoji: '♻️' };
    return `<span class="mat-badge" style="color:${m.color};background:${m.bg};border:1px solid ${m.color}30;">
      ${this.getMaterialIconSVG(slug, m.color, 13)}${m.label}
    </span>`;
  },

  createMapPinHTML(point, isSelected = false) {
    const count = point.materials ? point.materials.length : 1;
    return `
      <div class="custom-pin ${isSelected ? 'pin-selected' : ''}">
        <div class="pin-head">
          ${this.recycleSVG(16)}
          <span class="pin-count">${count}</span>
        </div>
        <div class="pin-tail"></div>
      </div>
    `;
  },

  createPlacePinHTML() {
    return `
      <div class="searched-place-pin">
        <div class="searched-place-head">
          ${this.placePinSVG(16)}
        </div>
        <div class="searched-place-tail"></div>
      </div>
    `;
  }
};
