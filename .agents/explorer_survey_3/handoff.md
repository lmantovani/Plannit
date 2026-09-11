# Relatório de Levantamento de Frontend Inertia & UI (R4) — Módulo de Especificadores

## 1. Observation

Durante a análise detalhada do repositório em `/home/porto/codespace/Plannit/plannit` e da referência em `/home/porto/codespace/Plannit/frontend`, foram observados os seguintes fatos, estruturas de código e comandos:

### 1.1. Stack Tecnológica e Scripts de Verificação
- **Stack identificada em `plannit/package.json`**:
  - AdonisJS v7 (`@adonisjs/core: ^7.5.0`, `@adonisjs/inertia: ^5.0.1`, `@adonisjs/lucid: ^22.4.2`).
  - Inertia.js com React 19 (`@inertiajs/react: ^3.7.0`, `react: ^19.2.8`, `react-dom: ^19.2.8`).
  - Lucide React (`lucide-react: ^1.43.0`), Sonner (`sonner: ^2.0.8`), Clsx (`clsx: ^2.1.1`), Tailwind CSS (`tailwindcss: ^3.4.19`).
  - Vite (`vite: ^8.2.2`).
- **Scripts em `plannit/package.json` (linhas 10-18)**:
  ```json
  "scripts": {
    "start": "node bin/server.js",
    "build": "node ace build",
    "dev": "node ace serve --hmr --poll",
    "test": "node ace test",
    "lint": "eslint .",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit && tsc --noEmit --project inertia/tsconfig.json"
  }
  ```
- **Execução do baseline de testes**:
  - `npm run typecheck` (executado via terminal): Código 0 com 0 erros de tipagem.
  - `npm run build` (executado via terminal): Código 0 com compilação Vite em 1.12s gerando 24 assets sem falhas.

### 1.2. Sistema de Design e Estilização
- **`plannit/tailwind.config.js` (linhas 7-40)**:
  - Paleta `primary`: tons warm-gold (`primary-500: #c8841a`, `primary-600: #a66a12`, `primary-300: #ecc060`).
  - Paleta `stone`: neutros minerais (`stone-50: #fafaf9` a `stone-900: #161511`).
  - Tipografia: `font-display: ['"Playfair Display"', 'Georgia', 'serif']`, `font-sans: ['"DM Sans"', 'system-ui', 'sans-serif']`, `font-mono: ['"JetBrains Mono"', 'monospace']`.
  - Sombras e animações: `shadow-card`, `shadow-card-hover`, `animate-fade-in`, `animate-slide-up`.
- **`plannit/inertia/css/app.css` (linhas 33-129)**:
  - Classes componentes padronizadas: `.card`, `.card-hover`, `.badge`, `.badge-novo`, `.badge-ativo`, `.badge-alerta`, `.badge-critico`, `.badge-neutro`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.btn-sm`, `.btn-icon`, `.input`, `.input-error`, `.label`, `.form-group`, `.table-base`, `.kpi-card`.

### 1.3. Sidebar e Navegação Principal
- **`plannit/inertia/layouts/app_layout.tsx` (linhas 100-128)**:
  - Navegação agrupada em `NavGroup[]`:
    - Grupo `'Principal'`: Dashboard (`/dashboard`, ícone `LayoutDashboard`).
    - Grupo `'Comercial'`: CRM / Leads (`/crm`, ícone `Users`), Briefings (`/briefings`, ícone `FileText`), Fila de Projetos (`/fila`, ícone `Layers`).
    - Grupo `'Operacional'`: Conferência (`#`, ícone `Building2`, `disabled: true`), Montagem (`#`, ícone `Hammer`, `disabled: true`).
    - Grupo `'Gestão'`: Colaboradores (`#`, ícone `UserCog`, `disabled: true`).
  - O item "Especificadores" ainda não está presente na sidebar de `app_layout.tsx`. Na versão de referência em `frontend/src/components/layout/Sidebar.jsx` (linha 15), o item utilizava o ícone `Compass` e rota `/especificadores` dentro do grupo `'Comercial'`.
  - Mecanismo de estado ativo (linhas 178 e 211-215):
    `const isActive = item.exact ? url === item.href : url.startsWith(item.href) && item.href !== '#'`
    Gera automaticamente a classe ativa `bg-primary-600/20 text-primary-300 border border-primary-500/30` e ícone `text-primary-400`.
- **`plannit/inertia/pages/dashboard.tsx` (linhas 60-67)**:
  - O card do módulo "Especificadores & Arquitetos" está marcado com `status: 'Planejado'`, `badge: 'Fase 5'`, `href: '#'`, `active: false`.

### 1.4. Resolução de Rotas Inertia e Estrutura de Páginas
- **`plannit/inertia/app.tsx` (linhas 13-21)**:
  - `resolvePageComponent('./pages/${name}.tsx', import.meta.glob('./pages/**/*.tsx'), ...)`
  - Qualquer página criada em `plannit/inertia/pages/especificadores/index.tsx` ou `plannit/inertia/pages/especificadores/show.tsx` é resolvida automaticamente para `inertia.render('especificadores/index', ...)` e `inertia.render('especificadores/show', ...)`.
- **`plannit/start/routes.ts`**:
  - As rotas `/especificadores*` ainda não foram registradas.

### 1.5. Componentes e Padrões da Versão de Referência (`frontend/src/`)
- Em `frontend/src/pages/especificadores/` e `frontend/src/components/especificadores/` encontramos:
  - `EspecificadoresPage.jsx`: Tabela com filtros (busca, tipo, status, consultor), botão de novo especificador e abertura do drawer.
  - `EspecificadoresKpiPanel.jsx`: 5 KPIs (`especificadores_ativos`, `pct_venda_mes`, `pct_venda_ano`, `atendimentos_mes`, `visitas_escritorio_mes`), meta de visitas individual do vendedor e modal de configuração de metas para gestores.
  - `EspecificadorDrawer.jsx`: Drawer retrátil deslizante de 28rem (448px) de largura à direita com abas: Perfil, Score, Decisores & Concorrentes.
  - `EspecificadorTabs.jsx`:
    - `PerfilTab`: dados cadastrais, formulário e lista cronológica de interações, reatribuição de dono de carteira com histórico e soft delete.
    - `ScoreTab`: Score Geral, badge do segmento (7 segmentos), tags das flags (5 flags), 3 ScoreBars (RFV, Potencial, Lealdade), detalhes numéricos e bloco de concorrentes com nível de risco.
    - `ContatosTabContent`: lista de decisores (com badge Decisor Principal) e tabela de concorrentes com taxa de fechamento estimada (%).
    - `EditarEspecificadorModal`: edição rápida de dados cadastrais.
  - `MetasVisitasModal.jsx`: gestão de metas de visitas mensais por vendedor para a diretoria.

---

## 2. Logic Chain

A partir das observações diretas acima, estabelecemos a seguinte cadeia lógica de engenharia de software para o atendimento estrito do requisito R4:

1. **Conformidade com a Arquitetura Inertia.js (Obs 1.1 e 1.4)**:
   - Diferente do React SPA legado que realizava dezenas de chamadas `axios` manuais após a montagem do componente, o padrão Inertia.js no Plannit entrega as propriedades essenciais (`especificadores`, `kpis`, `minhaMeta`, `consultores`, `filtros`) diretamente via SSR/props injetadas pelo controller no primeiro carregamento.
   - Isso elimina telas de "Loading" vazias no carregamento inicial da rota `/especificadores` e garante renderização instantânea com SEO/performance superiores.

2. **Integração Visual na Sidebar e Dashboard (Obs 1.3)**:
   - A navegação em `app_layout.tsx` suporta rotas nativas com verificação de prefixo (`url.startsWith(item.href)`).
   - Adicionar `{ label: 'Especificadores', href: '/especificadores', icon: Compass }` no grupo `'Comercial'` de `app_layout.tsx` posiciona o módulo exatamente no fluxo de trabalho dos vendedores e gestores, com destaque visual em warm-gold (`text-primary-400`, `bg-primary-600/20`).
   - A atualização de `dashboard.tsx` para `status: 'Operacional'` e `active: true` garante consistência visual institucional.

3. **Fidelidade ao Guardrail Analítico do Score (ORIGINAL_REQUEST.md R2/R4)**:
   - O requisito estabelece que o frontend JAMAIS calcula ou recalcula scores, segmentos ou flags localmente.
   - O componente `ScoreTab` deve ser estritamente receptor e consumidor do payload analítico gerado pelo serviço de domínio do backend (`score.scoreGeral`, `score.rfv`, `score.potencial`, `score.lealdade`, `score.segmento`, `score.flags`, `score.concorrencia`).

4. **Preservação de Histórico e Auditoria Imutável — RN017 (ORIGINAL_REQUEST.md R3/R4)**:
   - A interface do Drawer (Aba Perfil) deve prover o fluxo de reatribuição de consultor dono com diálogo/modal dedicado contendo justificativa obrigatória e feedback visual via `toast.success`.
   - O histórico de transferências de donos de carteira deve ser exibido como uma timeline/tabela imutável (consultor anterior, novo consultor, alterado por, timestamp UTC).
   - O botão de exclusão de especificador deve invocar `router.delete('/especificadores/:id')`, disparando o soft delete no backend e removendo o item da listagem ativa com preservação no banco.

5. **Organização Modular dos Componentes TypeScript (Obs 1.1, 1.2 e 1.5)**:
   - Para garantir 0 erros em `npm run typecheck` e `npm run build`, todos os componentes devem ser criados em TypeScript (`.tsx`), com interfaces estritas para `EspecificadorItem`, `KpiData`, `MetaVisita`, `ScoreData`, `InteracaoItem`, `DecisorItem`, `ConcorrenteItem` e `HistoricoDonoItem`.
   - A estrutura ideal é co-locar as páginas principais em `inertia/pages/especificadores/` (`index.tsx` e `show.tsx`) e os componentes modulares na subpasta `inertia/pages/especificadores/components/` ou em `inertia/components/especificadores/`.

---

## 3. Caveats

1. **Aguardando Finalização dos Controllers e Endpoints (Explorer 1 e 2)**:
   - As rotas HTTP e controllers backend (`ArquitetosController`) estão sob mapeamento dos Explorers 1 e 2. O frontend dependerá da correspondência exata dos nomes de campos e métodos de rota (`index`, `show`, `store`, `update`, `destroy`, `reatribuirDono`, `registrarInteracao`, `adicionarDecisor`, `removerDecisor`, `adicionarConcorrente`, `removerConcorrente`, `definirMetaVisitas`).
2. **Nomes de Atributos (camelCase vs snake_case)**:
   - Os models Lucid do AdonisJS utilizam por padrão `camelCase` nas propriedades TypeScript/JSON serializadas (`consultorId`, `statusCarteira`, `isActive`, `scoreGeral`), enquanto o schema SQL usa `snake_case`. As interfaces de props do frontend foram padronizadas considerando a serialização padrão do Adonis Lucid/transformers.
3. **Persistência de Drawer via URL vs Estado Local**:
   - A abertura do Drawer pode ser acionada por estado local (`selectedId: number | null`) ou por query parameter (`/especificadores?id=123`). O suporte a ambos ou ao estado local com opção de navegação para a página dedicada `/especificadores/:id` atende perfeitamente os critérios de aceitação.

---

## 4. Conclusion

A infraestrutura de frontend Inertia.js + React 19 do Plannit está madura, padronizada e plenamente apta a receber o módulo de Especificadores (R4). O design system warm-gold / stone (`tailwind.config.js` e `app.css`) fornece todas as classes de layout, cartões, tabelas e badges necessárias.

Para a implementação completa de R4, são necessários:
1. **Navegação**: Inclusão de "Especificadores" (`Compass`) em `inertia/layouts/app_layout.tsx` e ativação em `inertia/pages/dashboard.tsx`.
2. **Constantes e Tipos**: Expansão de `inertia/lib/constants.ts` com as configurações de tipos, status de carteira, os 7 segmentos, 5 flags e risco de concorrência.
3. **Página Principal**: Criação de `inertia/pages/especificadores/index.tsx` com KPIs superiores, meta individual de visitas, toolbar de filtros, tabela de alta legibilidade e drawer retrátil integrado.
4. **Página de Detalhes Dedicada**: Criação de `inertia/pages/especificadores/show.tsx` para visualização expandida/acesso direto por ID.
5. **Componentes Modulares**:
   - `EspecificadoresKpiPanel.tsx` (KPIs + meta individual).
   - `EspecificadorDrawer.tsx` (Drawer retrátil com 3 abas).
   - `PerfilTab.tsx` (Dados cadastrais, timeline de interações com form rápido, painel de reatribuição RN017 e soft delete).
   - `ScoreTab.tsx` (Score Geral, segmento, flags, barras comparativas RFV/Potencial/Lealdade, métricas detalhadas e concorrência).
   - `DecisoresConcorrentesTab.tsx` (Gestão de decisores com estrela de decisor principal e monitoramento de concorrentes).
   - `NovoEspecificadorModal.tsx` & `EditarEspecificadorModal.tsx`.
   - `MetasVisitasModal.tsx` (Configuração mensal para diretores/gerentes).

---

## 5. Verification Method

Para verificar independentemente a implementação após a aplicação dos códigos pelo agente de implementação:

### 5.1. Comandos de Validação de Build e Tipagem
No diretório `/home/porto/codespace/Plannit/plannit`:
```bash
# 1. Checagem estrita de tipos TypeScript (deve finalizar com código 0)
npm run typecheck

# 2. Empacotamento de produção do Vite e compilação do Adonis (deve finalizar com código 0)
npm run build
```

### 5.2. Verificação de Arquivos e Telas
1. **Layout**: Inspecionar `inertia/layouts/app_layout.tsx` para confirmar a presença do item no menu lateral:
   - Rota: `/especificadores`
   - Ícone: `Compass`
   - Seção: `Comercial`
2. **Páginas**:
   - Confirmar a existência de `inertia/pages/especificadores/index.tsx` e `inertia/pages/especificadores/show.tsx`.
3. **Inspecionar Drawer e Abas**:
   - Verificar se as 3 abas estão presentes:
     - `Perfil`: campos cadastrais, inclusão de contato, painel de reatribuição de dono e desativação lógica.
     - `Score`: nota numérica grande, badge de segmento, badges de flags, barras dos 3 pilares e análise de concorrentes.
     - `Decisores & Concorrentes`: lista de contatos com decisor principal e tabela de concorrência com taxa estimada.
4. **Condição de Invalidação**:
   - Ocorrência de qualquer erro de tipagem no `npm run typecheck`.
   - Falha na compilação do Vite no `npm run build`.
   - Cálculo local de score no frontend (violação do guardrail analítico).
   - Exclusão física em vez de desativação lógica `is_active = false` (violação da RN017).

---

## 6. Plano de Ação para Implementação (em PT-BR)

### Etapa 1: Constantes e Design Tokens
- Atualizar `plannit/inertia/lib/constants.ts` adicionando:
  - `TIPO_ARQUITETO_LABELS` e `TIPO_ARQUITETO_COLORS`.
  - `STATUS_CARTEIRA_CONFIG` (Ativo, Em Prospecção, Inativo).
  - `SEGMENTO_CONFIG` com os 7 segmentos (`campeao`, `parceiro_fiel`, `em_ascensao`, `novo_promissor`, `ocasional`, `em_risco`, `inativo`).
  - `FLAG_CONFIG` com as 5 flags (`top_indicador`, `em_risco_de_perda`, `alto_potencial`, `indicacao_alto_valor`, `especificador_esfriando`).
  - `TIPO_INTERACAO_ARQUITETO_LABELS` (ligação, whatsapp, visita escritório, visita loja, reunião, etc.).
  - `RISCO_CONCORRENCIA_CONFIG` (baixo, médio, alto).

### Etapa 2: Navegação e Layout Principal
- Em `plannit/inertia/layouts/app_layout.tsx`:
  - Importar `Compass` de `lucide-react`.
  - Adicionar o item no grupo `Comercial`: `{ label: 'Especificadores', href: '/especificadores', icon: Compass }`.
- Em `plannit/inertia/pages/dashboard.tsx`:
  - Atualizar card de Especificadores para `status: 'Operacional'`, `active: true` e `href: '/especificadores'`.

### Etapa 3: Componentes de Suporte e Modais
- Criar pasta `plannit/inertia/pages/especificadores/components/` contendo:
  - `ScoreBar.tsx`: Barra de progresso visual estilizada para os pilares RFV, Potencial e Lealdade.
  - `EspecificadoresKpiPanel.tsx`: Painel superior com 5 cards de KPIs, meta individual do vendedor e botão de abertura do modal de metas para diretores/gerentes.
  - `MetasVisitasModal.tsx`: Modal para definição da meta mensal de visitas por vendedor.
  - `NovoEspecificadorModal.tsx`: Formulário modal para cadastro de novo parceiro.
  - `EditarEspecificadorModal.tsx`: Formulário modal para edição de dados cadastrais.
  - `ReatribuirDonoModal.tsx`: Diálogo para transferência de consultor dono com justificativa/auditoria imutável.

### Etapa 4: Abas do Drawer Lateral e Detalhe
- Na mesma pasta `plannit/inertia/pages/especificadores/components/`:
  - `PerfilTab.tsx`: Dados cadastrais, histórico cronológico de interações com formulário rápido para novo contato, painel de transferência de carteira e ação de desativação lógica (soft delete).
  - `ScoreTab.tsx`: Apresentação visual da pontuação geral (0-100), badge do segmento comportamental, chips das flags ativas, comparativo visual das 3 dimensões (RFV, Potencial, Lealdade), detalhes estatísticos e risco de concorrência.
  - `DecisoresConcorrentesTab.tsx`: Cadastro e listagem de decisores com estrela de "Decisor Principal" e tabela de concorrentes monitorados com taxas de fechamento estimadas.
  - `EspecificadorDrawer.tsx`: Componente de gaveta retrátil lateral com as 3 abas integradas, animação slide-in e header com atalho para página inteira.

### Etapa 5: Páginas Inertia
- `plannit/inertia/pages/especificadores/index.tsx`:
  - Envolvida em `<AppLayout title="Especificadores & Arquitetos" ...>`.
  - Integração do painel de KPIs, barra de ferramentas com pesquisa textual e filtros combinados (tipo, status de carteira, consultor), tabela com badges coloridos e integração com o drawer lateral e modais.
- `plannit/inertia/pages/especificadores/show.tsx`:
  - Visualização dedicada em tela cheia com navegação direta por URL (`/especificadores/:id`), reutilizando os componentes das abas.

### Etapa 6: Validação de Tipagem e Build
- Executar `npm run typecheck` para garantir zero erros de tipagem.
- Executar `npm run build` para garantir que o empacotamento Vite ocorra perfeitamente.
- Executar os testes automatizados de integração HTTP (`scripts/test_http_arquitetos.js`).
