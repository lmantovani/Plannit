# Frontend do Módulo Arquitetos (com integração do Score) — Design

**Data:** 2026-07-11
**Branch:** feature/arch
**Status:** aprovado, aguardando plano de implementação

## Contexto

O backend do score de Arquitetos (spec [2026-07-10-arquitetos-score-backend-design.md](2026-07-10-arquitetos-score-backend-design.md)) já foi implementado, testado (99 testes) e mesclado em `feature/arch`. O frontend, porém, não existe: não há `ArquitetosPage`, não há rota `/arquitetos`, não há item de menu, não há `arquitetosApi` em `lib/api.js`. O CLAUDE.md descreve o módulo como "grid + flags + drawer 3 abas" — isso é aspiracional, não implementado.

Este spec cobre a construção do frontend completo do módulo, incluindo a integração com o endpoint `GET /arquitetos/{id}/score`.

## Decisões de escopo

- **Escopo completo**: página de listagem + CRUD de arquiteto + drawer com 3 abas (Perfil / Score / Decisores & Concorrentes) — não uma versão mínima.
- **Score não aparece no grid**: o backend não tem endpoint de score em lote (`GET /arquitetos/{id}/score` é por arquiteto). Buscar o score de todos os arquitetos listados em paralelo no carregamento da página escalaria mal e não tem valor de negócio comprovado ainda. Decisão: grid mostra só dados cadastrais; segmento/flags/score são carregados sob demanda, apenas quando o usuário abre a aba "Score" do drawer de um arquiteto específico (1 request pontual). Sem mudança no backend.
- **Sem gating de botões por perfil no frontend**: mesmo padrão já usado em `CRMPage.jsx` — todo usuário autenticado vê os botões de criar/editar; o backend retorna 403 para quem não tem permissão (`DIRETORIA`, `GERENTE_COMERCIAL`, `RECEPCAO` para escrita), e o frontend mostra a mensagem de erro retornada. Motivo: consistência com o resto do código existente, sem introduzir um padrão novo de autorização client-side.
- **Sem view Kanban**: arquitetos não são um pipeline com estágios (diferente de Leads/Projetos). É um grid de cards com busca.
- **`ScoreBar` generalizado, não duplicado**: o componente `ScoreBar` existente (`components/ui/index.jsx`) tem uma mensagem fixa de "mínimo: N pontos" específica do briefing. Em vez de criar um componente paralelo, adiciono uma prop opcional `showMinimo` (default `true`, preserva o comportamento atual no Briefing) para reaproveitar no score de Arquitetos sem esse aviso.

## Rotas e navegação

- `App.jsx`: nova rota `<Route path="/arquitetos" element={<ArquitetosPage />} />`, dentro do `ProtectedLayout`. Nova entrada em `ROUTE_TITLES`:
  ```js
  '/arquitetos': { title: 'Arquitetos', subtitle: 'Parceiros e indicações' },
  ```
- `Sidebar.jsx`: novo item na seção "Comercial", entre `/crm` e `/briefing`:
  ```js
  { path: '/arquitetos', label: 'Arquitetos', icon: Compass, perfis: ['*'] },
  ```
  (`Compass` importado de `lucide-react`; `Building2` já está em uso no item de Conferência, evitar repetir ícone.)

## Cliente de API (`lib/api.js`)

Novo objeto `arquitetosApi`, mesmo padrão dos demais (`leadsApi`, `projetosApi`):

```js
export const arquitetosApi = {
  list: (params) => api.get('/arquitetos/', { params }),
  get: (id) => api.get(`/arquitetos/${id}`),
  create: (data) => api.post('/arquitetos/', data),
  update: (id, data) => api.patch(`/arquitetos/${id}`, data),
  desativar: (id) => api.delete(`/arquitetos/${id}`),
  score: (id) => api.get(`/arquitetos/${id}/score`),
  listarDecisores: (id) => api.get(`/arquitetos/${id}/decisores`),
  criarDecisor: (id, data) => api.post(`/arquitetos/${id}/decisores`, data),
  atualizarDecisor: (id, decisorId, data) => api.patch(`/arquitetos/${id}/decisores/${decisorId}`, data),
  removerDecisor: (id, decisorId) => api.delete(`/arquitetos/${id}/decisores/${decisorId}`),
  listarConcorrentes: (id) => api.get(`/arquitetos/${id}/concorrentes`),
  criarConcorrente: (id, data) => api.post(`/arquitetos/${id}/concorrentes`, data),
  atualizarConcorrente: (id, concId, data) => api.patch(`/arquitetos/${id}/concorrentes/${concId}`, data),
  removerConcorrente: (id, concId) => api.delete(`/arquitetos/${id}/concorrentes/${concId}`),
}
```

## Constantes (`lib/constants.js`)

Novos mapas, mesmo padrão de `STATUS_CONFIG` / `STATUS_COLOR_CLASSES`:

```js
export const SEGMENTO_CONFIG = {
  campeao:         { label: 'Campeão',         color: 'primary' },
  parceiro_fiel:   { label: 'Parceiro Fiel',   color: 'green' },
  em_ascensao:     { label: 'Em Ascensão',     color: 'blue' },
  novo_promissor:  { label: 'Novo Promissor',  color: 'purple' },
  ocasional:       { label: 'Ocasional',       color: 'stone' },
  em_risco:        { label: 'Em Risco',        color: 'red' },
  inativo:         { label: 'Inativo',         color: 'stone' },
}

export const FLAG_CONFIG = {
  top_indicador:        { label: 'Top Indicador',          color: 'primary' },
  em_risco_de_perda:    { label: 'Em Risco de Perda',      color: 'red' },
  alto_potencial:       { label: 'Alto Potencial',         color: 'blue' },
  indicacao_alto_valor: { label: 'Indicação de Alto Valor', color: 'green' },
}
```

`STATUS_COLOR_CLASSES` não tem a chave `primary` hoje — será adicionada (`bg-primary-50 text-primary-700 border-primary-200`), já que "Campeão" e "Top Indicador" merecem se destacar com a cor de marca em vez de reaproveitar `amber`.

`nivel_parceria` do `Arquiteto` é uma `String` livre no schema/model (default `"parceiro"`), sem enum no backend. `seed.py` não cria nenhum `Arquiteto` (só um `Lead` com `origem=ARQUITETO`) — não há valores de referência além do default. A UI trata como campo de texto livre (`input`), não `select`, para não inventar um enum de negócio que o backend não define.

## `ArquitetosPage.jsx`

Estrutura de arquivo único, no padrão de `CRMPage.jsx` (componente principal + subcomponentes no mesmo arquivo):

- **Toolbar**: busca por nome/escritório (client-side, mesmo padrão do CRM) + botão "Novo Arquiteto".
- **Grid de cards** (não kanban): `nome`, `escritorio`, `telefone`/`email`, badge de `nivel_parceria`. Clique abre o drawer.
- **Modal "Novo Arquiteto"**: form com `nome*`, `escritorio`, `telefone`, `email`, `nivel_parceria` — mesmo padrão do `NovoLeadModal` (estado local, `arquitetosApi.create`, exibe `err.response?.data?.detail` em caso de erro).
- **Drawer do Arquiteto**: abre ao clicar num card, usa `Tabs` (componente já existente) com 3 abas:
  1. **Perfil** — dados cadastrais + botão "Editar" que reabre o mesmo form do modal, agora em modo edição (`arquitetosApi.update`).
  2. **Score** — carregado sob demanda (`useEffect` disparado só quando essa aba é selecionada pela primeira vez, com flag de "já carregado" para não refazer a chamada a cada troca de aba). Mostra:
     - `score_geral` em destaque (número grande) + badge de segmento (`SEGMENTO_CONFIG`)
     - Flags como badges pequenas lado a lado (`FLAG_CONFIG`)
     - 3× `ScoreBar` (RFV, Potencial, Lealdade) com `showMinimo={false}`
     - Bloco "Risco de concorrência": nível (baixo/médio/alto) + lista dos concorrentes cadastrados com seus percentuais
     - Estado de loading (`Spinner`) e erro tratado
  3. **Decisores & Concorrentes** — duas listas simples:
     - Decisores: nome, cargo, telefone/email, badge "Principal" se `is_principal`; botões editar/remover; form inline ou modal para adicionar novo
     - Concorrentes: nome, percentual estimado, observações; mesmo padrão de adicionar/editar/remover
     - Remoção usa `ConfirmDialog` (componente já existente)

## Reaproveitamento vs. novo

| Componente | Ação |
|---|---|
| `Modal`, `ConfirmDialog`, `Tabs`, `EmptyState`, `LoadingPage`, `Spinner` | Reaproveitados sem alteração |
| `ScoreBar` | Alterado: nova prop `showMinimo` (default `true`) |
| `StatusBadge` | Não reaproveitado para segmento/flag — ele é acoplado a `STATUS_CONFIG` (fluxo operacional de 32 status). Badges de segmento/flag são um componente local pequeno dentro de `ArquitetosPage.jsx`, lendo de `SEGMENTO_CONFIG`/`FLAG_CONFIG` |
| `arquitetosApi`, `SEGMENTO_CONFIG`, `FLAG_CONFIG` | Novos |

## Fora de escopo (explicitamente)

- Filtro/ordenação do grid por segmento ou score (exigiria score em lote — mesma limitação já registrada no spec do backend)
- Qualquer mudança no cálculo de score (`arquiteto_score.py`) ou nos limiares — já implementados e testados
- Página de relatórios/dashboard agregando scores de todos os arquitetos
- Gating de UI por perfil (fora do padrão já estabelecido no projeto)

## Testes

`frontend/package.json` não tem framework de teste configurado (sem Vitest/RTL/Jest). Verificação será manual via a skill `run`/`verify`: subir backend + frontend local, criar um arquiteto novo pela UI, verificar que o score inicial reflete "sem histórico" (segmento `inativo`, pilares zerados), depois criar leads/projetos vinculados a esse arquiteto (via API ou telas já existentes de CRM/Projetos) e confirmar que o score muda de acordo com as regras do spec do backend. Também exercitar CRUD de decisor e concorrente, edição e desativação do arquiteto.

Nota: `seed.py` não cria nenhum `Arquiteto` — a base local não tem dado de exemplo pronto para o módulo. Isso não faz parte do escopo deste spec, mas vale registrar como possível melhoria futura de DX.
