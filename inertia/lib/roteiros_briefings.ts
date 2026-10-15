/**
 * Base de Conhecimento e Roteiros Técnicos de Briefings por Ambiente
 * Extraído dos 18 Manuais Técnicos em docs/briefings/
 * 
 * Auto-gerado e estruturado para apoio em tempo real no detalhamento técnico do briefing.
 */

export type TipoPerguntaDestaque =
  | 'emocional'
  | 'estrategica'
  | 'chave'
  | 'pratica'
  | 'essencial'
  | 'profunda'
  | 'experiencia'
  | 'geral'

export interface PerguntaDestaque {
  tipo: TipoPerguntaDestaque
  rotulo: string
  pergunta: string
  secao?: string
}

export interface BlocoSecao {
  tipo: 'pergunta_destaque' | 'prompt' | 'itens' | 'nota' | 'texto'
  rotulo?: string
  texto?: string
  tipoPergunta?: TipoPerguntaDestaque
  itens?: string[]
}

export interface SecaoRoteiro {
  id: string
  titulo: string
  perguntasDestaque: PerguntaDestaque[]
  itens: string[]
  conteudoLinhas: string[]
  blocos?: BlocoSecao[]
}

export interface RoteiroAmbiente {
  slug: string
  titulo: string
  subtitulo: string
  arquivoPdfOriginal: string
  secoes: SecaoRoteiro[]
  perguntasEstrategicas: PerguntaDestaque[]
  topicosChecagemTecnica: string[]
}

export const LISTA_ROTEIROS: { slug: string; titulo: string; subtitulo: string }[] = [
  {
    "slug": "adega",
    "titulo": "Adega",
    "subtitulo": "Conservação, capacidade, exposição de rótulos e experiência de degustação"
  },
  {
    "slug": "area_gourmet",
    "titulo": "Espaço Gourmet / Área Gourmet",
    "subtitulo": "Equipamentos, churrasqueira, bancadas de apoio, receber convidados e lazer"
  },
  {
    "slug": "banheiro_suite_master",
    "titulo": "Banheiro Suíte Master",
    "subtitulo": "Uso compartilhado do casal, cubas duplas, espelhos, maquiagem e spa"
  },
  {
    "slug": "banheiros",
    "titulo": "Banheiros (Social / Hóspedes)",
    "subtitulo": "Praticidade, armazenamento de higiene, bancada, área de banho e nichos"
  },
  {
    "slug": "closet",
    "titulo": "Closet",
    "subtitulo": "Divisão de casal, proporção de cabides e dobrados, sapatos, bolsas e joias"
  },
  {
    "slug": "cozinha",
    "titulo": "Cozinha",
    "subtitulo": "Triângulo funcional, eletros embutidos, despensa, bancada e rotina de preparo"
  },
  {
    "slug": "despensa",
    "titulo": "Despensa",
    "subtitulo": "Setorização de mantimentos, eletroportáteis, ventilação e fluxo com cozinha"
  },
  {
    "slug": "hall_entrada",
    "titulo": "Hall de Entrada",
    "subtitulo": "Impacto visual na recepção, sapateira de apoio, espelhos e circulação"
  },
  {
    "slug": "home_office",
    "titulo": "Home Office",
    "subtitulo": "Ergonomia, monitores, tomadas/fiação, reuniões em vídeo e armazenamento"
  },
  {
    "slug": "home_theater",
    "titulo": "Home Theater",
    "subtitulo": "Painel de TV, acústica, distância do sofá, iluminação cênica e cabos"
  },
  {
    "slug": "lavabo",
    "titulo": "Lavabo",
    "subtitulo": "Cartão de visitas social, impacto estético, bancada esculpida e iluminação"
  },
  {
    "slug": "lavanderia",
    "titulo": "Área de Serviço / Lavanderia",
    "subtitulo": "Fluxo de roupas sujas e limpas, máquina, varal, produtos e tábua de passar"
  },
  {
    "slug": "living",
    "titulo": "Living / Sala de Estar",
    "subtitulo": "Convivência familiar, integração com jantar/varanda e layout de sofás"
  },
  {
    "slug": "louceiro",
    "titulo": "Louceiro",
    "subtitulo": "Armazenamento seguro de louças, cristaleira, faqueiros e apoio ao servir"
  },
  {
    "slug": "quarto_casal",
    "titulo": "Suíte Master / Quarto Casal",
    "subtitulo": "Refúgio de descanso, cabeceira, mesas de cabeceira, iluminação e TV"
  },
  {
    "slug": "quarto_filhos",
    "titulo": "Quarto dos Filhos",
    "subtitulo": "Fase de desenvolvimento, cama, estudos, brinquedos, segurança e evolução"
  },
  {
    "slug": "rouparia",
    "titulo": "Rouparia",
    "subtitulo": "Organização de roupas de cama e banho, travesseiros e centralização"
  },
  {
    "slug": "sala_jantar",
    "titulo": "Sala de Jantar",
    "subtitulo": "Dimensão da mesa, número de lugares, circulação, buffet e pendentes"
  }
]

export const ROTEIROS_BRIEFINGS: Record<string, RoteiroAmbiente> = {
  "adega": {
    "slug": "adega",
    "titulo": "Adega",
    "subtitulo": "Conservação, capacidade, exposição de rótulos e experiência de degustação",
    "arquivoPdfOriginal": "BRIEFING ADEGA.pdf",
    "secoes": [
      {
        "id": "adega_sec_1",
        "titulo": "2. Objetivo da adega",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "2. Objetivo da adega",
            "pergunta": "Qual o papel da adega no ambiente?",
            "secao": "2. Objetivo da adega"
          },
          {
            "tipo": "emocional",
            "rotulo": "Pergunta emocional:",
            "pergunta": "Essa adega precisa mais funcionar, impressionar ou os dois?",
            "secao": "2. Objetivo da adega"
          }
        ],
        "itens": [
          "Armazenar vinhos",
          "Expor vinhos",
          "Elemento decorativo",
          "Espaço de experiência (degustação)",
          "Apoio para receber convidados",
          "Composição com bar"
        ],
        "conteudoLinhas": [
          "Qual o papel da adega no ambiente?",
          "   Armazenar vinhos",
          "   Expor vinhos",
          "   Elemento decorativo",
          "   Espaço de experiência (degustação)",
          "   Apoio para receber convidados",
          "   Composição com bar",
          "[Pergunta emocional:] Essa adega precisa mais funcionar, impressionar ou os dois?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Qual o papel da adega no ambiente?",
            "itens": [
              "Armazenar vinhos",
              "Expor vinhos",
              "Elemento decorativo",
              "Espaço de experiência (degustação)",
              "Apoio para receber convidados",
              "Composição com bar"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta emocional:",
            "texto": "Essa adega precisa mais funcionar, impressionar ou os dois?",
            "tipoPergunta": "emocional",
            "itens": []
          }
        ]
      },
      {
        "id": "adega_sec_2",
        "titulo": "3. Perfil do cliente (CRÍTICO)",
        "perguntasDestaque": [],
        "itens": [
          "Iniciante (consumo ocasional)",
          "Apreciador (consome com frequência)",
          "Entusiasta (tem coleção)",
          "Colecionador (alto volume e cuidado)"
        ],
        "conteudoLinhas": [
          "O cliente é:",
          "   Iniciante (consumo ocasional)",
          "   Apreciador (consome com frequência)",
          "   Entusiasta (tem coleção)",
          "   Colecionador (alto volume e cuidado)"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "O cliente é:",
            "itens": [
              "Iniciante (consumo ocasional)",
              "Apreciador (consome com frequência)",
              "Entusiasta (tem coleção)",
              "Colecionador (alto volume e cuidado)"
            ]
          }
        ]
      },
      {
        "id": "adega_sec_3",
        "titulo": "4. Consumo de vinho",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Você costuma comprar para consumo rápido ou guardar por mais tempo?",
            "secao": "4. Consumo de vinho"
          }
        ],
        "itens": [
          "Frequência:",
          "Diário",
          "Semanal",
          "Ocasional",
          "Tipo:",
          "Tinto",
          "Branco",
          "Rosé",
          "Espumante"
        ],
        "conteudoLinhas": [
          "   Frequência:",
          "o Diário",
          "o Semanal",
          "o Ocasional",
          "   Tipo:",
          "o Tinto",
          "o Branco",
          "o Rosé",
          "o Espumante",
          "[Pergunta-chave:] Você costuma comprar para consumo rápido ou guardar por mais tempo?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Frequência:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Diário"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Semanal"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ocasional"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tipo:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tinto"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Branco"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Rosé"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espumante"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Você costuma comprar para consumo rápido ou guardar por mais tempo?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "adega_sec_4",
        "titulo": "5. Capacidade",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "5. Capacidade",
            "pergunta": "Quantas garrafas pretende armazenar?",
            "secao": "5. Capacidade"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Pergunta estratégica:",
            "pergunta": "Você pretende aumentar essa coleção ao longo do tempo?",
            "secao": "5. Capacidade"
          }
        ],
        "itens": [
          "Até 12",
          "12–30",
          "30–60",
          "60+",
          "Sem definição"
        ],
        "conteudoLinhas": [
          "Quantas garrafas pretende armazenar?",
          "   Até 12",
          "   12–30",
          "   30–60",
          "   60+",
          "   Sem definição",
          "[Pergunta estratégica:] Você pretende aumentar essa coleção ao longo do tempo?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Quantas garrafas pretende armazenar?",
            "itens": [
              "Até 12",
              "12–30",
              "30–60",
              "60+",
              "Sem definição"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta estratégica:",
            "texto": "Você pretende aumentar essa coleção ao longo do tempo?",
            "tipoPergunta": "estrategica",
            "itens": []
          }
        ]
      },
      {
        "id": "adega_sec_5",
        "titulo": "6. Tipo de adega",
        "perguntasDestaque": [],
        "itens": [
          "Nichos abertos",
          "Adega climatizada (eletro)",
          "Móvel decorativo",
          "Adega embutida",
          "Adega walk-in (alto padrão)"
        ],
        "conteudoLinhas": [
          "   Nichos abertos",
          "   Adega climatizada (eletro)",
          "   Móvel decorativo",
          "   Adega embutida",
          "   Adega walk-in (alto padrão)"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Nichos abertos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Adega climatizada (eletro)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Móvel decorativo"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Adega embutida"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Adega walk-in (alto padrão)"
            ]
          }
        ]
      },
      {
        "id": "adega_sec_6",
        "titulo": "7. Integração com outros usos",
        "perguntasDestaque": [],
        "itens": [
          "Bar integrado",
          "Espaço para drinks",
          "Porta-taças",
          "Bancada de apoio",
          "Cristaleira",
          "Espaço para servir"
        ],
        "conteudoLinhas": [
          "A adega terá:",
          "   Bar integrado",
          "   Espaço para drinks",
          "   Porta-taças",
          "   Bancada de apoio",
          "   Cristaleira",
          "   Espaço para servir"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "A adega terá:",
            "itens": [
              "Bar integrado",
              "Espaço para drinks",
              "Porta-taças",
              "Bancada de apoio",
              "Cristaleira",
              "Espaço para servir"
            ]
          }
        ]
      },
      {
        "id": "adega_sec_7",
        "titulo": "8. Exposição vs conservação",
        "perguntasDestaque": [],
        "itens": [
          "Mais estética (exposição)",
          "Mais técnica (conservação)",
          "Equilíbrio",
          "Luz",
          "Temperatura",
          "Umidade",
          "Posição das garrafas"
        ],
        "conteudoLinhas": [
          "   Mais estética (exposição)",
          "   Mais técnica (conservação)",
          "   Equilíbrio",
          "Importante explicar ao cliente:",
          "   Luz",
          "   Temperatura",
          "   Umidade",
          "   Posição das garrafas"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Mais estética (exposição)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Mais técnica (conservação)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Equilíbrio"
            ]
          },
          {
            "tipo": "nota",
            "texto": "Importante explicar ao cliente:"
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Temperatura"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Umidade"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Posição das garrafas"
            ]
          }
        ]
      },
      {
        "id": "adega_sec_8",
        "titulo": "9. Organização",
        "perguntasDestaque": [],
        "itens": [
          "Garrafas deitadas (recomendado)",
          "Garrafas em pé (uso rápido)",
          "Separação por tipo/região",
          "Nichos",
          "Gavetas",
          "Porta-rolhas",
          "Acessórios"
        ],
        "conteudoLinhas": [
          "   Garrafas deitadas (recomendado)",
          "   Garrafas em pé (uso rápido)",
          "   Separação por tipo/região",
          "Precisa de:",
          "   Nichos",
          "   Gavetas",
          "   Porta-rolhas",
          "   Acessórios"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Garrafas deitadas (recomendado)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Garrafas em pé (uso rápido)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Separação por tipo/região"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Precisa de:",
            "itens": [
              "Nichos",
              "Gavetas",
              "Porta-rolhas",
              "Acessórios"
            ]
          }
        ]
      },
      {
        "id": "adega_sec_9",
        "titulo": "10. Iluminação (DIFERENCIAL FORTE)",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Você quer que a adega vire um destaque visual à noite?",
            "secao": "10. Iluminação (DIFERENCIAL FORTE)"
          }
        ],
        "itens": [
          "Luz indireta",
          "Luz quente",
          "Destaque das garrafas",
          "LED embutido"
        ],
        "conteudoLinhas": [
          "   Luz indireta",
          "   Luz quente",
          "   Destaque das garrafas",
          "   LED embutido",
          "[Pergunta-chave:] Você quer que a adega vire um destaque visual à noite?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Luz indireta"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz quente"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Destaque das garrafas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "LED embutido"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Você quer que a adega vire um destaque visual à noite?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "adega_sec_10",
        "titulo": "11. Estilo",
        "perguntasDestaque": [],
        "itens": [
          "Sofisticado",
          "Moderno",
          "Clássico",
          "Industrial",
          "Minimalista",
          "Madeira",
          "Metal",
          "Vidro",
          "Pedra",
          "Espelho"
        ],
        "conteudoLinhas": [
          "   Sofisticado",
          "   Moderno",
          "   Clássico",
          "   Industrial",
          "   Minimalista",
          "Materiais:",
          "   Madeira",
          "   Metal",
          "   Vidro",
          "   Pedra",
          "   Espelho"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Sofisticado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Moderno"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Clássico"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Industrial"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Minimalista"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Materiais:",
            "itens": [
              "Madeira",
              "Metal",
              "Vidro",
              "Pedra",
              "Espelho"
            ]
          }
        ]
      },
      {
        "id": "adega_sec_11",
        "titulo": "12. Portas",
        "perguntasDestaque": [],
        "itens": [
          "Aberta",
          "Vidro transparente",
          "Vidro fumê",
          "Vidro canelado",
          "Porta fechada"
        ],
        "conteudoLinhas": [
          "   Aberta",
          "   Vidro transparente",
          "   Vidro fumê",
          "   Vidro canelado",
          "   Porta fechada"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Aberta"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Vidro transparente"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Vidro fumê"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Vidro canelado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Porta fechada"
            ]
          }
        ]
      },
      {
        "id": "adega_sec_12",
        "titulo": "13. Localização",
        "perguntasDestaque": [],
        "itens": [
          "Próxima à mesa",
          "Próxima ao bar",
          "Próxima à área gourmet",
          "Destaque no living",
          "Discreta"
        ],
        "conteudoLinhas": [
          "   Próxima à mesa",
          "   Próxima ao bar",
          "   Próxima à área gourmet",
          "   Destaque no living",
          "   Discreta"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Próxima à mesa"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Próxima ao bar"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Próxima à área gourmet"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Destaque no living"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Discreta"
            ]
          }
        ]
      },
      {
        "id": "adega_sec_13",
        "titulo": "14. Manutenção",
        "perguntasDestaque": [],
        "itens": [
          "Fácil limpeza",
          "Controle de poeira",
          "Proteção das garrafas"
        ],
        "conteudoLinhas": [
          "   Fácil limpeza",
          "   Controle de poeira",
          "   Proteção das garrafas"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Fácil limpeza"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Controle de poeira"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Proteção das garrafas"
            ]
          }
        ]
      },
      {
        "id": "adega_sec_14",
        "titulo": "15. Pontos de dor",
        "perguntasDestaque": [],
        "itens": [
          "Falta de organização",
          "Garrafas espalhadas",
          "Falta de destaque",
          "Falta de espaço",
          "Ambiente sem identidade"
        ],
        "conteudoLinhas": [
          "   Falta de organização",
          "   Garrafas espalhadas",
          "   Falta de destaque",
          "   Falta de espaço",
          "   Ambiente sem identidade"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Falta de organização"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Garrafas espalhadas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Falta de destaque"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Falta de espaço"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ambiente sem identidade"
            ]
          }
        ]
      },
      {
        "id": "adega_sec_15",
        "titulo": "16. Experiência desejada",
        "perguntasDestaque": [],
        "itens": [
          "Ambiente sofisticado",
          "Espaço de degustação",
          "Ambiente social",
          "Destaque visual"
        ],
        "conteudoLinhas": [
          "   Ambiente sofisticado",
          "   Espaço de degustação",
          "   Ambiente social",
          "   Destaque visual"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Ambiente sofisticado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espaço de degustação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ambiente social"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Destaque visual"
            ]
          }
        ]
      },
      {
        "id": "adega_sec_16",
        "titulo": "17. Perguntas de aprofundamento",
        "perguntasDestaque": [
          {
            "tipo": "profunda",
            "rotulo": "17. Perguntas de aprofundamento",
            "pergunta": "Você gosta de receber pessoas para vinho?",
            "secao": "17. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "17. Perguntas de aprofundamento",
            "pergunta": "Você quer uma adega funcional ou que impressiona?",
            "secao": "17. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "17. Perguntas de aprofundamento",
            "pergunta": "Existe algum ambiente que você viu e gostou?",
            "secao": "17. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "17. Perguntas de aprofundamento",
            "pergunta": "Você quer algo discreto ou protagonista?",
            "secao": "17. Perguntas de aprofundamento"
          }
        ],
        "itens": [
          "Você gosta de receber pessoas para vinho?",
          "Você quer uma adega funcional ou que impressiona?",
          "Existe algum ambiente que você viu e gostou?",
          "Você quer algo discreto ou protagonista?"
        ],
        "conteudoLinhas": [
          "   Você gosta de receber pessoas para vinho?",
          "   Você quer uma adega funcional ou que impressiona?",
          "   Existe algum ambiente que você viu e gostou?",
          "   Você quer algo discreto ou protagonista?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Você gosta de receber pessoas para vinho?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você quer uma adega funcional ou que impressiona?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Existe algum ambiente que você viu e gostou?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você quer algo discreto ou protagonista?"
            ]
          }
        ]
      },
      {
        "id": "adega_sec_17",
        "titulo": "18. Investimento e prioridade",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "18. Investimento e prioridade",
            "pergunta": "Já tem previsão?",
            "secao": "18. Investimento e prioridade"
          }
        ],
        "itens": [
          "Já tem previsão?",
          "Prioriza:",
          "Estética",
          "Funcionalidade",
          "Conservação",
          "Destaque"
        ],
        "conteudoLinhas": [
          "   Já tem previsão?",
          "   Prioriza:",
          "o Estética",
          "o Funcionalidade",
          "o Conservação",
          "o Destaque"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Já tem previsão?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Prioriza:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Estética"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Funcionalidade"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Conservação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Destaque"
            ]
          }
        ]
      },
      {
        "id": "adega_sec_18",
        "titulo": "19. Checklist técnico",
        "perguntasDestaque": [],
        "itens": [
          "Tomada elétrica (se climatizada)",
          "Ventilação",
          "Espaço adequado",
          "Integração com outros móveis"
        ],
        "conteudoLinhas": [
          "   Tomada elétrica (se climatizada)",
          "   Ventilação",
          "   Espaço adequado",
          "   Integração com outros móveis"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Tomada elétrica (se climatizada)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ventilação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espaço adequado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Integração com outros móveis"
            ]
          }
        ]
      },
      {
        "id": "adega_sec_19",
        "titulo": "20. Resumo para o projetista",
        "perguntasDestaque": [],
        "itens": [],
        "conteudoLinhas": [
          "Perfil do cliente:",
          "Volume de garrafas:",
          "Uso:",
          "Nível de exposição:",
          "Estilo:",
          "Integração:",
          "Itens obrigatórios:"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Perfil do cliente:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Volume de garrafas:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Uso:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Nível de exposição:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Estilo:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Integração:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Itens obrigatórios:",
            "itens": []
          }
        ]
      }
    ],
    "perguntasEstrategicas": [
      {
        "tipo": "estrategica",
        "rotulo": "2. Objetivo da adega",
        "pergunta": "Qual o papel da adega no ambiente?",
        "secao": "2. Objetivo da adega"
      },
      {
        "tipo": "emocional",
        "rotulo": "Pergunta emocional:",
        "pergunta": "Essa adega precisa mais funcionar, impressionar ou os dois?",
        "secao": "2. Objetivo da adega"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Você costuma comprar para consumo rápido ou guardar por mais tempo?",
        "secao": "4. Consumo de vinho"
      },
      {
        "tipo": "estrategica",
        "rotulo": "5. Capacidade",
        "pergunta": "Quantas garrafas pretende armazenar?",
        "secao": "5. Capacidade"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Pergunta estratégica:",
        "pergunta": "Você pretende aumentar essa coleção ao longo do tempo?",
        "secao": "5. Capacidade"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Você quer que a adega vire um destaque visual à noite?",
        "secao": "10. Iluminação (DIFERENCIAL FORTE)"
      },
      {
        "tipo": "profunda",
        "rotulo": "17. Perguntas de aprofundamento",
        "pergunta": "Você gosta de receber pessoas para vinho?",
        "secao": "17. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "17. Perguntas de aprofundamento",
        "pergunta": "Você quer uma adega funcional ou que impressiona?",
        "secao": "17. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "17. Perguntas de aprofundamento",
        "pergunta": "Existe algum ambiente que você viu e gostou?",
        "secao": "17. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "17. Perguntas de aprofundamento",
        "pergunta": "Você quer algo discreto ou protagonista?",
        "secao": "17. Perguntas de aprofundamento"
      },
      {
        "tipo": "estrategica",
        "rotulo": "18. Investimento e prioridade",
        "pergunta": "Já tem previsão?",
        "secao": "18. Investimento e prioridade"
      }
    ],
    "topicosChecagemTecnica": [
      "3. Perfil do cliente (CRÍTICO)",
      "19. Checklist técnico",
      "[19. Checklist técnico] Tomada elétrica (se climatizada)",
      "[19. Checklist técnico] Ventilação",
      "[19. Checklist técnico] Espaço adequado",
      "[19. Checklist técnico] Integração com outros móveis",
      "20. Resumo para o projetista"
    ]
  },
  "area_gourmet": {
    "slug": "area_gourmet",
    "titulo": "Espaço Gourmet / Área Gourmet",
    "subtitulo": "Equipamentos, churrasqueira, bancadas de apoio, receber convidados e lazer",
    "arquivoPdfOriginal": "BRIEFING AREA GOURMET.pdf",
    "secoes": [
      {
        "id": "area_gourmet_sec_1",
        "titulo": "Objetivo da área gourmet",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "Objetivo da área gourmet",
            "pergunta": "Qual é o principal papel desse ambiente?",
            "secao": "Objetivo da área gourmet"
          },
          {
            "tipo": "emocional",
            "rotulo": "Pergunta emocional:",
            "pergunta": "Quando você imagina essa área pronta, qual sensação gostaria de ter?",
            "secao": "Objetivo da área gourmet"
          }
        ],
        "itens": [
          "Receber família",
          "Receber amigos",
          "Churrascos frequentes",
          "Almoços de domingo",
          "Jantares especiais",
          "Espaço de lazer diário",
          "Integração com piscina",
          "Apoio para festas",
          "Uso mais decorativo do que funcional",
          "Espaço para valorização do imóvel",
          "Conforto",
          "Sofisticação",
          "Praticidade",
          "Aconchego",
          "Casa cheia",
          "Elegância",
          "Relaxamento",
          "Orgulho ao receber"
        ],
        "conteudoLinhas": [
          "Qual é o principal papel desse ambiente?",
          "   Receber família",
          "   Receber amigos",
          "   Churrascos frequentes",
          "   Almoços de domingo",
          "   Jantares especiais",
          "   Espaço de lazer diário",
          "   Integração com piscina",
          "   Apoio para festas",
          "   Uso mais decorativo do que funcional",
          "   Espaço para valorização do imóvel",
          "[Pergunta emocional:] Quando você imagina essa área pronta, qual sensação gostaria de ter?",
          "Exemplos:",
          "   Conforto",
          "   Sofisticação",
          "   Praticidade",
          "   Aconchego",
          "   Casa cheia",
          "   Elegância",
          "   Relaxamento",
          "   Orgulho ao receber"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Qual é o principal papel desse ambiente?",
            "itens": [
              "Receber família",
              "Receber amigos",
              "Churrascos frequentes",
              "Almoços de domingo",
              "Jantares especiais",
              "Espaço de lazer diário",
              "Integração com piscina",
              "Apoio para festas",
              "Uso mais decorativo do que funcional",
              "Espaço para valorização do imóvel"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta emocional:",
            "texto": "Quando você imagina essa área pronta, qual sensação gostaria de ter?",
            "tipoPergunta": "emocional",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Exemplos:",
            "itens": [
              "Conforto",
              "Sofisticação",
              "Praticidade",
              "Aconchego",
              "Casa cheia",
              "Elegância",
              "Relaxamento",
              "Orgulho ao receber"
            ]
          }
        ]
      },
      {
        "id": "area_gourmet_sec_2",
        "titulo": "Perfil de uso",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "Perfil de uso",
            "pergunta": "Com que frequência a área gourmet será usada?",
            "secao": "Perfil de uso"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Perfil de uso",
            "pergunta": "Quase sempre para receber convidados Quantas pessoas normalmente usam o ambiente?",
            "secao": "Perfil de uso"
          }
        ],
        "itens": [
          "Diariamente",
          "Finais de semana",
          "Datas especiais",
          "Poucas vezes ao mês",
          "Quase sempre para receber convidados Quantas pessoas normalmente usam o ambiente?",
          "Moradores:",
          "Convidados frequentes:",
          "Capacidade ideal desejada:",
          "Família pequena",
          "Família grande",
          "Casais de amigos",
          "Crianças",
          "Idosos",
          "Clientes/convidados profissionais",
          "Eventos maiores"
        ],
        "conteudoLinhas": [
          "Com que frequência a área gourmet será usada?",
          "   Diariamente",
          "   Finais de semana",
          "   Datas especiais",
          "   Poucas vezes ao mês",
          "   Quase sempre para receber convidados",
          "   Moradores:",
          "   Convidados frequentes:",
          "   Capacidade ideal desejada:",
          "Costumam receber:",
          "   Família pequena",
          "   Família grande",
          "   Casais de amigos",
          "   Crianças",
          "   Idosos",
          "   Clientes/convidados profissionais",
          "   Eventos maiores"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Com que frequência a área gourmet será usada?",
            "itens": [
              "Diariamente",
              "Finais de semana",
              "Datas especiais",
              "Poucas vezes ao mês",
              "Quase sempre para receber convidados Quantas pessoas normalmente usam o ambiente?",
              "Moradores:",
              "Convidados frequentes:",
              "Capacidade ideal desejada:"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Costumam receber:",
            "itens": [
              "Família pequena",
              "Família grande",
              "Casais de amigos",
              "Crianças",
              "Idosos",
              "Clientes/convidados profissionais",
              "Eventos maiores"
            ]
          }
        ]
      },
      {
        "id": "area_gourmet_sec_3",
        "titulo": "Estilo de receber",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "Estilo de receber",
            "pergunta": "Como o cliente gosta de receber?",
            "secao": "Estilo de receber"
          },
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Você quer que a área gourmet seja mais “casa de família” ou mais “ambiente de revista”?",
            "secao": "Estilo de receber"
          }
        ],
        "itens": [
          "Cozinhando enquanto conversa",
          "Churrasqueiro separado dos convidados",
          "Todos ao redor da bancada",
          "Mesa grande como protagonista",
          "Ambiente mais informal",
          "Ambiente sofisticado e elegante",
          "Serviço feito por funcionário/copeira",
          "Cada convidado se serve"
        ],
        "conteudoLinhas": [
          "Como o cliente gosta de receber?",
          "   Cozinhando enquanto conversa",
          "   Churrasqueiro separado dos convidados",
          "   Todos ao redor da bancada",
          "   Mesa grande como protagonista",
          "   Ambiente mais informal",
          "   Ambiente sofisticado e elegante",
          "   Serviço feito por funcionário/copeira",
          "   Cada convidado se serve",
          "[Pergunta-chave:] Você quer que a área gourmet seja mais “casa de família” ou mais “ambiente de revista”?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Como o cliente gosta de receber?",
            "itens": [
              "Cozinhando enquanto conversa",
              "Churrasqueiro separado dos convidados",
              "Todos ao redor da bancada",
              "Mesa grande como protagonista",
              "Ambiente mais informal",
              "Ambiente sofisticado e elegante",
              "Serviço feito por funcionário/copeira",
              "Cada convidado se serve"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Você quer que a área gourmet seja mais “casa de família” ou mais “ambiente de revista”?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "area_gourmet_sec_4",
        "titulo": "Rotina gastronômica",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "Rotina gastronômica",
            "pergunta": "O que será preparado com mais frequência?",
            "secao": "Rotina gastronômica"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Rotina gastronômica",
            "pergunta": "Quem normalmente prepara?",
            "secao": "Rotina gastronômica"
          }
        ],
        "itens": [
          "Churrasco",
          "Pizza",
          "Hambúrguer",
          "Massas",
          "Comida caseira",
          "Drinks",
          "Café",
          "Sobremesas",
          "Petiscos",
          "Refeições completas",
          "Apenas apoio para buffet",
          "Cliente",
          "Cônjuge",
          "Funcionário",
          "Churrasqueiro contratado",
          "Amigos/família",
          "Destro",
          "Canhoto",
          "Baixa estatura",
          "Alta estatura",
          "Gosta de tudo à mão",
          "Gosta de bancada livre",
          "Detalhista/organizada",
          "Mais prática/descontraída"
        ],
        "conteudoLinhas": [
          "O que será preparado com mais frequência?",
          "   Churrasco",
          "   Pizza",
          "   Hambúrguer",
          "   Massas",
          "   Comida caseira",
          "   Drinks",
          "   Café",
          "   Sobremesas",
          "   Petiscos",
          "   Refeições completas",
          "   Apenas apoio para buffet",
          "Quem normalmente prepara?",
          "   Cliente",
          "   Cônjuge",
          "   Funcionário",
          "   Churrasqueiro contratado",
          "   Amigos/família",
          "A pessoa que cozinha é:",
          "   Destro",
          "   Canhoto",
          "   Baixa estatura",
          "   Alta estatura",
          "   Gosta de tudo à mão",
          "   Gosta de bancada livre",
          "   Detalhista/organizada",
          "   Mais prática/descontraída"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "O que será preparado com mais frequência?",
            "itens": [
              "Churrasco",
              "Pizza",
              "Hambúrguer",
              "Massas",
              "Comida caseira",
              "Drinks",
              "Café",
              "Sobremesas",
              "Petiscos",
              "Refeições completas",
              "Apenas apoio para buffet"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Quem normalmente prepara?",
            "itens": [
              "Cliente",
              "Cônjuge",
              "Funcionário",
              "Churrasqueiro contratado",
              "Amigos/família"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "A pessoa que cozinha é:",
            "itens": [
              "Destro",
              "Canhoto",
              "Baixa estatura",
              "Alta estatura",
              "Gosta de tudo à mão",
              "Gosta de bancada livre",
              "Detalhista/organizada",
              "Mais prática/descontraída"
            ]
          }
        ]
      },
      {
        "id": "area_gourmet_sec_5",
        "titulo": "Equipamentos previstos",
        "perguntasDestaque": [],
        "itens": [
          "Churrasqueira a carvão",
          "Churrasqueira a gás",
          "Churrasqueira elétrica",
          "Parrilla",
          "Forno de pizza",
          "Cooktop",
          "Fogão",
          "Coifa/exaustor",
          "Chopeira",
          "Cervejeira",
          "Adega",
          "Frigobar",
          "Geladeira",
          "Freezer",
          "Máquina de gelo",
          "Lava-louças",
          "Cuba simples",
          "Cuba dupla",
          "Triturador",
          "Micro-ondas",
          "Forno elétrico",
          "Cafeteira",
          "Air fryer",
          "Liquidificador",
          "TV",
          "Som",
          "Automação",
          "Climatização"
        ],
        "conteudoLinhas": [
          "Marcar o que terá no ambiente:",
          "   Churrasqueira a carvão",
          "   Churrasqueira a gás",
          "   Churrasqueira elétrica",
          "   Parrilla",
          "   Forno de pizza",
          "   Cooktop",
          "   Fogão",
          "   Coifa/exaustor",
          "   Chopeira",
          "   Cervejeira",
          "   Adega",
          "   Frigobar",
          "   Geladeira",
          "   Freezer",
          "   Máquina de gelo",
          "   Lava-louças",
          "   Cuba simples",
          "   Cuba dupla",
          "   Triturador",
          "   Micro-ondas",
          "   Forno elétrico",
          "   Cafeteira",
          "   Air fryer",
          "   Liquidificador",
          "   TV",
          "   Som",
          "   Automação",
          "   Climatização",
          "Importante:",
          "Solicitar modelos, medidas técnicas e manuais dos equipamentos antes do projeto",
          "executivo."
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Marcar o que terá no ambiente:",
            "itens": [
              "Churrasqueira a carvão",
              "Churrasqueira a gás",
              "Churrasqueira elétrica",
              "Parrilla",
              "Forno de pizza",
              "Cooktop",
              "Fogão",
              "Coifa/exaustor",
              "Chopeira",
              "Cervejeira",
              "Adega",
              "Frigobar",
              "Geladeira",
              "Freezer",
              "Máquina de gelo",
              "Lava-louças",
              "Cuba simples",
              "Cuba dupla",
              "Triturador",
              "Micro-ondas",
              "Forno elétrico",
              "Cafeteira",
              "Air fryer",
              "Liquidificador",
              "TV",
              "Som",
              "Automação",
              "Climatização"
            ]
          },
          {
            "tipo": "nota",
            "texto": "Importante:"
          },
          {
            "tipo": "prompt",
            "texto": "Solicitar modelos, medidas técnicas e manuais dos equipamentos antes do projeto",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "executivo.",
            "itens": []
          }
        ]
      },
      {
        "id": "area_gourmet_sec_6",
        "titulo": "Armazenamento necessário",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "Armazenamento necessário",
            "pergunta": "O que precisa ser guardado na área gourmet?",
            "secao": "Armazenamento necessário"
          },
          {
            "tipo": "pratica",
            "rotulo": "Pergunta prática:",
            "pergunta": "Você quer que tudo fique escondido ou gosta de alguns itens expostos como decoração?",
            "secao": "Armazenamento necessário"
          }
        ],
        "itens": [
          "Louças",
          "Taças",
          "Copos",
          "Talheres",
          "Pratos de uso diário",
          "Pratos de festa",
          "Travessas grandes",
          "Panelas",
          "Espetos",
          "Grelhas",
          "Tábuas",
          "Carvão",
          "Bebidas",
          "Garrafas",
          "Guardanapos",
          "Toalhas",
          "Jogos americanos",
          "Produtos de limpeza",
          "Ração/petiscos de pet",
          "Brinquedos de piscina",
          "Itens de churrasco",
          "Utensílios de bar",
          "Café e cápsulas"
        ],
        "conteudoLinhas": [
          "O que precisa ser guardado na área gourmet?",
          "   Louças",
          "   Taças",
          "   Copos",
          "   Talheres",
          "   Pratos de uso diário",
          "   Pratos de festa",
          "   Travessas grandes",
          "   Panelas",
          "   Espetos",
          "   Grelhas",
          "   Tábuas",
          "   Carvão",
          "   Bebidas",
          "   Garrafas",
          "   Guardanapos",
          "   Toalhas",
          "   Jogos americanos",
          "   Produtos de limpeza",
          "   Ração/petiscos de pet",
          "   Brinquedos de piscina",
          "   Itens de churrasco",
          "   Utensílios de bar",
          "   Café e cápsulas",
          "[Pergunta prática:] Você quer que tudo fique escondido ou gosta de alguns itens expostos como decoração?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "O que precisa ser guardado na área gourmet?",
            "itens": [
              "Louças",
              "Taças",
              "Copos",
              "Talheres",
              "Pratos de uso diário",
              "Pratos de festa",
              "Travessas grandes",
              "Panelas",
              "Espetos",
              "Grelhas",
              "Tábuas",
              "Carvão",
              "Bebidas",
              "Garrafas",
              "Guardanapos",
              "Toalhas",
              "Jogos americanos",
              "Produtos de limpeza",
              "Ração/petiscos de pet",
              "Brinquedos de piscina",
              "Itens de churrasco",
              "Utensílios de bar",
              "Café e cápsulas"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta prática:",
            "texto": "Você quer que tudo fique escondido ou gosta de alguns itens expostos como decoração?",
            "tipoPergunta": "pratica",
            "itens": []
          }
        ]
      },
      {
        "id": "area_gourmet_sec_7",
        "titulo": "Bancadas e apoio",
        "perguntasDestaque": [],
        "itens": [
          "Bancada para preparo",
          "Bancada para servir",
          "Bancada para refeições rápidas",
          "Ilha",
          "Península",
          "Bar",
          "Apoio para buffet",
          "Apoio para bebidas",
          "Apoio para café",
          "Apoio próximo à churrasqueira",
          "Espaço para cortar carnes",
          "Espaço para massas/pizzas",
          "Padrão",
          "Mais alta",
          "Mais baixa",
          "Personalizada para quem mais usa"
        ],
        "conteudoLinhas": [
          "A área precisa ter:",
          "   Bancada para preparo",
          "   Bancada para servir",
          "   Bancada para refeições rápidas",
          "   Ilha",
          "   Península",
          "   Bar",
          "   Apoio para buffet",
          "   Apoio para bebidas",
          "   Apoio para café",
          "   Apoio próximo à churrasqueira",
          "   Espaço para cortar carnes",
          "   Espaço para massas/pizzas",
          "Altura desejada:",
          "   Padrão",
          "   Mais alta",
          "   Mais baixa",
          "   Personalizada para quem mais usa"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "A área precisa ter:",
            "itens": [
              "Bancada para preparo",
              "Bancada para servir",
              "Bancada para refeições rápidas",
              "Ilha",
              "Península",
              "Bar",
              "Apoio para buffet",
              "Apoio para bebidas",
              "Apoio para café",
              "Apoio próximo à churrasqueira",
              "Espaço para cortar carnes",
              "Espaço para massas/pizzas"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Altura desejada:",
            "itens": [
              "Padrão",
              "Mais alta",
              "Mais baixa",
              "Personalizada para quem mais usa"
            ]
          }
        ]
      },
      {
        "id": "area_gourmet_sec_8",
        "titulo": "Fluxo e circulação",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "Fluxo e circulação",
            "pergunta": "Por onde entram os convidados?",
            "secao": "Fluxo e circulação"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Fluxo e circulação",
            "pergunta": "Onde fica a piscina?",
            "secao": "Fluxo e circulação"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Fluxo e circulação",
            "pergunta": "Onde fica a cozinha principal?",
            "secao": "Fluxo e circulação"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Fluxo e circulação",
            "pergunta": "Onde fica o lavabo/banheiro?",
            "secao": "Fluxo e circulação"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Fluxo e circulação",
            "pergunta": "Há acesso de serviço?",
            "secao": "Fluxo e circulação"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Fluxo e circulação",
            "pergunta": "Há portas de correr?",
            "secao": "Fluxo e circulação"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Fluxo e circulação",
            "pergunta": "Há integração com sala?",
            "secao": "Fluxo e circulação"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Fluxo e circulação",
            "pergunta": "Há área externa aberta?",
            "secao": "Fluxo e circulação"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Fluxo e circulação",
            "pergunta": "Há incidência de sol, chuva ou vento?",
            "secao": "Fluxo e circulação"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Fluxo e circulação",
            "pergunta": "A churrasqueira solta fumaça para qual direção?",
            "secao": "Fluxo e circulação"
          },
          {
            "tipo": "essencial",
            "rotulo": "Pergunta essencial:",
            "pergunta": "Em dias de festa, onde as pessoas naturalmente ficam concentradas?",
            "secao": "Fluxo e circulação"
          }
        ],
        "itens": [
          "Por onde entram os convidados?",
          "Onde fica a piscina?",
          "Onde fica a cozinha principal?",
          "Onde fica o lavabo/banheiro?",
          "Há acesso de serviço?",
          "Há portas de correr?",
          "Há integração com sala?",
          "Há área externa aberta?",
          "Há incidência de sol, chuva ou vento?",
          "A churrasqueira solta fumaça para qual direção?"
        ],
        "conteudoLinhas": [
          "Analisar:",
          "   Por onde entram os convidados?",
          "   Onde fica a piscina?",
          "   Onde fica a cozinha principal?",
          "   Onde fica o lavabo/banheiro?",
          "   Há acesso de serviço?",
          "   Há portas de correr?",
          "   Há integração com sala?",
          "   Há área externa aberta?",
          "   Há incidência de sol, chuva ou vento?",
          "   A churrasqueira solta fumaça para qual direção?",
          "[Pergunta essencial:] Em dias de festa, onde as pessoas naturalmente ficam concentradas?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Analisar:",
            "itens": [
              "Por onde entram os convidados?",
              "Onde fica a piscina?",
              "Onde fica a cozinha principal?",
              "Onde fica o lavabo/banheiro?",
              "Há acesso de serviço?",
              "Há portas de correr?",
              "Há integração com sala?",
              "Há área externa aberta?",
              "Há incidência de sol, chuva ou vento?",
              "A churrasqueira solta fumaça para qual direção?"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta essencial:",
            "texto": "Em dias de festa, onde as pessoas naturalmente ficam concentradas?",
            "tipoPergunta": "essencial",
            "itens": []
          }
        ]
      },
      {
        "id": "area_gourmet_sec_9",
        "titulo": "Integração com outros ambientes",
        "perguntasDestaque": [],
        "itens": [
          "Cozinha",
          "Living",
          "Piscina",
          "Jardim",
          "Varanda",
          "Home",
          "Sala de jantar",
          "Área de serviço",
          "Lavabo",
          "Vestiário",
          "Integração total",
          "Integração parcial",
          "Possibilidade de fechar o ambiente",
          "Ambiente independente",
          "Visual limpo quando visto da sala",
          "Área gourmet como destaque da casa"
        ],
        "conteudoLinhas": [
          "A área gourmet se conecta com:",
          "   Cozinha",
          "   Living",
          "   Piscina",
          "   Jardim",
          "   Varanda",
          "   Home",
          "   Sala de jantar",
          "   Área de serviço",
          "   Lavabo",
          "   Vestiário",
          "O cliente deseja:",
          "   Integração total",
          "   Integração parcial",
          "   Possibilidade de fechar o ambiente",
          "   Ambiente independente",
          "   Visual limpo quando visto da sala",
          "   Área gourmet como destaque da casa"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "A área gourmet se conecta com:",
            "itens": [
              "Cozinha",
              "Living",
              "Piscina",
              "Jardim",
              "Varanda",
              "Home",
              "Sala de jantar",
              "Área de serviço",
              "Lavabo",
              "Vestiário"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "O cliente deseja:",
            "itens": [
              "Integração total",
              "Integração parcial",
              "Possibilidade de fechar o ambiente",
              "Ambiente independente",
              "Visual limpo quando visto da sala",
              "Área gourmet como destaque da casa"
            ]
          }
        ]
      },
      {
        "id": "area_gourmet_sec_10",
        "titulo": "Estilo visual desejado",
        "perguntasDestaque": [
          {
            "tipo": "emocional",
            "rotulo": "Pergunta emocional:",
            "pergunta": "Você quer que esse ambiente impressione logo ao entrar ou que ele seja mais discreto e acolhedor?",
            "secao": "Estilo visual desejado"
          }
        ],
        "itens": [
          "Moderno",
          "Contemporâneo",
          "Atemporal",
          "Rústico sofisticado",
          "Minimalista",
          "Natural",
          "Brasileiro",
          "Industrial leve",
          "Elegante",
          "Descontraído",
          "Alto padrão com presença",
          "Madeira clara",
          "Madeira escura",
          "Laca",
          "Vidro",
          "Metal",
          "Palha/tela",
          "Pedra natural",
          "Porcelanato",
          "Ripado",
          "Portas com perfil metálico",
          "Iluminação embutida",
          "Nichos decorativos"
        ],
        "conteudoLinhas": [
          "Preferência estética:",
          "   Moderno",
          "   Contemporâneo",
          "   Atemporal",
          "   Rústico sofisticado",
          "   Minimalista",
          "   Natural",
          "   Brasileiro",
          "   Industrial leve",
          "   Elegante",
          "   Descontraído",
          "   Alto padrão com presença",
          "Materiais desejados:",
          "   Madeira clara",
          "   Madeira escura",
          "   Laca",
          "   Vidro",
          "   Metal",
          "   Palha/tela",
          "   Pedra natural",
          "   Porcelanato",
          "   Ripado",
          "   Portas com perfil metálico",
          "   Iluminação embutida",
          "   Nichos decorativos",
          "[Pergunta emocional:] Você quer que esse ambiente impressione logo ao entrar ou que ele seja mais discreto e acolhedor?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Preferência estética:",
            "itens": [
              "Moderno",
              "Contemporâneo",
              "Atemporal",
              "Rústico sofisticado",
              "Minimalista",
              "Natural",
              "Brasileiro",
              "Industrial leve",
              "Elegante",
              "Descontraído",
              "Alto padrão com presença"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Materiais desejados:",
            "itens": [
              "Madeira clara",
              "Madeira escura",
              "Laca",
              "Vidro",
              "Metal",
              "Palha/tela",
              "Pedra natural",
              "Porcelanato",
              "Ripado",
              "Portas com perfil metálico",
              "Iluminação embutida",
              "Nichos decorativos"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta emocional:",
            "texto": "Você quer que esse ambiente impressione logo ao entrar ou que ele seja mais discreto e acolhedor?",
            "tipoPergunta": "emocional",
            "itens": []
          }
        ]
      },
      {
        "id": "area_gourmet_sec_11",
        "titulo": "Nível de manutenção desejado",
        "perguntasDestaque": [
          {
            "tipo": "geral",
            "rotulo": "Perguntar:",
            "pergunta": "Perguntar:",
            "secao": "Nível de manutenção desejado"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Nível de manutenção desejado",
            "pergunta": "Tem empregada/doméstica?",
            "secao": "Nível de manutenção desejado"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Nível de manutenção desejado",
            "pergunta": "Quem limpa esse ambiente?",
            "secao": "Nível de manutenção desejado"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Nível de manutenção desejado",
            "pergunta": "Com que frequência?",
            "secao": "Nível de manutenção desejado"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Nível de manutenção desejado",
            "pergunta": "Há criança pequena?",
            "secao": "Nível de manutenção desejado"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Nível de manutenção desejado",
            "pergunta": "O ambiente pega poeira, sol ou chuva?",
            "secao": "Nível de manutenção desejado"
          }
        ],
        "itens": [
          "Materiais fáceis de limpar",
          "Visual sofisticado mesmo com mais cuidado",
          "Acabamentos resistentes à gordura",
          "Acabamentos resistentes à umidade",
          "Poucas frestas",
          "Poucos itens abertos",
          "Tudo fechado para evitar poeira",
          "Pode ter cristaleira/nichos decorativos",
          "Tem empregada/doméstica?",
          "Quem limpa esse ambiente?",
          "Com que frequência?",
          "Há criança pequena?",
          "Há pets?",
          "O ambiente pega poeira, sol ou chuva?"
        ],
        "conteudoLinhas": [
          "O cliente prefere:",
          "   Materiais fáceis de limpar",
          "   Visual sofisticado mesmo com mais cuidado",
          "   Acabamentos resistentes à gordura",
          "   Acabamentos resistentes à umidade",
          "   Poucas frestas",
          "   Poucos itens abertos",
          "   Tudo fechado para evitar poeira",
          "   Pode ter cristaleira/nichos decorativos",
          "[Perguntar:] Perguntar:",
          "   Tem empregada/doméstica?",
          "   Quem limpa esse ambiente?",
          "   Com que frequência?",
          "   Há criança pequena?",
          "   Há pets?",
          "   O ambiente pega poeira, sol ou chuva?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "O cliente prefere:",
            "itens": [
              "Materiais fáceis de limpar",
              "Visual sofisticado mesmo com mais cuidado",
              "Acabamentos resistentes à gordura",
              "Acabamentos resistentes à umidade",
              "Poucas frestas",
              "Poucos itens abertos",
              "Tudo fechado para evitar poeira",
              "Pode ter cristaleira/nichos decorativos"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Perguntar:",
            "texto": "Perguntar:",
            "tipoPergunta": "geral",
            "itens": [
              "Tem empregada/doméstica?",
              "Quem limpa esse ambiente?",
              "Com que frequência?",
              "Há criança pequena?",
              "Há pets?",
              "O ambiente pega poeira, sol ou chuva?"
            ]
          }
        ]
      },
      {
        "id": "area_gourmet_sec_12",
        "titulo": "Crianças, pets e segurança",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "Crianças, pets e segurança",
            "pergunta": "Há crianças usando o espaço?",
            "secao": "Crianças, pets e segurança"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Crianças, pets e segurança",
            "pergunta": "Evitar objetos decorativos frágeis Há pets?",
            "secao": "Crianças, pets e segurança"
          }
        ],
        "itens": [
          "Sim",
          "Não",
          "Futuramente",
          "Cantos arredondados",
          "Gavetas com trava",
          "Altura segura para bebidas",
          "Distância da churrasqueira",
          "Espaço para circulação",
          "Materiais resistentes",
          "Evitar portas de vidro baixas",
          "Evitar objetos decorativos frágeis Há pets?",
          "Cachorro",
          "Gato",
          "Não",
          "Espaço para pote de água/ração",
          "Armário para itens do pet",
          "Material resistente a riscos",
          "Área de circulação livre"
        ],
        "conteudoLinhas": [
          "Há crianças usando o espaço?",
          "   Sim",
          "   Não",
          "   Futuramente",
          "Cuidados necessários:",
          "   Cantos arredondados",
          "   Gavetas com trava",
          "   Altura segura para bebidas",
          "   Distância da churrasqueira",
          "   Espaço para circulação",
          "   Materiais resistentes",
          "   Evitar portas de vidro baixas",
          "   Evitar objetos decorativos frágeis",
          "   Cachorro",
          "   Gato",
          "   Não",
          "Necessidades:",
          "   Espaço para pote de água/ração",
          "   Armário para itens do pet",
          "   Material resistente a riscos",
          "   Área de circulação livre"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Há crianças usando o espaço?",
            "itens": [
              "Sim",
              "Não",
              "Futuramente"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Cuidados necessários:",
            "itens": [
              "Cantos arredondados",
              "Gavetas com trava",
              "Altura segura para bebidas",
              "Distância da churrasqueira",
              "Espaço para circulação",
              "Materiais resistentes",
              "Evitar portas de vidro baixas",
              "Evitar objetos decorativos frágeis Há pets?",
              "Cachorro",
              "Gato",
              "Não"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Necessidades:",
            "itens": [
              "Espaço para pote de água/ração",
              "Armário para itens do pet",
              "Material resistente a riscos",
              "Área de circulação livre"
            ]
          }
        ]
      },
      {
        "id": "area_gourmet_sec_13",
        "titulo": "Tecnologia e entretenimento",
        "perguntasDestaque": [
          {
            "tipo": "experiencia",
            "rotulo": "Pergunta de experiência:",
            "pergunta": "Esse espaço será mais para conversa, gastronomia, música, TV/jogos ou festas?",
            "secao": "Tecnologia e entretenimento"
          }
        ],
        "itens": [
          "TV",
          "Som ambiente",
          "Alexa/automação",
          "Wi-Fi reforçado",
          "Iluminação dimerizável",
          "Cenas de iluminação",
          "Tomadas USB",
          "Tomadas para notebook/celular",
          "Espaço para videogame",
          "Projetor/telão"
        ],
        "conteudoLinhas": [
          "O ambiente terá:",
          "   TV",
          "   Som ambiente",
          "   Alexa/automação",
          "   Wi-Fi reforçado",
          "   Iluminação dimerizável",
          "   Cenas de iluminação",
          "   Tomadas USB",
          "   Tomadas para notebook/celular",
          "   Espaço para videogame",
          "   Projetor/telão",
          "[Pergunta de experiência:] Esse espaço será mais para conversa, gastronomia, música, TV/jogos ou festas?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "O ambiente terá:",
            "itens": [
              "TV",
              "Som ambiente",
              "Alexa/automação",
              "Wi-Fi reforçado",
              "Iluminação dimerizável",
              "Cenas de iluminação",
              "Tomadas USB",
              "Tomadas para notebook/celular",
              "Espaço para videogame",
              "Projetor/telão"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta de experiência:",
            "texto": "Esse espaço será mais para conversa, gastronomia, música, TV/jogos ou festas?",
            "tipoPergunta": "experiencia",
            "itens": []
          }
        ]
      },
      {
        "id": "area_gourmet_sec_14",
        "titulo": "Iluminação",
        "perguntasDestaque": [
          {
            "tipo": "geral",
            "rotulo": "Perguntar:",
            "pergunta": "Perguntar:",
            "secao": "Iluminação"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Iluminação",
            "pergunta": "Usa mais de dia ou à noite?",
            "secao": "Iluminação"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Iluminação",
            "pergunta": "Quer clima de restaurante/bar?",
            "secao": "Iluminação"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Iluminação",
            "pergunta": "Quer iluminação para fotos e redes sociais?",
            "secao": "Iluminação"
          }
        ],
        "itens": [
          "Luz funcional para preparo",
          "Luz decorativa",
          "Luz indireta",
          "Luz quente e aconchegante",
          "Luz para destacar cristaleira",
          "Luz para bancada",
          "Luz para bar",
          "Luz para churrasqueira",
          "Cenas diferentes para dia/noite",
          "Usa mais de dia ou à noite?",
          "Quer clima de restaurante/bar?",
          "Quer iluminação para fotos e redes sociais?"
        ],
        "conteudoLinhas": [
          "O cliente deseja:",
          "   Luz funcional para preparo",
          "   Luz decorativa",
          "   Luz indireta",
          "   Luz quente e aconchegante",
          "   Luz para destacar cristaleira",
          "   Luz para bancada",
          "   Luz para bar",
          "   Luz para churrasqueira",
          "   Cenas diferentes para dia/noite",
          "[Perguntar:] Perguntar:",
          "   Usa mais de dia ou à noite?",
          "   Quer clima de restaurante/bar?",
          "   Quer iluminação para fotos e redes sociais?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "O cliente deseja:",
            "itens": [
              "Luz funcional para preparo",
              "Luz decorativa",
              "Luz indireta",
              "Luz quente e aconchegante",
              "Luz para destacar cristaleira",
              "Luz para bancada",
              "Luz para bar",
              "Luz para churrasqueira",
              "Cenas diferentes para dia/noite"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Perguntar:",
            "texto": "Perguntar:",
            "tipoPergunta": "geral",
            "itens": [
              "Usa mais de dia ou à noite?",
              "Quer clima de restaurante/bar?",
              "Quer iluminação para fotos e redes sociais?"
            ]
          }
        ]
      },
      {
        "id": "area_gourmet_sec_15",
        "titulo": "Bebidas e bar",
        "perguntasDestaque": [],
        "itens": [
          "Vinho",
          "Cerveja",
          "Chope",
          "Whisky",
          "Gin",
          "Drinks",
          "Café",
          "Água/sucos",
          "Refrigerantes",
          "Adega",
          "Cervejeira",
          "Chopeira",
          "Bandeja de bar",
          "Porta-taças",
          "Cristaleira",
          "Espaço para garrafas em pé",
          "Gaveta para acessórios",
          "Cuba próxima",
          "Gelo fácil",
          "Bancada para preparo de drinks"
        ],
        "conteudoLinhas": [
          "O cliente costuma consumir/servir:",
          "   Vinho",
          "   Cerveja",
          "   Chope",
          "   Whisky",
          "   Gin",
          "   Drinks",
          "   Café",
          "   Água/sucos",
          "   Refrigerantes",
          "Necessidades:",
          "   Adega",
          "   Cervejeira",
          "   Chopeira",
          "   Bandeja de bar",
          "   Porta-taças",
          "   Cristaleira",
          "   Espaço para garrafas em pé",
          "     Gaveta para acessórios",
          "     Cuba próxima",
          "     Gelo fácil",
          "     Bancada para preparo de drinks"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "O cliente costuma consumir/servir:",
            "itens": [
              "Vinho",
              "Cerveja",
              "Chope",
              "Whisky",
              "Gin",
              "Drinks",
              "Café",
              "Água/sucos",
              "Refrigerantes"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Necessidades:",
            "itens": [
              "Adega",
              "Cervejeira",
              "Chopeira",
              "Bandeja de bar",
              "Porta-taças",
              "Cristaleira",
              "Espaço para garrafas em pé",
              "Gaveta para acessórios",
              "Cuba próxima",
              "Gelo fácil",
              "Bancada para preparo de drinks"
            ]
          }
        ]
      },
      {
        "id": "area_gourmet_sec_16",
        "titulo": "Pontos de dor e experiências anteriores",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "Pontos de dor e experiências anteriores",
            "pergunta": "O cliente já teve área gourmet antes?",
            "secao": "Pontos de dor e experiências anteriores"
          }
        ],
        "itens": [
          "Sim",
          "Não",
          "Falta de espaço",
          "Fumaça",
          "Gordura",
          "Pouca bancada",
          "Falta de tomada",
          "Pouco armazenamento",
          "Dificuldade de limpeza",
          "Ambiente quente",
          "Pouca iluminação",
          "Móveis danificados por umidade",
          "Convidados longe de quem cozinha",
          "Churrasqueira mal posicionada"
        ],
        "conteudoLinhas": [
          "O cliente já teve área gourmet antes?",
          "     Sim",
          "     Não",
          "O que gostava?",
          "O que não gostava?",
          "Já teve problemas com:",
          "     Falta de espaço",
          "     Fumaça",
          "     Gordura",
          "     Pouca bancada",
          "     Falta de tomada",
          "     Pouco armazenamento",
          "     Dificuldade de limpeza",
          "     Ambiente quente",
          "     Pouca iluminação",
          "     Móveis danificados por umidade",
          "     Convidados longe de quem cozinha",
          "     Churrasqueira mal posicionada"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "O cliente já teve área gourmet antes?",
            "itens": [
              "Sim",
              "Não"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "O que gostava?",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "O que não gostava?",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Já teve problemas com:",
            "itens": [
              "Falta de espaço",
              "Fumaça",
              "Gordura",
              "Pouca bancada",
              "Falta de tomada",
              "Pouco armazenamento",
              "Dificuldade de limpeza",
              "Ambiente quente",
              "Pouca iluminação",
              "Móveis danificados por umidade",
              "Convidados longe de quem cozinha",
              "Churrasqueira mal posicionada"
            ]
          }
        ]
      },
      {
        "id": "area_gourmet_sec_17",
        "titulo": "Concorrentes e referências",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "Concorrentes e referências",
            "pergunta": "Já orçou com outra empresa?",
            "secao": "Concorrentes e referências"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Concorrentes e referências",
            "pergunta": "O que gostou nas outras propostas?",
            "secao": "Concorrentes e referências"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Concorrentes e referências",
            "pergunta": "O que exatamente você gosta nessa imagem?",
            "secao": "Concorrentes e referências"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Concorrentes e referências",
            "pergunta": "Material, cor, iluminação, sensação, layout ou estilo?",
            "secao": "Concorrentes e referências"
          }
        ],
        "itens": [
          "Sim",
          "Não",
          "Pinterest",
          "Instagram",
          "Casa de amigos",
          "Apartamento decorado",
          "Revista",
          "Projeto de arquiteto"
        ],
        "conteudoLinhas": [
          "Já orçou com outra empresa?",
          "     Sim",
          "     Não",
          "Quais?",
          "O que gostou nas outras propostas?",
          "O que não gostou?",
          "Tem referências de:",
          "     Pinterest",
          "     Instagram",
          "     Casa de amigos",
          "   Apartamento decorado",
          "   Revista",
          "   Projeto de arquiteto",
          "Pedir imagens de referência e perguntar:",
          "O que exatamente você gosta nessa imagem?",
          "Material, cor, iluminação, sensação, layout ou estilo?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Já orçou com outra empresa?",
            "itens": [
              "Sim",
              "Não"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Quais?",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "O que gostou nas outras propostas?",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "O que não gostou?",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Tem referências de:",
            "itens": [
              "Pinterest",
              "Instagram",
              "Casa de amigos",
              "Apartamento decorado",
              "Revista",
              "Projeto de arquiteto"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Pedir imagens de referência e perguntar:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "O que exatamente você gosta nessa imagem?",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Material, cor, iluminação, sensação, layout ou estilo?",
            "itens": []
          }
        ]
      },
      {
        "id": "area_gourmet_sec_18",
        "titulo": "Investimento e expectativa",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "Investimento e expectativa",
            "pergunta": "Existe uma previsão de investimento?",
            "secao": "Investimento e expectativa"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Pergunta estratégica:",
            "pergunta": "Se tivermos que escolher, o que é mais importante: estética, funcionalidade, prazo ou investimento?",
            "secao": "Investimento e expectativa"
          }
        ],
        "itens": [
          "Sim:",
          "Não definida:",
          "Melhor custo-benefício",
          "Alto padrão visual",
          "Máxima durabilidade",
          "Projeto mais completo",
          "Projeto por etapas",
          "Menor prazo",
          "Melhor acabamento",
          "Mais funcionalidade",
          "Mais impacto visual"
        ],
        "conteudoLinhas": [
          "Existe uma previsão de investimento?",
          "   Sim:",
          "   Não definida:",
          "O cliente prioriza:",
          "   Melhor custo-benefício",
          "   Alto padrão visual",
          "   Máxima durabilidade",
          "   Projeto mais completo",
          "   Projeto por etapas",
          "   Menor prazo",
          "   Melhor acabamento",
          "   Mais funcionalidade",
          "   Mais impacto visual",
          "[Pergunta estratégica:] Se tivermos que escolher, o que é mais importante: estética, funcionalidade, prazo ou investimento?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Existe uma previsão de investimento?",
            "itens": [
              "Sim:",
              "Não definida:"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "O cliente prioriza:",
            "itens": [
              "Melhor custo-benefício",
              "Alto padrão visual",
              "Máxima durabilidade",
              "Projeto mais completo",
              "Projeto por etapas",
              "Menor prazo",
              "Melhor acabamento",
              "Mais funcionalidade",
              "Mais impacto visual"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta estratégica:",
            "texto": "Se tivermos que escolher, o que é mais importante: estética, funcionalidade, prazo ou investimento?",
            "tipoPergunta": "estrategica",
            "itens": []
          }
        ]
      },
      {
        "id": "area_gourmet_sec_19",
        "titulo": "Checklist técnico inicial",
        "perguntasDestaque": [],
        "itens": [
          "Planta baixa",
          "Projeto arquitetônico",
          "Projeto de interiores",
          "Pontos hidráulicos",
          "Pontos elétricos",
          "Pontos de gás",
          "Ponto de exaustão",
          "Pé-direito",
          "Medidas da churrasqueira",
          "Medidas da bancada",
          "Medidas dos eletros",
          "Revestimentos definidos",
          "Pedra definida",
          "Piso definido",
          "Esquadrias instaladas",
          "Obra pronta para medição",
          "Fotos/vídeos do local"
        ],
        "conteudoLinhas": [
          "Verificar se já existe:",
          "   Planta baixa",
          "   Projeto arquitetônico",
          "   Projeto de interiores",
          "   Pontos hidráulicos",
          "   Pontos elétricos",
          "   Pontos de gás",
          "   Ponto de exaustão",
          "   Pé-direito",
          "   Medidas da churrasqueira",
          "   Medidas da bancada",
          "   Medidas dos eletros",
          "   Revestimentos definidos",
          "   Pedra definida",
          "   Piso definido",
          "   Esquadrias instaladas",
          "   Obra pronta para medição",
          "   Fotos/vídeos do local"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Verificar se já existe:",
            "itens": [
              "Planta baixa",
              "Projeto arquitetônico",
              "Projeto de interiores",
              "Pontos hidráulicos",
              "Pontos elétricos",
              "Pontos de gás",
              "Ponto de exaustão",
              "Pé-direito",
              "Medidas da churrasqueira",
              "Medidas da bancada",
              "Medidas dos eletros",
              "Revestimentos definidos",
              "Pedra definida",
              "Piso definido",
              "Esquadrias instaladas",
              "Obra pronta para medição",
              "Fotos/vídeos do local"
            ]
          }
        ]
      },
      {
        "id": "area_gourmet_sec_20",
        "titulo": "Perguntas finais de encantamento",
        "perguntasDestaque": [
          {
            "tipo": "experiencia",
            "rotulo": "Perguntas finais de encantamento",
            "pergunta": "O que faria você olhar para essa área pronta e pensar: “ficou exatamente como eu sonhei”?",
            "secao": "Perguntas finais de encantamento"
          },
          {
            "tipo": "experiencia",
            "rotulo": "Perguntas finais de encantamento",
            "pergunta": "Qual momento você imagina vivendo nesse espaço?",
            "secao": "Perguntas finais de encantamento"
          },
          {
            "tipo": "experiencia",
            "rotulo": "Perguntas finais de encantamento",
            "pergunta": "Quem você imagina recebendo aqui?",
            "secao": "Perguntas finais de encantamento"
          },
          {
            "tipo": "experiencia",
            "rotulo": "Perguntas finais de encantamento",
            "pergunta": "O que não pode faltar de jeito nenhum?",
            "secao": "Perguntas finais de encantamento"
          },
          {
            "tipo": "experiencia",
            "rotulo": "Perguntas finais de encantamento",
            "pergunta": "O que você absolutamente não gosta?",
            "secao": "Perguntas finais de encantamento"
          },
          {
            "tipo": "experiencia",
            "rotulo": "Perguntas finais de encantamento",
            "pergunta": "Existe algum detalhe afetivo que gostaria de trazer para o ambiente?",
            "secao": "Perguntas finais de encantamento"
          },
          {
            "tipo": "experiencia",
            "rotulo": "Perguntas finais de encantamento",
            "pergunta": "Esse espaço precisa representar mais lazer, status, família ou praticidade?",
            "secao": "Perguntas finais de encantamento"
          }
        ],
        "itens": [
          "O que faria você olhar para essa área pronta e pensar: “ficou exatamente como eu sonhei”?",
          "Qual momento você imagina vivendo nesse espaço?",
          "Quem você imagina recebendo aqui?",
          "O que não pode faltar de jeito nenhum?",
          "O que você absolutamente não gosta?",
          "Existe algum detalhe afetivo que gostaria de trazer para o ambiente?",
          "Esse espaço precisa representar mais lazer, status, família ou praticidade?"
        ],
        "conteudoLinhas": [
          "   O que faria você olhar para essa área pronta e pensar: “ficou exatamente como",
          "   Qual momento você imagina vivendo nesse espaço?",
          "   Quem você imagina recebendo aqui?",
          "   O que não pode faltar de jeito nenhum?",
          "   O que você absolutamente não gosta?",
          "   Existe algum detalhe afetivo que gostaria de trazer para o ambiente?",
          "   Esse espaço precisa representar mais lazer, status, família ou praticidade?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "O que faria você olhar para essa área pronta e pensar: “ficou exatamente como eu sonhei”?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Qual momento você imagina vivendo nesse espaço?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Quem você imagina recebendo aqui?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "O que não pode faltar de jeito nenhum?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "O que você absolutamente não gosta?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Existe algum detalhe afetivo que gostaria de trazer para o ambiente?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Esse espaço precisa representar mais lazer, status, família ou praticidade?"
            ]
          }
        ]
      },
      {
        "id": "area_gourmet_sec_21",
        "titulo": "Resumo para o projetista",
        "perguntasDestaque": [],
        "itens": [],
        "conteudoLinhas": [
          "Sensação desejada:",
          "Uso principal:",
          "Perfil do cliente:",
          "Quem decide:",
          "Quem paga:",
          "Quem influencia:",
          "Prioridade do projeto:",
          "Itens obrigatórios:",
          "Itens desejáveis:",
          "Riscos percebidos:",
          "Nível de investimento:",
          "Prazo esperado:",
          "Estilo visual:",
          "Pontos de atenção técnica:"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Sensação desejada:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Uso principal:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Perfil do cliente:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Quem decide:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Quem paga:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Quem influencia:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Prioridade do projeto:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Itens obrigatórios:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Itens desejáveis:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Riscos percebidos:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Nível de investimento:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Prazo esperado:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Estilo visual:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Pontos de atenção técnica:",
            "itens": []
          }
        ]
      }
    ],
    "perguntasEstrategicas": [
      {
        "tipo": "estrategica",
        "rotulo": "Objetivo da área gourmet",
        "pergunta": "Qual é o principal papel desse ambiente?",
        "secao": "Objetivo da área gourmet"
      },
      {
        "tipo": "emocional",
        "rotulo": "Pergunta emocional:",
        "pergunta": "Quando você imagina essa área pronta, qual sensação gostaria de ter?",
        "secao": "Objetivo da área gourmet"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Perfil de uso",
        "pergunta": "Com que frequência a área gourmet será usada?",
        "secao": "Perfil de uso"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Perfil de uso",
        "pergunta": "Quase sempre para receber convidados Quantas pessoas normalmente usam o ambiente?",
        "secao": "Perfil de uso"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Estilo de receber",
        "pergunta": "Como o cliente gosta de receber?",
        "secao": "Estilo de receber"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Você quer que a área gourmet seja mais “casa de família” ou mais “ambiente de revista”?",
        "secao": "Estilo de receber"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Rotina gastronômica",
        "pergunta": "O que será preparado com mais frequência?",
        "secao": "Rotina gastronômica"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Rotina gastronômica",
        "pergunta": "Quem normalmente prepara?",
        "secao": "Rotina gastronômica"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Armazenamento necessário",
        "pergunta": "O que precisa ser guardado na área gourmet?",
        "secao": "Armazenamento necessário"
      },
      {
        "tipo": "pratica",
        "rotulo": "Pergunta prática:",
        "pergunta": "Você quer que tudo fique escondido ou gosta de alguns itens expostos como decoração?",
        "secao": "Armazenamento necessário"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Fluxo e circulação",
        "pergunta": "Por onde entram os convidados?",
        "secao": "Fluxo e circulação"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Fluxo e circulação",
        "pergunta": "Onde fica a piscina?",
        "secao": "Fluxo e circulação"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Fluxo e circulação",
        "pergunta": "Onde fica a cozinha principal?",
        "secao": "Fluxo e circulação"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Fluxo e circulação",
        "pergunta": "Onde fica o lavabo/banheiro?",
        "secao": "Fluxo e circulação"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Fluxo e circulação",
        "pergunta": "Há acesso de serviço?",
        "secao": "Fluxo e circulação"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Fluxo e circulação",
        "pergunta": "Há portas de correr?",
        "secao": "Fluxo e circulação"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Fluxo e circulação",
        "pergunta": "Há integração com sala?",
        "secao": "Fluxo e circulação"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Fluxo e circulação",
        "pergunta": "Há área externa aberta?",
        "secao": "Fluxo e circulação"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Fluxo e circulação",
        "pergunta": "Há incidência de sol, chuva ou vento?",
        "secao": "Fluxo e circulação"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Fluxo e circulação",
        "pergunta": "A churrasqueira solta fumaça para qual direção?",
        "secao": "Fluxo e circulação"
      },
      {
        "tipo": "essencial",
        "rotulo": "Pergunta essencial:",
        "pergunta": "Em dias de festa, onde as pessoas naturalmente ficam concentradas?",
        "secao": "Fluxo e circulação"
      },
      {
        "tipo": "emocional",
        "rotulo": "Pergunta emocional:",
        "pergunta": "Você quer que esse ambiente impressione logo ao entrar ou que ele seja mais discreto e acolhedor?",
        "secao": "Estilo visual desejado"
      },
      {
        "tipo": "geral",
        "rotulo": "Perguntar:",
        "pergunta": "Perguntar:",
        "secao": "Nível de manutenção desejado"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Nível de manutenção desejado",
        "pergunta": "Tem empregada/doméstica?",
        "secao": "Nível de manutenção desejado"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Nível de manutenção desejado",
        "pergunta": "Quem limpa esse ambiente?",
        "secao": "Nível de manutenção desejado"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Nível de manutenção desejado",
        "pergunta": "Com que frequência?",
        "secao": "Nível de manutenção desejado"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Nível de manutenção desejado",
        "pergunta": "Há criança pequena?",
        "secao": "Nível de manutenção desejado"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Nível de manutenção desejado",
        "pergunta": "O ambiente pega poeira, sol ou chuva?",
        "secao": "Nível de manutenção desejado"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Crianças, pets e segurança",
        "pergunta": "Há crianças usando o espaço?",
        "secao": "Crianças, pets e segurança"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Crianças, pets e segurança",
        "pergunta": "Evitar objetos decorativos frágeis Há pets?",
        "secao": "Crianças, pets e segurança"
      },
      {
        "tipo": "experiencia",
        "rotulo": "Pergunta de experiência:",
        "pergunta": "Esse espaço será mais para conversa, gastronomia, música, TV/jogos ou festas?",
        "secao": "Tecnologia e entretenimento"
      },
      {
        "tipo": "geral",
        "rotulo": "Perguntar:",
        "pergunta": "Perguntar:",
        "secao": "Iluminação"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Iluminação",
        "pergunta": "Usa mais de dia ou à noite?",
        "secao": "Iluminação"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Iluminação",
        "pergunta": "Quer clima de restaurante/bar?",
        "secao": "Iluminação"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Iluminação",
        "pergunta": "Quer iluminação para fotos e redes sociais?",
        "secao": "Iluminação"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Pontos de dor e experiências anteriores",
        "pergunta": "O cliente já teve área gourmet antes?",
        "secao": "Pontos de dor e experiências anteriores"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Concorrentes e referências",
        "pergunta": "Já orçou com outra empresa?",
        "secao": "Concorrentes e referências"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Concorrentes e referências",
        "pergunta": "O que gostou nas outras propostas?",
        "secao": "Concorrentes e referências"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Concorrentes e referências",
        "pergunta": "O que exatamente você gosta nessa imagem?",
        "secao": "Concorrentes e referências"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Concorrentes e referências",
        "pergunta": "Material, cor, iluminação, sensação, layout ou estilo?",
        "secao": "Concorrentes e referências"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Investimento e expectativa",
        "pergunta": "Existe uma previsão de investimento?",
        "secao": "Investimento e expectativa"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Pergunta estratégica:",
        "pergunta": "Se tivermos que escolher, o que é mais importante: estética, funcionalidade, prazo ou investimento?",
        "secao": "Investimento e expectativa"
      },
      {
        "tipo": "experiencia",
        "rotulo": "Perguntas finais de encantamento",
        "pergunta": "O que faria você olhar para essa área pronta e pensar: “ficou exatamente como eu sonhei”?",
        "secao": "Perguntas finais de encantamento"
      },
      {
        "tipo": "experiencia",
        "rotulo": "Perguntas finais de encantamento",
        "pergunta": "Qual momento você imagina vivendo nesse espaço?",
        "secao": "Perguntas finais de encantamento"
      },
      {
        "tipo": "experiencia",
        "rotulo": "Perguntas finais de encantamento",
        "pergunta": "Quem você imagina recebendo aqui?",
        "secao": "Perguntas finais de encantamento"
      },
      {
        "tipo": "experiencia",
        "rotulo": "Perguntas finais de encantamento",
        "pergunta": "O que não pode faltar de jeito nenhum?",
        "secao": "Perguntas finais de encantamento"
      },
      {
        "tipo": "experiencia",
        "rotulo": "Perguntas finais de encantamento",
        "pergunta": "O que você absolutamente não gosta?",
        "secao": "Perguntas finais de encantamento"
      },
      {
        "tipo": "experiencia",
        "rotulo": "Perguntas finais de encantamento",
        "pergunta": "Existe algum detalhe afetivo que gostaria de trazer para o ambiente?",
        "secao": "Perguntas finais de encantamento"
      },
      {
        "tipo": "experiencia",
        "rotulo": "Perguntas finais de encantamento",
        "pergunta": "Esse espaço precisa representar mais lazer, status, família ou praticidade?",
        "secao": "Perguntas finais de encantamento"
      }
    ],
    "topicosChecagemTecnica": [
      "[Equipamentos previstos] Churrasqueira a carvão",
      "[Equipamentos previstos] Churrasqueira a gás",
      "[Equipamentos previstos] Churrasqueira elétrica",
      "[Equipamentos previstos] Parrilla",
      "[Equipamentos previstos] Forno de pizza",
      "[Equipamentos previstos] Cooktop",
      "[Equipamentos previstos] Fogão",
      "[Equipamentos previstos] Coifa/exaustor",
      "[Equipamentos previstos] Chopeira",
      "[Equipamentos previstos] Cervejeira",
      "[Equipamentos previstos] Adega",
      "[Equipamentos previstos] Frigobar",
      "[Equipamentos previstos] Geladeira",
      "[Equipamentos previstos] Freezer",
      "[Equipamentos previstos] Máquina de gelo",
      "[Equipamentos previstos] Lava-louças",
      "[Equipamentos previstos] Cuba simples",
      "[Equipamentos previstos] Cuba dupla",
      "[Equipamentos previstos] Triturador",
      "[Equipamentos previstos] Micro-ondas",
      "[Equipamentos previstos] Forno elétrico",
      "[Equipamentos previstos] Cafeteira",
      "[Equipamentos previstos] Air fryer",
      "[Equipamentos previstos] Liquidificador",
      "[Equipamentos previstos] TV",
      "[Equipamentos previstos] Som",
      "[Equipamentos previstos] Automação",
      "[Equipamentos previstos] Climatização",
      "Fluxo e circulação",
      "[Fluxo e circulação] Por onde entram os convidados?",
      "[Fluxo e circulação] Onde fica a piscina?",
      "[Fluxo e circulação] Onde fica a cozinha principal?",
      "[Fluxo e circulação] Onde fica o lavabo/banheiro?",
      "[Fluxo e circulação] Há acesso de serviço?",
      "[Fluxo e circulação] Há portas de correr?",
      "[Fluxo e circulação] Há integração com sala?",
      "[Fluxo e circulação] Há área externa aberta?",
      "[Fluxo e circulação] Há incidência de sol, chuva ou vento?",
      "[Fluxo e circulação] A churrasqueira solta fumaça para qual direção?",
      "Crianças, pets e segurança",
      "[Crianças, pets e segurança] Sim",
      "[Crianças, pets e segurança] Não",
      "[Crianças, pets e segurança] Futuramente",
      "[Crianças, pets e segurança] Cantos arredondados",
      "[Crianças, pets e segurança] Gavetas com trava",
      "[Crianças, pets e segurança] Altura segura para bebidas",
      "[Crianças, pets e segurança] Distância da churrasqueira",
      "[Crianças, pets e segurança] Espaço para circulação",
      "[Crianças, pets e segurança] Materiais resistentes",
      "[Crianças, pets e segurança] Evitar portas de vidro baixas",
      "[Crianças, pets e segurança] Evitar objetos decorativos frágeis Há pets?",
      "[Crianças, pets e segurança] Cachorro",
      "[Crianças, pets e segurança] Gato",
      "[Crianças, pets e segurança] Não",
      "[Crianças, pets e segurança] Espaço para pote de água/ração",
      "[Crianças, pets e segurança] Armário para itens do pet",
      "[Crianças, pets e segurança] Material resistente a riscos",
      "[Crianças, pets e segurança] Área de circulação livre",
      "Checklist técnico inicial",
      "[Checklist técnico inicial] Planta baixa",
      "[Checklist técnico inicial] Projeto arquitetônico",
      "[Checklist técnico inicial] Projeto de interiores",
      "[Checklist técnico inicial] Pontos hidráulicos",
      "[Checklist técnico inicial] Pontos elétricos",
      "[Checklist técnico inicial] Pontos de gás",
      "[Checklist técnico inicial] Ponto de exaustão",
      "[Checklist técnico inicial] Pé-direito",
      "[Checklist técnico inicial] Medidas da churrasqueira",
      "[Checklist técnico inicial] Medidas da bancada",
      "[Checklist técnico inicial] Medidas dos eletros",
      "[Checklist técnico inicial] Revestimentos definidos",
      "[Checklist técnico inicial] Pedra definida",
      "[Checklist técnico inicial] Piso definido",
      "[Checklist técnico inicial] Esquadrias instaladas",
      "[Checklist técnico inicial] Obra pronta para medição",
      "[Checklist técnico inicial] Fotos/vídeos do local",
      "Resumo para o projetista"
    ]
  },
  "banheiro_suite_master": {
    "slug": "banheiro_suite_master",
    "titulo": "Banheiro Suíte Master",
    "subtitulo": "Uso compartilhado do casal, cubas duplas, espelhos, maquiagem e spa",
    "arquivoPdfOriginal": "BRIEFING BANHEIRO SUITE MASTER.pdf",
    "secoes": [
      {
        "id": "banheiro_suite_master_sec_1",
        "titulo": "2. Objetivo do ambiente",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "2. Objetivo do ambiente",
            "pergunta": "Qual o principal papel do banheiro?",
            "secao": "2. Objetivo do ambiente"
          },
          {
            "tipo": "emocional",
            "rotulo": "Pergunta emocional:",
            "pergunta": "O que você quer sentir ao usar esse banheiro?",
            "secao": "2. Objetivo do ambiente"
          }
        ],
        "itens": [
          "Uso funcional do dia a dia",
          "Espaço de relaxamento",
          "Extensão da suíte (mais sofisticado)",
          "Ambiente de cuidado pessoal",
          "Estilo “hotel”",
          "Conforto",
          "Relaxamento",
          "Praticidade",
          "Sofisticação",
          "Organização"
        ],
        "conteudoLinhas": [
          "Qual o principal papel do banheiro?",
          "   Uso funcional do dia a dia",
          "   Espaço de relaxamento",
          "   Extensão da suíte (mais sofisticado)",
          "   Ambiente de cuidado pessoal",
          "   Estilo “hotel”",
          "[Pergunta emocional:] O que você quer sentir ao usar esse banheiro?",
          "   Conforto",
          "   Relaxamento",
          "   Praticidade",
          "   Sofisticação",
          "   Organização"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Qual o principal papel do banheiro?",
            "itens": [
              "Uso funcional do dia a dia",
              "Espaço de relaxamento",
              "Extensão da suíte (mais sofisticado)",
              "Ambiente de cuidado pessoal",
              "Estilo “hotel”"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta emocional:",
            "texto": "O que você quer sentir ao usar esse banheiro?",
            "tipoPergunta": "emocional",
            "itens": [
              "Conforto",
              "Relaxamento",
              "Praticidade",
              "Sofisticação",
              "Organização"
            ]
          }
        ]
      },
      {
        "id": "banheiro_suite_master_sec_2",
        "titulo": "3. Uso do casal (CRÍTICO)",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "3. Uso do casal (CRÍTICO)",
            "pergunta": "Horários diferentes?",
            "secao": "3. Uso do casal (CRÍTICO)"
          },
          {
            "tipo": "estrategica",
            "rotulo": "3. Uso do casal (CRÍTICO)",
            "pergunta": "Rotinas conflitantes?",
            "secao": "3. Uso do casal (CRÍTICO)"
          },
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Vocês usam o banheiro ao mesmo tempo com frequência?",
            "secao": "3. Uso do casal (CRÍTICO)"
          }
        ],
        "itens": [
          "Uso simultâneo?",
          "Horários diferentes?",
          "Rotinas conflitantes?"
        ],
        "conteudoLinhas": [
          "   Uso simultâneo?",
          "   Horários diferentes?",
          "   Rotinas conflitantes?",
          "[Pergunta-chave:] Vocês usam o banheiro ao mesmo tempo com frequência?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Uso simultâneo?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Horários diferentes?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Rotinas conflitantes?"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Vocês usam o banheiro ao mesmo tempo com frequência?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "banheiro_suite_master_sec_3",
        "titulo": "4. Bancada",
        "perguntasDestaque": [],
        "itens": [
          "Cuba:",
          "Simples",
          "Dupla",
          "Espaço de apoio:",
          "Muito importante",
          "Médio",
          "Pouco relevante",
          "Perfumes",
          "Escovas",
          "Maquiagem",
          "Itens de barbear",
          "Decoração"
        ],
        "conteudoLinhas": [
          "   Cuba:",
          "o Simples",
          "o Dupla",
          "   Espaço de apoio:",
          "o Muito importante",
          "o Médio",
          "o Pouco relevante",
          "Itens na bancada:",
          "   Perfumes",
          "   Escovas",
          "   Maquiagem",
          "   Itens de barbear",
          "   Decoração"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Cuba:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Simples"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Dupla"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espaço de apoio:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Muito importante"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Médio"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Pouco relevante"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Itens na bancada:",
            "itens": [
              "Perfumes",
              "Escovas",
              "Maquiagem",
              "Itens de barbear",
              "Decoração"
            ]
          }
        ]
      },
      {
        "id": "banheiro_suite_master_sec_4",
        "titulo": "5. Armazenamento",
        "perguntasDestaque": [],
        "itens": [
          "Produtos de higiene",
          "Maquiagem",
          "Barbear",
          "Remédios",
          "Secador / chapinha",
          "Toalhas",
          "Tudo fechado",
          "Misto",
          "Parte exposta"
        ],
        "conteudoLinhas": [
          "Necessidade para:",
          "   Produtos de higiene",
          "   Maquiagem",
          "   Barbear",
          "   Remédios",
          "   Secador / chapinha",
          "   Toalhas",
          "Preferência:",
          "   Tudo fechado",
          "   Misto",
          "   Parte exposta"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Necessidade para:",
            "itens": [
              "Produtos de higiene",
              "Maquiagem",
              "Barbear",
              "Remédios",
              "Secador / chapinha",
              "Toalhas"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Preferência:",
            "itens": [
              "Tudo fechado",
              "Misto",
              "Parte exposta"
            ]
          }
        ]
      },
      {
        "id": "banheiro_suite_master_sec_5",
        "titulo": "6. Espelhos",
        "perguntasDestaque": [],
        "itens": [
          "Único",
          "Dois espelhos",
          "Espelho grande contínuo",
          "Espelho com iluminação",
          "Espelho com aumento"
        ],
        "conteudoLinhas": [
          "   Único",
          "   Dois espelhos",
          "   Espelho grande contínuo",
          "   Espelho com iluminação",
          "   Espelho com aumento"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Único"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Dois espelhos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espelho grande contínuo"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espelho com iluminação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espelho com aumento"
            ]
          }
        ]
      },
      {
        "id": "banheiro_suite_master_sec_6",
        "titulo": "7. Iluminação (CRÍTICO)",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Você usa o banheiro mais para rotina rápida ou para cuidado mais detalhado?",
            "secao": "7. Iluminação (CRÍTICO)"
          }
        ],
        "itens": [
          "Luz geral",
          "Luz de apoio no espelho",
          "Luz indireta",
          "Luz quente (aconchego)",
          "Luz neutra (uso funcional)"
        ],
        "conteudoLinhas": [
          "   Luz geral",
          "   Luz de apoio no espelho",
          "   Luz indireta",
          "   Luz quente (aconchego)",
          "   Luz neutra (uso funcional)",
          "[Pergunta-chave:] Você usa o banheiro mais para rotina rápida ou para cuidado mais detalhado?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Luz geral"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz de apoio no espelho"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz indireta"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz quente (aconchego)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz neutra (uso funcional)"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Você usa o banheiro mais para rotina rápida ou para cuidado mais detalhado?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "banheiro_suite_master_sec_7",
        "titulo": "8. Área de banho",
        "perguntasDestaque": [
          {
            "tipo": "geral",
            "rotulo": "Pergunta:",
            "pergunta": "O banho é mais rápido ou um momento de relaxamento?",
            "secao": "8. Área de banho"
          }
        ],
        "itens": [
          "Chuveiro simples",
          "Ducha dupla",
          "Box amplo",
          "Nichos para shampoo",
          "Banco no box"
        ],
        "conteudoLinhas": [
          "   Chuveiro simples",
          "   Ducha dupla",
          "   Box amplo",
          "   Nichos para shampoo",
          "   Banco no box",
          "[Pergunta:] O banho é mais rápido ou um momento de relaxamento?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Chuveiro simples"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ducha dupla"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Box amplo"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Nichos para shampoo"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Banco no box"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta:",
            "texto": "O banho é mais rápido ou um momento de relaxamento?",
            "tipoPergunta": "geral",
            "itens": []
          }
        ]
      },
      {
        "id": "banheiro_suite_master_sec_8",
        "titulo": "9. Vaso sanitário",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "9. Vaso sanitário",
            "pergunta": "Deseja privacidade?",
            "secao": "9. Vaso sanitário"
          },
          {
            "tipo": "estrategica",
            "rotulo": "9. Vaso sanitário",
            "pergunta": "Espaço reservado (porta / divisória)?",
            "secao": "9. Vaso sanitário"
          }
        ],
        "itens": [
          "Área separada?",
          "Deseja privacidade?",
          "Espaço reservado (porta / divisória)?"
        ],
        "conteudoLinhas": [
          "   Área separada?",
          "   Deseja privacidade?",
          "   Espaço reservado (porta / divisória)?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Área separada?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Deseja privacidade?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espaço reservado (porta / divisória)?"
            ]
          }
        ]
      },
      {
        "id": "banheiro_suite_master_sec_9",
        "titulo": "10. Uso individual (perfil)",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "10. Uso individual (perfil)",
            "pergunta": "Usa muitos produtos?",
            "secao": "10. Uso individual (perfil)"
          },
          {
            "tipo": "estrategica",
            "rotulo": "10. Uso individual (perfil)",
            "pergunta": "Usa itens de barbear?",
            "secao": "10. Uso individual (perfil)"
          },
          {
            "tipo": "estrategica",
            "rotulo": "10. Uso individual (perfil)",
            "pergunta": "Usa poucos ou muitos produtos?",
            "secao": "10. Uso individual (perfil)"
          }
        ],
        "itens": [
          "Usa maquiagem?",
          "Usa muitos produtos?",
          "Organização:",
          "Usa itens de barbear?",
          "Usa poucos ou muitos produtos?"
        ],
        "conteudoLinhas": [
          "Pessoa 1:",
          "   Usa maquiagem?",
          "   Usa muitos produtos?",
          "   Organização:",
          "Pessoa 2:",
          "   Usa itens de barbear?",
          "   Usa poucos ou muitos produtos?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Pessoa 1:",
            "itens": [
              "Usa maquiagem?",
              "Usa muitos produtos?",
              "Organização:"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Pessoa 2:",
            "itens": [
              "Usa itens de barbear?",
              "Usa poucos ou muitos produtos?"
            ]
          }
        ]
      },
      {
        "id": "banheiro_suite_master_sec_10",
        "titulo": "11. Estética",
        "perguntasDestaque": [
          {
            "tipo": "emocional",
            "rotulo": "Pergunta emocional:",
            "pergunta": "Você quer um banheiro mais funcional ou mais “experiência de spa”?",
            "secao": "11. Estética"
          }
        ],
        "itens": [
          "Moderno",
          "Sofisticado",
          "Minimalista",
          "Natural",
          "Estilo hotel",
          "Madeira",
          "Pedra",
          "Laca",
          "Vidro",
          "Espelho"
        ],
        "conteudoLinhas": [
          "   Moderno",
          "   Sofisticado",
          "   Minimalista",
          "   Natural",
          "   Estilo hotel",
          "Materiais:",
          "   Madeira",
          "   Pedra",
          "   Laca",
          "   Vidro",
          "   Espelho",
          "[Pergunta emocional:] Você quer um banheiro mais funcional ou mais “experiência de spa”?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Moderno"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Sofisticado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Minimalista"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Natural"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Estilo hotel"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Materiais:",
            "itens": [
              "Madeira",
              "Pedra",
              "Laca",
              "Vidro",
              "Espelho"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta emocional:",
            "texto": "Você quer um banheiro mais funcional ou mais “experiência de spa”?",
            "tipoPergunta": "emocional",
            "itens": []
          }
        ]
      },
      {
        "id": "banheiro_suite_master_sec_11",
        "titulo": "12. Manutenção (CRÍTICO)",
        "perguntasDestaque": [],
        "itens": [
          "Fácil limpeza",
          "Resistência à umidade",
          "Evitar marcas de água",
          "Pouca manutenção"
        ],
        "conteudoLinhas": [
          "   Fácil limpeza",
          "   Resistência à umidade",
          "   Evitar marcas de água",
          "   Pouca manutenção"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Fácil limpeza"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Resistência à umidade"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Evitar marcas de água"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Pouca manutenção"
            ]
          }
        ]
      },
      {
        "id": "banheiro_suite_master_sec_12",
        "titulo": "13. Pontos de dor",
        "perguntasDestaque": [],
        "itens": [
          "Falta de espaço",
          "Bagunça na bancada",
          "Iluminação ruim",
          "Falta de armazenamento",
          "Umidade",
          "Difícil limpeza"
        ],
        "conteudoLinhas": [
          "   Falta de espaço",
          "   Bagunça na bancada",
          "   Iluminação ruim",
          "   Falta de armazenamento",
          "   Umidade",
          "   Difícil limpeza"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Falta de espaço"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Bagunça na bancada"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Iluminação ruim"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Falta de armazenamento"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Umidade"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Difícil limpeza"
            ]
          }
        ]
      },
      {
        "id": "banheiro_suite_master_sec_13",
        "titulo": "14. Toalhas e apoio",
        "perguntasDestaque": [],
        "itens": [
          "Porta-toalha",
          "Aquecedor de toalha",
          "Armário para toalhas",
          "Nichos"
        ],
        "conteudoLinhas": [
          "   Porta-toalha",
          "   Aquecedor de toalha",
          "   Armário para toalhas",
          "   Nichos"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Porta-toalha"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Aquecedor de toalha"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Armário para toalhas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Nichos"
            ]
          }
        ]
      },
      {
        "id": "banheiro_suite_master_sec_14",
        "titulo": "15. Tomadas e tecnologia",
        "perguntasDestaque": [],
        "itens": [
          "Secador",
          "Chapinha",
          "Barbeador",
          "Tomadas internas",
          "USB"
        ],
        "conteudoLinhas": [
          "   Secador",
          "   Chapinha",
          "   Barbeador",
          "   Tomadas internas",
          "   USB"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Secador"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Chapinha"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Barbeador"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tomadas internas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "USB"
            ]
          }
        ]
      },
      {
        "id": "banheiro_suite_master_sec_15",
        "titulo": "16. Ventilação",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "16. Ventilação",
            "pergunta": "Problemas de umidade?",
            "secao": "16. Ventilação"
          }
        ],
        "itens": [
          "Natural",
          "Exaustor",
          "Problemas de umidade?"
        ],
        "conteudoLinhas": [
          "   Natural",
          "   Exaustor",
          "   Problemas de umidade?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Natural"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Exaustor"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Problemas de umidade?"
            ]
          }
        ]
      },
      {
        "id": "banheiro_suite_master_sec_16",
        "titulo": "17. Integração com suíte/closet",
        "perguntasDestaque": [],
        "itens": [
          "Total",
          "Parcial",
          "Separado"
        ],
        "conteudoLinhas": [
          "   Total",
          "   Parcial",
          "   Separado"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Total"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Parcial"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Separado"
            ]
          }
        ]
      },
      {
        "id": "banheiro_suite_master_sec_17",
        "titulo": "18. Perguntas de aprofundamento",
        "perguntasDestaque": [
          {
            "tipo": "profunda",
            "rotulo": "18. Perguntas de aprofundamento",
            "pergunta": "O que mais te incomoda no seu banheiro atual?",
            "secao": "18. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "18. Perguntas de aprofundamento",
            "pergunta": "O que faria seu dia começar melhor nesse espaço?",
            "secao": "18. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "18. Perguntas de aprofundamento",
            "pergunta": "Você prefere praticidade ou conforto?",
            "secao": "18. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "18. Perguntas de aprofundamento",
            "pergunta": "Existe algum banheiro que você viu e gostou?",
            "secao": "18. Perguntas de aprofundamento"
          }
        ],
        "itens": [
          "O que mais te incomoda no seu banheiro atual?",
          "O que faria seu dia começar melhor nesse espaço?",
          "Você prefere praticidade ou conforto?",
          "Existe algum banheiro que você viu e gostou?"
        ],
        "conteudoLinhas": [
          "   O que mais te incomoda no seu banheiro atual?",
          "   O que faria seu dia começar melhor nesse espaço?",
          "   Você prefere praticidade ou conforto?",
          "   Existe algum banheiro que você viu e gostou?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "O que mais te incomoda no seu banheiro atual?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "O que faria seu dia começar melhor nesse espaço?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você prefere praticidade ou conforto?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Existe algum banheiro que você viu e gostou?"
            ]
          }
        ]
      },
      {
        "id": "banheiro_suite_master_sec_18",
        "titulo": "19. Investimento e prioridade",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "19. Investimento e prioridade",
            "pergunta": "Já tem previsão?",
            "secao": "19. Investimento e prioridade"
          }
        ],
        "itens": [
          "Já tem previsão?",
          "Prioriza:",
          "Estética",
          "Funcionalidade",
          "Durabilidade",
          "Facilidade de limpeza"
        ],
        "conteudoLinhas": [
          "   Já tem previsão?",
          "   Prioriza:",
          "o Estética",
          "o Funcionalidade",
          "o Durabilidade",
          "o Facilidade de limpeza"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Já tem previsão?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Prioriza:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Estética"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Funcionalidade"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Durabilidade"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Facilidade de limpeza"
            ]
          }
        ]
      },
      {
        "id": "banheiro_suite_master_sec_19",
        "titulo": "20. Checklist técnico",
        "perguntasDestaque": [],
        "itens": [
          "Pontos hidráulicos definidos",
          "Posição da cuba",
          "Posição do chuveiro",
          "Espaço para armários",
          "Medidas do box",
          "Interferências"
        ],
        "conteudoLinhas": [
          "   Pontos hidráulicos definidos",
          "   Posição da cuba",
          "   Posição do chuveiro",
          "   Espaço para armários",
          "   Medidas do box",
          "   Interferências"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Pontos hidráulicos definidos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Posição da cuba"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Posição do chuveiro"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espaço para armários"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Medidas do box"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Interferências"
            ]
          }
        ]
      },
      {
        "id": "banheiro_suite_master_sec_20",
        "titulo": "21. Resumo para o projetista",
        "perguntasDestaque": [],
        "itens": [],
        "conteudoLinhas": [
          "Uso do casal:",
          "Necessidade de dupla cuba:",
          "Volume de itens:",
          "Estilo:",
          "Nível de conforto:",
          "Pontos críticos:",
          "Itens obrigatórios:"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Uso do casal:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Necessidade de dupla cuba:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Volume de itens:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Estilo:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Nível de conforto:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Pontos críticos:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Itens obrigatórios:",
            "itens": []
          }
        ]
      }
    ],
    "perguntasEstrategicas": [
      {
        "tipo": "estrategica",
        "rotulo": "2. Objetivo do ambiente",
        "pergunta": "Qual o principal papel do banheiro?",
        "secao": "2. Objetivo do ambiente"
      },
      {
        "tipo": "emocional",
        "rotulo": "Pergunta emocional:",
        "pergunta": "O que você quer sentir ao usar esse banheiro?",
        "secao": "2. Objetivo do ambiente"
      },
      {
        "tipo": "estrategica",
        "rotulo": "3. Uso do casal (CRÍTICO)",
        "pergunta": "Horários diferentes?",
        "secao": "3. Uso do casal (CRÍTICO)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "3. Uso do casal (CRÍTICO)",
        "pergunta": "Rotinas conflitantes?",
        "secao": "3. Uso do casal (CRÍTICO)"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Vocês usam o banheiro ao mesmo tempo com frequência?",
        "secao": "3. Uso do casal (CRÍTICO)"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Você usa o banheiro mais para rotina rápida ou para cuidado mais detalhado?",
        "secao": "7. Iluminação (CRÍTICO)"
      },
      {
        "tipo": "geral",
        "rotulo": "Pergunta:",
        "pergunta": "O banho é mais rápido ou um momento de relaxamento?",
        "secao": "8. Área de banho"
      },
      {
        "tipo": "estrategica",
        "rotulo": "9. Vaso sanitário",
        "pergunta": "Deseja privacidade?",
        "secao": "9. Vaso sanitário"
      },
      {
        "tipo": "estrategica",
        "rotulo": "9. Vaso sanitário",
        "pergunta": "Espaço reservado (porta / divisória)?",
        "secao": "9. Vaso sanitário"
      },
      {
        "tipo": "estrategica",
        "rotulo": "10. Uso individual (perfil)",
        "pergunta": "Usa muitos produtos?",
        "secao": "10. Uso individual (perfil)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "10. Uso individual (perfil)",
        "pergunta": "Usa itens de barbear?",
        "secao": "10. Uso individual (perfil)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "10. Uso individual (perfil)",
        "pergunta": "Usa poucos ou muitos produtos?",
        "secao": "10. Uso individual (perfil)"
      },
      {
        "tipo": "emocional",
        "rotulo": "Pergunta emocional:",
        "pergunta": "Você quer um banheiro mais funcional ou mais “experiência de spa”?",
        "secao": "11. Estética"
      },
      {
        "tipo": "estrategica",
        "rotulo": "16. Ventilação",
        "pergunta": "Problemas de umidade?",
        "secao": "16. Ventilação"
      },
      {
        "tipo": "profunda",
        "rotulo": "18. Perguntas de aprofundamento",
        "pergunta": "O que mais te incomoda no seu banheiro atual?",
        "secao": "18. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "18. Perguntas de aprofundamento",
        "pergunta": "O que faria seu dia começar melhor nesse espaço?",
        "secao": "18. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "18. Perguntas de aprofundamento",
        "pergunta": "Você prefere praticidade ou conforto?",
        "secao": "18. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "18. Perguntas de aprofundamento",
        "pergunta": "Existe algum banheiro que você viu e gostou?",
        "secao": "18. Perguntas de aprofundamento"
      },
      {
        "tipo": "estrategica",
        "rotulo": "19. Investimento e prioridade",
        "pergunta": "Já tem previsão?",
        "secao": "19. Investimento e prioridade"
      }
    ],
    "topicosChecagemTecnica": [
      "3. Uso do casal (CRÍTICO)",
      "7. Iluminação (CRÍTICO)",
      "12. Manutenção (CRÍTICO)",
      "20. Checklist técnico",
      "[20. Checklist técnico] Pontos hidráulicos definidos",
      "[20. Checklist técnico] Posição da cuba",
      "[20. Checklist técnico] Posição do chuveiro",
      "[20. Checklist técnico] Espaço para armários",
      "[20. Checklist técnico] Medidas do box",
      "[20. Checklist técnico] Interferências",
      "21. Resumo para o projetista"
    ]
  },
  "banheiros": {
    "slug": "banheiros",
    "titulo": "Banheiros (Social / Hóspedes)",
    "subtitulo": "Praticidade, armazenamento de higiene, bancada, área de banho e nichos",
    "arquivoPdfOriginal": "BRIEFING BANHEIROS.pdf",
    "secoes": [
      {
        "id": "banheiros_sec_1",
        "titulo": "2. Objetivo do ambiente",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "2. Objetivo do ambiente",
            "pergunta": "Qual o principal papel deste banheiro?",
            "secao": "2. Objetivo do ambiente"
          },
          {
            "tipo": "emocional",
            "rotulo": "Pergunta emocional:",
            "pergunta": "O que você quer sentir ao usar esse banheiro?",
            "secao": "2. Objetivo do ambiente"
          }
        ],
        "itens": [
          "Uso diário intenso",
          "Apoio para quartos",
          "Banheiro social",
          "Banheiro de hóspedes",
          "Mais funcional ou mais sofisticado",
          "Praticidade",
          "Conforto",
          "Organização",
          "Limpeza",
          "Sofisticação"
        ],
        "conteudoLinhas": [
          "Qual o principal papel deste banheiro?",
          "   Uso diário intenso",
          "   Apoio para quartos",
          "   Banheiro social",
          "   Banheiro de hóspedes",
          "   Mais funcional ou mais sofisticado",
          "[Pergunta emocional:] O que você quer sentir ao usar esse banheiro?",
          "   Praticidade",
          "   Conforto",
          "   Organização",
          "   Limpeza",
          "   Sofisticação"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Qual o principal papel deste banheiro?",
            "itens": [
              "Uso diário intenso",
              "Apoio para quartos",
              "Banheiro social",
              "Banheiro de hóspedes",
              "Mais funcional ou mais sofisticado"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta emocional:",
            "texto": "O que você quer sentir ao usar esse banheiro?",
            "tipoPergunta": "emocional",
            "itens": [
              "Praticidade",
              "Conforto",
              "Organização",
              "Limpeza",
              "Sofisticação"
            ]
          }
        ]
      },
      {
        "id": "banheiros_sec_2",
        "titulo": "3. Perfil de uso",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "3. Perfil de uso",
            "pergunta": "Uso por visitas?",
            "secao": "3. Perfil de uso"
          }
        ],
        "itens": [
          "Quantas pessoas utilizam:",
          "Frequência:",
          "Alta",
          "Média",
          "Baixa",
          "Uso simultâneo?",
          "Uso por visitas?"
        ],
        "conteudoLinhas": [
          "   Quantas pessoas utilizam:",
          "   Frequência:",
          "o Alta",
          "o Média",
          "o Baixa",
          "   Uso simultâneo?",
          "   Uso por visitas?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Quantas pessoas utilizam:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Frequência:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Alta"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Média"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Baixa"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Uso simultâneo?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Uso por visitas?"
            ]
          }
        ]
      },
      {
        "id": "banheiros_sec_3",
        "titulo": "4. Bancada",
        "perguntasDestaque": [],
        "itens": [
          "Cuba:",
          "Simples",
          "Dupla",
          "Espaço de apoio:",
          "Muito importante",
          "Médio",
          "Pouco",
          "Escova",
          "Pasta",
          "Produtos",
          "Maquiagem",
          "Barbear"
        ],
        "conteudoLinhas": [
          "   Cuba:",
          "o Simples",
          "o Dupla",
          "   Espaço de apoio:",
          "o Muito importante",
          "o Médio",
          "o Pouco",
          "Itens usados:",
          "   Escova",
          "   Pasta",
          "   Produtos",
          "   Maquiagem",
          "   Barbear"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Cuba:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Simples"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Dupla"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espaço de apoio:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Muito importante"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Médio"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Pouco"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Itens usados:",
            "itens": [
              "Escova",
              "Pasta",
              "Produtos",
              "Maquiagem",
              "Barbear"
            ]
          }
        ]
      },
      {
        "id": "banheiros_sec_4",
        "titulo": "5. Armazenamento",
        "perguntasDestaque": [],
        "itens": [
          "Produtos de higiene",
          "Maquiagem",
          "Barbear",
          "Remédios",
          "Toalhas",
          "Secador / chapinha",
          "Tudo fechado",
          "Misto",
          "Parte exposta"
        ],
        "conteudoLinhas": [
          "Precisa guardar:",
          "   Produtos de higiene",
          "   Maquiagem",
          "   Barbear",
          "   Remédios",
          "   Toalhas",
          "   Secador / chapinha",
          "Preferência:",
          "   Tudo fechado",
          "   Misto",
          "   Parte exposta"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Precisa guardar:",
            "itens": [
              "Produtos de higiene",
              "Maquiagem",
              "Barbear",
              "Remédios",
              "Toalhas",
              "Secador / chapinha"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Preferência:",
            "itens": [
              "Tudo fechado",
              "Misto",
              "Parte exposta"
            ]
          }
        ]
      },
      {
        "id": "banheiros_sec_5",
        "titulo": "6. Espelhos",
        "perguntasDestaque": [],
        "itens": [
          "Simples",
          "Grande contínuo",
          "Iluminado",
          "Com aumento"
        ],
        "conteudoLinhas": [
          "   Simples",
          "   Grande contínuo",
          "   Iluminado",
          "   Com aumento"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Simples"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Grande contínuo"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Iluminado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Com aumento"
            ]
          }
        ]
      },
      {
        "id": "banheiros_sec_6",
        "titulo": "7. Iluminação (CRÍTICO)",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Você usa esse espaço mais para rotina rápida ou cuidados mais detalhados?",
            "secao": "7. Iluminação (CRÍTICO)"
          }
        ],
        "itens": [
          "Luz geral",
          "Luz de espelho",
          "Luz funcional",
          "Luz indireta"
        ],
        "conteudoLinhas": [
          "   Luz geral",
          "   Luz de espelho",
          "   Luz funcional",
          "   Luz indireta",
          "[Pergunta-chave:] Você usa esse espaço mais para rotina rápida ou cuidados mais detalhados?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Luz geral"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz de espelho"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz funcional"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz indireta"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Você usa esse espaço mais para rotina rápida ou cuidados mais detalhados?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "banheiros_sec_7",
        "titulo": "8. Área de banho",
        "perguntasDestaque": [
          {
            "tipo": "geral",
            "rotulo": "Pergunta:",
            "pergunta": "Banho rápido ou momento de relaxamento?",
            "secao": "8. Área de banho"
          }
        ],
        "itens": [
          "Chuveiro simples",
          "Box amplo",
          "Nichos",
          "Banco no box"
        ],
        "conteudoLinhas": [
          "   Chuveiro simples",
          "   Box amplo",
          "   Nichos",
          "   Banco no box",
          "[Pergunta:] Banho rápido ou momento de relaxamento?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Chuveiro simples"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Box amplo"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Nichos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Banco no box"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta:",
            "texto": "Banho rápido ou momento de relaxamento?",
            "tipoPergunta": "geral",
            "itens": []
          }
        ]
      },
      {
        "id": "banheiros_sec_8",
        "titulo": "9. Vaso sanitário",
        "perguntasDestaque": [],
        "itens": [
          "Espaço integrado",
          "Espaço mais reservado"
        ],
        "conteudoLinhas": [
          "   Espaço integrado",
          "   Espaço mais reservado"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Espaço integrado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espaço mais reservado"
            ]
          }
        ]
      },
      {
        "id": "banheiros_sec_9",
        "titulo": "10. Estética",
        "perguntasDestaque": [],
        "itens": [
          "Funcional",
          "Clean",
          "Sofisticado",
          "Neutro",
          "Resistentes à umidade",
          "Fáceis de limpar"
        ],
        "conteudoLinhas": [
          "   Funcional",
          "   Clean",
          "   Sofisticado",
          "   Neutro",
          "Materiais:",
          "   Resistentes à umidade",
          "   Fáceis de limpar"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Funcional"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Clean"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Sofisticado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Neutro"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Materiais:",
            "itens": [
              "Resistentes à umidade",
              "Fáceis de limpar"
            ]
          }
        ]
      },
      {
        "id": "banheiros_sec_10",
        "titulo": "11. Manutenção (CRÍTICO)",
        "perguntasDestaque": [],
        "itens": [
          "Fácil limpeza",
          "Resistência à água",
          "Evitar manchas",
          "Durabilidade"
        ],
        "conteudoLinhas": [
          "   Fácil limpeza",
          "   Resistência à água",
          "   Evitar manchas",
          "   Durabilidade"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Fácil limpeza"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Resistência à água"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Evitar manchas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Durabilidade"
            ]
          }
        ]
      },
      {
        "id": "banheiros_sec_11",
        "titulo": "12. Pontos de dor",
        "perguntasDestaque": [],
        "itens": [
          "Falta de espaço",
          "Bagunça",
          "Iluminação ruim",
          "Umidade",
          "Difícil limpeza"
        ],
        "conteudoLinhas": [
          "   Falta de espaço",
          "   Bagunça",
          "   Iluminação ruim",
          "   Umidade",
          "   Difícil limpeza"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Falta de espaço"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Bagunça"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Iluminação ruim"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Umidade"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Difícil limpeza"
            ]
          }
        ]
      },
      {
        "id": "banheiros_sec_12",
        "titulo": "13. Integração",
        "perguntasDestaque": [],
        "itens": [
          "Próximo aos quartos",
          "Próximo à área social",
          "Uso independente"
        ],
        "conteudoLinhas": [
          "   Próximo aos quartos",
          "   Próximo à área social",
          "   Uso independente"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Próximo aos quartos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Próximo à área social"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Uso independente"
            ]
          }
        ]
      },
      {
        "id": "banheiros_sec_13",
        "titulo": "14. Perguntas de aprofundamento",
        "perguntasDestaque": [
          {
            "tipo": "profunda",
            "rotulo": "14. Perguntas de aprofundamento",
            "pergunta": "O que mais te incomoda no seu banheiro atual?",
            "secao": "14. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "14. Perguntas de aprofundamento",
            "pergunta": "O que faria sua rotina mais fácil?",
            "secao": "14. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "14. Perguntas de aprofundamento",
            "pergunta": "Você prefere praticidade ou estética?",
            "secao": "14. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "14. Perguntas de aprofundamento",
            "pergunta": "Existe algum banheiro que você gostou como referência?",
            "secao": "14. Perguntas de aprofundamento"
          }
        ],
        "itens": [
          "O que mais te incomoda no seu banheiro atual?",
          "O que faria sua rotina mais fácil?",
          "Você prefere praticidade ou estética?",
          "Existe algum banheiro que você gostou como referência?"
        ],
        "conteudoLinhas": [
          "   O que mais te incomoda no seu banheiro atual?",
          "   O que faria sua rotina mais fácil?",
          "   Você prefere praticidade ou estética?",
          "   Existe algum banheiro que você gostou como referência?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "O que mais te incomoda no seu banheiro atual?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "O que faria sua rotina mais fácil?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você prefere praticidade ou estética?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Existe algum banheiro que você gostou como referência?"
            ]
          }
        ]
      },
      {
        "id": "banheiros_sec_14",
        "titulo": "15. Investimento e prioridade",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "15. Investimento e prioridade",
            "pergunta": "Já tem previsão?",
            "secao": "15. Investimento e prioridade"
          }
        ],
        "itens": [
          "Já tem previsão?",
          "Prioriza:",
          "Funcionalidade",
          "Durabilidade",
          "Estética",
          "Facilidade de limpeza"
        ],
        "conteudoLinhas": [
          "   Já tem previsão?",
          "   Prioriza:",
          "o Funcionalidade",
          "o Durabilidade",
          "o Estética",
          "o Facilidade de limpeza"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Já tem previsão?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Prioriza:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Funcionalidade"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Durabilidade"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Estética"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Facilidade de limpeza"
            ]
          }
        ]
      },
      {
        "id": "banheiros_sec_15",
        "titulo": "16. Checklist técnico",
        "perguntasDestaque": [],
        "itens": [
          "Pontos hidráulicos",
          "Pontos elétricos",
          "Medidas do box",
          "Espaço de bancada",
          "Ventilação"
        ],
        "conteudoLinhas": [
          "   Pontos hidráulicos",
          "   Pontos elétricos",
          "   Medidas do box",
          "   Espaço de bancada",
          "   Ventilação"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Pontos hidráulicos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Pontos elétricos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Medidas do box"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espaço de bancada"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ventilação"
            ]
          }
        ]
      },
      {
        "id": "banheiros_sec_16",
        "titulo": "17. Resumo para o projetista",
        "perguntasDestaque": [],
        "itens": [],
        "conteudoLinhas": [
          "Tipo de uso:",
          "Volume de uso:",
          "Itens obrigatórios:",
          "Estilo:",
          "Nível de armazenamento:",
          "Pontos críticos:"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Tipo de uso:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Volume de uso:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Itens obrigatórios:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Estilo:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Nível de armazenamento:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Pontos críticos:",
            "itens": []
          }
        ]
      }
    ],
    "perguntasEstrategicas": [
      {
        "tipo": "estrategica",
        "rotulo": "2. Objetivo do ambiente",
        "pergunta": "Qual o principal papel deste banheiro?",
        "secao": "2. Objetivo do ambiente"
      },
      {
        "tipo": "emocional",
        "rotulo": "Pergunta emocional:",
        "pergunta": "O que você quer sentir ao usar esse banheiro?",
        "secao": "2. Objetivo do ambiente"
      },
      {
        "tipo": "estrategica",
        "rotulo": "3. Perfil de uso",
        "pergunta": "Uso por visitas?",
        "secao": "3. Perfil de uso"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Você usa esse espaço mais para rotina rápida ou cuidados mais detalhados?",
        "secao": "7. Iluminação (CRÍTICO)"
      },
      {
        "tipo": "geral",
        "rotulo": "Pergunta:",
        "pergunta": "Banho rápido ou momento de relaxamento?",
        "secao": "8. Área de banho"
      },
      {
        "tipo": "profunda",
        "rotulo": "14. Perguntas de aprofundamento",
        "pergunta": "O que mais te incomoda no seu banheiro atual?",
        "secao": "14. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "14. Perguntas de aprofundamento",
        "pergunta": "O que faria sua rotina mais fácil?",
        "secao": "14. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "14. Perguntas de aprofundamento",
        "pergunta": "Você prefere praticidade ou estética?",
        "secao": "14. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "14. Perguntas de aprofundamento",
        "pergunta": "Existe algum banheiro que você gostou como referência?",
        "secao": "14. Perguntas de aprofundamento"
      },
      {
        "tipo": "estrategica",
        "rotulo": "15. Investimento e prioridade",
        "pergunta": "Já tem previsão?",
        "secao": "15. Investimento e prioridade"
      }
    ],
    "topicosChecagemTecnica": [
      "7. Iluminação (CRÍTICO)",
      "11. Manutenção (CRÍTICO)",
      "16. Checklist técnico",
      "[16. Checklist técnico] Pontos hidráulicos",
      "[16. Checklist técnico] Pontos elétricos",
      "[16. Checklist técnico] Medidas do box",
      "[16. Checklist técnico] Espaço de bancada",
      "[16. Checklist técnico] Ventilação",
      "17. Resumo para o projetista"
    ]
  },
  "closet": {
    "slug": "closet",
    "titulo": "Closet",
    "subtitulo": "Divisão de casal, proporção de cabides e dobrados, sapatos, bolsas e joias",
    "arquivoPdfOriginal": "BRIEFING CLOSET.pdf",
    "secoes": [
      {
        "id": "closet_sec_1",
        "titulo": "1. Tipo de closet",
        "perguntasDestaque": [],
        "itens": [
          "Aberto",
          "Fechado",
          "Walk-in",
          "Integrado ao quarto",
          "Independente"
        ],
        "conteudoLinhas": [
          "   Aberto",
          "   Fechado",
          "   Walk-in",
          "   Integrado ao quarto",
          "   Independente"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Aberto"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Fechado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Walk-in"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Integrado ao quarto"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Independente"
            ]
          }
        ]
      },
      {
        "id": "closet_sec_2",
        "titulo": "2. Perfil de uso",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "2. Perfil de uso",
            "pergunta": "Divisão proporcional?",
            "secao": "2. Perfil de uso"
          }
        ],
        "itens": [
          "Individual",
          "Compartilhado",
          "Divisão igual?",
          "Divisão proporcional?"
        ],
        "conteudoLinhas": [
          "Quem usa:",
          "   Individual",
          "   Compartilhado",
          "Se compartilhado:",
          "   Divisão igual?",
          "   Divisão proporcional?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Quem usa:",
            "itens": [
              "Individual",
              "Compartilhado"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Se compartilhado:",
            "itens": [
              "Divisão igual?",
              "Divisão proporcional?"
            ]
          }
        ]
      },
      {
        "id": "closet_sec_3",
        "titulo": "3. Quantidade de roupas",
        "perguntasDestaque": [],
        "itens": [
          "Camisas:",
          "Calças:",
          "Vestidos:",
          "Blazers:",
          "Sapatos:",
          "Bolsas:",
          "Acessórios:"
        ],
        "conteudoLinhas": [
          "(ESSENCIAL para não errar)",
          "Pessoa 1:",
          "   Camisas:",
          "   Calças:",
          "   Vestidos:",
          "   Blazers:",
          "   Sapatos:",
          "   Bolsas:",
          "   Acessórios:",
          "Pessoa 2:",
          "(mesma estrutura)"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "(ESSENCIAL para não errar)",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Pessoa 1:",
            "itens": [
              "Camisas:",
              "Calças:",
              "Vestidos:",
              "Blazers:",
              "Sapatos:",
              "Bolsas:",
              "Acessórios:"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Pessoa 2:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "(mesma estrutura)",
            "itens": []
          }
        ]
      },
      {
        "id": "closet_sec_4",
        "titulo": "4. Tipo de peças",
        "perguntasDestaque": [],
        "itens": [
          "Longas",
          "Curtas",
          "Delicadas",
          "Sociais",
          "Casuais",
          "Academia",
          "Festa"
        ],
        "conteudoLinhas": [
          "     Longas",
          "     Curtas",
          "     Delicadas",
          "     Sociais",
          "     Casuais",
          "     Academia",
          "     Festa"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Longas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Curtas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Delicadas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Sociais"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Casuais"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Academia"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Festa"
            ]
          }
        ]
      },
      {
        "id": "closet_sec_5",
        "titulo": "5. Organização",
        "perguntasDestaque": [],
        "itens": [
          "Extremamente organizado",
          "Moderado",
          "Bagunçado",
          "Tudo visível",
          "Tudo fechado",
          "Misto"
        ],
        "conteudoLinhas": [
          "Perfil:",
          "     Extremamente organizado",
          "     Moderado",
          "     Bagunçado",
          "Preferências:",
          "     Tudo visível",
          "     Tudo fechado",
          "     Misto"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Perfil:",
            "itens": [
              "Extremamente organizado",
              "Moderado",
              "Bagunçado"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Preferências:",
            "itens": [
              "Tudo visível",
              "Tudo fechado",
              "Misto"
            ]
          }
        ]
      },
      {
        "id": "closet_sec_6",
        "titulo": "6. Cabide vs dobrado",
        "perguntasDestaque": [],
        "itens": [
          "Prefere pendurar tudo",
          "Prefere dobrar",
          "Misto"
        ],
        "conteudoLinhas": [
          "     Prefere pendurar tudo",
          "     Prefere dobrar",
          "     Misto"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Prefere pendurar tudo"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Prefere dobrar"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Misto"
            ]
          }
        ]
      },
      {
        "id": "closet_sec_7",
        "titulo": "7. Sapatos",
        "perguntasDestaque": [],
        "itens": [
          "Quantidade:",
          "Tipo:",
          "Salto",
          "Tênis",
          "Botas",
          "Guarda:",
          "Exposto",
          "Fechado"
        ],
        "conteudoLinhas": [
          "     Quantidade:",
          "     Tipo:",
          "o Salto",
          "o Tênis",
          "o Botas",
          "     Guarda:",
          "o Exposto",
          "o Fechado"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Quantidade:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tipo:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Salto"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tênis"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Botas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Guarda:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Exposto"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Fechado"
            ]
          }
        ]
      },
      {
        "id": "closet_sec_8",
        "titulo": "8. Acessórios",
        "perguntasDestaque": [],
        "itens": [
          "Relógios",
          "Joias",
          "Cintos",
          "Óculos",
          "Gavetas organizadoras",
          "Nichos",
          "Bandejas"
        ],
        "conteudoLinhas": [
          "   Relógios",
          "   Joias",
          "   Cintos",
          "   Óculos",
          "Necessidade de:",
          "   Gavetas organizadoras",
          "   Nichos",
          "   Bandejas"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Relógios"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Joias"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cintos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Óculos"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Necessidade de:",
            "itens": [
              "Gavetas organizadoras",
              "Nichos",
              "Bandejas"
            ]
          }
        ]
      },
      {
        "id": "closet_sec_9",
        "titulo": "9. Espelhos",
        "perguntasDestaque": [],
        "itens": [
          "Corpo inteiro",
          "Interno",
          "Externo",
          "Iluminado"
        ],
        "conteudoLinhas": [
          "   Corpo inteiro",
          "   Interno",
          "   Externo",
          "   Iluminado"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Corpo inteiro"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Interno"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Externo"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Iluminado"
            ]
          }
        ]
      },
      {
        "id": "closet_sec_10",
        "titulo": "10. Iluminação",
        "perguntasDestaque": [],
        "itens": [
          "Geral",
          "Interna nos armários",
          "Sensor",
          "Luz quente",
          "Destaque"
        ],
        "conteudoLinhas": [
          "   Geral",
          "   Interna nos armários",
          "   Sensor",
          "   Luz quente",
          "   Destaque"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Geral"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Interna nos armários"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Sensor"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz quente"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Destaque"
            ]
          }
        ]
      },
      {
        "id": "closet_sec_11",
        "titulo": "11. Itens adicionais",
        "perguntasDestaque": [],
        "itens": [
          "Penteadeira",
          "Banco/puff",
          "Ilha central",
          "Gaveteiro central",
          "TV",
          "Tomadas",
          "Cofre"
        ],
        "conteudoLinhas": [
          "   Penteadeira",
          "   Banco/puff",
          "   Ilha central",
          "   Gaveteiro central",
          "   TV",
          "   Tomadas",
          "   Cofre"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Penteadeira"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Banco/puff"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ilha central"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Gaveteiro central"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "TV"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tomadas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cofre"
            ]
          }
        ]
      },
      {
        "id": "closet_sec_12",
        "titulo": "12. Fluxo",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "12. Fluxo",
            "pergunta": "Duas pessoas usando ao mesmo tempo?",
            "secao": "12. Fluxo"
          },
          {
            "tipo": "estrategica",
            "rotulo": "12. Fluxo",
            "pergunta": "Área de troca confortável?",
            "secao": "12. Fluxo"
          }
        ],
        "itens": [
          "Espaço para circulação",
          "Duas pessoas usando ao mesmo tempo?",
          "Área de troca confortável?"
        ],
        "conteudoLinhas": [
          "   Espaço para circulação",
          "   Duas pessoas usando ao mesmo tempo?",
          "   Área de troca confortável?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Espaço para circulação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Duas pessoas usando ao mesmo tempo?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Área de troca confortável?"
            ]
          }
        ]
      },
      {
        "id": "closet_sec_13",
        "titulo": "13. Manutenção",
        "perguntasDestaque": [],
        "itens": [
          "Poeira",
          "Umidade",
          "Ventilação"
        ],
        "conteudoLinhas": [
          "   Poeira",
          "   Umidade",
          "   Ventilação"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Poeira"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Umidade"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ventilação"
            ]
          }
        ]
      },
      {
        "id": "closet_sec_14",
        "titulo": "14. Estilo",
        "perguntasDestaque": [],
        "itens": [
          "Boutique de luxo",
          "Clean",
          "Funcional",
          "Sofisticado",
          "Masculino/feminino equilibrado"
        ],
        "conteudoLinhas": [
          "   Boutique de luxo",
          "   Clean",
          "   Funcional",
          "   Sofisticado",
          "   Masculino/feminino equilibrado"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Boutique de luxo"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Clean"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Funcional"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Sofisticado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Masculino/feminino equilibrado"
            ]
          }
        ]
      },
      {
        "id": "closet_sec_15",
        "titulo": "15. Pontos de dor",
        "perguntasDestaque": [],
        "itens": [
          "Falta de espaço",
          "Bagunça",
          "Difícil visualização",
          "Falta de iluminação",
          "Mistura de roupas"
        ],
        "conteudoLinhas": [
          "   Falta de espaço",
          "   Bagunça",
          "   Difícil visualização",
          "   Falta de iluminação",
          "   Mistura de roupas"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Falta de espaço"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Bagunça"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Difícil visualização"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Falta de iluminação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Mistura de roupas"
            ]
          }
        ]
      },
      {
        "id": "closet_sec_16",
        "titulo": "16. Perguntas emocionais",
        "perguntasDestaque": [
          {
            "tipo": "emocional",
            "rotulo": "16. Perguntas emocionais",
            "pergunta": "Você quer sentir o quê ao entrar no closet?",
            "secao": "16. Perguntas emocionais"
          },
          {
            "tipo": "emocional",
            "rotulo": "16. Perguntas emocionais",
            "pergunta": "Quer algo mais prático ou mais “experiência”?",
            "secao": "16. Perguntas emocionais"
          },
          {
            "tipo": "emocional",
            "rotulo": "16. Perguntas emocionais",
            "pergunta": "Você quer um closet funcional ou que impressiona?",
            "secao": "16. Perguntas emocionais"
          }
        ],
        "itens": [
          "Você quer sentir o quê ao entrar no closet?",
          "Quer algo mais prático ou mais “experiência”?",
          "Você quer um closet funcional ou que impressiona?"
        ],
        "conteudoLinhas": [
          "   Você quer sentir o quê ao entrar no closet?",
          "   Quer algo mais prático ou mais “experiência”?",
          "   Você quer um closet funcional ou que impressiona?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Você quer sentir o quê ao entrar no closet?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Quer algo mais prático ou mais “experiência”?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você quer um closet funcional ou que impressiona?"
            ]
          }
        ]
      },
      {
        "id": "closet_sec_17",
        "titulo": "17. Resumo para projeto",
        "perguntasDestaque": [],
        "itens": [],
        "conteudoLinhas": [
          "Perfil:",
          "Volume de roupas:",
          "Organização:",
          "Itens obrigatórios:",
          "Estilo:",
          "Risco de erro:"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Perfil:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Volume de roupas:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Organização:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Itens obrigatórios:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Estilo:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Risco de erro:",
            "itens": []
          }
        ]
      }
    ],
    "perguntasEstrategicas": [
      {
        "tipo": "estrategica",
        "rotulo": "2. Perfil de uso",
        "pergunta": "Divisão proporcional?",
        "secao": "2. Perfil de uso"
      },
      {
        "tipo": "estrategica",
        "rotulo": "12. Fluxo",
        "pergunta": "Duas pessoas usando ao mesmo tempo?",
        "secao": "12. Fluxo"
      },
      {
        "tipo": "estrategica",
        "rotulo": "12. Fluxo",
        "pergunta": "Área de troca confortável?",
        "secao": "12. Fluxo"
      },
      {
        "tipo": "emocional",
        "rotulo": "16. Perguntas emocionais",
        "pergunta": "Você quer sentir o quê ao entrar no closet?",
        "secao": "16. Perguntas emocionais"
      },
      {
        "tipo": "emocional",
        "rotulo": "16. Perguntas emocionais",
        "pergunta": "Quer algo mais prático ou mais “experiência”?",
        "secao": "16. Perguntas emocionais"
      },
      {
        "tipo": "emocional",
        "rotulo": "16. Perguntas emocionais",
        "pergunta": "Você quer um closet funcional ou que impressiona?",
        "secao": "16. Perguntas emocionais"
      }
    ],
    "topicosChecagemTecnica": [
      "12. Fluxo",
      "[12. Fluxo] Espaço para circulação",
      "[12. Fluxo] Duas pessoas usando ao mesmo tempo?",
      "[12. Fluxo] Área de troca confortável?",
      "17. Resumo para projeto"
    ]
  },
  "cozinha": {
    "slug": "cozinha",
    "titulo": "Cozinha",
    "subtitulo": "Triângulo funcional, eletros embutidos, despensa, bancada e rotina de preparo",
    "arquivoPdfOriginal": "BRIEFING COZINHA.pdf",
    "secoes": [
      {
        "id": "cozinha_sec_1",
        "titulo": "2. Objetivo da cozinha",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "2. Objetivo da cozinha",
            "pergunta": "Qual o papel dessa cozinha?",
            "secao": "2. Objetivo da cozinha"
          },
          {
            "tipo": "emocional",
            "rotulo": "Pergunta emocional:",
            "pergunta": "Quando você entra na sua cozinha ideal, o que você quer sentir?",
            "secao": "2. Objetivo da cozinha"
          }
        ],
        "itens": [
          "Uso diário intenso",
          "Uso ocasional",
          "Cozinha principal da casa",
          "Cozinha de apoio",
          "Cozinha integrada com área social",
          "Cozinha mais funcional do que estética",
          "Cozinha de destaque da casa",
          "Cozinha para receber convidados",
          "Cozinha para família",
          "Praticidade",
          "Organização",
          "Aconchego",
          "Sofisticação",
          "Prazer em cozinhar",
          "Fluidez no dia a dia",
          "Sensação de “tudo no lugar”"
        ],
        "conteudoLinhas": [
          "Qual o papel dessa cozinha?",
          "   Uso diário intenso",
          "   Uso ocasional",
          "   Cozinha principal da casa",
          "   Cozinha de apoio",
          "   Cozinha integrada com área social",
          "   Cozinha mais funcional do que estética",
          "   Cozinha de destaque da casa",
          "   Cozinha para receber convidados",
          "   Cozinha para família",
          "[Pergunta emocional:] Quando você entra na sua cozinha ideal, o que você quer sentir?",
          "Exemplos:",
          "   Praticidade",
          "   Organização",
          "   Aconchego",
          "   Sofisticação",
          "   Prazer em cozinhar",
          "   Fluidez no dia a dia",
          "   Sensação de “tudo no lugar”"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Qual o papel dessa cozinha?",
            "itens": [
              "Uso diário intenso",
              "Uso ocasional",
              "Cozinha principal da casa",
              "Cozinha de apoio",
              "Cozinha integrada com área social",
              "Cozinha mais funcional do que estética",
              "Cozinha de destaque da casa",
              "Cozinha para receber convidados",
              "Cozinha para família"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta emocional:",
            "texto": "Quando você entra na sua cozinha ideal, o que você quer sentir?",
            "tipoPergunta": "emocional",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Exemplos:",
            "itens": [
              "Praticidade",
              "Organização",
              "Aconchego",
              "Sofisticação",
              "Prazer em cozinhar",
              "Fluidez no dia a dia",
              "Sensação de “tudo no lugar”"
            ]
          }
        ]
      },
      {
        "id": "cozinha_sec_2",
        "titulo": "3. Perfil de uso",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "3. Perfil de uso",
            "pergunta": "Mais para apoio (delivery, aquecer comida) Quantas pessoas utilizam diariamente?",
            "secao": "3. Perfil de uso"
          }
        ],
        "itens": [
          "Todos os dias",
          "Várias vezes ao dia",
          "Apenas refeições rápidas",
          "Finais de semana",
          "Mais para apoio (delivery, aquecer comida) Quantas pessoas utilizam diariamente?",
          "Moradores:",
          "Funcionários:",
          "Frequência de visitas:"
        ],
        "conteudoLinhas": [
          "A cozinha será usada:",
          "   Todos os dias",
          "   Várias vezes ao dia",
          "   Apenas refeições rápidas",
          "   Finais de semana",
          "   Mais para apoio (delivery, aquecer comida)",
          "   Moradores:",
          "   Funcionários:",
          "   Frequência de visitas:"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "A cozinha será usada:",
            "itens": [
              "Todos os dias",
              "Várias vezes ao dia",
              "Apenas refeições rápidas",
              "Finais de semana",
              "Mais para apoio (delivery, aquecer comida) Quantas pessoas utilizam diariamente?",
              "Moradores:",
              "Funcionários:",
              "Frequência de visitas:"
            ]
          }
        ]
      },
      {
        "id": "cozinha_sec_3",
        "titulo": "4. Rotina alimentar",
        "perguntasDestaque": [],
        "itens": [
          "Cozinha diariamente",
          "Cozinha ocasionalmente",
          "Usa muito delivery",
          "Tem cozinheira/funcionária",
          "Faz refeições completas",
          "Faz apenas lanches rápidos",
          "Arroz/feijão",
          "Massas",
          "Carnes",
          "Comida fitness",
          "Doces",
          "Café frequente",
          "Air fryer",
          "Micro-ondas dominante"
        ],
        "conteudoLinhas": [
          "A família:",
          "   Cozinha diariamente",
          "   Cozinha ocasionalmente",
          "   Usa muito delivery",
          "   Tem cozinheira/funcionária",
          "   Faz refeições completas",
          "   Faz apenas lanches rápidos",
          "Tipos de preparo mais comuns:",
          "   Arroz/feijão",
          "   Massas",
          "   Carnes",
          "   Comida fitness",
          "   Doces",
          "   Café frequente",
          "   Air fryer",
          "   Micro-ondas dominante"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "A família:",
            "itens": [
              "Cozinha diariamente",
              "Cozinha ocasionalmente",
              "Usa muito delivery",
              "Tem cozinheira/funcionária",
              "Faz refeições completas",
              "Faz apenas lanches rápidos"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Tipos de preparo mais comuns:",
            "itens": [
              "Arroz/feijão",
              "Massas",
              "Carnes",
              "Comida fitness",
              "Doces",
              "Café frequente",
              "Air fryer",
              "Micro-ondas dominante"
            ]
          }
        ]
      },
      {
        "id": "cozinha_sec_4",
        "titulo": "5. Quem usa a cozinha (perfil técnico)",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "O que mais te incomoda hoje em uma cozinha?",
            "secao": "5. Quem usa a cozinha (perfil técnico)"
          }
        ],
        "itens": [
          "Cliente",
          "Cônjuge",
          "Funcionária",
          "Todos",
          "Destro",
          "Canhoto",
          "Altura:",
          "Gosta de organização extrema",
          "Mais prático/descontraído",
          "Gosta de tudo à mão",
          "Prefere bancada livre"
        ],
        "conteudoLinhas": [
          "Quem mais utiliza:",
          "   Cliente",
          "   Cônjuge",
          "   Funcionária",
          "   Todos",
          "Perfil da pessoa principal:",
          "   Destro",
          "   Canhoto",
          "   Altura:",
          "   Gosta de organização extrema",
          "   Mais prático/descontraído",
          "   Gosta de tudo à mão",
          "   Prefere bancada livre",
          "[Pergunta-chave:] O que mais te incomoda hoje em uma cozinha?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Quem mais utiliza:",
            "itens": [
              "Cliente",
              "Cônjuge",
              "Funcionária",
              "Todos"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Perfil da pessoa principal:",
            "itens": [
              "Destro",
              "Canhoto",
              "Altura:",
              "Gosta de organização extrema",
              "Mais prático/descontraído",
              "Gosta de tudo à mão",
              "Prefere bancada livre"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "O que mais te incomoda hoje em uma cozinha?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "cozinha_sec_5",
        "titulo": "6. Estilo de uso da cozinha",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "Pergunta estratégica:",
            "pergunta": "Você quer esconder ou mostrar sua cozinha?",
            "secao": "6. Estilo de uso da cozinha"
          }
        ],
        "itens": [
          "Cozinha isolada",
          "Cozinha integrada com sala",
          "Cozinha aberta com ilha",
          "Cozinha com portas de correr",
          "Cozinha social (aparece para visitas)",
          "Cozinha mais reservada"
        ],
        "conteudoLinhas": [
          "   Cozinha isolada",
          "   Cozinha integrada com sala",
          "   Cozinha aberta com ilha",
          "   Cozinha com portas de correr",
          "   Cozinha social (aparece para visitas)",
          "   Cozinha mais reservada",
          "[Pergunta estratégica:] Você quer esconder ou mostrar sua cozinha?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Cozinha isolada"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cozinha integrada com sala"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cozinha aberta com ilha"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cozinha com portas de correr"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cozinha social (aparece para visitas)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cozinha mais reservada"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta estratégica:",
            "texto": "Você quer esconder ou mostrar sua cozinha?",
            "tipoPergunta": "estrategica",
            "itens": []
          }
        ]
      },
      {
        "id": "cozinha_sec_6",
        "titulo": "7. Equipamentos e eletrodomésticos",
        "perguntasDestaque": [],
        "itens": [
          "Geladeira (modelo/medidas)",
          "Freezer",
          "Cooktop",
          "Fogão",
          "Forno elétrico",
          "Forno a gás",
          "Micro-ondas",
          "Lava-louças",
          "Coifa/exaustor",
          "Air fryer",
          "Cafeteira",
          "Adega",
          "Triturador",
          "Máquina de gelo",
          "Purificador",
          "Torneira gourmet",
          "Máquina de lavar (se houver)",
          "Secadora (se houver)"
        ],
        "conteudoLinhas": [
          "Listar TODOS os itens:",
          "   Geladeira (modelo/medidas)",
          "   Freezer",
          "   Cooktop",
          "   Fogão",
          "   Forno elétrico",
          "   Forno a gás",
          "   Micro-ondas",
          "   Lava-louças",
          "   Coifa/exaustor",
          "   Air fryer",
          "   Cafeteira",
          "   Adega",
          "   Triturador",
          "   Máquina de gelo",
          "   Purificador",
          "   Torneira gourmet",
          "   Máquina de lavar (se houver)",
          "   Secadora (se houver)",
          "Importante: confirmar medidas e especificações."
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Listar TODOS os itens:",
            "itens": [
              "Geladeira (modelo/medidas)",
              "Freezer",
              "Cooktop",
              "Fogão",
              "Forno elétrico",
              "Forno a gás",
              "Micro-ondas",
              "Lava-louças",
              "Coifa/exaustor",
              "Air fryer",
              "Cafeteira",
              "Adega",
              "Triturador",
              "Máquina de gelo",
              "Purificador",
              "Torneira gourmet",
              "Máquina de lavar (se houver)",
              "Secadora (se houver)"
            ]
          },
          {
            "tipo": "nota",
            "texto": "Importante: confirmar medidas e especificações."
          }
        ]
      },
      {
        "id": "cozinha_sec_7",
        "titulo": "8. Armazenamento",
        "perguntasDestaque": [
          {
            "tipo": "pratica",
            "rotulo": "Pergunta prática:",
            "pergunta": "Você prefere tudo escondido ou gosta de nichos/decoração?",
            "secao": "8. Armazenamento"
          }
        ],
        "itens": [
          "Louças do dia a dia",
          "Louças de visita",
          "Taças",
          "Copos",
          "Panelas",
          "Panelas grandes",
          "Panelas pequenas",
          "Utensílios",
          "Talheres",
          "Mantimentos",
          "Produtos de limpeza",
          "Eletroportáteis",
          "Café/cápsulas",
          "Garrafas",
          "Marmitas",
          "Plásticos",
          "Itens volumosos"
        ],
        "conteudoLinhas": [
          "O cliente precisa guardar:",
          "   Louças do dia a dia",
          "   Louças de visita",
          "   Taças",
          "   Copos",
          "      Panelas",
          "      Panelas grandes",
          "      Panelas pequenas",
          "      Utensílios",
          "      Talheres",
          "      Mantimentos",
          "      Produtos de limpeza",
          "      Eletroportáteis",
          "      Café/cápsulas",
          "      Garrafas",
          "      Marmitas",
          "      Plásticos",
          "      Itens volumosos",
          "[Pergunta prática:] Você prefere tudo escondido ou gosta de nichos/decoração?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "O cliente precisa guardar:",
            "itens": [
              "Louças do dia a dia",
              "Louças de visita",
              "Taças",
              "Copos",
              "Panelas",
              "Panelas grandes",
              "Panelas pequenas",
              "Utensílios",
              "Talheres",
              "Mantimentos",
              "Produtos de limpeza",
              "Eletroportáteis",
              "Café/cápsulas",
              "Garrafas",
              "Marmitas",
              "Plásticos",
              "Itens volumosos"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta prática:",
            "texto": "Você prefere tudo escondido ou gosta de nichos/decoração?",
            "tipoPergunta": "pratica",
            "itens": []
          }
        ]
      },
      {
        "id": "cozinha_sec_8",
        "titulo": "9. Fluxo da cozinha (ERGONOMIA)",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "9. Fluxo da cozinha (ERGONOMIA)",
            "pergunta": "Porta abre para onde?",
            "secao": "9. Fluxo da cozinha (ERGONOMIA)"
          },
          {
            "tipo": "estrategica",
            "rotulo": "9. Fluxo da cozinha (ERGONOMIA)",
            "pergunta": "Mais de uma pessoa usa ao mesmo tempo?",
            "secao": "9. Fluxo da cozinha (ERGONOMIA)"
          },
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Hoje você sente que sua cozinha “trava” em algum momento?",
            "secao": "9. Fluxo da cozinha (ERGONOMIA)"
          }
        ],
        "itens": [
          "Geladeira → pia → fogão (triângulo funcional)",
          "Distâncias entre pontos",
          "Espaço de circulação",
          "Porta abre para onde?",
          "Interferência de portas/gavetas",
          "Mais de uma pessoa usa ao mesmo tempo?"
        ],
        "conteudoLinhas": [
          "Analisar o fluxo:",
          "      Geladeira → pia → fogão (triângulo funcional)",
          "      Distâncias entre pontos",
          "      Espaço de circulação",
          "      Porta abre para onde?",
          "      Interferência de portas/gavetas",
          "      Mais de uma pessoa usa ao mesmo tempo?",
          "[Pergunta-chave:] Hoje você sente que sua cozinha “trava” em algum momento?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Analisar o fluxo:",
            "itens": [
              "Geladeira → pia → fogão (triângulo funcional)",
              "Distâncias entre pontos",
              "Espaço de circulação",
              "Porta abre para onde?",
              "Interferência de portas/gavetas",
              "Mais de uma pessoa usa ao mesmo tempo?"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Hoje você sente que sua cozinha “trava” em algum momento?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "cozinha_sec_9",
        "titulo": "10. Bancadas",
        "perguntasDestaque": [],
        "itens": [
          "Preparo",
          "Corte",
          "Apoio",
          "Café",
          "Refeições rápidas",
          "Ilha",
          "Península",
          "Padrão",
          "Personalizada",
          "Diferenciada por usuário",
          "Muito espaço livre",
          "Espaço moderado",
          "Não é prioridade"
        ],
        "conteudoLinhas": [
          "Necessidades:",
          "      Preparo",
          "      Corte",
          "      Apoio",
          "      Café",
          "      Refeições rápidas",
          "      Ilha",
          "      Península",
          "Altura:",
          "   Padrão",
          "   Personalizada",
          "   Diferenciada por usuário",
          "Espaço livre desejado:",
          "   Muito espaço livre",
          "   Espaço moderado",
          "   Não é prioridade"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Necessidades:",
            "itens": [
              "Preparo",
              "Corte",
              "Apoio",
              "Café",
              "Refeições rápidas",
              "Ilha",
              "Península"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Altura:",
            "itens": [
              "Padrão",
              "Personalizada",
              "Diferenciada por usuário"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Espaço livre desejado:",
            "itens": [
              "Muito espaço livre",
              "Espaço moderado",
              "Não é prioridade"
            ]
          }
        ]
      },
      {
        "id": "cozinha_sec_10",
        "titulo": "11. Integração com outros ambientes",
        "perguntasDestaque": [],
        "itens": [
          "Sala de jantar",
          "Living",
          "Área gourmet",
          "Lavanderia",
          "Despensa",
          "Corredor",
          "Integração total",
          "Integração parcial",
          "Possibilidade de fechar",
          "Discrição visual"
        ],
        "conteudoLinhas": [
          "A cozinha se conecta com:",
          "   Sala de jantar",
          "   Living",
          "   Área gourmet",
          "   Lavanderia",
          "   Despensa",
          "   Corredor",
          "O cliente deseja:",
          "   Integração total",
          "   Integração parcial",
          "   Possibilidade de fechar",
          "   Discrição visual"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "A cozinha se conecta com:",
            "itens": [
              "Sala de jantar",
              "Living",
              "Área gourmet",
              "Lavanderia",
              "Despensa",
              "Corredor"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "O cliente deseja:",
            "itens": [
              "Integração total",
              "Integração parcial",
              "Possibilidade de fechar",
              "Discrição visual"
            ]
          }
        ]
      },
      {
        "id": "cozinha_sec_11",
        "titulo": "12. Estilo visual",
        "perguntasDestaque": [
          {
            "tipo": "emocional",
            "rotulo": "Pergunta emocional:",
            "pergunta": "Você quer uma cozinha que impressione ou que abrace?",
            "secao": "12. Estilo visual"
          }
        ],
        "itens": [
          "Moderno",
          "Contemporâneo",
          "Atemporal",
          "Minimalista",
          "Clássico leve",
          "Natural",
          "Brasileiro",
          "Clean",
          "Madeira clara",
          "Madeira escura",
          "Laca",
          "Vidro",
          "Metal",
          "Pedra",
          "Ripado",
          "Portas lisas",
          "Perfil metálico"
        ],
        "conteudoLinhas": [
          "Preferência:",
          "   Moderno",
          "   Contemporâneo",
          "   Atemporal",
          "   Minimalista",
          "   Clássico leve",
          "   Natural",
          "   Brasileiro",
          "   Clean",
          "Materiais:",
          "   Madeira clara",
          "   Madeira escura",
          "   Laca",
          "   Vidro",
          "   Metal",
          "   Pedra",
          "   Ripado",
          "   Portas lisas",
          "   Perfil metálico",
          "[Pergunta emocional:] Você quer uma cozinha que impressione ou que abrace?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Preferência:",
            "itens": [
              "Moderno",
              "Contemporâneo",
              "Atemporal",
              "Minimalista",
              "Clássico leve",
              "Natural",
              "Brasileiro",
              "Clean"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Materiais:",
            "itens": [
              "Madeira clara",
              "Madeira escura",
              "Laca",
              "Vidro",
              "Metal",
              "Pedra",
              "Ripado",
              "Portas lisas",
              "Perfil metálico"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta emocional:",
            "texto": "Você quer uma cozinha que impressione ou que abrace?",
            "tipoPergunta": "emocional",
            "itens": []
          }
        ]
      },
      {
        "id": "cozinha_sec_12",
        "titulo": "13. Manutenção",
        "perguntasDestaque": [
          {
            "tipo": "geral",
            "rotulo": "Perguntar:",
            "pergunta": "Perguntar:",
            "secao": "13. Manutenção"
          },
          {
            "tipo": "estrategica",
            "rotulo": "13. Manutenção",
            "pergunta": "Há gordura intensa?",
            "secao": "13. Manutenção"
          }
        ],
        "itens": [
          "Fácil limpeza",
          "Alta durabilidade",
          "Resistente à gordura",
          "Resistente à umidade",
          "Pouca manutenção",
          "Pode exigir mais cuidado (estética acima de tudo)",
          "Quem limpa?",
          "Frequência?",
          "Há gordura intensa?"
        ],
        "conteudoLinhas": [
          "Preferência:",
          "   Fácil limpeza",
          "   Alta durabilidade",
          "   Resistente à gordura",
          "   Resistente à umidade",
          "   Pouca manutenção",
          "   Pode exigir mais cuidado (estética acima de tudo)",
          "[Perguntar:] Perguntar:",
          "   Quem limpa?",
          "   Frequência?",
          "   Há gordura intensa?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Preferência:",
            "itens": [
              "Fácil limpeza",
              "Alta durabilidade",
              "Resistente à gordura",
              "Resistente à umidade",
              "Pouca manutenção",
              "Pode exigir mais cuidado (estética acima de tudo)"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Perguntar:",
            "texto": "Perguntar:",
            "tipoPergunta": "geral",
            "itens": [
              "Quem limpa?",
              "Frequência?",
              "Há gordura intensa?"
            ]
          }
        ]
      },
      {
        "id": "cozinha_sec_13",
        "titulo": "14. Iluminação",
        "perguntasDestaque": [
          {
            "tipo": "geral",
            "rotulo": "Pergunta:",
            "pergunta": "Você usa mais a cozinha de dia ou à noite?",
            "secao": "14. Iluminação"
          }
        ],
        "itens": [
          "Funcional (preparo)",
          "Decorativa",
          "Indireta",
          "Dimerizável",
          "Iluminação de armários",
          "Iluminação de bancada",
          "Luz quente/fria"
        ],
        "conteudoLinhas": [
          "   Funcional (preparo)",
          "   Decorativa",
          "   Indireta",
          "   Dimerizável",
          "   Iluminação de armários",
          "   Iluminação de bancada",
          "   Luz quente/fria",
          "[Pergunta:] Você usa mais a cozinha de dia ou à noite?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Funcional (preparo)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Decorativa"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Indireta"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Dimerizável"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Iluminação de armários"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Iluminação de bancada"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz quente/fria"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta:",
            "texto": "Você usa mais a cozinha de dia ou à noite?",
            "tipoPergunta": "geral",
            "itens": []
          }
        ]
      },
      {
        "id": "cozinha_sec_14",
        "titulo": "15. Crianças e segurança",
        "perguntasDestaque": [],
        "itens": [
          "Sim",
          "Não",
          "Gavetas com trava",
          "Alturas seguras",
          "Evitar cantos vivos",
          "Distância do fogão",
          "Organização de facas"
        ],
        "conteudoLinhas": [
          "Há crianças?",
          "   Sim",
          "   Não",
          "Cuidados:",
          "   Gavetas com trava",
          "   Alturas seguras",
          "   Evitar cantos vivos",
          "   Distância do fogão",
          "   Organização de facas"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Há crianças?",
            "itens": [
              "Sim",
              "Não"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Cuidados:",
            "itens": [
              "Gavetas com trava",
              "Alturas seguras",
              "Evitar cantos vivos",
              "Distância do fogão",
              "Organização de facas"
            ]
          }
        ]
      },
      {
        "id": "cozinha_sec_15",
        "titulo": "16. Pets",
        "perguntasDestaque": [],
        "itens": [
          "Sim",
          "Não",
          "Espaço para ração",
          "Potes",
          "Material resistente"
        ],
        "conteudoLinhas": [
          "   Sim",
          "   Não",
          "Necessidades:",
          "   Espaço para ração",
          "   Potes",
          "   Material resistente"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Sim"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Não"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Necessidades:",
            "itens": [
              "Espaço para ração",
              "Potes",
              "Material resistente"
            ]
          }
        ]
      },
      {
        "id": "cozinha_sec_16",
        "titulo": "17. Experiência anterior",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "17. Experiência anterior",
            "pergunta": "Já teve planejados?",
            "secao": "17. Experiência anterior"
          }
        ],
        "itens": [
          "Sim",
          "Não",
          "Falta de espaço",
          "Má organização",
          "Dificuldade de limpeza",
          "Projeto bonito, mas pouco funcional",
          "Problemas de montagem",
          "Problemas de material"
        ],
        "conteudoLinhas": [
          "Já teve planejados?",
          "   Sim",
          "   Não",
          "Problemas anteriores:",
          "   Falta de espaço",
          "   Má organização",
          "   Dificuldade de limpeza",
          "   Projeto bonito, mas pouco funcional",
          "   Problemas de montagem",
          "   Problemas de material"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Já teve planejados?",
            "itens": [
              "Sim",
              "Não"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Problemas anteriores:",
            "itens": [
              "Falta de espaço",
              "Má organização",
              "Dificuldade de limpeza",
              "Projeto bonito, mas pouco funcional",
              "Problemas de montagem",
              "Problemas de material"
            ]
          }
        ]
      },
      {
        "id": "cozinha_sec_17",
        "titulo": "18. Referências",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "O que exatamente você gostou nessa imagem?",
            "secao": "18. Referências"
          }
        ],
        "itens": [
          "Pinterest",
          "Instagram",
          "Projetos de arquiteto",
          "Casas conhecidas"
        ],
        "conteudoLinhas": [
          "Tem referências?",
          "   Pinterest",
          "   Instagram",
          "   Projetos de arquiteto",
          "   Casas conhecidas",
          "[Pergunta-chave:] O que exatamente você gostou nessa imagem?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Tem referências?",
            "itens": [
              "Pinterest",
              "Instagram",
              "Projetos de arquiteto",
              "Casas conhecidas"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "O que exatamente você gostou nessa imagem?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "cozinha_sec_18",
        "titulo": "19. Investimento",
        "perguntasDestaque": [],
        "itens": [
          "Estética",
          "Funcionalidade",
          "Durabilidade",
          "Prazo",
          "Custo-benefício"
        ],
        "conteudoLinhas": [
          "Existe previsão?",
          "Prioridade:",
          "   Estética",
          "   Funcionalidade",
          "   Durabilidade",
          "   Prazo",
          "   Custo-benefício"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Existe previsão?",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Prioridade:",
            "itens": [
              "Estética",
              "Funcionalidade",
              "Durabilidade",
              "Prazo",
              "Custo-benefício"
            ]
          }
        ]
      },
      {
        "id": "cozinha_sec_19",
        "titulo": "20. Checklist técnico",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "20. Checklist técnico",
            "pergunta": "Planta disponível?",
            "secao": "20. Checklist técnico"
          },
          {
            "tipo": "estrategica",
            "rotulo": "20. Checklist técnico",
            "pergunta": "Pontos hidráulicos definidos?",
            "secao": "20. Checklist técnico"
          },
          {
            "tipo": "estrategica",
            "rotulo": "20. Checklist técnico",
            "pergunta": "Pontos elétricos definidos?",
            "secao": "20. Checklist técnico"
          },
          {
            "tipo": "estrategica",
            "rotulo": "20. Checklist técnico",
            "pergunta": "Revestimentos definidos?",
            "secao": "20. Checklist técnico"
          },
          {
            "tipo": "estrategica",
            "rotulo": "20. Checklist técnico",
            "pergunta": "Obra pronta para medição?",
            "secao": "20. Checklist técnico"
          }
        ],
        "itens": [
          "Planta disponível?",
          "Pontos hidráulicos definidos?",
          "Pontos elétricos definidos?",
          "Gás definido?",
          "Revestimentos definidos?",
          "Pedra definida?",
          "Obra pronta para medição?",
          "Fotos do local?"
        ],
        "conteudoLinhas": [
          "   Planta disponível?",
          "   Pontos hidráulicos definidos?",
          "   Pontos elétricos definidos?",
          "   Gás definido?",
          "   Revestimentos definidos?",
          "   Pedra definida?",
          "   Obra pronta para medição?",
          "   Fotos do local?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Planta disponível?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Pontos hidráulicos definidos?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Pontos elétricos definidos?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Gás definido?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Revestimentos definidos?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Pedra definida?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Obra pronta para medição?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Fotos do local?"
            ]
          }
        ]
      },
      {
        "id": "cozinha_sec_20",
        "titulo": "21. Perguntas de aprofundamento emocional",
        "perguntasDestaque": [
          {
            "tipo": "emocional",
            "rotulo": "21. Perguntas de aprofundamento emocional",
            "pergunta": "O que mais te irrita em cozinhas?",
            "secao": "21. Perguntas de aprofundamento emocional"
          },
          {
            "tipo": "emocional",
            "rotulo": "21. Perguntas de aprofundamento emocional",
            "pergunta": "Qual momento você mais valoriza (café da manhã, jantar, etc)?",
            "secao": "21. Perguntas de aprofundamento emocional"
          },
          {
            "tipo": "emocional",
            "rotulo": "21. Perguntas de aprofundamento emocional",
            "pergunta": "Você gosta de cozinhar ou faz por necessidade?",
            "secao": "21. Perguntas de aprofundamento emocional"
          },
          {
            "tipo": "emocional",
            "rotulo": "21. Perguntas de aprofundamento emocional",
            "pergunta": "Você quer uma cozinha prática ou prazerosa?",
            "secao": "21. Perguntas de aprofundamento emocional"
          },
          {
            "tipo": "emocional",
            "rotulo": "21. Perguntas de aprofundamento emocional",
            "pergunta": "Qual detalhe faria você amar essa cozinha todos os dias?",
            "secao": "21. Perguntas de aprofundamento emocional"
          }
        ],
        "itens": [
          "O que mais te irrita em cozinhas?",
          "Qual momento você mais valoriza (café da manhã, jantar, etc)?",
          "Você gosta de cozinhar ou faz por necessidade?",
          "Você quer uma cozinha prática ou prazerosa?",
          "Qual detalhe faria você amar essa cozinha todos os dias?"
        ],
        "conteudoLinhas": [
          "   O que mais te irrita em cozinhas?",
          "   Qual momento você mais valoriza (café da manhã, jantar, etc)?",
          "   Você gosta de cozinhar ou faz por necessidade?",
          "   Você quer uma cozinha prática ou prazerosa?",
          "   Qual detalhe faria você amar essa cozinha todos os dias?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "O que mais te irrita em cozinhas?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Qual momento você mais valoriza (café da manhã, jantar, etc)?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você gosta de cozinhar ou faz por necessidade?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você quer uma cozinha prática ou prazerosa?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Qual detalhe faria você amar essa cozinha todos os dias?"
            ]
          }
        ]
      },
      {
        "id": "cozinha_sec_21",
        "titulo": "22. Resumo para o projetista",
        "perguntasDestaque": [],
        "itens": [],
        "conteudoLinhas": [
          "Sensação desejada:",
          "Uso principal:",
          "Perfil do cliente:",
          "Fluxo ideal:",
          "Pontos críticos:",
          "Itens obrigatórios:",
          "Estilo:",
          "Investimento:",
          "Prazo:"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Sensação desejada:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Uso principal:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Perfil do cliente:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Fluxo ideal:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Pontos críticos:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Itens obrigatórios:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Estilo:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Investimento:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Prazo:",
            "itens": []
          }
        ]
      }
    ],
    "perguntasEstrategicas": [
      {
        "tipo": "estrategica",
        "rotulo": "2. Objetivo da cozinha",
        "pergunta": "Qual o papel dessa cozinha?",
        "secao": "2. Objetivo da cozinha"
      },
      {
        "tipo": "emocional",
        "rotulo": "Pergunta emocional:",
        "pergunta": "Quando você entra na sua cozinha ideal, o que você quer sentir?",
        "secao": "2. Objetivo da cozinha"
      },
      {
        "tipo": "estrategica",
        "rotulo": "3. Perfil de uso",
        "pergunta": "Mais para apoio (delivery, aquecer comida) Quantas pessoas utilizam diariamente?",
        "secao": "3. Perfil de uso"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "O que mais te incomoda hoje em uma cozinha?",
        "secao": "5. Quem usa a cozinha (perfil técnico)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Pergunta estratégica:",
        "pergunta": "Você quer esconder ou mostrar sua cozinha?",
        "secao": "6. Estilo de uso da cozinha"
      },
      {
        "tipo": "pratica",
        "rotulo": "Pergunta prática:",
        "pergunta": "Você prefere tudo escondido ou gosta de nichos/decoração?",
        "secao": "8. Armazenamento"
      },
      {
        "tipo": "estrategica",
        "rotulo": "9. Fluxo da cozinha (ERGONOMIA)",
        "pergunta": "Porta abre para onde?",
        "secao": "9. Fluxo da cozinha (ERGONOMIA)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "9. Fluxo da cozinha (ERGONOMIA)",
        "pergunta": "Mais de uma pessoa usa ao mesmo tempo?",
        "secao": "9. Fluxo da cozinha (ERGONOMIA)"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Hoje você sente que sua cozinha “trava” em algum momento?",
        "secao": "9. Fluxo da cozinha (ERGONOMIA)"
      },
      {
        "tipo": "emocional",
        "rotulo": "Pergunta emocional:",
        "pergunta": "Você quer uma cozinha que impressione ou que abrace?",
        "secao": "12. Estilo visual"
      },
      {
        "tipo": "geral",
        "rotulo": "Perguntar:",
        "pergunta": "Perguntar:",
        "secao": "13. Manutenção"
      },
      {
        "tipo": "estrategica",
        "rotulo": "13. Manutenção",
        "pergunta": "Há gordura intensa?",
        "secao": "13. Manutenção"
      },
      {
        "tipo": "geral",
        "rotulo": "Pergunta:",
        "pergunta": "Você usa mais a cozinha de dia ou à noite?",
        "secao": "14. Iluminação"
      },
      {
        "tipo": "estrategica",
        "rotulo": "17. Experiência anterior",
        "pergunta": "Já teve planejados?",
        "secao": "17. Experiência anterior"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "O que exatamente você gostou nessa imagem?",
        "secao": "18. Referências"
      },
      {
        "tipo": "estrategica",
        "rotulo": "20. Checklist técnico",
        "pergunta": "Planta disponível?",
        "secao": "20. Checklist técnico"
      },
      {
        "tipo": "estrategica",
        "rotulo": "20. Checklist técnico",
        "pergunta": "Pontos hidráulicos definidos?",
        "secao": "20. Checklist técnico"
      },
      {
        "tipo": "estrategica",
        "rotulo": "20. Checklist técnico",
        "pergunta": "Pontos elétricos definidos?",
        "secao": "20. Checklist técnico"
      },
      {
        "tipo": "estrategica",
        "rotulo": "20. Checklist técnico",
        "pergunta": "Revestimentos definidos?",
        "secao": "20. Checklist técnico"
      },
      {
        "tipo": "estrategica",
        "rotulo": "20. Checklist técnico",
        "pergunta": "Obra pronta para medição?",
        "secao": "20. Checklist técnico"
      },
      {
        "tipo": "emocional",
        "rotulo": "21. Perguntas de aprofundamento emocional",
        "pergunta": "O que mais te irrita em cozinhas?",
        "secao": "21. Perguntas de aprofundamento emocional"
      },
      {
        "tipo": "emocional",
        "rotulo": "21. Perguntas de aprofundamento emocional",
        "pergunta": "Qual momento você mais valoriza (café da manhã, jantar, etc)?",
        "secao": "21. Perguntas de aprofundamento emocional"
      },
      {
        "tipo": "emocional",
        "rotulo": "21. Perguntas de aprofundamento emocional",
        "pergunta": "Você gosta de cozinhar ou faz por necessidade?",
        "secao": "21. Perguntas de aprofundamento emocional"
      },
      {
        "tipo": "emocional",
        "rotulo": "21. Perguntas de aprofundamento emocional",
        "pergunta": "Você quer uma cozinha prática ou prazerosa?",
        "secao": "21. Perguntas de aprofundamento emocional"
      },
      {
        "tipo": "emocional",
        "rotulo": "21. Perguntas de aprofundamento emocional",
        "pergunta": "Qual detalhe faria você amar essa cozinha todos os dias?",
        "secao": "21. Perguntas de aprofundamento emocional"
      }
    ],
    "topicosChecagemTecnica": [
      "[5. Quem usa a cozinha (perfil técnico)] Cliente",
      "[5. Quem usa a cozinha (perfil técnico)] Cônjuge",
      "[5. Quem usa a cozinha (perfil técnico)] Funcionária",
      "[5. Quem usa a cozinha (perfil técnico)] Todos",
      "[5. Quem usa a cozinha (perfil técnico)] Destro",
      "[5. Quem usa a cozinha (perfil técnico)] Canhoto",
      "[5. Quem usa a cozinha (perfil técnico)] Altura:",
      "[5. Quem usa a cozinha (perfil técnico)] Gosta de organização extrema",
      "[5. Quem usa a cozinha (perfil técnico)] Mais prático/descontraído",
      "[5. Quem usa a cozinha (perfil técnico)] Gosta de tudo à mão",
      "[5. Quem usa a cozinha (perfil técnico)] Prefere bancada livre",
      "[7. Equipamentos e eletrodomésticos] Geladeira (modelo/medidas)",
      "[7. Equipamentos e eletrodomésticos] Freezer",
      "[7. Equipamentos e eletrodomésticos] Cooktop",
      "[7. Equipamentos e eletrodomésticos] Fogão",
      "[7. Equipamentos e eletrodomésticos] Forno elétrico",
      "[7. Equipamentos e eletrodomésticos] Forno a gás",
      "[7. Equipamentos e eletrodomésticos] Micro-ondas",
      "[7. Equipamentos e eletrodomésticos] Lava-louças",
      "[7. Equipamentos e eletrodomésticos] Coifa/exaustor",
      "[7. Equipamentos e eletrodomésticos] Air fryer",
      "[7. Equipamentos e eletrodomésticos] Cafeteira",
      "[7. Equipamentos e eletrodomésticos] Adega",
      "[7. Equipamentos e eletrodomésticos] Triturador",
      "[7. Equipamentos e eletrodomésticos] Máquina de gelo",
      "[7. Equipamentos e eletrodomésticos] Purificador",
      "[7. Equipamentos e eletrodomésticos] Torneira gourmet",
      "[7. Equipamentos e eletrodomésticos] Máquina de lavar (se houver)",
      "[7. Equipamentos e eletrodomésticos] Secadora (se houver)",
      "9. Fluxo da cozinha (ERGONOMIA)",
      "[9. Fluxo da cozinha (ERGONOMIA)] Geladeira → pia → fogão (triângulo funcional)",
      "[9. Fluxo da cozinha (ERGONOMIA)] Distâncias entre pontos",
      "[9. Fluxo da cozinha (ERGONOMIA)] Espaço de circulação",
      "[9. Fluxo da cozinha (ERGONOMIA)] Porta abre para onde?",
      "[9. Fluxo da cozinha (ERGONOMIA)] Interferência de portas/gavetas",
      "[9. Fluxo da cozinha (ERGONOMIA)] Mais de uma pessoa usa ao mesmo tempo?",
      "15. Crianças e segurança",
      "[15. Crianças e segurança] Sim",
      "[15. Crianças e segurança] Não",
      "[15. Crianças e segurança] Gavetas com trava",
      "[15. Crianças e segurança] Alturas seguras",
      "[15. Crianças e segurança] Evitar cantos vivos",
      "[15. Crianças e segurança] Distância do fogão",
      "[15. Crianças e segurança] Organização de facas",
      "20. Checklist técnico",
      "[20. Checklist técnico] Planta disponível?",
      "[20. Checklist técnico] Pontos hidráulicos definidos?",
      "[20. Checklist técnico] Pontos elétricos definidos?",
      "[20. Checklist técnico] Gás definido?",
      "[20. Checklist técnico] Revestimentos definidos?",
      "[20. Checklist técnico] Pedra definida?",
      "[20. Checklist técnico] Obra pronta para medição?",
      "[20. Checklist técnico] Fotos do local?",
      "22. Resumo para o projetista"
    ]
  },
  "despensa": {
    "slug": "despensa",
    "titulo": "Despensa",
    "subtitulo": "Setorização de mantimentos, eletroportáteis, ventilação e fluxo com cozinha",
    "arquivoPdfOriginal": "BRIEFING DESPENSA.pdf",
    "secoes": [
      {
        "id": "despensa_sec_1",
        "titulo": "2. Objetivo do ambiente",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "2. Objetivo do ambiente",
            "pergunta": "Qual o principal papel da despensa?",
            "secao": "2. Objetivo do ambiente"
          },
          {
            "tipo": "emocional",
            "rotulo": "Pergunta emocional:",
            "pergunta": "O que você quer sentir ao abrir sua despensa?",
            "secao": "2. Objetivo do ambiente"
          }
        ],
        "itens": [
          "Armazenamento de alimentos",
          "Organização da cozinha",
          "Apoio funcional no dia a dia",
          "Estoque da casa",
          "Complemento de alto padrão",
          "Organização",
          "Praticidade",
          "Facilidade",
          "Controle",
          "Tranquilidade"
        ],
        "conteudoLinhas": [
          "Qual o principal papel da despensa?",
          "   Armazenamento de alimentos",
          "   Organização da cozinha",
          "   Apoio funcional no dia a dia",
          "   Estoque da casa",
          "   Complemento de alto padrão",
          "[Pergunta emocional:] O que você quer sentir ao abrir sua despensa?",
          "   Organização",
          "   Praticidade",
          "   Facilidade",
          "   Controle",
          "   Tranquilidade"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Qual o principal papel da despensa?",
            "itens": [
              "Armazenamento de alimentos",
              "Organização da cozinha",
              "Apoio funcional no dia a dia",
              "Estoque da casa",
              "Complemento de alto padrão"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta emocional:",
            "texto": "O que você quer sentir ao abrir sua despensa?",
            "tipoPergunta": "emocional",
            "itens": [
              "Organização",
              "Praticidade",
              "Facilidade",
              "Controle",
              "Tranquilidade"
            ]
          }
        ]
      },
      {
        "id": "despensa_sec_2",
        "titulo": "3. Rotina de uso",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Hoje sua despensa ajuda ou atrapalha sua rotina?",
            "secao": "3. Rotina de uso"
          }
        ],
        "itens": [
          "Frequência:",
          "Diária",
          "Semanal",
          "Eventual",
          "Quem utiliza:",
          "Cliente",
          "Cônjuge",
          "Funcionária"
        ],
        "conteudoLinhas": [
          "   Frequência:",
          "o Diária",
          "o Semanal",
          "o Eventual",
          "   Quem utiliza:",
          "o Cliente",
          "o Cônjuge",
          "o Funcionária",
          "[Pergunta-chave:] Hoje sua despensa ajuda ou atrapalha sua rotina?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Frequência:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Diária"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Semanal"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Eventual"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Quem utiliza:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cliente"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cônjuge"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Funcionária"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Hoje sua despensa ajuda ou atrapalha sua rotina?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "despensa_sec_3",
        "titulo": "4. Volume de armazenamento",
        "perguntasDestaque": [],
        "itens": [
          "Baixo",
          "Médio",
          "Alto",
          "Alimentos secos",
          "Bebidas",
          "Compras em grande volume",
          "Estoque mensal",
          "Produtos específicos (fitness, gourmet, etc.)"
        ],
        "conteudoLinhas": [
          "Quantidade de itens:",
          "   Baixo",
          "   Médio",
          "   Alto",
          "Tipos de itens:",
          "   Alimentos secos",
          "   Bebidas",
          "   Compras em grande volume",
          "   Estoque mensal",
          "   Produtos específicos (fitness, gourmet, etc.)"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Quantidade de itens:",
            "itens": [
              "Baixo",
              "Médio",
              "Alto"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Tipos de itens:",
            "itens": [
              "Alimentos secos",
              "Bebidas",
              "Compras em grande volume",
              "Estoque mensal",
              "Produtos específicos (fitness, gourmet, etc.)"
            ]
          }
        ]
      },
      {
        "id": "despensa_sec_4",
        "titulo": "5. Organização",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "Pergunta estratégica:",
            "pergunta": "Você quer ver tudo de forma rápida ou prefere manter mais discreto?",
            "secao": "5. Organização"
          }
        ],
        "itens": [
          "Tudo visível",
          "Tudo fechado",
          "Misto",
          "Prateleiras abertas",
          "Cestos organizadores",
          "Gavetas",
          "Nichos",
          "Divisórias"
        ],
        "conteudoLinhas": [
          "Preferência:",
          "   Tudo visível",
          "   Tudo fechado",
          "   Misto",
          "Soluções:",
          "   Prateleiras abertas",
          "   Cestos organizadores",
          "   Gavetas",
          "   Nichos",
          "   Divisórias",
          "[Pergunta estratégica:] Você quer ver tudo de forma rápida ou prefere manter mais discreto?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Preferência:",
            "itens": [
              "Tudo visível",
              "Tudo fechado",
              "Misto"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Soluções:",
            "itens": [
              "Prateleiras abertas",
              "Cestos organizadores",
              "Gavetas",
              "Nichos",
              "Divisórias"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta estratégica:",
            "texto": "Você quer ver tudo de forma rápida ou prefere manter mais discreto?",
            "tipoPergunta": "estrategica",
            "itens": []
          }
        ]
      },
      {
        "id": "despensa_sec_5",
        "titulo": "6. Setorização (IMPORTANTE)",
        "perguntasDestaque": [],
        "itens": [
          "Tipo de alimento",
          "Frequência de uso",
          "Tamanho das embalagens",
          "Bebidas separadas"
        ],
        "conteudoLinhas": [
          "Separação por:",
          "   Tipo de alimento",
          "   Frequência de uso",
          "   Tamanho das embalagens",
          "   Bebidas separadas"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Separação por:",
            "itens": [
              "Tipo de alimento",
              "Frequência de uso",
              "Tamanho das embalagens",
              "Bebidas separadas"
            ]
          }
        ]
      },
      {
        "id": "despensa_sec_6",
        "titulo": "7. Fluxo com a cozinha (CRÍTICO)",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "7. Fluxo com a cozinha (CRÍTICO)",
            "pergunta": "Próxima da área de preparo?",
            "secao": "7. Fluxo com a cozinha (CRÍTICO)"
          },
          {
            "tipo": "estrategica",
            "rotulo": "7. Fluxo com a cozinha (CRÍTICO)",
            "pergunta": "Integração com cozinha?",
            "secao": "7. Fluxo com a cozinha (CRÍTICO)"
          },
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Você quer que o acesso seja rápido durante o preparo?",
            "secao": "7. Fluxo com a cozinha (CRÍTICO)"
          }
        ],
        "itens": [
          "Acesso fácil?",
          "Próxima da área de preparo?",
          "Integração com cozinha?"
        ],
        "conteudoLinhas": [
          "   Acesso fácil?",
          "   Próxima da área de preparo?",
          "   Integração com cozinha?",
          "[Pergunta-chave:] Você quer que o acesso seja rápido durante o preparo?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Acesso fácil?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Próxima da área de preparo?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Integração com cozinha?"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Você quer que o acesso seja rápido durante o preparo?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "despensa_sec_7",
        "titulo": "8. Ergonomia",
        "perguntasDestaque": [],
        "itens": [
          "Altura de acesso confortável",
          "Itens do dia a dia em posição fácil",
          "Itens de estoque em áreas superiores"
        ],
        "conteudoLinhas": [
          "   Altura de acesso confortável",
          "   Itens do dia a dia em posição fácil",
          "   Itens de estoque em áreas superiores"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Altura de acesso confortável"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Itens do dia a dia em posição fácil"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Itens de estoque em áreas superiores"
            ]
          }
        ]
      },
      {
        "id": "despensa_sec_8",
        "titulo": "9. Iluminação",
        "perguntasDestaque": [],
        "itens": [
          "Luz geral",
          "Iluminação interna",
          "Luz funcional"
        ],
        "conteudoLinhas": [
          "   Luz geral",
          "   Iluminação interna",
          "   Luz funcional"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Luz geral"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Iluminação interna"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz funcional"
            ]
          }
        ]
      },
      {
        "id": "despensa_sec_9",
        "titulo": "10. Estética",
        "perguntasDestaque": [],
        "itens": [
          "Funcional",
          "Clean",
          "Sofisticada",
          "Discreta",
          "Resistentes",
          "Fáceis de limpar"
        ],
        "conteudoLinhas": [
          "   Funcional",
          "   Clean",
          "   Sofisticada",
          "   Discreta",
          "Materiais:",
          "   Resistentes",
          "   Fáceis de limpar"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Funcional"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Clean"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Sofisticada"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Discreta"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Materiais:",
            "itens": [
              "Resistentes",
              "Fáceis de limpar"
            ]
          }
        ]
      },
      {
        "id": "despensa_sec_10",
        "titulo": "11. Manutenção",
        "perguntasDestaque": [],
        "itens": [
          "Facilidade de limpeza",
          "Resistência a sujeira",
          "Organização constante"
        ],
        "conteudoLinhas": [
          "   Facilidade de limpeza",
          "   Resistência a sujeira",
          "   Organização constante"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Facilidade de limpeza"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Resistência a sujeira"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Organização constante"
            ]
          }
        ]
      },
      {
        "id": "despensa_sec_11",
        "titulo": "12. Pontos de dor",
        "perguntasDestaque": [],
        "itens": [
          "Bagunça",
          "Falta de espaço",
          "Dificuldade de encontrar itens",
          "Acúmulo desorganizado"
        ],
        "conteudoLinhas": [
          "   Bagunça",
          "   Falta de espaço",
          "   Dificuldade de encontrar itens",
          "   Acúmulo desorganizado"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Bagunça"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Falta de espaço"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Dificuldade de encontrar itens"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Acúmulo desorganizado"
            ]
          }
        ]
      },
      {
        "id": "despensa_sec_12",
        "titulo": "13. Perguntas de aprofundamento",
        "perguntasDestaque": [
          {
            "tipo": "profunda",
            "rotulo": "13. Perguntas de aprofundamento",
            "pergunta": "Você costuma fazer compras grandes ou pequenas?",
            "secao": "13. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "13. Perguntas de aprofundamento",
            "pergunta": "Você gosta de manter estoque em casa?",
            "secao": "13. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "13. Perguntas de aprofundamento",
            "pergunta": "O que mais te incomoda hoje na sua organização?",
            "secao": "13. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "13. Perguntas de aprofundamento",
            "pergunta": "Você prefere praticidade ou estética nesse ambiente?",
            "secao": "13. Perguntas de aprofundamento"
          }
        ],
        "itens": [
          "Você costuma fazer compras grandes ou pequenas?",
          "Você gosta de manter estoque em casa?",
          "O que mais te incomoda hoje na sua organização?",
          "Você prefere praticidade ou estética nesse ambiente?"
        ],
        "conteudoLinhas": [
          "   Você costuma fazer compras grandes ou pequenas?",
          "   Você gosta de manter estoque em casa?",
          "   O que mais te incomoda hoje na sua organização?",
          "   Você prefere praticidade ou estética nesse ambiente?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Você costuma fazer compras grandes ou pequenas?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você gosta de manter estoque em casa?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "O que mais te incomoda hoje na sua organização?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você prefere praticidade ou estética nesse ambiente?"
            ]
          }
        ]
      },
      {
        "id": "despensa_sec_13",
        "titulo": "14. Investimento e prioridade",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "14. Investimento e prioridade",
            "pergunta": "Já tem previsão?",
            "secao": "14. Investimento e prioridade"
          }
        ],
        "itens": [
          "Já tem previsão?",
          "Prioriza:",
          "Organização",
          "Funcionalidade",
          "Estética",
          "Custo-benefício"
        ],
        "conteudoLinhas": [
          "   Já tem previsão?",
          "   Prioriza:",
          "o Organização",
          "o Funcionalidade",
          "o Estética",
          "o Custo-benefício"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Já tem previsão?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Prioriza:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Organização"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Funcionalidade"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Estética"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Custo-benefício"
            ]
          }
        ]
      },
      {
        "id": "despensa_sec_14",
        "titulo": "15. Checklist técnico",
        "perguntasDestaque": [],
        "itens": [
          "Medidas do espaço",
          "Integração com cozinha",
          "Ventilação",
          "Iluminação",
          "Acesso"
        ],
        "conteudoLinhas": [
          "   Medidas do espaço",
          "   Integração com cozinha",
          "   Ventilação",
          "   Iluminação",
          "   Acesso"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Medidas do espaço"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Integração com cozinha"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ventilação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Iluminação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Acesso"
            ]
          }
        ]
      },
      {
        "id": "despensa_sec_15",
        "titulo": "16. Resumo para o projetista",
        "perguntasDestaque": [],
        "itens": [],
        "conteudoLinhas": [
          "Volume de uso:",
          "Tipo de armazenamento:",
          "Preferência visual:",
          "Integração:",
          "Itens obrigatórios:",
          "Pontos críticos:"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Volume de uso:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Tipo de armazenamento:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Preferência visual:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Integração:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Itens obrigatórios:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Pontos críticos:",
            "itens": []
          }
        ]
      }
    ],
    "perguntasEstrategicas": [
      {
        "tipo": "estrategica",
        "rotulo": "2. Objetivo do ambiente",
        "pergunta": "Qual o principal papel da despensa?",
        "secao": "2. Objetivo do ambiente"
      },
      {
        "tipo": "emocional",
        "rotulo": "Pergunta emocional:",
        "pergunta": "O que você quer sentir ao abrir sua despensa?",
        "secao": "2. Objetivo do ambiente"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Hoje sua despensa ajuda ou atrapalha sua rotina?",
        "secao": "3. Rotina de uso"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Pergunta estratégica:",
        "pergunta": "Você quer ver tudo de forma rápida ou prefere manter mais discreto?",
        "secao": "5. Organização"
      },
      {
        "tipo": "estrategica",
        "rotulo": "7. Fluxo com a cozinha (CRÍTICO)",
        "pergunta": "Próxima da área de preparo?",
        "secao": "7. Fluxo com a cozinha (CRÍTICO)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "7. Fluxo com a cozinha (CRÍTICO)",
        "pergunta": "Integração com cozinha?",
        "secao": "7. Fluxo com a cozinha (CRÍTICO)"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Você quer que o acesso seja rápido durante o preparo?",
        "secao": "7. Fluxo com a cozinha (CRÍTICO)"
      },
      {
        "tipo": "profunda",
        "rotulo": "13. Perguntas de aprofundamento",
        "pergunta": "Você costuma fazer compras grandes ou pequenas?",
        "secao": "13. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "13. Perguntas de aprofundamento",
        "pergunta": "Você gosta de manter estoque em casa?",
        "secao": "13. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "13. Perguntas de aprofundamento",
        "pergunta": "O que mais te incomoda hoje na sua organização?",
        "secao": "13. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "13. Perguntas de aprofundamento",
        "pergunta": "Você prefere praticidade ou estética nesse ambiente?",
        "secao": "13. Perguntas de aprofundamento"
      },
      {
        "tipo": "estrategica",
        "rotulo": "14. Investimento e prioridade",
        "pergunta": "Já tem previsão?",
        "secao": "14. Investimento e prioridade"
      }
    ],
    "topicosChecagemTecnica": [
      "7. Fluxo com a cozinha (CRÍTICO)",
      "[7. Fluxo com a cozinha (CRÍTICO)] Acesso fácil?",
      "[7. Fluxo com a cozinha (CRÍTICO)] Próxima da área de preparo?",
      "[7. Fluxo com a cozinha (CRÍTICO)] Integração com cozinha?",
      "8. Ergonomia",
      "15. Checklist técnico",
      "[15. Checklist técnico] Medidas do espaço",
      "[15. Checklist técnico] Integração com cozinha",
      "[15. Checklist técnico] Ventilação",
      "[15. Checklist técnico] Iluminação",
      "[15. Checklist técnico] Acesso",
      "16. Resumo para o projetista"
    ]
  },
  "hall_entrada": {
    "slug": "hall_entrada",
    "titulo": "Hall de Entrada",
    "subtitulo": "Impacto visual na recepção, sapateira de apoio, espelhos e circulação",
    "arquivoPdfOriginal": "BRIEFING HALL DE ENTRADA.pdf",
    "secoes": [
      {
        "id": "hall_entrada_sec_1",
        "titulo": "2. Objetivo do ambiente",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "2. Objetivo do ambiente",
            "pergunta": "Qual o papel do hall?",
            "secao": "2. Objetivo do ambiente"
          },
          {
            "tipo": "emocional",
            "rotulo": "Pergunta emocional:",
            "pergunta": "Qual a sensação que você quer causar quando alguém entra na sua casa?",
            "secao": "2. Objetivo do ambiente"
          }
        ],
        "itens": [
          "Recepção dos convidados",
          "Transição entre externo e interno",
          "Elemento de impacto visual",
          "Organização do dia a dia",
          "Espaço funcional (apoio)",
          "Impacto",
          "Elegância",
          "Aconchego",
          "Sofisticação",
          "Leveza",
          "Organização"
        ],
        "conteudoLinhas": [
          "Qual o papel do hall?",
          "   Recepção dos convidados",
          "   Transição entre externo e interno",
          "   Elemento de impacto visual",
          "   Organização do dia a dia",
          "   Espaço funcional (apoio)",
          "[Pergunta emocional:] Qual a sensação que você quer causar quando alguém entra na sua casa?",
          "   Impacto",
          "   Elegância",
          "   Aconchego",
          "   Sofisticação",
          "   Leveza",
          "   Organização"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Qual o papel do hall?",
            "itens": [
              "Recepção dos convidados",
              "Transição entre externo e interno",
              "Elemento de impacto visual",
              "Organização do dia a dia",
              "Espaço funcional (apoio)"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta emocional:",
            "texto": "Qual a sensação que você quer causar quando alguém entra na sua casa?",
            "tipoPergunta": "emocional",
            "itens": [
              "Impacto",
              "Elegância",
              "Aconchego",
              "Sofisticação",
              "Leveza",
              "Organização"
            ]
          }
        ]
      },
      {
        "id": "hall_entrada_sec_2",
        "titulo": "3. Tipo de uso",
        "perguntasDestaque": [],
        "itens": [
          "Uso apenas decorativo",
          "Uso funcional diário",
          "Ambos",
          "Apoio para bolsas",
          "Apoio para chaves",
          "Apoio para correspondências",
          "Sapatos",
          "Casacos"
        ],
        "conteudoLinhas": [
          "   Uso apenas decorativo",
          "   Uso funcional diário",
          "   Ambos",
          "Funções desejadas:",
          "   Apoio para bolsas",
          "   Apoio para chaves",
          "   Apoio para correspondências",
          "   Sapatos",
          "   Casacos"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Uso apenas decorativo"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Uso funcional diário"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ambos"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Funções desejadas:",
            "itens": [
              "Apoio para bolsas",
              "Apoio para chaves",
              "Apoio para correspondências",
              "Sapatos",
              "Casacos"
            ]
          }
        ]
      },
      {
        "id": "hall_entrada_sec_3",
        "titulo": "4. Perfil do cliente",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Você prefere um hall mais “bonito” ou mais “funcional”?",
            "secao": "4. Perfil do cliente"
          }
        ],
        "itens": [
          "Mais prático",
          "Mais estético",
          "Mais organizado",
          "Mais visual"
        ],
        "conteudoLinhas": [
          "   Mais prático",
          "   Mais estético",
          "   Mais organizado",
          "   Mais visual",
          "[Pergunta-chave:] Você prefere um hall mais “bonito” ou mais “funcional”?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Mais prático"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Mais estético"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Mais organizado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Mais visual"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Você prefere um hall mais “bonito” ou mais “funcional”?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "hall_entrada_sec_4",
        "titulo": "5. Elementos desejados",
        "perguntasDestaque": [],
        "itens": [
          "Aparador",
          "Painel",
          "Espelho",
          "Cabideiro",
          "Banco",
          "Nichos",
          "Gavetas",
          "Porta-objetos",
          "Iluminação decorativa"
        ],
        "conteudoLinhas": [
          "O ambiente pode ter:",
          "   Aparador",
          "   Painel",
          "   Espelho",
          "   Cabideiro",
          "   Banco",
          "   Nichos",
          "   Gavetas",
          "   Porta-objetos",
          "   Iluminação decorativa"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "O ambiente pode ter:",
            "itens": [
              "Aparador",
              "Painel",
              "Espelho",
              "Cabideiro",
              "Banco",
              "Nichos",
              "Gavetas",
              "Porta-objetos",
              "Iluminação decorativa"
            ]
          }
        ]
      },
      {
        "id": "hall_entrada_sec_5",
        "titulo": "6. Espelho (muito comum)",
        "perguntasDestaque": [],
        "itens": [
          "Sim / Não",
          "Corpo inteiro",
          "Decorativo",
          "Funcional",
          "Ampliar o espaço",
          "Uso no dia a dia",
          "Composição estética"
        ],
        "conteudoLinhas": [
          "   Sim / Não",
          "   Corpo inteiro",
          "   Decorativo",
          "   Funcional",
          "Função:",
          "   Ampliar o espaço",
          "   Uso no dia a dia",
          "   Composição estética"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Sim / Não"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Corpo inteiro"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Decorativo"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Funcional"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Função:",
            "itens": [
              "Ampliar o espaço",
              "Uso no dia a dia",
              "Composição estética"
            ]
          }
        ]
      },
      {
        "id": "hall_entrada_sec_6",
        "titulo": "7. Armazenamento",
        "perguntasDestaque": [],
        "itens": [
          "Chaves",
          "Carteiras",
          "Óculos",
          "Bolsas",
          "Correspondências",
          "Sapatos",
          "Tudo escondido",
          "Parte visível",
          "Totalmente aberto"
        ],
        "conteudoLinhas": [
          "Precisa guardar:",
          "   Chaves",
          "   Carteiras",
          "   Óculos",
          "   Bolsas",
          "   Correspondências",
          "   Sapatos",
          "Preferência:",
          "   Tudo escondido",
          "   Parte visível",
          "   Totalmente aberto"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Precisa guardar:",
            "itens": [
              "Chaves",
              "Carteiras",
              "Óculos",
              "Bolsas",
              "Correspondências",
              "Sapatos"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Preferência:",
            "itens": [
              "Tudo escondido",
              "Parte visível",
              "Totalmente aberto"
            ]
          }
        ]
      },
      {
        "id": "hall_entrada_sec_7",
        "titulo": "8. Circulação (CRÍTICO)",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "8. Circulação (CRÍTICO)",
            "pergunta": "Espaço amplo ou reduzido?",
            "secao": "8. Circulação (CRÍTICO)"
          },
          {
            "tipo": "estrategica",
            "rotulo": "8. Circulação (CRÍTICO)",
            "pergunta": "Interfere na passagem?",
            "secao": "8. Circulação (CRÍTICO)"
          },
          {
            "tipo": "estrategica",
            "rotulo": "8. Circulação (CRÍTICO)",
            "pergunta": "Fluxo de entrada e saída livre?",
            "secao": "8. Circulação (CRÍTICO)"
          }
        ],
        "itens": [
          "Espaço amplo ou reduzido?",
          "Interfere na passagem?",
          "Fluxo de entrada e saída livre?"
        ],
        "conteudoLinhas": [
          "   Espaço amplo ou reduzido?",
          "   Interfere na passagem?",
          "   Fluxo de entrada e saída livre?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Espaço amplo ou reduzido?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Interfere na passagem?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Fluxo de entrada e saída livre?"
            ]
          }
        ]
      },
      {
        "id": "hall_entrada_sec_8",
        "titulo": "9. Integração com a casa",
        "perguntasDestaque": [],
        "itens": [
          "Living",
          "Sala de jantar",
          "Corredor",
          "Escada",
          "Destaque logo na entrada",
          "Integração suave",
          "Discrição"
        ],
        "conteudoLinhas": [
          "O hall se conecta com:",
          "   Living",
          "   Sala de jantar",
          "   Corredor",
          "   Escada",
          "O cliente deseja:",
          "   Destaque logo na entrada",
          "   Integração suave",
          "   Discrição"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "O hall se conecta com:",
            "itens": [
              "Living",
              "Sala de jantar",
              "Corredor",
              "Escada"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "O cliente deseja:",
            "itens": [
              "Destaque logo na entrada",
              "Integração suave",
              "Discrição"
            ]
          }
        ]
      },
      {
        "id": "hall_entrada_sec_9",
        "titulo": "10. Estilo visual",
        "perguntasDestaque": [],
        "itens": [
          "Sofisticado",
          "Moderno",
          "Minimalista",
          "Aconchegante",
          "Neutro",
          "Marcante",
          "Madeira",
          "Laca",
          "Vidro",
          "Espelho",
          "Pedra",
          "Metal"
        ],
        "conteudoLinhas": [
          "   Sofisticado",
          "   Moderno",
          "   Minimalista",
          "   Aconchegante",
          "   Neutro",
          "   Marcante",
          "Materiais:",
          "   Madeira",
          "   Laca",
          "   Vidro",
          "   Espelho",
          "   Pedra",
          "   Metal"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Sofisticado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Moderno"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Minimalista"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Aconchegante"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Neutro"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Marcante"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Materiais:",
            "itens": [
              "Madeira",
              "Laca",
              "Vidro",
              "Espelho",
              "Pedra",
              "Metal"
            ]
          }
        ]
      },
      {
        "id": "hall_entrada_sec_10",
        "titulo": "11. Iluminação (DIFERENCIAL FORTE)",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Você quer que esse espaço tenha destaque principalmente à noite?",
            "secao": "11. Iluminação (DIFERENCIAL FORTE)"
          }
        ],
        "itens": [
          "Luz indireta",
          "Luz decorativa",
          "Destaque em painel",
          "Destaque em objeto"
        ],
        "conteudoLinhas": [
          "   Luz indireta",
          "   Luz decorativa",
          "   Destaque em painel",
          "   Destaque em objeto",
          "[Pergunta-chave:] Você quer que esse espaço tenha destaque principalmente à noite?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Luz indireta"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz decorativa"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Destaque em painel"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Destaque em objeto"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Você quer que esse espaço tenha destaque principalmente à noite?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "hall_entrada_sec_11",
        "titulo": "12. Decoração",
        "perguntasDestaque": [
          {
            "tipo": "geral",
            "rotulo": "Pergunta:",
            "pergunta": "Você gosta de elementos decorativos ou prefere algo mais limpo?",
            "secao": "12. Decoração"
          }
        ],
        "itens": [
          "Quadros",
          "Objetos",
          "Esculturas",
          "Vasos",
          "Plantas"
        ],
        "conteudoLinhas": [
          "   Quadros",
          "   Objetos",
          "   Esculturas",
          "   Vasos",
          "   Plantas",
          "[Pergunta:] Você gosta de elementos decorativos ou prefere algo mais limpo?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Quadros"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Objetos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Esculturas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Vasos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Plantas"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta:",
            "texto": "Você gosta de elementos decorativos ou prefere algo mais limpo?",
            "tipoPergunta": "geral",
            "itens": []
          }
        ]
      },
      {
        "id": "hall_entrada_sec_12",
        "titulo": "13. Segurança (quando aplicável)",
        "perguntasDestaque": [],
        "itens": [
          "Controle de acesso",
          "Interfone",
          "Espaço para apoio ao entrar"
        ],
        "conteudoLinhas": [
          "   Controle de acesso",
          "   Interfone",
          "   Espaço para apoio ao entrar"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Controle de acesso"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Interfone"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espaço para apoio ao entrar"
            ]
          }
        ]
      },
      {
        "id": "hall_entrada_sec_13",
        "titulo": "14. Pontos de dor",
        "perguntasDestaque": [],
        "itens": [
          "Falta de organização",
          "Espaço mal aproveitado",
          "Ambiente sem identidade",
          "Entrada “sem graça”",
          "Bagunça com objetos"
        ],
        "conteudoLinhas": [
          "   Falta de organização",
          "   Espaço mal aproveitado",
          "   Ambiente sem identidade",
          "   Entrada “sem graça”",
          "   Bagunça com objetos"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Falta de organização"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espaço mal aproveitado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ambiente sem identidade"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Entrada “sem graça”"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Bagunça com objetos"
            ]
          }
        ]
      },
      {
        "id": "hall_entrada_sec_14",
        "titulo": "15. Uso no dia a dia",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "15. Uso no dia a dia",
            "pergunta": "Tira sapato ao entrar?",
            "secao": "15. Uso no dia a dia"
          },
          {
            "tipo": "estrategica",
            "rotulo": "15. Uso no dia a dia",
            "pergunta": "Chega com compras?",
            "secao": "15. Uso no dia a dia"
          }
        ],
        "itens": [
          "Tira sapato ao entrar?",
          "Apoia bolsas?",
          "Guarda chaves?",
          "Chega com compras?"
        ],
        "conteudoLinhas": [
          "   Tira sapato ao entrar?",
          "   Apoia bolsas?",
          "   Guarda chaves?",
          "   Chega com compras?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Tira sapato ao entrar?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Apoia bolsas?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Guarda chaves?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Chega com compras?"
            ]
          }
        ]
      },
      {
        "id": "hall_entrada_sec_15",
        "titulo": "16. Perguntas de aprofundamento",
        "perguntasDestaque": [
          {
            "tipo": "profunda",
            "rotulo": "16. Perguntas de aprofundamento",
            "pergunta": "O que você gostaria que as pessoas pensassem ao entrar na sua casa?",
            "secao": "16. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "16. Perguntas de aprofundamento",
            "pergunta": "Você usa esse espaço no dia a dia ou ele é mais decorativo?",
            "secao": "16. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "16. Perguntas de aprofundamento",
            "pergunta": "Existe algo que te incomoda na sua entrada atual?",
            "secao": "16. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "16. Perguntas de aprofundamento",
            "pergunta": "Você quer um ambiente mais impactante ou mais discreto?",
            "secao": "16. Perguntas de aprofundamento"
          }
        ],
        "itens": [
          "O que você gostaria que as pessoas pensassem ao entrar na sua casa?",
          "Você usa esse espaço no dia a dia ou ele é mais decorativo?",
          "Existe algo que te incomoda na sua entrada atual?",
          "Você quer um ambiente mais impactante ou mais discreto?"
        ],
        "conteudoLinhas": [
          "   O que você gostaria que as pessoas pensassem ao entrar na sua casa?",
          "   Você usa esse espaço no dia a dia ou ele é mais decorativo?",
          "   Existe algo que te incomoda na sua entrada atual?",
          "   Você quer um ambiente mais impactante ou mais discreto?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "O que você gostaria que as pessoas pensassem ao entrar na sua casa?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você usa esse espaço no dia a dia ou ele é mais decorativo?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Existe algo que te incomoda na sua entrada atual?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você quer um ambiente mais impactante ou mais discreto?"
            ]
          }
        ]
      },
      {
        "id": "hall_entrada_sec_16",
        "titulo": "17. Investimento e prioridade",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "17. Investimento e prioridade",
            "pergunta": "Já tem previsão?",
            "secao": "17. Investimento e prioridade"
          }
        ],
        "itens": [
          "Já tem previsão?",
          "Prioriza:",
          "Estética",
          "Funcionalidade",
          "Impacto visual",
          "Custo-benefício"
        ],
        "conteudoLinhas": [
          "   Já tem previsão?",
          "   Prioriza:",
          "o Estética",
          "o Funcionalidade",
          "o Impacto visual",
          "o Custo-benefício"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Já tem previsão?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Prioriza:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Estética"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Funcionalidade"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Impacto visual"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Custo-benefício"
            ]
          }
        ]
      },
      {
        "id": "hall_entrada_sec_17",
        "titulo": "18. Checklist técnico",
        "perguntasDestaque": [],
        "itens": [
          "Medidas do espaço",
          "Interferência com portas",
          "Circulação",
          "Pontos de iluminação",
          "Integração com outros ambientes"
        ],
        "conteudoLinhas": [
          "   Medidas do espaço",
          "   Interferência com portas",
          "   Circulação",
          "   Pontos de iluminação",
          "   Integração com outros ambientes"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Medidas do espaço"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Interferência com portas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Circulação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Pontos de iluminação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Integração com outros ambientes"
            ]
          }
        ]
      },
      {
        "id": "hall_entrada_sec_18",
        "titulo": "19. Resumo para o projetista",
        "perguntasDestaque": [],
        "itens": [],
        "conteudoLinhas": [
          "Função principal:",
          "Uso diário:",
          "Nível de destaque:",
          "Estilo:",
          "Itens obrigatórios:",
          "Integração:",
          "Pontos críticos:"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Função principal:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Uso diário:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Nível de destaque:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Estilo:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Itens obrigatórios:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Integração:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Pontos críticos:",
            "itens": []
          }
        ]
      }
    ],
    "perguntasEstrategicas": [
      {
        "tipo": "estrategica",
        "rotulo": "2. Objetivo do ambiente",
        "pergunta": "Qual o papel do hall?",
        "secao": "2. Objetivo do ambiente"
      },
      {
        "tipo": "emocional",
        "rotulo": "Pergunta emocional:",
        "pergunta": "Qual a sensação que você quer causar quando alguém entra na sua casa?",
        "secao": "2. Objetivo do ambiente"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Você prefere um hall mais “bonito” ou mais “funcional”?",
        "secao": "4. Perfil do cliente"
      },
      {
        "tipo": "estrategica",
        "rotulo": "8. Circulação (CRÍTICO)",
        "pergunta": "Espaço amplo ou reduzido?",
        "secao": "8. Circulação (CRÍTICO)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "8. Circulação (CRÍTICO)",
        "pergunta": "Interfere na passagem?",
        "secao": "8. Circulação (CRÍTICO)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "8. Circulação (CRÍTICO)",
        "pergunta": "Fluxo de entrada e saída livre?",
        "secao": "8. Circulação (CRÍTICO)"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Você quer que esse espaço tenha destaque principalmente à noite?",
        "secao": "11. Iluminação (DIFERENCIAL FORTE)"
      },
      {
        "tipo": "geral",
        "rotulo": "Pergunta:",
        "pergunta": "Você gosta de elementos decorativos ou prefere algo mais limpo?",
        "secao": "12. Decoração"
      },
      {
        "tipo": "estrategica",
        "rotulo": "15. Uso no dia a dia",
        "pergunta": "Tira sapato ao entrar?",
        "secao": "15. Uso no dia a dia"
      },
      {
        "tipo": "estrategica",
        "rotulo": "15. Uso no dia a dia",
        "pergunta": "Chega com compras?",
        "secao": "15. Uso no dia a dia"
      },
      {
        "tipo": "profunda",
        "rotulo": "16. Perguntas de aprofundamento",
        "pergunta": "O que você gostaria que as pessoas pensassem ao entrar na sua casa?",
        "secao": "16. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "16. Perguntas de aprofundamento",
        "pergunta": "Você usa esse espaço no dia a dia ou ele é mais decorativo?",
        "secao": "16. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "16. Perguntas de aprofundamento",
        "pergunta": "Existe algo que te incomoda na sua entrada atual?",
        "secao": "16. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "16. Perguntas de aprofundamento",
        "pergunta": "Você quer um ambiente mais impactante ou mais discreto?",
        "secao": "16. Perguntas de aprofundamento"
      },
      {
        "tipo": "estrategica",
        "rotulo": "17. Investimento e prioridade",
        "pergunta": "Já tem previsão?",
        "secao": "17. Investimento e prioridade"
      }
    ],
    "topicosChecagemTecnica": [
      "8. Circulação (CRÍTICO)",
      "13. Segurança (quando aplicável)",
      "[13. Segurança (quando aplicável)] Controle de acesso",
      "[13. Segurança (quando aplicável)] Interfone",
      "[13. Segurança (quando aplicável)] Espaço para apoio ao entrar",
      "18. Checklist técnico",
      "[18. Checklist técnico] Medidas do espaço",
      "[18. Checklist técnico] Interferência com portas",
      "[18. Checklist técnico] Circulação",
      "[18. Checklist técnico] Pontos de iluminação",
      "[18. Checklist técnico] Integração com outros ambientes",
      "19. Resumo para o projetista"
    ]
  },
  "home_office": {
    "slug": "home_office",
    "titulo": "Home Office",
    "subtitulo": "Ergonomia, monitores, tomadas/fiação, reuniões em vídeo e armazenamento",
    "arquivoPdfOriginal": "BRIEFING HOME OFFICE.pdf",
    "secoes": [
      {
        "id": "home_office_sec_1",
        "titulo": "2. Objetivo do ambiente",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "2. Objetivo do ambiente",
            "pergunta": "Qual é a principal função do home office?",
            "secao": "2. Objetivo do ambiente"
          },
          {
            "tipo": "emocional",
            "rotulo": "Pergunta emocional:",
            "pergunta": "O que você quer sentir trabalhando nesse ambiente?",
            "secao": "2. Objetivo do ambiente"
          }
        ],
        "itens": [
          "Trabalho diário",
          "Uso ocasional",
          "Estudo",
          "Reuniões online",
          "Gestão de empresa",
          "Uso compartilhado",
          "Apoio para tarefas rápidas",
          "Foco",
          "Produtividade",
          "Conforto",
          "Organização",
          "Inspiração",
          "Tranquilidade"
        ],
        "conteudoLinhas": [
          "Qual é a principal função do home office?",
          "   Trabalho diário",
          "   Uso ocasional",
          "   Estudo",
          "   Reuniões online",
          "   Gestão de empresa",
          "   Uso compartilhado",
          "   Apoio para tarefas rápidas",
          "[Pergunta emocional:] O que você quer sentir trabalhando nesse ambiente?",
          "   Foco",
          "   Produtividade",
          "   Conforto",
          "   Organização",
          "   Inspiração",
          "   Tranquilidade"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Qual é a principal função do home office?",
            "itens": [
              "Trabalho diário",
              "Uso ocasional",
              "Estudo",
              "Reuniões online",
              "Gestão de empresa",
              "Uso compartilhado",
              "Apoio para tarefas rápidas"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta emocional:",
            "texto": "O que você quer sentir trabalhando nesse ambiente?",
            "tipoPergunta": "emocional",
            "itens": [
              "Foco",
              "Produtividade",
              "Conforto",
              "Organização",
              "Inspiração",
              "Tranquilidade"
            ]
          }
        ]
      },
      {
        "id": "home_office_sec_2",
        "titulo": "3. Rotina de uso",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "3. Rotina de uso",
            "pergunta": "Quantas horas por dia usa?",
            "secao": "3. Rotina de uso"
          },
          {
            "tipo": "estrategica",
            "rotulo": "3. Rotina de uso",
            "pergunta": "Uso contínuo ou pontual?",
            "secao": "3. Rotina de uso"
          }
        ],
        "itens": [
          "Quantas horas por dia usa?",
          "Dias da semana:",
          "Horários (manhã / tarde / noite):",
          "Uso contínuo ou pontual?",
          "Sozinho",
          "Com outra pessoa no mesmo espaço",
          "Recebe clientes/reuniões presenciais"
        ],
        "conteudoLinhas": [
          "   Quantas horas por dia usa?",
          "   Dias da semana:",
          "   Horários (manhã / tarde / noite):",
          "   Uso contínuo ou pontual?",
          "Trabalha:",
          "   Sozinho",
          "   Com outra pessoa no mesmo espaço",
          "   Recebe clientes/reuniões presenciais"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Quantas horas por dia usa?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Dias da semana:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Horários (manhã / tarde / noite):"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Uso contínuo ou pontual?"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Trabalha:",
            "itens": [
              "Sozinho",
              "Com outra pessoa no mesmo espaço",
              "Recebe clientes/reuniões presenciais"
            ]
          }
        ]
      },
      {
        "id": "home_office_sec_3",
        "titulo": "4. Tipo de trabalho (ESSENCIAL)",
        "perguntasDestaque": [],
        "itens": [
          "Computador (leve)",
          "Computador intenso (design, engenharia, etc.)",
          "Documentos físicos",
          "Ligações frequentes",
          "Reuniões online",
          "Criação (design, vídeo, etc.)",
          "Gestão/administrativo"
        ],
        "conteudoLinhas": [
          "O cliente trabalha com:",
          "   Computador (leve)",
          "   Computador intenso (design, engenharia, etc.)",
          "   Documentos físicos",
          "   Ligações frequentes",
          "   Reuniões online",
          "   Criação (design, vídeo, etc.)",
          "   Gestão/administrativo",
          "Impacto direto no projeto."
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "O cliente trabalha com:",
            "itens": [
              "Computador (leve)",
              "Computador intenso (design, engenharia, etc.)",
              "Documentos físicos",
              "Ligações frequentes",
              "Reuniões online",
              "Criação (design, vídeo, etc.)",
              "Gestão/administrativo"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Impacto direto no projeto.",
            "itens": []
          }
        ]
      },
      {
        "id": "home_office_sec_4",
        "titulo": "5. Equipamentos",
        "perguntasDestaque": [],
        "itens": [
          "Notebook",
          "Desktop",
          "Quantos monitores:",
          "Impressora",
          "Scanner",
          "Tablet",
          "Equipamentos específicos",
          "Webcam / iluminação",
          "Fones",
          "Microfone",
          "Roteador",
          "Quantidade de tomadas",
          "Posição dos pontos",
          "Cabos visíveis ou ocultos"
        ],
        "conteudoLinhas": [
          "Listar todos:",
          "   Notebook",
          "   Desktop",
          "   Quantos monitores:",
          "   Impressora",
          "   Scanner",
          "   Tablet",
          "   Equipamentos específicos",
          "   Webcam / iluminação",
          "   Fones",
          "   Microfone",
          "   Roteador",
          "Necessidades:",
          "   Quantidade de tomadas",
          "   Posição dos pontos",
          "   Cabos visíveis ou ocultos"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Listar todos:",
            "itens": [
              "Notebook",
              "Desktop",
              "Quantos monitores:",
              "Impressora",
              "Scanner",
              "Tablet",
              "Equipamentos específicos",
              "Webcam / iluminação",
              "Fones",
              "Microfone",
              "Roteador"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Necessidades:",
            "itens": [
              "Quantidade de tomadas",
              "Posição dos pontos",
              "Cabos visíveis ou ocultos"
            ]
          }
        ]
      },
      {
        "id": "home_office_sec_5",
        "titulo": "6. Ergonomia (CRÍTICO)",
        "perguntasDestaque": [],
        "itens": [
          "Altura do cliente:",
          "Tempo sentado:",
          "Já sente dores? (coluna, pescoço, etc.)",
          "Altura da bancada",
          "Espaço para pernas",
          "Apoio para braços",
          "Distância do monitor",
          "Cadeira ergonômica"
        ],
        "conteudoLinhas": [
          "   Altura do cliente:",
          "   Tempo sentado:",
          "   Já sente dores? (coluna, pescoço, etc.)",
          "Necessidades:",
          "   Altura da bancada",
          "   Espaço para pernas",
          "   Apoio para braços",
          "   Distância do monitor",
          "   Cadeira ergonômica"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Altura do cliente:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tempo sentado:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Já sente dores? (coluna, pescoço, etc.)"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Necessidades:",
            "itens": [
              "Altura da bancada",
              "Espaço para pernas",
              "Apoio para braços",
              "Distância do monitor",
              "Cadeira ergonômica"
            ]
          }
        ]
      },
      {
        "id": "home_office_sec_6",
        "titulo": "7. Bancada de trabalho",
        "perguntasDestaque": [],
        "itens": [
          "Tamanho desejado:",
          "Prefere:",
          "Compacta",
          "Ampla",
          "Precisa de:",
          "Espaço para escrever",
          "Espaço para múltiplos monitores",
          "Área livre",
          "Reta",
          "Em L",
          "Ilha",
          "Retrátil"
        ],
        "conteudoLinhas": [
          "   Tamanho desejado:",
          "   Prefere:",
          "o Compacta",
          "o Ampla",
          "   Precisa de:",
          "o Espaço para escrever",
          "o Espaço para múltiplos monitores",
          "o Área livre",
          "Formato:",
          "   Reta",
          "   Em L",
          "   Ilha",
          "   Retrátil"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Tamanho desejado:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Prefere:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Compacta"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ampla"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Precisa de:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espaço para escrever"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espaço para múltiplos monitores"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Área livre"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Formato:",
            "itens": [
              "Reta",
              "Em L",
              "Ilha",
              "Retrátil"
            ]
          }
        ]
      },
      {
        "id": "home_office_sec_7",
        "titulo": "8. Armazenamento",
        "perguntasDestaque": [],
        "itens": [
          "Documentos",
          "Pastas",
          "Livros",
          "Equipamentos",
          "Materiais de escritório",
          "Itens pessoais",
          "Tudo fechado",
          "Tudo visível",
          "Misto"
        ],
        "conteudoLinhas": [
          "O que precisa guardar:",
          "   Documentos",
          "   Pastas",
          "   Livros",
          "   Equipamentos",
          "   Materiais de escritório",
          "   Itens pessoais",
          "Preferência:",
          "   Tudo fechado",
          "   Tudo visível",
          "   Misto"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "O que precisa guardar:",
            "itens": [
              "Documentos",
              "Pastas",
              "Livros",
              "Equipamentos",
              "Materiais de escritório",
              "Itens pessoais"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Preferência:",
            "itens": [
              "Tudo fechado",
              "Tudo visível",
              "Misto"
            ]
          }
        ]
      },
      {
        "id": "home_office_sec_8",
        "titulo": "9. Organização e comportamento",
        "perguntasDestaque": [],
        "itens": [
          "Muito organizado",
          "Moderado",
          "Bagunceiro",
          "Gavetas",
          "Nichos",
          "Armários",
          "Organizadores internos"
        ],
        "conteudoLinhas": [
          "   Muito organizado",
          "   Moderado",
          "   Bagunceiro",
          "Precisa de:",
          "   Gavetas",
          "   Nichos",
          "      Armários",
          "      Organizadores internos"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Muito organizado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Moderado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Bagunceiro"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Precisa de:",
            "itens": [
              "Gavetas",
              "Nichos",
              "Armários",
              "Organizadores internos"
            ]
          }
        ]
      },
      {
        "id": "home_office_sec_9",
        "titulo": "10. Uso compartilhado",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "10. Uso compartilhado",
            "pergunta": "O ambiente será usado por mais alguém?",
            "secao": "10. Uso compartilhado"
          },
          {
            "tipo": "estrategica",
            "rotulo": "10. Uso compartilhado",
            "pergunta": "Precisa de duas posições?",
            "secao": "10. Uso compartilhado"
          }
        ],
        "itens": [
          "Sim",
          "Não",
          "Precisa de duas posições?",
          "Uso simultâneo?",
          "Alternado?"
        ],
        "conteudoLinhas": [
          "O ambiente será usado por mais alguém?",
          "      Sim",
          "      Não",
          "Se sim:",
          "      Precisa de duas posições?",
          "      Uso simultâneo?",
          "      Alternado?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "O ambiente será usado por mais alguém?",
            "itens": [
              "Sim",
              "Não"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Se sim:",
            "itens": [
              "Precisa de duas posições?",
              "Uso simultâneo?",
              "Alternado?"
            ]
          }
        ]
      },
      {
        "id": "home_office_sec_10",
        "titulo": "11. Iluminação",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "11. Iluminação",
            "pergunta": "Luz natural disponível?",
            "secao": "11. Iluminação"
          },
          {
            "tipo": "estrategica",
            "rotulo": "11. Iluminação",
            "pergunta": "Trabalha à noite?",
            "secao": "11. Iluminação"
          },
          {
            "tipo": "estrategica",
            "rotulo": "11. Iluminação",
            "pergunta": "Hoje você sente desconforto com iluminação ao trabalhar?",
            "secao": "11. Iluminação"
          }
        ],
        "itens": [
          "Luz natural disponível?",
          "Trabalha à noite?",
          "Luz geral",
          "Luz de tarefa (mesa)",
          "Luz indireta",
          "Evitar reflexo na tela"
        ],
        "conteudoLinhas": [
          "      Luz natural disponível?",
          "      Trabalha à noite?",
          "Necessidades:",
          "      Luz geral",
          "      Luz de tarefa (mesa)",
          "      Luz indireta",
          "      Evitar reflexo na tela",
          "Pergunta importante:",
          "Hoje você sente desconforto com iluminação ao trabalhar?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Luz natural disponível?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Trabalha à noite?"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Necessidades:",
            "itens": [
              "Luz geral",
              "Luz de tarefa (mesa)",
              "Luz indireta",
              "Evitar reflexo na tela"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Pergunta importante:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Hoje você sente desconforto com iluminação ao trabalhar?",
            "itens": []
          }
        ]
      },
      {
        "id": "home_office_sec_11",
        "titulo": "12. Acústica e concentração",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "12. Acústica e concentração",
            "pergunta": "Ambiente silencioso?",
            "secao": "12. Acústica e concentração"
          },
          {
            "tipo": "estrategica",
            "rotulo": "12. Acústica e concentração",
            "pergunta": "Interferência de ruído?",
            "secao": "12. Acústica e concentração"
          },
          {
            "tipo": "estrategica",
            "rotulo": "12. Acústica e concentração",
            "pergunta": "Precisa de isolamento?",
            "secao": "12. Acústica e concentração"
          }
        ],
        "itens": [
          "Ambiente silencioso?",
          "Interferência de ruído?",
          "Precisa de isolamento?"
        ],
        "conteudoLinhas": [
          "      Ambiente silencioso?",
          "      Interferência de ruído?",
          "      Precisa de isolamento?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Ambiente silencioso?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Interferência de ruído?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Precisa de isolamento?"
            ]
          }
        ]
      },
      {
        "id": "home_office_sec_12",
        "titulo": "13. Estética e imagem (muito importante hoje)",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "13. Estética e imagem (muito importante hoje)",
            "pergunta": "O ambiente aparece em vídeo?",
            "secao": "13. Estética e imagem (muito importante hoje)"
          },
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Você quer que seu ambiente transmita o quê para quem vê?",
            "secao": "13. Estética e imagem (muito importante hoje)"
          }
        ],
        "itens": [
          "Sim",
          "Não",
          "Fundo neutro",
          "Fundo sofisticado",
          "Estante decorativa",
          "Painel"
        ],
        "conteudoLinhas": [
          "O ambiente aparece em vídeo?",
          "      Sim",
          "      Não",
          "Se sim:",
          "      Fundo neutro",
          "      Fundo sofisticado",
          "      Estante decorativa",
          "      Painel",
          "[Pergunta-chave:] Você quer que seu ambiente transmita o quê para quem vê?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "O ambiente aparece em vídeo?",
            "itens": [
              "Sim",
              "Não"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Se sim:",
            "itens": [
              "Fundo neutro",
              "Fundo sofisticado",
              "Estante decorativa",
              "Painel"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Você quer que seu ambiente transmita o quê para quem vê?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "home_office_sec_13",
        "titulo": "14. Estilo",
        "perguntasDestaque": [],
        "itens": [
          "Moderno",
          "Minimalista",
          "Sofisticado",
          "Corporativo",
          "Aconchegante",
          "Criativo",
          "Madeira",
          "Laca",
          "Vidro",
          "Metal",
          "Tons neutros / escuros / claros"
        ],
        "conteudoLinhas": [
          "      Moderno",
          "      Minimalista",
          "      Sofisticado",
          "      Corporativo",
          "      Aconchegante",
          "      Criativo",
          "Materiais:",
          "      Madeira",
          "      Laca",
          "      Vidro",
          "      Metal",
          "      Tons neutros / escuros / claros"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Moderno"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Minimalista"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Sofisticado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Corporativo"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Aconchegante"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Criativo"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Materiais:",
            "itens": [
              "Madeira",
              "Laca",
              "Vidro",
              "Metal",
              "Tons neutros / escuros / claros"
            ]
          }
        ]
      },
      {
        "id": "home_office_sec_14",
        "titulo": "15. Integração com a casa",
        "perguntasDestaque": [],
        "itens": [
          "Ambiente isolado",
          "Integrado com quarto",
          "Integrado com living",
          "Disfarçar o home office",
          "Destacar o home office"
        ],
        "conteudoLinhas": [
          "      Ambiente isolado",
          "      Integrado com quarto",
          "      Integrado com living",
          "Deseja:",
          "      Disfarçar o home office",
          "      Destacar o home office"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Ambiente isolado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Integrado com quarto"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Integrado com living"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Deseja:",
            "itens": [
              "Disfarçar o home office",
              "Destacar o home office"
            ]
          }
        ]
      },
      {
        "id": "home_office_sec_15",
        "titulo": "16. Tecnologia",
        "perguntasDestaque": [],
        "itens": [
          "Automação",
          "Tomadas USB",
          "Organização de cabos",
          "Carregamento fácil",
          "Internet (ponto de rede)"
        ],
        "conteudoLinhas": [
          "   Automação",
          "   Tomadas USB",
          "   Organização de cabos",
          "   Carregamento fácil",
          "   Internet (ponto de rede)"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Automação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tomadas USB"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Organização de cabos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Carregamento fácil"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Internet (ponto de rede)"
            ]
          }
        ]
      },
      {
        "id": "home_office_sec_16",
        "titulo": "17. Pontos de dor atuais",
        "perguntasDestaque": [],
        "itens": [
          "Falta de espaço",
          "Bagunça",
          "Desconforto",
          "Má postura",
          "Falta de tomada",
          "Iluminação ruim",
          "Ambiente pouco inspirador"
        ],
        "conteudoLinhas": [
          "   Falta de espaço",
          "   Bagunça",
          "   Desconforto",
          "   Má postura",
          "   Falta de tomada",
          "   Iluminação ruim",
          "   Ambiente pouco inspirador"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Falta de espaço"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Bagunça"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Desconforto"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Má postura"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Falta de tomada"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Iluminação ruim"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ambiente pouco inspirador"
            ]
          }
        ]
      },
      {
        "id": "home_office_sec_17",
        "titulo": "18. Experiência desejada",
        "perguntasDestaque": [],
        "itens": [
          "Ambiente produtivo",
          "Ambiente inspirador",
          "Ambiente confortável",
          "Ambiente elegante"
        ],
        "conteudoLinhas": [
          "   Ambiente produtivo",
          "   Ambiente inspirador",
          "   Ambiente confortável",
          "   Ambiente elegante"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Ambiente produtivo"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ambiente inspirador"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ambiente confortável"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ambiente elegante"
            ]
          }
        ]
      },
      {
        "id": "home_office_sec_18",
        "titulo": "19. Investimento e prioridade",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "19. Investimento e prioridade",
            "pergunta": "Já tem previsão de investimento?",
            "secao": "19. Investimento e prioridade"
          }
        ],
        "itens": [
          "Já tem previsão de investimento?",
          "Prioriza:",
          "Ergonomia",
          "Estética",
          "Tecnologia",
          "Custo-benefício"
        ],
        "conteudoLinhas": [
          "   Já tem previsão de investimento?",
          "   Prioriza:",
          "o Ergonomia",
          "o Estética",
          "o Tecnologia",
          "o Custo-benefício"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Já tem previsão de investimento?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Prioriza:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ergonomia"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Estética"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tecnologia"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Custo-benefício"
            ]
          }
        ]
      },
      {
        "id": "home_office_sec_19",
        "titulo": "20. Perguntas de aprofundamento",
        "perguntasDestaque": [
          {
            "tipo": "profunda",
            "rotulo": "20. Perguntas de aprofundamento",
            "pergunta": "O que mais te atrapalha hoje ao trabalhar?",
            "secao": "20. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "20. Perguntas de aprofundamento",
            "pergunta": "O que faria você trabalhar melhor?",
            "secao": "20. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "20. Perguntas de aprofundamento",
            "pergunta": "Você quer um ambiente mais técnico ou mais acolhedor?",
            "secao": "20. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "20. Perguntas de aprofundamento",
            "pergunta": "Esse espaço precisa impressionar ou apenas funcionar bem?",
            "secao": "20. Perguntas de aprofundamento"
          }
        ],
        "itens": [
          "O que mais te atrapalha hoje ao trabalhar?",
          "O que faria você trabalhar melhor?",
          "Você quer um ambiente mais técnico ou mais acolhedor?",
          "Esse espaço precisa impressionar ou apenas funcionar bem?"
        ],
        "conteudoLinhas": [
          "   O que mais te atrapalha hoje ao trabalhar?",
          "   O que faria você trabalhar melhor?",
          "   Você quer um ambiente mais técnico ou mais acolhedor?",
          "   Esse espaço precisa impressionar ou apenas funcionar bem?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "O que mais te atrapalha hoje ao trabalhar?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "O que faria você trabalhar melhor?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você quer um ambiente mais técnico ou mais acolhedor?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Esse espaço precisa impressionar ou apenas funcionar bem?"
            ]
          }
        ]
      },
      {
        "id": "home_office_sec_20",
        "titulo": "21. Resumo para o projetista",
        "perguntasDestaque": [],
        "itens": [],
        "conteudoLinhas": [
          "Tipo de trabalho:",
          "Carga de uso:",
          "Equipamentos:",
          "Nível de ergonomia necessário:",
          "Perfil do cliente:",
          "Estilo:",
          "Pontos críticos:",
          "Itens obrigatórios:"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Tipo de trabalho:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Carga de uso:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Equipamentos:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Nível de ergonomia necessário:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Perfil do cliente:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Estilo:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Pontos críticos:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Itens obrigatórios:",
            "itens": []
          }
        ]
      }
    ],
    "perguntasEstrategicas": [
      {
        "tipo": "estrategica",
        "rotulo": "2. Objetivo do ambiente",
        "pergunta": "Qual é a principal função do home office?",
        "secao": "2. Objetivo do ambiente"
      },
      {
        "tipo": "emocional",
        "rotulo": "Pergunta emocional:",
        "pergunta": "O que você quer sentir trabalhando nesse ambiente?",
        "secao": "2. Objetivo do ambiente"
      },
      {
        "tipo": "estrategica",
        "rotulo": "3. Rotina de uso",
        "pergunta": "Quantas horas por dia usa?",
        "secao": "3. Rotina de uso"
      },
      {
        "tipo": "estrategica",
        "rotulo": "3. Rotina de uso",
        "pergunta": "Uso contínuo ou pontual?",
        "secao": "3. Rotina de uso"
      },
      {
        "tipo": "estrategica",
        "rotulo": "10. Uso compartilhado",
        "pergunta": "O ambiente será usado por mais alguém?",
        "secao": "10. Uso compartilhado"
      },
      {
        "tipo": "estrategica",
        "rotulo": "10. Uso compartilhado",
        "pergunta": "Precisa de duas posições?",
        "secao": "10. Uso compartilhado"
      },
      {
        "tipo": "estrategica",
        "rotulo": "11. Iluminação",
        "pergunta": "Luz natural disponível?",
        "secao": "11. Iluminação"
      },
      {
        "tipo": "estrategica",
        "rotulo": "11. Iluminação",
        "pergunta": "Trabalha à noite?",
        "secao": "11. Iluminação"
      },
      {
        "tipo": "estrategica",
        "rotulo": "11. Iluminação",
        "pergunta": "Hoje você sente desconforto com iluminação ao trabalhar?",
        "secao": "11. Iluminação"
      },
      {
        "tipo": "estrategica",
        "rotulo": "12. Acústica e concentração",
        "pergunta": "Ambiente silencioso?",
        "secao": "12. Acústica e concentração"
      },
      {
        "tipo": "estrategica",
        "rotulo": "12. Acústica e concentração",
        "pergunta": "Interferência de ruído?",
        "secao": "12. Acústica e concentração"
      },
      {
        "tipo": "estrategica",
        "rotulo": "12. Acústica e concentração",
        "pergunta": "Precisa de isolamento?",
        "secao": "12. Acústica e concentração"
      },
      {
        "tipo": "estrategica",
        "rotulo": "13. Estética e imagem (muito importante hoje)",
        "pergunta": "O ambiente aparece em vídeo?",
        "secao": "13. Estética e imagem (muito importante hoje)"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Você quer que seu ambiente transmita o quê para quem vê?",
        "secao": "13. Estética e imagem (muito importante hoje)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "19. Investimento e prioridade",
        "pergunta": "Já tem previsão de investimento?",
        "secao": "19. Investimento e prioridade"
      },
      {
        "tipo": "profunda",
        "rotulo": "20. Perguntas de aprofundamento",
        "pergunta": "O que mais te atrapalha hoje ao trabalhar?",
        "secao": "20. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "20. Perguntas de aprofundamento",
        "pergunta": "O que faria você trabalhar melhor?",
        "secao": "20. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "20. Perguntas de aprofundamento",
        "pergunta": "Você quer um ambiente mais técnico ou mais acolhedor?",
        "secao": "20. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "20. Perguntas de aprofundamento",
        "pergunta": "Esse espaço precisa impressionar ou apenas funcionar bem?",
        "secao": "20. Perguntas de aprofundamento"
      }
    ],
    "topicosChecagemTecnica": [
      "[5. Equipamentos] Notebook",
      "[5. Equipamentos] Desktop",
      "[5. Equipamentos] Quantos monitores:",
      "[5. Equipamentos] Impressora",
      "[5. Equipamentos] Scanner",
      "[5. Equipamentos] Tablet",
      "[5. Equipamentos] Equipamentos específicos",
      "[5. Equipamentos] Webcam / iluminação",
      "[5. Equipamentos] Fones",
      "[5. Equipamentos] Microfone",
      "[5. Equipamentos] Roteador",
      "[5. Equipamentos] Quantidade de tomadas",
      "[5. Equipamentos] Posição dos pontos",
      "[5. Equipamentos] Cabos visíveis ou ocultos",
      "6. Ergonomia (CRÍTICO)",
      "21. Resumo para o projetista"
    ]
  },
  "home_theater": {
    "slug": "home_theater",
    "titulo": "Home Theater",
    "subtitulo": "Painel de TV, acústica, distância do sofá, iluminação cênica e cabos",
    "arquivoPdfOriginal": "BRIEFING HOME THEATER.pdf",
    "secoes": [
      {
        "id": "home_theater_sec_1",
        "titulo": "2. Objetivo do ambiente",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "2. Objetivo do ambiente",
            "pergunta": "Qual o principal uso do home theater?",
            "secao": "2. Objetivo do ambiente"
          },
          {
            "tipo": "emocional",
            "rotulo": "Pergunta emocional:",
            "pergunta": "O que você quer sentir ao usar esse espaço?",
            "secao": "2. Objetivo do ambiente"
          }
        ],
        "itens": [
          "Assistir filmes e séries",
          "Assistir TV aberta",
          "Esportes",
          "Videogame",
          "Receber convidados",
          "Uso casual (background)",
          "Uso imersivo (cinema)",
          "Imersão",
          "Conforto",
          "Relaxamento",
          "Impacto visual",
          "Experiência de cinema"
        ],
        "conteudoLinhas": [
          "Qual o principal uso do home theater?",
          "   Assistir filmes e séries",
          "   Assistir TV aberta",
          "   Esportes",
          "   Videogame",
          "   Receber convidados",
          "   Uso casual (background)",
          "   Uso imersivo (cinema)",
          "[Pergunta emocional:] O que você quer sentir ao usar esse espaço?",
          "   Imersão",
          "   Conforto",
          "   Relaxamento",
          "   Impacto visual",
          "   Experiência de cinema"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Qual o principal uso do home theater?",
            "itens": [
              "Assistir filmes e séries",
              "Assistir TV aberta",
              "Esportes",
              "Videogame",
              "Receber convidados",
              "Uso casual (background)",
              "Uso imersivo (cinema)"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta emocional:",
            "texto": "O que você quer sentir ao usar esse espaço?",
            "tipoPergunta": "emocional",
            "itens": [
              "Imersão",
              "Conforto",
              "Relaxamento",
              "Impacto visual",
              "Experiência de cinema"
            ]
          }
        ]
      },
      {
        "id": "home_theater_sec_2",
        "titulo": "3. Frequência de uso",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "3. Frequência de uso",
            "pergunta": "Eventos específicos (jogos, filmes) Quantas pessoas utilizam normalmente?",
            "secao": "3. Frequência de uso"
          }
        ],
        "itens": [
          "Diário",
          "Finais de semana",
          "Ocasional",
          "Eventos específicos (jogos, filmes) Quantas pessoas utilizam normalmente?",
          "Moradores:",
          "Convidados:"
        ],
        "conteudoLinhas": [
          "   Diário",
          "   Finais de semana",
          "   Ocasional",
          "   Eventos específicos (jogos, filmes)",
          "   Moradores:",
          "   Convidados:"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Diário"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Finais de semana"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ocasional"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Eventos específicos (jogos, filmes) Quantas pessoas utilizam normalmente?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Moradores:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Convidados:"
            ]
          }
        ]
      },
      {
        "id": "home_theater_sec_3",
        "titulo": "4. Tipo de experiência desejada",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Você quer um ambiente mais funcional ou mais cinematográfico?",
            "secao": "4. Tipo de experiência desejada"
          }
        ],
        "itens": [
          "Cinema (imersivo)",
          "TV casual",
          "Espaço social",
          "Misto"
        ],
        "conteudoLinhas": [
          "   Cinema (imersivo)",
          "   TV casual",
          "   Espaço social",
          "   Misto",
          "[Pergunta-chave:] Você quer um ambiente mais funcional ou mais cinematográfico?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Cinema (imersivo)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "TV casual"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espaço social"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Misto"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Você quer um ambiente mais funcional ou mais cinematográfico?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "home_theater_sec_4",
        "titulo": "5. Equipamentos",
        "perguntasDestaque": [],
        "itens": [
          "TV (tamanho)",
          "Projetor (se houver)",
          "Soundbar",
          "Home theater completo",
          "Caixas de som (quantas / tipo)",
          "Receiver",
          "Videogame",
          "TV Box",
          "Automação"
        ],
        "conteudoLinhas": [
          "Listar todos:",
          "   TV (tamanho)",
          "   Projetor (se houver)",
          "   Soundbar",
          "   Home theater completo",
          "   Caixas de som (quantas / tipo)",
          "   Receiver",
          "   Videogame",
          "   TV Box",
          "   Automação",
          "Importante: posição e dimensões."
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Listar todos:",
            "itens": [
              "TV (tamanho)",
              "Projetor (se houver)",
              "Soundbar",
              "Home theater completo",
              "Caixas de som (quantas / tipo)",
              "Receiver",
              "Videogame",
              "TV Box",
              "Automação"
            ]
          },
          {
            "tipo": "nota",
            "texto": "Importante: posição e dimensões."
          }
        ]
      },
      {
        "id": "home_theater_sec_5",
        "titulo": "6. Layout e ergonomia",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "6. Layout e ergonomia",
            "pergunta": "Linha de visão confortável?",
            "secao": "6. Layout e ergonomia"
          },
          {
            "tipo": "estrategica",
            "rotulo": "6. Layout e ergonomia",
            "pergunta": "Quantos assentos?",
            "secao": "6. Layout e ergonomia"
          }
        ],
        "itens": [
          "Distância da TV:",
          "Altura da TV:",
          "Linha de visão confortável?",
          "Quantos assentos?",
          "Sofá",
          "Poltronas reclináveis",
          "Chaise",
          "Módulos"
        ],
        "conteudoLinhas": [
          "   Distância da TV:",
          "   Altura da TV:",
          "   Linha de visão confortável?",
          "   Quantos assentos?",
          "Tipos de assento:",
          "   Sofá",
          "   Poltronas reclináveis",
          "   Chaise",
          "   Módulos"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Distância da TV:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Altura da TV:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Linha de visão confortável?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Quantos assentos?"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Tipos de assento:",
            "itens": [
              "Sofá",
              "Poltronas reclináveis",
              "Chaise",
              "Módulos"
            ]
          }
        ]
      },
      {
        "id": "home_theater_sec_6",
        "titulo": "7. Uso compartilhado",
        "perguntasDestaque": [
          {
            "tipo": "geral",
            "rotulo": "Pergunta:",
            "pergunta": "Esse ambiente é mais íntimo ou social?",
            "secao": "7. Uso compartilhado"
          }
        ],
        "itens": [
          "Família",
          "Crianças",
          "Amigos",
          "Uso individual"
        ],
        "conteudoLinhas": [
          "   Família",
          "   Crianças",
          "   Amigos",
          "   Uso individual",
          "[Pergunta:] Esse ambiente é mais íntimo ou social?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Família"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Crianças"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Amigos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Uso individual"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta:",
            "texto": "Esse ambiente é mais íntimo ou social?",
            "tipoPergunta": "geral",
            "itens": []
          }
        ]
      },
      {
        "id": "home_theater_sec_7",
        "titulo": "8. Acústica (DIFERENCIAL IMPORTANTE)",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "8. Acústica (DIFERENCIAL IMPORTANTE)",
            "pergunta": "Ambiente aberto ou fechado?",
            "secao": "8. Acústica (DIFERENCIAL IMPORTANTE)"
          },
          {
            "tipo": "estrategica",
            "rotulo": "8. Acústica (DIFERENCIAL IMPORTANTE)",
            "pergunta": "Há ruído externo?",
            "secao": "8. Acústica (DIFERENCIAL IMPORTANTE)"
          }
        ],
        "itens": [
          "Ambiente aberto ou fechado?",
          "Há ruído externo?",
          "Necessidade de:",
          "Painéis acústicos",
          "Tecidos",
          "Tapetes",
          "Cortinas"
        ],
        "conteudoLinhas": [
          "   Ambiente aberto ou fechado?",
          "   Há ruído externo?",
          "   Necessidade de:",
          "o Painéis acústicos",
          "o Tecidos",
          "o Tapetes",
          "o Cortinas"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Ambiente aberto ou fechado?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Há ruído externo?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Necessidade de:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Painéis acústicos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tecidos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tapetes"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cortinas"
            ]
          }
        ]
      },
      {
        "id": "home_theater_sec_8",
        "titulo": "9. Iluminação (CRÍTICO)",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Você gosta de assistir com o ambiente totalmente escuro ou com luz indireta?",
            "secao": "9. Iluminação (CRÍTICO)"
          }
        ],
        "itens": [
          "Luz geral",
          "Luz indireta",
          "Dimerização",
          "Luz para circulação",
          "Luz decorativa"
        ],
        "conteudoLinhas": [
          "   Luz geral",
          "   Luz indireta",
          "   Dimerização",
          "   Luz para circulação",
          "   Luz decorativa",
          "[Pergunta-chave:] Você gosta de assistir com o ambiente totalmente escuro ou com luz indireta?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Luz geral"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz indireta"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Dimerização"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz para circulação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz decorativa"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Você gosta de assistir com o ambiente totalmente escuro ou com luz indireta?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "home_theater_sec_9",
        "titulo": "10. Marcenaria (função)",
        "perguntasDestaque": [],
        "itens": [
          "Painel para TV",
          "Rack",
          "Nichos",
          "Gavetas",
          "Porta equipamentos",
          "Espaço para ventilação"
        ],
        "conteudoLinhas": [
          "   Painel para TV",
          "   Rack",
          "   Nichos",
          "   Gavetas",
          "   Porta equipamentos",
          "   Espaço para ventilação"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Painel para TV"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Rack"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Nichos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Gavetas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Porta equipamentos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espaço para ventilação"
            ]
          }
        ]
      },
      {
        "id": "home_theater_sec_10",
        "titulo": "11. Organização de equipamentos",
        "perguntasDestaque": [],
        "itens": [
          "Cabos ocultos",
          "Acesso técnico fácil",
          "Ventilação dos aparelhos",
          "Organização de controles"
        ],
        "conteudoLinhas": [
          "   Cabos ocultos",
          "   Acesso técnico fácil",
          "   Ventilação dos aparelhos",
          "   Organização de controles"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Cabos ocultos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Acesso técnico fácil"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ventilação dos aparelhos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Organização de controles"
            ]
          }
        ]
      },
      {
        "id": "home_theater_sec_11",
        "titulo": "12. Integração com o ambiente",
        "perguntasDestaque": [],
        "itens": [
          "Integrado ao living",
          "Ambiente dedicado",
          "Espaço compartilhado com sala",
          "Disfarçar o home",
          "Destacar o home"
        ],
        "conteudoLinhas": [
          "   Integrado ao living",
          "   Ambiente dedicado",
          "   Espaço compartilhado com sala",
          "O cliente deseja:",
          "   Disfarçar o home",
          "   Destacar o home"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Integrado ao living"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ambiente dedicado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espaço compartilhado com sala"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "O cliente deseja:",
            "itens": [
              "Disfarçar o home",
              "Destacar o home"
            ]
          }
        ]
      },
      {
        "id": "home_theater_sec_12",
        "titulo": "13. Estilo visual",
        "perguntasDestaque": [],
        "itens": [
          "Sofisticado",
          "Moderno",
          "Minimalista",
          "Escuro (cinema)",
          "Claro (sala integrada)",
          "Aconchegante",
          "Madeira",
          "Laca",
          "Tecido",
          "Painéis",
          "Iluminação indireta"
        ],
        "conteudoLinhas": [
          "   Sofisticado",
          "   Moderno",
          "   Minimalista",
          "   Escuro (cinema)",
          "   Claro (sala integrada)",
          "   Aconchegante",
          "Materiais:",
          "   Madeira",
          "   Laca",
          "   Tecido",
          "   Painéis",
          "   Iluminação indireta"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Sofisticado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Moderno"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Minimalista"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Escuro (cinema)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Claro (sala integrada)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Aconchegante"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Materiais:",
            "itens": [
              "Madeira",
              "Laca",
              "Tecido",
              "Painéis",
              "Iluminação indireta"
            ]
          }
        ]
      },
      {
        "id": "home_theater_sec_13",
        "titulo": "14. Estética x funcionalidade",
        "perguntasDestaque": [],
        "itens": [
          "Mais técnico (som/imagem)",
          "Mais estético",
          "Equilíbrio"
        ],
        "conteudoLinhas": [
          "   Mais técnico (som/imagem)",
          "   Mais estético",
          "   Equilíbrio"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Mais técnico (som/imagem)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Mais estético"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Equilíbrio"
            ]
          }
        ]
      },
      {
        "id": "home_theater_sec_14",
        "titulo": "15. Pontos de dor",
        "perguntasDestaque": [],
        "itens": [
          "Reflexo na TV",
          "Má posição da TV",
          "Som ruim",
          "Bagunça de cabos",
          "Falta de conforto",
          "Iluminação inadequada"
        ],
        "conteudoLinhas": [
          "   Reflexo na TV",
          "   Má posição da TV",
          "   Som ruim",
          "   Bagunça de cabos",
          "   Falta de conforto",
          "   Iluminação inadequada"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Reflexo na TV"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Má posição da TV"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Som ruim"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Bagunça de cabos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Falta de conforto"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Iluminação inadequada"
            ]
          }
        ]
      },
      {
        "id": "home_theater_sec_15",
        "titulo": "16. Tecnologia",
        "perguntasDestaque": [],
        "itens": [
          "Automação",
          "Controle remoto central",
          "Alexa / integração",
          "Tomadas e pontos de energia"
        ],
        "conteudoLinhas": [
          "   Automação",
          "   Controle remoto central",
          "   Alexa / integração",
          "   Tomadas e pontos de energia"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Automação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Controle remoto central"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Alexa / integração"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tomadas e pontos de energia"
            ]
          }
        ]
      },
      {
        "id": "home_theater_sec_16",
        "titulo": "17. Perguntas de aprofundamento",
        "perguntasDestaque": [
          {
            "tipo": "profunda",
            "rotulo": "17. Perguntas de aprofundamento",
            "pergunta": "Você gosta mais de filme ou TV casual?",
            "secao": "17. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "17. Perguntas de aprofundamento",
            "pergunta": "Você recebe pessoas para assistir?",
            "secao": "17. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "17. Perguntas de aprofundamento",
            "pergunta": "Você quer um ambiente que impressione?",
            "secao": "17. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "17. Perguntas de aprofundamento",
            "pergunta": "Qual experiência você quer ter aqui?",
            "secao": "17. Perguntas de aprofundamento"
          }
        ],
        "itens": [
          "Você gosta mais de filme ou TV casual?",
          "Você recebe pessoas para assistir?",
          "Você quer um ambiente que impressione?",
          "Qual experiência você quer ter aqui?"
        ],
        "conteudoLinhas": [
          "   Você gosta mais de filme ou TV casual?",
          "   Você recebe pessoas para assistir?",
          "   Você quer um ambiente que impressione?",
          "   Qual experiência você quer ter aqui?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Você gosta mais de filme ou TV casual?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você recebe pessoas para assistir?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você quer um ambiente que impressione?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Qual experiência você quer ter aqui?"
            ]
          }
        ]
      },
      {
        "id": "home_theater_sec_17",
        "titulo": "18. Investimento e prioridade",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "18. Investimento e prioridade",
            "pergunta": "Já tem previsão?",
            "secao": "18. Investimento e prioridade"
          }
        ],
        "itens": [
          "Já tem previsão?",
          "Prioriza:",
          "Experiência",
          "Estética",
          "Tecnologia",
          "Custo-benefício"
        ],
        "conteudoLinhas": [
          "   Já tem previsão?",
          "   Prioriza:",
          "o Experiência",
          "o Estética",
          "o Tecnologia",
          "o Custo-benefício"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Já tem previsão?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Prioriza:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Experiência"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Estética"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tecnologia"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Custo-benefício"
            ]
          }
        ]
      },
      {
        "id": "home_theater_sec_18",
        "titulo": "19. Checklist técnico",
        "perguntasDestaque": [],
        "itens": [
          "Posição de tomadas",
          "Posição da TV/projetor",
          "Passagem de cabos",
          "Ventilação",
          "Dimensões do espaço"
        ],
        "conteudoLinhas": [
          "   Posição de tomadas",
          "   Posição da TV/projetor",
          "   Passagem de cabos",
          "   Ventilação",
          "   Dimensões do espaço"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Posição de tomadas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Posição da TV/projetor"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Passagem de cabos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ventilação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Dimensões do espaço"
            ]
          }
        ]
      }
    ],
    "perguntasEstrategicas": [
      {
        "tipo": "estrategica",
        "rotulo": "2. Objetivo do ambiente",
        "pergunta": "Qual o principal uso do home theater?",
        "secao": "2. Objetivo do ambiente"
      },
      {
        "tipo": "emocional",
        "rotulo": "Pergunta emocional:",
        "pergunta": "O que você quer sentir ao usar esse espaço?",
        "secao": "2. Objetivo do ambiente"
      },
      {
        "tipo": "estrategica",
        "rotulo": "3. Frequência de uso",
        "pergunta": "Eventos específicos (jogos, filmes) Quantas pessoas utilizam normalmente?",
        "secao": "3. Frequência de uso"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Você quer um ambiente mais funcional ou mais cinematográfico?",
        "secao": "4. Tipo de experiência desejada"
      },
      {
        "tipo": "estrategica",
        "rotulo": "6. Layout e ergonomia",
        "pergunta": "Linha de visão confortável?",
        "secao": "6. Layout e ergonomia"
      },
      {
        "tipo": "estrategica",
        "rotulo": "6. Layout e ergonomia",
        "pergunta": "Quantos assentos?",
        "secao": "6. Layout e ergonomia"
      },
      {
        "tipo": "geral",
        "rotulo": "Pergunta:",
        "pergunta": "Esse ambiente é mais íntimo ou social?",
        "secao": "7. Uso compartilhado"
      },
      {
        "tipo": "estrategica",
        "rotulo": "8. Acústica (DIFERENCIAL IMPORTANTE)",
        "pergunta": "Ambiente aberto ou fechado?",
        "secao": "8. Acústica (DIFERENCIAL IMPORTANTE)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "8. Acústica (DIFERENCIAL IMPORTANTE)",
        "pergunta": "Há ruído externo?",
        "secao": "8. Acústica (DIFERENCIAL IMPORTANTE)"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Você gosta de assistir com o ambiente totalmente escuro ou com luz indireta?",
        "secao": "9. Iluminação (CRÍTICO)"
      },
      {
        "tipo": "profunda",
        "rotulo": "17. Perguntas de aprofundamento",
        "pergunta": "Você gosta mais de filme ou TV casual?",
        "secao": "17. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "17. Perguntas de aprofundamento",
        "pergunta": "Você recebe pessoas para assistir?",
        "secao": "17. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "17. Perguntas de aprofundamento",
        "pergunta": "Você quer um ambiente que impressione?",
        "secao": "17. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "17. Perguntas de aprofundamento",
        "pergunta": "Qual experiência você quer ter aqui?",
        "secao": "17. Perguntas de aprofundamento"
      },
      {
        "tipo": "estrategica",
        "rotulo": "18. Investimento e prioridade",
        "pergunta": "Já tem previsão?",
        "secao": "18. Investimento e prioridade"
      }
    ],
    "topicosChecagemTecnica": [
      "[5. Equipamentos] TV (tamanho)",
      "[5. Equipamentos] Projetor (se houver)",
      "[5. Equipamentos] Soundbar",
      "[5. Equipamentos] Home theater completo",
      "[5. Equipamentos] Caixas de som (quantas / tipo)",
      "[5. Equipamentos] Receiver",
      "[5. Equipamentos] Videogame",
      "[5. Equipamentos] TV Box",
      "[5. Equipamentos] Automação",
      "6. Layout e ergonomia",
      "9. Iluminação (CRÍTICO)",
      "[11. Organização de equipamentos] Cabos ocultos",
      "[11. Organização de equipamentos] Acesso técnico fácil",
      "[11. Organização de equipamentos] Ventilação dos aparelhos",
      "[11. Organização de equipamentos] Organização de controles",
      "19. Checklist técnico",
      "[19. Checklist técnico] Posição de tomadas",
      "[19. Checklist técnico] Posição da TV/projetor",
      "[19. Checklist técnico] Passagem de cabos",
      "[19. Checklist técnico] Ventilação",
      "[19. Checklist técnico] Dimensões do espaço"
    ]
  },
  "lavabo": {
    "slug": "lavabo",
    "titulo": "Lavabo",
    "subtitulo": "Cartão de visitas social, impacto estético, bancada esculpida e iluminação",
    "arquivoPdfOriginal": "BRIEFING LAVABO.pdf",
    "secoes": [
      {
        "id": "lavabo_sec_1",
        "titulo": "2. Objetivo do ambiente",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "2. Objetivo do ambiente",
            "pergunta": "Qual o papel do lavabo?",
            "secao": "2. Objetivo do ambiente"
          },
          {
            "tipo": "emocional",
            "rotulo": "Pergunta emocional:",
            "pergunta": "O que você quer que a visita sinta ao entrar aqui?",
            "secao": "2. Objetivo do ambiente"
          }
        ],
        "itens": [
          "Uso de visitas",
          "Apoio social",
          "Impacto visual",
          "Complemento do living",
          "Impacto",
          "Sofisticação",
          "Elegância",
          "Surpresa"
        ],
        "conteudoLinhas": [
          "Qual o papel do lavabo?",
          "   Uso de visitas",
          "   Apoio social",
          "   Impacto visual",
          "   Complemento do living",
          "[Pergunta emocional:] O que você quer que a visita sinta ao entrar aqui?",
          "   Impacto",
          "   Sofisticação",
          "   Elegância",
          "   Surpresa"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Qual o papel do lavabo?",
            "itens": [
              "Uso de visitas",
              "Apoio social",
              "Impacto visual",
              "Complemento do living"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta emocional:",
            "texto": "O que você quer que a visita sinta ao entrar aqui?",
            "tipoPergunta": "emocional",
            "itens": [
              "Impacto",
              "Sofisticação",
              "Elegância",
              "Surpresa"
            ]
          }
        ]
      },
      {
        "id": "lavabo_sec_2",
        "titulo": "3. Tipo de uso",
        "perguntasDestaque": [],
        "itens": [
          "Apenas visitas",
          "Uso eventual",
          "Pouco uso funcional"
        ],
        "conteudoLinhas": [
          "   Apenas visitas",
          "   Uso eventual",
          "   Pouco uso funcional"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Apenas visitas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Uso eventual"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Pouco uso funcional"
            ]
          }
        ]
      },
      {
        "id": "lavabo_sec_3",
        "titulo": "4. Bancada",
        "perguntasDestaque": [],
        "itens": [
          "Cuba:",
          "Apoio",
          "Esculpida",
          "Sobreposta",
          "Espaço de apoio mínimo"
        ],
        "conteudoLinhas": [
          "   Cuba:",
          "o Apoio",
          "o Esculpida",
          "o Sobreposta",
          "   Espaço de apoio mínimo"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Cuba:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Apoio"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Esculpida"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Sobreposta"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espaço de apoio mínimo"
            ]
          }
        ]
      },
      {
        "id": "lavabo_sec_4",
        "titulo": "5. Armazenamento",
        "perguntasDestaque": [],
        "itens": [
          "Muito pouco",
          "Apenas essencial",
          "Itens de apoio"
        ],
        "conteudoLinhas": [
          "   Muito pouco",
          "   Apenas essencial",
          "   Itens de apoio"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Muito pouco"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Apenas essencial"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Itens de apoio"
            ]
          }
        ]
      },
      {
        "id": "lavabo_sec_5",
        "titulo": "6. Espelho (DIFERENCIAL)",
        "perguntasDestaque": [],
        "itens": [
          "Destaque",
          "Decorativo",
          "Iluminado",
          "Diferenciado"
        ],
        "conteudoLinhas": [
          "   Destaque",
          "   Decorativo",
          "   Iluminado",
          "   Diferenciado"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Destaque"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Decorativo"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Iluminado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Diferenciado"
            ]
          }
        ]
      },
      {
        "id": "lavabo_sec_6",
        "titulo": "7. Estética (PRINCIPAL FOCO)",
        "perguntasDestaque": [],
        "itens": [
          "Mais ousado",
          "Mais sofisticado",
          "Diferente do restante da casa",
          "Pedra",
          "Madeira",
          "Metal",
          "Vidro",
          "Espelho"
        ],
        "conteudoLinhas": [
          "   Mais ousado",
          "   Mais sofisticado",
          "   Diferente do restante da casa",
          "Materiais:",
          "   Pedra",
          "   Madeira",
          "   Metal",
          "   Vidro",
          "   Espelho"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Mais ousado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Mais sofisticado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Diferente do restante da casa"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Materiais:",
            "itens": [
              "Pedra",
              "Madeira",
              "Metal",
              "Vidro",
              "Espelho"
            ]
          }
        ]
      },
      {
        "id": "lavabo_sec_7",
        "titulo": "8. Iluminação (CRÍTICO)",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Você quer um ambiente mais discreto ou que surpreenda?",
            "secao": "8. Iluminação (CRÍTICO)"
          }
        ],
        "itens": [
          "Luz decorativa",
          "Luz indireta",
          "Destaque de materiais"
        ],
        "conteudoLinhas": [
          "   Luz decorativa",
          "   Luz indireta",
          "   Destaque de materiais",
          "[Pergunta-chave:] Você quer um ambiente mais discreto ou que surpreenda?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Luz decorativa"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz indireta"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Destaque de materiais"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Você quer um ambiente mais discreto ou que surpreenda?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "lavabo_sec_8",
        "titulo": "9. Decoração",
        "perguntasDestaque": [],
        "itens": [
          "Objetos",
          "Vasos",
          "Quadros",
          "Iluminação cênica"
        ],
        "conteudoLinhas": [
          "   Objetos",
          "   Vasos",
          "   Quadros",
          "   Iluminação cênica"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Objetos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Vasos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Quadros"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Iluminação cênica"
            ]
          }
        ]
      },
      {
        "id": "lavabo_sec_9",
        "titulo": "10. Manutenção",
        "perguntasDestaque": [],
        "itens": [
          "Fácil limpeza",
          "Baixo uso",
          "Durabilidade"
        ],
        "conteudoLinhas": [
          "   Fácil limpeza",
          "   Baixo uso",
          "   Durabilidade"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Fácil limpeza"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Baixo uso"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Durabilidade"
            ]
          }
        ]
      },
      {
        "id": "lavabo_sec_10",
        "titulo": "11. Pontos de dor",
        "perguntasDestaque": [],
        "itens": [
          "Ambiente sem graça",
          "Muito simples",
          "Sem identidade"
        ],
        "conteudoLinhas": [
          "   Ambiente sem graça",
          "   Muito simples",
          "   Sem identidade"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Ambiente sem graça"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Muito simples"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Sem identidade"
            ]
          }
        ]
      },
      {
        "id": "lavabo_sec_11",
        "titulo": "12. Perguntas de aprofundamento",
        "perguntasDestaque": [
          {
            "tipo": "profunda",
            "rotulo": "12. Perguntas de aprofundamento",
            "pergunta": "Você quer impressionar suas visitas?",
            "secao": "12. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "12. Perguntas de aprofundamento",
            "pergunta": "Prefere algo mais discreto ou marcante?",
            "secao": "12. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "12. Perguntas de aprofundamento",
            "pergunta": "Existe algum lavabo que você já viu e gostou?",
            "secao": "12. Perguntas de aprofundamento"
          }
        ],
        "itens": [
          "Você quer impressionar suas visitas?",
          "Prefere algo mais discreto ou marcante?",
          "Existe algum lavabo que você já viu e gostou?"
        ],
        "conteudoLinhas": [
          "   Você quer impressionar suas visitas?",
          "   Prefere algo mais discreto ou marcante?",
          "   Existe algum lavabo que você já viu e gostou?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Você quer impressionar suas visitas?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Prefere algo mais discreto ou marcante?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Existe algum lavabo que você já viu e gostou?"
            ]
          }
        ]
      },
      {
        "id": "lavabo_sec_12",
        "titulo": "13. Investimento e prioridade",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "13. Investimento e prioridade",
            "pergunta": "Já tem previsão?",
            "secao": "13. Investimento e prioridade"
          }
        ],
        "itens": [
          "Já tem previsão?",
          "Prioriza:",
          "Estética",
          "Impacto",
          "Custo-benefício"
        ],
        "conteudoLinhas": [
          "   Já tem previsão?",
          "   Prioriza:",
          "o Estética",
          "o Impacto",
          "o Custo-benefício"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Já tem previsão?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Prioriza:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Estética"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Impacto"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Custo-benefício"
            ]
          }
        ]
      },
      {
        "id": "lavabo_sec_13",
        "titulo": "14. Checklist técnico",
        "perguntasDestaque": [],
        "itens": [
          "Medidas",
          "Posição da cuba",
          "Iluminação",
          "Circulação"
        ],
        "conteudoLinhas": [
          "   Medidas",
          "   Posição da cuba",
          "   Iluminação",
          "   Circulação"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Medidas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Posição da cuba"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Iluminação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Circulação"
            ]
          }
        ]
      },
      {
        "id": "lavabo_sec_14",
        "titulo": "15. Resumo para o projetista",
        "perguntasDestaque": [],
        "itens": [],
        "conteudoLinhas": [
          "Uso:",
          "Nível de destaque:",
          "Estilo:",
          "Itens obrigatórios:",
          "Pontos críticos:"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Uso:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Nível de destaque:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Estilo:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Itens obrigatórios:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Pontos críticos:",
            "itens": []
          }
        ]
      }
    ],
    "perguntasEstrategicas": [
      {
        "tipo": "estrategica",
        "rotulo": "2. Objetivo do ambiente",
        "pergunta": "Qual o papel do lavabo?",
        "secao": "2. Objetivo do ambiente"
      },
      {
        "tipo": "emocional",
        "rotulo": "Pergunta emocional:",
        "pergunta": "O que você quer que a visita sinta ao entrar aqui?",
        "secao": "2. Objetivo do ambiente"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Você quer um ambiente mais discreto ou que surpreenda?",
        "secao": "8. Iluminação (CRÍTICO)"
      },
      {
        "tipo": "profunda",
        "rotulo": "12. Perguntas de aprofundamento",
        "pergunta": "Você quer impressionar suas visitas?",
        "secao": "12. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "12. Perguntas de aprofundamento",
        "pergunta": "Prefere algo mais discreto ou marcante?",
        "secao": "12. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "12. Perguntas de aprofundamento",
        "pergunta": "Existe algum lavabo que você já viu e gostou?",
        "secao": "12. Perguntas de aprofundamento"
      },
      {
        "tipo": "estrategica",
        "rotulo": "13. Investimento e prioridade",
        "pergunta": "Já tem previsão?",
        "secao": "13. Investimento e prioridade"
      }
    ],
    "topicosChecagemTecnica": [
      "8. Iluminação (CRÍTICO)",
      "14. Checklist técnico",
      "[14. Checklist técnico] Medidas",
      "[14. Checklist técnico] Posição da cuba",
      "[14. Checklist técnico] Iluminação",
      "[14. Checklist técnico] Circulação",
      "15. Resumo para o projetista"
    ]
  },
  "lavanderia": {
    "slug": "lavanderia",
    "titulo": "Área de Serviço / Lavanderia",
    "subtitulo": "Fluxo de roupas sujas e limpas, máquina, varal, produtos e tábua de passar",
    "arquivoPdfOriginal": "BRIEFING LAVANDERIA.pdf",
    "secoes": [
      {
        "id": "lavanderia_sec_1",
        "titulo": "2. Objetivo da lavanderia",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "2. Objetivo da lavanderia",
            "pergunta": "Qual o papel da lavanderia?",
            "secao": "2. Objetivo da lavanderia"
          },
          {
            "tipo": "emocional",
            "rotulo": "Pergunta emocional:",
            "pergunta": "O que você quer sentir ao usar sua lavanderia?",
            "secao": "2. Objetivo da lavanderia"
          }
        ],
        "itens": [
          "Uso diário intenso",
          "Uso moderado",
          "Apoio da casa",
          "Espaço funcional (sem preocupação estética)",
          "Espaço organizado e bonito",
          "Área integrada (precisa “esconder” visual)",
          "Organização",
          "Praticidade",
          "Agilidade",
          "Limpeza",
          "Tranquilidade"
        ],
        "conteudoLinhas": [
          "Qual o papel da lavanderia?",
          "   Uso diário intenso",
          "   Uso moderado",
          "   Apoio da casa",
          "   Espaço funcional (sem preocupação estética)",
          "   Espaço organizado e bonito",
          "   Área integrada (precisa “esconder” visual)",
          "[Pergunta emocional:] O que você quer sentir ao usar sua lavanderia?",
          "   Organização",
          "   Praticidade",
          "   Agilidade",
          "   Limpeza",
          "   Tranquilidade"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Qual o papel da lavanderia?",
            "itens": [
              "Uso diário intenso",
              "Uso moderado",
              "Apoio da casa",
              "Espaço funcional (sem preocupação estética)",
              "Espaço organizado e bonito",
              "Área integrada (precisa “esconder” visual)"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta emocional:",
            "texto": "O que você quer sentir ao usar sua lavanderia?",
            "tipoPergunta": "emocional",
            "itens": [
              "Organização",
              "Praticidade",
              "Agilidade",
              "Limpeza",
              "Tranquilidade"
            ]
          }
        ]
      },
      {
        "id": "lavanderia_sec_2",
        "titulo": "3. Rotina de uso",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "A lavanderia hoje te ajuda ou te atrapalha?",
            "secao": "3. Rotina de uso"
          }
        ],
        "itens": [
          "Frequência: (diária / semanal / eventual)",
          "Quem utiliza:",
          "Cliente",
          "Cônjuge",
          "Funcionária",
          "Volume de roupa:",
          "Baixo",
          "Médio",
          "Alto"
        ],
        "conteudoLinhas": [
          "   Frequência: (diária / semanal / eventual)",
          "   Quem utiliza:",
          "o Cliente",
          "o Cônjuge",
          "o Funcionária",
          "   Volume de roupa:",
          "o Baixo",
          "o Médio",
          "o Alto",
          "[Pergunta-chave:] A lavanderia hoje te ajuda ou te atrapalha?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Frequência: (diária / semanal / eventual)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Quem utiliza:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cliente"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cônjuge"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Funcionária"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Volume de roupa:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Baixo"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Médio"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Alto"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "A lavanderia hoje te ajuda ou te atrapalha?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "lavanderia_sec_3",
        "titulo": "4. Equipamentos",
        "perguntasDestaque": [],
        "itens": [
          "Máquina de lavar",
          "Secadora",
          "Lava e seca",
          "Tanquinho",
          "Tanque",
          "Tábua de passar",
          "Ferro de passar",
          "Varal (fixo / retrátil / teto)",
          "Aquecedor (se houver)"
        ],
        "conteudoLinhas": [
          "Listar todos:",
          "   Máquina de lavar",
          "    Secadora",
          "    Lava e seca",
          "    Tanquinho",
          "    Tanque",
          "    Tábua de passar",
          "    Ferro de passar",
          "    Varal (fixo / retrátil / teto)",
          "    Aquecedor (se houver)",
          "Importante: confirmar medidas e posições."
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Listar todos:",
            "itens": [
              "Máquina de lavar",
              "Secadora",
              "Lava e seca",
              "Tanquinho",
              "Tanque",
              "Tábua de passar",
              "Ferro de passar",
              "Varal (fixo / retrátil / teto)",
              "Aquecedor (se houver)"
            ]
          },
          {
            "tipo": "nota",
            "texto": "Importante: confirmar medidas e posições."
          }
        ]
      },
      {
        "id": "lavanderia_sec_4",
        "titulo": "5. Fluxo de uso (ESSENCIAL)",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "5. Fluxo de uso (ESSENCIAL)",
            "pergunta": "1.   Roupa suja chega onde?",
            "secao": "5. Fluxo de uso (ESSENCIAL)"
          },
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Hoje esse fluxo funciona bem ou gera bagunça?",
            "secao": "5. Fluxo de uso (ESSENCIAL)"
          }
        ],
        "itens": [
          "1.   Roupa suja chega onde?",
          "2.   Separação",
          "3.   Lavagem",
          "4.   Secagem",
          "5.   Passar",
          "6.   Guardar"
        ],
        "conteudoLinhas": [
          "Sequência ideal:",
          "1.   Roupa suja chega onde?",
          "2.   Separação",
          "3.   Lavagem",
          "4.   Secagem",
          "5.   Passar",
          "6.   Guardar",
          "[Pergunta-chave:] Hoje esse fluxo funciona bem ou gera bagunça?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Sequência ideal:",
            "itens": [
              "1.   Roupa suja chega onde?",
              "2.   Separação",
              "3.   Lavagem",
              "4.   Secagem",
              "5.   Passar",
              "6.   Guardar"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Hoje esse fluxo funciona bem ou gera bagunça?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "lavanderia_sec_5",
        "titulo": "6. Armazenamento",
        "perguntasDestaque": [],
        "itens": [
          "Produtos de limpeza",
          "Sabão / amaciante",
          "Baldes",
          "Vassouras / rodos",
          "Aspirador",
          "Panos",
          "Cestos de roupa",
          "Itens de pet",
          "Tudo escondido",
          "Parte visível",
          "Misto"
        ],
        "conteudoLinhas": [
          "Precisa guardar:",
          "    Produtos de limpeza",
          "    Sabão / amaciante",
          "    Baldes",
          "    Vassouras / rodos",
          "    Aspirador",
          "    Panos",
          "    Cestos de roupa",
          "    Itens de pet",
          "Preferência:",
          "    Tudo escondido",
          "    Parte visível",
          "    Misto"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Precisa guardar:",
            "itens": [
              "Produtos de limpeza",
              "Sabão / amaciante",
              "Baldes",
              "Vassouras / rodos",
              "Aspirador",
              "Panos",
              "Cestos de roupa",
              "Itens de pet"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Preferência:",
            "itens": [
              "Tudo escondido",
              "Parte visível",
              "Misto"
            ]
          }
        ]
      },
      {
        "id": "lavanderia_sec_6",
        "titulo": "7. Organização",
        "perguntasDestaque": [],
        "itens": [
          "Muito organizado",
          "Moderado",
          "Bagunceiro",
          "Armários fechados",
          "Nichos",
          "Ganchos",
          "Suportes verticais",
          "Cestos organizadores"
        ],
        "conteudoLinhas": [
          "   Muito organizado",
          "   Moderado",
          "   Bagunceiro",
          "Precisa de:",
          "   Armários fechados",
          "   Nichos",
          "   Ganchos",
          "   Suportes verticais",
          "   Cestos organizadores"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Muito organizado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Moderado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Bagunceiro"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Precisa de:",
            "itens": [
              "Armários fechados",
              "Nichos",
              "Ganchos",
              "Suportes verticais",
              "Cestos organizadores"
            ]
          }
        ]
      },
      {
        "id": "lavanderia_sec_7",
        "titulo": "8. Espaço para roupas",
        "perguntasDestaque": [],
        "itens": [
          "Área para separar roupas",
          "Cesto embutido",
          "Bancada para dobrar",
          "Varal:",
          "Interno",
          "Externo",
          "Retrátil",
          "Teto"
        ],
        "conteudoLinhas": [
          "   Área para separar roupas",
          "   Cesto embutido",
          "   Bancada para dobrar",
          "   Varal:",
          "o Interno",
          "o Externo",
          "o Retrátil",
          "o Teto"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Área para separar roupas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cesto embutido"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Bancada para dobrar"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Varal:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Interno"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Externo"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Retrátil"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Teto"
            ]
          }
        ]
      },
      {
        "id": "lavanderia_sec_8",
        "titulo": "9. Passadoria",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "9. Passadoria",
            "pergunta": "Passa roupa em casa?",
            "secao": "9. Passadoria"
          }
        ],
        "itens": [
          "Passa roupa em casa?",
          "Frequência:",
          "Tábua fixa",
          "Tábua retrátil",
          "Espaço dedicado",
          "Não precisa"
        ],
        "conteudoLinhas": [
          "   Passa roupa em casa?",
          "   Frequência:",
          "Precisa de:",
          "   Tábua fixa",
          "   Tábua retrátil",
          "   Espaço dedicado",
          "   Não precisa"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Passa roupa em casa?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Frequência:"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Precisa de:",
            "itens": [
              "Tábua fixa",
              "Tábua retrátil",
              "Espaço dedicado",
              "Não precisa"
            ]
          }
        ]
      },
      {
        "id": "lavanderia_sec_9",
        "titulo": "10. Integração com outros ambientes",
        "perguntasDestaque": [],
        "itens": [
          "Cozinha",
          "Área externa",
          "Corredor",
          "Área gourmet",
          "Garagem",
          "Disfarçar totalmente",
          "Integrar visualmente",
          "Manter aparência organizada"
        ],
        "conteudoLinhas": [
          "A lavanderia se conecta com:",
          "   Cozinha",
          "   Área externa",
          "   Corredor",
          "   Área gourmet",
          "   Garagem",
          "O cliente deseja:",
          "   Disfarçar totalmente",
          "   Integrar visualmente",
          "   Manter aparência organizada"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "A lavanderia se conecta com:",
            "itens": [
              "Cozinha",
              "Área externa",
              "Corredor",
              "Área gourmet",
              "Garagem"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "O cliente deseja:",
            "itens": [
              "Disfarçar totalmente",
              "Integrar visualmente",
              "Manter aparência organizada"
            ]
          }
        ]
      },
      {
        "id": "lavanderia_sec_10",
        "titulo": "11. Estética",
        "perguntasDestaque": [],
        "itens": [
          "Funcional",
          "Clean",
          "Discreta",
          "Sofisticada",
          "Seguindo padrão da casa",
          "Resistentes à umidade",
          "Fáceis de limpar",
          "Tons claros / neutros / escuros"
        ],
        "conteudoLinhas": [
          "   Funcional",
          "   Clean",
          "   Discreta",
          "   Sofisticada",
          "   Seguindo padrão da casa",
          "Materiais:",
          "   Resistentes à umidade",
          "   Fáceis de limpar",
          "   Tons claros / neutros / escuros"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Funcional"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Clean"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Discreta"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Sofisticada"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Seguindo padrão da casa"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Materiais:",
            "itens": [
              "Resistentes à umidade",
              "Fáceis de limpar",
              "Tons claros / neutros / escuros"
            ]
          }
        ]
      },
      {
        "id": "lavanderia_sec_11",
        "titulo": "12. Manutenção (CRÍTICO)",
        "perguntasDestaque": [],
        "itens": [
          "Alta umidade?",
          "Sol direto?",
          "Poeira?",
          "Materiais resistentes",
          "Fácil limpeza",
          "Evitar ferrugem",
          "Evitar empenamento"
        ],
        "conteudoLinhas": [
          "   Alta umidade?",
          "   Sol direto?",
          "   Poeira?",
          "Necessidades:",
          "   Materiais resistentes",
          "   Fácil limpeza",
          "   Evitar ferrugem",
          "   Evitar empenamento"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Alta umidade?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Sol direto?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Poeira?"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Necessidades:",
            "itens": [
              "Materiais resistentes",
              "Fácil limpeza",
              "Evitar ferrugem",
              "Evitar empenamento"
            ]
          }
        ]
      },
      {
        "id": "lavanderia_sec_12",
        "titulo": "13. Iluminação",
        "perguntasDestaque": [],
        "itens": [
          "Luz natural?",
          "Necessidade de:",
          "Luz geral forte",
          "Luz funcional (bancada)",
          "Luz para varal"
        ],
        "conteudoLinhas": [
          "   Luz natural?",
          "   Necessidade de:",
          "o     Luz geral forte",
          "o     Luz funcional (bancada)",
          "o     Luz para varal"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Luz natural?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Necessidade de:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz geral forte"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz funcional (bancada)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz para varal"
            ]
          }
        ]
      },
      {
        "id": "lavanderia_sec_13",
        "titulo": "14. Pets",
        "perguntasDestaque": [],
        "itens": [
          "Tem pet?",
          "Espaço para banho",
          "Armazenamento de ração",
          "Local para acessórios"
        ],
        "conteudoLinhas": [
          "   Tem pet?",
          "Necessidades:",
          "   Espaço para banho",
          "   Armazenamento de ração",
          "   Local para acessórios"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Tem pet?"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Necessidades:",
            "itens": [
              "Espaço para banho",
              "Armazenamento de ração",
              "Local para acessórios"
            ]
          }
        ]
      },
      {
        "id": "lavanderia_sec_14",
        "titulo": "15. Pontos de dor",
        "perguntasDestaque": [],
        "itens": [
          "Bagunça",
          "Falta de espaço",
          "Falta de organização",
          "Produtos expostos",
          "Falta de bancada",
          "Má circulação",
          "Falta de armários",
          "Dificuldade de secagem"
        ],
        "conteudoLinhas": [
          "   Bagunça",
          "   Falta de espaço",
          "   Falta de organização",
          "   Produtos expostos",
          "   Falta de bancada",
          "   Má circulação",
          "   Falta de armários",
          "   Dificuldade de secagem"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Bagunça"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Falta de espaço"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Falta de organização"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Produtos expostos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Falta de bancada"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Má circulação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Falta de armários"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Dificuldade de secagem"
            ]
          }
        ]
      },
      {
        "id": "lavanderia_sec_15",
        "titulo": "16. Perguntas de aprofundamento",
        "perguntasDestaque": [
          {
            "tipo": "profunda",
            "rotulo": "16. Perguntas de aprofundamento",
            "pergunta": "O que mais te incomoda na sua lavanderia hoje?",
            "secao": "16. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "16. Perguntas de aprofundamento",
            "pergunta": "O que faria sua rotina ficar mais fácil?",
            "secao": "16. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "16. Perguntas de aprofundamento",
            "pergunta": "Você prefere uma lavanderia escondida ou bem resolvida visualmente?",
            "secao": "16. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "16. Perguntas de aprofundamento",
            "pergunta": "Qual etapa (lavar, secar, passar, guardar) mais te incomoda?",
            "secao": "16. Perguntas de aprofundamento"
          }
        ],
        "itens": [
          "O que mais te incomoda na sua lavanderia hoje?",
          "O que faria sua rotina ficar mais fácil?",
          "Você prefere uma lavanderia escondida ou bem resolvida visualmente?",
          "Qual etapa (lavar, secar, passar, guardar) mais te incomoda?"
        ],
        "conteudoLinhas": [
          "   O que mais te incomoda na sua lavanderia hoje?",
          "   O que faria sua rotina ficar mais fácil?",
          "   Você prefere uma lavanderia escondida ou bem resolvida visualmente?",
          "   Qual etapa (lavar, secar, passar, guardar) mais te incomoda?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "O que mais te incomoda na sua lavanderia hoje?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "O que faria sua rotina ficar mais fácil?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você prefere uma lavanderia escondida ou bem resolvida visualmente?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Qual etapa (lavar, secar, passar, guardar) mais te incomoda?"
            ]
          }
        ]
      },
      {
        "id": "lavanderia_sec_16",
        "titulo": "17. Investimento e prioridade",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "17. Investimento e prioridade",
            "pergunta": "Já tem previsão de investimento?",
            "secao": "17. Investimento e prioridade"
          }
        ],
        "itens": [
          "Já tem previsão de investimento?",
          "Prioriza:",
          "Funcionalidade",
          "Organização",
          "Estética",
          "Durabilidade"
        ],
        "conteudoLinhas": [
          "   Já tem previsão de investimento?",
          "   Prioriza:",
          "o Funcionalidade",
          "o Organização",
          "o Estética",
          "o Durabilidade"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Já tem previsão de investimento?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Prioriza:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Funcionalidade"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Organização"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Estética"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Durabilidade"
            ]
          }
        ]
      },
      {
        "id": "lavanderia_sec_17",
        "titulo": "18. Checklist técnico",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "18. Checklist técnico",
            "pergunta": "Pontos hidráulicos definidos?",
            "secao": "18. Checklist técnico"
          },
          {
            "tipo": "estrategica",
            "rotulo": "18. Checklist técnico",
            "pergunta": "Pontos elétricos definidos?",
            "secao": "18. Checklist técnico"
          },
          {
            "tipo": "estrategica",
            "rotulo": "18. Checklist técnico",
            "pergunta": "Saída de água correta?",
            "secao": "18. Checklist técnico"
          },
          {
            "tipo": "estrategica",
            "rotulo": "18. Checklist técnico",
            "pergunta": "Espaço para ventilação?",
            "secao": "18. Checklist técnico"
          },
          {
            "tipo": "estrategica",
            "rotulo": "18. Checklist técnico",
            "pergunta": "Medidas das máquinas?",
            "secao": "18. Checklist técnico"
          },
          {
            "tipo": "estrategica",
            "rotulo": "18. Checklist técnico",
            "pergunta": "Área externa ou interna?",
            "secao": "18. Checklist técnico"
          }
        ],
        "itens": [
          "Pontos hidráulicos definidos?",
          "Pontos elétricos definidos?",
          "Saída de água correta?",
          "Espaço para ventilação?",
          "Medidas das máquinas?",
          "Área externa ou interna?"
        ],
        "conteudoLinhas": [
          "   Pontos hidráulicos definidos?",
          "   Pontos elétricos definidos?",
          "   Saída de água correta?",
          "   Espaço para ventilação?",
          "   Medidas das máquinas?",
          "   Área externa ou interna?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Pontos hidráulicos definidos?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Pontos elétricos definidos?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Saída de água correta?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espaço para ventilação?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Medidas das máquinas?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Área externa ou interna?"
            ]
          }
        ]
      },
      {
        "id": "lavanderia_sec_18",
        "titulo": "19. Resumo para o projetista",
        "perguntasDestaque": [],
        "itens": [],
        "conteudoLinhas": [
          "Volume de uso:",
          "Fluxo atual:",
          "Principais dores:",
          "Itens obrigatórios:",
          "Nível de organização:",
          "Integração:",
          "Estilo:",
          "Riscos técnicos:"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Volume de uso:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Fluxo atual:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Principais dores:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Itens obrigatórios:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Nível de organização:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Integração:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Estilo:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Riscos técnicos:",
            "itens": []
          }
        ]
      }
    ],
    "perguntasEstrategicas": [
      {
        "tipo": "estrategica",
        "rotulo": "2. Objetivo da lavanderia",
        "pergunta": "Qual o papel da lavanderia?",
        "secao": "2. Objetivo da lavanderia"
      },
      {
        "tipo": "emocional",
        "rotulo": "Pergunta emocional:",
        "pergunta": "O que você quer sentir ao usar sua lavanderia?",
        "secao": "2. Objetivo da lavanderia"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "A lavanderia hoje te ajuda ou te atrapalha?",
        "secao": "3. Rotina de uso"
      },
      {
        "tipo": "estrategica",
        "rotulo": "5. Fluxo de uso (ESSENCIAL)",
        "pergunta": "1.   Roupa suja chega onde?",
        "secao": "5. Fluxo de uso (ESSENCIAL)"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Hoje esse fluxo funciona bem ou gera bagunça?",
        "secao": "5. Fluxo de uso (ESSENCIAL)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "9. Passadoria",
        "pergunta": "Passa roupa em casa?",
        "secao": "9. Passadoria"
      },
      {
        "tipo": "profunda",
        "rotulo": "16. Perguntas de aprofundamento",
        "pergunta": "O que mais te incomoda na sua lavanderia hoje?",
        "secao": "16. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "16. Perguntas de aprofundamento",
        "pergunta": "O que faria sua rotina ficar mais fácil?",
        "secao": "16. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "16. Perguntas de aprofundamento",
        "pergunta": "Você prefere uma lavanderia escondida ou bem resolvida visualmente?",
        "secao": "16. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "16. Perguntas de aprofundamento",
        "pergunta": "Qual etapa (lavar, secar, passar, guardar) mais te incomoda?",
        "secao": "16. Perguntas de aprofundamento"
      },
      {
        "tipo": "estrategica",
        "rotulo": "17. Investimento e prioridade",
        "pergunta": "Já tem previsão de investimento?",
        "secao": "17. Investimento e prioridade"
      },
      {
        "tipo": "estrategica",
        "rotulo": "18. Checklist técnico",
        "pergunta": "Pontos hidráulicos definidos?",
        "secao": "18. Checklist técnico"
      },
      {
        "tipo": "estrategica",
        "rotulo": "18. Checklist técnico",
        "pergunta": "Pontos elétricos definidos?",
        "secao": "18. Checklist técnico"
      },
      {
        "tipo": "estrategica",
        "rotulo": "18. Checklist técnico",
        "pergunta": "Saída de água correta?",
        "secao": "18. Checklist técnico"
      },
      {
        "tipo": "estrategica",
        "rotulo": "18. Checklist técnico",
        "pergunta": "Espaço para ventilação?",
        "secao": "18. Checklist técnico"
      },
      {
        "tipo": "estrategica",
        "rotulo": "18. Checklist técnico",
        "pergunta": "Medidas das máquinas?",
        "secao": "18. Checklist técnico"
      },
      {
        "tipo": "estrategica",
        "rotulo": "18. Checklist técnico",
        "pergunta": "Área externa ou interna?",
        "secao": "18. Checklist técnico"
      }
    ],
    "topicosChecagemTecnica": [
      "[4. Equipamentos] Máquina de lavar",
      "[4. Equipamentos] Secadora",
      "[4. Equipamentos] Lava e seca",
      "[4. Equipamentos] Tanquinho",
      "[4. Equipamentos] Tanque",
      "[4. Equipamentos] Tábua de passar",
      "[4. Equipamentos] Ferro de passar",
      "[4. Equipamentos] Varal (fixo / retrátil / teto)",
      "[4. Equipamentos] Aquecedor (se houver)",
      "5. Fluxo de uso (ESSENCIAL)",
      "[5. Fluxo de uso (ESSENCIAL)] 1.   Roupa suja chega onde?",
      "[5. Fluxo de uso (ESSENCIAL)] 2.   Separação",
      "[5. Fluxo de uso (ESSENCIAL)] 3.   Lavagem",
      "[5. Fluxo de uso (ESSENCIAL)] 4.   Secagem",
      "[5. Fluxo de uso (ESSENCIAL)] 5.   Passar",
      "[5. Fluxo de uso (ESSENCIAL)] 6.   Guardar",
      "12. Manutenção (CRÍTICO)",
      "18. Checklist técnico",
      "[18. Checklist técnico] Pontos hidráulicos definidos?",
      "[18. Checklist técnico] Pontos elétricos definidos?",
      "[18. Checklist técnico] Saída de água correta?",
      "[18. Checklist técnico] Espaço para ventilação?",
      "[18. Checklist técnico] Medidas das máquinas?",
      "[18. Checklist técnico] Área externa ou interna?",
      "19. Resumo para o projetista"
    ]
  },
  "living": {
    "slug": "living",
    "titulo": "Living / Sala de Estar",
    "subtitulo": "Convivência familiar, integração com jantar/varanda e layout de sofás",
    "arquivoPdfOriginal": "BRIEFING LIVING_ SALA DE ESTAR.pdf",
    "secoes": [
      {
        "id": "living_sec_1",
        "titulo": "2. Objetivo do ambiente",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "2. Objetivo do ambiente",
            "pergunta": "Qual o principal papel do living?",
            "secao": "2. Objetivo do ambiente"
          },
          {
            "tipo": "emocional",
            "rotulo": "Pergunta emocional:",
            "pergunta": "O que você quer sentir ao estar na sua sala?",
            "secao": "2. Objetivo do ambiente"
          }
        ],
        "itens": [
          "Receber convidados",
          "Uso diário da família",
          "Espaço de descanso",
          "Espaço social",
          "Integração com outros ambientes",
          "Ambiente de destaque da casa",
          "Conforto",
          "Aconchego",
          "Sofisticação",
          "Leveza",
          "Convivência",
          "Relaxamento"
        ],
        "conteudoLinhas": [
          "Qual o principal papel do living?",
          "   Receber convidados",
          "   Uso diário da família",
          "   Espaço de descanso",
          "   Espaço social",
          "   Integração com outros ambientes",
          "   Ambiente de destaque da casa",
          "[Pergunta emocional:] O que você quer sentir ao estar na sua sala?",
          "   Conforto",
          "   Aconchego",
          "   Sofisticação",
          "   Leveza",
          "   Convivência",
          "   Relaxamento"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Qual o principal papel do living?",
            "itens": [
              "Receber convidados",
              "Uso diário da família",
              "Espaço de descanso",
              "Espaço social",
              "Integração com outros ambientes",
              "Ambiente de destaque da casa"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta emocional:",
            "texto": "O que você quer sentir ao estar na sua sala?",
            "tipoPergunta": "emocional",
            "itens": [
              "Conforto",
              "Aconchego",
              "Sofisticação",
              "Leveza",
              "Convivência",
              "Relaxamento"
            ]
          }
        ]
      },
      {
        "id": "living_sec_2",
        "titulo": "3. Tipo de uso",
        "perguntasDestaque": [],
        "itens": [
          "Uso diário intenso",
          "Uso social (visitas)",
          "Uso ocasional",
          "Misto",
          "Moradores:",
          "Convidados frequentes:"
        ],
        "conteudoLinhas": [
          "   Uso diário intenso",
          "   Uso social (visitas)",
          "   Uso ocasional",
          "   Misto",
          "Quantas pessoas utilizam:",
          "   Moradores:",
          "   Convidados frequentes:"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Uso diário intenso"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Uso social (visitas)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Uso ocasional"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Misto"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Quantas pessoas utilizam:",
            "itens": [
              "Moradores:",
              "Convidados frequentes:"
            ]
          }
        ]
      },
      {
        "id": "living_sec_3",
        "titulo": "4. Perfil de convivência",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Sua sala é mais para viver com a família ou para receber?",
            "secao": "4. Perfil de convivência"
          }
        ],
        "itens": [
          "Recebe muitas visitas",
          "Recebe poucas visitas",
          "Prefere ambiente mais íntimo",
          "Prefere ambiente mais social"
        ],
        "conteudoLinhas": [
          "   Recebe muitas visitas",
          "   Recebe poucas visitas",
          "   Prefere ambiente mais íntimo",
          "   Prefere ambiente mais social",
          "[Pergunta-chave:] Sua sala é mais para viver com a família ou para receber?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Recebe muitas visitas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Recebe poucas visitas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Prefere ambiente mais íntimo"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Prefere ambiente mais social"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Sua sala é mais para viver com a família ou para receber?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "living_sec_4",
        "titulo": "5. Integração com outros ambientes",
        "perguntasDestaque": [],
        "itens": [
          "Sala de jantar",
          "Cozinha",
          "Área gourmet",
          "Home theater",
          "Hall de entrada",
          "Integração total",
          "Integração parcial",
          "Ambientes mais definidos"
        ],
        "conteudoLinhas": [
          "A sala se conecta com:",
          "   Sala de jantar",
          "   Cozinha",
          "   Área gourmet",
          "   Home theater",
          "   Hall de entrada",
          "O cliente deseja:",
          "   Integração total",
          "   Integração parcial",
          "   Ambientes mais definidos"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "A sala se conecta com:",
            "itens": [
              "Sala de jantar",
              "Cozinha",
              "Área gourmet",
              "Home theater",
              "Hall de entrada"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "O cliente deseja:",
            "itens": [
              "Integração total",
              "Integração parcial",
              "Ambientes mais definidos"
            ]
          }
        ]
      },
      {
        "id": "living_sec_5",
        "titulo": "6. Layout e circulação (CRÍTICO)",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "6. Layout e circulação (CRÍTICO)",
            "pergunta": "Espaço amplo ou reduzido?",
            "secao": "6. Layout e circulação (CRÍTICO)"
          },
          {
            "tipo": "estrategica",
            "rotulo": "6. Layout e circulação (CRÍTICO)",
            "pergunta": "Fluxo de circulação livre?",
            "secao": "6. Layout e circulação (CRÍTICO)"
          },
          {
            "tipo": "estrategica",
            "rotulo": "6. Layout e circulação (CRÍTICO)",
            "pergunta": "Interferência de portas/janelas?",
            "secao": "6. Layout e circulação (CRÍTICO)"
          },
          {
            "tipo": "estrategica",
            "rotulo": "6. Layout e circulação (CRÍTICO)",
            "pergunta": "Posição do sofá e TV?",
            "secao": "6. Layout e circulação (CRÍTICO)"
          }
        ],
        "itens": [
          "Espaço amplo ou reduzido?",
          "Fluxo de circulação livre?",
          "Interferência de portas/janelas?",
          "Posição do sofá e TV?"
        ],
        "conteudoLinhas": [
          "   Espaço amplo ou reduzido?",
          "   Fluxo de circulação livre?",
          "   Interferência de portas/janelas?",
          "   Posição do sofá e TV?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Espaço amplo ou reduzido?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Fluxo de circulação livre?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Interferência de portas/janelas?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Posição do sofá e TV?"
            ]
          }
        ]
      },
      {
        "id": "living_sec_6",
        "titulo": "7. Mobiliário principal",
        "perguntasDestaque": [],
        "itens": [
          "Sofá (quantos lugares)",
          "Poltronas",
          "Mesa de centro",
          "Mesa lateral",
          "Rack / painel",
          "Aparador",
          "Estante"
        ],
        "conteudoLinhas": [
          "   Sofá (quantos lugares)",
          "   Poltronas",
          "   Mesa de centro",
          "   Mesa lateral",
          "   Rack / painel",
          "   Aparador",
          "   Estante"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Sofá (quantos lugares)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Poltronas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Mesa de centro"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Mesa lateral"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Rack / painel"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Aparador"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Estante"
            ]
          }
        ]
      },
      {
        "id": "living_sec_7",
        "titulo": "8. Home / TV (se integrado)",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "8. Home / TV (se integrado)",
            "pergunta": "Integra com home theater?",
            "secao": "8. Home / TV (se integrado)"
          }
        ],
        "itens": [
          "TV (tamanho)",
          "Uso frequente?",
          "Integra com home theater?"
        ],
        "conteudoLinhas": [
          "   TV (tamanho)",
          "   Uso frequente?",
          "   Integra com home theater?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "TV (tamanho)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Uso frequente?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Integra com home theater?"
            ]
          }
        ]
      },
      {
        "id": "living_sec_8",
        "titulo": "9. Armazenamento",
        "perguntasDestaque": [],
        "itens": [
          "Objetos decorativos",
          "Livros",
          "Controles",
          "Eletrônicos",
          "Itens do dia a dia",
          "Tudo discreto",
          "Parte exposta",
          "Destaque decorativo"
        ],
        "conteudoLinhas": [
          "Precisa guardar:",
          "   Objetos decorativos",
          "   Livros",
          "   Controles",
          "   Eletrônicos",
          "   Itens do dia a dia",
          "Preferência:",
          "   Tudo discreto",
          "   Parte exposta",
          "   Destaque decorativo"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Precisa guardar:",
            "itens": [
              "Objetos decorativos",
              "Livros",
              "Controles",
              "Eletrônicos",
              "Itens do dia a dia"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Preferência:",
            "itens": [
              "Tudo discreto",
              "Parte exposta",
              "Destaque decorativo"
            ]
          }
        ]
      },
      {
        "id": "living_sec_9",
        "titulo": "10. Estilo visual",
        "perguntasDestaque": [],
        "itens": [
          "Sofisticado",
          "Moderno",
          "Minimalista",
          "Aconchegante",
          "Neutro",
          "Marcante",
          "Madeira",
          "Laca",
          "Vidro",
          "Metal",
          "Tecido",
          "Pedra"
        ],
        "conteudoLinhas": [
          "   Sofisticado",
          "   Moderno",
          "   Minimalista",
          "   Aconchegante",
          "   Neutro",
          "   Marcante",
          "Materiais:",
          "   Madeira",
          "   Laca",
          "   Vidro",
          "   Metal",
          "   Tecido",
          "   Pedra"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Sofisticado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Moderno"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Minimalista"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Aconchegante"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Neutro"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Marcante"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Materiais:",
            "itens": [
              "Madeira",
              "Laca",
              "Vidro",
              "Metal",
              "Tecido",
              "Pedra"
            ]
          }
        ]
      },
      {
        "id": "living_sec_10",
        "titulo": "11. Estética vs funcionalidade",
        "perguntasDestaque": [
          {
            "tipo": "geral",
            "rotulo": "Pergunta:",
            "pergunta": "Você quer um ambiente mais bonito ou mais confortável?",
            "secao": "11. Estética vs funcionalidade"
          }
        ],
        "itens": [
          "Mais estética",
          "Mais funcional",
          "Equilíbrio"
        ],
        "conteudoLinhas": [
          "   Mais estética",
          "   Mais funcional",
          "   Equilíbrio",
          "[Pergunta:] Você quer um ambiente mais bonito ou mais confortável?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Mais estética"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Mais funcional"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Equilíbrio"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta:",
            "texto": "Você quer um ambiente mais bonito ou mais confortável?",
            "tipoPergunta": "geral",
            "itens": []
          }
        ]
      },
      {
        "id": "living_sec_11",
        "titulo": "12. Iluminação (DIFERENCIAL FORTE)",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Você usa mais esse ambiente à noite ou durante o dia?",
            "secao": "12. Iluminação (DIFERENCIAL FORTE)"
          }
        ],
        "itens": [
          "Luz geral",
          "Luz indireta",
          "Destaque em painéis",
          "Destaque em objetos",
          "Dimerização"
        ],
        "conteudoLinhas": [
          "   Luz geral",
          "   Luz indireta",
          "   Destaque em painéis",
          "   Destaque em objetos",
          "   Dimerização",
          "[Pergunta-chave:] Você usa mais esse ambiente à noite ou durante o dia?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Luz geral"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz indireta"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Destaque em painéis"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Destaque em objetos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Dimerização"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Você usa mais esse ambiente à noite ou durante o dia?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "living_sec_12",
        "titulo": "13. Conforto",
        "perguntasDestaque": [],
        "itens": [
          "Tipo de sofá (mais firme ou macio)",
          "Uso prolongado (filmes, descanso)",
          "Ambiente para relaxar"
        ],
        "conteudoLinhas": [
          "   Tipo de sofá (mais firme ou macio)",
          "   Uso prolongado (filmes, descanso)",
          "   Ambiente para relaxar"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Tipo de sofá (mais firme ou macio)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Uso prolongado (filmes, descanso)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ambiente para relaxar"
            ]
          }
        ]
      },
      {
        "id": "living_sec_13",
        "titulo": "14. Decoração",
        "perguntasDestaque": [
          {
            "tipo": "geral",
            "rotulo": "Pergunta:",
            "pergunta": "Você gosta de ambientes mais decorados ou mais limpos?",
            "secao": "14. Decoração"
          }
        ],
        "itens": [
          "Quadros",
          "Objetos",
          "Esculturas",
          "Plantas",
          "Livros"
        ],
        "conteudoLinhas": [
          "   Quadros",
          "   Objetos",
          "   Esculturas",
          "   Plantas",
          "   Livros",
          "[Pergunta:] Você gosta de ambientes mais decorados ou mais limpos?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Quadros"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Objetos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Esculturas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Plantas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Livros"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta:",
            "texto": "Você gosta de ambientes mais decorados ou mais limpos?",
            "tipoPergunta": "geral",
            "itens": []
          }
        ]
      },
      {
        "id": "living_sec_14",
        "titulo": "15. Tecnologia",
        "perguntasDestaque": [],
        "itens": [
          "Automação",
          "Som ambiente",
          "Tomadas USB",
          "Organização de cabos"
        ],
        "conteudoLinhas": [
          "   Automação",
          "   Som ambiente",
          "   Tomadas USB",
          "   Organização de cabos"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Automação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Som ambiente"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tomadas USB"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Organização de cabos"
            ]
          }
        ]
      },
      {
        "id": "living_sec_15",
        "titulo": "16. Pontos de dor",
        "perguntasDestaque": [],
        "itens": [
          "Falta de conforto",
          "Ambiente sem identidade",
          "Bagunça",
          "Má circulação",
          "Iluminação ruim",
          "Espaço mal aproveitado"
        ],
        "conteudoLinhas": [
          "   Falta de conforto",
          "   Ambiente sem identidade",
          "   Bagunça",
          "   Má circulação",
          "   Iluminação ruim",
          "   Espaço mal aproveitado"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Falta de conforto"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ambiente sem identidade"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Bagunça"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Má circulação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Iluminação ruim"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espaço mal aproveitado"
            ]
          }
        ]
      },
      {
        "id": "living_sec_16",
        "titulo": "17. Perguntas de aprofundamento",
        "perguntasDestaque": [
          {
            "tipo": "profunda",
            "rotulo": "17. Perguntas de aprofundamento",
            "pergunta": "O que mais te incomoda na sua sala hoje?",
            "secao": "17. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "17. Perguntas de aprofundamento",
            "pergunta": "Você passa muito tempo nesse ambiente?",
            "secao": "17. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "17. Perguntas de aprofundamento",
            "pergunta": "Você gosta de receber pessoas aqui?",
            "secao": "17. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "17. Perguntas de aprofundamento",
            "pergunta": "Você quer um ambiente que impressione ou que acolha?",
            "secao": "17. Perguntas de aprofundamento"
          }
        ],
        "itens": [
          "O que mais te incomoda na sua sala hoje?",
          "Você passa muito tempo nesse ambiente?",
          "Você gosta de receber pessoas aqui?",
          "Você quer um ambiente que impressione ou que acolha?"
        ],
        "conteudoLinhas": [
          "   O que mais te incomoda na sua sala hoje?",
          "   Você passa muito tempo nesse ambiente?",
          "   Você gosta de receber pessoas aqui?",
          "   Você quer um ambiente que impressione ou que acolha?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "O que mais te incomoda na sua sala hoje?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você passa muito tempo nesse ambiente?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você gosta de receber pessoas aqui?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você quer um ambiente que impressione ou que acolha?"
            ]
          }
        ]
      },
      {
        "id": "living_sec_17",
        "titulo": "18. Investimento e prioridade",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "18. Investimento e prioridade",
            "pergunta": "Já tem previsão?",
            "secao": "18. Investimento e prioridade"
          }
        ],
        "itens": [
          "Já tem previsão?",
          "Prioriza:",
          "Estética",
          "Conforto",
          "Funcionalidade",
          "Integração"
        ],
        "conteudoLinhas": [
          "   Já tem previsão?",
          "   Prioriza:",
          "o Estética",
          "o Conforto",
          "o Funcionalidade",
          "o Integração"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Já tem previsão?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Prioriza:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Estética"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Conforto"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Funcionalidade"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Integração"
            ]
          }
        ]
      },
      {
        "id": "living_sec_18",
        "titulo": "19. Checklist técnico",
        "perguntasDestaque": [],
        "itens": [
          "Medidas do ambiente",
          "Posição de tomadas",
          "Posição da TV",
          "Circulação",
          "Integração com outros espaços"
        ],
        "conteudoLinhas": [
          "   Medidas do ambiente",
          "   Posição de tomadas",
          "   Posição da TV",
          "   Circulação",
          "   Integração com outros espaços"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Medidas do ambiente"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Posição de tomadas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Posição da TV"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Circulação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Integração com outros espaços"
            ]
          }
        ]
      },
      {
        "id": "living_sec_19",
        "titulo": "20. Resumo para o projetista",
        "perguntasDestaque": [],
        "itens": [],
        "conteudoLinhas": [
          "Uso principal:",
          "Perfil de convivência:",
          "Integração:",
          "Estilo:",
          "Nível de conforto:",
          "Itens obrigatórios:",
          "Pontos críticos:"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Uso principal:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Perfil de convivência:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Integração:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Estilo:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Nível de conforto:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Itens obrigatórios:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Pontos críticos:",
            "itens": []
          }
        ]
      }
    ],
    "perguntasEstrategicas": [
      {
        "tipo": "estrategica",
        "rotulo": "2. Objetivo do ambiente",
        "pergunta": "Qual o principal papel do living?",
        "secao": "2. Objetivo do ambiente"
      },
      {
        "tipo": "emocional",
        "rotulo": "Pergunta emocional:",
        "pergunta": "O que você quer sentir ao estar na sua sala?",
        "secao": "2. Objetivo do ambiente"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Sua sala é mais para viver com a família ou para receber?",
        "secao": "4. Perfil de convivência"
      },
      {
        "tipo": "estrategica",
        "rotulo": "6. Layout e circulação (CRÍTICO)",
        "pergunta": "Espaço amplo ou reduzido?",
        "secao": "6. Layout e circulação (CRÍTICO)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "6. Layout e circulação (CRÍTICO)",
        "pergunta": "Fluxo de circulação livre?",
        "secao": "6. Layout e circulação (CRÍTICO)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "6. Layout e circulação (CRÍTICO)",
        "pergunta": "Interferência de portas/janelas?",
        "secao": "6. Layout e circulação (CRÍTICO)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "6. Layout e circulação (CRÍTICO)",
        "pergunta": "Posição do sofá e TV?",
        "secao": "6. Layout e circulação (CRÍTICO)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "8. Home / TV (se integrado)",
        "pergunta": "Integra com home theater?",
        "secao": "8. Home / TV (se integrado)"
      },
      {
        "tipo": "geral",
        "rotulo": "Pergunta:",
        "pergunta": "Você quer um ambiente mais bonito ou mais confortável?",
        "secao": "11. Estética vs funcionalidade"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Você usa mais esse ambiente à noite ou durante o dia?",
        "secao": "12. Iluminação (DIFERENCIAL FORTE)"
      },
      {
        "tipo": "geral",
        "rotulo": "Pergunta:",
        "pergunta": "Você gosta de ambientes mais decorados ou mais limpos?",
        "secao": "14. Decoração"
      },
      {
        "tipo": "profunda",
        "rotulo": "17. Perguntas de aprofundamento",
        "pergunta": "O que mais te incomoda na sua sala hoje?",
        "secao": "17. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "17. Perguntas de aprofundamento",
        "pergunta": "Você passa muito tempo nesse ambiente?",
        "secao": "17. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "17. Perguntas de aprofundamento",
        "pergunta": "Você gosta de receber pessoas aqui?",
        "secao": "17. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "17. Perguntas de aprofundamento",
        "pergunta": "Você quer um ambiente que impressione ou que acolha?",
        "secao": "17. Perguntas de aprofundamento"
      },
      {
        "tipo": "estrategica",
        "rotulo": "18. Investimento e prioridade",
        "pergunta": "Já tem previsão?",
        "secao": "18. Investimento e prioridade"
      }
    ],
    "topicosChecagemTecnica": [
      "6. Layout e circulação (CRÍTICO)",
      "19. Checklist técnico",
      "[19. Checklist técnico] Medidas do ambiente",
      "[19. Checklist técnico] Posição de tomadas",
      "[19. Checklist técnico] Posição da TV",
      "[19. Checklist técnico] Circulação",
      "[19. Checklist técnico] Integração com outros espaços",
      "20. Resumo para o projetista"
    ]
  },
  "louceiro": {
    "slug": "louceiro",
    "titulo": "Louceiro",
    "subtitulo": "Armazenamento seguro de louças, cristaleira, faqueiros e apoio ao servir",
    "arquivoPdfOriginal": "BRIEFING LOUCEIRO.pdf",
    "secoes": [
      {
        "id": "louceiro_sec_1",
        "titulo": "2. Objetivo do louceiro",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "2. Objetivo do louceiro",
            "pergunta": "Qual o principal papel do móvel?",
            "secao": "2. Objetivo do louceiro"
          },
          {
            "tipo": "emocional",
            "rotulo": "Pergunta emocional:",
            "pergunta": "Esse louceiro precisa mais “funcionar” ou “encantar”?",
            "secao": "2. Objetivo do louceiro"
          }
        ],
        "itens": [
          "Armazenar louças",
          "Expor peças especiais",
          "Apoio para servir",
          "Bar integrado",
          "Elemento decorativo",
          "Destaque do ambiente"
        ],
        "conteudoLinhas": [
          "Qual o principal papel do móvel?",
          "   Armazenar louças",
          "   Expor peças especiais",
          "   Apoio para servir",
          "   Bar integrado",
          "   Elemento decorativo",
          "   Destaque do ambiente",
          "[Pergunta emocional:] Esse louceiro precisa mais “funcionar” ou “encantar”?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Qual o principal papel do móvel?",
            "itens": [
              "Armazenar louças",
              "Expor peças especiais",
              "Apoio para servir",
              "Bar integrado",
              "Elemento decorativo",
              "Destaque do ambiente"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta emocional:",
            "texto": "Esse louceiro precisa mais “funcionar” ou “encantar”?",
            "tipoPergunta": "emocional",
            "itens": []
          }
        ]
      },
      {
        "id": "louceiro_sec_2",
        "titulo": "3. Tipo de uso",
        "perguntasDestaque": [],
        "itens": [
          "Uso diário",
          "Uso ocasional",
          "Uso apenas em ocasiões especiais",
          "Uso mais decorativo do que funcional"
        ],
        "conteudoLinhas": [
          "   Uso diário",
          "   Uso ocasional",
          "   Uso apenas em ocasiões especiais",
          "   Uso mais decorativo do que funcional"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Uso diário"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Uso ocasional"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Uso apenas em ocasiões especiais"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Uso mais decorativo do que funcional"
            ]
          }
        ]
      },
      {
        "id": "louceiro_sec_3",
        "titulo": "4. Itens a serem armazenados",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Você quer acesso fácil ou prefere preservar as peças?",
            "secao": "4. Itens a serem armazenados"
          }
        ],
        "itens": [
          "Pratos do dia a dia",
          "Pratos de visita",
          "Travessas",
          "Taças",
          "Copos",
          "Talheres especiais",
          "Garrafas",
          "Bebidas",
          "Utensílios de servir",
          "Peças decorativas",
          "Cristais"
        ],
        "conteudoLinhas": [
          "Mapear exatamente:",
          "   Pratos do dia a dia",
          "   Pratos de visita",
          "   Travessas",
          "   Taças",
          "   Copos",
          "   Talheres especiais",
          "   Garrafas",
          "   Bebidas",
          "   Utensílios de servir",
          "   Peças decorativas",
          "   Cristais",
          "[Pergunta-chave:] Você quer acesso fácil ou prefere preservar as peças?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Mapear exatamente:",
            "itens": [
              "Pratos do dia a dia",
              "Pratos de visita",
              "Travessas",
              "Taças",
              "Copos",
              "Talheres especiais",
              "Garrafas",
              "Bebidas",
              "Utensílios de servir",
              "Peças decorativas",
              "Cristais"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Você quer acesso fácil ou prefere preservar as peças?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "louceiro_sec_4",
        "titulo": "5. Exposição vs armazenamento",
        "perguntasDestaque": [],
        "itens": [
          "Tudo fechado",
          "Tudo exposto",
          "Misto (mais comum)",
          "Louças especiais",
          "Cristais",
          "Decoração",
          "Bebidas"
        ],
        "conteudoLinhas": [
          "Preferência:",
          "   Tudo fechado",
          "   Tudo exposto",
          "   Misto (mais comum)",
          "Itens que devem ficar em destaque:",
          "   Louças especiais",
          "   Cristais",
          "   Decoração",
          "   Bebidas"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Preferência:",
            "itens": [
              "Tudo fechado",
              "Tudo exposto",
              "Misto (mais comum)"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Itens que devem ficar em destaque:",
            "itens": [
              "Louças especiais",
              "Cristais",
              "Decoração",
              "Bebidas"
            ]
          }
        ]
      },
      {
        "id": "louceiro_sec_5",
        "titulo": "6. Frequência de uso",
        "perguntasDestaque": [],
        "itens": [
          "Abre todos os dias",
          "Apenas quando recebe",
          "Quase nunca (mais decorativo)"
        ],
        "conteudoLinhas": [
          "   Abre todos os dias",
          "   Apenas quando recebe",
          "   Quase nunca (mais decorativo)",
          "Isso impacta diretamente no tipo de porta e organização."
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Abre todos os dias"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Apenas quando recebe"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Quase nunca (mais decorativo)"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Isso impacta diretamente no tipo de porta e organização.",
            "itens": []
          }
        ]
      },
      {
        "id": "louceiro_sec_6",
        "titulo": "7. Integração com o ambiente",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "Pergunta estratégica:",
            "pergunta": "Você quer que ele seja discreto ou um destaque no ambiente?",
            "secao": "7. Integração com o ambiente"
          }
        ],
        "itens": [
          "Integrado à sala de jantar",
          "Integrado ao living",
          "Próximo à mesa",
          "Próximo à área gourmet",
          "Próximo à cozinha"
        ],
        "conteudoLinhas": [
          "O louceiro estará:",
          "   Integrado à sala de jantar",
          "   Integrado ao living",
          "   Próximo à mesa",
          "   Próximo à área gourmet",
          "   Próximo à cozinha",
          "[Pergunta estratégica:] Você quer que ele seja discreto ou um destaque no ambiente?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "O louceiro estará:",
            "itens": [
              "Integrado à sala de jantar",
              "Integrado ao living",
              "Próximo à mesa",
              "Próximo à área gourmet",
              "Próximo à cozinha"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta estratégica:",
            "texto": "Você quer que ele seja discreto ou um destaque no ambiente?",
            "tipoPergunta": "estrategica",
            "itens": []
          }
        ]
      },
      {
        "id": "louceiro_sec_7",
        "titulo": "8. Estilo visual",
        "perguntasDestaque": [],
        "itens": [
          "Sofisticado",
          "Moderno",
          "Clássico leve",
          "Minimalista",
          "Decorativo",
          "Madeira",
          "Laca",
          "Vidro",
          "Perfil metálico",
          "Espelho interno",
          "Iluminação embutida"
        ],
        "conteudoLinhas": [
          "   Sofisticado",
          "   Moderno",
          "   Clássico leve",
          "   Minimalista",
          "   Decorativo",
          "Materiais:",
          "   Madeira",
          "   Laca",
          "   Vidro",
          "   Perfil metálico",
          "   Espelho interno",
          "   Iluminação embutida"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Sofisticado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Moderno"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Clássico leve"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Minimalista"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Decorativo"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Materiais:",
            "itens": [
              "Madeira",
              "Laca",
              "Vidro",
              "Perfil metálico",
              "Espelho interno",
              "Iluminação embutida"
            ]
          }
        ]
      },
      {
        "id": "louceiro_sec_8",
        "titulo": "9. Portas",
        "perguntasDestaque": [],
        "itens": [
          "Vidro transparente",
          "Vidro fumê",
          "Vidro canelado",
          "Porta fechada (madeira/laca)",
          "Misto",
          "Abrir tradicional",
          "Correr",
          "Basculante"
        ],
        "conteudoLinhas": [
          "   Vidro transparente",
          "   Vidro fumê",
          "   Vidro canelado",
          "   Porta fechada (madeira/laca)",
          "   Misto",
          "Sistema:",
          "   Abrir tradicional",
          "   Correr",
          "   Basculante"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Vidro transparente"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Vidro fumê"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Vidro canelado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Porta fechada (madeira/laca)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Misto"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Sistema:",
            "itens": [
              "Abrir tradicional",
              "Correr",
              "Basculante"
            ]
          }
        ]
      },
      {
        "id": "louceiro_sec_9",
        "titulo": "10. Iluminação (DIFERENCIAL FORTE)",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Você quer que esse móvel apareça à noite?",
            "secao": "10. Iluminação (DIFERENCIAL FORTE)"
          }
        ],
        "itens": [
          "Iluminação interna",
          "Luz quente (recomendado)",
          "Fitas LED",
          "Destaque para nichos",
          "Sensor ao abrir"
        ],
        "conteudoLinhas": [
          "   Iluminação interna",
          "   Luz quente (recomendado)",
          "   Fitas LED",
          "   Destaque para nichos",
          "   Sensor ao abrir",
          "[Pergunta-chave:] Você quer que esse móvel apareça à noite?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Iluminação interna"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz quente (recomendado)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Fitas LED"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Destaque para nichos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Sensor ao abrir"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Você quer que esse móvel apareça à noite?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "louceiro_sec_10",
        "titulo": "11. Organização interna",
        "perguntasDestaque": [],
        "itens": [
          "Prateleiras fixas",
          "Prateleiras reguláveis",
          "Gavetas",
          "Divisórias internas",
          "Porta-talheres",
          "Espaço para garrafas"
        ],
        "conteudoLinhas": [
          "   Prateleiras fixas",
          "   Prateleiras reguláveis",
          "   Gavetas",
          "   Divisórias internas",
          "   Porta-talheres",
          "   Espaço para garrafas"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Prateleiras fixas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Prateleiras reguláveis"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Gavetas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Divisórias internas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Porta-talheres"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espaço para garrafas"
            ]
          }
        ]
      },
      {
        "id": "louceiro_sec_11",
        "titulo": "12. Bar integrado (se aplicável)",
        "perguntasDestaque": [],
        "itens": [
          "Espaço para bebidas",
          "Adega",
          "Porta-taças",
          "Gaveta para acessórios",
          "Apoio para preparo"
        ],
        "conteudoLinhas": [
          "   Espaço para bebidas",
          "   Adega",
          "   Porta-taças",
          "   Gaveta para acessórios",
          "   Apoio para preparo"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Espaço para bebidas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Adega"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Porta-taças"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Gaveta para acessórios"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Apoio para preparo"
            ]
          }
        ]
      },
      {
        "id": "louceiro_sec_12",
        "titulo": "13. Altura e ergonomia",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "13. Altura e ergonomia",
            "pergunta": "Itens do dia a dia em altura confortável?",
            "secao": "13. Altura e ergonomia"
          },
          {
            "tipo": "estrategica",
            "rotulo": "13. Altura e ergonomia",
            "pergunta": "Peças mais raras em altura superior?",
            "secao": "13. Altura e ergonomia"
          }
        ],
        "itens": [
          "Acesso fácil?",
          "Itens do dia a dia em altura confortável?",
          "Peças mais raras em altura superior?"
        ],
        "conteudoLinhas": [
          "   Acesso fácil?",
          "   Itens do dia a dia em altura confortável?",
          "   Peças mais raras em altura superior?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Acesso fácil?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Itens do dia a dia em altura confortável?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Peças mais raras em altura superior?"
            ]
          }
        ]
      },
      {
        "id": "louceiro_sec_13",
        "titulo": "14. Manutenção",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "14. Manutenção",
            "pergunta": "Vidro exige manutenção?",
            "secao": "14. Manutenção"
          }
        ],
        "itens": [
          "Fácil limpeza",
          "Evitar poeira",
          "Proteção das peças",
          "Vidro exige manutenção?"
        ],
        "conteudoLinhas": [
          "   Fácil limpeza",
          "   Evitar poeira",
          "   Proteção das peças",
          "   Vidro exige manutenção?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Fácil limpeza"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Evitar poeira"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Proteção das peças"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Vidro exige manutenção?"
            ]
          }
        ]
      },
      {
        "id": "louceiro_sec_14",
        "titulo": "15. Pontos de dor",
        "perguntasDestaque": [],
        "itens": [
          "Falta de espaço",
          "Peças guardadas e não usadas",
          "Bagunça",
          "Dificuldade de acesso",
          "Falta de destaque"
        ],
        "conteudoLinhas": [
          "   Falta de espaço",
          "   Peças guardadas e não usadas",
          "   Bagunça",
          "   Dificuldade de acesso",
          "   Falta de destaque"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Falta de espaço"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Peças guardadas e não usadas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Bagunça"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Dificuldade de acesso"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Falta de destaque"
            ]
          }
        ]
      },
      {
        "id": "louceiro_sec_15",
        "titulo": "16. Perguntas de aprofundamento",
        "perguntasDestaque": [
          {
            "tipo": "profunda",
            "rotulo": "16. Perguntas de aprofundamento",
            "pergunta": "Você costuma receber visitas com frequência?",
            "secao": "16. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "16. Perguntas de aprofundamento",
            "pergunta": "Você gosta de expor suas louças ou prefere guardar?",
            "secao": "16. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "16. Perguntas de aprofundamento",
            "pergunta": "Existe alguma peça especial que merece destaque?",
            "secao": "16. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "16. Perguntas de aprofundamento",
            "pergunta": "Esse móvel precisa impressionar ou apenas organizar?",
            "secao": "16. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "16. Perguntas de aprofundamento",
            "pergunta": "Você quer um móvel mais discreto ou que vire protagonista?",
            "secao": "16. Perguntas de aprofundamento"
          }
        ],
        "itens": [
          "Você costuma receber visitas com frequência?",
          "Você gosta de expor suas louças ou prefere guardar?",
          "Existe alguma peça especial que merece destaque?",
          "Esse móvel precisa impressionar ou apenas organizar?",
          "Você quer um móvel mais discreto ou que vire protagonista?"
        ],
        "conteudoLinhas": [
          "   Você costuma receber visitas com frequência?",
          "   Você gosta de expor suas louças ou prefere guardar?",
          "   Existe alguma peça especial que merece destaque?",
          "   Esse móvel precisa impressionar ou apenas organizar?",
          "   Você quer um móvel mais discreto ou que vire protagonista?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Você costuma receber visitas com frequência?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você gosta de expor suas louças ou prefere guardar?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Existe alguma peça especial que merece destaque?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Esse móvel precisa impressionar ou apenas organizar?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você quer um móvel mais discreto ou que vire protagonista?"
            ]
          }
        ]
      },
      {
        "id": "louceiro_sec_16",
        "titulo": "17. Investimento e prioridade",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "17. Investimento e prioridade",
            "pergunta": "Existe previsão de investimento?",
            "secao": "17. Investimento e prioridade"
          }
        ],
        "itens": [
          "Existe previsão de investimento?",
          "Prioriza:",
          "Estética",
          "Funcionalidade",
          "Destaque no ambiente",
          "Custo-benefício"
        ],
        "conteudoLinhas": [
          "   Existe previsão de investimento?",
          "   Prioriza:",
          "o Estética",
          "o Funcionalidade",
          "o Destaque no ambiente",
          "o Custo-benefício"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Existe previsão de investimento?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Prioriza:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Estética"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Funcionalidade"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Destaque no ambiente"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Custo-benefício"
            ]
          }
        ]
      },
      {
        "id": "louceiro_sec_17",
        "titulo": "18. Checklist técnico",
        "perguntasDestaque": [],
        "itens": [
          "Medidas do espaço",
          "Interferência com circulação",
          "Proximidade da mesa",
          "Tomadas (para iluminação)",
          "Integração com outros móveis"
        ],
        "conteudoLinhas": [
          "   Medidas do espaço",
          "   Interferência com circulação",
          "   Proximidade da mesa",
          "   Tomadas (para iluminação)",
          "   Integração com outros móveis"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Medidas do espaço"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Interferência com circulação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Proximidade da mesa"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tomadas (para iluminação)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Integração com outros móveis"
            ]
          }
        ]
      },
      {
        "id": "louceiro_sec_18",
        "titulo": "19. Resumo para o projetista",
        "perguntasDestaque": [],
        "itens": [],
        "conteudoLinhas": [
          "Uso principal:",
          "Itens armazenados:",
          "Exposição vs fechado:",
          "Estilo:",
          "Nível de destaque:",
          "Integração:",
          "Itens obrigatórios:"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Uso principal:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Itens armazenados:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Exposição vs fechado:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Estilo:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Nível de destaque:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Integração:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Itens obrigatórios:",
            "itens": []
          }
        ]
      }
    ],
    "perguntasEstrategicas": [
      {
        "tipo": "estrategica",
        "rotulo": "2. Objetivo do louceiro",
        "pergunta": "Qual o principal papel do móvel?",
        "secao": "2. Objetivo do louceiro"
      },
      {
        "tipo": "emocional",
        "rotulo": "Pergunta emocional:",
        "pergunta": "Esse louceiro precisa mais “funcionar” ou “encantar”?",
        "secao": "2. Objetivo do louceiro"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Você quer acesso fácil ou prefere preservar as peças?",
        "secao": "4. Itens a serem armazenados"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Pergunta estratégica:",
        "pergunta": "Você quer que ele seja discreto ou um destaque no ambiente?",
        "secao": "7. Integração com o ambiente"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Você quer que esse móvel apareça à noite?",
        "secao": "10. Iluminação (DIFERENCIAL FORTE)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "13. Altura e ergonomia",
        "pergunta": "Itens do dia a dia em altura confortável?",
        "secao": "13. Altura e ergonomia"
      },
      {
        "tipo": "estrategica",
        "rotulo": "13. Altura e ergonomia",
        "pergunta": "Peças mais raras em altura superior?",
        "secao": "13. Altura e ergonomia"
      },
      {
        "tipo": "estrategica",
        "rotulo": "14. Manutenção",
        "pergunta": "Vidro exige manutenção?",
        "secao": "14. Manutenção"
      },
      {
        "tipo": "profunda",
        "rotulo": "16. Perguntas de aprofundamento",
        "pergunta": "Você costuma receber visitas com frequência?",
        "secao": "16. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "16. Perguntas de aprofundamento",
        "pergunta": "Você gosta de expor suas louças ou prefere guardar?",
        "secao": "16. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "16. Perguntas de aprofundamento",
        "pergunta": "Existe alguma peça especial que merece destaque?",
        "secao": "16. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "16. Perguntas de aprofundamento",
        "pergunta": "Esse móvel precisa impressionar ou apenas organizar?",
        "secao": "16. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "16. Perguntas de aprofundamento",
        "pergunta": "Você quer um móvel mais discreto ou que vire protagonista?",
        "secao": "16. Perguntas de aprofundamento"
      },
      {
        "tipo": "estrategica",
        "rotulo": "17. Investimento e prioridade",
        "pergunta": "Existe previsão de investimento?",
        "secao": "17. Investimento e prioridade"
      }
    ],
    "topicosChecagemTecnica": [
      "13. Altura e ergonomia",
      "18. Checklist técnico",
      "[18. Checklist técnico] Medidas do espaço",
      "[18. Checklist técnico] Interferência com circulação",
      "[18. Checklist técnico] Proximidade da mesa",
      "[18. Checklist técnico] Tomadas (para iluminação)",
      "[18. Checklist técnico] Integração com outros móveis",
      "19. Resumo para o projetista"
    ]
  },
  "quarto_casal": {
    "slug": "quarto_casal",
    "titulo": "Suíte Master / Quarto Casal",
    "subtitulo": "Refúgio de descanso, cabeceira, mesas de cabeceira, iluminação e TV",
    "arquivoPdfOriginal": "BRIEFING QUARTO CASAL.pdf",
    "secoes": [
      {
        "id": "quarto_casal_sec_1",
        "titulo": "2. Papel da suíte",
        "perguntasDestaque": [
          {
            "tipo": "emocional",
            "rotulo": "Pergunta emocional:",
            "pergunta": "O que você quer sentir quando entrar na sua suíte no fim do dia?",
            "secao": "2. Papel da suíte"
          }
        ],
        "itens": [
          "Apenas dormitório",
          "Espaço de descanso profundo",
          "Refúgio do casal",
          "Ambiente de relaxamento",
          "Ambiente com TV/home",
          "Espaço para leitura",
          "Espaço para trabalho leve",
          "Espaço íntimo com mais permanência",
          "Paz",
          "Silêncio mental",
          "Conforto",
          "Aconchego",
          "Luxo",
          "Segurança",
          "Descompressão"
        ],
        "conteudoLinhas": [
          "A suíte será:",
          "   Apenas dormitório",
          "   Espaço de descanso profundo",
          "   Refúgio do casal",
          "   Ambiente de relaxamento",
          "   Ambiente com TV/home",
          "   Espaço para leitura",
          "   Espaço para trabalho leve",
          "   Espaço íntimo com mais permanência",
          "[Pergunta emocional:] O que você quer sentir quando entrar na sua suíte no fim do dia?",
          "Exemplos:",
          "   Paz",
          "   Silêncio mental",
          "   Conforto",
          "   Aconchego",
          "   Luxo",
          "   Segurança",
          "   Descompressão"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "A suíte será:",
            "itens": [
              "Apenas dormitório",
              "Espaço de descanso profundo",
              "Refúgio do casal",
              "Ambiente de relaxamento",
              "Ambiente com TV/home",
              "Espaço para leitura",
              "Espaço para trabalho leve",
              "Espaço íntimo com mais permanência"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta emocional:",
            "texto": "O que você quer sentir quando entrar na sua suíte no fim do dia?",
            "tipoPergunta": "emocional",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Exemplos:",
            "itens": [
              "Paz",
              "Silêncio mental",
              "Conforto",
              "Aconchego",
              "Luxo",
              "Segurança",
              "Descompressão"
            ]
          }
        ]
      },
      {
        "id": "quarto_casal_sec_2",
        "titulo": "3. Rotina do casal",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "3. Rotina do casal",
            "pergunta": "Um levanta antes do outro?",
            "secao": "3. Rotina do casal"
          },
          {
            "tipo": "estrategica",
            "rotulo": "3. Rotina do casal",
            "pergunta": "Um usa mais luz/ruído que o outro?",
            "secao": "3. Rotina do casal"
          }
        ],
        "itens": [
          "Dormem cedo / tarde",
          "Acordam em horários diferentes",
          "Um levanta antes do outro?",
          "Um usa mais luz/ruído que o outro?",
          "Só para dormir",
          "Assistem TV",
          "Trabalham no quarto",
          "Usam celular/notebook",
          "Leitura",
          "Relaxamento"
        ],
        "conteudoLinhas": [
          "Horários:",
          "   Dormem cedo / tarde",
          "   Acordam em horários diferentes",
          "   Um levanta antes do outro?",
          "   Um usa mais luz/ruído que o outro?",
          "Uso da suíte:",
          "   Só para dormir",
          "   Assistem TV",
          "   Trabalham no quarto",
          "   Usam celular/notebook",
          "   Leitura",
          "   Relaxamento"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Horários:",
            "itens": [
              "Dormem cedo / tarde",
              "Acordam em horários diferentes",
              "Um levanta antes do outro?",
              "Um usa mais luz/ruído que o outro?"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Uso da suíte:",
            "itens": [
              "Só para dormir",
              "Assistem TV",
              "Trabalham no quarto",
              "Usam celular/notebook",
              "Leitura",
              "Relaxamento"
            ]
          }
        ]
      },
      {
        "id": "quarto_casal_sec_3",
        "titulo": "4. Perfil individual (muito importante)",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Existe conflito de hábito entre vocês no quarto?",
            "secao": "4. Perfil individual (muito importante)"
          }
        ],
        "itens": [
          "Altura:",
          "Destro/canhoto:",
          "Organização:",
          "Rotina:",
          "Gosta de luz:",
          "Sensibilidade a ruído:"
        ],
        "conteudoLinhas": [
          "Pessoa 1:",
          "   Altura:",
          "   Destro/canhoto:",
          "   Organização:",
          "   Rotina:",
          "   Gosta de luz:",
          "   Sensibilidade a ruído:",
          "Pessoa 2:",
          "(mesma estrutura)",
          "[Pergunta-chave:] Existe conflito de hábito entre vocês no quarto?"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Pessoa 1:",
            "itens": [
              "Altura:",
              "Destro/canhoto:",
              "Organização:",
              "Rotina:",
              "Gosta de luz:",
              "Sensibilidade a ruído:"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Pessoa 2:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "(mesma estrutura)",
            "itens": []
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Existe conflito de hábito entre vocês no quarto?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "quarto_casal_sec_4",
        "titulo": "5. Cama e layout",
        "perguntasDestaque": [],
        "itens": [
          "Tamanho da cama (Queen / King / Super King)",
          "Cabeceira:",
          "Estofada",
          "Painel",
          "Ripado",
          "Com iluminação",
          "Criados:",
          "Sim / Não",
          "Iguais ou diferentes",
          "Circulação:",
          "Livre",
          "Mais compacta"
        ],
        "conteudoLinhas": [
          "   Tamanho da cama (Queen / King / Super King)",
          "   Cabeceira:",
          "o Estofada",
          "o Painel",
          "o Ripado",
          "o Com iluminação",
          "   Criados:",
          "o Sim / Não",
          "o Iguais ou diferentes",
          "   Circulação:",
          "o Livre",
          "o Mais compacta"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Tamanho da cama (Queen / King / Super King)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cabeceira:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Estofada"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Painel"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ripado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Com iluminação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Criados:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Sim / Não"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Iguais ou diferentes"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Circulação:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Livre"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Mais compacta"
            ]
          }
        ]
      },
      {
        "id": "quarto_casal_sec_5",
        "titulo": "6. Uso de eletrônicos",
        "perguntasDestaque": [
          {
            "tipo": "geral",
            "rotulo": "Pergunta:",
            "pergunta": "Vocês assistem TV antes de dormir?",
            "secao": "6. Uso de eletrônicos"
          }
        ],
        "itens": [
          "TV:",
          "Sim / Não",
          "Tamanho:",
          "Som ambiente",
          "Automação",
          "Cortinas automatizadas",
          "Tomadas USB",
          "Carregamento lateral"
        ],
        "conteudoLinhas": [
          "   TV:",
          "o Sim / Não",
          "o Tamanho:",
          "   Som ambiente",
          "   Automação",
          "   Cortinas automatizadas",
          "   Tomadas USB",
          "   Carregamento lateral",
          "[Pergunta:] Vocês assistem TV antes de dormir?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "TV:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Sim / Não"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tamanho:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Som ambiente"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Automação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cortinas automatizadas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tomadas USB"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Carregamento lateral"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta:",
            "texto": "Vocês assistem TV antes de dormir?",
            "tipoPergunta": "geral",
            "itens": []
          }
        ]
      },
      {
        "id": "quarto_casal_sec_6",
        "titulo": "7. Iluminação (crítico)",
        "perguntasDestaque": [
          {
            "tipo": "emocional",
            "rotulo": "Pergunta emocional:",
            "pergunta": "Você gosta de um quarto mais claro ou mais “aconchegante escuro”?",
            "secao": "7. Iluminação (crítico)"
          }
        ],
        "itens": [
          "Luz geral",
          "Luz indireta",
          "Luz de leitura",
          "Luz individual (lado da cama)",
          "Luz quente (recomendado)",
          "Dimerização"
        ],
        "conteudoLinhas": [
          "   Luz geral",
          "   Luz indireta",
          "   Luz de leitura",
          "   Luz individual (lado da cama)",
          "   Luz quente (recomendado)",
          "   Dimerização",
          "[Pergunta emocional:] Você gosta de um quarto mais claro ou mais “aconchegante escuro”?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Luz geral"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz indireta"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz de leitura"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz individual (lado da cama)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz quente (recomendado)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Dimerização"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta emocional:",
            "texto": "Você gosta de um quarto mais claro ou mais “aconchegante escuro”?",
            "tipoPergunta": "emocional",
            "itens": []
          }
        ]
      },
      {
        "id": "quarto_casal_sec_7",
        "titulo": "8. Armazenamento na suíte",
        "perguntasDestaque": [],
        "itens": [
          "Roupa de cama",
          "Travesseiros",
          "Cobertores",
          "Objetos pessoais",
          "Livros",
          "Itens decorativos",
          "Baú",
          "Gavetas",
          "Nichos",
          "Painéis ocultos"
        ],
        "conteudoLinhas": [
          "   Roupa de cama",
          "   Travesseiros",
          "   Cobertores",
          "   Objetos pessoais",
          "   Livros",
          "   Itens decorativos",
          "Necessidade de:",
          "   Baú",
          "   Gavetas",
          "   Nichos",
          "   Painéis ocultos"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Roupa de cama"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Travesseiros"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cobertores"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Objetos pessoais"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Livros"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Itens decorativos"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Necessidade de:",
            "itens": [
              "Baú",
              "Gavetas",
              "Nichos",
              "Painéis ocultos"
            ]
          }
        ]
      },
      {
        "id": "quarto_casal_sec_8",
        "titulo": "9. Integração com banheiro/closet",
        "perguntasDestaque": [],
        "itens": [
          "Acesso direto ao closet",
          "Acesso ao banheiro",
          "Integração visual",
          "Porta / sem porta"
        ],
        "conteudoLinhas": [
          "   Acesso direto ao closet",
          "   Acesso ao banheiro",
          "   Integração visual",
          "   Porta / sem porta"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Acesso direto ao closet"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Acesso ao banheiro"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Integração visual"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Porta / sem porta"
            ]
          }
        ]
      },
      {
        "id": "quarto_casal_sec_9",
        "titulo": "10. Estilo visual",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Você quer um quarto mais “hotel” ou mais “casa”?",
            "secao": "10. Estilo visual"
          }
        ],
        "itens": [
          "Moderno",
          "Minimalista",
          "Aconchegante",
          "Sofisticado",
          "Hotel de luxo",
          "Natural",
          "Atemporal",
          "Madeira",
          "Estofado",
          "Laca",
          "Vidro",
          "Metal"
        ],
        "conteudoLinhas": [
          "   Moderno",
          "   Minimalista",
          "   Aconchegante",
          "   Sofisticado",
          "   Hotel de luxo",
          "   Natural",
          "   Atemporal",
          "Materiais:",
          "   Madeira",
          "   Estofado",
          "   Laca",
          "   Vidro",
          "   Metal",
          "[Pergunta-chave:] Você quer um quarto mais “hotel” ou mais “casa”?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Moderno"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Minimalista"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Aconchegante"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Sofisticado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Hotel de luxo"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Natural"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Atemporal"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Materiais:",
            "itens": [
              "Madeira",
              "Estofado",
              "Laca",
              "Vidro",
              "Metal"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Você quer um quarto mais “hotel” ou mais “casa”?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "quarto_casal_sec_10",
        "titulo": "11. Manutenção",
        "perguntasDestaque": [],
        "itens": [
          "Fácil limpeza",
          "Tecidos mais resistentes",
          "Evitar poeira",
          "Poucos objetos"
        ],
        "conteudoLinhas": [
          "   Fácil limpeza",
          "   Tecidos mais resistentes",
          "   Evitar poeira",
          "   Poucos objetos"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Fácil limpeza"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tecidos mais resistentes"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Evitar poeira"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Poucos objetos"
            ]
          }
        ]
      },
      {
        "id": "quarto_casal_sec_11",
        "titulo": "12. Pontos de dor",
        "perguntasDestaque": [],
        "itens": [
          "Falta de conforto",
          "Iluminação ruim",
          "Falta de tomada",
          "Ruído",
          "Bagunça",
          "Falta de espaço",
          "Visual cansativo"
        ],
        "conteudoLinhas": [
          "   Falta de conforto",
          "   Iluminação ruim",
          "   Falta de tomada",
          "   Ruído",
          "   Bagunça",
          "   Falta de espaço",
          "   Visual cansativo"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Falta de conforto"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Iluminação ruim"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Falta de tomada"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ruído"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Bagunça"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Falta de espaço"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Visual cansativo"
            ]
          }
        ]
      },
      {
        "id": "quarto_casal_sec_12",
        "titulo": "13. Perguntas profundas",
        "perguntasDestaque": [
          {
            "tipo": "profunda",
            "rotulo": "13. Perguntas profundas",
            "pergunta": "O que te faz relaxar?",
            "secao": "13. Perguntas profundas"
          },
          {
            "tipo": "profunda",
            "rotulo": "13. Perguntas profundas",
            "pergunta": "O que te incomoda no seu quarto atual?",
            "secao": "13. Perguntas profundas"
          },
          {
            "tipo": "profunda",
            "rotulo": "13. Perguntas profundas",
            "pergunta": "Você gosta de ficar no quarto ou só dormir?",
            "secao": "13. Perguntas profundas"
          },
          {
            "tipo": "profunda",
            "rotulo": "13. Perguntas profundas",
            "pergunta": "Qual detalhe faria você amar esse ambiente?",
            "secao": "13. Perguntas profundas"
          }
        ],
        "itens": [
          "O que te faz relaxar?",
          "O que te incomoda no seu quarto atual?",
          "Você gosta de ficar no quarto ou só dormir?",
          "Qual detalhe faria você amar esse ambiente?"
        ],
        "conteudoLinhas": [
          "   O que te faz relaxar?",
          "   O que te incomoda no seu quarto atual?",
          "   Você gosta de ficar no quarto ou só dormir?",
          "   Qual detalhe faria você amar esse ambiente?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "O que te faz relaxar?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "O que te incomoda no seu quarto atual?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você gosta de ficar no quarto ou só dormir?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Qual detalhe faria você amar esse ambiente?"
            ]
          }
        ]
      },
      {
        "id": "quarto_casal_sec_13",
        "titulo": "14. Resumo para projeto",
        "perguntasDestaque": [],
        "itens": [],
        "conteudoLinhas": [
          "Sensação desejada:",
          "Uso:",
          "Conflitos de uso:",
          "Itens obrigatórios:",
          "Estilo:",
          "Nível de conforto esperado:"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Sensação desejada:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Uso:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Conflitos de uso:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Itens obrigatórios:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Estilo:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Nível de conforto esperado:",
            "itens": []
          }
        ]
      }
    ],
    "perguntasEstrategicas": [
      {
        "tipo": "emocional",
        "rotulo": "Pergunta emocional:",
        "pergunta": "O que você quer sentir quando entrar na sua suíte no fim do dia?",
        "secao": "2. Papel da suíte"
      },
      {
        "tipo": "estrategica",
        "rotulo": "3. Rotina do casal",
        "pergunta": "Um levanta antes do outro?",
        "secao": "3. Rotina do casal"
      },
      {
        "tipo": "estrategica",
        "rotulo": "3. Rotina do casal",
        "pergunta": "Um usa mais luz/ruído que o outro?",
        "secao": "3. Rotina do casal"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Existe conflito de hábito entre vocês no quarto?",
        "secao": "4. Perfil individual (muito importante)"
      },
      {
        "tipo": "geral",
        "rotulo": "Pergunta:",
        "pergunta": "Vocês assistem TV antes de dormir?",
        "secao": "6. Uso de eletrônicos"
      },
      {
        "tipo": "emocional",
        "rotulo": "Pergunta emocional:",
        "pergunta": "Você gosta de um quarto mais claro ou mais “aconchegante escuro”?",
        "secao": "7. Iluminação (crítico)"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Você quer um quarto mais “hotel” ou mais “casa”?",
        "secao": "10. Estilo visual"
      },
      {
        "tipo": "profunda",
        "rotulo": "13. Perguntas profundas",
        "pergunta": "O que te faz relaxar?",
        "secao": "13. Perguntas profundas"
      },
      {
        "tipo": "profunda",
        "rotulo": "13. Perguntas profundas",
        "pergunta": "O que te incomoda no seu quarto atual?",
        "secao": "13. Perguntas profundas"
      },
      {
        "tipo": "profunda",
        "rotulo": "13. Perguntas profundas",
        "pergunta": "Você gosta de ficar no quarto ou só dormir?",
        "secao": "13. Perguntas profundas"
      },
      {
        "tipo": "profunda",
        "rotulo": "13. Perguntas profundas",
        "pergunta": "Qual detalhe faria você amar esse ambiente?",
        "secao": "13. Perguntas profundas"
      }
    ],
    "topicosChecagemTecnica": [
      "7. Iluminação (crítico)",
      "14. Resumo para projeto"
    ]
  },
  "quarto_filhos": {
    "slug": "quarto_filhos",
    "titulo": "Quarto dos Filhos",
    "subtitulo": "Fase de desenvolvimento, cama, estudos, brinquedos, segurança e evolução",
    "arquivoPdfOriginal": "BRIEFING QUARTO DOS FILHOS.pdf",
    "secoes": [
      {
        "id": "quarto_filhos_sec_1",
        "titulo": "2. Fase atual da criança",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "Pergunta estratégica:",
            "pergunta": "Você quer um quarto que acompanhe o crescimento ou pretende trocar no futuro?",
            "secao": "2. Fase atual da criança"
          }
        ],
        "itens": [
          "Bebê (0–2 anos)",
          "Infantil (3–7 anos)",
          "Pré-adolescente (8–12 anos)",
          "Adolescente (13+)"
        ],
        "conteudoLinhas": [
          "   Bebê (0–2 anos)",
          "   Infantil (3–7 anos)",
          "   Pré-adolescente (8–12 anos)",
          "   Adolescente (13+)",
          "[Pergunta estratégica:] Você quer um quarto que acompanhe o crescimento ou pretende trocar no futuro?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Bebê (0–2 anos)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Infantil (3–7 anos)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Pré-adolescente (8–12 anos)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Adolescente (13+)"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta estratégica:",
            "texto": "Você quer um quarto que acompanhe o crescimento ou pretende trocar no futuro?",
            "tipoPergunta": "estrategica",
            "itens": []
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_2",
        "titulo": "3. Objetivo do ambiente",
        "perguntasDestaque": [],
        "itens": [
          "Apenas para dormir",
          "Dormir + brincar",
          "Dormir + estudar",
          "Multifuncional",
          "Espaço de desenvolvimento",
          "Refúgio pessoal",
          "Espaço criativo"
        ],
        "conteudoLinhas": [
          "O quarto será:",
          "   Apenas para dormir",
          "   Dormir + brincar",
          "   Dormir + estudar",
          "   Multifuncional",
          "   Espaço de desenvolvimento",
          "   Refúgio pessoal",
          "   Espaço criativo"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "O quarto será:",
            "itens": [
              "Apenas para dormir",
              "Dormir + brincar",
              "Dormir + estudar",
              "Multifuncional",
              "Espaço de desenvolvimento",
              "Refúgio pessoal",
              "Espaço criativo"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_3",
        "titulo": "4. Perfil da criança",
        "perguntasDestaque": [],
        "itens": [
          "Agitada",
          "Calma",
          "Criativa",
          "Organizada",
          "Bagunceira",
          "Gosta de ficar no quarto",
          "Prefere ficar fora do quarto",
          "Personagens",
          "Esportes",
          "Tecnologia",
          "Música",
          "Arte",
          "Natureza",
          "Animais"
        ],
        "conteudoLinhas": [
          "   Agitada",
          "   Calma",
          "   Criativa",
          "   Organizada",
          "   Bagunceira",
          "   Gosta de ficar no quarto",
          "   Prefere ficar fora do quarto",
          "Gostos:",
          "   Personagens",
          "   Esportes",
          "   Tecnologia",
          "   Música",
          "   Arte",
          "   Natureza",
          "   Animais"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Agitada"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Calma"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Criativa"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Organizada"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Bagunceira"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Gosta de ficar no quarto"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Prefere ficar fora do quarto"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Gostos:",
            "itens": [
              "Personagens",
              "Esportes",
              "Tecnologia",
              "Música",
              "Arte",
              "Natureza",
              "Animais"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_4",
        "titulo": "5. Pergunta emocional (muito forte)",
        "perguntasDestaque": [],
        "itens": [
          "Segurança",
          "Conforto",
          "Alegria",
          "Criatividade",
          "Independência",
          "Organização",
          "Identidade própria"
        ],
        "conteudoLinhas": [
          "Quando seu filho(a) entrar nesse quarto, você quer que ele(a) sinta:",
          "   Segurança",
          "   Conforto",
          "   Alegria",
          "   Criatividade",
          "   Independência",
          "   Organização",
          "   Identidade própria"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Quando seu filho(a) entrar nesse quarto, você quer que ele(a) sinta:",
            "itens": [
              "Segurança",
              "Conforto",
              "Alegria",
              "Criatividade",
              "Independência",
              "Organização",
              "Identidade própria"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_5",
        "titulo": "👶 BLOCO 1 – BEBÊ (0–2 anos): 6. Uso principal",
        "perguntasDestaque": [],
        "itens": [
          "Dormir",
          "Troca",
          "Amamentação",
          "Apoio para os pais"
        ],
        "conteudoLinhas": [
          "   Dormir",
          "   Troca",
          "   Amamentação",
          "   Apoio para os pais"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Dormir"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Troca"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Amamentação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Apoio para os pais"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_6",
        "titulo": "👶 BLOCO 1 – BEBÊ (0–2 anos): 7. Mobiliário essencial",
        "perguntasDestaque": [],
        "itens": [
          "Berço",
          "Cômoda/trocador",
          "Poltrona de amamentação",
          "Apoio para itens",
          "Guarda-roupa"
        ],
        "conteudoLinhas": [
          "   Berço",
          "   Cômoda/trocador",
          "   Poltrona de amamentação",
          "   Apoio para itens",
          "   Guarda-roupa"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Berço"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cômoda/trocador"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Poltrona de amamentação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Apoio para itens"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Guarda-roupa"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_7",
        "titulo": "👶 BLOCO 1 – BEBÊ (0–2 anos): 8. Rotina dos pais",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "👶 BLOCO 1 – BEBÊ (0–2 anos): 8. Rotina dos pais",
            "pergunta": "Troca frequente?",
            "secao": "👶 BLOCO 1 – BEBÊ (0–2 anos): 8. Rotina dos pais"
          },
          {
            "tipo": "estrategica",
            "rotulo": "👶 BLOCO 1 – BEBÊ (0–2 anos): 8. Rotina dos pais",
            "pergunta": "Amamenta no quarto?",
            "secao": "👶 BLOCO 1 – BEBÊ (0–2 anos): 8. Rotina dos pais"
          },
          {
            "tipo": "estrategica",
            "rotulo": "👶 BLOCO 1 – BEBÊ (0–2 anos): 8. Rotina dos pais",
            "pergunta": "Dorme junto em alguns momentos?",
            "secao": "👶 BLOCO 1 – BEBÊ (0–2 anos): 8. Rotina dos pais"
          }
        ],
        "itens": [
          "Acorda à noite?",
          "Troca frequente?",
          "Amamenta no quarto?",
          "Dorme junto em alguns momentos?"
        ],
        "conteudoLinhas": [
          "   Acorda à noite?",
          "   Troca frequente?",
          "   Amamenta no quarto?",
          "   Dorme junto em alguns momentos?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Acorda à noite?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Troca frequente?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Amamenta no quarto?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Dorme junto em alguns momentos?"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_8",
        "titulo": "👶 BLOCO 1 – BEBÊ (0–2 anos): 9. Segurança (CRÍTICO)",
        "perguntasDestaque": [],
        "itens": [
          "Cantos arredondados",
          "Fixação de móveis",
          "Altura segura",
          "Materiais atóxicos",
          "Evitar puxadores perigosos"
        ],
        "conteudoLinhas": [
          "   Cantos arredondados",
          "   Fixação de móveis",
          "   Altura segura",
          "   Materiais atóxicos",
          "   Evitar puxadores perigosos"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Cantos arredondados"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Fixação de móveis"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Altura segura"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Materiais atóxicos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Evitar puxadores perigosos"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_9",
        "titulo": "👶 BLOCO 1 – BEBÊ (0–2 anos): 10. Iluminação",
        "perguntasDestaque": [],
        "itens": [
          "Luz suave (noite)",
          "Luz indireta",
          "Luz funcional (troca)"
        ],
        "conteudoLinhas": [
          "   Luz suave (noite)",
          "   Luz indireta",
          "   Luz funcional (troca)"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Luz suave (noite)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz indireta"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz funcional (troca)"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_10",
        "titulo": "BLOCO 2 – CRIANÇA (3–7 anos): 11. Uso principal",
        "perguntasDestaque": [],
        "itens": [
          "Dormir",
          "Brincar",
          "Início de atividades educativas"
        ],
        "conteudoLinhas": [
          "   Dormir",
          "   Brincar",
          "   Início de atividades educativas"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Dormir"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Brincar"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Início de atividades educativas"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_11",
        "titulo": "BLOCO 2 – CRIANÇA (3–7 anos): 12. Mobiliário",
        "perguntasDestaque": [],
        "itens": [
          "Cama (ou cama montessoriana)",
          "Armário acessível",
          "Nichos baixos",
          "Baú/brinquedos",
          "Mesa pequena (opcional)"
        ],
        "conteudoLinhas": [
          "   Cama (ou cama montessoriana)",
          "   Armário acessível",
          "   Nichos baixos",
          "   Baú/brinquedos",
          "   Mesa pequena (opcional)"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Cama (ou cama montessoriana)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Armário acessível"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Nichos baixos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Baú/brinquedos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Mesa pequena (opcional)"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_12",
        "titulo": "BLOCO 2 – CRIANÇA (3–7 anos): 13. Organização",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "BLOCO 2 – CRIANÇA (3–7 anos): 13. Organização",
            "pergunta": "Criança acessa tudo?",
            "secao": "BLOCO 2 – CRIANÇA (3–7 anos): 13. Organização"
          },
          {
            "tipo": "estrategica",
            "rotulo": "BLOCO 2 – CRIANÇA (3–7 anos): 13. Organização",
            "pergunta": "Precisa ensinar autonomia?",
            "secao": "BLOCO 2 – CRIANÇA (3–7 anos): 13. Organização"
          }
        ],
        "itens": [
          "Criança acessa tudo?",
          "Pais organizam?",
          "Precisa ensinar autonomia?"
        ],
        "conteudoLinhas": [
          "   Criança acessa tudo?",
          "   Pais organizam?",
          "   Precisa ensinar autonomia?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Criança acessa tudo?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Pais organizam?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Precisa ensinar autonomia?"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_13",
        "titulo": "BLOCO 2 – CRIANÇA (3–7 anos): 14. Brinquedos",
        "perguntasDestaque": [],
        "itens": [
          "Quantidade:",
          "Tipo:",
          "Necessidade de armazenamento:",
          "Aberto",
          "Fechado"
        ],
        "conteudoLinhas": [
          "   Quantidade:",
          "   Tipo:",
          "   Necessidade de armazenamento:",
          "o Aberto",
          "o Fechado"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Quantidade:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tipo:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Necessidade de armazenamento:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Aberto"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Fechado"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_14",
        "titulo": "BLOCO 2 – CRIANÇA (3–7 anos): 15. Estímulo visual",
        "perguntasDestaque": [],
        "itens": [
          "Tema (sim / não)",
          "Cores suaves / vibrantes",
          "Personagens (sim / não)"
        ],
        "conteudoLinhas": [
          "   Tema (sim / não)",
          "   Cores suaves / vibrantes",
          "   Personagens (sim / não)",
          "Estratégia:",
          "Evitar excesso de tema fixo → envelhece rápido."
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Tema (sim / não)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cores suaves / vibrantes"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Personagens (sim / não)"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Estratégia:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Evitar excesso de tema fixo → envelhece rápido.",
            "itens": []
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_15",
        "titulo": "BLOCO 3 – PRÉ-ADOLESCENTE / ADOLESCENTE: 16. Uso principal",
        "perguntasDestaque": [],
        "itens": [
          "Dormir",
          "Estudar",
          "Tecnologia",
          "Socializar (amigos)",
          "Privacidade"
        ],
        "conteudoLinhas": [
          "   Dormir",
          "   Estudar",
          "   Tecnologia",
          "   Socializar (amigos)",
          "   Privacidade"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Dormir"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Estudar"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tecnologia"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Socializar (amigos)"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Privacidade"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_16",
        "titulo": "BLOCO 3 – PRÉ-ADOLESCENTE / ADOLESCENTE: 17. Mobiliário essencial",
        "perguntasDestaque": [],
        "itens": [
          "Cama",
          "Escrivaninha",
          "Cadeira ergonômica",
          "Armário",
          "Nichos",
          "Painel TV (se houver)"
        ],
        "conteudoLinhas": [
          "   Cama",
          "   Escrivaninha",
          "   Cadeira ergonômica",
          "   Armário",
          "   Nichos",
          "   Painel TV (se houver)"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Cama"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Escrivaninha"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cadeira ergonômica"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Armário"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Nichos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Painel TV (se houver)"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_17",
        "titulo": "BLOCO 3 – PRÉ-ADOLESCENTE / ADOLESCENTE: 18. Estudo (CRÍTICO)",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "BLOCO 3 – PRÉ-ADOLESCENTE / ADOLESCENTE: 18. Estudo (CRÍTICO)",
            "pergunta": "Estuda no quarto?",
            "secao": "BLOCO 3 – PRÉ-ADOLESCENTE / ADOLESCENTE: 18. Estudo (CRÍTICO)"
          },
          {
            "tipo": "estrategica",
            "rotulo": "BLOCO 3 – PRÉ-ADOLESCENTE / ADOLESCENTE: 18. Estudo (CRÍTICO)",
            "pergunta": "Usa notebook ou desktop?",
            "secao": "BLOCO 3 – PRÉ-ADOLESCENTE / ADOLESCENTE: 18. Estudo (CRÍTICO)"
          }
        ],
        "itens": [
          "Estuda no quarto?",
          "Usa notebook ou desktop?",
          "Precisa de:",
          "Tomadas",
          "USB",
          "Iluminação direcionada"
        ],
        "conteudoLinhas": [
          "   Estuda no quarto?",
          "   Usa notebook ou desktop?",
          "   Precisa de:",
          "o Tomadas",
          "o USB",
          "o Iluminação direcionada"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Estuda no quarto?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Usa notebook ou desktop?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Precisa de:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tomadas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "USB"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Iluminação direcionada"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_18",
        "titulo": "BLOCO 3 – PRÉ-ADOLESCENTE / ADOLESCENTE: 19. Tecnologia",
        "perguntasDestaque": [],
        "itens": [
          "Videogame",
          "Computador",
          "TV",
          "Som"
        ],
        "conteudoLinhas": [
          "   Videogame",
          "   Computador",
          "   TV",
          "   Som"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Videogame"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Computador"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "TV"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Som"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_19",
        "titulo": "BLOCO 3 – PRÉ-ADOLESCENTE / ADOLESCENTE: 20. Privacidade",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "BLOCO 3 – PRÉ-ADOLESCENTE / ADOLESCENTE: 20. Privacidade",
            "pergunta": "Espaço para receber amigos?",
            "secao": "BLOCO 3 – PRÉ-ADOLESCENTE / ADOLESCENTE: 20. Privacidade"
          }
        ],
        "itens": [
          "Importante / muito importante",
          "Espaço para receber amigos?"
        ],
        "conteudoLinhas": [
          "   Importante / muito importante",
          "   Espaço para receber amigos?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Importante / muito importante"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Espaço para receber amigos?"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_20",
        "titulo": "👕 ARMAZENAMENTO (TODAS AS FASES): 21. Roupas",
        "perguntasDestaque": [],
        "itens": [
          "Quantidade:",
          "Tipo:",
          "Uso diário / eventual"
        ],
        "conteudoLinhas": [
          "   Quantidade:",
          "   Tipo:",
          "   Uso diário / eventual"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Quantidade:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tipo:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Uso diário / eventual"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_21",
        "titulo": "👕 ARMAZENAMENTO (TODAS AS FASES): 22. Itens extras",
        "perguntasDestaque": [],
        "itens": [
          "Mochilas",
          "Material escolar",
          "Brinquedos",
          "Livros",
          "Esportes",
          "Tecnologia"
        ],
        "conteudoLinhas": [
          "   Mochilas",
          "   Material escolar",
          "   Brinquedos",
          "   Livros",
          "   Esportes",
          "   Tecnologia"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Mochilas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Material escolar"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Brinquedos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Livros"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Esportes"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tecnologia"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_22",
        "titulo": "🧠 COMPORTAMENTO E ORGANIZAÇÃO: 23. Perfil",
        "perguntasDestaque": [],
        "itens": [
          "Organizado",
          "Bagunceiro",
          "Em desenvolvimento"
        ],
        "conteudoLinhas": [
          "   Organizado",
          "   Bagunceiro",
          "   Em desenvolvimento"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Organizado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Bagunceiro"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Em desenvolvimento"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_23",
        "titulo": "🧠 COMPORTAMENTO E ORGANIZAÇÃO: 24. Estratégia",
        "perguntasDestaque": [],
        "itens": [
          "Tudo visível → ajuda organização",
          "Tudo fechado → estética"
        ],
        "conteudoLinhas": [
          "   Tudo visível → ajuda organização",
          "   Tudo fechado → estética"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Tudo visível → ajuda organização"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tudo fechado → estética"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_24",
        "titulo": "💡 ILUMINAÇÃO",
        "perguntasDestaque": [],
        "itens": [
          "Luz geral",
          "Luz indireta",
          "Luz de leitura",
          "Luz de estudo",
          "Luz noturna (bebê/criança)"
        ],
        "conteudoLinhas": [
          "   Luz geral",
          "   Luz indireta",
          "   Luz de leitura",
          "   Luz de estudo",
          "   Luz noturna (bebê/criança)"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Luz geral"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz indireta"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz de leitura"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz de estudo"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz noturna (bebê/criança)"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_25",
        "titulo": "🎨 ESTILO",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Você quer um quarto que dure anos ou um quarto mais “fase da vida”?",
            "secao": "🎨 ESTILO"
          }
        ],
        "itens": [
          "Lúdico",
          "Clean",
          "Atemporal",
          "Moderno",
          "Temático leve"
        ],
        "conteudoLinhas": [
          "   Lúdico",
          "   Clean",
          "   Atemporal",
          "   Moderno",
          "   Temático leve",
          "[Pergunta-chave:] Você quer um quarto que dure anos ou um quarto mais “fase da vida”?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Lúdico"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Clean"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Atemporal"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Moderno"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Temático leve"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Você quer um quarto que dure anos ou um quarto mais “fase da vida”?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_26",
        "titulo": "👧 ESPECÍFICO – QUARTO DE FILHA: 25. Identidade",
        "perguntasDestaque": [],
        "itens": [
          "Mais delicado",
          "Mais moderno",
          "Mais neutro",
          "Mais marcante"
        ],
        "conteudoLinhas": [
          "(Além de tudo acima, aprofundar)",
          "   Mais delicado",
          "   Mais moderno",
          "   Mais neutro",
          "   Mais marcante"
        ],
        "blocos": [
          {
            "tipo": "nota",
            "texto": "(Além de tudo acima, aprofundar)"
          },
          {
            "tipo": "itens",
            "itens": [
              "Mais delicado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Mais moderno"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Mais neutro"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Mais marcante"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_27",
        "titulo": "👧 ESPECÍFICO – QUARTO DE FILHA: 26. Vaidade (dependendo da idade)",
        "perguntasDestaque": [],
        "itens": [
          "Espelho",
          "Penteadeira",
          "Iluminação de rosto",
          "Organização de acessórios"
        ],
        "conteudoLinhas": [
          "   Espelho",
          "   Penteadeira",
          "   Iluminação de rosto",
          "   Organização de acessórios"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Espelho"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Penteadeira"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Iluminação de rosto"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Organização de acessórios"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_28",
        "titulo": "👧 ESPECÍFICO – QUARTO DE FILHA: 27. Acessórios",
        "perguntasDestaque": [],
        "itens": [
          "Bijuterias",
          "Maquiagem",
          "Bolsas"
        ],
        "conteudoLinhas": [
          "   Bijuterias",
          "   Maquiagem",
          "   Bolsas"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Bijuterias"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Maquiagem"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Bolsas"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_29",
        "titulo": "👧 ESPECÍFICO – QUARTO DE FILHA: 28. Espaço pessoal",
        "perguntasDestaque": [],
        "itens": [
          "Importância de identidade própria",
          "Desejo de personalização"
        ],
        "conteudoLinhas": [
          "   Importância de identidade própria",
          "   Desejo de personalização"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Importância de identidade própria"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Desejo de personalização"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_30",
        "titulo": "🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)",
        "perguntasDestaque": [
          {
            "tipo": "emocional",
            "rotulo": "🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)",
            "pergunta": "O que você quer proporcionar para seu filho(a) com esse quarto?",
            "secao": "🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)"
          },
          {
            "tipo": "emocional",
            "rotulo": "🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)",
            "pergunta": "Esse quarto precisa ser mais funcional ou mais marcante?",
            "secao": "🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)"
          },
          {
            "tipo": "emocional",
            "rotulo": "🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)",
            "pergunta": "Você quer que ele(a) passe mais tempo nesse ambiente?",
            "secao": "🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)"
          },
          {
            "tipo": "emocional",
            "rotulo": "🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)",
            "pergunta": "O que você NÃO quer que aconteça nesse quarto?",
            "secao": "🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)"
          },
          {
            "tipo": "emocional",
            "rotulo": "🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)",
            "pergunta": "Existe algo do seu próprio quarto de infância que você gostaria de fazer diferente?",
            "secao": "🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)"
          }
        ],
        "itens": [
          "O que você quer proporcionar para seu filho(a) com esse quarto?",
          "Esse quarto precisa ser mais funcional ou mais marcante?",
          "Você quer que ele(a) passe mais tempo nesse ambiente?",
          "O que você NÃO quer que aconteça nesse quarto?",
          "Existe algo do seu próprio quarto de infância que você gostaria de fazer diferente?"
        ],
        "conteudoLinhas": [
          "   O que você quer proporcionar para seu filho(a) com esse quarto?",
          "   Esse quarto precisa ser mais funcional ou mais marcante?",
          "   Você quer que ele(a) passe mais tempo nesse ambiente?",
          "   O que você NÃO quer que aconteça nesse quarto?",
          "   Existe algo do seu próprio quarto de infância que você gostaria de fazer diferente?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "O que você quer proporcionar para seu filho(a) com esse quarto?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Esse quarto precisa ser mais funcional ou mais marcante?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você quer que ele(a) passe mais tempo nesse ambiente?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "O que você NÃO quer que aconteça nesse quarto?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Existe algo do seu próprio quarto de infância que você gostaria de fazer diferente?"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_31",
        "titulo": "⚠️ PONTOS DE ATENÇÃO (ERROS COMUNS)",
        "perguntasDestaque": [],
        "itens": [
          "Fazer quarto “bonito” e não funcional",
          "Não prever crescimento",
          "Falta de tomada",
          "Falta de espaço de estudo",
          "Excesso de tema infantil",
          "Falta de armazenamento",
          "Móveis fora da escala da criança"
        ],
        "conteudoLinhas": [
          "   Fazer quarto “bonito” e não funcional",
          "   Não prever crescimento",
          "   Falta de tomada",
          "   Falta de espaço de estudo",
          "   Excesso de tema infantil",
          "   Falta de armazenamento",
          "   Móveis fora da escala da criança"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Fazer quarto “bonito” e não funcional"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Não prever crescimento"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Falta de tomada"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Falta de espaço de estudo"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Excesso de tema infantil"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Falta de armazenamento"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Móveis fora da escala da criança"
            ]
          }
        ]
      },
      {
        "id": "quarto_filhos_sec_32",
        "titulo": "📊 RESUMO PARA PROJETO",
        "perguntasDestaque": [],
        "itens": [],
        "conteudoLinhas": [
          "Idade atual:",
          "Fase futura considerada:",
          "Uso principal:",
          "Perfil comportamental:",
          "Volume de itens:",
          "Nível de organização:",
          "Itens obrigatórios:",
          "Estilo:",
          "Pontos críticos:"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Idade atual:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Fase futura considerada:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Uso principal:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Perfil comportamental:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Volume de itens:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Nível de organização:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Itens obrigatórios:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Estilo:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Pontos críticos:",
            "itens": []
          }
        ]
      }
    ],
    "perguntasEstrategicas": [
      {
        "tipo": "estrategica",
        "rotulo": "Pergunta estratégica:",
        "pergunta": "Você quer um quarto que acompanhe o crescimento ou pretende trocar no futuro?",
        "secao": "2. Fase atual da criança"
      },
      {
        "tipo": "estrategica",
        "rotulo": "👶 BLOCO 1 – BEBÊ (0–2 anos): 8. Rotina dos pais",
        "pergunta": "Troca frequente?",
        "secao": "👶 BLOCO 1 – BEBÊ (0–2 anos): 8. Rotina dos pais"
      },
      {
        "tipo": "estrategica",
        "rotulo": "👶 BLOCO 1 – BEBÊ (0–2 anos): 8. Rotina dos pais",
        "pergunta": "Amamenta no quarto?",
        "secao": "👶 BLOCO 1 – BEBÊ (0–2 anos): 8. Rotina dos pais"
      },
      {
        "tipo": "estrategica",
        "rotulo": "👶 BLOCO 1 – BEBÊ (0–2 anos): 8. Rotina dos pais",
        "pergunta": "Dorme junto em alguns momentos?",
        "secao": "👶 BLOCO 1 – BEBÊ (0–2 anos): 8. Rotina dos pais"
      },
      {
        "tipo": "estrategica",
        "rotulo": "BLOCO 2 – CRIANÇA (3–7 anos): 13. Organização",
        "pergunta": "Criança acessa tudo?",
        "secao": "BLOCO 2 – CRIANÇA (3–7 anos): 13. Organização"
      },
      {
        "tipo": "estrategica",
        "rotulo": "BLOCO 2 – CRIANÇA (3–7 anos): 13. Organização",
        "pergunta": "Precisa ensinar autonomia?",
        "secao": "BLOCO 2 – CRIANÇA (3–7 anos): 13. Organização"
      },
      {
        "tipo": "estrategica",
        "rotulo": "BLOCO 3 – PRÉ-ADOLESCENTE / ADOLESCENTE: 18. Estudo (CRÍTICO)",
        "pergunta": "Estuda no quarto?",
        "secao": "BLOCO 3 – PRÉ-ADOLESCENTE / ADOLESCENTE: 18. Estudo (CRÍTICO)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "BLOCO 3 – PRÉ-ADOLESCENTE / ADOLESCENTE: 18. Estudo (CRÍTICO)",
        "pergunta": "Usa notebook ou desktop?",
        "secao": "BLOCO 3 – PRÉ-ADOLESCENTE / ADOLESCENTE: 18. Estudo (CRÍTICO)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "BLOCO 3 – PRÉ-ADOLESCENTE / ADOLESCENTE: 20. Privacidade",
        "pergunta": "Espaço para receber amigos?",
        "secao": "BLOCO 3 – PRÉ-ADOLESCENTE / ADOLESCENTE: 20. Privacidade"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Você quer um quarto que dure anos ou um quarto mais “fase da vida”?",
        "secao": "🎨 ESTILO"
      },
      {
        "tipo": "emocional",
        "rotulo": "🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)",
        "pergunta": "O que você quer proporcionar para seu filho(a) com esse quarto?",
        "secao": "🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)"
      },
      {
        "tipo": "emocional",
        "rotulo": "🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)",
        "pergunta": "Esse quarto precisa ser mais funcional ou mais marcante?",
        "secao": "🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)"
      },
      {
        "tipo": "emocional",
        "rotulo": "🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)",
        "pergunta": "Você quer que ele(a) passe mais tempo nesse ambiente?",
        "secao": "🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)"
      },
      {
        "tipo": "emocional",
        "rotulo": "🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)",
        "pergunta": "O que você NÃO quer que aconteça nesse quarto?",
        "secao": "🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)"
      },
      {
        "tipo": "emocional",
        "rotulo": "🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)",
        "pergunta": "Existe algo do seu próprio quarto de infância que você gostaria de fazer diferente?",
        "secao": "🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)"
      }
    ],
    "topicosChecagemTecnica": [
      "👶 BLOCO 1 – BEBÊ (0–2 anos): 9. Segurança (CRÍTICO)",
      "[👶 BLOCO 1 – BEBÊ (0–2 anos): 9. Segurança (CRÍTICO)] Cantos arredondados",
      "[👶 BLOCO 1 – BEBÊ (0–2 anos): 9. Segurança (CRÍTICO)] Fixação de móveis",
      "[👶 BLOCO 1 – BEBÊ (0–2 anos): 9. Segurança (CRÍTICO)] Altura segura",
      "[👶 BLOCO 1 – BEBÊ (0–2 anos): 9. Segurança (CRÍTICO)] Materiais atóxicos",
      "[👶 BLOCO 1 – BEBÊ (0–2 anos): 9. Segurança (CRÍTICO)] Evitar puxadores perigosos",
      "BLOCO 3 – PRÉ-ADOLESCENTE / ADOLESCENTE: 18. Estudo (CRÍTICO)",
      "⚠️ PONTOS DE ATENÇÃO (ERROS COMUNS)",
      "[⚠️ PONTOS DE ATENÇÃO (ERROS COMUNS)] Fazer quarto “bonito” e não funcional",
      "[⚠️ PONTOS DE ATENÇÃO (ERROS COMUNS)] Não prever crescimento",
      "[⚠️ PONTOS DE ATENÇÃO (ERROS COMUNS)] Falta de tomada",
      "[⚠️ PONTOS DE ATENÇÃO (ERROS COMUNS)] Falta de espaço de estudo",
      "[⚠️ PONTOS DE ATENÇÃO (ERROS COMUNS)] Excesso de tema infantil",
      "[⚠️ PONTOS DE ATENÇÃO (ERROS COMUNS)] Falta de armazenamento",
      "[⚠️ PONTOS DE ATENÇÃO (ERROS COMUNS)] Móveis fora da escala da criança",
      "📊 RESUMO PARA PROJETO"
    ]
  },
  "rouparia": {
    "slug": "rouparia",
    "titulo": "Rouparia",
    "subtitulo": "Organização de roupas de cama e banho, travesseiros e centralização",
    "arquivoPdfOriginal": "BRIEFING ROUPARIA.pdf",
    "secoes": [
      {
        "id": "rouparia_sec_1",
        "titulo": "2. Objetivo do ambiente",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "2. Objetivo do ambiente",
            "pergunta": "Qual o principal papel da rouparia?",
            "secao": "2. Objetivo do ambiente"
          },
          {
            "tipo": "emocional",
            "rotulo": "Pergunta emocional:",
            "pergunta": "O que você quer sentir ao acessar sua rouparia?",
            "secao": "2. Objetivo do ambiente"
          }
        ],
        "itens": [
          "Organização da casa",
          "Centralizar roupas de cama e banho",
          "Apoio para quartos e banheiros",
          "Reduzir bagunça nos outros ambientes",
          "Organização",
          "Praticidade",
          "Facilidade no dia a dia",
          "Controle"
        ],
        "conteudoLinhas": [
          "Qual o principal papel da rouparia?",
          "   Organização da casa",
          "   Centralizar roupas de cama e banho",
          "   Apoio para quartos e banheiros",
          "   Reduzir bagunça nos outros ambientes",
          "[Pergunta emocional:] O que você quer sentir ao acessar sua rouparia?",
          "   Organização",
          "   Praticidade",
          "   Facilidade no dia a dia",
          "   Controle"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Qual o principal papel da rouparia?",
            "itens": [
              "Organização da casa",
              "Centralizar roupas de cama e banho",
              "Apoio para quartos e banheiros",
              "Reduzir bagunça nos outros ambientes"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta emocional:",
            "texto": "O que você quer sentir ao acessar sua rouparia?",
            "tipoPergunta": "emocional",
            "itens": [
              "Organização",
              "Praticidade",
              "Facilidade no dia a dia",
              "Controle"
            ]
          }
        ]
      },
      {
        "id": "rouparia_sec_2",
        "titulo": "3. Uso do ambiente",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Hoje você sente falta de um espaço organizado para esses itens?",
            "secao": "3. Uso do ambiente"
          }
        ],
        "itens": [
          "Frequência:",
          "Diário",
          "Semanal",
          "Eventual",
          "Quem utiliza:",
          "Cliente",
          "Cônjuge",
          "Funcionária"
        ],
        "conteudoLinhas": [
          "   Frequência:",
          "o Diário",
          "o Semanal",
          "o Eventual",
          "   Quem utiliza:",
          "o Cliente",
          "o Cônjuge",
          "o Funcionária",
          "[Pergunta-chave:] Hoje você sente falta de um espaço organizado para esses itens?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Frequência:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Diário"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Semanal"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Eventual"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Quem utiliza:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cliente"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cônjuge"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Funcionária"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Hoje você sente falta de um espaço organizado para esses itens?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "rouparia_sec_3",
        "titulo": "4. Itens armazenados",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "Pergunta estratégica:",
            "pergunta": "Você costuma ter itens extras (estoque) ou apenas o necessário?",
            "secao": "4. Itens armazenados"
          }
        ],
        "itens": [
          "Toalhas de banho",
          "Toalhas de rosto",
          "Roupas de cama",
          "Cobertores",
          "Edredons",
          "Travesseiros",
          "Itens de hóspedes",
          "Produtos extras"
        ],
        "conteudoLinhas": [
          "   Toalhas de banho",
          "   Toalhas de rosto",
          "   Roupas de cama",
          "   Cobertores",
          "   Edredons",
          "   Travesseiros",
          "   Itens de hóspedes",
          "   Produtos extras",
          "[Pergunta estratégica:] Você costuma ter itens extras (estoque) ou apenas o necessário?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Toalhas de banho"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Toalhas de rosto"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Roupas de cama"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cobertores"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Edredons"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Travesseiros"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Itens de hóspedes"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Produtos extras"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta estratégica:",
            "texto": "Você costuma ter itens extras (estoque) ou apenas o necessário?",
            "tipoPergunta": "estrategica",
            "itens": []
          }
        ]
      },
      {
        "id": "rouparia_sec_4",
        "titulo": "5. Volume de armazenamento",
        "perguntasDestaque": [],
        "itens": [
          "Baixo",
          "Médio",
          "Alto",
          "Quantidade de quartos",
          "Quantidade de banheiros",
          "Frequência de troca"
        ],
        "conteudoLinhas": [
          "   Baixo",
          "   Médio",
          "   Alto",
          "Considerar:",
          "   Quantidade de quartos",
          "   Quantidade de banheiros",
          "   Frequência de troca"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Baixo"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Médio"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Alto"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Considerar:",
            "itens": [
              "Quantidade de quartos",
              "Quantidade de banheiros",
              "Frequência de troca"
            ]
          }
        ]
      },
      {
        "id": "rouparia_sec_5",
        "titulo": "6. Organização interna",
        "perguntasDestaque": [],
        "itens": [
          "Prateleiras",
          "Nichos",
          "Gavetas",
          "Cestos",
          "Divisórias",
          "Tudo visível",
          "Tudo fechado",
          "Misto"
        ],
        "conteudoLinhas": [
          "   Prateleiras",
          "   Nichos",
          "   Gavetas",
          "   Cestos",
          "   Divisórias",
          "Preferência:",
          "   Tudo visível",
          "   Tudo fechado",
          "   Misto"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Prateleiras"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Nichos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Gavetas"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cestos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Divisórias"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Preferência:",
            "itens": [
              "Tudo visível",
              "Tudo fechado",
              "Misto"
            ]
          }
        ]
      },
      {
        "id": "rouparia_sec_6",
        "titulo": "7. Setorização",
        "perguntasDestaque": [],
        "itens": [
          "Tipo de item (toalhas / roupas de cama)",
          "Uso (dia a dia / hóspedes)",
          "Tamanho"
        ],
        "conteudoLinhas": [
          "Separação por:",
          "   Tipo de item (toalhas / roupas de cama)",
          "   Uso (dia a dia / hóspedes)",
          "   Tamanho"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Separação por:",
            "itens": [
              "Tipo de item (toalhas / roupas de cama)",
              "Uso (dia a dia / hóspedes)",
              "Tamanho"
            ]
          }
        ]
      },
      {
        "id": "rouparia_sec_7",
        "titulo": "8. Ergonomia",
        "perguntasDestaque": [],
        "itens": [
          "Altura de acesso confortável",
          "Itens mais usados ao alcance",
          "Itens volumosos em áreas superiores"
        ],
        "conteudoLinhas": [
          "   Altura de acesso confortável",
          "   Itens mais usados ao alcance",
          "   Itens volumosos em áreas superiores"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Altura de acesso confortável"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Itens mais usados ao alcance"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Itens volumosos em áreas superiores"
            ]
          }
        ]
      },
      {
        "id": "rouparia_sec_8",
        "titulo": "9. Localização (CRÍTICO)",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "9. Localização (CRÍTICO)",
            "pergunta": "Próxima aos quartos?",
            "secao": "9. Localização (CRÍTICO)"
          },
          {
            "tipo": "estrategica",
            "rotulo": "9. Localização (CRÍTICO)",
            "pergunta": "Próxima aos banheiros?",
            "secao": "9. Localização (CRÍTICO)"
          },
          {
            "tipo": "estrategica",
            "rotulo": "9. Localização (CRÍTICO)",
            "pergunta": "Fácil acesso no dia a dia?",
            "secao": "9. Localização (CRÍTICO)"
          },
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Você quer acesso rápido ou mais discreto?",
            "secao": "9. Localização (CRÍTICO)"
          }
        ],
        "itens": [
          "Próxima aos quartos?",
          "Próxima aos banheiros?",
          "Fácil acesso no dia a dia?"
        ],
        "conteudoLinhas": [
          "   Próxima aos quartos?",
          "   Próxima aos banheiros?",
          "   Fácil acesso no dia a dia?",
          "[Pergunta-chave:] Você quer acesso rápido ou mais discreto?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Próxima aos quartos?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Próxima aos banheiros?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Fácil acesso no dia a dia?"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Você quer acesso rápido ou mais discreto?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "rouparia_sec_9",
        "titulo": "10. Estética",
        "perguntasDestaque": [],
        "itens": [
          "Discreta",
          "Funcional",
          "Clean",
          "Integrada ao ambiente",
          "Resistentes",
          "Fáceis de limpar"
        ],
        "conteudoLinhas": [
          "   Discreta",
          "   Funcional",
          "   Clean",
          "   Integrada ao ambiente",
          "Materiais:",
          "   Resistentes",
          "   Fáceis de limpar"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Discreta"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Funcional"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Clean"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Integrada ao ambiente"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Materiais:",
            "itens": [
              "Resistentes",
              "Fáceis de limpar"
            ]
          }
        ]
      },
      {
        "id": "rouparia_sec_10",
        "titulo": "11. Portas",
        "perguntasDestaque": [],
        "itens": [
          "Abrir",
          "Correr",
          "Sem porta (nicho aberto)"
        ],
        "conteudoLinhas": [
          "   Abrir",
          "   Correr",
          "   Sem porta (nicho aberto)"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Abrir"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Correr"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Sem porta (nicho aberto)"
            ]
          }
        ]
      },
      {
        "id": "rouparia_sec_11",
        "titulo": "12. Manutenção",
        "perguntasDestaque": [],
        "itens": [
          "Facilidade de limpeza",
          "Organização contínua",
          "Evitar acúmulo"
        ],
        "conteudoLinhas": [
          "   Facilidade de limpeza",
          "   Organização contínua",
          "   Evitar acúmulo"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Facilidade de limpeza"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Organização contínua"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Evitar acúmulo"
            ]
          }
        ]
      },
      {
        "id": "rouparia_sec_12",
        "titulo": "13. Pontos de dor",
        "perguntasDestaque": [],
        "itens": [
          "Falta de espaço",
          "Bagunça",
          "Mistura de itens",
          "Dificuldade de acesso",
          "Falta de organização"
        ],
        "conteudoLinhas": [
          "   Falta de espaço",
          "   Bagunça",
          "   Mistura de itens",
          "   Dificuldade de acesso",
          "   Falta de organização"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Falta de espaço"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Bagunça"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Mistura de itens"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Dificuldade de acesso"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Falta de organização"
            ]
          }
        ]
      },
      {
        "id": "rouparia_sec_13",
        "titulo": "14. Perguntas de aprofundamento",
        "perguntasDestaque": [
          {
            "tipo": "profunda",
            "rotulo": "14. Perguntas de aprofundamento",
            "pergunta": "Onde você guarda esses itens hoje?",
            "secao": "14. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "14. Perguntas de aprofundamento",
            "pergunta": "O que mais te incomoda na organização atual?",
            "secao": "14. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "14. Perguntas de aprofundamento",
            "pergunta": "Você prefere praticidade ou estética?",
            "secao": "14. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "14. Perguntas de aprofundamento",
            "pergunta": "Você quer algo mais funcional ou mais organizado visualmente?",
            "secao": "14. Perguntas de aprofundamento"
          }
        ],
        "itens": [
          "Onde você guarda esses itens hoje?",
          "O que mais te incomoda na organização atual?",
          "Você prefere praticidade ou estética?",
          "Você quer algo mais funcional ou mais organizado visualmente?"
        ],
        "conteudoLinhas": [
          "   Onde você guarda esses itens hoje?",
          "   O que mais te incomoda na organização atual?",
          "   Você prefere praticidade ou estética?",
          "   Você quer algo mais funcional ou mais organizado visualmente?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Onde você guarda esses itens hoje?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "O que mais te incomoda na organização atual?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você prefere praticidade ou estética?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você quer algo mais funcional ou mais organizado visualmente?"
            ]
          }
        ]
      },
      {
        "id": "rouparia_sec_14",
        "titulo": "15. Integração com a casa",
        "perguntasDestaque": [],
        "itens": [
          "Integrada ao corredor",
          "Embutida",
          "Disfarçada",
          "Destaque funcional"
        ],
        "conteudoLinhas": [
          "   Integrada ao corredor",
          "   Embutida",
          "   Disfarçada",
          "   Destaque funcional"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Integrada ao corredor"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Embutida"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Disfarçada"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Destaque funcional"
            ]
          }
        ]
      },
      {
        "id": "rouparia_sec_15",
        "titulo": "16. Investimento e prioridade",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "16. Investimento e prioridade",
            "pergunta": "Já tem previsão?",
            "secao": "16. Investimento e prioridade"
          }
        ],
        "itens": [
          "Já tem previsão?",
          "Prioriza:",
          "Organização",
          "Funcionalidade",
          "Custo-benefício",
          "Estética"
        ],
        "conteudoLinhas": [
          "   Já tem previsão?",
          "   Prioriza:",
          "o Organização",
          "o Funcionalidade",
          "o Custo-benefício",
          "o Estética"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Já tem previsão?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Prioriza:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Organização"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Funcionalidade"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Custo-benefício"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Estética"
            ]
          }
        ]
      },
      {
        "id": "rouparia_sec_16",
        "titulo": "17. Checklist técnico",
        "perguntasDestaque": [],
        "itens": [
          "Medidas do espaço",
          "Localização",
          "Circulação",
          "Tipo de abertura",
          "Profundidade ideal"
        ],
        "conteudoLinhas": [
          "   Medidas do espaço",
          "   Localização",
          "   Circulação",
          "   Tipo de abertura",
          "   Profundidade ideal"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Medidas do espaço"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Localização"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Circulação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Tipo de abertura"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Profundidade ideal"
            ]
          }
        ]
      },
      {
        "id": "rouparia_sec_17",
        "titulo": "18. Resumo para o projetista",
        "perguntasDestaque": [],
        "itens": [],
        "conteudoLinhas": [
          "Volume de itens:",
          "Tipo de uso:",
          "Preferência visual:",
          "Localização:",
          "Itens obrigatórios:",
          "Pontos críticos:"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Volume de itens:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Tipo de uso:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Preferência visual:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Localização:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Itens obrigatórios:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Pontos críticos:",
            "itens": []
          }
        ]
      }
    ],
    "perguntasEstrategicas": [
      {
        "tipo": "estrategica",
        "rotulo": "2. Objetivo do ambiente",
        "pergunta": "Qual o principal papel da rouparia?",
        "secao": "2. Objetivo do ambiente"
      },
      {
        "tipo": "emocional",
        "rotulo": "Pergunta emocional:",
        "pergunta": "O que você quer sentir ao acessar sua rouparia?",
        "secao": "2. Objetivo do ambiente"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Hoje você sente falta de um espaço organizado para esses itens?",
        "secao": "3. Uso do ambiente"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Pergunta estratégica:",
        "pergunta": "Você costuma ter itens extras (estoque) ou apenas o necessário?",
        "secao": "4. Itens armazenados"
      },
      {
        "tipo": "estrategica",
        "rotulo": "9. Localização (CRÍTICO)",
        "pergunta": "Próxima aos quartos?",
        "secao": "9. Localização (CRÍTICO)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "9. Localização (CRÍTICO)",
        "pergunta": "Próxima aos banheiros?",
        "secao": "9. Localização (CRÍTICO)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "9. Localização (CRÍTICO)",
        "pergunta": "Fácil acesso no dia a dia?",
        "secao": "9. Localização (CRÍTICO)"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Você quer acesso rápido ou mais discreto?",
        "secao": "9. Localização (CRÍTICO)"
      },
      {
        "tipo": "profunda",
        "rotulo": "14. Perguntas de aprofundamento",
        "pergunta": "Onde você guarda esses itens hoje?",
        "secao": "14. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "14. Perguntas de aprofundamento",
        "pergunta": "O que mais te incomoda na organização atual?",
        "secao": "14. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "14. Perguntas de aprofundamento",
        "pergunta": "Você prefere praticidade ou estética?",
        "secao": "14. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "14. Perguntas de aprofundamento",
        "pergunta": "Você quer algo mais funcional ou mais organizado visualmente?",
        "secao": "14. Perguntas de aprofundamento"
      },
      {
        "tipo": "estrategica",
        "rotulo": "16. Investimento e prioridade",
        "pergunta": "Já tem previsão?",
        "secao": "16. Investimento e prioridade"
      }
    ],
    "topicosChecagemTecnica": [
      "8. Ergonomia",
      "9. Localização (CRÍTICO)",
      "17. Checklist técnico",
      "[17. Checklist técnico] Medidas do espaço",
      "[17. Checklist técnico] Localização",
      "[17. Checklist técnico] Circulação",
      "[17. Checklist técnico] Tipo de abertura",
      "[17. Checklist técnico] Profundidade ideal",
      "18. Resumo para o projetista"
    ]
  },
  "sala_jantar": {
    "slug": "sala_jantar",
    "titulo": "Sala de Jantar",
    "subtitulo": "Dimensão da mesa, número de lugares, circulação, buffet e pendentes",
    "arquivoPdfOriginal": "BRIEFING SALA DE JANTAR.pdf",
    "secoes": [
      {
        "id": "sala_jantar_sec_1",
        "titulo": "2. Objetivo do ambiente",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "2. Objetivo do ambiente",
            "pergunta": "Qual o principal papel da sala de jantar?",
            "secao": "2. Objetivo do ambiente"
          },
          {
            "tipo": "emocional",
            "rotulo": "Pergunta emocional:",
            "pergunta": "Que tipo de momento você quer viver nesse espaço?",
            "secao": "2. Objetivo do ambiente"
          }
        ],
        "itens": [
          "Refeições do dia a dia",
          "Reuniões familiares",
          "Jantares especiais",
          "Receber convidados",
          "Ambiente mais social do que funcional",
          "Conexão com a família",
          "Receber bem",
          "Sofisticação",
          "Aconchego",
          "Experiência especial"
        ],
        "conteudoLinhas": [
          "Qual o principal papel da sala de jantar?",
          "   Refeições do dia a dia",
          "   Reuniões familiares",
          "   Jantares especiais",
          "   Receber convidados",
          "   Ambiente mais social do que funcional",
          "[Pergunta emocional:] Que tipo de momento você quer viver nesse espaço?",
          "   Conexão com a família",
          "   Receber bem",
          "   Sofisticação",
          "   Aconchego",
          "   Experiência especial"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Qual o principal papel da sala de jantar?",
            "itens": [
              "Refeições do dia a dia",
              "Reuniões familiares",
              "Jantares especiais",
              "Receber convidados",
              "Ambiente mais social do que funcional"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta emocional:",
            "texto": "Que tipo de momento você quer viver nesse espaço?",
            "tipoPergunta": "emocional",
            "itens": [
              "Conexão com a família",
              "Receber bem",
              "Sofisticação",
              "Aconchego",
              "Experiência especial"
            ]
          }
        ]
      },
      {
        "id": "sala_jantar_sec_2",
        "titulo": "3. Frequência de uso",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Você pretende usar esse espaço com frequência ou mais em momentos especiais?",
            "secao": "3. Frequência de uso"
          }
        ],
        "itens": [
          "Diário",
          "Finais de semana",
          "Ocasional",
          "Apenas em ocasiões especiais"
        ],
        "conteudoLinhas": [
          "   Diário",
          "   Finais de semana",
          "   Ocasional",
          "   Apenas em ocasiões especiais",
          "[Pergunta-chave:] Você pretende usar esse espaço com frequência ou mais em momentos especiais?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Diário"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Finais de semana"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Ocasional"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Apenas em ocasiões especiais"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Você pretende usar esse espaço com frequência ou mais em momentos especiais?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "sala_jantar_sec_3",
        "titulo": "4. Perfil de uso",
        "perguntasDestaque": [],
        "itens": [
          "Família pequena",
          "Família grande",
          "Recebe muitos convidados",
          "Recebe poucos convidados",
          "Dia a dia:",
          "Eventos:"
        ],
        "conteudoLinhas": [
          "   Família pequena",
          "   Família grande",
          "   Recebe muitos convidados",
          "   Recebe poucos convidados",
          "Número médio de pessoas:",
          "   Dia a dia:",
          "   Eventos:"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Família pequena"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Família grande"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Recebe muitos convidados"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Recebe poucos convidados"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Número médio de pessoas:",
            "itens": [
              "Dia a dia:",
              "Eventos:"
            ]
          }
        ]
      },
      {
        "id": "sala_jantar_sec_4",
        "titulo": "5. Tamanho da mesa (CRÍTICO)",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "5. Tamanho da mesa (CRÍTICO)",
            "pergunta": "Mesa fixa ou extensível?",
            "secao": "5. Tamanho da mesa (CRÍTICO)"
          },
          {
            "tipo": "estrategica",
            "rotulo": "Pergunta estratégica:",
            "pergunta": "Você prefere uma mesa maior sempre ou uma solução flexível?",
            "secao": "5. Tamanho da mesa (CRÍTICO)"
          }
        ],
        "itens": [
          "Quantos lugares:",
          "4",
          "6",
          "8",
          "10+",
          "Mesa fixa ou extensível?"
        ],
        "conteudoLinhas": [
          "   Quantos lugares:",
          "o 4",
          "o 6",
          "o 8",
          "o 10+",
          "   Mesa fixa ou extensível?",
          "[Pergunta estratégica:] Você prefere uma mesa maior sempre ou uma solução flexível?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Quantos lugares:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "4"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "6"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "8"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "10+"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Mesa fixa ou extensível?"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta estratégica:",
            "texto": "Você prefere uma mesa maior sempre ou uma solução flexível?",
            "tipoPergunta": "estrategica",
            "itens": []
          }
        ]
      },
      {
        "id": "sala_jantar_sec_5",
        "titulo": "6. Integração com outros ambientes",
        "perguntasDestaque": [],
        "itens": [
          "Living",
          "Cozinha",
          "Área gourmet",
          "Integração total",
          "Integração parcial",
          "Ambiente mais reservado"
        ],
        "conteudoLinhas": [
          "A sala se conecta com:",
          "   Living",
          "   Cozinha",
          "   Área gourmet",
          "O cliente deseja:",
          "   Integração total",
          "   Integração parcial",
          "   Ambiente mais reservado"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "A sala se conecta com:",
            "itens": [
              "Living",
              "Cozinha",
              "Área gourmet"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "O cliente deseja:",
            "itens": [
              "Integração total",
              "Integração parcial",
              "Ambiente mais reservado"
            ]
          }
        ]
      },
      {
        "id": "sala_jantar_sec_6",
        "titulo": "7. Layout e circulação",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "7. Layout e circulação",
            "pergunta": "Espaço confortável ao redor da mesa?",
            "secao": "7. Layout e circulação"
          },
          {
            "tipo": "estrategica",
            "rotulo": "7. Layout e circulação",
            "pergunta": "Circulação livre?",
            "secao": "7. Layout e circulação"
          },
          {
            "tipo": "estrategica",
            "rotulo": "7. Layout e circulação",
            "pergunta": "Interferência de portas/janelas?",
            "secao": "7. Layout e circulação"
          }
        ],
        "itens": [
          "Espaço confortável ao redor da mesa?",
          "Circulação livre?",
          "Interferência de portas/janelas?"
        ],
        "conteudoLinhas": [
          "   Espaço confortável ao redor da mesa?",
          "   Circulação livre?",
          "   Interferência de portas/janelas?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Espaço confortável ao redor da mesa?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Circulação livre?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Interferência de portas/janelas?"
            ]
          }
        ]
      },
      {
        "id": "sala_jantar_sec_7",
        "titulo": "8. Mobiliário de apoio",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Você precisa de apoio para servir ou apenas da mesa?",
            "secao": "8. Mobiliário de apoio"
          }
        ],
        "itens": [
          "Aparador",
          "Louceiro",
          "Cristaleira",
          "Bar",
          "Adega"
        ],
        "conteudoLinhas": [
          "   Aparador",
          "   Louceiro",
          "   Cristaleira",
          "   Bar",
          "   Adega",
          "[Pergunta-chave:] Você precisa de apoio para servir ou apenas da mesa?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Aparador"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Louceiro"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cristaleira"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Bar"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Adega"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Você precisa de apoio para servir ou apenas da mesa?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "sala_jantar_sec_8",
        "titulo": "9. Armazenamento",
        "perguntasDestaque": [],
        "itens": [
          "Louças",
          "Taças",
          "Talheres",
          "Travessas",
          "Itens de servir",
          "Tudo escondido",
          "Parte exposta",
          "Destaque decorativo"
        ],
        "conteudoLinhas": [
          "Necessidade de guardar:",
          "   Louças",
          "   Taças",
          "   Talheres",
          "   Travessas",
          "   Itens de servir",
          "Preferência:",
          "   Tudo escondido",
          "   Parte exposta",
          "   Destaque decorativo"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Necessidade de guardar:",
            "itens": [
              "Louças",
              "Taças",
              "Talheres",
              "Travessas",
              "Itens de servir"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Preferência:",
            "itens": [
              "Tudo escondido",
              "Parte exposta",
              "Destaque decorativo"
            ]
          }
        ]
      },
      {
        "id": "sala_jantar_sec_9",
        "titulo": "10. Estilo visual",
        "perguntasDestaque": [
          {
            "tipo": "emocional",
            "rotulo": "Pergunta emocional:",
            "pergunta": "Você quer um ambiente mais impactante ou mais acolhedor?",
            "secao": "10. Estilo visual"
          }
        ],
        "itens": [
          "Sofisticado",
          "Moderno",
          "Clássico leve",
          "Aconchegante",
          "Minimalista",
          "Madeira",
          "Laca",
          "Vidro",
          "Pedra",
          "Metal"
        ],
        "conteudoLinhas": [
          "   Sofisticado",
          "   Moderno",
          "   Clássico leve",
          "   Aconchegante",
          "   Minimalista",
          "Materiais:",
          "   Madeira",
          "   Laca",
          "   Vidro",
          "   Pedra",
          "   Metal",
          "[Pergunta emocional:] Você quer um ambiente mais impactante ou mais acolhedor?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Sofisticado"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Moderno"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Clássico leve"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Aconchegante"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Minimalista"
            ]
          },
          {
            "tipo": "prompt",
            "texto": "Materiais:",
            "itens": [
              "Madeira",
              "Laca",
              "Vidro",
              "Pedra",
              "Metal"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta emocional:",
            "texto": "Você quer um ambiente mais impactante ou mais acolhedor?",
            "tipoPergunta": "emocional",
            "itens": []
          }
        ]
      },
      {
        "id": "sala_jantar_sec_10",
        "titulo": "11. Iluminação (CRÍTICO)",
        "perguntasDestaque": [
          {
            "tipo": "chave",
            "rotulo": "Pergunta-chave:",
            "pergunta": "Você quer que a mesa seja o destaque visual do ambiente?",
            "secao": "11. Iluminação (CRÍTICO)"
          }
        ],
        "itens": [
          "Ponto central sobre a mesa",
          "Luz indireta",
          "Luz decorativa"
        ],
        "conteudoLinhas": [
          "   Ponto central sobre a mesa",
          "   Luz indireta",
          "   Luz decorativa",
          "[Pergunta-chave:] Você quer que a mesa seja o destaque visual do ambiente?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Ponto central sobre a mesa"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz indireta"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Luz decorativa"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta-chave:",
            "texto": "Você quer que a mesa seja o destaque visual do ambiente?",
            "tipoPergunta": "chave",
            "itens": []
          }
        ]
      },
      {
        "id": "sala_jantar_sec_11",
        "titulo": "12. Uso social",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "12. Uso social",
            "pergunta": "Recebe convidados com frequência?",
            "secao": "12. Uso social"
          },
          {
            "tipo": "estrategica",
            "rotulo": "12. Uso social",
            "pergunta": "Usa para eventos especiais?",
            "secao": "12. Uso social"
          },
          {
            "tipo": "estrategica",
            "rotulo": "12. Uso social",
            "pergunta": "Precisa de apoio para servir?",
            "secao": "12. Uso social"
          }
        ],
        "itens": [
          "Recebe convidados com frequência?",
          "Usa para eventos especiais?",
          "Precisa de apoio para servir?"
        ],
        "conteudoLinhas": [
          "   Recebe convidados com frequência?",
          "   Usa para eventos especiais?",
          "   Precisa de apoio para servir?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Recebe convidados com frequência?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Usa para eventos especiais?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Precisa de apoio para servir?"
            ]
          }
        ]
      },
      {
        "id": "sala_jantar_sec_12",
        "titulo": "13. Conforto",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "13. Conforto",
            "pergunta": "Cadeiras confortáveis são prioridade?",
            "secao": "13. Conforto"
          }
        ],
        "itens": [
          "Tempo médio de permanência",
          "Cadeiras confortáveis são prioridade?"
        ],
        "conteudoLinhas": [
          "   Tempo médio de permanência",
          "   Cadeiras confortáveis são prioridade?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Tempo médio de permanência"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Cadeiras confortáveis são prioridade?"
            ]
          }
        ]
      },
      {
        "id": "sala_jantar_sec_13",
        "titulo": "14. Decoração",
        "perguntasDestaque": [
          {
            "tipo": "geral",
            "rotulo": "Pergunta:",
            "pergunta": "Você gosta de ambientes mais decorados ou mais limpos?",
            "secao": "14. Decoração"
          }
        ],
        "itens": [
          "Quadros",
          "Objetos",
          "Centro de mesa",
          "Plantas"
        ],
        "conteudoLinhas": [
          "   Quadros",
          "   Objetos",
          "   Centro de mesa",
          "   Plantas",
          "[Pergunta:] Você gosta de ambientes mais decorados ou mais limpos?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Quadros"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Objetos"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Centro de mesa"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Plantas"
            ]
          },
          {
            "tipo": "pergunta_destaque",
            "rotulo": "Pergunta:",
            "texto": "Você gosta de ambientes mais decorados ou mais limpos?",
            "tipoPergunta": "geral",
            "itens": []
          }
        ]
      },
      {
        "id": "sala_jantar_sec_14",
        "titulo": "15. Pontos de dor",
        "perguntasDestaque": [],
        "itens": [
          "Espaço pequeno",
          "Falta de uso",
          "Pouca integração",
          "Desconforto",
          "Falta de apoio"
        ],
        "conteudoLinhas": [
          "   Espaço pequeno",
          "   Falta de uso",
          "   Pouca integração",
          "   Desconforto",
          "   Falta de apoio"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Espaço pequeno"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Falta de uso"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Pouca integração"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Desconforto"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Falta de apoio"
            ]
          }
        ]
      },
      {
        "id": "sala_jantar_sec_15",
        "titulo": "16. Perguntas de aprofundamento",
        "perguntasDestaque": [
          {
            "tipo": "profunda",
            "rotulo": "16. Perguntas de aprofundamento",
            "pergunta": "O que você sente falta na sua sala de jantar hoje?",
            "secao": "16. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "16. Perguntas de aprofundamento",
            "pergunta": "Você gostaria de usar mais esse espaço?",
            "secao": "16. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "16. Perguntas de aprofundamento",
            "pergunta": "Você quer impressionar ou acolher?",
            "secao": "16. Perguntas de aprofundamento"
          },
          {
            "tipo": "profunda",
            "rotulo": "16. Perguntas de aprofundamento",
            "pergunta": "Qual ambiente você já viu e gostou?",
            "secao": "16. Perguntas de aprofundamento"
          }
        ],
        "itens": [
          "O que você sente falta na sua sala de jantar hoje?",
          "Você gostaria de usar mais esse espaço?",
          "Você quer impressionar ou acolher?",
          "Qual ambiente você já viu e gostou?"
        ],
        "conteudoLinhas": [
          "   O que você sente falta na sua sala de jantar hoje?",
          "   Você gostaria de usar mais esse espaço?",
          "   Você quer impressionar ou acolher?",
          "   Qual ambiente você já viu e gostou?"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "O que você sente falta na sua sala de jantar hoje?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você gostaria de usar mais esse espaço?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Você quer impressionar ou acolher?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Qual ambiente você já viu e gostou?"
            ]
          }
        ]
      },
      {
        "id": "sala_jantar_sec_16",
        "titulo": "17. Investimento e prioridade",
        "perguntasDestaque": [
          {
            "tipo": "estrategica",
            "rotulo": "17. Investimento e prioridade",
            "pergunta": "Já tem previsão?",
            "secao": "17. Investimento e prioridade"
          }
        ],
        "itens": [
          "Já tem previsão?",
          "Prioriza:",
          "Estética",
          "Conforto",
          "Funcionalidade",
          "Integração"
        ],
        "conteudoLinhas": [
          "   Já tem previsão?",
          "   Prioriza:",
          "o Estética",
          "o Conforto",
          "o Funcionalidade",
          "o Integração"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Já tem previsão?"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Prioriza:"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Estética"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Conforto"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Funcionalidade"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Integração"
            ]
          }
        ]
      },
      {
        "id": "sala_jantar_sec_17",
        "titulo": "18. Checklist técnico",
        "perguntasDestaque": [],
        "itens": [
          "Medidas do ambiente",
          "Circulação",
          "Posição da iluminação",
          "Integração com outros ambientes"
        ],
        "conteudoLinhas": [
          "   Medidas do ambiente",
          "   Circulação",
          "   Posição da iluminação",
          "   Integração com outros ambientes"
        ],
        "blocos": [
          {
            "tipo": "itens",
            "itens": [
              "Medidas do ambiente"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Circulação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Posição da iluminação"
            ]
          },
          {
            "tipo": "itens",
            "itens": [
              "Integração com outros ambientes"
            ]
          }
        ]
      },
      {
        "id": "sala_jantar_sec_18",
        "titulo": "19. Resumo para o projetista",
        "perguntasDestaque": [],
        "itens": [],
        "conteudoLinhas": [
          "Uso principal:",
          "Frequência:",
          "Número de pessoas:",
          "Integração:",
          "Estilo:",
          "Itens obrigatórios:",
          "Pontos críticos:"
        ],
        "blocos": [
          {
            "tipo": "prompt",
            "texto": "Uso principal:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Frequência:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Número de pessoas:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Integração:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Estilo:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Itens obrigatórios:",
            "itens": []
          },
          {
            "tipo": "prompt",
            "texto": "Pontos críticos:",
            "itens": []
          }
        ]
      }
    ],
    "perguntasEstrategicas": [
      {
        "tipo": "estrategica",
        "rotulo": "2. Objetivo do ambiente",
        "pergunta": "Qual o principal papel da sala de jantar?",
        "secao": "2. Objetivo do ambiente"
      },
      {
        "tipo": "emocional",
        "rotulo": "Pergunta emocional:",
        "pergunta": "Que tipo de momento você quer viver nesse espaço?",
        "secao": "2. Objetivo do ambiente"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Você pretende usar esse espaço com frequência ou mais em momentos especiais?",
        "secao": "3. Frequência de uso"
      },
      {
        "tipo": "estrategica",
        "rotulo": "5. Tamanho da mesa (CRÍTICO)",
        "pergunta": "Mesa fixa ou extensível?",
        "secao": "5. Tamanho da mesa (CRÍTICO)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "Pergunta estratégica:",
        "pergunta": "Você prefere uma mesa maior sempre ou uma solução flexível?",
        "secao": "5. Tamanho da mesa (CRÍTICO)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "7. Layout e circulação",
        "pergunta": "Espaço confortável ao redor da mesa?",
        "secao": "7. Layout e circulação"
      },
      {
        "tipo": "estrategica",
        "rotulo": "7. Layout e circulação",
        "pergunta": "Circulação livre?",
        "secao": "7. Layout e circulação"
      },
      {
        "tipo": "estrategica",
        "rotulo": "7. Layout e circulação",
        "pergunta": "Interferência de portas/janelas?",
        "secao": "7. Layout e circulação"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Você precisa de apoio para servir ou apenas da mesa?",
        "secao": "8. Mobiliário de apoio"
      },
      {
        "tipo": "emocional",
        "rotulo": "Pergunta emocional:",
        "pergunta": "Você quer um ambiente mais impactante ou mais acolhedor?",
        "secao": "10. Estilo visual"
      },
      {
        "tipo": "chave",
        "rotulo": "Pergunta-chave:",
        "pergunta": "Você quer que a mesa seja o destaque visual do ambiente?",
        "secao": "11. Iluminação (CRÍTICO)"
      },
      {
        "tipo": "estrategica",
        "rotulo": "12. Uso social",
        "pergunta": "Recebe convidados com frequência?",
        "secao": "12. Uso social"
      },
      {
        "tipo": "estrategica",
        "rotulo": "12. Uso social",
        "pergunta": "Usa para eventos especiais?",
        "secao": "12. Uso social"
      },
      {
        "tipo": "estrategica",
        "rotulo": "12. Uso social",
        "pergunta": "Precisa de apoio para servir?",
        "secao": "12. Uso social"
      },
      {
        "tipo": "estrategica",
        "rotulo": "13. Conforto",
        "pergunta": "Cadeiras confortáveis são prioridade?",
        "secao": "13. Conforto"
      },
      {
        "tipo": "geral",
        "rotulo": "Pergunta:",
        "pergunta": "Você gosta de ambientes mais decorados ou mais limpos?",
        "secao": "14. Decoração"
      },
      {
        "tipo": "profunda",
        "rotulo": "16. Perguntas de aprofundamento",
        "pergunta": "O que você sente falta na sua sala de jantar hoje?",
        "secao": "16. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "16. Perguntas de aprofundamento",
        "pergunta": "Você gostaria de usar mais esse espaço?",
        "secao": "16. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "16. Perguntas de aprofundamento",
        "pergunta": "Você quer impressionar ou acolher?",
        "secao": "16. Perguntas de aprofundamento"
      },
      {
        "tipo": "profunda",
        "rotulo": "16. Perguntas de aprofundamento",
        "pergunta": "Qual ambiente você já viu e gostou?",
        "secao": "16. Perguntas de aprofundamento"
      },
      {
        "tipo": "estrategica",
        "rotulo": "17. Investimento e prioridade",
        "pergunta": "Já tem previsão?",
        "secao": "17. Investimento e prioridade"
      }
    ],
    "topicosChecagemTecnica": [
      "5. Tamanho da mesa (CRÍTICO)",
      "11. Iluminação (CRÍTICO)",
      "18. Checklist técnico",
      "[18. Checklist técnico] Medidas do ambiente",
      "[18. Checklist técnico] Circulação",
      "[18. Checklist técnico] Posição da iluminação",
      "[18. Checklist técnico] Integração com outros ambientes",
      "19. Resumo para o projetista"
    ]
  }
}

/**
 * Normaliza string para correspondência tolerante a acentos e maiúsculas
 */
export function normalizarNomeAmbiente(nome?: string | null): string {
  return (nome || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Mapeamento direto de nomes do catálogo Plannit e sinônimos para os slugs de roteiros
 */
export const MAPEAMENTO_AMBIENTES_ROTEIRO: Record<string, string> = {
  // 1. Living / Sala de Estar
  'living': 'living',
  'sala de estar': 'living',
  'estar': 'living',
  'sala': 'living',
  'sala social': 'living',
  'sala de visita': 'living',

  // 2. Home Theater
  'home theater': 'home_theater',
  'sala de tv': 'home_theater',
  'tv': 'home_theater',
  'cinema': 'home_theater',
  'tv / home': 'home_theater',
  'sala de cinema': 'home_theater',

  // 3. Suíte Master / Quarto Casal
  'suite master': 'quarto_casal',
  'quarto casal': 'quarto_casal',
  'quarto de casal': 'quarto_casal',
  'dormitorio casal': 'quarto_casal',
  'suite': 'quarto_casal',
  'suite do casal': 'quarto_casal',
  'suite principal': 'quarto_casal',

  // 4, 5, 6. Quartos dos Filhos e Hóspedes
  'quarto do filho': 'quarto_filhos',
  'quarto da filha': 'quarto_filhos',
  'quarto de visita': 'quarto_filhos',
  'quarto de visitas': 'quarto_filhos',
  'quarto dos filhos': 'quarto_filhos',
  'quarto filho': 'quarto_filhos',
  'quarto filha': 'quarto_filhos',
  'quarto infantil': 'quarto_filhos',
  'quarto bebe': 'quarto_filhos',
  'quarto hospede': 'quarto_filhos',
  'quarto de hospede': 'quarto_filhos',
  'quarto de hospedes': 'quarto_filhos',
  'dormitorio filho': 'quarto_filhos',
  'dormitorio filha': 'quarto_filhos',
  'dormitorio hospede': 'quarto_filhos',
  'brinquedoteca': 'quarto_filhos',

  // 7. Closet
  'closet': 'closet',
  'closet casal': 'closet',
  'closet master': 'closet',
  'closet ele/ela': 'closet',

  // 8. Cozinha
  'cozinha': 'cozinha',
  'cozinha gourmet': 'cozinha',
  'cozinha integrada': 'cozinha',
  'cozinha americana': 'cozinha',
  'cozinha principal': 'cozinha',

  // 9, 10. Espaço Gourmet / Varanda
  'espaco gourmet': 'area_gourmet',
  'area gourmet': 'area_gourmet',
  'gourmet': 'area_gourmet',
  'varanda': 'area_gourmet',
  'varanda gourmet': 'area_gourmet',
  'sacada': 'area_gourmet',
  'terraco': 'area_gourmet',
  'churrasqueira': 'area_gourmet',
  'quiosque': 'area_gourmet',

  // 11. Banheiro Geral
  'banheiro': 'banheiros',
  'banheiros': 'banheiros',
  'banheiro social': 'banheiros',
  'banheiro de hospedes': 'banheiros',
  'banheiro hospedes': 'banheiros',
  'banheiro filho': 'banheiros',
  'banheiro filha': 'banheiros',
  'banheiro dos filhos': 'banheiros',
  'banheiro de servico': 'banheiros',

  // Banheiro Suíte Master (específico)
  'banheiro suite master': 'banheiro_suite_master',
  'banheiro master': 'banheiro_suite_master',
  'banheiro da suite': 'banheiro_suite_master',
  'suite master (banheiro)': 'banheiro_suite_master',

  // 12. Lavabo
  'lavabo': 'lavabo',
  'lavabo social': 'lavabo',

  // 13. Home Office
  'home office': 'home_office',
  'escritorio': 'home_office',
  'gabinete': 'home_office',
  'estudo': 'home_office',
  'sala de estudos': 'home_office',

  // 14. Área de Serviço / Lavanderia
  'area de servico': 'lavanderia',
  'lavanderia': 'lavanderia',
  'servico': 'lavanderia',

  // 15. Adega
  'adega': 'adega',
  'adega climatizada': 'adega',
  'bar / adega': 'adega',

  // 16. Despensa
  'despensa': 'despensa',
  'dispensa': 'despensa',

  // 17. Hall de Entrada
  'hall de entrada': 'hall_entrada',
  'hall': 'hall_entrada',
  'foyer': 'hall_entrada',
  'entrada': 'hall_entrada',
  'recepcao': 'hall_entrada',

  // 18. Louceiro
  'louceiro': 'louceiro',
  'cristaleira': 'louceiro',

  // 19. Rouparia
  'rouparia': 'rouparia',
  'roupeiro': 'rouparia',

  // 20. Sala de Jantar
  'sala de jantar': 'sala_jantar',
  'jantar': 'sala_jantar',
  'copa': 'sala_jantar',
}

/**
 * Resolve o slug correspondente para qualquer nome de ambiente vindo do catálogo,
 * digitação livre ou seleção no formulário
 */
export function resolverSlugAmbiente(nome?: string | null): string {
  if (!nome) return 'living'
  let norm = normalizarNomeAmbiente(nome)

  // Remove prefixos comuns de itens criados fora do catálogo ("Outro: ", "Outro - ")
  norm = norm.replace(/^outro[:\-\s]+/, '').trim()
  if (!norm) return 'living'

  // 1. Match exato no mapa
  if (MAPEAMENTO_AMBIENTES_ROTEIRO[norm]) {
    return MAPEAMENTO_AMBIENTES_ROTEIRO[norm]
  }

  // 2. Substrings com prioridade
  // Banheiros: Master vs Filhos/Social
  if (norm.includes('banheiro')) {
    if (
      norm.includes('master') ||
      (norm.includes('suite') &&
        !norm.includes('filh') &&
        !norm.includes('hospede') &&
        !norm.includes('visita'))
    ) {
      return 'banheiro_suite_master'
    }
    return 'banheiros'
  }

  if (norm.includes('lavabo')) {
    return 'lavabo'
  }

  // Quartos infantis e visitas antes de quarto casal
  if (
    norm.includes('filh') ||
    norm.includes('bebe') ||
    norm.includes('crianca') ||
    norm.includes('infantil') ||
    norm.includes('brinquedo') ||
    norm.includes('visita') ||
    norm.includes('hospede')
  ) {
    return 'quarto_filhos'
  }

  if (norm.includes('casal') || norm.includes('suite')) {
    return 'quarto_casal'
  }

  if (
    norm.includes('gourmet') ||
    norm.includes('churrasqueir') ||
    norm.includes('varanda') ||
    norm.includes('sacada') ||
    norm.includes('terraco')
  ) {
    return 'area_gourmet'
  }

  if (norm.includes('servico') || norm.includes('lavanderia')) {
    return 'lavanderia'
  }

  if (
    norm.includes('office') ||
    norm.includes('escritorio') ||
    norm.includes('trabalho') ||
    norm.includes('estudo')
  ) {
    return 'home_office'
  }

  if (
    norm.includes('theater') ||
    norm.includes('cinema') ||
    (norm.includes('sala') && norm.includes('tv'))
  ) {
    return 'home_theater'
  }

  if (norm.includes('jantar') || norm.includes('copa')) {
    return 'sala_jantar'
  }

  if (norm.includes('living') || norm.includes('estar')) {
    return 'living'
  }

  if (norm.includes('cozinha')) {
    return 'cozinha'
  }

  if (norm.includes('closet')) {
    return 'closet'
  }

  if (norm.includes('despensa') || norm.includes('dispensa')) {
    return 'despensa'
  }

  if (norm.includes('adega')) {
    return 'adega'
  }

  if (norm.includes('hall') || norm.includes('entrada') || norm.includes('foyer')) {
    return 'hall_entrada'
  }

  if (norm.includes('louceiro') || norm.includes('cristal')) {
    return 'louceiro'
  }

  if (norm.includes('roup')) {
    return 'rouparia'
  }

  // Fallback seguro
  return 'living'
}

/**
 * Retorna o Roteiro completo pelo slug
 */
export function obterRoteiroPorSlug(slug: string): RoteiroAmbiente | undefined {
  return ROTEIROS_BRIEFINGS[slug]
}

/**
 * Retorna o Roteiro correspondente a partir do nome do ambiente
 */
export function obterRoteiroPorAmbiente(nomeAmbiente?: string | null): RoteiroAmbiente {
  const slug = resolverSlugAmbiente(nomeAmbiente)
  return ROTEIROS_BRIEFINGS[slug] || ROTEIROS_BRIEFINGS['living']
}

/**
 * Extrai o texto formatado completo de uma seção do roteiro,
 * contemplando blocos estruturados, prompts, perguntas e itens sem perda de dados.
 */
export function obterTextoCompletoSecao(secao: SecaoRoteiro): string {
  const linhas: string[] = [secao.titulo]
  if (secao.blocos && secao.blocos.length > 0) {
    for (const b of secao.blocos) {
      if (b.tipo === 'pergunta_destaque') {
        const rotuloPrefix = b.rotulo ? '[' + b.rotulo + '] ' : ''
        linhas.push(rotuloPrefix + '"' + (b.texto || '') + '"')
        if (b.itens && b.itens.length > 0) {
          for (const item of b.itens) linhas.push('  • ' + item)
        }
      } else if (b.tipo === 'prompt') {
        if (b.texto) linhas.push(b.texto)
        if (b.itens && b.itens.length > 0) {
          for (const item of b.itens) linhas.push('  • ' + item)
        }
      } else if (b.tipo === 'itens' && b.itens) {
        for (const item of b.itens) linhas.push('• ' + item)
      } else if (b.tipo === 'nota' || b.tipo === 'texto') {
        if (b.texto) linhas.push(b.texto)
      }
    }
  } else if (secao.itens.length > 0) {
    for (const item of secao.itens) linhas.push('• ' + item)
  } else if (secao.conteudoLinhas && secao.conteudoLinhas.length > 0) {
    for (const linha of secao.conteudoLinhas) linhas.push(linha)
  }
  return linhas.join('\n')
}
