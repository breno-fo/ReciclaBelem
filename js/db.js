/**
 * ReciclaBelém - Camada de Persistência e Banco de Dados Híbrido
 * Funciona automaticamente em 2 modos:
 * 1. Servidor Local Node.js (API REST /api/db -> grava direto em data/database.json no disco)
 * 2. Modo Standalone / Mobile / Offline (localStorage sincronizado + Exportação/Importação JSON)
 */

const STORAGE_KEY = 'reciclaBelem_db_v1';

const DEFAULT_DB = {
  "meta": {
    "appName": "ReciclaBelém",
    "version": "1.0.0",
    "lastUpdated": "2026-11-23T20:33:05.385Z",
    "city": "Belém - PA",
    "defaultCenter": {
      "lat": -1.4558,
      "lng": -48.4898,
      "zoom": 13
    }
  },
  "points": [
    {
      "id": "pt-1",
      "name": "Ponto Mini Estação Feira Bandeira Branca",
      "neighborhood": "Marco",
      "address": "Av. Almirante Barroso com Av. Dr. Freitas",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.4348,
      "lng": -48.4631,
      "materials": [
        "metal",
        "plastico",
        "papel"
      ],
      "status": "ativo",
      "description": "Mini Estação de Coleta Seletiva - 3 Cores (Amarelo, Vermelho e Azul). Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-2",
      "name": "Ponto Mini Estação Praça da República",
      "neighborhood": "Campina",
      "address": "Praça da República",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.45176,
      "lng": -48.49475,
      "materials": [
        "metal",
        "plastico",
        "papel"
      ],
      "status": "ativo",
      "description": "Mini Estação de Coleta Seletiva - 3 Cores (Amarelo, Vermelho e Azul). Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-3",
      "name": "Ponto Mini Estação Praça Batista Campos",
      "neighborhood": "Batista Campos",
      "address": "Praça Batista Campos",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.46008,
      "lng": -48.48987,
      "materials": [
        "metal",
        "plastico",
        "papel"
      ],
      "status": "ativo",
      "description": "Mini Estação de Coleta Seletiva - 3 Cores (Amarelo, Vermelho e Azul). Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-4",
      "name": "Ponto Contêiner Igreja Quadrangular",
      "neighborhood": "Pedreira",
      "address": "Tv. Timbó - Próximo à Igreja Quadrangular",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.43137,
      "lng": -48.47244,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-5",
      "name": "Ponto Contêiner Praça Brasil",
      "neighborhood": "Umarizal",
      "address": "Praça Brasil",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.43807,
      "lng": -48.48648,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-6",
      "name": "Ponto Contêiner Praça Dom Pedro",
      "neighborhood": "Cidade Velha",
      "address": "Praça Dom Pedro II",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.45554,
      "lng": -48.50384,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-7",
      "name": "Ponto Contêiner Praça Felipe Patroni",
      "neighborhood": "Cidade Velha",
      "address": "Praça Felipe Patroni",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.45641,
      "lng": -48.50194,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-8",
      "name": "Ponto Contêiner Arthur Bernardes",
      "neighborhood": "Telégrafo",
      "address": "Rod. Arthur Bernardes - Próximo à Igreja N. Sra. do Perpétuo Socorro",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.4258,
      "lng": -48.4892,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-9",
      "name": "Ponto Contêiner Praça Jaú",
      "neighborhood": "Sacramenta",
      "address": "Praça Jaú",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.41879,
      "lng": -48.48025,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-10",
      "name": "Ponto Contêiner Praça da Bandeira",
      "neighborhood": "Campina",
      "address": "Praça da Bandeira",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.45469,
      "lng": -48.4995,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-11",
      "name": "Ponto Contêiner Praça Amazonas",
      "neighborhood": "Jurunas",
      "address": "Praça Amazonas",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.46366,
      "lng": -48.49634,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-12",
      "name": "Ponto Contêiner Praça Floriano Peixoto",
      "neighborhood": "São Brás",
      "address": "Praça Floriano Peixoto - Em frente ao Mercado de São Brás",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.45142,
      "lng": -48.46836,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-13",
      "name": "Ponto Contêiner Ver-o-Rio",
      "neighborhood": "Umarizal",
      "address": "Complexo Ver-o-Rio, Av. Pedro Álvares Cabral",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.43558,
      "lng": -48.49331,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-14",
      "name": "Ponto Contêiner Praça Estivadores",
      "neighborhood": "Campina",
      "address": "Memorial dos 400 Anos (Próximo ao Sesc Boulevard)",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.448,
      "lng": -48.4975,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-15",
      "name": "Ponto Contêiner Ver-o-Peso",
      "neighborhood": "Comércio",
      "address": "Boulevard Castilhos França - Ver-o-Peso",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.45136,
      "lng": -48.50281,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-16",
      "name": "Ponto Contêiner Horto Municipal",
      "neighborhood": "Batista Campos",
      "address": "Horto Municipal - R. dos Mundurucus",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.45795,
      "lng": -48.48709,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-17",
      "name": "Ponto Contêiner Doca de Souza Franco",
      "neighborhood": "Doca / Reduto",
      "address": "Av. Visconde de Souza Franco - Em frente ao Shopping Boulevard",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.44633,
      "lng": -48.48972,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-18",
      "name": "Ponto Contêiner Praça Marex",
      "neighborhood": "Val-de-Cans",
      "address": "Praça Marex - Val-de-Cans",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.3945,
      "lng": -48.4772,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-19",
      "name": "Ponto Contêiner Alcindo Cacela (UNAMA)",
      "neighborhood": "Umarizal",
      "address": "Av. Alcindo Cacela - Em frente à UNAMA",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.43885,
      "lng": -48.47872,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-20",
      "name": "Ponto Contêiner Conjunto Tapajós",
      "neighborhood": "Tapajós / Bengui",
      "address": "Rua Alicante, ao lado do Antigo Posto Policial",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.3562,
      "lng": -48.459,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-21",
      "name": "Ponto Iglu Residencial Viver Primavera",
      "neighborhood": "Tapanã",
      "address": "Rodovia do Tapanã - Residencial Viver Primavera",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.3442,
      "lng": -48.4685,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Iglu Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-22",
      "name": "Ponto Iglu Icoaraci",
      "neighborhood": "Icoaraci",
      "address": "Rua Manoel Barata - Icoaraci",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.3008,
      "lng": -48.4875,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Iglu Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-23",
      "name": "Ponto Iglu Praça D. Alberto Ramos",
      "neighborhood": "Marambaia",
      "address": "Praça Dom Alberto Ramos - Marambaia",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.4045,
      "lng": -48.4452,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Iglu Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-24",
      "name": "Ponto Iglu Orla Praia Grande",
      "neighborhood": "Outeiro",
      "address": "Orla da Praia Grande - Outeiro",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.2588,
      "lng": -48.4585,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Iglu Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-25",
      "name": "Ponto Iglu Escola Bosque",
      "neighborhood": "Outeiro",
      "address": "Escola Bosque - Outeiro",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.2545,
      "lng": -48.4535,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Iglu Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-26",
      "name": "Ponto Iglu Bosque Rodrigues Alves",
      "neighborhood": "Marco",
      "address": "Av. Almirante Barroso - Bosque Rodrigues Alves",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.4315,
      "lng": -48.4582,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Iglu Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-27",
      "name": "Ponto Iglu Praça Benedito Monteiro",
      "neighborhood": "Guamá",
      "address": "Praça Benedito Monteiro - Guamá",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.4682,
      "lng": -48.4635,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Iglu Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-28",
      "name": "Ponto Iglu Antônio Baena (Feira da 25)",
      "neighborhood": "Marco",
      "address": "Av. Antônio Baena - Final da Feira da 25",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.4418,
      "lng": -48.4655,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Iglu Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    },
    {
      "id": "pt-29",
      "name": "Ponto Iglu SESAN (Almirante Barroso)",
      "neighborhood": "Souza",
      "address": "Av. Almirante Barroso - Sede da SESAN",
      "hours": "Todos os dias • 24 horas",
      "phone": "",
      "lat": -1.4165,
      "lng": -48.4422,
      "materials": [
        "plastico",
        "papel",
        "metal",
        "vidro"
      ],
      "status": "ativo",
      "description": "Contêiner Verde - Iglu Material Reciclável Misturado. Ponto público de entrega voluntária em Belém."
    }
  ],
  "materialsGuide": [
    {
      "id": "mat-1",
      "slug": "plastico",
      "name": "Plástico",
      "binColorName": "Lixeira Vermelha",
      "colorHex": "#EF4444",
      "bgSoft": "#FEF2F2",
      "icon": "bottle",
      "whereToThrow": "Coletor Vermelho ou Ecopontos de Recicláveis Secos",
      "canRecycle": "Garrafas PET, potes de shampoo e detergente, tampinhas, sacolas limpas, baldes, copos descartáveis enxaguados.",
      "cannotRecycle": "Embalagens engorduradas, cabos de panela, tomadas, acrílico, fraldas descartáveis e adesivos.",
      "prepTip": "Esvazie completamente o líquido e passe uma água rápida para remover restos de açúcar ou gordura. Amasse as garrafas PET para ocupar menos espaço!"
    },
    {
      "id": "mat-2",
      "slug": "papel",
      "name": "Papel e Papelão",
      "binColorName": "Lixeira Azul",
      "colorHex": "#2563EB",
      "bgSoft": "#EFF6FF",
      "icon": "box",
      "whereToThrow": "Coletor Azul ou Cooperativas de Catadores",
      "canRecycle": "Caixas de papelão, jornais, revistas, folhas de caderno, envelopes, caixas longa-vida (Tetra Pak) limpas.",
      "cannotRecycle": "Papel higiênico, guardanapos sujos de gordura, papel carbono, fotografias, fitas crepe e etiquetas adesivas.",
      "prepTip": "Mantenha o papel seco e desmonte as caixas de papelão. Papéis molhados ou sujos de óleo perdem o valor de reciclagem."
    },
    {
      "id": "mat-3",
      "slug": "vidro",
      "name": "Vidro",
      "binColorName": "Lixeira Verde",
      "colorHex": "#10B981",
      "bgSoft": "#ECFDF5",
      "icon": "glass",
      "whereToThrow": "Coletor Verde ou PEVs com baia exclusiva para vidro",
      "canRecycle": "Garrafas de bebidas, potes de geleia e conserva, frascos de perfume e copos de vidro comum.",
      "cannotRecycle": "Espelhos, vidros de janela temperados (Blindex), lâmpadas, cerâmica, porcelana e pirex.",
      "prepTip": "Se o vidro estiver quebrado, embale-o em jornal grosso ou dentro de uma caixa de leite/garrafa PET cortada e escreva 'CUIDADO: VIDRO QUEBRADO' para proteger os catadores."
    },
    {
      "id": "mat-4",
      "slug": "metal",
      "name": "Metal",
      "binColorName": "Lixeira Amarela",
      "colorHex": "#D97706",
      "bgSoft": "#FFFBEB",
      "icon": "can",
      "whereToThrow": "Coletor Amarelo ou Cooperativas",
      "canRecycle": "Latas de alumínio (refrigerante, suco), latas de conserva (milho, sardinha), tampinhas metálicas, panelas sem cabo.",
      "cannotRecycle": "Latas de tinta ou solventes químicos, esponjas de aço (Bombril) sujas, clipes enferrujados e aerossóis com gás.",
      "prepTip": "Retire restos de alimentos das latas de conserva e dobre a tampa para dentro para evitar cortes durante a triagem."
    },
    {
      "id": "mat-5",
      "slug": "eletronicos",
      "name": "Eletrônicos (E-Lixo)",
      "binColorName": "Coletor Roxo / Logística Reversa",
      "colorHex": "#7C3AED",
      "bgSoft": "#F5F3FF",
      "icon": "cpu",
      "whereToThrow": "Pontos de Logística Reversa (UFPA, Doca, Bosque)",
      "canRecycle": "Celulares antigos, carregadores, fones de ouvido, teclados, mouses, placas de computador, cabos e pequenos eletros.",
      "cannotRecycle": "Nunca descarte no lixo comum domiciliar! Contêm metais pesados que contaminam o lençol freático.",
      "prepTip": "Apague seus dados pessoais de celulares ou computadores antigos antes de entregar no ponto de coleta."
    },
    {
      "id": "mat-6",
      "slug": "oleo",
      "name": "Óleo de Cozinha",
      "binColorName": "Coletor Laranja / Bombona de Óleo",
      "colorHex": "#EA580C",
      "bgSoft": "#FFF7ED",
      "icon": "droplet",
      "whereToThrow": "Ecopontos com bombona de óleo vegetal",
      "canRecycle": "Óleo de soja, girassol, milho ou azeite usado em frituras domésticas.",
      "cannotRecycle": "Óleo de motor automotivo, graxa mecânica ou óleo misturado com água sanitária.",
      "prepTip": "Espere o óleo esfriar após a fritura, coe com um pano ou peneira e armazene dentro de uma garrafa PET bem fechada. Nunca jogue na pia!"
    },
    {
      "id": "mat-7",
      "slug": "pilhas",
      "name": "Pilhas e Baterias",
      "binColorName": "Coletor Laranja Perigosos",
      "colorHex": "#C2410C",
      "bgSoft": "#FFEDD5",
      "icon": "battery",
      "whereToThrow": "Urnas coletoras de pilhas e baterias",
      "canRecycle": "Pilhas AA/AAA, baterias de celular, baterias de notebook e pilhas-botão de relógio.",
      "cannotRecycle": "Baterias automotivas de chumbo-ácido (devem ser devolvidas em oficinas mecânicas).",
      "prepTip": "Se uma pilha estiver vazando líquido, envolva-a em plástico resistente antes de depositar na urna coletora."
    },
    {
      "id": "mat-8",
      "slug": "organicos",
      "name": "Orgânicos",
      "binColorName": "Lixeira Marrom / Compostagem",
      "colorHex": "#78350F",
      "bgSoft": "#FEF3C7",
      "icon": "leaf",
      "whereToThrow": "Pátios de Compostagem ou Composteira Doméstica",
      "canRecycle": "Cascas de frutas e verduras, borra de café com filtro, cascas de ovo trituradas, folhas secas e podas.",
      "cannotRecycle": "Carnes, ossos, laticínios, fezes de animais domésticos e restos de comida muito gordurosos.",
      "prepTip": "Misture resíduos úmidos (cascas de frutas) com serragem ou folhas secas para produzir adubo rico sem mau cheiro!"
    }
  ],
  "incentives": [
    {
      "id": "inc-1",
      "title": "Proteja os Rios e Igarapés da Amazônia",
      "metric": "1 Litro = 25.000 L de água protegida",
      "description": "Em uma cidade cercada pela Baía do Guajará e pelo Rio Guamá, descartar óleo de cozinha e plástico corretamente impede o entupimento de canais e preserva a fauna aquática.",
      "tag": "Impacto Local"
    },
    {
      "id": "inc-2",
      "title": "Geração de Renda para Famílias Cooperadas",
      "metric": "+450 famílias beneficiadas em Belém",
      "description": "Quando você separa o lixo seco em casa e leva até um Ecoponto ou Cooperativa, você aumenta em até 3x o aproveitamento do material e fortalece os catadores locais.",
      "tag": "Economia Circular"
    },
    {
      "id": "inc-3",
      "title": "Economia de Energia com Alumínio e Vidro",
      "metric": "95% menos energia elétrica",
      "description": "O Brasil é líder mundial em reciclagem de latas de alumínio. Reciclar uma única lata economiza energia suficiente para manter uma TV ligada por 3 horas!",
      "tag": "Eficiência Energética"
    }
  ],
  "news": [
    {
      "id": "news-1",
      "title": "Belém amplia rede de Ecopontos para reciclagem de eletrônicos e óleo",
      "category": "Infraestrutura",
      "date": "23 Nov 2026",
      "author": "Equipe ReciclaBelém",
      "featured": true,
      "summary": "Novos coletores nos bairros de Nazaré, Umarizal e Marco agora recebem pequenos aparelhos eletrônicos, cabos e óleo de cozinha armazenado em garrafas PET."
    },
    {
      "id": "news-2",
      "title": "Mutirão Limpa Igarapé acontece neste sábado na Cidade Velha e Ver-o-Peso",
      "category": "Evento Comunitário",
      "date": "21 Nov 2026",
      "author": "Rede Voluntária Amazônia Limpa",
      "featured": false,
      "summary": "Voluntários e cooperativas se reúnem a partir das 8h para coleta de plásticos nas margens da Baía do Guajará e oficina gratuita de compostagem doméstica."
    },
    {
      "id": "news-3",
      "title": "Saiba como preparar suas embalagens em menos de 30 segundos",
      "category": "Educação Ambiental",
      "date": "18 Nov 2026",
      "author": "Guia ReciclaBelém",
      "featured": false,
      "summary": "Não é preciso lavar com sabão! Basta esvaziar todo o resto de líquido ou alimento e passar a água do enxágue da louça para evitar mau cheiro e insetos."
    }
  ]
};

window.ReciclaDB = {
  data: null,
  serverAvailable: false,

  async init() {
    // 1. Tenta carregar do servidor Node.js (/api/db) se estiver rodando
    try {
      const res = await fetch('/api/db', { cache: 'no-store' });
      if (res.ok) {
        const serverData = await res.json();
        if (serverData && Array.isArray(serverData.points)) {
          this.data = serverData;
          this.serverAvailable = true;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
          return this.data;
        }
      }
    } catch (err) {
      // Caso esteja aberto direto como arquivo local ou servidor estático
      this.serverAvailable = false;
    }

    // 2. Fallback para localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.points)) {
          this.data = parsed;
          return this.data;
        }
      } catch (e) {
        console.warn('Erro ao ler localStorage, restaurando banco padrão.');
      }
    }

    // 3. Usa banco inicial padrão
    this.data = JSON.parse(JSON.stringify(DEFAULT_DB));
    await this.save();
    return this.data;
  },

  async save() {
    if (!this.data) return;
    this.data.meta = this.data.meta || {};
    this.data.meta.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));

    if (this.serverAvailable) {
      try {
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.data)
        });
      } catch (e) {
        console.warn('Não foi possível sincronizar com servidor local, salvo no localStorage.');
      }
    }

    // Notifica outras instâncias (ex: modo Lado a Lado) em tempo real
    try {
      const bc = new BroadcastChannel('reciclabelem_sync');
      bc.postMessage({ type: 'DB_UPDATED', data: this.data });
      bc.close();
    } catch (e) {}
  },

  async resetToDefault() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_DB));
    await this.save();
    return this.data;
  },

  exportJSON() {
    const blob = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reciclabelem-database-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
