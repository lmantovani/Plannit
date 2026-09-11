# BRIEFING — 2026-09-10T14:15:00Z

## Mission
Implementar Milestone M4 (Interface Visual Inertia.js + React 19) do módulo de Especificadores do Plannit com zero erros de typecheck e build Vite limpo.

## 🔒 My Identity
- Archetype: implementer / qa / specialist
- Roles: implementer, qa, specialist
- Working directory: /home/porto/codespace/Plannit/.agents/worker_frontend_m4
- Original parent: 5b1044fb-e626-4f06-8410-4c1942f783ce
- Milestone: M4 - Frontend Inertia.js + React 19 para Especificadores

## 🔒 Key Constraints
- DO NOT CHEAT: Nenhuma implementação simulada ou valores hardcoded.
- Manter o cálculo de score ESTRITAMENTE no backend (o frontend apenas consome e exibe).
- Seguir o Design System existente: Warm-gold (primary), Stone, Playfair Display e DM Sans.
- Escrita restrita a:
  - plannit/inertia/layouts/app_layout.tsx
  - plannit/inertia/pages/dashboard.tsx
  - plannit/inertia/lib/constants.ts
  - plannit/inertia/pages/especificadores/index.tsx
  - plannit/inertia/pages/especificadores/show.tsx
  - plannit/inertia/pages/especificadores/components/*
  - .agents/worker_frontend_m4/*
- 0 erros de tipagem TypeScript (`npm run typecheck`).
- `npm run build` deve compilar perfeitamente.
- Todos os planos em pt-br.

## Current Parent
- Conversation ID: 5b1044fb-e626-4f06-8410-4c1942f783ce
- Updated: 2026-09-10T14:15:00Z

## Task Summary
- **What to build**: Módulo visual completo de Especificadores (arquitetos/designers) no frontend com Inertia.js v2 e React 19: KPI Panel, Drawer com 3 abas (Perfil, Score, Decisores & Concorrentes), página index e página show dedicada, modais de novo cadastro, edição, reatribuição e metas de visitas.
- **Success criteria**: Componentes integrados e funcionais, zero erros no typecheck e no build Vite, conformidade total com os contratos do backend e UX rica.
- **Interface contracts**: `/home/porto/codespace/Plannit/.agents/worker_backend_m1_m3/handoff.md`
- **Code layout**: `plannit/inertia/`

## Key Decisions Made
- `constants.ts`: adicionadas definições completas para os 7 segmentos comportamentais, 5 flags ativas, 6 tipos de especificador, 3 status de carteira, 9 tipos de interação e 3 níveis de risco de concorrência.
- Score consumido 100% de forma reativa e analítica do backend (`score.scoreGeral`, `score.rfv`, `score.potencial`, `score.lealdade`, `score.segmento`, `score.flags`), com exibição de breakdown detalhado e concorrência sem nenhum cálculo local.
- Auditoria de Dono imutável (RN017): modal e exibição com justificativa obrigatória enviando `PATCH /especificadores/:id/dono` e soft delete estrito via `DELETE /especificadores/:id`.
- Tipos unificados e isolados em `inertia/pages/especificadores/types.ts` para conformidade estrita com o compilador TypeScript.

## Artifact Index
- DISPATCH.md — assignment do orchestrator
- BRIEFING.md — memória operacional
- progress.md — liveness heartbeat
- plano_de_acao.md — plano detalhado em PT-BR
- handoff.md — relatório final 5-componentes

## Change Tracker
- **Files modified**:
  - `plannit/inertia/layouts/app_layout.tsx`: inclusão de Especificadores (`Compass`) em Comercial.
  - `plannit/inertia/pages/dashboard.tsx`: ativação do card de Especificadores (Operacional, active: true).
  - `plannit/inertia/lib/constants.ts`: inclusão de tokens visuais e enums de especificadores.
  - `plannit/inertia/pages/especificadores/types.ts`: arquivo de tipagem do módulo.
  - `plannit/inertia/pages/especificadores/components/ScoreBar.tsx`: barra visual de pontuação com gradientes.
  - `plannit/inertia/pages/especificadores/components/MetasVisitasModal.tsx`: modal de metas mensais.
  - `plannit/inertia/pages/especificadores/components/NovoEspecificadorModal.tsx`: modal de criação.
  - `plannit/inertia/pages/especificadores/components/EditarEspecificadorModal.tsx`: modal de edição.
  - `plannit/inertia/pages/especificadores/components/ReatribuirDonoModal.tsx`: diálogo RN017 de reatribuição.
  - `plannit/inertia/pages/especificadores/components/PerfilTab.tsx`: aba perfil com contatos e histórico.
  - `plannit/inertia/pages/especificadores/components/ScoreTab.tsx`: aba de score analítico e concorrentes.
  - `plannit/inertia/pages/especificadores/components/DecisoresConcorrentesTab.tsx`: gestão de decisores e concorrência.
  - `plannit/inertia/pages/especificadores/components/EspecificadoresKpiPanel.tsx`: 5 KPIs e meta individual.
  - `plannit/inertia/pages/especificadores/components/EspecificadorDrawer.tsx`: drawer retrátil 3 abas.
  - `plannit/inertia/pages/especificadores/index.tsx`: página principal do módulo.
  - `plannit/inertia/pages/especificadores/show.tsx`: página dedicada em tela cheia.
- **Build status**: Pass (0 erros no typecheck e build Vite limpo)
- **Pending issues**: Nenhum

## Quality Status
- **Build/test result**: Pass (`npm run typecheck` código 0; `npm run build` código 0; 97 asserções do motor de score aprovadas; 52 asserções HTTP E2E aprovadas).
- **Lint status**: 0 violações
- **Tests added/modified**: Suíte existente validada sem regressão

## Loaded Skills
- Nenhuma skill externa necessária
