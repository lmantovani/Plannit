/**
 * Script de extração e estruturação dos roteiros técnicos a partir dos 18 PDFs em docs/briefings/
 */
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const dir = path.resolve(__dirname, '../../docs/briefings');
const targetFile = path.resolve(__dirname, '../inertia/lib/roteiros_briefings.ts');

const filesMeta = [
  { file: 'BRIEFING ADEGA.pdf', slug: 'adega', titulo: 'Adega', subtitulo: 'Conservação, capacidade, exposição de rótulos e experiência de degustação' },
  { file: 'BRIEFING AREA GOURMET.pdf', slug: 'area_gourmet', titulo: 'Espaço Gourmet / Área Gourmet', subtitulo: 'Equipamentos, churrasqueira, bancadas de apoio, receber convidados e lazer' },
  { file: 'BRIEFING BANHEIRO SUITE MASTER.pdf', slug: 'banheiro_suite_master', titulo: 'Banheiro Suíte Master', subtitulo: 'Uso compartilhado do casal, cubas duplas, espelhos, maquiagem e spa' },
  { file: 'BRIEFING BANHEIROS.pdf', slug: 'banheiros', titulo: 'Banheiros (Social / Hóspedes)', subtitulo: 'Praticidade, armazenamento de higiene, bancada, área de banho e nichos' },
  { file: 'BRIEFING CLOSET.pdf', slug: 'closet', titulo: 'Closet', subtitulo: 'Divisão de casal, proporção de cabides e dobrados, sapatos, bolsas e joias' },
  { file: 'BRIEFING COZINHA.pdf', slug: 'cozinha', titulo: 'Cozinha', subtitulo: 'Triângulo funcional, eletros embutidos, despensa, bancada e rotina de preparo' },
  { file: 'BRIEFING DESPENSA.pdf', slug: 'despensa', titulo: 'Despensa', subtitulo: 'Setorização de mantimentos, eletroportáteis, ventilação e fluxo com cozinha' },
  { file: 'BRIEFING HALL DE ENTRADA.pdf', slug: 'hall_entrada', titulo: 'Hall de Entrada', subtitulo: 'Impacto visual na recepção, sapateira de apoio, espelhos e circulação' },
  { file: 'BRIEFING HOME OFFICE.pdf', slug: 'home_office', titulo: 'Home Office', subtitulo: 'Ergonomia, monitores, tomadas/fiação, reuniões em vídeo e armazenamento' },
  { file: 'BRIEFING HOME THEATER.pdf', slug: 'home_theater', titulo: 'Home Theater', subtitulo: 'Painel de TV, acústica, distância do sofá, iluminação cênica e cabos' },
  { file: 'BRIEFING LAVABO.pdf', slug: 'lavabo', titulo: 'Lavabo', subtitulo: 'Cartão de visitas social, impacto estético, bancada esculpida e iluminação' },
  { file: 'BRIEFING LAVANDERIA.pdf', slug: 'lavanderia', titulo: 'Área de Serviço / Lavanderia', subtitulo: 'Fluxo de roupas sujas e limpas, máquina, varal, produtos e tábua de passar' },
  { file: 'BRIEFING LIVING_ SALA DE ESTAR.pdf', slug: 'living', titulo: 'Living / Sala de Estar', subtitulo: 'Convivência familiar, integração com jantar/varanda e layout de sofás' },
  { file: 'BRIEFING LOUCEIRO.pdf', slug: 'louceiro', titulo: 'Louceiro', subtitulo: 'Armazenamento seguro de louças, cristaleira, faqueiros e apoio ao servir' },
  { file: 'BRIEFING QUARTO CASAL.pdf', slug: 'quarto_casal', titulo: 'Suíte Master / Quarto Casal', subtitulo: 'Refúgio de descanso, cabeceira, mesas de cabeceira, iluminação e TV' },
  { file: 'BRIEFING QUARTO DOS FILHOS.pdf', slug: 'quarto_filhos', titulo: 'Quarto dos Filhos', subtitulo: 'Fase de desenvolvimento, cama, estudos, brinquedos, segurança e evolução' },
  { file: 'BRIEFING ROUPARIA.pdf', slug: 'rouparia', titulo: 'Rouparia', subtitulo: 'Organização de roupas de cama e banho, travesseiros e centralização' },
  { file: 'BRIEFING SALA DE JANTAR.pdf', slug: 'sala_jantar', titulo: 'Sala de Jantar', subtitulo: 'Dimensão da mesa, número de lugares, circulação, buffet e pendentes' },
];

const gourmetSections = [
  'Objetivo da área gourmet', 'Perfil de uso', 'Estilo de receber', 'Rotina gastronômica',
  'Equipamentos previstos', 'Armazenamento necessário', 'Bancadas e apoio',
  'Fluxo e circulação', 'Integração com outros ambientes', 'Estilo visual desejado',
  'Nível de manutenção desejado', 'Crianças, pets e segurança', 'Tecnologia e entretenimento',
  'Iluminação', 'Bebidas e bar', 'Pontos de dor e experiências anteriores',
  'Concorrentes e referências', 'Investimento e expectativa', 'Checklist técnico inicial',
  'Perguntas finais de encantamento', 'Resumo para o projetista'
];

function getQuestionType(t) {
  const lower = t.toLowerCase();
  if (lower.includes('emocion')) return 'emocional';
  if (lower.includes('estratég') || lower.includes('estrateg')) return 'estrategica';
  if (lower.includes('chave')) return 'chave';
  if (lower.includes('prática') || lower.includes('pratica')) return 'pratica';
  if (lower.includes('essencial')) return 'essencial';
  if (lower.includes('profund')) return 'profunda';
  if (lower.includes('ouro')) return 'estrategica';
  if (lower.includes('experiência') || lower.includes('experiencia') || lower.includes('encantamento')) return 'experiencia';
  return 'geral';
}

function parsePdfDoc(meta) {
  const filePath = path.join(dir, meta.file);
  const raw = execSync(`pdftotext -layout "${filePath}" -`, { encoding: 'utf8' });
  const rawLines = raw.split('\n').map(l => l.replace(/\x0c/g, '').trimEnd());

  // Pré-processamento: unificar quebras de linhas de cabeçalhos conhecidos do Quarto dos Filhos
  const lines = [];
  for (let idx = 0; idx < rawLines.length; idx++) {
    const cur = rawLines[idx].trim();
    const next = idx + 1 < rawLines.length ? rawLines[idx + 1].trim() : '';

    if (cur === 'BLOCO 3 – PRÉ-ADOLESCENTE /' && next === 'ADOLESCENTE') {
      lines.push('BLOCO 3 – PRÉ-ADOLESCENTE / ADOLESCENTE');
      idx++;
      continue;
    }
    if (cur === '🧠 PERGUNTAS DE OURO (VENDA' && next === 'EMOCIONAL)') {
      lines.push('🧠 PERGUNTAS DE OURO (VENDA EMOCIONAL)');
      idx++;
      continue;
    }
    if (cur === '⚠️ PONTOS DE ATENÇÃO (ERROS' && next === 'COMUNS)') {
      lines.push('⚠️ PONTOS DE ATENÇÃO (ERROS COMUNS)');
      idx++;
      continue;
    }
    lines.push(rawLines[idx]);
  }

  const secoes = [];
  let currentSec = null;
  let currentBloco = null;
  let currentSuperGroup = '';
  let pendingGroupNote = '';
  const perguntasEstrategicas = [];
  const topicosChecagemTecnica = [];

  const isQuartoFilhosSuperGroup = (t) => {
    return (
      t.startsWith('👶 BLOCO 1') ||
      t.startsWith('BLOCO 2') ||
      t.startsWith('BLOCO 3') ||
      t.startsWith('👕 ARMAZENAMENTO') ||
      t.startsWith('🧠 COMPORTAMENTO') ||
      t.startsWith('👧 ESPECÍFICO')
    );
  };

  const isSecHeader = (line) => {
    // Linhas indentadas com 2 ou mais espaços são itens de listas internas, não cabeçalhos
    if (/^\s{2,}/.test(line)) {
      return false;
    }
    const t = line.trim();
    if (!t) return false;
    if (meta.slug === 'area_gourmet') {
      return gourmetSections.includes(t);
    }
    if (meta.slug === 'quarto_filhos' && isQuartoFilhosSuperGroup(t)) {
      return false;
    }
    if (/^[0-9]+[\.\)]\s+[A-Za-zÀ-ÿ]/.test(t)) {
      return true;
    }
    if (
      t.startsWith('💡') ||
      t.startsWith('🎨') ||
      t.startsWith('🧠') ||
      t.startsWith('⚠️') ||
      t.startsWith('📊')
    ) {
      return true;
    }
    return false;
  };

  const isSpecialQuestion = (t) => {
    const lower = t.toLowerCase();
    return (
      lower.startsWith('pergunta emocional') ||
      lower.startsWith('pergunta estratégica') ||
      lower.startsWith('pergunta estrategica') ||
      lower.startsWith('pergunta-chave') ||
      lower.startsWith('pergunta chave') ||
      lower.startsWith('pergunta prática') ||
      lower.startsWith('pergunta pratica') ||
      lower.startsWith('pergunta essencial') ||
      lower.startsWith('pergunta de experiência') ||
      lower.startsWith('pergunta de experiencia') ||
      lower.startsWith('pergunta de aprofundamento') ||
      lower.startsWith('pergunta profunda') ||
      lower.startsWith('perguntas profundas') ||
      lower.startsWith('perguntas finais de encantamento') ||
      lower.startsWith('perguntas emocionais') ||
      lower.startsWith('pergunta:') ||
      lower.startsWith('perguntar:')
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();
    if (!t) continue;

    if (t.toUpperCase().startsWith('BRIEFING') && i < 3) continue;

    if (meta.slug === 'quarto_filhos' && isQuartoFilhosSuperGroup(t)) {
      currentSuperGroup = t;
      continue;
    }

    if (t === '(Além de tudo acima, aprofundar)') {
      pendingGroupNote = t;
      continue;
    }

    // Início de nova seção
    if (isSecHeader(line)) {
      if (currentSec) secoes.push(currentSec);
      let secTitle = t;
      if (meta.slug === 'quarto_filhos') {
        if (currentSuperGroup && /^[0-9]+[\.\)]/.test(t)) {
          secTitle = `${currentSuperGroup}: ${t}`;
        } else if (
          t.startsWith('💡') ||
          t.startsWith('🎨') ||
          t.startsWith('🧠') ||
          t.startsWith('⚠️') ||
          t.startsWith('📊')
        ) {
          currentSuperGroup = '';
        }
      }

      currentSec = {
        id: meta.slug + '_sec_' + (secoes.length + 1),
        titulo: secTitle,
        perguntasDestaque: [],
        itens: [],
        conteudoLinhas: [],
        blocos: []
      };
      currentBloco = null;

      if (pendingGroupNote) {
        currentBloco = {
          tipo: 'nota',
          texto: pendingGroupNote
        };
        currentSec.blocos.push(currentBloco);
        currentSec.conteudoLinhas.push(pendingGroupNote);
        pendingGroupNote = '';
      }

      const titleLower = secTitle.toLowerCase();
      if (
        titleLower.includes('checklist') ||
        titleLower.includes('crítico') ||
        titleLower.includes('critico') ||
        titleLower.includes('ergonomia') ||
        titleLower.includes('segurança') ||
        titleLower.includes('pontos de atenção') ||
        titleLower.includes('resumo para') ||
        titleLower.includes('fluxo')
      ) {
        topicosChecagemTecnica.push(secTitle);
      }
      continue;
    }

    if (!currentSec) {
      currentSec = {
        id: meta.slug + '_sec_intro',
        titulo: 'Introdução / Diretrizes Gerais',
        perguntasDestaque: [],
        itens: [],
        conteudoLinhas: [],
        blocos: []
      };
      currentBloco = null;
    }

    const currentSecLower = currentSec.titulo.toLowerCase();
    const isInsideQuestionsSection =
      currentSecLower.includes('perguntas emocionais') ||
      currentSecLower.includes('perguntas profundas') ||
      currentSecLower.includes('perguntas de ouro') ||
      currentSecLower.includes('perguntas de aprofundamento') ||
      currentSecLower.includes('perguntas finais');

    // 1. Pergunta com rótulo especial ("Pergunta emocional:", "Pergunta-chave:", etc.)
    if (isSpecialQuestion(t)) {
      const qTipo = getQuestionType(t);
      let qParts = [];
      let nextIdx = i + 1;
      while (nextIdx < lines.length && !lines[nextIdx].trim()) {
        nextIdx++;
      }
      while (nextIdx < lines.length) {
        const candidate = lines[nextIdx].trim();
        if (!candidate || isSecHeader(lines[nextIdx]) || isSpecialQuestion(candidate)) {
          break;
        }
        if (candidate.startsWith('') || candidate.startsWith('o') || candidate.startsWith('-')) {
          break;
        }
        qParts.push(candidate);
        nextIdx++;
        if (candidate.endsWith('?') || candidate.endsWith('”') || candidate.endsWith('"')) {
          break;
        }
      }

      if (qParts.length > 0) {
        i = nextIdx - 1;
      }
      const fullQuestionText = qParts.join(' ').trim() || t;

      const pDestaque = {
        tipo: qTipo,
        rotulo: t,
        pergunta: fullQuestionText,
        secao: currentSec.titulo
      };

      currentSec.perguntasDestaque.push(pDestaque);
      perguntasEstrategicas.push(pDestaque);
      currentSec.conteudoLinhas.push(`[${t}] ${fullQuestionText}`);

      currentBloco = {
        tipo: 'pergunta_destaque',
        rotulo: t,
        texto: fullQuestionText,
        tipoPergunta: qTipo,
        itens: []
      };
      currentSec.blocos.push(currentBloco);
      continue;
    }

    // 2. Linhas de itens com marcadores (, o, -) ou itens numerados indentados
    const isIndentedNumItem = /^\s{2,}[0-9]+[\.\)]\s+/.test(line);
    if (t.startsWith('') || t.startsWith('o') || t.startsWith('-') || isIndentedNumItem) {
      let clean = isIndentedNumItem ? t : t.replace(/^[o\-\s]+/, '').trim();
      
      // Checar se o item continua na próxima linha (quebra de linha sem novo marcador)
      let nextIdx = i + 1;
      while (nextIdx < lines.length && !lines[nextIdx].trim()) {
        nextIdx++;
      }
      if (nextIdx < lines.length) {
        const nextCandidate = lines[nextIdx].trim();
        if (
          nextCandidate &&
          !nextCandidate.startsWith('') &&
          !nextCandidate.startsWith('o') &&
          !nextCandidate.startsWith('-') &&
          !isSecHeader(lines[nextIdx]) &&
          !isSpecialQuestion(nextCandidate) &&
          !nextCandidate.endsWith(':') &&
          (clean.endsWith('como') || clean.endsWith('de') || clean.endsWith('e') || clean.endsWith('ou') || clean.endsWith('para') || !clean.endsWith('?') && clean.length > 30 && nextCandidate.endsWith('?'))
        ) {
          clean += ' ' + nextCandidate;
          i = nextIdx;
        }
      }

      if (clean) {
        currentSec.itens.push(clean);

        // Se estiver num bloco ativo (pergunta destaque ou prompt), anexa aos itens do bloco
        if (currentBloco && (currentBloco.tipo === 'pergunta_destaque' || currentBloco.tipo === 'prompt')) {
          currentBloco.itens.push(clean);
        } else {
          currentBloco = {
            tipo: 'itens',
            itens: [clean]
          };
          currentSec.blocos.push(currentBloco);
        }

        if (isInsideQuestionsSection || (clean.endsWith('?') && clean.length > 15)) {
          const qTipo = isInsideQuestionsSection ? getQuestionType(currentSec.titulo) : 'estrategica';
          const pDestaque = {
            tipo: qTipo,
            rotulo: currentSec.titulo,
            pergunta: clean,
            secao: currentSec.titulo
          };
          perguntasEstrategicas.push(pDestaque);
          currentSec.perguntasDestaque.push(pDestaque);
        }

        const secLower = currentSec.titulo.toLowerCase();
        if (
          secLower.includes('checklist') ||
          secLower.includes('equipamento') ||
          secLower.includes('técnico') ||
          secLower.includes('tecnico') ||
          secLower.includes('pontos de atenção') ||
          secLower.includes('resumo para') ||
          secLower.includes('segurança') ||
          secLower.includes('fluxo')
        ) {
          topicosChecagemTecnica.push(`[${currentSec.titulo}] ${clean}`);
        }
      }
      currentSec.conteudoLinhas.push(t);
      continue;
    }

    // 3. Linhas de prompt, perguntas padrão ou notas (ex.: "Qual o papel do living?", "Importante: ...")
    const isNote = t.toLowerCase().startsWith('importante') || t.toLowerCase().startsWith('atenção');
    const isPrompt = t.endsWith('?') || t.endsWith(':') || t.length < 90;

    if (isNote) {
      currentBloco = {
        tipo: 'nota',
        texto: t
      };
      currentSec.blocos.push(currentBloco);
    } else if (isPrompt) {
      currentBloco = {
        tipo: 'prompt',
        texto: t,
        itens: []
      };
      currentSec.blocos.push(currentBloco);

      if (t.endsWith('?') && t.length > 18) {
        const pDestaque = {
          tipo: 'estrategica',
          rotulo: currentSec.titulo,
          pergunta: t,
          secao: currentSec.titulo
        };
        // Evita duplicatas exatas
        if (!perguntasEstrategicas.some(p => p.pergunta === t)) {
          perguntasEstrategicas.push(pDestaque);
          currentSec.perguntasDestaque.push(pDestaque);
        }
      }
    } else {
      currentBloco = {
        tipo: 'texto',
        texto: t
      };
      currentSec.blocos.push(currentBloco);
    }

    currentSec.conteudoLinhas.push(t);
  }

  if (currentSec) secoes.push(currentSec);

  return {
    slug: meta.slug,
    titulo: meta.titulo,
    subtitulo: meta.subtitulo,
    arquivoPdfOriginal: meta.file,
    secoes,
    perguntasEstrategicas,
    topicosChecagemTecnica,
  };
}

const roteiros = filesMeta.map(parsePdfDoc);

const code = `/**
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

export const LISTA_ROTEIROS: { slug: string; titulo: string; subtitulo: string }[] = ${JSON.stringify(
  filesMeta.map((m) => ({ slug: m.slug, titulo: m.titulo, subtitulo: m.subtitulo })),
  null,
  2
)}

export const ROTEIROS_BRIEFINGS: Record<string, RoteiroAmbiente> = ${JSON.stringify(
  roteiros.reduce((acc, r) => {
    acc[r.slug] = r
    return acc
  }, {}),
  null,
  2
)}

/**
 * Normaliza string para correspondência tolerante a acentos e maiúsculas
 */
export function normalizarNomeAmbiente(nome?: string | null): string {
  return (nome || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
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
  norm = norm.replace(/^outro[:\\-\\s]+/, '').trim()
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
  return linhas.join('\\n')
}
`

fs.writeFileSync(targetFile, code, 'utf8');
console.log('Successfully generated', targetFile, 'File size:', (fs.statSync(targetFile).size / 1024).toFixed(1), 'KB');
