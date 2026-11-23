# 🌱 ReciclaBelém — Aplicativo de Ecopontos, Guia de Reciclagem & Dashboard

> **Status do Projeto:** `v1.0.0` (MVP Funcional Completo — Mapa Interativo + Navegação Google Maps + Guia de Materiais + Notícias + Dashboard Admin com Banco de Dados Persistente)

O **ReciclaBelém** é uma aplicação mobile-first (projetada para **Android** via PWA / Capacitor e com **Simulador Mobile Interativo** para Desktop) focada em conectar cidadãos aos pontos de reciclagem e cooperativas de Belém do Pará, incentivar o descarte correto e permitir o gerenciamento completo da plataforma por meio de um **Dashboard do Operador**.

---

## 💡 Decisões de Arquitetura (Respostas às Dúvidas Técnicas do Projeto)

### 1. API do Google Maps vs. Arquitetura Híbrida (Leaflet + Google Maps Navigation Intent)
- **O problema de usar apenas a Google Maps JavaScript/Android SDK:** A API oficial do Google Maps exige cadastro de **cartão de crédito (Google Cloud Billing)** e chave de API (`API_KEY`) restrita. Em projetos escolares ou acadêmicos compartilhados no Google Drive, expor a chave no código pode gerar bloqueios ou cobranças.
- **Nossa Solução Híbrida (O melhor dos dois mundos e 100% Gratuita):**
  1. **Visualização do Mapa no App:** Usamos **Leaflet.js + OpenStreetMap Oficial (`tile.openstreetmap.org`)**. É leve, moderno, não exige chave de API nem cartão de crédito e permite criar pinos customizados verdes e traçar linhas de pré-visualização de rota.
  2. **Modo de Navegação Curva-a-Curva (Google Maps Oficial):** Quando o usuário clica em **"🧭 Navegar (Google Maps)"**, o app dispara uma **Universal Intent / Deep Link oficial do Google Maps**:
     ```text
     https://www.google.com/maps/dir/?api=1&origin=LAT_USUARIO,LNG_USUARIO&destination=LAT_PONTO,LNG_PONTO&travelmode=driving
     ```
     No Android, esse link abre **diretamente o aplicativo nativo do Google Maps** já com a rota traçada pronta para iniciar a navegação por voz, **sem custo de API**!

### 2. FlutterFlow vs. Android Studio vs. Web Mobile-First (PWA + Capacitor)
- **Por que NÃO Android Studio no PC da escola?** O Android Studio + Android SDK + Emulador consome facilmente **15 GB a 25 GB de disco** e **8 GB+ de RAM**, travando computadores escolares ou máquinas sem virtualização habilitada.
- **Por que NÃO FlutterFlow ao trabalhar com um Agente de IA (Antigravity)?** O FlutterFlow é uma ferramenta visual fechada na nuvem (drag-and-drop no navegador). Um agente de IA no seu computador não consegue clicar nos menus internos do FlutterFlow diretamente, e a exportação de código do FlutterFlow é unidirecional (se o agente editar o código exportado, você não consegue reimportar de volta para o editor visual do FlutterFlow, além de precisar do SDK do Flutter instalado localmente para rodar).
- **Por que escolhemos Arquitetura Web Mobile-First (HTML5/CSS3/JS + Node.js + PWA/Capacitor)?**
  1. **Zero peso no PC da escola:** Roda em menos de 1 segundo com `node server.js` (ou abrindo `index.html`), consumindo menos de 30 MB de memória.
  2. **100% editável por mim e por qualquer outro Agente de IA em casa:** Todo o código-fonte é aberto, limpo, modular e padronizado.
  3. **Testes e Debug Ágeis:** Inclui uma barra no topo com **Simulador de Tela Android (430px)** e **Modo Tela Cheia**, além de um **Simulador de GPS em Belém** para você testar o cálculo de distância mesmo em um PC de mesa sem chip GPS.
  4. **Pronto para Android:** Já possui `manifest.json` (pode ser instalado na tela inicial do Android pelo Chrome como um App nativo em tela cheia) e pode ser empacotado em um arquivo `.apk` usando **Capacitor** ou **PWABuilder**.

---

## ✨ Funcionalidades Implementadas

### 📱 Visão do Usuário (App Android)
1. **Permissão e Coleta de Localização (GPS):**
   - Modal amigável perguntando se o usuário permite o acesso à localização (`navigator.geolocation`).
   - Possui **3 modos de localização** para facilitar testes e apresentações:
     - **GPS Real do dispositivo** (ideal no celular Android).
     - **Localização Simulada no Centro de Belém** (Praça da República — ideal para testar no PC da escola).
     - **Escolher posição clicando no mapa** (permite simular que o usuário está em qualquer rua de Belém).
   - Calcula automaticamente a **distância em metros ou quilômetros (Fórmula de Haversine)** entre o usuário e cada ponto de reciclagem.
2. **Busca Unificada (Pontos de Reciclagem + Lugares/Endereços) e Filtros Inteligentes:**
   - **Sugestões diferenciadas em tempo real:** Ao digitar (ex: *"Praça da República"*), a barra exibe um menu com duas seções distintas:
     - **♻️ Pontos de Reciclagem (Sugestões):** Exibidos com **símbolo de reciclagem** e o prefixo obrigatório **"Ponto "** antes do nome (`formatPointName`) para nunca serem confundidos com locais comuns. Se o usuário buscar por um lugar famoso, os pontos de reciclagem mais próximos desse lugar também aparecem como sugestão.
     - **📍 Lugares & Endereços no Mapa:** Busca híbrida (catálogo local instantâneo de Belém + API gratuita **Nominatim/OpenStreetMap**). Ao clicar em um lugar, o mapa marca o local com um **Pin Azul (`📍`)** distinto dos pinos verdes de reciclagem e ordena automaticamente os pontos de reciclagem mais próximos a ele.
   - Filtro rápido **acumulativo (múltipla escolha)** por **tipo de material aceito**: *Todos, Plástico, Papel, Vidro, Metal, Eletrônicos, Óleo, Pilhas e Orgânicos* — o usuário pode selecionar vários materiais simultaneamente para encontrar pontos que aceitam todos eles.
   - Ordenação por **"Mais próximos de mim"** ou **"Ordem Alfabética (A-Z)"**.
3. **Mapa Interativo, Gaveta Retrátil, Modo Offline e Navegação:**
   - **Gaveta Retrátil de Pontos:** O mapa ocupa a tela inteira e a lista de pontos fica recolhida na parte inferior com uma seta para cima (`⌃`) — basta puxar ou clicar para expandir/recolher.
   - **Download do Mapa para Uso Offline (`sw.js`):** Na tela inicial (e pelo botão flutuante de download `⬇️` acima do GPS), o app pergunta se o usuário deseja baixar o mapa de Belém (~**18,4 MB**), **verifica se está usando Dados Móveis (`5G`/`4G+`)** pedindo confirmação antes de consumir a franquia, e salva os tiles e os 29 pontos em cache real (`CacheStorage` + Service Worker).
   - Pinos customizados mostrando a quantidade de tipos de materiais aceitos em cada ponto.
   - Botão **"🗺️ Ver no Mapa / Traçar Linha"**: desenha a rota pontilhada verde dentro do app com estimativa de distância e tempo.
   - Botão **"🧭 Navegar (Google Maps)"**: abre o modo de navegação oficial do Google Maps até o ponto escolhido.
4. **Aba "Onde Jogar" (Guia de Reciclagem & Incentivo):**
   - **Cards de Incentivo:** Dados de impacto ambiental e social em Belém (proteção da Baía do Guajará, geração de renda para cooperativas, economia de energia).
   - **Onde Jogar Cada Material:** Lista completa com as cores da coleta seletiva (CONAMA), onde entregar, **✅ O que PODE reciclar**, **❌ O que NÃO pode reciclar** e **💡 Dica prática de limpeza/preparo**.
5. **Aba "Notícias" (Atualização Automática Diária com Foto e Texto Original):**
   - Feed de notícias sobre ecologia, reciclagem e coleta seletiva em **Belém, Ananindeua, Outeiro e região**, exibindo a **foto de capa (`og:image`), resumo/texto completo da matéria original e link para o portal fonte**.
   - **Coletor Automático (`scripts/fetch-news.js` + `server.js`):** O servidor Node.js executa automaticamente a busca todos os dias **de manhã (08h) e à noite (20h)** (ou sob demanda pelo botão **`🔄 Buscar Notícias Agora`** no Dashboard Admin), preservando as notícias criadas manualmente.

### ⚙️ Separação de Visões (Usuário Final vs. Operador Admin vs. Lado a Lado)
Para facilitar apresentações e testes com clientes, a barra superior permite alternar instantaneamente entre **3 modos**:
1. **`📱 Somente Usuário`:** Exibe apenas a visão do cidadão (3 abas: *Mapa*, *Onde Jogar* e *Notícias*, ocultando o Dashboard).
2. **`⚙️ Somente Admin`:** Exibe a visão do operador, que tem acesso a tudo o que o usuário final vê **+** a aba **`Dashboard`**.
3. **`📱⚙️ Lado a Lado`:** Exibe os **dois celulares lado a lado** (Usuário Final à esquerda e Operador Admin à direita) com **sincronização em tempo real** via `BroadcastChannel` — qualquer ponto, notícia ou regra editada no Admin aparece imediatamente na tela do Usuário!

> **Imersão Android Completa:** Ao abrir a página, o simulador exibe uma **Tela Inicial do Android (Launcher)** com relógio/clima de Belém, barra de pesquisa do Google, dock e vários apps simulados (*Maps, WhatsApp, Instagram, YouTube, Play Store, Câmera, Galeria, Spotify, Drive, etc.*). Ao tocar no ícone do **ReciclaBelém**, uma **Splash Screen** é exibida e o aplicativo abre completo; a qualquer momento você pode tocar na **barra de gestos inferior** (`———`) para voltar à Tela Inicial do celular! A barra de status superior também conta com **câmera frontal (punch-hole)**, **sinal 5G/4G+ oscilando** e **bateria realista de 1 hora** persistida no `localStorage`.

### ⚙️ Dashboard Administrativo (Para o Operador do App)
Acessível no modo **`Somente Admin`** ou **`Lado a Lado`** através da aba **"Dashboard"** na barra inferior:
1. **Gerenciar Pontos de Reciclagem (`📍 Pontos`):**
   - Adicionar novo ponto com nome, bairro, **seletor visual de calendário semanal e horários** (escolha os dias da semana `Dom` a `Sáb` ou atalhos + horário de abertura/fechamento ou `24h`), endereço, telefone, materiais aceitos e descrição.
   - **Seletor Interativo de Localização (Pin Central Fixo):** Botão único **"🗺️ Selecionar no mapa"** que abre um **pin central fixo sobre o mapa**; conforme você arrasta o mapa, o pin indica o ponto exato e exibe a **prévia em tempo real do endereço**, com o botão **`✅ Confirmar Localização`**. Ao confirmar, os campos **Endereço**, **Número** e **Bairro** são preenchidos automaticamente (e podem ser editados manualmente).
   - Editar ou Remover qualquer ponto existente.
2. **Gerenciar Notícias e Informações (`📰 Notícias`):**
   - Publicar novas notícias, avisos ou mutirões, marcar como destaque, editar ou remover.
3. **Gerenciar Guia & Incentivos (`♻️ Guia & Incentivo`):**
   - Adicionar, editar ou remover regras de **"Onde jogar cada material"** (cor da lixeira, o que pode, o que não pode e dica de preparo).
   - Adicionar ou remover **Cards de Incentivo à Reciclagem**.
4. **Persistência & Backup (`💾 Banco JSON`):**
   - Sincronização dupla automática: grava direto no arquivo `data/database.json` (via servidor Node.js) e no `localStorage` do navegador.
   - Botões para **Exportar Banco (`.json`)**, **Importar Banco (`.json`)** e **Restaurar Dados Padrão**.

---

## 🎨 Identidade Visual ("Eco-Modern Belém")

A interface segue um estilo **Verde Clean e Moderno**:
- **Verde Floresta Amazônica (`#064E3B` / `#022C22`):** Cabeçalhos, barra de status e elementos de alto contraste.
- **Verde Esmeralda Vibrante (`#059669` / `#10B981`):** Botões principais de ação (CTAs), marcadores ativos do mapa e indicadores de GPS.
- **Superfície Mint Off-White (`#F3F8F5`) & Cards Brancos (`#FFFFFF`):** Proporciona leitura limpa, leveza visual e destaque para as cores das lixeiras da coleta seletiva.
- **Tipografia:** `Plus Jakarta Sans`, moderna, geométrica e altamente legível em telas Android.

---

## 📂 Estrutura de Arquivos do Projeto

```text
Pitch - ReciclaBelem/
├── index.html                  # Estrutura principal do App (4 Abas + Modais + Simulador Android)
├── manifest.json               # Manifesto PWA para instalação no Android em tela cheia
├── package.json                # Configuração Node.js (npm start)
├── server.js                   # Servidor HTTP + API REST (/api/db) sem dependências externas
├── INICIAR_APP.bat             # Atalho Windows: clique duplo para rodar o servidor e abrir o navegador
├── css/
│   └── styles.css              # Design System Eco-Modern Belém, responsivo + frame Android
├── js/
│   ├── db.js                   # Camada de banco de dados híbrida (API /api/db + localStorage + Export/Import)
│   ├── icons.js                # Ícones SVG, cores CONAMA dos materiais e pinos customizados do mapa
│   └── app.js                  # Controlador principal: Mapa Leaflet, GPS, Haversine, Filtros e Dashboard CRUD
├── data/
│   └── database.json           # Banco de dados JSON persistente (Pontos, Guia, Incentivos e Notícias)
└── README.md                   # Esta documentação completa (para humanos e agentes de IA)
```

---

## 🚀 Como Executar e Testar (Na Escola ou em Casa)

### Opção 1: Atalho Rápido no Windows (Mais Fácil)
Dê um **duplo clique** no arquivo **`INICIAR_APP.bat`**.
Ele iniciará automaticamente o servidor local na porta `3000` e abrirá `http://localhost:3000` no seu navegador.

### Opção 2: Pelo Terminal (VS Code / PowerShell / CMD)
```bash
node server.js
```
Depois, acesse **http://localhost:3000** no navegador.

### Opção 3: Sem Node.js (Direto no Navegador)
Se estiver em um computador sem Node.js instalado, basta abrir o arquivo **`index.html`** diretamente em qualquer navegador (Chrome, Edge, Firefox). O sistema usará automaticamente o `localStorage` para salvar tudo o que você fizer no Dashboard!

---

## 📱 Como Testar ou Gerar o App no Celular Android

1. **Testar na Mesma Rede Wi-Fi (Em Casa):**
   - Com `node server.js` rodando no seu PC, descubra o IP local do seu PC (ex: `ipconfig` no terminal -> `192.168.1.15`).
   - No navegador Chrome do seu celular Android, acesse `http://SEU_IP:3000` e clique em **"Adicionar à tela inicial / Instalar aplicativo"**.
2. **Gerar um APK Android Nativo com Capacitor (Opcional em Casa):**
   Caso queira gerar um arquivo `.apk` instalável usando o Capacitor:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init ReciclaBelem com.reciclabelem.app --web-dir .
   npx cap add android
   npx cap open android
   ```
   Ou hospede a pasta gratuitamente na **Vercel / Netlify / GitHub Pages** e cole a URL no site [PWABuilder.com](https://www.pwabuilder.com/) para baixar o `.apk` Android pronto sem precisar instalar o Android Studio!

---

## 🤖 Guia de Contexto para Outros Agentes de IA (LLM Hand-off Instructions)

> **Atenção, Agente de IA:** Se você está lendo este `README.md` porque o usuário trouxe o projeto da escola para casa, siga estas diretrizes arquiteturais:

1. **Arquitetura Zero-Build:** O projeto utiliza Vanilla JS modular (`js/db.js`, `js/icons.js`, `js/app.js`) + Leaflet 1.9.4 via CDN + servidor Node.js nativo (`server.js` sem depender de `node_modules`). Mantenha essa leveza a menos que o usuário peça explicitamente para migrar para um bundler ou banco em nuvem (como Supabase ou Firebase).
2. **Sincronização de Dados (`js/db.js` e `data/database.json`):**
   - Sempre que alterar o schema inicial de dados, atualize tanto `data/database.json` quanto a constante `DEFAULT_DB` em `js/db.js` (que garante funcionamento offline mesmo via protocolo `file://`).
   - A estrutura do banco possui 4 coleções principais:
     - `points`: Array de objetos `{ id, name, neighborhood, address, hours, phone, lat, lng, materials: string[], status, description }`
     - `materialsGuide`: Array de objetos `{ id, slug, name, binColorName, colorHex, bgSoft, whereToThrow, canRecycle, cannotRecycle, prepTip }`
     - `incentives`: Array de objetos `{ id, title, metric, description, tag }`
     - `news`: Array de objetos `{ id, title, category, date, author, featured, summary }`
3. **Regra de Ouro:** Sempre que adicionar ou modificar funcionalidades do aplicativo, **atualize este `README.md`** refletindo as novas features e mudanças de estrutura.
