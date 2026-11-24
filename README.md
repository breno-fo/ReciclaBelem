# ReciclaBelém — Ecopontos, Guia de Reciclagem & Gestão Ambiental

> **Versão:** `v1.1.0` | **Status:** MVP Funcional Completo (PWA Mobile-First + Mapa Offline + Trajeto 2D + Disque-Entulho + Supabase Ready)

O **ReciclaBelém** é um aplicativo desenvolvido por estudantes do curso técnico em **Desenvolvimento de Sistemas** do **IEEP — Instituto Educacional do Estado do Pará** (Belém-PA), criado para conectar cidadãos aos ecopontos e cooperativas de reciclagem em **Belém, Icoaraci e Outeiro** de forma rápida, gratuita e acessível.

---

## 👥 Equipe do Projeto (IEEP • Belém - PA)
- **Breno Oliveira**
- **Jefferson Luan**
- **Pedro Arthur**
- **Lucas Mariano**

---

## ✨ Principais Funcionalidades

### 📱 Aplicativo do Cidadão
- **Simulador Android + Modo App Nativo (PWA):** Ao abrir no PC, exibe uma tela inicial realista de celular Android (com wallpaper, relógio/clima de Belém, ícones oficiais e barra de gestos). Ao tocar no ícone do **ReciclaBelém**, exibe a Splash Screen de 5 segundos com o mascote **Mucura** e abre o aplicativo. Quando instalado como PWA (Android/iOS) ou APK, abre direto no mapa em tela cheia.
- **Mapa Interativo + Modo Offline Real:**
  - Base **Leaflet + OpenStreetMap (`tile.openstreetmap.de`)** com **34 pontos cadastrados** (ecopontos municipais, mini estações, contêineres, Movimento República de Emaús e pontos verificados de **lixo eletrônico/pilhas** e **móveis**).
  - Pacote offline próprio (`Source/data/belem-map-pack.bin`, **7,2 MB**, 501 blocos cobrindo Belém, Icoaraci e Outeiro nos zooms 12 a 15) salvo no `CacheStorage` do aparelho, com detecção automática de Wi-Fi vs. Dados Móveis e verificação real se o mapa já está baixado.
- **GPS Inteligente + Política de Privacidade (LGPD):**
  - Botão de status no cabeçalho com 3 estados: **Ativar GPS** (cinza), **GPS ativo** (verde) e **GPS não ativo** (vermelho, interrompendo `clearWatch` de fato).
  - Opção de **Escolher no mapa** usando pin central fixo com prévia de endereço em tempo real.
  - Link direto para a **Política de Privacidade e Uso de Localização** (`Source/POLITICA_DE_PRIVACIDADE.md`) com respaldo na **LGPD (Lei nº 13.709/2018)** e **Marco Civil da Internet**.
- **Trajeto 2D, Navegação & Avaliação:**
  - **Ver Trajeto no Mapa (2D):** traça o caminho real rua por rua dentro do app via **OSRM**.
  - **Iniciar Modo Navegação no Google Maps:** abre a rota por voz no app do Google Maps sem exigir chave de API paga.
  - **Avaliar no Google Maps:** redireciona para as coordenadas exatas (`lat,lng`) do ponto no Google Maps.
- **Disque-Entulho Belém (WhatsApp):** Botão dedicado no mapa explicando o serviço gratuito da SESAN (até 1 m³) com envio direto de mensagem pré-formatada para o WhatsApp oficial **(91) 98405-3100**.
- **Guia ("Onde Jogar"), Notícias & Sobre Nós:**
  - Guia prático por material (Plástico, Papel, Vidro, Metal, Eletrônicos, Óleo, Pilhas, Orgânicos e Móveis).
  - Feed de notícias reais da região com **leitor completo dentro do aplicativo** e link para a fonte original.
  - Aba **Sobre Nós** com a missão da equipe do IEEP e cards de impacto positivo.

### ⚙️ Painel do Operador (Admin) & Modo Dev
- **Alternância de Visões:** *Somente Usuário*, *Somente Admin*, *Lado a Lado* (sincronizado via `BroadcastChannel`) e *Modo Dev* (simulação de GPS no Centro de Belém).
- **CRUD Completo:** Gerenciamento de pontos (com seletor visual de pin no mapa e calendário semanal), notícias, guia de materiais, incentivos e exportação/importação `.json`.
- **Estrutura pronta para Supabase (`Source/supabase/`):** Autenticação por **Chave de Acesso do Operador** com expiração automática de sessão (8h), **RLS** e **Auditoria (`audit_logs`)**.

---

## 🚀 Como Executar Localmente

### Opção 1: Windows (Mais Fácil)
Dê um duplo clique em **`Source/INICIAR_APP.bat`**.
Ele inicia automaticamente o servidor local na porta `3000` (usando **Node.js** ou **Python `http.server`** como fallback) e abre `http://localhost:3000`.

### Opção 2: Terminal
```bash
cd Source
# Com Node.js:
node server.js
# Ou com Python:
python -m http.server 3000
```

---

## 📱 Como gerar o APK (Android) e usar no iPhone (iOS)
- **Android (`.apk`):**
  1. **Via PWABuilder (Sem instalar Android Studio):** Publique a pasta `Source/` no GitHub Pages / Vercel / Netlify e gere o `.apk` em [pwabuilder.com](https://www.pwabuilder.com/).
  2. **Via Capacitor (Local):** Em um computador com **Node.js + JDK + Android SDK**:
     ```bash
     cd Source
     npm install @capacitor/core @capacitor/cli @capacitor/android
     npx cap init ReciclaBelem com.reciclabelem.app --web-dir .
     npx cap add android
     npx cap open android
     ```
- **iPhone (iOS):** Abra o link HTTPS no **Safari → Compartilhar → Adicionar à Tela de Início** para instalar como PWA em tela cheia.

---

## 📂 Estrutura de Pastas
```text
ReciclaBelem/
├── README.md                        # Documentação geral do projeto (GitHub)
├── AGENT_HANDOFF.md                 # Documentação técnica detalhada para agentes de IA
├── Mobile Base/Wallpaper/           # Wallpaper original da tela inicial
├── Refs Visuals/                    # Propostas visuais, logos e mascote Mucura
└── Source/                          # Código-fonte do aplicativo (raiz web / PWA)
    ├── index.html
    ├── manifest.json
    ├── sw.js                        # Service Worker (offline shell + cache de tiles)
    ├── server.js                    # Servidor Node.js + API /api/db + coletor de notícias
    ├── INICIAR_APP.bat              # Atalho Windows (Node.js ou Python)
    ├── POLITICA_DE_PRIVACIDADE.md   # Termos de localização (LGPD)
    ├── assets/                      # Ícones multi-resolução, materiais, wallpaper, wordmark
    ├── css/                         # styles.css, mobile.css, content-refresh.css, map-refresh.css
    ├── js/                          # db.js, icons.js, app.js
    ├── data/                        # database.json + belem-map-pack.bin (7,2 MB)
    ├── scripts/                     # build-offline-map.py, fetch-news.js, generate-app-icons.py
    └── supabase/                    # schema.sql + COMO_CONFIGURAR.md
```

---

> 📄 **Para desenvolvedores e agentes de IA:** consulte [AGENT_HANDOFF.md](AGENT_HANDOFF.md) para detalhes técnicos completos da arquitetura, schema de dados e próximos passos.
