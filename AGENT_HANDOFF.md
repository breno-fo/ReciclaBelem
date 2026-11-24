# 🤖 AGENT_HANDOFF.md — Contexto Técnico Completo para o Próximo Agente de IA

> **Atenção, Agente de IA:** Este documento descreve exatamente como o **ReciclaBelém** está estruturado após as últimas alterações, o que já está pronto, quais decisões de arquitetura foram tomadas e o que falta finalizar. Leia antes de alterar qualquer arquivo.

---

## 1. Visão Geral da Arquitetura
- **Pasta raiz do app web/PWA:** `Source/` (NÃO editar arquivos fora de `Source/` como fonte principal).
- **Stack:** Vanilla JS modular (`Source/js/db.js`, `Source/js/icons.js`, `Source/js/app.js`), HTML5, CSS3 (`styles.css`, `mobile.css`, `content-refresh.css`, `map-refresh.css`), Leaflet local (`Source/vendor/leaflet/`), Service Worker (`Source/sw.js`) e servidor opcional Node.js (`Source/server.js`) sem `node_modules`.
- **Execução no Windows sem Node.js:** `Source/INICIAR_APP.bat` detecta `node`; se não houver, usa `python -m http.server 3000` (ou `py -m http.server 3000`). **Importante:** via `python -m http.server`, rotas `/api/db` e `/api/news/refresh` retornam 404, e o app usa automaticamente o fallback (`localStorage` + `data/database.json` + `api.rss2json.com`).

---

## 2. Mapa, Tiles, Offline & Rotas
- **Provedor de Tiles:** `https://tile.openstreetmap.de/{z}/{x}/{y}.png` (escolhido porque funciona em `http://localhost`, `https://` e `file://` sem exigir API key e sem bloqueio `403` do `tile.openstreetmap.org` ou "API KEY REQUIRED" do CARTO). Fallback `tileerror` para `ArcGIS World_Street_Map`.
- **Pinos do Mapa (`Source/js/app.js` + `Source/js/icons.js`):**
  - **SEM clustering/agrupamento:** `renderMapMarkers()` renderiza todos os pontos filtrados em qualquer nível de zoom (decisão explícita do usuário).
  - Cada pino exibe o ícone de reciclagem + a contagem real de materiais aceitos (`ReciclaIcons.createMapPinHTML(selected, matCount)`).
- **Pacote de Mapa Offline (`Source/data/belem-map-pack.bin` + `.meta.json`):**
  - Gerado por `Source/scripts/build-offline-map.py` (501 tiles de Belém, Icoaraci e Outeiro, zooms 12 a 15, **7,2 MB**).
  - Formato binário: `[4 bytes uint32 LE: header_len][header JSON [{z,x,y,offset,length}]][bytes PNG concatenados]`.
  - `startOfflineMapDownload()` baixa o `.bin` via streaming e grava os 501 tiles no `CacheStorage` (`recicla-belem-map-tiles`).
  - `verifyOfflineMapCached()` verifica no `CacheStorage` se os tiles realmente existem no aparelho; se já baixado, oculta os botões do modal e exibe a mensagem estática não clicável `#offline-already-msg`.
- **Trajeto 2D (`previewRouteOnMap`):**
  - Usa **OSRM** (`https://router.project-osrm.org/route/v1/driving/...`) para traçar rota real rua por rua em 2D.
  - Se o usuário clicar em **"Ver Trajeto no Mapa (2D)"** sem GPS ativo, salva `this.pendingRoutePointId = pointId`, abre `#location-modal` e retoma automaticamente a rota assim que o GPS for ativado.
- **Avaliação no Google Maps (`buildGoogleMapsReviewUrl`):**
  - Usa **coordenadas exatas** (`https://www.google.com/maps/search/?api=1&query=LAT,LNG`) — nunca busca por texto (para evitar desvios de nome como ocorreu com "Contêiner").

---

## 3. GPS, Privacidade (LGPD) & Modais
- **Botão GPS no cabeçalho (`#header-loc-btn`):**
  - 3 estados visuais: `idle` (`Ativar GPS`, cinza `#64748b`), `active` (`GPS ativo`, verde `#10b981`) e `denied` (`GPS não ativo`, vermelho `#dc2626`).
  - `denyLocationPermission()` chama `stopGpsTracking()`, cancela `navigator.geolocation.clearWatch(geoWatchId)`, remove `userMarker` e `routeLine` e limpa `userLocation`.
- **Modal de Localização (`#location-modal`):**
  - Contém apenas: `Usar minha localização`, `Escolher no mapa` (que abre o **seletor de pin central fixo** `#map-center-picker` no modo `pickUserCoords`) e `Continuar sem localização`.
  - A simulação de localização no Centro de Belém foi movida exclusivamente para a aba **`Modo Dev`** (`#tab-dev`).
- **Política de Privacidade:**
  - Documento completo em `Source/POLITICA_DE_PRIVACIDADE.md` + modal `#privacy-modal` acessível pelo botão azul `.privacy-link-btn` dentro de `#location-modal`. O botão `"Estou ciente"` apenas fecha `#privacy-modal` sem ativar o GPS.
- **Comportamento dos Modais & Toast:**
  - Todos os `.modal-backdrop` (`location-modal`, `point-detail-modal`, `offline-map-modal`, `privacy-modal`, `disque-entulho-modal`, `news-reader-modal`) fecham ao clicar no fundo borrado (`event.target === this`), preservando o estado anterior.
  - Quando qualquer modal está aberto (`.phone-frame:has(.modal-backdrop.open)`), `.toast-notification` sobe automaticamente para `top: 44px` (`z-index: 1300`) para não cobrir botões do modal.

---

## 4. Logos, Splash Screen, Notícias, Disque-Entulho & Sobre Nós
- **Logos (`Source/assets/icons/`):**
  - **Cabeçalho (`46px`), Launcher, Dock, Favicon e PWA (`manifest.json`):** Símbolo de Reciclagem (`logo_selo_round-{32,48,96,192,512}.png` + `logo_selo_maskable-512.png`).
  - **Splash Screen (`5000 ms` / 5 segundos):** Mascote Mucura close-up (`logo_mucura_splash-192.png`, gerada de `logo_mucura_round-small-master.png`).
- **Disque-Entulho Belém:** Botão flutuante de telefone acima do download offline abre `#disque-entulho-modal` com instruções da SESAN (até 1 m³, prazo 72h, denúncia 153) e link direto `wa.me/5591984053100` com mensagem pré-preenchida.
- **Notícias:** Sem notícias mocadas; apenas as 6 notícias reais (`gnews-*`) com `fullText` extraído. Todas exibidas em cards `.local-story.lead-story` com botão **`Ler matéria completa`** abrindo `#news-reader-modal` quase em tela cheia.
- **Sobre Nós (`#tab-sobre`):** Equipe do **IEEP** (Breno Oliveira, Jefferson Luan, Pedro Arthur, Lucas Mariano) + banner *"Por que reciclar em Belém?"* + `#incentives-container` (movidos da aba Guia).

---

## 5. Banco de Dados (`database.json`, `db.js`) & Supabase
- **Total atual de pontos:** **34 pontos** (`pt-1` a `pt-34`), incluindo:
  - `pt-30`: Ponto Ecoponto Parque São Joaquim (`moveis`, `-1.40855, -48.47686`)
  - `pt-31`: Ponto Movimento República de Emaús (`moveis`, `eletronicos`, `-1.37137, -48.45922`, tel `(91) 98170-8721`)
  - `pt-32`: Ponto Instituto Descarte Correto (`eletronicos`, `pilhas`, `-1.43481, -48.45942`)
  - `pt-33`: Ponto Boulevard Shopping Belém (E-lixo) (`eletronicos`, `pilhas`, `-1.44633, -48.48972`)
  - `pt-34`: Ponto Shopping Bosque Grão-Pará (E-lixo) (`eletronicos`, `pilhas`, `-1.39012, -48.46515`)
- **Regra de Sincronização:** Sempre que alterar `Source/data/database.json`, atualize também `DEFAULT_DB` em `Source/js/db.js`. `ReciclaDB.init()` faz merge automático de novos pontos/materiais em `localStorage` existentes.
- **Integração Supabase (`Source/supabase/schema.sql` + `Source/js/db.js`):**
  - `schema.sql` já foi executado pelo usuário no Supabase.
  - A `anonKey` (`sb_publishable_1-SLBFPmZ3sFsL3T_uc3lA_utd-Vd6M`) já está preenchida em `SUPABASE_CONFIG` no topo de `Source/js/db.js`.
  - **O que falta para ativar o Supabase:** preencher a **Project URL exata** (`url: 'https://....supabase.co'`) em `SUPABASE_CONFIG` e mudar `enabled: true`, além de rodar o `INSERT` de cadastro do operador no SQL Editor do Supabase (ver `Source/supabase/COMO_CONFIGURAR.md`).

---

## 6. Próximos Passos Pendentes (Checklist para o Próximo Agente)
1. **Ativar Supabase:** pegar a Project URL exata com o usuário, preencher `SUPABASE_CONFIG.url` e `enabled: true` em `Source/js/db.js` e testar login com chave de operador + gravação em `audit_logs`.
2. **Revisar coordenadas e horários dos pontos `pt-1` a `pt-29`:** o usuário informou que alguns pontos antigos precisam ter localização exata no mapa e horários conferidos/corrigidos.
3. **Gerar os 2 APKs (ou configurar GitHub Actions / Capacitor):**
   - **APK Usuário:** travado em `role=user` (sem Dashboard).
   - **APK Operador:** abre com o gate de Chave de Acesso do Supabase (`#operator-auth-gate`).
4. **Atualizar `CACHE_NAME` em `Source/sw.js`** sempre que modificar arquivos estáticos em `Source/`.
