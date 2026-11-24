# Política de Privacidade e Uso de Localização — ReciclaBelém

**Última atualização:** 24 de novembro de 2026  
**Responsáveis:** Equipe ReciclaBelém (Breno Oliveira, Jefferson Luan, Pedro Arthur e Lucas Mariano — Curso Técnico em Desenvolvimento de Sistemas, IEEP / Instituto Educacional do Estado do Pará, Belém-PA).

---

## 1. Compromisso com a sua Privacidade
O **ReciclaBelém** é um aplicativo informativo e comunitário de utilidade pública voltado à localização de ecopontos, cooperativas e educação ambiental em Belém, Icoaraci e Outeiro. Respeitamos integralmente a sua privacidade e tratamos qualquer dado de localização em conformidade com a **Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018)** e o **Marco Civil da Internet (Lei nº 12.965/2014)**.

---

## 2. Quais dados de localização utilizamos e para quê
Quando você autoriza o uso da localização no aplicativo, as coordenadas geográficas aproximadas ou exatas (**latitude e longitude**) são utilizadas **exclusivamente** para:

1. **Calcular a distância** entre você e os pontos de reciclagem cadastrados;
2. **Ordenar a lista de ecopontos** do mais próximo ao mais distante;
3. **Exibir sua posição no mapa** e traçar o trajeto em 2D até o ponto escolhido;
4. **Preencher o ponto de partida** caso você clique para abrir a navegação externa no Google Maps.

> **Não coletamos** nome, CPF, e-mail, telefone, histórico de deslocamento ou identificadores publicitários do usuário final.

---

## 3. Armazenamento, Verificação Local e Não Compartilhamento
- **Processamento local em memória:** sua posição GPS é mantida **apenas na memória temporária da sessão atual** do aplicativo no seu próprio dispositivo.
- **Verificação de mapa offline no aparelho:** o aplicativo pode consultar exclusivamente os dados locais do próprio app no dispositivo (`CacheStorage` e `localStorage`) para verificar se o pacote do mapa offline de Belém, Icoaraci e Outeiro já foi baixado e garantir o funcionamento sem internet. **Não** acessamos fotos, contatos, documentos ou quaisquer outros arquivos pessoais do celular.
- **Zero envio para servidor próprio:** o ReciclaBelém **não envia, não grava e não mantém** sua localização em bancos de dados remotos nem em servidores de terceiros para fins comerciais, publicitários ou de rastreamento.
- **Serviços externos sob demanda:**
  - Ao tocar em **"Ver Trajeto no Mapa (2D)"**, as coordenadas de origem e destino são enviadas diretamente pelo seu dispositivo à API pública do **OSRM** (`router.project-osrm.org`) apenas para calcular o caminho pelas ruas.
  - Ao tocar em **"Iniciar Modo Navegação no Google Maps"** ou **"Avaliar no Google Maps"**, você é redirecionado ao serviço do **Google Maps**, que passa a operar sob os Termos e Política de Privacidade próprios da Google.
  - Ao carregar o mapa e buscar endereços, o aplicativo consulta os servidores do **OpenStreetMap / Nominatim**.

---

## 4. Base Legal (LGPD — Lei nº 13.709/2018)
O tratamento eventual da sua localização ocorre exclusivamente mediante o seu **consentimento livre, informado e inequívoco** (**Art. 7º, inciso I, da LGPD**), observando os princípios da **finalidade, adequação, necessidade e transparência** (**Art. 6º da LGPD**).

---

## 5. Seu Controle e Direitos (Art. 18 da LGPD)
Você tem controle total sobre o uso da sua localização a qualquer momento:

- **Recusar o GPS:** você pode escolher **"Continuar sem localização"** e utilizar normalmente o mapa, a busca por bairros, o guia de materiais e as notícias.
- **Posição manual sem GPS:** você pode optar por **"Escolher no mapa"** para indicar manualmente um ponto de referência sem ativar o sensor GPS do aparelho.
- **Revogar / Interromper a qualquer instante:** ao tocar no botão de status do GPS no topo do aplicativo e selecionar **"Continuar sem localização"**, o aplicativo **interrompe imediatamente a captura do GPS** (`clearWatch`), remove seu marcador do mapa e apaga as coordenadas da memória da sessão.
- Você também pode revogar a permissão a qualquer momento nas configurações do seu navegador ou do sistema operacional Android/iOS.

---

## 6. Contato
Dúvidas, sugestões ou solicitações relacionadas à privacidade no projeto **ReciclaBelém** podem ser encaminhadas à equipe desenvolvedora pelo repositório oficial do projeto:  
**https://github.com/breno-fo/ReciclaBelem**
