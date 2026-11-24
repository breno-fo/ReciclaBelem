/**
 * ReciclaBelém - Controlador Principal da Aplicação
 * Gerencia Mapa Interativo, Geolocalização, Busca Unificada (Pontos + Lugares),
 * Filtros, Navegação Google Maps e Dashboard Admin.
 */

const BELEM_PLACES = [
  { name: 'Praça da República', area: 'Campina • Centro de Belém', lat: -1.4539, lng: -48.4934 },
  { name: 'Teatro da Paz', area: 'Campina • Av. da Paz', lat: -1.4526, lng: -48.4944 },
  { name: 'Estação das Docas', area: 'Campina • Boulevard Castilhos França', lat: -1.4488, lng: -48.4998 },
  { name: 'Mercado Ver-o-Peso', area: 'Cidade Velha • Orla', lat: -1.4522, lng: -48.5034 },
  { name: 'Mangal das Garças', area: 'Cidade Velha • R. Carneiro da Rocha', lat: -1.4648, lng: -48.5055 },
  { name: 'Forte do Presépio / Feliz Lusitânia', area: 'Cidade Velha', lat: -1.4552, lng: -48.5058 },
  { name: 'Basílica Santuário de Nazaré', area: 'Nazaré • Av. Nazaré', lat: -1.4525, lng: -48.4812 },
  { name: 'Praça Batista Campos', area: 'Batista Campos', lat: -1.4598, lng: -48.4897 },
  { name: 'Bosque Rodrigues Alves', area: 'Marco • Av. Almirante Barroso', lat: -1.4315, lng: -48.4582 },
  { name: 'Mercado de São Brás', area: 'São Brás • Av. José Bonifácio', lat: -1.4508, lng: -48.4682 },
  { name: 'Campus UFPA (Guamá)', area: 'Guamá • R. Augusto Corrêa', lat: -1.4742, lng: -48.4548 },
  { name: 'Parque Estadual do Utinga', area: 'Curió-Utinga • Av. João Paulo II', lat: -1.4255, lng: -48.4368 },
  { name: 'Shopping Pátio Belém', area: 'Batista Campos • Tv. Padre Eutíquio', lat: -1.4585, lng: -48.4946 },
  { name: 'Boulevard Shopping Belém', area: 'Reduto • Av. Visconde de Souza Franco', lat: -1.4446, lng: -48.4892 },
  { name: 'Aldeia Amazônica David Miguel', area: 'Pedreira • Av. Pedro Miranda', lat: -1.4285, lng: -48.4690 }
];

const App = {
  map: null,
  markersLayer: null,
  userMarker: null,
  searchedPlaceMarker: null,
  routeLine: null,

  // Estado da Interface
  currentTab: 'mapa',
  activeMaterialFilters: [], // Array acumulativo de slugs selecionados (vazio = Todos)
  searchQuery: '',
  selectedPointId: null,
  searchedPlace: null, // { name, area, lat, lng }
  remotePlaces: [],
  searchDebounceTimer: null,

  // Estado de Localização do Usuário
  userLocation: null, // { lat, lng, label }
  mapClickMode: null, // null | 'setUserLoc' | 'pickAdminCoords'

  async init() {
    const params = new URLSearchParams(window.location.search);
    const isEmbed = params.get('embed') === '1';
    const urlRole = params.get('role'); // 'user' | 'admin' | 'split'

    if (isEmbed) {
      document.body.classList.add('embed-mode');
    }

    // Aplica o modo de visualização imediatamente para nunca exibir Dashboard indevidamente
    const savedMode = localStorage.getItem('reciclaBelem_view_mode') || 'user';
    const initialMode = urlRole || savedMode;
    this.setAppRoleMode(initialMode, { skipSave: isEmbed });

    this.updateClock();
    setInterval(() => this.updateClock(), 15000);

    // Inicia bateria persistente (descarrega em 1 hora) e oscilação realista do 5G
    this.startBatteryDrain();
    this.startNetworkOscillation();

    // 1. Inicializa o Banco de Dados com proteção
    try {
      await ReciclaDB.init();
    } catch (err) {
      console.error('Erro ao inicializar banco:', err);
    }
    this.updateSyncBadge();

    // 2. Renderiza Filtros e Checkboxes do Admin
    try {
      this.renderMaterialFilterChips();
      this.renderAdminMaterialCheckboxes();
    } catch (err) {
      console.error('Erro ao renderizar filtros:', err);
    }

    // 3. Inicializa o Mapa Leaflet centrado em Belém (com proteção caso Leaflet não tenha carregado)
    try {
      if (typeof L !== 'undefined') {
        this.initMap();
      }
    } catch (err) {
      console.error('Erro ao inicializar mapa:', err);
    }

    // 4. Configura Eventos de Busca Unificada (Pontos + Lugares)
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearchInput(e.target.value);
      });
      searchInput.addEventListener('focus', () => {
        if (this.searchQuery.trim().length > 0) {
          this.renderSearchSuggestions();
        }
      });
    }
    document.addEventListener('click', (e) => {
      const wrap = document.getElementById('header-search-wrap');
      if (wrap && !wrap.contains(e.target)) {
        this.closeSearchSuggestions();
      }
    });

    // 5. Renderiza todas as seções e inicializa arraste da gaveta de pontos
    try {
      this.renderAll();
    } catch (err) {
      console.error('Erro ao renderizar seções:', err);
    }
    this.initPointsDrawerDrag();

    if (isEmbed && urlRole === 'admin') {
      this.switchTab('admin');
    }

    // 7. Sincronização em tempo real entre telas (Lado a Lado)
    try {
      const bc = new BroadcastChannel('reciclabelem_sync');
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'DB_UPDATED' && event.data.data) {
          ReciclaDB.data = event.data.data;
          this.renderAll();
        }
      };
    } catch (e) {}

    window.addEventListener('storage', (e) => {
      if (e.key === 'reciclaBelem_db_v1' && e.newValue) {
        try {
          ReciclaDB.data = JSON.parse(e.newValue);
          this.renderAll();
        } catch (err) {}
      }
      if (e.key === 'reciclaBelem_battery_start_ts') {
        this.updateBatteryUI();
      }
    });

    // 8. Registra Service Worker para suporte Offline
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
    this.updateOfflineButtonState();

    // 9. Se for embed Admin (Lado a Lado) ou app instalado (PWA standalone / APK Capacitor), abre direto no app
    const isNativeOrStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      !!window.Capacitor;

    if ((isEmbed && urlRole === 'admin') || isNativeOrStandalone) {
      const launcher = document.getElementById('android-launcher');
      if (launcher) launcher.classList.remove('active');
      if (isNativeOrStandalone && !sessionStorage.getItem('recicla_loc_prompted')) {
        setTimeout(() => {
          this.openLocationModal();
          sessionStorage.setItem('recicla_loc_prompted', 'true');
        }, 450);
      }
    }
  },

  launchReciclaBelem() {
    const launcher = document.getElementById('android-launcher');
    const splash = document.getElementById('app-splash-screen');
    if (splash) splash.classList.add('open');

    setTimeout(() => {
      if (launcher) launcher.classList.remove('active');
      if (splash) splash.classList.remove('open');
      if (this.map) {
        setTimeout(() => this.map.invalidateSize(), 120);
      }

      // Dispara os prompts de GPS e Mapa Offline somente ao abrir o app pela primeira vez
      if (!sessionStorage.getItem('recicla_loc_prompted')) {
        setTimeout(() => {
          this.openLocationModal();
          sessionStorage.setItem('recicla_loc_prompted', 'true');
        }, 400);
      } else {
        this.maybePromptOfflineMap(500);
      }
    }, 650);
  },

  goToPhoneHome() {
    const launcher = document.getElementById('android-launcher');
    if (launcher) launcher.classList.add('active');
    this.showToast('📱 Voltou para a Tela Inicial do Android');
  },

  openSimulatedApp(appName) {
    this.showToast(`📱 ${appName} (ilustrativo) — toque em ReciclaBelém para abrir!`);
  },

  setAppRoleMode(mode, opts = {}) {
    const validModes = ['user', 'admin', 'split'];
    const targetMode = validModes.includes(mode) ? mode : 'user';

    if (!opts.skipSave) {
      localStorage.setItem('reciclaBelem_view_mode', targetMode);
    }

    document.body.classList.remove('role-user', 'role-admin', 'split-mode');

    const btnUser = document.getElementById('btn-role-user');
    const btnAdmin = document.getElementById('btn-role-admin');
    const btnSplit = document.getElementById('btn-role-split');
    const btnFull = document.getElementById('btn-mode-full');

    if (btnUser) btnUser.classList.toggle('active', targetMode === 'user');
    if (btnAdmin) btnAdmin.classList.toggle('active', targetMode === 'admin');
    if (btnSplit) btnSplit.classList.toggle('active', targetMode === 'split');

    if (targetMode === 'split') {
      document.body.classList.remove('fullscreen-mode');
      if (btnFull) {
        btnFull.classList.remove('active');
        btnFull.style.display = 'none';
      }
      document.body.classList.add('split-mode');

      const iframeUser = document.getElementById('iframe-user');
      const iframeAdmin = document.getElementById('iframe-admin');
      if (iframeUser && !iframeUser.src) {
        iframeUser.src = 'index.html?role=user&embed=1';
      }
      if (iframeAdmin && !iframeAdmin.src) {
        iframeAdmin.src = 'index.html?role=admin&embed=1';
      }
      return;
    }

    if (btnFull) btnFull.style.display = 'inline-flex';

    if (targetMode === 'user') {
      document.body.classList.add('role-user');
      if (this.currentTab === 'admin') {
        this.switchTab('mapa');
      }
    } else if (targetMode === 'admin') {
      document.body.classList.add('role-admin');
    }

    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 200);
  },

  toggleFullscreen() {
    const isFull = !document.body.classList.contains('fullscreen-mode');
    document.body.classList.toggle('fullscreen-mode', isFull);
    const btnFull = document.getElementById('btn-mode-full');
    if (btnFull) btnFull.classList.toggle('active', isFull);
    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 320);
  },

  startNetworkOscillation() {
    const states = [
      { label: '5G', bars: 4 },
      { label: '5G', bars: 4 },
      { label: '5G', bars: 3 },
      { label: '5G', bars: 2 },
      { label: '4G+', bars: 3 },
      { label: '5G', bars: 3 },
      { label: '5G', bars: 4 }
    ];

    const applyNetState = (st) => {
      const lbl = document.getElementById('network-label');
      const barsWrap = document.getElementById('signal-bars');
      if (lbl) lbl.textContent = st.label;
      if (barsWrap) {
        const bars = barsWrap.querySelectorAll('.bar');
        bars.forEach((b, i) => {
          b.classList.toggle('active', i < st.bars);
        });
      }
    };

    const scheduleNext = () => {
      const delay = 3500 + Math.random() * 4500;
      setTimeout(() => {
        const pick = states[Math.floor(Math.random() * states.length)];
        applyNetState(pick);
        scheduleNext();
      }, delay);
    };

    scheduleNext();
  },

  startBatteryDrain() {
    const KEY = 'reciclaBelem_battery_start_ts';
    if (!localStorage.getItem(KEY)) {
      localStorage.setItem(KEY, String(Date.now()));
    }
    this.updateBatteryUI();
    setInterval(() => this.updateBatteryUI(), 5000);
  },

  updateBatteryUI() {
    const KEY = 'reciclaBelem_battery_start_ts';
    let startTs = parseInt(localStorage.getItem(KEY), 10);
    if (Number.isNaN(startTs)) {
      startTs = Date.now();
      localStorage.setItem(KEY, String(startTs));
    }

    const ONE_HOUR_MS = 3600000;
    const elapsed = Math.max(0, Date.now() - startTs);
    const pct = Math.max(0, Math.round(100 - (elapsed / ONE_HOUR_MS) * 100));

    const textEl = document.getElementById('statusbar-battery-text');
    const fillEl = document.getElementById('battery-fill');
    if (textEl) textEl.textContent = `${pct}%`;
    if (fillEl) {
      fillEl.style.width = `${pct}%`;
      fillEl.classList.toggle('low', pct <= 30 && pct > 15);
      fillEl.classList.toggle('critical', pct <= 15);
    }
  },

  resetBattery() {
    localStorage.setItem('reciclaBelem_battery_start_ts', String(Date.now()));
    this.updateBatteryUI();
    this.showToast('🔌 Bateria recarregada para 100% (ciclo de 1h reiniciado)');
  },

  updateClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;
    const el = document.getElementById('statusbar-clock');
    if (el) el.textContent = timeStr;
    const launcherClock = document.getElementById('launcher-clock');
    if (launcherClock) launcherClock.textContent = timeStr;
    const launcherDate = document.getElementById('launcher-date-weather');
    if (launcherDate) {
      const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
      launcherDate.textContent = `${dateStr} • 🌤️ 29°C Belém`;
    }
  },

  updateSyncBadge() {
    const badge = document.getElementById('db-sync-indicator');
    if (!badge) return;
    if (ReciclaDB.serverAvailable) {
      badge.textContent = '🟢 API + database.json Sincronizados';
    } else {
      badge.textContent = '💾 Banco Local (localStorage) Ativo';
    }
  },

  /* ========================================================================
     MAPA INTERATIVO (LEAFLET + OPENSTREETMAP OFICIAL)
     ======================================================================== */
  initMap() {
    const center = ReciclaDB.data.meta?.defaultCenter || { lat: -1.4558, lng: -48.4898, zoom: 13 };
    this.map = L.map('map', {
      zoomControl: false
    }).setView([center.lat, center.lng], center.zoom);

    L.control.zoom({
      position: 'topright',
      zoomInText: '<img class="map-zoom-icon" src="./assets/icons/zoom-in.svg" alt="+" />',
      zoomOutText: '<img class="map-zoom-icon" src="./assets/icons/zoom-out.svg" alt="-" />',
      zoomInTitle: 'Aumentar zoom',
      zoomOutTitle: 'Diminuir zoom'
    }).addTo(this.map);

    // Tiles OpenStreetMap.de (100% gratuitos, sem API key e funcionam tanto em localhost/https quanto em file://)
    const primaryTiles = L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    let fallbackApplied = false;
    primaryTiles.on('tileerror', () => {
      if (fallbackApplied) return;
      fallbackApplied = true;
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.map);
    });

    this.markersLayer = L.layerGroup().addTo(this.map);

    // Eventos de arraste no mapa para o Pin Central Fixo (Selecionar Localização)
    this.map.on('movestart', () => {
      if (this.mapClickMode === 'pickAdminCoords') {
        const pin = document.getElementById('map-center-picker');
        if (pin) pin.classList.add('is-dragging');
      }
    });

    this.map.on('moveend', () => {
      if (this.mapClickMode === 'pickAdminCoords') {
        const pin = document.getElementById('map-center-picker');
        if (pin) pin.classList.remove('is-dragging');
        this.schedulePickerPreviewUpdate();
      }
    });

    // Evento de clique no mapa (centraliza no clique durante picker ou define posição do usuário)
    this.map.on('click', (e) => {
      const lat = Number(e.latlng.lat.toFixed(5));
      const lng = Number(e.latlng.lng.toFixed(5));

      if (this.mapClickMode === 'pickAdminCoords') {
        this.map.panTo([lat, lng], { animate: true });
      } else if (this.mapClickMode === 'setUserLoc') {
        this.mapClickMode = null;
        this.setUserLocation(lat, lng, 'Posição escolhida no mapa');
      }
    });
  },

  resetMapView() {
    if (!this.map) return;
    const center = ReciclaDB.data.meta?.defaultCenter || { lat: -1.4558, lng: -48.4898, zoom: 13 };
    this.map.flyTo([center.lat, center.lng], center.zoom, { duration: 0.7 });
  },

  /* ========================================================================
     GEOLOCALIZAÇÃO DO USUÁRIO & CÁLCULO DE DISTÂNCIA (HAVERSINE)
     ======================================================================== */
  openLocationModal() {
    document.getElementById('location-modal').classList.add('open');
  },

  closeLocationModal() {
    document.getElementById('location-modal').classList.remove('open');
    this.maybePromptOfflineMap(500);
  },

  /* ========================================================================
     MAPA OFFLINE (DETECÇÃO DE DADOS MÓVEIS + DOWNLOAD COM CACHE REAL)
     ======================================================================== */
  isUsingMobileData() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      if (conn.type === 'cellular' || conn.saveData) {
        return { isCellular: true, label: 'Dados Móveis (4G/5G)' };
      }
      if (conn.type === 'wifi' || conn.type === 'ethernet') {
        return { isCellular: false, label: 'Wi-Fi' };
      }
    }
    // Fallback pelo indicador de rede do aparelho na barra de status
    const netLabel = document.getElementById('network-label')?.textContent || '5G';
    return { isCellular: true, label: `Dados Móveis (${netLabel})` };
  },

  maybePromptOfflineMap(delayMs = 600) {
    if (document.body.classList.contains('split-mode')) return;
    if (localStorage.getItem('reciclaBelem_offline_map_v1')) return;
    if (sessionStorage.getItem('recicla_offline_prompted')) return;

    sessionStorage.setItem('recicla_offline_prompted', 'true');
    setTimeout(() => {
      if (!document.getElementById('location-modal').classList.contains('open')) {
        this.openOfflineMapModal();
      }
    }, delayMs);
  },

  async openOfflineMapModal() {
    const net = this.isUsingMobileData();
    const alertEl = document.getElementById('offline-network-alert');
    const confirmBtn = document.getElementById('btn-confirm-offline-dl');
    const progressWrap = document.getElementById('offline-progress-wrap');
    const actionsWrap = document.getElementById('offline-modal-actions');
    const sizeEl = document.getElementById('offline-pack-size-label');

    if (progressWrap) progressWrap.style.display = 'none';
    if (actionsWrap) actionsWrap.style.display = 'flex';

    let sizeMB = 7.2;
    try {
      const metaRes = await fetch('./data/belem-map-pack.meta.json', { cache: 'no-store' });
      if (metaRes.ok) {
        const meta = await metaRes.json();
        if (meta && meta.sizeMB) sizeMB = meta.sizeMB;
      }
    } catch (e) {}
    const sizeLabel = `${String(sizeMB).replace('.', ',')} MB`;
    this._offlinePackSizeMB = sizeMB;
    if (sizeEl) sizeEl.textContent = sizeLabel;

    if (alertEl) {
      if (net.isCellular) {
        alertEl.className = 'offline-network-alert cellular';
        alertEl.innerHTML = `⚠️ <strong>Você está usando ${net.label}.</strong><br/>Deseja baixar o mapa de Belém, Icoaraci e Outeiro usando seus dados móveis? (${sizeLabel})`;
      } else {
        alertEl.className = 'offline-network-alert wifi';
        alertEl.innerHTML = `📶 <strong>Conectado via ${net.label}.</strong><br/>Sem consumo da sua franquia de dados móveis.`;
      }
    }

    if (confirmBtn) {
      const alreadyDone = !!localStorage.getItem('reciclaBelem_offline_map_v1');
      if (alreadyDone) {
        confirmBtn.textContent = `🔄 Atualizar Mapa Offline (${sizeLabel})`;
      } else {
        confirmBtn.textContent = net.isCellular
          ? `📶 Sim, baixar com Dados Móveis (${sizeLabel})`
          : `⬇️ Baixar Mapa Offline (${sizeLabel})`;
      }
    }

    document.getElementById('offline-map-modal').classList.add('open');
  },

  dismissOfflineModal() {
    document.getElementById('offline-map-modal').classList.remove('open');
  },

  updateOfflineButtonState() {
    const btn = document.getElementById('btn-offline-map');
    if (!btn) return;
    const isSaved = !!localStorage.getItem('reciclaBelem_offline_map_v1');
    btn.classList.toggle('is-downloaded', isSaved);
    if (isSaved) {
      btn.title = 'Mapa offline (Belém, Icoaraci e Outeiro) salvo no aparelho';
    }
  },

  async startOfflineMapDownload() {
    const progressWrap = document.getElementById('offline-progress-wrap');
    const progressBar = document.getElementById('offline-progress-bar');
    const progressPct = document.getElementById('offline-progress-pct');
    const progressLabel = document.getElementById('offline-progress-label');
    const actionsWrap = document.getElementById('offline-modal-actions');

    const setProgress = (pct, label) => {
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (progressPct) progressPct.textContent = `${pct}%`;
      if (progressLabel && label) progressLabel.textContent = label;
    };

    if (actionsWrap) actionsWrap.style.display = 'none';
    if (progressWrap) progressWrap.style.display = 'block';
    setProgress(2, 'Conectando ao pacote de Belém, Icoaraci e Outeiro...');

    if (!('caches' in window)) {
      if (actionsWrap) actionsWrap.style.display = 'flex';
      if (progressWrap) progressWrap.style.display = 'none';
      this.showToast('⚠️ Para salvar o mapa offline, abra via http://localhost (INICIAR_APP.bat) ou HTTPS.');
      return;
    }

    try {
      const cache = await caches.open('recicla-belem-offline-v6');

      // 1. Garante os arquivos principais do app no cache offline
      const shellUrls = ['./', './index.html', './manifest.json', './css/styles.css', './js/db.js', './js/icons.js', './js/app.js', './data/database.json'];
      await Promise.all(
        shellUrls.map(async (u) => {
          try {
            const r = await fetch(u);
            if (r && r.ok) await cache.put(u, r);
          } catch (e) {}
        })
      );

      // 2. Baixa o pacote binario unico com os 501 tiles de Belem, Icoaraci e Outeiro (zoom 12-15)
      const packRes = await fetch('./data/belem-map-pack.bin');
      if (!packRes.ok) throw new Error(`HTTP ${packRes.status} ao baixar pacote do mapa`);

      const totalBytes = Number(packRes.headers.get('content-length')) || 0;
      let arrayBuffer;

      if (packRes.body && typeof packRes.body.getReader === 'function') {
        const reader = packRes.body.getReader();
        const chunks = [];
        let received = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.byteLength;
          if (totalBytes > 0) {
            const dlPct = Math.min(70, Math.round((received / totalBytes) * 70));
            const mbNow = (received / (1024 * 1024)).toFixed(1).replace('.', ',');
            const mbTot = (totalBytes / (1024 * 1024)).toFixed(1).replace('.', ',');
            setProgress(dlPct, `Baixando mapa (${mbNow} / ${mbTot} MB)...`);
          }
        }
        const combined = new Uint8Array(received);
        let pos = 0;
        for (const c of chunks) {
          combined.set(c, pos);
          pos += c.byteLength;
        }
        arrayBuffer = combined.buffer;
      } else {
        arrayBuffer = await packRes.arrayBuffer();
      }

      setProgress(72, 'Desempacotando mapa no aparelho...');

      // 3. Le o cabecalho binario [4 bytes uint32 LE][JSON index][PNGs] e grava no CacheStorage
      const view = new DataView(arrayBuffer);
      const headerLen = view.getUint32(0, true);
      const headerText = new TextDecoder().decode(new Uint8Array(arrayBuffer, 4, headerLen));
      const tilesIndex = JSON.parse(headerText);
      const dataStart = 4 + headerLen;

      const batchSize = 25;
      for (let i = 0; i < tilesIndex.length; i += batchSize) {
        const batch = tilesIndex.slice(i, i + batchSize);
        await Promise.all(
          batch.map((t) => {
            const slice = arrayBuffer.slice(dataStart + t.offset, dataStart + t.offset + t.length);
            const tileUrl = `https://tile.openstreetmap.de/${t.z}/${t.x}/${t.y}.png`;
            const tileRes = new Response(slice, {
              status: 200,
              headers: { 'Content-Type': 'image/png' }
            });
            return cache.put(tileUrl, tileRes);
          })
        );
        const unpackPct = 72 + Math.round(((i + batch.length) / tilesIndex.length) * 28);
        setProgress(Math.min(100, unpackPct), `Salvando mapa offline (${Math.min(i + batch.length, tilesIndex.length)}/${tilesIndex.length} blocos)...`);
      }

      const sizeMB = this._offlinePackSizeMB || Number((arrayBuffer.byteLength / (1024 * 1024)).toFixed(1));
      localStorage.setItem(
        'reciclaBelem_offline_map_v1',
        JSON.stringify({
          downloadedAt: new Date().toISOString(),
          sizeMB,
          tileCount: tilesIndex.length,
          region: 'Belém, Icoaraci e Outeiro'
        })
      );
      this.updateOfflineButtonState();
      setProgress(100, 'Mapa salvo com sucesso!');

      setTimeout(() => {
        this.dismissOfflineModal();
        this.showToast(`✅ Mapa de Belém, Icoaraci e Outeiro (${tilesIndex.length} blocos, ${String(sizeMB).replace('.', ',')} MB) salvo offline!`);
      }, 400);
    } catch (err) {
      if (actionsWrap) actionsWrap.style.display = 'flex';
      if (progressWrap) progressWrap.style.display = 'none';
      this.showToast('⚠️ Falha ao baixar o pacote offline. Tente novamente.');
    }
  },

  requestBrowserGeolocation() {
    this.closeLocationModal();
    if (!navigator.geolocation) {
      this.showToast('GPS não suportado neste navegador. Usando centro de Belém.');
      this.useSimulatedBelemLocation();
      return;
    }

    this.showToast('Obtendo sua localização GPS...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        this.setUserLocation(lat, lng, 'GPS Ativo');
      },
      () => {
        this.showToast('Permissão negada ou PC sem GPS. Simulando posição em Belém!');
        this.useSimulatedBelemLocation();
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  },

  useSimulatedBelemLocation() {
    this.closeLocationModal();
    // Praça da República - Centro de Belém
    this.setUserLocation(-1.4539, -48.4934, 'Belém (Simulado)');
  },

  enableClickToSetUserLocation() {
    this.closeLocationModal();
    this.switchTab('mapa');
    this.mapClickMode = 'setUserLoc';
    this.showToast('👆 Toque em qualquer ponto do mapa para definir sua localização');
  },

  setUserLocation(lat, lng, label = 'GPS Ativo') {
    this.userLocation = { lat, lng, label };

    // Atualiza botão no cabeçalho
    const btn = document.getElementById('header-loc-btn');
    const txt = document.getElementById('header-loc-text');
    btn.classList.add('loc-active');
    txt.textContent = label;

    // Adiciona ou move o marcador azul do usuário no mapa
    if (this.userMarker) {
      this.userMarker.setLatLng([lat, lng]);
    } else if (this.map) {
      const icon = L.divIcon({
        className: '',
        html: '<div class="user-loc-marker" title="Você está aqui"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      this.userMarker = L.marker([lat, lng], { icon }).addTo(this.map);
      this.userMarker.bindPopup('<strong>📍 Sua Localização Atual</strong>');
    }

    if (this.map) {
      this.map.flyTo([lat, lng], 14, { duration: 0.8 });
    }

    this.renderMapAndPoints();
    this.showToast(`📍 Localização ativa! Pontos ordenados por proximidade.`);
  },

  centerOnUserOrPrompt() {
    if (this.userLocation && this.map) {
      this.map.flyTo([this.userLocation.lat, this.userLocation.lng], 15, { duration: 0.7 });
      if (this.userMarker) this.userMarker.openPopup();
    } else {
      this.openLocationModal();
    }
  },

  calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /* ========================================================================
     BUSCA, FILTROS E RENDERIZAÇÃO DE PONTOS + NAVEGAÇÃO GOOGLE MAPS
     ======================================================================== */
  renderMaterialFilterChips() {
    const container = document.getElementById('material-filters');
    if (!container) return;

    const chips = [
      { slug: 'todos', label: 'Todos' },
      ...Object.entries(ReciclaIcons.materialMeta).map(([slug, m]) => ({
        slug,
        label: m.label
      }))
    ];

    container.innerHTML = chips
      .map((c) => {
        const isActive =
          c.slug === 'todos'
            ? this.activeMaterialFilters.length === 0
            : this.activeMaterialFilters.includes(c.slug);
        return `
      <button
        class="filter-chip ${isActive ? 'active' : ''}"
        onclick="App.setMaterialFilter('${c.slug}')"
      >
        <span class="filter-icon">${c.slug === 'todos' ? ReciclaIcons.recycleSVG(20) : ReciclaIcons.getMaterialIcon(c.slug, 20)}</span>
        <span>${c.label}</span>
      </button>
    `;
      })
      .join('');
  },

  setMaterialFilter(slug) {
    if (slug === 'todos') {
      this.activeMaterialFilters = [];
    } else {
      const idx = this.activeMaterialFilters.indexOf(slug);
      if (idx === -1) {
        this.activeMaterialFilters.push(slug);
      } else {
        this.activeMaterialFilters.splice(idx, 1);
      }
    }
    this.renderMaterialFilterChips();
    this.renderMapAndPoints();
  },

  handleSearchInput(rawVal) {
    this.searchQuery = rawVal.trim();
    document.getElementById('search-clear-btn').style.display = this.searchQuery ? 'inline-flex' : 'none';

    if (this.currentTab !== 'mapa') {
      this.switchTab('mapa');
    }

    if (!this.searchQuery) {
      this.remotePlaces = [];
      this.closeSearchSuggestions();
      this.renderMapAndPoints();
      return;
    }

    this.renderSearchSuggestions();
    this.renderMapAndPoints();

    // Busca online complementar no OpenStreetMap (Nominatim) para qualquer rua/lugar de Belém
    clearTimeout(this.searchDebounceTimer);
    if (this.searchQuery.length >= 3) {
      this.searchDebounceTimer = setTimeout(() => {
        this.fetchNominatimPlaces(this.searchQuery);
      }, 350);
    }
  },

  async fetchNominatimPlaces(query) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=4&countrycodes=br&viewbox=-48.55,-1.28,-48.35,-1.52&bounded=1&q=${encodeURIComponent(query + ', Belém, PA')}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
      if (!res.ok) return;
      const results = await res.json();
      this.remotePlaces = results.map((r) => {
        const parts = r.display_name.split(',').map((s) => s.trim());
        return {
          name: parts[0] || query,
          area: parts.slice(1, 3).join(' • ') || 'Belém - PA',
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon)
        };
      });
      if (this.searchQuery.trim().length > 0) {
        this.renderSearchSuggestions();
      }
    } catch (e) {
      // Sem internet: mantém apenas lugares locais + pontos do banco
    }
  },

  normalizeText(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  },

  renderSearchSuggestions() {
    const box = document.getElementById('search-suggestions');
    if (!box) return;

    const qNorm = this.normalizeText(this.searchQuery);
    if (!qNorm) {
      box.classList.remove('open');
      return;
    }

    const points = ReciclaDB.data?.points || [];

    // 1. Lugares que combinam com a busca (catálogo local + Nominatim)
    const localPlaces = BELEM_PLACES.filter(
      (pl) => this.normalizeText(pl.name).includes(qNorm) || this.normalizeText(pl.area).includes(qNorm)
    );
    const mergedPlaces = [...localPlaces];
    this.remotePlaces.forEach((rp) => {
      const exists = mergedPlaces.some(
        (mp) => this.normalizeText(mp.name) === this.normalizeText(rp.name)
      );
      if (!exists) mergedPlaces.push(rp);
    });
    const topPlaces = mergedPlaces.slice(0, 4);

    // 2. Pontos de reciclagem que combinam diretamente com o texto
    let matchedPoints = points.filter((pt) => {
      const fullName = ReciclaIcons.formatPointName(pt.name);
      return (
        this.normalizeText(fullName).includes(qNorm) ||
        this.normalizeText(pt.neighborhood).includes(qNorm) ||
        this.normalizeText(pt.address).includes(qNorm) ||
        this.normalizeText(pt.description).includes(qNorm)
      );
    });

    // Se encontrou um lugar (ex: "Praça da República"), sugere também os pontos mais próximos dele!
    if (topPlaces.length > 0) {
      const refPlace = topPlaces[0];
      const nearestByPlace = points
        .map((pt) => ({
          pt,
          dist: this.calculateDistanceKm(refPlace.lat, refPlace.lng, Number(pt.lat), Number(pt.lng))
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 2)
        .map((item) => item.pt);

      nearestByPlace.forEach((npt) => {
        if (!matchedPoints.some((m) => m.id === npt.id)) {
          matchedPoints.push(npt);
        }
      });
    }

    const topPoints = matchedPoints.slice(0, 4);

    if (topPoints.length === 0 && topPlaces.length === 0) {
      box.innerHTML = `
        <div style="padding:14px;text-align:center;font-size:0.79rem;color:var(--text-muted);">
          Nenhum ponto ou lugar encontrado para "<strong>${this.escapeHtml(this.searchQuery)}</strong>"
        </div>
      `;
      box.classList.add('open');
      return;
    }

    let html = '';

    if (topPoints.length > 0) {
      html += `<div class="suggestion-group-title">♻️ Pontos de Reciclagem (Sugestões)</div>`;
      html += topPoints
        .map((pt) => {
          const displayName = ReciclaIcons.formatPointName(pt.name);
          return `
          <button type="button" class="suggestion-item is-point" onclick="App.selectSuggestedPoint('${pt.id}')">
            <div class="suggestion-icon">${ReciclaIcons.recycleSVG(18)}</div>
            <div class="suggestion-text">
              <div class="suggestion-title">${this.escapeHtml(displayName)}</div>
              <div class="suggestion-sub">${this.escapeHtml(pt.neighborhood)} • ${this.escapeHtml(pt.address)}</div>
            </div>
            <span class="suggestion-tag">♻️ Ponto</span>
          </button>
        `;
        })
        .join('');
    }

    if (topPlaces.length > 0) {
      html += `<div class="suggestion-group-title">📍 Lugares & Endereços no Mapa</div>`;
      html += topPlaces
        .map((pl, idx) => {
          const safeJson = this.escapeHtml(JSON.stringify(pl));
          return `
          <button type="button" class="suggestion-item is-place" data-place="${safeJson}" onclick="App.selectSuggestedPlaceFromBtn(this)">
            <div class="suggestion-icon">${ReciclaIcons.placePinSVG(18)}</div>
            <div class="suggestion-text">
              <div class="suggestion-title">${this.escapeHtml(pl.name)}</div>
              <div class="suggestion-sub">${this.escapeHtml(pl.area)}</div>
            </div>
            <span class="suggestion-tag">📍 Local</span>
          </button>
        `;
        })
        .join('');
    }

    box.innerHTML = html;
    box.classList.add('open');
  },

  closeSearchSuggestions() {
    const box = document.getElementById('search-suggestions');
    if (box) box.classList.remove('open');
  },

  selectSuggestedPoint(pointId) {
    this.closeSearchSuggestions();
    this.openPointDetails(pointId);
  },

  selectSuggestedPlaceFromBtn(btn) {
    const raw = btn.getAttribute('data-place');
    if (!raw) return;
    const place = JSON.parse(raw);
    this.selectSuggestedPlace(place);
  },

  selectSuggestedPlace(place) {
    this.closeSearchSuggestions();
    this.searchedPlace = place;

    // Atualiza o input com o nome do lugar sem esconder os pontos próximos na lista
    const input = document.getElementById('search-input');
    if (input) input.value = place.name;
    this.searchQuery = ''; // Limpa filtro de texto para mostrar todos os pontos próximos ao lugar!
    document.getElementById('search-clear-btn').style.display = 'inline-flex';

    if (this.searchedPlaceMarker && this.map) {
      this.map.removeLayer(this.searchedPlaceMarker);
    }

    if (this.map) {
      const icon = L.divIcon({
        className: '',
        html: ReciclaIcons.createPlacePinHTML(),
        iconSize: [32, 38],
        iconAnchor: [16, 36]
      });
      this.searchedPlaceMarker = L.marker([place.lat, place.lng], { icon }).addTo(this.map);
      this.searchedPlaceMarker
        .bindPopup(`<strong>📍 ${this.escapeHtml(place.name)}</strong><br/><small>${this.escapeHtml(place.area)}</small>`)
        .openPopup();
      this.map.flyTo([place.lat, place.lng], 15, { duration: 0.75 });
    }

    this.renderMapAndPoints();
    this.showToast(`📍 Mostrando "${place.name}" e os pontos de reciclagem próximos!`);
  },

  clearSearch() {
    this.searchQuery = '';
    this.searchedPlace = null;
    this.remotePlaces = [];
    if (this.searchedPlaceMarker && this.map) {
      this.map.removeLayer(this.searchedPlaceMarker);
      this.searchedPlaceMarker = null;
    }
    const input = document.getElementById('search-input');
    if (input) input.value = '';
    document.getElementById('search-clear-btn').style.display = 'none';
    this.closeSearchSuggestions();
    this.renderMapAndPoints();
  },

  getFilteredPoints() {
    const points = ReciclaDB.data?.points || [];
    const q = this.normalizeText(this.searchQuery);

    let filtered = points.filter((pt) => {
      const matchesMaterial =
        this.activeMaterialFilters.length === 0 ||
        (Array.isArray(pt.materials) &&
          this.activeMaterialFilters.every((m) => pt.materials.includes(m)));

      const fullName = ReciclaIcons.formatPointName(pt.name);
      const matchesQuery =
        !q ||
        this.normalizeText(fullName).includes(q) ||
        this.normalizeText(pt.neighborhood).includes(q) ||
        this.normalizeText(pt.address).includes(q) ||
        this.normalizeText(pt.description).includes(q);

      return matchesMaterial && matchesQuery;
    });

    // Referência para cálculo de distância: Lugar pesquisado (se houver) ou GPS do usuário
    const refCoords = this.searchedPlace || this.userLocation;

    filtered = filtered.map((pt) => {
      let distanceKm = null;
      if (refCoords) {
        distanceKm = this.calculateDistanceKm(
          refCoords.lat,
          refCoords.lng,
          Number(pt.lat),
          Number(pt.lng)
        );
      }
      return { ...pt, distanceKm };
    });

    const sortMode = document.getElementById('sort-select')?.value || 'distance';
    if (sortMode === 'distance' && refCoords) {
      filtered.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    } else if (sortMode === 'alpha') {
      filtered.sort((a, b) =>
        ReciclaIcons.formatPointName(a.name).localeCompare(ReciclaIcons.formatPointName(b.name), 'pt-BR')
      );
    }

    return filtered;
  },

  renderMapAndPoints() {
    this.renderMapMarkers();
    this.renderPointsList();
  },

  renderMapMarkers() {
    if (!this.map || !this.markersLayer) return;
    this.markersLayer.clearLayers();

    const filtered = this.getFilteredPoints();
    filtered.forEach((pt) => {
      const isSelected = this.selectedPointId === pt.id;
      const icon = L.divIcon({
        className: '',
        html: ReciclaIcons.createMapPinHTML(pt, isSelected),
        iconSize: [44, 34],
        iconAnchor: [22, 30]
      });

      const marker = L.marker([Number(pt.lat), Number(pt.lng)], { icon }).addTo(this.markersLayer);
      marker.on('click', () => {
        this.openPointDetails(pt.id);
      });
    });
  },

  renderPointsList() {
    const container = document.getElementById('points-list-container');
    const countLabel = document.getElementById('points-count-label');
    if (!container) return;

    const filtered = this.getFilteredPoints();
    if (countLabel) {
      if (this.searchedPlace) {
        countLabel.textContent = `${filtered.length} pontos próximos a ${this.searchedPlace.name}`;
      } else {
        countLabel.textContent =
          filtered.length === 1
            ? '1 ponto de reciclagem encontrado'
            : `${filtered.length} pontos de reciclagem encontrados`;
      }
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="background:#fff;border:1px dashed var(--border-strong);border-radius:16px;padding:24px;text-align:center;">
          <p style="font-size:0.9rem;font-weight:700;color:var(--text-main);margin-bottom:4px;">Nenhum ponto de reciclagem encontrado</p>
          <p style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:12px;">Tente limpar o filtro de material ou buscar por outro bairro ou praça.</p>
          <button class="btn btn-secondary" onclick="App.setMaterialFilter('todos');App.clearSearch();">Mostrar todos os pontos</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered
      .map((pt) => {
        const displayName = ReciclaIcons.formatPointName(pt.name);
        const distBadge =
          pt.distanceKm !== null
            ? `<span class="distance-badge">📍 ${pt.distanceKm < 1 ? `${Math.round(pt.distanceKm * 1000)} m` : `${pt.distanceKm.toFixed(1)} km`}</span>`
            : `<span class="distance-badge">${this.escapeHtml(pt.neighborhood)}</span>`;

        const badges = (pt.materials || [])
          .map((m) => ReciclaIcons.getMaterialBadge(m))
          .join('');

        const gmapsUrl = this.buildGoogleMapsNavUrl(pt);

        return `
        <article class="point-card ${this.selectedPointId === pt.id ? 'selected' : ''}" onclick="App.openPointDetails('${pt.id}')">
          <div class="point-card-top">
            <div style="display:flex;align-items:flex-start;gap:8px;">
              <span style="width:28px;height:28px;border-radius:8px;background:var(--emerald-100);color:var(--emerald-800);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;" title="Ponto de Reciclagem">
                ${ReciclaIcons.recycleSVG(16)}
              </span>
              <div>
                <h3 class="point-title">${this.escapeHtml(displayName)}</h3>
                <div class="point-neighborhood">📌 ${this.escapeHtml(pt.neighborhood)}</div>
              </div>
            </div>
            ${distBadge}
          </div>

          <p class="point-address">${this.escapeHtml(pt.address)}</p>

          <div class="point-meta-row">
            <span>🕒 ${this.escapeHtml(pt.hours || 'Horário comercial')}</span>
            ${pt.phone ? `<span>📞 ${this.escapeHtml(pt.phone)}</span>` : ''}
          </div>

          <div class="materials-wrap">${badges}</div>

          <div class="point-actions" onclick="event.stopPropagation();">
            <button class="btn btn-secondary" onclick="App.previewRouteOnMap('${pt.id}')">
              🗺️ Ver no Mapa
            </button>
            <a class="btn btn-primary" href="${gmapsUrl}" target="_blank" rel="noopener noreferrer">
              🧭 Navegar (Google Maps)
            </a>
          </div>
        </article>
      `;
      })
      .join('');
  },

  buildGoogleMapsNavUrl(point) {
    const dest = `${point.lat},${point.lng}`;
    if (this.userLocation) {
      const origin = `${this.userLocation.lat},${this.userLocation.lng}`;
      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&travelmode=driving`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`;
  },

  openPointDetails(pointId) {
    const pt = (ReciclaDB.data?.points || []).find((p) => p.id === pointId);
    if (!pt) return;

    const displayName = ReciclaIcons.formatPointName(pt.name);
    this.selectedPointId = pointId;
    this.renderMapMarkers();

    if (this.map) {
      this.map.flyTo([Number(pt.lat), Number(pt.lng)], 15, { duration: 0.6 });
    }

    let distText = 'Ative o GPS para calcular a distância';
    if (this.userLocation) {
      const d = this.calculateDistanceKm(
        this.userLocation.lat,
        this.userLocation.lng,
        Number(pt.lat),
        Number(pt.lng)
      );
      distText = d < 1 ? `A ${Math.round(d * 1000)} metros de você` : `A ${d.toFixed(2)} km de você`;
    }

    const badges = (pt.materials || []).map((m) => ReciclaIcons.getMaterialBadge(m)).join('');
    const gmapsUrl = this.buildGoogleMapsNavUrl(pt);

    const content = document.getElementById('point-detail-content');
    content.innerHTML = `
      <div class="sheet-handle"></div>
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px;">
        <div>
          <span class="distance-badge" style="display:inline-flex;align-items:center;gap:5px;margin-bottom:6px;">
            ${ReciclaIcons.recycleSVG(13)} ${distText}
          </span>
          <h3 style="font-size:1.08rem;font-weight:800;color:var(--text-main);">${this.escapeHtml(displayName)}</h3>
          <p style="font-size:0.8rem;font-weight:600;color:var(--emerald-700);">${this.escapeHtml(pt.neighborhood)} • Belém - PA</p>
        </div>
        <button class="icon-btn" onclick="App.closePointModal()">✕</button>
      </div>

      <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:10px;line-height:1.45;">
        ${this.escapeHtml(pt.description || 'Ponto de entrega voluntária de materiais recicláveis.')}
      </p>

      <div style="background:var(--surface-bg);border-radius:12px;padding:11px;margin-bottom:12px;font-size:0.79rem;display:flex;flex-direction:column;gap:5px;">
        <div><strong>📍 Endereço:</strong> ${this.escapeHtml(pt.address)}</div>
        <div><strong>🕒 Funcionamento:</strong> ${this.escapeHtml(pt.hours || 'Consulte local')}</div>
        ${pt.phone ? `<div><strong>📞 Contato:</strong> ${this.escapeHtml(pt.phone)}</div>` : ''}
      </div>

      <div style="margin-bottom:14px;">
        <div style="font-size:0.75rem;font-weight:700;color:var(--text-secondary);margin-bottom:6px;">MATERIAIS ACEITOS NESTE PONTO:</div>
        <div class="materials-wrap">${badges}</div>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;">
        <a class="btn btn-primary" href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="padding:12px;font-size:0.86rem;">
          🧭 Iniciar Modo Navegação no Google Maps
        </a>
        <button class="btn btn-secondary" onclick="App.closePointModal();App.previewRouteOnMap('${pt.id}');">
          🗺️ Traçar Linha de Rota no Mapa do App
        </button>
      </div>
    `;

    document.getElementById('point-detail-modal').classList.add('open');
  },

  closePointModal() {
    document.getElementById('point-detail-modal').classList.remove('open');
  },

  previewRouteOnMap(pointId) {
    const pt = (ReciclaDB.data?.points || []).find((p) => p.id === pointId);
    if (!pt || !this.map) return;

    this.togglePointsDrawer(false);
    this.selectedPointId = pointId;
    this.renderMapAndPoints();

    // Se o usuário ainda não ativou localização, usa posição simulada no centro de Belém para demonstrar a rota
    if (!this.userLocation) {
      this.setUserLocation(-1.4539, -48.4934, 'Belém (Simulado)');
    }

    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
    }

    const latlngs = [
      [this.userLocation.lat, this.userLocation.lng],
      [Number(pt.lat), Number(pt.lng)]
    ];

    this.routeLine = L.polyline(latlngs, {
      color: '#059669',
      weight: 4,
      dashArray: '8, 8'
    }).addTo(this.map);

    this.map.fitBounds(this.routeLine.getBounds(), { padding: [45, 45] });

    const dist = this.calculateDistanceKm(
      this.userLocation.lat,
      this.userLocation.lng,
      Number(pt.lat),
      Number(pt.lng)
    );
    const estMinutes = Math.max(2, Math.round((dist / 25) * 60));

    const banner = document.getElementById('route-banner');
    const text = document.getElementById('route-banner-text');
    text.innerHTML = `🧭 <strong>${this.escapeHtml(pt.name)}</strong> • ${dist.toFixed(1)} km (~${estMinutes} min)`;
    banner.classList.add('visible');

    // Rola para o topo do mapa
    document.querySelector('.app-content').scrollTo({ top: 0, behavior: 'smooth' });
  },

  clearRoute() {
    if (this.routeLine && this.map) {
      this.map.removeLayer(this.routeLine);
      this.routeLine = null;
    }
    document.getElementById('route-banner').classList.remove('visible');
  },

  /* ========================================================================
     ABA 2: GUIA DE RECICLAGEM (ONDE JOGAR CADA MATERIAL & INCENTIVOS)
     ======================================================================== */
  renderGuideAndIncentives() {
    const incContainer = document.getElementById('incentives-container');
    const guideContainer = document.getElementById('materials-guide-container');

    const incentives = ReciclaDB.data?.incentives || [];
    const guide = ReciclaDB.data?.materialsGuide || [];

    if (incContainer) {
      incContainer.innerHTML = incentives
        .map(
          (inc) => `
        <article class="incentive-card">
          <span class="incentive-tag">${this.escapeHtml(inc.tag || 'Sustentabilidade')}</span>
          <h4 class="incentive-title">${this.escapeHtml(inc.title)}</h4>
          <div class="incentive-metric">⚡ ${this.escapeHtml(inc.metric)}</div>
          <p class="incentive-desc">${this.escapeHtml(inc.description)}</p>
        </article>
      `
        )
        .join('');
    }

    if (guideContainer) {
      guideContainer.innerHTML = guide
        .map(
          (g) => `
        <article class="guide-card">
          <div class="guide-card-header">
            <div class="guide-title-group">
              ${ReciclaIcons.getMaterialIcon(g.slug, 32)}
              <h4 style="font-size:0.96rem;font-weight:800;">${this.escapeHtml(g.name)}</h4>
            </div>
            <span class="guide-color-pill" style="background:${g.bgSoft || '#ECFDF5'};color:${g.colorHex || '#059669'};border:1px solid ${g.colorHex || '#10B981'}40;">
              ${this.escapeHtml(g.binColorName)}
            </span>
          </div>

          <div style="font-size:0.78rem;font-weight:700;color:var(--emerald-800);margin-bottom:8px;">
            📍 Onde jogar: ${this.escapeHtml(g.whereToThrow)}
          </div>

          <div class="guide-box can-box">
            <strong>✅ O que PODE descartar</strong>
            ${this.escapeHtml(g.canRecycle)}
          </div>

          <div class="guide-box cannot-box">
            <strong>❌ O que NÃO pode descartar</strong>
            ${this.escapeHtml(g.cannotRecycle)}
          </div>

          <div class="guide-tip">
            <strong>💡 Como preparar antes de jogar:</strong> ${this.escapeHtml(g.prepTip)}
          </div>
        </article>
      `
        )
        .join('');
    }
  },

  /* ========================================================================
     ABA 3: NOTÍCIAS E INFORMAÇÕES
     ======================================================================== */
  renderNews() {
    const container = document.getElementById('news-list-container');
    if (!container) return;

    const newsList = ReciclaDB.data?.news || [];
    if (newsList.length === 0) {
      container.innerHTML = `<p style="font-size:0.82rem;color:var(--text-muted);">Nenhuma notícia cadastrada.</p>`;
      return;
    }

    // Ordena destacadas primeiro
    const sorted = [...newsList].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

    container.innerHTML = sorted
      .map((n) => {
        const coverHtml = n.imageUrl
          ? `<img class="news-cover-img" src="${this.escapeHtml(n.imageUrl)}" alt="${this.escapeHtml(n.title)}" loading="lazy" onerror="this.style.display='none'" />`
          : '';
        const sourceLinkHtml = n.sourceUrl
          ? `<a class="news-source-link" href="${this.escapeHtml(n.sourceUrl)}" target="_blank" rel="noopener noreferrer">🔗 Ler matéria original</a>`
          : '';
        return `
      <article class="news-card ${n.featured ? 'featured' : ''}">
        ${coverHtml}
        <div class="news-meta">
          <span class="news-cat">${n.featured ? '⭐ Destaque • ' : ''}${this.escapeHtml(n.category)}</span>
          <span class="news-date">${this.escapeHtml(n.date)}</span>
        </div>
        <h3 class="news-title">${this.escapeHtml(n.title)}</h3>
        <p class="news-summary">${this.escapeHtml(n.summary)}</p>
        <div class="news-footer-row">
          <div class="news-author">Fonte: ${this.escapeHtml(n.author || 'Equipe ReciclaBelém')}</div>
          ${sourceLinkHtml}
        </div>
      </article>
    `;
      })
      .join('');
  },

  /* ========================================================================
     ABA 4: DASHBOARD ADMINISTRATIVO (CRUD COMPLETO)
     ======================================================================== */
  renderAdminMaterialCheckboxes() {
    const grid = document.getElementById('pt-materials-checkboxes');
    if (!grid) return;

    grid.innerHTML = Object.entries(ReciclaIcons.materialMeta)
      .map(
        ([slug, m]) => `
      <label class="checkbox-item">
        <input type="checkbox" name="pt-mat" value="${slug}" />
        <span class="checkbox-label">${ReciclaIcons.getMaterialIcon(slug, 20)} ${m.label}</span>
      </label>
    `
      )
      .join('');
  },

  renderAdminDashboard() {
    const points = ReciclaDB.data?.points || [];
    const news = ReciclaDB.data?.news || [];
    const guide = ReciclaDB.data?.materialsGuide || [];
    const incentives = ReciclaDB.data?.incentives || [];

    document.getElementById('admin-stats-badge').textContent = `${points.length} pontos • ${news.length} notícias`;
    document.getElementById('admin-points-total').textContent = points.length;

    // 1. Lista de Pontos no Admin
    const ptsList = document.getElementById('admin-points-list');
    if (ptsList) {
      ptsList.innerHTML = points
        .map(
          (p) => `
        <div class="admin-list-item">
          <div class="admin-item-info">
            <h4>${this.escapeHtml(p.name)}</h4>
            <p>${this.escapeHtml(p.neighborhood)} • ${(p.materials || []).length} materiais</p>
          </div>
          <div class="admin-item-actions">
            <button class="icon-btn" onclick="App.editPoint('${p.id}')">✏️ Editar</button>
            <button class="icon-btn delete" onclick="App.deletePoint('${p.id}')">🗑️ Remover</button>
          </div>
        </div>
      `
        )
        .join('');
    }

    // 2. Lista de Notícias no Admin
    const newsListEl = document.getElementById('admin-news-list');
    if (newsListEl) {
      newsListEl.innerHTML = news
        .map(
          (n) => `
        <div class="admin-list-item">
          <div class="admin-item-info">
            <h4>${this.escapeHtml(n.title)}</h4>
            <p>${this.escapeHtml(n.category)} • ${this.escapeHtml(n.date)}</p>
          </div>
          <div class="admin-item-actions">
            <button class="icon-btn" onclick="App.editNews('${n.id}')">✏️ Editar</button>
            <button class="icon-btn delete" onclick="App.deleteNews('${n.id}')">🗑️ Remover</button>
          </div>
        </div>
      `
        )
        .join('');
    }

    // 3. Lista de Materiais do Guia no Admin
    const guideListEl = document.getElementById('admin-guide-list');
    if (guideListEl) {
      guideListEl.innerHTML = guide
        .map(
          (g) => `
        <div class="admin-list-item">
          <div class="admin-item-info">
            <h4>${this.escapeHtml(g.name)} (${this.escapeHtml(g.binColorName)})</h4>
            <p>${this.escapeHtml(g.whereToThrow)}</p>
          </div>
          <div class="admin-item-actions">
            <button class="icon-btn" onclick="App.editGuideItem('${g.id}')">✏️ Editar</button>
            <button class="icon-btn delete" onclick="App.deleteGuideItem('${g.id}')">🗑️ Remover</button>
          </div>
        </div>
      `
        )
        .join('');
    }

    // 4. Lista de Incentivos no Admin
    const incListEl = document.getElementById('admin-incentives-list');
    if (incListEl) {
      incListEl.innerHTML = incentives
        .map(
          (inc) => `
        <div class="admin-list-item">
          <div class="admin-item-info">
            <h4>${this.escapeHtml(inc.title)}</h4>
            <p>${this.escapeHtml(inc.metric)}</p>
          </div>
          <div class="admin-item-actions">
            <button class="icon-btn delete" onclick="App.deleteIncentive('${inc.id}')">🗑️ Remover</button>
          </div>
        </div>
      `
        )
        .join('');
    }
  },

  // --- CALENDÁRIO SEMANAL & HORÁRIO DE FUNCIONAMENTO ---
  toggleSchedulePicker(forceState) {
    const picker = document.getElementById('schedule-picker');
    if (!picker) return;
    const isOpen = typeof forceState === 'boolean' ? forceState : !picker.classList.contains('open');
    picker.classList.toggle('open', isOpen);
  },

  toggleWeekday(day) {
    const btn = document.querySelector(`#weekday-grid .weekday-btn[data-day="${day}"]`);
    if (!btn) return;
    btn.classList.toggle('active');
    this.syncScheduleToInput();
  },

  applySchedulePreset(preset) {
    const daysMap = {
      'seg-sex': ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
      'seg-sab': ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
      todos: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    };
    const activeDays = daysMap[preset] || [];
    document.querySelectorAll('#weekday-grid .weekday-btn').forEach((btn) => {
      btn.classList.toggle('active', activeDays.includes(btn.dataset.day));
    });
    this.syncScheduleToInput();
  },

  formatWeekdaysLabel(selectedDays) {
    const order = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const sorted = order.filter((d) => selectedDays.includes(d));
    if (sorted.length === 0) return 'Selecione os dias';
    if (sorted.length === 7) return 'Todos os dias';

    // Verifica se forma uma sequência contínua a partir de Seg (ex: Seg a Sex, Seg a Sáb)
    const indices = sorted.map((d) => order.indexOf(d));
    const isContiguous = indices.every((val, i) => i === 0 || val === indices[i - 1] + 1);
    if (isContiguous && sorted.length >= 3) {
      return `${sorted[0]} a ${sorted[sorted.length - 1]}`;
    }
    return sorted.join(', ');
  },

  formatTimeBr(hhmm) {
    if (!hhmm) return '08h';
    const [h, m] = hhmm.split(':');
    return m === '00' ? `${h}h` : `${h}h${m}`;
  },

  syncScheduleToInput() {
    const selectedDays = Array.from(document.querySelectorAll('#weekday-grid .weekday-btn.active')).map(
      (b) => b.dataset.day
    );
    const is24h = document.getElementById('sched-24h')?.checked;
    const openEl = document.getElementById('sched-open');
    const closeEl = document.getElementById('sched-close');
    if (openEl) openEl.disabled = !!is24h;
    if (closeEl) closeEl.disabled = !!is24h;

    const daysLabel = this.formatWeekdaysLabel(selectedDays);
    if (selectedDays.length === 0) {
      document.getElementById('pt-hours').value = '';
      return;
    }

    const timeLabel = is24h
      ? '24 horas'
      : `${this.formatTimeBr(openEl?.value)} às ${this.formatTimeBr(closeEl?.value)}`;
    document.getElementById('pt-hours').value = `${daysLabel} • ${timeLabel}`;
  },

  loadScheduleFromString(hoursStr) {
    const str = String(hoursStr || '');
    const order = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    if (/todos os dias/i.test(str)) {
      days = [...order];
    } else if (/seg a sex/i.test(str)) {
      days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
    } else if (/seg a s[aá]b/i.test(str)) {
      days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    } else if (/ter a dom/i.test(str)) {
      days = ['Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    } else {
      const found = order.filter((d) => new RegExp(d.replace('á', '[aá]'), 'i').test(str));
      if (found.length > 0) days = found;
    }

    document.querySelectorAll('#weekday-grid .weekday-btn').forEach((btn) => {
      btn.classList.toggle('active', days.includes(btn.dataset.day));
    });

    const is24h = /24\s*h/i.test(str);
    const cb24 = document.getElementById('sched-24h');
    if (cb24) cb24.checked = is24h;

    const timeMatches = str.match(/(\d{1,2})h(\d{2})?/gi);
    if (timeMatches && timeMatches.length >= 2) {
      const toHHMM = (t) => {
        const m = t.match(/(\d{1,2})h(\d{2})?/i);
        return `${String(m[1]).padStart(2, '0')}:${m[2] || '00'}`;
      };
      document.getElementById('sched-open').value = toHHMM(timeMatches[0]);
      document.getElementById('sched-close').value = toHHMM(timeMatches[1]);
    }
  },

  // --- CRUD DE PONTOS (SELETOR DE PIN NO MAPA) ---
  pickCoordinatesOnMap() {
    this.mapClickMode = 'pickAdminCoords';
    this.pendingPickerResult = null;
    this.switchTab('mapa');

    const tabMapa = document.getElementById('tab-mapa');
    if (tabMapa) tabMapa.classList.add('picking-active');
    const wrapper = document.getElementById('map-wrapper');
    if (wrapper) wrapper.classList.add('picking-location');

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
        const existingLat = parseFloat(document.getElementById('pt-lat').value);
        const existingLng = parseFloat(document.getElementById('pt-lng').value);
        if (!Number.isNaN(existingLat) && !Number.isNaN(existingLng)) {
          this.map.setView([existingLat, existingLng], 16);
        }
        this.schedulePickerPreviewUpdate();
      }
    }, 180);
  },

  getPinLatLng() {
    const wrapper = document.getElementById('map-wrapper');
    if (!this.map || !wrapper) return { lat: -1.4558, lng: -48.4898 };
    const pt = L.point(wrapper.clientWidth / 2, wrapper.clientHeight * 0.42);
    const ll = this.map.containerPointToLatLng(pt);
    return {
      lat: Number(ll.lat.toFixed(5)),
      lng: Number(ll.lng.toFixed(5))
    };
  },

  schedulePickerPreviewUpdate() {
    const previewEl = document.getElementById('picker-preview-address');
    if (previewEl) previewEl.textContent = 'Buscando endereço...';

    const { lat, lng } = this.getPinLatLng();
    this.pendingPickerResult = {
      lat,
      lng,
      street: 'Local selecionado no mapa',
      houseNumber: 's/n',
      neighborhood: 'Belém'
    };

    clearTimeout(this._pickerDebounce);
    this._pickerDebounce = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          const street =
            addr.road ||
            addr.pedestrian ||
            addr.square ||
            addr.footway ||
            addr.suburb ||
            'Local selecionado no mapa';
          const houseNumber = addr.house_number || 's/n';
          const neighborhood = addr.suburb || addr.neighbourhood || addr.city_district || 'Belém';

          this.pendingPickerResult = { lat, lng, street, houseNumber, neighborhood };
          if (previewEl) {
            previewEl.textContent = `${street}, ${houseNumber} • ${neighborhood}`;
          }
          return;
        }
      } catch (e) {}

      if (previewEl) {
        previewEl.textContent = `Ponto marcado no mapa (${lat}, ${lng})`;
      }
    }, 320);
  },

  confirmMapPickerLocation() {
    const res = this.pendingPickerResult || {
      ...this.getPinLatLng(),
      street: 'Local selecionado no mapa',
      houseNumber: 's/n',
      neighborhood: 'Belém'
    };

    document.getElementById('pt-lat').value = res.lat;
    document.getElementById('pt-lng').value = res.lng;
    document.getElementById('pt-address').value = res.street;
    document.getElementById('pt-number').value = res.houseNumber;
    document.getElementById('pt-neighborhood').value = res.neighborhood;

    const fieldsWrap = document.getElementById('pt-location-fields');
    if (fieldsWrap) fieldsWrap.style.display = 'block';

    const btnPick = document.getElementById('btn-pick-map');
    if (btnPick) btnPick.textContent = '🗺️ Local confirmado! (Clique para alterar no mapa)';

    this.exitMapPickerMode();
    this.showToast('📍 Endereço e bairro preenchidos! Edite manualmente se precisar.');
  },

  cancelMapPicker() {
    this.exitMapPickerMode();
  },

  exitMapPickerMode() {
    this.mapClickMode = null;
    const tabMapa = document.getElementById('tab-mapa');
    if (tabMapa) tabMapa.classList.remove('picking-active');
    const wrapper = document.getElementById('map-wrapper');
    if (wrapper) wrapper.classList.remove('picking-location');
    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 200);
    }
    this.switchTab('admin');
    this.switchAdminSubtab('pontos');
  },

  async savePoint(event) {
    event.preventDefault();
    const id = document.getElementById('pt-id').value;
    const rawName = document.getElementById('pt-name').value.trim();
    const name = ReciclaIcons.formatPointName(rawName);
    const neighborhood = document.getElementById('pt-neighborhood').value.trim();
    const hours = document.getElementById('pt-hours').value.trim();
    const street = document.getElementById('pt-address').value.trim();
    const houseNumber = document.getElementById('pt-number').value.trim();
    const lat = parseFloat(document.getElementById('pt-lat').value);
    const lng = parseFloat(document.getElementById('pt-lng').value);
    const phone = document.getElementById('pt-phone').value.trim();
    const description = document.getElementById('pt-desc').value.trim();

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      this.showToast('⚠️ Clique em "Selecionar no mapa" para escolher o local do ponto!');
      return;
    }

    if (!street) {
      this.showToast('⚠️ Preencha o endereço do ponto!');
      return;
    }

    const address = houseNumber ? `${street}, ${houseNumber}` : street;

    const checkedMaterials = Array.from(document.querySelectorAll('input[name="pt-mat"]:checked')).map(
      (cb) => cb.value
    );

    if (checkedMaterials.length === 0) {
      this.showToast('⚠️ Selecione pelo menos 1 material aceito pelo ponto!');
      return;
    }

    const pointObj = {
      id: id || `pt-${Date.now()}`,
      name,
      neighborhood,
      hours,
      address,
      lat,
      lng,
      phone,
      materials: checkedMaterials,
      status: 'ativo',
      description: description || 'Ponto de entrega voluntária para recicláveis.'
    };

    if (id) {
      const idx = ReciclaDB.data.points.findIndex((p) => p.id === id);
      if (idx !== -1) ReciclaDB.data.points[idx] = pointObj;
    } else {
      ReciclaDB.data.points.unshift(pointObj);
    }

    await ReciclaDB.save();
    this.resetPointForm();
    this.renderAll();
    this.showToast('✅ Ponto de reciclagem salvo no banco de dados!');
  },

  editPoint(id) {
    const pt = ReciclaDB.data.points.find((p) => p.id === id);
    if (!pt) return;

    document.getElementById('pt-id').value = pt.id;
    document.getElementById('pt-name').value = pt.name;
    document.getElementById('pt-neighborhood').value = pt.neighborhood;
    document.getElementById('pt-hours').value = pt.hours || '';
    this.loadScheduleFromString(pt.hours || '');

    // Separa endereço e número se houver vírgula
    const rawAddr = String(pt.address || '');
    const commaMatch = rawAddr.match(/^(.*?),\s*(\d+|s\/n)\b(.*)$/i);
    if (commaMatch) {
      document.getElementById('pt-address').value = `${commaMatch[1]}${commaMatch[3] || ''}`.trim();
      document.getElementById('pt-number').value = commaMatch[2].trim();
    } else {
      document.getElementById('pt-address').value = rawAddr;
      document.getElementById('pt-number').value = '';
    }

    document.getElementById('pt-lat').value = pt.lat;
    document.getElementById('pt-lng').value = pt.lng;
    document.getElementById('pt-location-fields').style.display = 'block';
    const btnPick = document.getElementById('btn-pick-map');
    if (btnPick) btnPick.textContent = '🗺️ Alterar local selecionado no mapa';

    document.getElementById('pt-phone').value = pt.phone || '';
    document.getElementById('pt-desc').value = pt.description || '';

    document.querySelectorAll('input[name="pt-mat"]').forEach((cb) => {
      cb.checked = (pt.materials || []).includes(cb.value);
    });

    document.getElementById('point-form-title').textContent = `✏️ Editando: ${pt.name}`;
    document.getElementById('point-form-cancel').style.display = 'inline-block';
    document.querySelector('.app-content').scrollTo({ top: 0, behavior: 'smooth' });
  },

  async deletePoint(id) {
    ReciclaDB.data.points = ReciclaDB.data.points.filter((p) => p.id !== id);
    await ReciclaDB.save();
    this.renderAll();
    this.showToast('🗑️ Ponto removido do banco de dados.');
  },

  resetPointForm() {
    document.getElementById('form-point').reset();
    document.getElementById('pt-id').value = '';
    document.getElementById('pt-lat').value = '';
    document.getElementById('pt-lng').value = '';
    document.getElementById('pt-location-fields').style.display = 'none';
    const btnPick = document.getElementById('btn-pick-map');
    if (btnPick) btnPick.textContent = '🗺️ Selecionar no mapa';
    this.applySchedulePreset('seg-sab');
    document.getElementById('sched-open').value = '08:00';
    document.getElementById('sched-close').value = '18:00';
    document.getElementById('sched-24h').checked = false;
    this.syncScheduleToInput();
    this.toggleSchedulePicker(false);
    document.getElementById('point-form-title').textContent = '➕ Cadastrar Novo Ponto de Reciclagem';
    document.getElementById('point-form-cancel').style.display = 'none';
  },

  // --- CRUD DE NOTÍCIAS ---
  async fetchNewsClientFallback() {
    const queries = [
      'reciclagem coleta seletiva Belém Pará',
      'ecologia sustentabilidade meio ambiente Belém Ananindeua Outeiro Pará'
    ];
    const collected = [];
    const seen = new Set();

    for (const q of queries) {
      try {
        const rssUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss&mkt=pt-BR`;
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
        const res = await fetch(apiUrl);
        if (!res.ok) continue;
        const json = await res.json();
        for (const item of json.items || []) {
          const title = (item.title || '').trim();
          if (!title || /Belém do Piauí|Belém de Maria|Belém do São Francisco/i.test(title)) continue;
          const key = title.toLowerCase().slice(0, 60);
          if (seen.has(key)) continue;
          seen.add(key);

          let sourceUrl = item.link || '';
          try {
            const inner = new URL(sourceUrl).searchParams.get('url');
            if (inner && /^https?:\/\//i.test(inner)) sourceUrl = inner;
          } catch (e) {}

          let author = item.author || '';
          if (!author && sourceUrl) {
            try {
              author = new URL(sourceUrl).hostname.replace(/^www\./, '');
            } catch (e) {}
          }

          const cleanSummary = (item.description || title).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          const dt = item.pubDate ? new Date(item.pubDate.replace(' ', 'T')) : new Date();
          const datePt = Number.isNaN(dt.getTime())
            ? new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
            : dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

          collected.push({
            id: `gnews-${Date.now()}-${collected.length}`,
            title,
            category: 'Ecologia & Região',
            date: datePt,
            author: author || 'Portal de Notícias',
            featured: collected.length === 0,
            summary: cleanSummary || title,
            imageUrl: item.thumbnail || item.enclosure?.link || '',
            sourceUrl,
            isAuto: true
          });
          if (collected.length >= 6) break;
        }
      } catch (e) {}
      if (collected.length >= 6) break;
    }

    return collected;
  },

  async refreshNewsFromServer() {
    const btn = document.getElementById('btn-refresh-news');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Buscando notícias com fotos...';
    }
    try {
      const res = await fetch('/api/news/refresh', { method: 'POST' });
      const data = await res.json();
      if (data.ok && data.db) {
        ReciclaDB.data = data.db;
        await ReciclaDB.save();
        this.renderAll();
        this.showToast(`📰 ${data.added} notícias atualizadas (${data.withImages} com foto)!`);
        return;
      }
      throw new Error('Servidor indisponível');
    } catch (e) {
      // Fallback direto no navegador (funciona sem Node.js, em file:// ou GitHub Pages)
      const fetched = await this.fetchNewsClientFallback();
      if (fetched.length > 0) {
        const manualNews = (ReciclaDB.data.news || []).filter(
          (n) => !n.isAuto && !String(n.id).startsWith('gnews-')
        );
        ReciclaDB.data.news = [...fetched, ...manualNews];
        ReciclaDB.data.meta = ReciclaDB.data.meta || {};
        ReciclaDB.data.meta.lastNewsSync = new Date().toISOString();
        await ReciclaDB.save();
        this.renderAll();
        const withImg = fetched.filter((n) => !!n.imageUrl).length;
        this.showToast(`📰 ${fetched.length} notícias atualizadas (${withImg} com foto)!`);
      } else {
        this.showToast('⚠️ Não foi possível atualizar as notícias agora.');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🔄 Buscar Notícias Agora (Atualização Imediata)';
      }
    }
  },

  async saveNews(event) {
    event.preventDefault();
    const id = document.getElementById('news-id').value;
    const title = document.getElementById('news-title').value.trim();
    const category = document.getElementById('news-category').value.trim();
    const author = document.getElementById('news-author').value.trim();
    const imageUrl = document.getElementById('news-image')?.value.trim() || '';
    const summary = document.getElementById('news-summary').value.trim();
    const featured = document.getElementById('news-featured').checked;

    const dateStr = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const newsObj = {
      id: id || `news-${Date.now()}`,
      title,
      category,
      author,
      imageUrl,
      summary,
      featured,
      date: dateStr
    };

    if (id) {
      const idx = ReciclaDB.data.news.findIndex((n) => n.id === id);
      if (idx !== -1) ReciclaDB.data.news[idx] = newsObj;
    } else {
      ReciclaDB.data.news.unshift(newsObj);
    }

    await ReciclaDB.save();
    this.resetNewsForm();
    this.renderAll();
    this.showToast('✅ Notícia salva com sucesso!');
  },

  editNews(id) {
    const n = ReciclaDB.data.news.find((item) => item.id === id);
    if (!n) return;

    document.getElementById('news-id').value = n.id;
    document.getElementById('news-title').value = n.title;
    document.getElementById('news-category').value = n.category;
    document.getElementById('news-author').value = n.author || '';
    if (document.getElementById('news-image')) {
      document.getElementById('news-image').value = n.imageUrl || '';
    }
    document.getElementById('news-summary').value = n.summary;
    document.getElementById('news-featured').checked = !!n.featured;

    document.getElementById('news-form-title').textContent = '✏️ Editando Notícia';
    document.getElementById('news-form-cancel').style.display = 'inline-block';
    document.querySelector('.app-content').scrollTo({ top: 0, behavior: 'smooth' });
  },

  async deleteNews(id) {
    ReciclaDB.data.news = ReciclaDB.data.news.filter((n) => n.id !== id);
    await ReciclaDB.save();
    this.renderAll();
    this.showToast('🗑️ Notícia removida.');
  },

  resetNewsForm() {
    document.getElementById('form-news').reset();
    document.getElementById('news-id').value = '';
    document.getElementById('news-form-title').textContent = '➕ Publicar Nova Notícia ou Aviso';
    document.getElementById('news-form-cancel').style.display = 'none';
  },

  // --- CRUD DO GUIA (ONDE JOGAR) & INCENTIVOS ---
  async saveGuideItem(event) {
    event.preventDefault();
    const id = document.getElementById('guide-id').value;
    const name = document.getElementById('guide-name').value.trim();
    const binColorName = document.getElementById('guide-bin').value.trim();
    const whereToThrow = document.getElementById('guide-where').value.trim();
    const colorHex = document.getElementById('guide-color').value || '#10B981';
    const canRecycle = document.getElementById('guide-can').value.trim();
    const cannotRecycle = document.getElementById('guide-cannot').value.trim();
    const prepTip = document.getElementById('guide-tip').value.trim();

    const itemObj = {
      id: id || `mat-${Date.now()}`,
      slug: name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      name,
      binColorName,
      colorHex,
      bgSoft: '#F0FDF4',
      whereToThrow,
      canRecycle,
      cannotRecycle,
      prepTip
    };

    if (id) {
      const idx = ReciclaDB.data.materialsGuide.findIndex((g) => g.id === id);
      if (idx !== -1) ReciclaDB.data.materialsGuide[idx] = itemObj;
    } else {
      ReciclaDB.data.materialsGuide.push(itemObj);
    }

    await ReciclaDB.save();
    this.resetGuideForm();
    this.renderAll();
    this.showToast('✅ Instrução de reciclagem salva!');
  },

  editGuideItem(id) {
    const g = ReciclaDB.data.materialsGuide.find((item) => item.id === id);
    if (!g) return;

    document.getElementById('guide-id').value = g.id;
    document.getElementById('guide-name').value = g.name;
    document.getElementById('guide-bin').value = g.binColorName;
    document.getElementById('guide-where').value = g.whereToThrow;
    document.getElementById('guide-color').value = g.colorHex || '#10B981';
    document.getElementById('guide-can').value = g.canRecycle;
    document.getElementById('guide-cannot').value = g.cannotRecycle;
    document.getElementById('guide-tip').value = g.prepTip;

    document.getElementById('guide-form-title').textContent = `✏️ Editando: ${g.name}`;
    document.getElementById('guide-form-cancel').style.display = 'inline-block';
    document.querySelector('.app-content').scrollTo({ top: 0, behavior: 'smooth' });
  },

  async deleteGuideItem(id) {
    ReciclaDB.data.materialsGuide = ReciclaDB.data.materialsGuide.filter((g) => g.id !== id);
    await ReciclaDB.save();
    this.renderAll();
    this.showToast('🗑️ Instrução removida do guia.');
  },

  resetGuideForm() {
    document.getElementById('form-guide').reset();
    document.getElementById('guide-id').value = '';
    document.getElementById('guide-form-title').textContent = '➕ Adicionar/Editar Regra: Onde Jogar Material';
    document.getElementById('guide-form-cancel').style.display = 'none';
  },

  async saveIncentive(event) {
    event.preventDefault();
    const title = document.getElementById('inc-title').value.trim();
    const metric = document.getElementById('inc-metric').value.trim();
    const tag = document.getElementById('inc-tag').value.trim();
    const description = document.getElementById('inc-desc').value.trim();

    ReciclaDB.data.incentives.unshift({
      id: `inc-${Date.now()}`,
      title,
      metric,
      tag,
      description
    });

    await ReciclaDB.save();
    document.getElementById('form-incentive').reset();
    this.renderAll();
    this.showToast('💚 Novo card de incentivo publicado!');
  },

  async deleteIncentive(id) {
    ReciclaDB.data.incentives = ReciclaDB.data.incentives.filter((i) => i.id !== id);
    await ReciclaDB.save();
    this.renderAll();
    this.showToast('🗑️ Card de incentivo removido.');
  },

  // --- IMPORTAÇÃO E RESTAURAÇÃO DO BANCO ---
  handleImportJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed && Array.isArray(parsed.points)) {
          ReciclaDB.data = parsed;
          await ReciclaDB.save();
          this.renderAll();
          this.showToast('✅ Banco de dados JSON importado com sucesso!');
        } else {
          this.showToast('⚠️ Arquivo JSON inválido.');
        }
      } catch (err) {
        this.showToast('⚠️ Erro ao ler o arquivo JSON.');
      }
    };
    reader.readAsText(file);
  },

  async handleResetDB() {
    await ReciclaDB.resetToDefault();
    this.renderAll();
    this.showToast('🔄 Dados originais de Belém restaurados!');
  },

  /* ========================================================================
     NAVEGAÇÃO ENTRE ABAS, GAVETA DE PONTOS E UTILITÁRIOS
     ======================================================================== */
  togglePointsDrawer(forceState) {
    const drawer = document.getElementById('points-drawer');
    if (!drawer) return;
    const shouldExpand = typeof forceState === 'boolean' ? forceState : !drawer.classList.contains('expanded');
    drawer.classList.toggle('expanded', shouldExpand);
  },

  initPointsDrawerDrag() {
    const handle = document.getElementById('drawer-handle-bar');
    if (!handle) return;
    let startY = null;
    let moved = false;

    handle.addEventListener('pointerdown', (e) => {
      if (e.target.closest('select')) return;
      startY = e.clientY;
      moved = false;
    });

    window.addEventListener('pointermove', (e) => {
      if (startY === null) return;
      const dy = e.clientY - startY;
      if (Math.abs(dy) > 26) {
        moved = true;
        this.togglePointsDrawer(dy < 0);
        startY = null;
      }
    });

    window.addEventListener('pointerup', () => {
      startY = null;
    });

    // Evita duplo toggle quando o usuário arrastou
    handle.addEventListener(
      'click',
      (e) => {
        if (moved) {
          e.stopPropagation();
          moved = false;
        }
      },
      true
    );
  },

  switchTab(tabName) {
    this.currentTab = tabName;
    document.body.classList.toggle('tab-admin-active', tabName === 'admin');

    document.querySelectorAll('.tab-view').forEach((view) => {
      view.classList.toggle('active', view.id === `tab-${tabName}`);
    });

    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    if (tabName === 'mapa' && this.map) {
      setTimeout(() => this.map.invalidateSize(), 150);
    }
  },

  switchAdminSubtab(subtab) {
    document.querySelectorAll('.admin-subtab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.subtab === subtab);
    });
    document.querySelectorAll('.admin-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.id === `admin-panel-${subtab}`);
    });
  },

  renderAll() {
    this.renderMapAndPoints();
    this.renderGuideAndIncentives();
    this.renderNews();
    this.renderAdminDashboard();
  },

  showToast(message) {
    const toast = document.getElementById('app-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
