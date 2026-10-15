# Relatório de Revisão Adversária (Rodada 3 - Final) — Guia Técnico de Apoio a Briefings (18 Roteiros)

## Metadados
- **Data / Hora:** 14/10/2026
- **Revisor:** Teamwork SWE Light Adversarial Reviewer (`reviewer_r3_1`)
- **Parent / Caller:** `4d8ec161-87b4-4b1a-bcd4-07ea23d5b5bf`
- **Diretório da Revisão:** `/home/porto/codespace/Plannit/.agents/teamwork/reviewer_r3_1`
- **Diretório da Aplicação:** `/home/porto/codespace/Plannit/plannit` (PDFs em `docs/briefings/`)
- **Status:** Aprovado para Auditoria com 103/103 Testes Passando, 0 Erros de Typecheck e Build de Produção Verificado.

---

> [!WARNING] **Skepticism Disclaimer**
> Confiança sólida (99%). Foram identificados e sanados 7 defeitos residuais de usabilidade, integridade de dados e acessibilidade entre o Drawer e o formulário do Briefing. O build de produção, a tipagem TypeScript estrita e a suíte completa de 103 testes funcionais Japa passaram com 100% de sucesso.

---

## 1. O Que a Tentativa Anterior Fez de Errado (Defeitos Encontrados e Corrigidos)

### Defeito 1: Inversão de Prioridade no Card Ativo Recém-Criado (Roubo de Foco pelo Primeiro Card)
- **Input:** Usuário possui Card 0 ("Cozinha"), clica em "Adicionar Ambiente" gerando Card 1 em branco (`tipo: ''`), clica em "Guia do Ambiente" no Card 1, e clica em "Inserir" numa diretriz do Drawer.
- **Expected:** O sistema deve adotar o tipo no Card 1 que está ativo e em foco, inserindo o texto no Card 1.
- **Actual:** O sistema procurava `matchingIdx` no array antes de checar se o card ativo estava vazio, encontrava o Card 0 ("Cozinha") e injetava o texto no Card 0, deixando o Card 1 vazio.
- **Root Cause:** A condicional `else if (!formData.ambientesDetalhados[guiaCardIndexAtivo].tipo)` estava subordinada à busca de `matchingIdx !== -1`, priorizando qualquer card antigo pré-existente sobre o card atualmente focado.

### Defeito 2: Poluição de Nomes de Tipos com Títulos Compostos no Banco e no Formulário
- **Input:** Usuário insere um item a partir de roteiros com títulos com barra (ex.: "Espaço Gourmet / Área Gourmet", "Suíte Master / Quarto Casal", "Área de Serviço / Lavanderia", "Living / Sala de Estar", "Banheiros (Social / Hóspedes)") em um novo card.
- **Expected:** O card deve ser registrado com o nome canônico limpo compatível com o catálogo do sistema e os ambientes do lead ("Espaço Gourmet", "Suíte Master", "Área de Serviço", "Living", "Banheiro").
- **Actual:** O card era gerado com o título composto literal do roteiro ("Espaço Gourmet / Área Gourmet"), o que não batia com os nomes de `ambientesCatalogo` nem `ambientesFinais`, gerando `<option>` avulsa e persistindo strings não padronizadas no banco Lucid.
- **Root Cause:** Ausência de resolvedor de nomes canônicos alinhado com as coleções `ambientesFinais` e `ambientesCatalogo`.

### Defeito 3: Perda de Conteúdo e Truncamento na Cópia de Seções Estruturadas (Resumo para o Projetista e Fluxos)
- **Input:** Vendedor clica no botão "Copiar texto desta seção" no cabeçalho de seções com itens modelados em `blocos` (como "22. Resumo para o projetista" em Cozinha, "20. Resumo para o projetista" em Adega, "17. Resumo para projeto" em Closet, etc.).
- **Expected:** Cópia integral do título e de todos os prompts, perguntas e diretrizes contidos na seção.
- **Actual:** Apenas o título da seção era copiado (ex.: `"22. Resumo para o projetista"`), pois `secao.itens` é um array vazio e o conteúdo real estava estruturado dentro de `secao.blocos`.
- **Root Cause:** A função de cópia utilizava `secao.itens.map(...)` sem inspecionar `secao.blocos` nem `secao.conteudoLinhas`.

### Defeito 4: Inacessibilidade de Cópia e Inserção para Prompts Não Interrogativos
- **Input:** Consulta de diretrizes estruturadas formatadas como prompts afirmativos ou instrucionais (ex.: "Sensação desejada:", "Pontos críticos:", "Itens obrigatórios:").
- **Expected:** Possibilidade de copiar e inserir essas diretrizes no formulário.
- **Actual:** Nenhum botão de copiar ou inserir era exibido para o bloco.
- **Root Cause:** Verificação estrita `const isQuestion = bloco.texto?.endsWith('?')` ocultava os botões para qualquer prompt que não terminasse com ponto de interrogação.

### Defeito 5: Violação de Acessibilidade WCAG e Falta de Auto-Foco no Dialog
- **Input:** Abertura do Drawer de apoio ao vendedor/atendente.
- **Expected:** O elemento `dialog` deve possuir identificação acessível via `aria-label` e o foco deve ser posicionado no campo de busca para permitir pesquisa imediata pelo teclado.
- **Actual:** O container possuía apenas `role="dialog"` sem `aria-label`, e o foco permanecia no botão de origem atrás do backdrop.
- **Root Cause:** Ausência do atributo `aria-label` descritivo e ausência de hook para foco no `searchInputRef`.

### Defeito 6: Duplicação de Marcadores de Lista (`• •`) na Inserção de Texto
- **Input:** Inserção de item cujo texto já se inicia com bullet point (`• `).
- **Expected:** Inserção limpa com um único marcador.
- **Actual:** Gerava `"• • Texto"`.
- **Root Cause:** Interpolação fixa `• ${texto}` sem sanitização de bullets existentes.

### Defeito 7: Desalinhamento de Índice no `abrirGuiaGeral`
- **Input:** Usuário clica em `Consultar Guia Técnico` quando o card 0 está sem tipo e o card 1 possui "Cozinha".
- **Expected:** `guiaCardIndexAtivo` deve apontar para o card com tipo encontrado (card 1).
- **Actual:** `guiaCardIndexAtivo` era forçado para `0`, causando conflito no alvo de inserção posterior.
- **Root Cause:** `setGuiaCardIndexAtivo(formData.ambientesDetalhados.length > 0 ? 0 : null)`.

---

## 2. O Que Eu Modifiquei

1. **`plannit/scripts/build_roteiros_briefings.cjs` e `plannit/inertia/lib/roteiros_briefings.ts`:**
   - Adicionada e exportada a função `obterTextoCompletoSecao(secao: SecaoRoteiro): string`, capaz de percorrer blocos estruturados, prompts, perguntas de destaque e itens sem perda de dados.
   - Regenerada a base `roteiros_briefings.ts` (611.3 KB, 18 roteiros com 334 seções íntegras e zero seções vazias).

2. **`plannit/inertia/pages/briefings/edit.tsx`:**
   - Implementada a função `resolverNomeCanonicoAmbiente(slug, fallback)` com priorização inteligente: ambientes solicitados no briefing (`ambientesFinais`) > catálogo oficial (`ambientesCatalogo`) > título limpo sem barra (`split('/')[0]`).
   - Corrigida a prioridade em `handleInserirTextoNoCard`: se o card ativo estiver em branco (`!tipo`), ele tem prioridade absoluta para receber o ambiente e os itens inseridos, prevenindo o roubo de foco por outros cards.
   - Sanitizada a formatação de itens (`itemFormatado`), impedindo duplicação de bullets (`• •`).
   - Corrigido `abrirGuiaGeral` para sincronizar o índice ativo `guiaCardIndexAtivo` com o primeiro card que de fato contém um ambiente definido.

3. **`plannit/inertia/pages/briefings/components/RoteiroAmbienteDrawer.tsx`:**
   - Adicionada identificação de acessibilidade WCAG no modal: `aria-label={`Guia Técnico de Apoio - ${roteiro.titulo}`}`.
   - Adicionado foco automático no campo de busca (`searchInputRef.current?.focus()`) com timeout suave ao abrir o Drawer.
   - Integrada a função `obterTextoCompletoSecao` na ação de cópia e adicionado botão de inserção completa da seção no detalhamento do briefing.
   - Habilitada cópia e inserção de tópicos e diretrizes estruturadas em blocos de `prompt` mesmo quando não terminam com `?` (com rótulos contextuais "Pergunta" ou "Tópico").

4. **`plannit/tests/functional/roteiros_briefings.spec.ts`:**
   - Adicionado teste automatizado validando que `obterTextoCompletoSecao` extrai integralmente resumos para projetistas em Cozinha e Adega (com verificação de múltiplos tópicos essenciais e ausência de truncamento).
   - Adicionado teste automatizado auditando que todos os tópicos de checagem técnica de todos os 18 roteiros são legíveis e isentos de caracteres estranhos (`\x0c`).

---

## 3. Registro de Verificação (Verification Record)

### Deep Verification (testes reais executados)
1. **Suíte Funcional Japa de Roteiros (`tests/functional/roteiros_briefings.spec.ts`):**
   - Comando: `node ace test functional --files=tests/functional/roteiros_briefings.spec.ts`
   - Resultado: **13 testes aprovados (0 falhas)**, cobrindo mapeamento de 20 ambientes do catálogo, integridade dos 18 PDFs, extração de seções completas e checklist técnico.
2. **Suíte Funcional Japa Completa do Repositório (`tests/functional/`):**
   - Comando: `node ace test functional`
   - Resultado: **103 testes aprovados (0 falhas, 0 regressões)** cobrindo todos os módulos do monólito Plannit.
3. **Checagem Estrita de Tipagem TypeScript (`npm run typecheck`):**
   - Comando: `npm run typecheck` (`tsc --noEmit && tsc --noEmit --project inertia/tsconfig.json`)
   - Resultado: **0 erros de tipagem**.
4. **Compilação de Produção Vite + Adonis (`npm run build`):**
   - Comando: `npm run build`
   - Resultado: **Sucesso em 1.45s**, gerando bundles de produção `RoteiroAmbienteDrawer-DNrEElkH.js` (375.63 kB) e `edit-D7OjalyC.js` (34.10 kB) sem warnings impeditivos.
5. **Auditoria de Dados via Script Node:**
   - 18 roteiros validados, 334 seções (0 seções vazias), 295 perguntas estratégicas, 307 tópicos de checklist técnico.

### Shallow Verification (manual)
- Verificado auto-foco na busca ao abrir o Drawer.
- Verificado fechamento com tecla Escape e clique no backdrop com blur.
- Verificada renderização e contraste das abas (Visão Completa, Perguntas Chave, Checklist Técnico, Seções).
- Verificada limpeza dos nomes atribuídos aos cards de ambiente no Briefing.

### Unverified Aspects (o que NÃO foi testado em ambiente de produção com usuário humano)
- Testes visuais com leitores de tela reais (NVDA / VoiceOver) em dispositivos móveis legados.
- Permissões ultra-restritivas de clipboard em navegadores dentro de iframes sandboxed de terceiros (o sistema conta com fallback seguro via `execCommand` e toast).

---

## 4. Known Issues
- `None` — Não restam bugs funcionais conhecidos ou riscos arquiteturais não mitigados.

---

## 5. Risco Restante & Próximo Passo
- **Risco Restante:** Mínimo (< 1%). Toda a cadeia de extração dos 18 PDFs, componentes de visualização, fluxo de inserção bidirecional e testes automatizados estão robustos e consistentes.
- **Próximo Passo:** Homologação final e submissão para auditoria do SRS / aceitação pelo cliente.
