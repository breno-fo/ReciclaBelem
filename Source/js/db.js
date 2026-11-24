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
    },
    {
      "id": "pt-30",
      "name": "Ponto Ecoponto Parque São Joaquim",
      "neighborhood": "Maracangalha",
      "address": "Rua Sol Nasce Para Todos com Travessa Alferes Costa",
      "hours": "Seg a Sex • 08:00 - 17:00 | Sáb • 08:00 - 12:00",
      "phone": "",
      "lat": -1.40855,
      "lng": -48.47686,
      "materials": [
        "moveis"
      ],
      "status": "ativo",
      "description": "Ecoponto do Parque São Joaquim. Recebe móveis inservíveis (sofás, armários, colchões e madeira) para destinação responsável."
    },
    {
      "id": "pt-31",
      "name": "Ponto Movimento República de Emaús",
      "neighborhood": "Benguí",
      "address": "Estrada do Benguí (Sede do Movimento República de Emaús)",
      "hours": "Seg a Sex • 08:00 - 17:00 (Agendamento para retirada)",
      "phone": "(91) 98170-8721",
      "lat": -1.37137,
      "lng": -48.45922,
      "materials": [
        "moveis",
        "eletronicos"
      ],
      "status": "ativo",
      "description": "Coleta solidária de móveis, eletrodomésticos, roupas, brinquedos, utensílios e outros itens. Agendamento de retirada pelo telefone (91) 98170-8721."
    },
    {
      "id": "pt-32",
      "name": "Ponto Instituto Descarte Correto",
      "neighborhood": "Marco",
      "address": "Travessa Barão do Triunfo, 4596",
      "hours": "Seg a Sex • 08:00 - 17:00",
      "phone": "",
      "lat": -1.43481,
      "lng": -48.45942,
      "materials": [
        "eletronicos",
        "pilhas"
      ],
      "status": "ativo",
      "description": "Ponto fixo do Instituto Descarte Correto. Recebe lixo eletrônico (celulares, computadores, cabos, periféricos), pilhas e baterias."
    },
    {
      "id": "pt-33",
      "name": "Ponto Boulevard Shopping Belém (E-lixo)",
      "neighborhood": "Reduto",
      "address": "Av. Visconde de Souza Franco, 776 (Piso G1)",
      "hours": "Todos os dias • 10:00 - 22:00",
      "phone": "",
      "lat": -1.44633,
      "lng": -48.48972,
      "materials": [
        "eletronicos",
        "pilhas"
      ],
      "status": "ativo",
      "description": "Ponto de coleta permanente de lixo eletrônico no Piso G1 do Boulevard Shopping Belém (celulares, carregadores, fones, pilhas e pequenos eletrônicos)."
    },
    {
      "id": "pt-34",
      "name": "Ponto Shopping Bosque Grão-Pará (E-lixo)",
      "neighborhood": "Val-de-Cães",
      "address": "Av. Centenário, 1052",
      "hours": "Todos os dias • 10:00 - 22:00",
      "phone": "",
      "lat": -1.39012,
      "lng": -48.46515,
      "materials": [
        "eletronicos",
        "pilhas"
      ],
      "status": "ativo",
      "description": "Ponto de coleta de resíduos eletrônicos de pequeno e médio porte e ações de Descarte Consciente no Shopping Bosque Grão-Pará."
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
    },
    {
      "id": "mat-9",
      "slug": "moveis",
      "name": "Móveis e Volumosos",
      "binColorName": "Ecoponto / PEV",
      "colorHex": "#92400E",
      "bgSoft": "#FEF3C7",
      "whereToThrow": "Ecopontos Municipais (como o Ecoponto Parque São Joaquim)",
      "canRecycle": "Sofás, armários, mesas, cadeiras, guarda-roupas, estantes, colchões e madeiras de móveis desmontados.",
      "cannotRecycle": "Resíduos hospitalares, lixo doméstico misturado ou produtos químicos inflamáveis.",
      "prepTip": "Se possível, desmonte peças grandes para facilitar o transporte até o Ecoponto ou doe móveis em bom estado."
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
          "id": "gnews-1795467302333-0",
          "title": "Reciclagem transforma resíduos e a vida de recicladores em Belém",
          "category": "Ecologia & Região",
          "date": "22 de nov. de 2026",
          "author": "O Liberal",
          "featured": true,
          "summary": "O processo também é sinônimo de geração de emprego e renda para quem atua com o reaproveitamento de materiais Na Cooperativa de Trabalho dos Catadores de Materiais Recicláveis das Águas Lindas (Cootaral), garrafas plásticas e tampinhas que antes iriam para o lixo, por exemplo, são transformadas em banquetas, porta-copos e outros tipos de móveis ecológicos. ( Foto: Foto: Thiago Gomes | O Liberal )",
          "imageUrl": "https://www.oliberal.com/api/og-image?src=%2Fimage%2Fpolicy%3A1.1195987%3A1795087469%2FWhatsApp%2520Image%25202026-11-18%2520at%252015.41.51%2520(3).jpeg%3Ff%3D187%3A100%26w%3D1200",
          "sourceUrl": "https://www.oliberal.com/belem/reciclagem-transforma-residuos-e-a-vida-de-recicladores-em-belem-1.1195647",
          "isAuto": true,
          "fullText": "O processo também é sinônimo de geração de emprego e renda para quem atua com o reaproveitamento de materiais\n\nNa Cooperativa de Trabalho dos Catadores de Materiais Recicláveis das Águas Lindas (Cootaral), garrafas plásticas e tampinhas que antes iriam para o lixo, por exemplo, são transformadas em banquetas, porta-copos e outros tipos de móveis ecológicos. ( Foto: Foto: Thiago Gomes | O Liberal )\n\nA separação e a destinação correta dos resíduos, por meio da coleta seletiva, além de trazer benefícios para o meio ambiente, também é sinônimo de geração de emprego e renda para catadores e cooperativas que atuam com o reaproveitamento de materiais em Belém. Celebrado neste domingo (22), o Dia do Reciclador e da Reciclagem do Lixo é uma forma de chamar a atenção sobre o destino dos resíduos sólidos.\n\nNa Cooperativa de Trabalho dos Catadores de Materiais Recicláveis das Águas Lindas (Cootaral), garrafas plásticas e tampinhas que antes iriam para o lixo, por exemplo, são transformadas em banquetas, porta-copos e outros tipos de móveis ecológicos. A representante da Cootaral, Sarah Reis, explica que mulheres da cooperativa realizam a coleta diretamente com os moradores, em um processo de porta em porta em pontos específicos de bairros de Belém.\n\nEl Niño, queimadas e estiagem ampliam risco à saúde no Pará Especialista explica como a combinação de fenômenos climáticos favorece incêndios florestais e aumenta os casos de doenças respiratórias\n\nDia Mundial da Limpeza 2026 premia fotógrafos e escolas estaduais em Belém Programação celebra a mobilização que reuniu mais de 500 mil voluntários no Pará e abre mostra fotográfica com visitação gratuita até 10 de dezembro"
      },
      {
          "id": "gnews-1795467303915-1",
          "title": "Prefeitura e Itaipu Binacional entregam novo galpão de coleta seletiva em Belém",
          "category": "Ecologia & Região",
          "date": "18 de nov. de 2026",
          "author": "portalolavodutra",
          "featured": false,
          "summary": "A obra faz parte do programa Belém pro Futuro e foi executada por Convênio entre a Prefeitura de Belém, Itaipu Binacional e Itaipu Parquetec Belém, PA - A melhoria das condições de trabalho dos catadores de materiais recicláveis é um passo importante para fortalecer a coleta seletiva, gerar renda e contribuir para uma cidade mais limpa e sustentável. Com esse objetivo, a Prefeitura de Belém entregou, nesta quarta-feira, 18, a nova Unida...",
          "imageUrl": "https://www.portalolavodutra.com.br/uploads/6afe0f35d15fb.webp",
          "sourceUrl": "https://www.portalolavodutra.com.br/materias/prefeitura_e_itaipu_binacional_entregam_novo_galpao_de_coleta_seletiva_em_belem",
          "isAuto": true,
          "fullText": "A obra faz parte do programa Belém pro Futuro e foi executada por Convênio entre a Prefeitura de Belém, Itaipu Binacional e Itaipu Parquetec\n\nBelém, PA - A melhoria das condições de trabalho dos catadores de materiais recicláveis é um passo importante para fortalecer a coleta seletiva, gerar renda e contribuir para uma cidade mais limpa e sustentável. Com esse objetivo, a Prefeitura de Belém entregou, nesta quarta-feira, 18, a nova Unidade de Valorização de Recicláveis (UVR) Filhos do Sol, localizada na avenida Bernardo Sayão, no bairro da Condor.\n\nO espaço foi recuperado e adaptado pela Secretaria Municipal de Obras e Infraestrutura (Seinfra), em parceria com a Itaipu Binacional e a Itaipu Parquetec.\n\nA entrega é parte de um conjunto de investimentos de modernização da coleta seletiva e fortalecimento da gestão de resíduos sólidos em Belém. A iniciativa busca oferecer melhores condições de trabalho aos catadores cooperados, ampliar a capacidade de processamento dos materiais recicláveis e incentivar a economia circular no município.\n\nCom investimento de R$ 2.089.951,88, a obra faz parte do programa Belém pro Futuro e foi executada por meio do Convênio 71, firmado entre a Prefeitura de Belém e a Itaipu Binacional, com participação da Itaipu Parquetec. O projeto contempla a recuperação da estrutura física do galpão e a construção de novos espaços para melhorar as atividades da cooperativa.\n\nA Cooperativa Filhos do Sol deixou o antigo endereço, na travessa Padre Eutíquio, onde os trabalhadores enfrentavam problemas frequentes de alagamento e dificuldades para realizar a triagem dos materiais recicláveis. Agora, passa a funcionar em um galpão com 1.010,20 metros quadrados, preparado para atender às necessidades da atividade."
      },
      {
          "id": "gnews-1795467304414-2",
          "title": "Governo do Pará fortalece reciclagem e geração de renda com entrega de equipamentos a cooperativa de catadores em Belém",
          "category": "Ecologia & Região",
          "date": "20 de nov. de 2026",
          "author": "Agência Pará de Notícias",
          "featured": false,
          "summary": "Esteira e triturador de vidro vão melhorar as condições de trabalho da Concaves, ampliar o reaproveitamento de resíduos e criar novas oportunidades de comercialização O Governo do Pará, por meio da Secretaria de Estado de Meio Ambiente, Clima e Sustentabilidade (Semas), acompanhou, na quinta-feira (19), a entrega de uma esteira e um triturador de vidro à Cooperativa de Trabalho dos Catadores de Materiais Recicláveis de Terra Firme (Conc...",
          "imageUrl": "https://agenciapara.com.br/midias/2026/pequenas/20261121123024-GC00080707-F00325927.webp",
          "sourceUrl": "https://agenciapara.com.br/noticia/80707/governo-do-para-fortalece-reciclagem-e-geracao-de-renda-com-entrega-de-equipamentos-a-cooperativa-de-catadores-em-belem",
          "isAuto": true,
          "fullText": "Esteira e triturador de vidro vão melhorar as condições de trabalho da Concaves, ampliar o reaproveitamento de resíduos e criar novas oportunidades de comercialização\n\nO Governo do Pará, por meio da Secretaria de Estado de Meio Ambiente, Clima e Sustentabilidade (Semas), acompanhou, na quinta-feira (19), a entrega de uma esteira e um triturador de vidro à Cooperativa de Trabalho dos Catadores de Materiais Recicláveis de Terra Firme (Concaves), em Belém. A iniciativa fortalece a estrutura de trabalho dos catadores, amplia as possibilidades de reciclagem e contribui para a geração de renda e a destinação ambientalmente adequada de resíduos sólidos.\n\nOs equipamentos, fornecidos pela empresa GDK Engenharia, foram doados pela Revita, por meio de compensação ambiental vinculada ao Programa Regulariza Pará. A ação integra os esforços de fortalecimento da economia circular, com foco na valorização dos profissionais que atuam na coleta, separação e reaproveitamento de materiais recicláveis.\n\nA entrega contou com a presença do secretário adjunto de Gestão e Regularidade Ambiental da Semas, Rodolpho Zahluth Bastos; da secretária executiva de Inclusão Produtiva de Belém, Pamela Massoud; da presidenta da Concaves, Débora Baía; e do presidente da Central Única de Cooperativas de Catadores da Amazônia, Jonas de Jesus.\n\nA nova estrutura representa um avanço para as atividades da Concaves, especialmente no reaproveitamento do vidro, material que pode ser reciclado diversas vezes, mas que ainda apresenta desafios relacionados à coleta e à destinação adequada.\n\nCom o triturador, a cooperativa poderá processar garrafas e outros resíduos de vidro, transformando-os em matéria-prima para novos produtos. A medida amplia as possibilidades de comercialização do material e contribui para reduzir o descarte inadequado em aterros sanitários, ruas, rios e praias."
      },
      {
          "id": "gnews-1795467304965-3",
          "title": "Prefeitura entrega novo galpão e fortalece a coleta seletiva em Belém",
          "category": "Ecologia & Região",
          "date": "18 de nov. de 2026",
          "author": "Rede Brasil",
          "featured": false,
          "summary": "A melhoria das condições de trabalho dos catadores de materiais recicláveis é um passo importante para fortalecer a coleta seletiva, gerar renda e contribuir para uma cidade mais limpa e sustentável. Com esse objetivo, a Prefeitura de Belém entregou, nesta quarta-feira (18), a nova Unidade de Valorização de Recicláveis (UVR) Filhos do Sol, localizada na avenida Bernardo Sayão , no bairro da Condor. O espaço foi recuperado e adaptado pel...",
          "imageUrl": "https://str1.lnmimg.net/img/2026/11/18/0b0ab5ec0a02200bd614ab5381dc0d78.webp",
          "sourceUrl": "https://rbtv.com.br/noticia/33222/prefeitura-entrega-novo-galpao-e-fortalece-a-coleta-seletiva-em-belem",
          "isAuto": true,
          "fullText": "A melhoria das condições de trabalho dos catadores de materiais recicláveis é um passo importante para fortalecer a coleta seletiva, gerar renda e contribuir para uma cidade mais limpa e sustentável. Com esse objetivo, a Prefeitura de Belém entregou, nesta quarta-feira (18), a nova Unidade de Valorização de Recicláveis (UVR) Filhos do Sol, localizada na avenida Bernardo Sayão , no bairro da Condor. O espaço foi recuperado e adaptado pela Secretaria Municipal de Obras e Infraestrutura (Seinfra), em parceria com a Itaipu Binacional e a Itaipu Parquetec.\n\nA entrega é parte de um conjunto de investimentos de modernização da coleta seletiva e fortalecimento da gestão de resíduos sólidos em Belém. A iniciativa busca oferecer melhores condições de trabalho aos catadores cooperados, ampliar a capacidade de processamento dos materiais recicláveis e incentivar a economia circular no município.\n\nCom investimento de R$ 2.089.951,88, a obra faz parte do programa Belém pro Futuro e foi executada por meio do Convênio 71, firmado entre a Prefeitura de Belém e a Itaipu Binacional, com participação da Itaipu Parquetec. O projeto contempla a recuperação da estrutura física do galpão e a construção de novos espaços para melhorar as atividades da cooperativa.\n\nA Cooperativa Filhos do Sol deixou o antigo endereço, na travessa Padre Eutíquio, onde os trabalhadores enfrentavam problemas frequentes de alagamento e dificuldades para realizar a triagem dos materiais recicláveis. Agora, passa a funcionar em um galpão com 1.010,20 metros quadrados, preparado para atender às necessidades da atividade.\n\nA nova unidade conta com áreas destinadas à seleção, estocagem e prensagem dos materiais recicláveis, além de salas administrativas, refeitório, vestiários e espaços de circulação e manobra de veículos e equipamentos.\n\nUm dos principais diferenciais da obra é a construção de um porto logístico totalmente novo , projetado para facilitar o recebimento, a movimentação e o transporte dos materiais recicláveis. A estrutura foi construída do zero e é um diferencial da unidade Filhos do Sol em relação às demais Unidades de Valorização de Recicláveis (UVRs) contempladas pelo projeto."
      },
      {
          "id": "gnews-1795467305173-4",
          "title": "Reciclagem gera mais de R$ 4 milhões em receitas para catadores de Belém",
          "category": "Ecologia & Região",
          "date": "18 de nov. de 2026",
          "author": "DCmais",
          "featured": false,
          "summary": "Catadores de materiais recicláveis de Belém (PA) reciclaram mais de 3,5 mil toneladas que geraram uma receita de R$ 4 ...",
          "imageUrl": "http://www.bing.com/th?id=ONUT.68Hv2qyw3gZNSUcTxyW4ag&pid=News",
          "sourceUrl": "https://dcmais.com.br/parana/reciclagem-gera-mais-de-r-4-milhoes-em-receitas-para-catadores-de-belem/",
          "isAuto": true
      },
      {
          "id": "gnews-1795467305723-5",
          "title": "Coleta seletiva chega a Batista Campos; saiba quais materiais podem ser reciclados",
          "category": "Ecologia & Região",
          "date": "24 de jun. de 2026",
          "author": "globo",
          "featured": false,
          "summary": "Além do recolhimento domiciliar de recicláveis às quartas-feiras, os moradores contam com ecopontos e coleta gratuita de pequenos entulhos agendada por WhatsApp. Moradores do bairro de Batista Campos, em Belém , passam a contar com coleta seletiva a partir desta quarta-feira (24). O recolhimento dos materiais recicláveis será realizado todas as quartas-feiras, a partir das 7h.",
          "imageUrl": "https://s2-g1.glbimg.com/0dPLrPt2NDiR-nTR6L7FyL-FwEQ=/1600x0/filters:format(jpeg)/https://i.s3.glbimg.com/v1/AUTH_59edd422c0c84a879bd37670ae4f538a/internal_photos/bs/2025/h/r/3IynfIQcCc54l16R3YJg/whatsapp-image-2025-03-28-at-10.54.09.jpeg",
          "sourceUrl": "https://g1.globo.com/pa/para/noticia/2026/06/24/coleta-seletiva-chega-a-batista-campos-saiba-quais-materiais-podem-ser-reciclados.ghtml",
          "isAuto": true,
          "fullText": "Além do recolhimento domiciliar de recicláveis às quartas-feiras, os moradores contam com ecopontos e coleta gratuita de pequenos entulhos agendada por WhatsApp.\n\nMoradores do bairro de Batista Campos, em Belém , passam a contar com coleta seletiva a partir desta quarta-feira (24). O recolhimento dos materiais recicláveis será realizado todas as quartas-feiras, a partir das 7h.\n\nA coleta é destinada a materiais como papel, plástico, metal e vidro. Para que possam ser reciclados, os resíduos devem estar limpos e sem restos de alimentos ou outros contaminantes.\n\nEntre os itens que não devem ser descartados junto aos recicláveis estão restos de comida, papéis engordurados, espelhos, vidros temperados, isopor contaminado e sacos plásticos sujos.\n\nCom a inclusão de Batista Campos, a coleta seletiva passa a atender dois bairros da capital. Em Nazaré, o serviço ocorre às terças-feiras, também a partir das 7h.\n\nA ampliação busca aumentar a quantidade de resíduos encaminhados para reciclagem e reduzir o volume de lixo destinado aos aterros sanitários."
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
          let changed = false;
          if (parsed.points.length === 0) {
            parsed.points = JSON.parse(JSON.stringify(DEFAULT_DB.points));
            changed = true;
          }
          if (!Array.isArray(parsed.materialsGuide) || parsed.materialsGuide.length === 0) {
            parsed.materialsGuide = JSON.parse(JSON.stringify(DEFAULT_DB.materialsGuide));
            changed = true;
          }
          if (!Array.isArray(parsed.incentives) || parsed.incentives.length === 0) {
            parsed.incentives = JSON.parse(JSON.stringify(DEFAULT_DB.incentives));
            changed = true;
          }

          // Garante que novos pontos/materiais adicionados ao catalogo padrao aparecam mesmo com localStorage antigo
          for (const defPt of DEFAULT_DB.points) {
            if (!parsed.points.some((p) => p.id === defPt.id)) {
              parsed.points.push(JSON.parse(JSON.stringify(defPt)));
              changed = true;
            }
          }
          for (const defMat of DEFAULT_DB.materialsGuide) {
            if (!parsed.materialsGuide.some((m) => m.id === defMat.id || m.slug === defMat.slug)) {
              parsed.materialsGuide.push(JSON.parse(JSON.stringify(defMat)));
              changed = true;
            }
          }

          const mockedIds = new Set(['news-1', 'news-2', 'news-3']);
          const cleanedNews = (parsed.news || []).filter((n) => !mockedIds.has(n.id));
          if (cleanedNews.length !== (parsed.news || []).length) {
            parsed.news = cleanedNews;
            changed = true;
          }

          const hasAutoNews = (parsed.news || []).some((n) => n.isAuto || String(n.id).startsWith('gnews-'));
          if (!hasAutoNews) {
            const autoDefaults = DEFAULT_DB.news.filter((n) => n.isAuto || String(n.id).startsWith('gnews-'));
            parsed.news = [...autoDefaults, ...(parsed.news || [])];
            changed = true;
          } else {
            for (const n of parsed.news || []) {
              if (!n.fullText) {
                const match = DEFAULT_DB.news.find((d) => d.id === n.id || d.title === n.title);
                if (match && match.fullText) {
                  n.fullText = match.fullText;
                  changed = true;
                }
              }
            }
          }

          if (changed) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          }
          this.data = parsed;
          return this.data;
        }
      } catch (e) {
        console.warn('Erro ao ler localStorage, restaurando banco padrão.');
      }
    }

    // 3. Tenta carregar data/database.json estático (útil no GitHub Pages / Live Server)
    try {
      const staticRes = await fetch('./data/database.json', { cache: 'no-store' });
      if (staticRes.ok) {
        const staticData = await staticRes.json();
        if (staticData && Array.isArray(staticData.points)) {
          this.data = staticData;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
          return this.data;
        }
      }
    } catch (e) {}

    // 4. Usa banco inicial padrão
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
