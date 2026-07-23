# Especificadores (Arquitetos) — Instruções para o Claude do Frontend

> Este documento é autocontido: você (Claude trabalhando no frontend) não tem acesso à conversa
> que o gerou. Leia tudo antes de começar.

## Contexto

O módulo `Arquiteto` já existe **só no backend** hoje (model `Arquiteto` em
`backend/app/models/crm.py`, endpoints em `backend/app/api/v1/endpoints/arquitetos.py`) com CRUD
simples: `nome`, `escritorio`, `telefone`, `email`, `nivel_parceria`, `is_active`. **Não existe
nenhuma tela, rota, nem client de API para isso no frontend hoje** — apesar de documentação
antiga (CLAUDE.md/memória) sugerir o contrário, isso foi confirmado por inspeção direta do
código: não há `arquitetosApi` em `frontend/src/lib/api.js`, não há rota `/especificadores` nem
`/arquitetos` em `App.jsx`, e não há item correspondente no `Sidebar.jsx`. Este trabalho parte do
zero no frontend.

Foi aprovado um spec de design (`docs/superpowers/specs/2026-07-14-arquitetos-especificador-ui-design.md`)
e um plano de implementação completo (`docs/superpowers/plans/2026-07-14-especificadores-arquitetos-ui.md`).
Este documento extrai e consolida **apenas a parte de frontend** desse plano (as Tasks 10-13
originais), já verificada contra o estado real do código.

**Decisão de nomenclatura, importante:** a interface deve mostrar "Especificador(es)" para o
usuário (sidebar, título de página, rota `/especificadores`), mas **todo nome interno continua
`Arquiteto`** — variável `arquitetosApi`, pasta de páginas pode se chamar `especificadores/` (é
o nome de rota/exibição), mas não renomeie o client de API nem invente nomes tipo
`especificadoresApi`. Não crie nada que sugira que o model virou `Especificador` no backend.

## ⚠️ Dependência do backend — leia antes de testar

O plano original tem 9 tasks de backend (Tasks 1-9) que **ainda não foram implementadas**:
- Campos novos em `Arquiteto`: `tipo` (enum obrigatório), `endereco_escritorio`, `vendedor_id`.
- Campo novo em `Cliente`: `arquiteto_id`.
- Models novos: `InteracaoArquiteto`, `FuncionarioArquiteto`.
- Endpoints novos: `GET /arquitetos/{id}/clientes`, `GET/POST /arquitetos/{id}/interacoes`,
  `GET/POST/PATCH/DELETE /arquitetos/{id}/funcionarios/...`.

Ou seja: **você pode e deve escrever todo o código do frontend agora**, seguindo o contrato de
API abaixo — mas não vai conseguir testar ponta-a-ponta (Task de verificação no final) até o
backend implementar essas mudanças. Se for rodar o backend local para testes manuais, saiba que
na revisão mais recente havia um `app/main.py` com um `)` faltando (arquivo não commitado,
quebrando a sintaxe) — se o backend não subir, isso é bem provavelmente a causa; não é um bug
seu.

Se o backend ainda não tiver os campos/endpoints prontos quando você for testar manualmente, use
o Swagger (`/docs`) para confirmar o que já existe e ajuste expectativas — não precisa mockar
nada permanentemente no código, só é esperado que a verificação end-to-end fique bloqueada até lá.

## Escopo desta entrega (frontend)

1. `arquitetosApi` em `lib/api.js` + labels em `lib/constants.js`.
2. Página de lista `/especificadores` (tabela, filtros, criação).
3. Drawer lateral com 3 abas: Perfil, Score, Decisores.
4. Página completa `/especificadores/:id` (mesmo conteúdo do drawer, layout cheio).
5. Registro de rota + item de sidebar.

**Fora de escopo (não implementar):**
- Cálculo real de RFV/score — a aba Score é só um estado vazio explicativo.
- Tela de cadastro/edição de Cliente — o nome do cliente vinculado aparece como texto
  não-clicável (não existe tela de Cliente no frontend ainda).
- Tornar os tipos de interação configuráveis.
- Qualquer rename de `Arquiteto` para `Especificador` a nível de model/tabela/endpoint (isso é
  backend, e está fora de escopo mesmo lá).

## Contrato de API (backend, quando pronto)

```
GET    /arquitetos/                     → lista completa, cada item incluindo:
                                           nome, tipo, escritorio, endereco_escritorio,
                                           telefone, email, nivel_parceria,
                                           vendedor_id, vendedor_nome
GET    /arquitetos/{id}                 → mesmo shape acima, um registro
POST   /arquitetos/                     → cria (tipo é obrigatório no payload)
PATCH  /arquitetos/{id}                 → atualiza (vendedor_id só é aceito se o usuário logado
                                           for Diretoria/Gerente — senão o backend retorna 403)
DELETE /arquitetos/{id}                 → (sem mudança, não usado nesta entrega)

GET    /arquitetos/{id}/clientes        → [{ id, nome, ... }] — clientes com arquiteto_id = este

GET    /arquitetos/{id}/interacoes      → [{ id, arquiteto_id, autor_id, autor_nome, tipo,
                                             observacao, criado_em }]
POST   /arquitetos/{id}/interacoes      → cria (payload: { tipo, observacao })

GET    /arquitetos/{id}/funcionarios    → [{ id, arquiteto_id, nome, funcao, telefone, email,
                                             observacoes, decisor }]
POST   /arquitetos/{id}/funcionarios    → cria
PATCH  /arquitetos/{id}/funcionarios/{funcionarioId}  → atualiza (usado inclusive só para
                                                          togglar `decisor`)
DELETE /arquitetos/{id}/funcionarios/{funcionarioId}  → remove (delete real, sem histórico —
                                                          `FuncionarioArquiteto` não segue a
                                                          regra RN017 de Projetos)
```

**Enum `tipo` do Arquiteto:** `arquiteto`, `engenheiro`, `designer`, `corretor`, `outro`.

**Enum `tipo` de `InteracaoArquiteto`:** `visita_escritorio`, `ligacao`, `visita_loja`,
`evento`, `viagem`, `envio_brinde`.

## Permissões — resumo (para condicionar UI)

| Ação | Diretoria/Gerente/Recepção | Vendedor vinculado ao especificador | Outro vendedor/perfil |
|---|---|---|---|
| Ver lista/perfil/score/decisores | Sim | Sim | Sim (somente leitura) |
| Criar especificador | Sim (Recepção também) | — | Não |
| Editar dados principais | Sim | Não | Não |
| Definir/trocar vendedor vinculado | Sim (só Diretoria/Gerente) | Não | Não |
| Registrar interação | Sim | Sim (só se for o vinculado) | Não |
| Adicionar/editar/remover funcionário | Sim | Sim (só se for o vinculado) | Não |

Use `podeVerTudo(user?.perfil)` (já existe em `store/index.js`, retorna `true` para
`diretoria`/`gerente_comercial`) e uma checagem `user?.perfil === 'vendedor' && arquiteto.vendedor_id === user?.id`
para "vendedor vinculado". `recepcao` sempre tem permissão de gerenciar (mesmo nível que
Diretoria/Gerente para essas ações específicas).

## Estado atual confirmado do código (não precisa reconferir)

Estes exports já existem e podem ser usados como estão:
- `components/ui/index.jsx`: `StatusBadge`, `Spinner`, `LoadingPage`, `EmptyState`, `Modal`,
  `ConfirmDialog`, `Card`, `KpiCard`, `AlertBanner`, `Tabs`, `ScoreBar`.
- `lib/constants.js`: `STATUS_CONFIG`, `STATUS_COLOR_CLASSES`, `getStatusBadge`, `FUNIL_ETAPAS`,
  `ORIGEM_LABELS`, `formatCurrency`, `formatDate`, `formatDatetime`, `timeAgo`.
- `store/index.js`: `useAuthStore`, `useUIStore`, `PERFIL_LABELS`, `podeVerTudo`, `ehVendedor`,
  `ehProjetista`, `ehConferente`.
- `lib/api.js`: já tem `api`, `authApi`, `leadsApi`, `briefingsApi`, `dashboardApi`,
  `projetosApi`, `usersApi` — **não** tem `arquitetosApi` nem `clientesApi` ainda.
- `App.jsx`: já tem `ROUTE_TITLES` (objeto path → `{title, subtitle}`) e uma função
  `ProtectedLayout()` que hoje faz `ROUTE_TITLES[path] || fallback` — precisa virar um `if`
  especial para a rota dinâmica `/especificadores/:id` (ver Task 4 abaixo).
- `Sidebar.jsx`: array `NAV` com objetos `{ path, label, icon, perfis }`; ícone `Building2` já
  importado de `lucide-react`, `Compass` ainda não.

## Tasks a executar

### Task 1 — `arquitetosApi` e labels

**Arquivos:** modificar `frontend/src/lib/api.js` e `frontend/src/lib/constants.js`.

Adicionar ao final de `lib/api.js`:

```javascript
export const arquitetosApi = {
  list: (params) => api.get('/arquitetos/', { params }),
  get: (id) => api.get(`/arquitetos/${id}`),
  create: (data) => api.post('/arquitetos/', data),
  update: (id, data) => api.patch(`/arquitetos/${id}`, data),
  listarClientes: (id) => api.get(`/arquitetos/${id}/clientes`),
  listarInteracoes: (id) => api.get(`/arquitetos/${id}/interacoes`),
  registrarInteracao: (id, data) => api.post(`/arquitetos/${id}/interacoes`, data),
  listarFuncionarios: (id) => api.get(`/arquitetos/${id}/funcionarios`),
  criarFuncionario: (id, data) => api.post(`/arquitetos/${id}/funcionarios`, data),
  atualizarFuncionario: (id, funcionarioId, data) =>
    api.patch(`/arquitetos/${id}/funcionarios/${funcionarioId}`, data),
  removerFuncionario: (id, funcionarioId) =>
    api.delete(`/arquitetos/${id}/funcionarios/${funcionarioId}`),
}
```

Adicionar ao final de `lib/constants.js`:

```javascript
export const TIPO_ARQUITETO_LABELS = {
  arquiteto:  'Arquiteto',
  engenheiro: 'Engenheiro',
  designer:   'Designer',
  corretor:   'Corretor',
  outro:      'Outro',
}

export const TIPO_ARQUITETO_COLORS = {
  arquiteto:  'blue',
  engenheiro: 'purple',
  designer:   'amber',
  corretor:   'green',
  outro:      'stone',
}

export const TIPO_INTERACAO_ARQUITETO_LABELS = {
  visita_escritorio: 'Visita ao escritório',
  ligacao:            'Ligação',
  visita_loja:        'Visita à loja',
  evento:              'Evento',
  viagem:              'Viagem',
  envio_brinde:        'Envio de brinde',
}
```

Confirme que as chaves de `TIPO_ARQUITETO_COLORS` (`blue`, `purple`, `amber`, `green`, `stone`)
existem em `STATUS_COLOR_CLASSES` — se alguma faltar, adicione seguindo o padrão das cores
existentes em vez de inventar classes novas soltas.

### Task 2 — Página de lista `/especificadores`

**Arquivo novo:** `frontend/src/pages/especificadores/EspecificadoresPage.jsx`

Requisitos:
- Tabela (não card/grid), ordenada alfabeticamente por `nome`.
- Colunas: Nome, Tipo (badge colorido), Escritório, Telefone, Nível de parceria, Vendedor
  vinculado.
- Filtros no topo: busca por nome (client-side), tipo (select), vendedor (select — **visível
  só para Diretoria/Gerente**, via `podeVerTudo`).
- Botão "Novo Especificador" abre modal de criação com: nome (obrigatório), tipo (obrigatório),
  nível de parceria, escritório, telefone, e-mail. **Não** incluir `vendedor_id` nem
  `endereco_escritorio` no formulário de criação — esses só são preenchidos depois, via edição.
- Clicar no nome de uma linha abre o drawer lateral (Task 4) daquele especificador.

Uma implementação de referência completa (já revisada, pode ser adaptada) está disponível — peça
para o usuário colar o conteúdo original da Task 11 do plano
(`docs/superpowers/plans/2026-07-14-especificadores-arquitetos-ui.md`, linhas ~1421-1647) se
quiser o código pronto em vez de escrever do zero. Ele usa `arquitetosApi`, `usersApi`, `Modal`,
`EmptyState`, `LoadingPage`, `useAuthStore`, `podeVerTudo`, e filtra vendedores via
`usersApi.list().filter(u => u.perfil === 'vendedor')`.

### Task 3 — Conteúdo das abas (Perfil, Score, Decisores)

**Arquivo novo:** `frontend/src/pages/especificadores/EspecificadorTabs.jsx`

Deve exportar 4 coisas, todas consumidas pelo drawer e pela página completa (Task 4):
`PerfilTab`, `ScoreTab`, `DecisoresTab`, `EditarEspecificadorModal`.

**`PerfilTab({ arquiteto, onUpdated })`:**
- Grid somente-leitura com: tipo, nível de parceria, escritório, telefone, endereço do
  escritório, vendedor vinculado (nome ou "Nenhum"). Edição é só via `EditarEspecificadorModal`,
  acionado pelo header do drawer/página — não duplicar campos editáveis aqui.
- Bloco "Clientes vinculados": `GET /arquitetos/{id}/clientes` → lista de nomes, texto
  não-clicável. Vazio → "Nenhum cliente vinculado ainda".
- Bloco "Histórico de interações": se o usuário pode registrar (regra de permissão acima),
  mostrar formulário no topo — select de tipo (6 opções fixas de
  `TIPO_INTERACAO_ARQUITETO_LABELS`) + textarea de observação + botão "Registrar interação"
  (desabilitado se observação vazia). Abaixo, timeline cronológica mais-recente-primeiro:
  tipo, autor (`autor_nome`), tempo relativo (`timeAgo`), texto da observação.

**`ScoreTab()`:**
- Sem props. Estado vazio usando `EmptyState`, explicando que o RFV depende de
  pedidos/fechamentos vinculados e é funcionalidade futura. Não tentar renderizar nenhum
  gráfico ou número.

**`DecisoresTab({ arquiteto })`:**
- Lista de `FuncionarioArquiteto` via `GET /arquitetos/{id}/funcionarios`: nome, função,
  telefone, email, observações, checkbox "Decisor" (chama `PATCH .../funcionarios/{id}` com
  `{ decisor: !atual }` ao mudar). Botão de remover (delete real, sem confirmação extra
  necessária — não é dado crítico).
- Botão "Adicionar funcionário" (só visível com permissão) abre modal com nome (obrigatório),
  função, telefone, email, observações, checkbox "É decisor".
- Mesma regra de permissão da aba Perfil (dono vinculado, ou Diretoria/Gerente/Recepção)
  controla quem vê os controles de adicionar/editar/remover — outros perfis veem só leitura.

**`EditarEspecificadorModal({ open, onClose, onSaved, arquiteto })`:**
- Formulário com nome, tipo, nível de parceria, escritório, telefone, email, endereço do
  escritório, e vendedor vinculado.
- Campo "Vendedor vinculado": **select editável só se `podeVerTudo(user?.perfil)`** (Diretoria/
  Gerente); para os demais perfis, mostrar texto somente-leitura com o nome do vendedor atual
  (ou "Nenhum") e uma nota tipo "só Diretoria/Gerente pode alterar". Não enviar `vendedor_id` no
  payload de PATCH se o usuário não tiver essa permissão (evita erro 403 desnecessário e deixa
  claro na UI que o campo não é dele).

Referência completa de código (revisada): Task 12 do plano original, linhas ~1670-2076 do mesmo
arquivo de plano citado acima.

### Task 4 — Drawer, página completa, rotas e sidebar

**Arquivos novos:**
- `frontend/src/pages/especificadores/EspecificadorDrawer.jsx`
- `frontend/src/pages/especificadores/EspecificadorDetalhePage.jsx`

**Arquivos a modificar:**
- `frontend/src/App.jsx`
- `frontend/src/components/layout/Sidebar.jsx`

**`EspecificadorDrawer({ arquitetoId, onClose, onUpdated })`:**
- Painel fixo lateral direito (`fixed inset-y-0 right-0`), largura ~`28rem`, mesmo padrão visual
  de outros drawers do projeto (`shadow-elevated`, `border-l`, `animate-slide-in-right`).
- Header: nome do especificador **clicável** → `navigate(`/especificadores/${id}`)` (usar
  `useNavigate` do `react-router-dom`); botão "Editar" (abre `EditarEspecificadorModal`); botão
  de fechar.
- Corpo: `Tabs` (Perfil/Score/Decisores) + conteúdo condicional renderizando `PerfilTab`,
  `ScoreTab`, `DecisoresTab`.
- Estado de loading enquanto `arquitetosApi.get(id)` não resolve (usar `Spinner`).

**`EspecificadorDetalhePage()`:**
- Lê `id` via `useParams()`. Mesmo conteúdo do drawer (3 abas + edição), layout de página cheia
  (`max-w-3xl mx-auto`, card com padding). `LoadingPage` enquanto carrega.

**Alterações em `App.jsx`:**
1. Importar as duas páginas novas junto aos outros imports de página.
2. `ProtectedLayout()` precisa reconhecer a rota dinâmica antes de cair no `ROUTE_TITLES[path]`
   fixo — algo como:
   ```jsx
   function ProtectedLayout() {
     const path = window.location.pathname
     const meta = path.startsWith('/especificadores')
       ? { title: 'Especificadores', subtitle: 'Carteira de arquitetos e designers' }
       : (ROUTE_TITLES[path] || { title: 'Líder Móveis', subtitle: '' })
     return (
       <AuthGuard>
         <AppLayout title={meta.title} subtitle={meta.subtitle} />
       </AuthGuard>
     )
   }
   ```
3. Dentro do `<Route element={<ProtectedLayout />}>`, adicionar (ordem sugerida: logo após
   `/crm`):
   ```jsx
   <Route path="/especificadores"     element={<EspecificadoresPage />} />
   <Route path="/especificadores/:id" element={<EspecificadorDetalhePage />} />
   ```

**Alterações em `Sidebar.jsx`:**
1. Adicionar `Compass` ao import de `lucide-react` (ícone sugerido; se preferir outro ícone
   coerente da biblioteca, tudo bem, mas mantenha consistência com o restante do menu).
2. Adicionar ao array `NAV`, logo após a entrada `/crm`:
   ```jsx
   { path: '/especificadores', label: 'Especificadores', icon: Compass, perfis: ['diretoria','gerente_comercial','vendedor','recepcao'] },
   ```
   Note que `projetista` **não** está na lista de perfis — Especificadores é módulo comercial.

Referência completa de código (revisada): Task 13 do plano original, linhas ~2099-2293.

## Verificação manual (rodar quando o backend tiver as Tasks 1-9 prontas)

1. Subir backend (`uvicorn app.main:app --reload --port 8000`) e frontend (`npm run dev`).
2. Login como `gerente@lidermoveis.com.br` / `Teste@123`. Confirmar "Especificadores" no menu.
3. Lista vazia inicialmente → criar um especificador (nome + tipo obrigatórios) → aparece na
   lista, ordenado alfabeticamente, badge de tipo correto.
4. Clicar no nome → drawer abre, 3 abas.
5. Aba Perfil → Editar → definir vendedor vinculado + endereço → salvar → dados refletem na aba.
6. Aba Perfil → registrar interação → aparece na timeline, mais recente primeiro.
7. Aba Decisores → adicionar funcionário, marcar/desmarcar decisor, remover.
8. Aba Score → mensagem de "ainda não disponível", nada quebrado.
9. Clicar no nome no header do drawer → navega para `/especificadores/{id}`, mesmo conteúdo em
   página cheia.
10. Logout, login como `vendedor@lidermoveis.com.br` / `Teste@123` → abrir um especificador
    vinculado a ele → consegue registrar interação/gerenciar funcionários. Abrir um especificador
    vinculado a outro vendedor → esses controles ficam ocultos/bloqueados.
11. Criar um cliente com `arquiteto_id` (via `/docs`, não existe tela de Cliente ainda) → conferir
    que aparece em "Clientes vinculados" na aba Perfil, como texto sem link.

Se qualquer um desses passos falhar por causa de campo/endpoint ausente no backend (ex.: erro
404 em `/arquitetos/{id}/clientes`, ou 422 por falta do campo `tipo`), **não é bug do frontend**
— é a dependência das Tasks 1-9 do backend, ainda pendentes. Reporte isso separado de bugs reais
de frontend.
