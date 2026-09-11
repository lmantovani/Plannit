## 2026-09-10T14:00:04Z

Você é o Worker Frontend responsável pela implementação da Milestone M4 (Interface Visual Inertia.js + React 19) do módulo de Especificadores do Plannit.
Sua pasta de trabalho exclusiva de metadados é: /home/porto/codespace/Plannit/.agents/worker_frontend_m4
Diretório do projeto: /home/porto/codespace/Plannit/plannit

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Arquivos de entrada obrigatórios (leia atentamente antes de codificar):
- /home/porto/codespace/Plannit/.agents/ORIGINAL_REQUEST.md (Requisito R4 e Acceptance Criteria)
- /home/porto/codespace/Plannit/PROJECT.md
- /home/porto/codespace/Plannit/.agents/explorer_survey_3/handoff.md (Guia completo de UI, componentes, layouts e design system)
- /home/porto/codespace/Plannit/.agents/worker_backend_m1_m3/handoff.md (Contratos de dados e rotas entregues pelo backend)

Arquivos sob sua posse exclusiva de escrita:
- plannit/inertia/layouts/app_layout.tsx
- plannit/inertia/pages/dashboard.tsx
- plannit/inertia/lib/constants.ts
- plannit/inertia/pages/especificadores/index.tsx
- plannit/inertia/pages/especificadores/show.tsx
- plannit/inertia/pages/especificadores/components/*

Instruções detalhadas de implementação:
1. Navegação e Constantes:
   - Em `inertia/layouts/app_layout.tsx`: importar ícone `Compass` de `lucide-react` e adicionar no grupo Comercial: `{ label: 'Especificadores', href: '/especificadores', icon: Compass }`.
   - Em `inertia/pages/dashboard.tsx`: atualizar o card de Especificadores para `status: 'Operacional'`, `active: true` e `href: '/especificadores'`.
   - Em `inertia/lib/constants.ts`: adicionar enums, labels e paletas para tipos de especificador, status de carteira, os 7 segmentos comportamentais, as 5 flags, tipos de interação e níveis de concorrência.
2. Componentes em `inertia/pages/especificadores/components/`:
   - `ScoreBar.tsx`: barra visual de progresso para RFV, Potencial e Lealdade com gradientes e rótulos numéricos.
   - `EspecificadoresKpiPanel.tsx`: painel superior com 5 cards de KPIs de carteira, barra de meta individual de visitas do vendedor e botão para abrir modal de metas gerenciais.
   - `MetasVisitasModal.tsx`: modal para configuração de metas de visitas mensais por consultor.
   - `NovoEspecificadorModal.tsx`: formulário modal para cadastrar novo especificador com campos de nome, escritório, telefone, email, nível de parceria, tipo, consultor dono e status.
   - `EditarEspecificadorModal.tsx`: modal de edição cadastral.
   - `ReatribuirDonoModal.tsx`: diálogo com seleção de novo consultor e justificativa obrigatória, registrando histórico de auditoria imutável (RN017).
   - `PerfilTab.tsx`: dados cadastrais, timeline de interações com formulário rápido para novo contato, painel de reatribuição de dono e soft delete (`router.delete('/especificadores/:id')`).
   - `ScoreTab.tsx`: exibição da nota do Score Geral (0-100), badge do segmento (7 segmentos), tags das flags ativas (5 flags), barras comparativas dos 3 pilares, breakdown detalhado e risco de concorrência. IMPORTANTE: o frontend NUNCA calcula nem recalcula o score, apenas exibe os dados fornecidos pelo backend.
   - `DecisoresConcorrentesTab.tsx`: lista de contatos do escritório com identificação do decisor principal (com criação/exclusão) e tabela de concorrência com taxas de fechamento estimadas.
   - `EspecificadorDrawer.tsx`: drawer lateral retrátil com as 3 abas integradas, animação suave e botão para abrir a página dedicada `/especificadores/:id`.
3. Páginas Principais:
   - `inertia/pages/especificadores/index.tsx`: página principal envolta em `<AppLayout>`, com KPIs superiores, toolbar com busca textual e filtros combinados (tipo, status de carteira, consultor), tabela elegante com badges coloridos e ações, e integração com o drawer lateral e modais.
   - `inertia/pages/especificadores/show.tsx`: página dedicada em tela cheia para `/especificadores/:id` reutilizando os componentes das abas.
4. Validação e Compilação:
   - Execute `npm run typecheck` e garanta 0 erros de tipagem TypeScript.
   - Execute `npm run build` e garanta compilação Vite com sucesso.
5. Escreva seu relatório em `/home/porto/codespace/Plannit/.agents/worker_frontend_m4/handoff.md` e envie uma mensagem final ao pai (parent) informando a conclusão.
