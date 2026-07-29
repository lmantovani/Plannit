# Especificadores — Reconciliação Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portar os 4 arquivos de frontend já prontos em `origin/feature/arch` (`EspecificadoresPage.jsx`, `EspecificadorDrawer.jsx`, `EspecificadorTabs.jsx`, `EspecificadorDetalhePage.jsx`) para a branch `feature/especificadores-reconciliado`, adaptando-os às decisões do spec de reconciliação: renomear `vendedor_id`→`consultor_id`, restaurar Decisores/Concorrentes/Desativar (regressões da `arch`), e adicionar as telas que só existiam no backend de `feature/especificadores` (KPIs, reatribuição de dono + histórico, meta de visitas).

**Architecture:** Este plano roda **depois** de `docs/superpowers/plans/2026-07-24-especificadores-reconciliacao-backend.md` (precisa dos endpoints/campos daquele plano prontos). Continua na mesma branch `feature/especificadores-reconciliado`. Estrutura de arquivos final:

```
frontend/src/pages/especificadores/
  EspecificadoresPage.jsx       ← lista + filtros + KPI panel
  EspecificadorDrawer.jsx       ← painel lateral (sem mudança de estrutura, só nome de campo)
  EspecificadorDetalhePage.jsx  ← página cheia /especificadores/:id (idem)
  EspecificadorTabs.jsx         ← conteúdo das abas: Perfil, Score, Decisores & Concorrentes
  MetasVisitasModal.jsx         ← novo, gestão configura meta mensal
frontend/src/components/especificadores/
  EspecificadoresKpiPanel.jsx   ← novo, compartilhado com DashboardPage.jsx
frontend/src/pages/arquitetos/  ← REMOVIDO no final deste plano (Task 8)
```

**Tech Stack:** React 19, Vite 8, TailwindCSS 3, lucide-react, clsx. Sem framework de teste JS — verificação de cada tarefa é `npm run build` + `npm run lint`; verificação funcional é manual, checklist na Task 9.

## Global Constraints

- Segue `docs/superpowers/specs/2026-07-24-especificadores-reconciliacao-design.md`.
- `podeVerTudo` (de `frontend/src/store/index.js`, já existente) continua sendo o gate de "ação de gestão" (reatribuir dono, configurar metas). **Não portar** `podeGerenciarRelacionamento`/`_checar_acesso_relacionamento` — a decisão de reconciliação foi visibilidade aberta, sem checagem por `vendedor_id`/`consultor_id` de dono.
- Todo campo/método que a `arch` chamou de `vendedor_id`/`vendedor_nome` vira `consultor_id`/`consultor_nome` (nome real do backend, ver plano de backend).
- `consultor_id` **nunca** é editado via `EditarEspecificadorModal`/PATCH genérico — só via `PATCH /dono` dedicado (mesma regra já aplicada no backend desde a primeira rodada deste módulo).
- Padrão de erro: `err.response?.data?.detail` pode ser string ou array de `{loc,msg,type}` (erro de validação Pydantic) — usar sempre uma função tipo `extractErrorMessage` (já existe em `ArquitetosPage.jsx` hoje, será portada na Task 7) em vez de `err.response?.data?.detail` cru.
- `git show origin/feature/arch:<path>` é usado nos comandos abaixo pra copiar o conteúdo exato de um arquivo de outra branch pro working tree atual, sem fazer merge/checkout dela — comando de leitura, não mexe em histórico nem em branch.

---

## Task 1: Copiar os 4 arquivos da `arch` + registrar rotas/menu

**Files:**
- Create: `frontend/src/pages/especificadores/EspecificadoresPage.jsx`
- Create: `frontend/src/pages/especificadores/EspecificadorDrawer.jsx`
- Create: `frontend/src/pages/especificadores/EspecificadorTabs.jsx`
- Create: `frontend/src/pages/especificadores/EspecificadorDetalhePage.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/layout/Sidebar.jsx`

**Interfaces:**
- Produces: rotas `/especificadores` e `/especificadores/:id`; item de menu "Especificadores" (visível a `diretoria`/`gerente_comercial`/`vendedor`/`recepcao`).

- [ ] **Step 1: Copiar os 4 arquivos literalmente da `arch`**

```bash
cd "C:\Users\thiagor\Documents\projeto\Plannit"
mkdir -p frontend/src/pages/especificadores
git show origin/feature/arch:frontend/src/pages/especificadores/EspecificadoresPage.jsx > frontend/src/pages/especificadores/EspecificadoresPage.jsx
git show origin/feature/arch:frontend/src/pages/especificadores/EspecificadorDrawer.jsx > frontend/src/pages/especificadores/EspecificadorDrawer.jsx
git show origin/feature/arch:frontend/src/pages/especificadores/EspecificadorTabs.jsx > frontend/src/pages/especificadores/EspecificadorTabs.jsx
git show origin/feature/arch:frontend/src/pages/especificadores/EspecificadorDetalhePage.jsx > frontend/src/pages/especificadores/EspecificadorDetalhePage.jsx
```

Expected: 4 arquivos novos criados, idênticos aos de `origin/feature/arch` nesse exato ponto — as tasks seguintes deste plano é que vão adaptá-los.

- [ ] **Step 2: Registrar as rotas em `App.jsx`**

Trocar:

```javascript
import BriefingPage from './pages/briefing/BriefingPage'
import ArquitetosPage from './pages/arquitetos/ArquitetosPage'
```

por:

```javascript
import BriefingPage from './pages/briefing/BriefingPage'
import EspecificadoresPage from './pages/especificadores/EspecificadoresPage'
import EspecificadorDetalhePage from './pages/especificadores/EspecificadorDetalhePage'
```

Trocar:

```javascript
  '/arquitetos':    { title: 'Arquitetos',          subtitle: 'Parceiros e indicações' },
```

Remover essa linha inteira (sem substituto — o título de `/especificadores` passa a ser calculado dinamicamente, ver próximo trecho).

Trocar:

```javascript
function ProtectedLayout() {
  const path = window.location.pathname
  const meta = ROUTE_TITLES[path] || { title: 'Líder Móveis', subtitle: '' }
```

por:

```javascript
function ProtectedLayout() {
  const path = window.location.pathname
  const meta = path.startsWith('/especificadores')
    ? { title: 'Especificadores', subtitle: 'Carteira de arquitetos e designers' }
    : (ROUTE_TITLES[path] || { title: 'Líder Móveis', subtitle: '' })
```

Trocar:

```javascript
            <Route path="/projetos"      element={<ProjetosPage />} />
            <Route path="/briefing"      element={<BriefingPage />} />
            <Route path="/arquitetos"    element={<ArquitetosPage />} />
```

por:

```javascript
            <Route path="/especificadores"     element={<EspecificadoresPage />} />
            <Route path="/especificadores/:id" element={<EspecificadorDetalhePage />} />
            <Route path="/projetos"      element={<ProjetosPage />} />
            <Route path="/briefing"      element={<BriefingPage />} />
```

- [ ] **Step 3: Atualizar o menu em `Sidebar.jsx`**

Trocar:

```javascript
  { path: '/arquitetos', label: 'Arquitetos',    icon: Compass,         perfis: ['*'] },
```

por:

```javascript
  { path: '/especificadores', label: 'Especificadores', icon: Compass,  perfis: ['diretoria','gerente_comercial','vendedor','recepcao'] },
```

- [ ] **Step 4: Verificar build**

Run: `cd frontend && npm run build`
Expected: build falha ou builda com telas quebradas em runtime — é esperado, `lib/api.js`/`lib/constants.js` ainda não têm os métodos/constantes que esses 4 arquivos esperam (`arquitetosApi.listarClientes`, `TIPO_ARQUITETO_LABELS` etc. só existirão a partir da Task 2). Se o build falhar por import não resolvido, é sinal de problema real nesta task; se falhar só por chamada de método inexistente em runtime, isso é esperado e resolvido nas próximas tasks — **não** rodar `npm run dev`/testar no navegador ainda.

Run: `cd frontend && npm run lint -- --quiet` (ou `npm run lint`, ignorando por ora avisos de import não resolvido que a Task 2 corrige)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/especificadores frontend/src/App.jsx frontend/src/components/layout/Sidebar.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: portar frontend de Especificadores de origin/feature/arch (base)

Copia literal dos 4 arquivos + rotas/menu — ainda nao builda sozinho,
proximas tasks adaptam lib/api.js, lib/constants.js e os proprios
arquivos as decisoes do spec de reconciliacao (consultor_id em vez de
vendedor_id, Decisores/Concorrentes/Desativar restaurados, etc).
EOF
)"
```

---

## Task 2: `lib/api.js` — reconciliar `arquitetosApi`

**Files:**
- Modify: `frontend/src/lib/api.js`

**Interfaces:**
- Produces: `arquitetosApi` final — soma os métodos de clientes/interações já portados pela `arch`, restaura decisores/concorrentes/desativar (existiam antes da `arch` remover), e adiciona os de dono/KPIs/metas que só existiam no plano de `especificadores`.

- [ ] **Step 1: Trocar o bloco `arquitetosApi` inteiro**

```javascript
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
  listarClientes: (id) => api.get(`/arquitetos/${id}/clientes`),
  listarInteracoes: (id) => api.get(`/arquitetos/${id}/interacoes`),
  registrarInteracao: (id, data) => api.post(`/arquitetos/${id}/interacoes`, data),
  reatribuirDono: (id, data) => api.patch(`/arquitetos/${id}/dono`, data),
  historicoDono: (id) => api.get(`/arquitetos/${id}/historico-dono`),
  kpis: () => api.get('/arquitetos/kpis'),
  listarMetasVisitas: () => api.get('/arquitetos/metas-visitas'),
  definirMetaVisitas: (data) => api.put('/arquitetos/metas-visitas', data),
  minhaMetaVisitas: () => api.get('/arquitetos/metas-visitas/me'),
}
```

(Isso substitui o bloco inteiro — o de hoje, herdado da `arch`, tem `listarFuncionarios`/`criarFuncionario`/`atualizarFuncionario`/`removerFuncionario` em vez dos métodos de decisores/concorrentes/desativar/dono/kpis/metas acima. `FuncionarioArquiteto` não é adotado nesta reconciliação — ver spec, seção "Decisores".)

- [ ] **Step 2: Verificar build**

Run: `cd frontend && npm run build`
Expected: ainda falha/quebra em runtime nos pontos que chamam `TIPO_ARQUITETO_LABELS`/`arquitetosApi.listarFuncionarios` (Task 3 e 5/6/7 resolvem) — mas nenhum erro novo introduzido por este arquivo.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/api.js
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: reconciliar arquitetosApi (decisores/concorrentes/desativar/dono/kpis/metas)

Restaura os 9 metodos que a arch removeu ao trocar Decisores por
Funcionarios (regressao real, ver comparacao de branches), e soma os 6
que so existiam no plano de especificadores (reatribuicao de dono,
historico, kpis, metas de visitas). listarFuncionarios/criarFuncionario/
atualizarFuncionario/removerFuncionario removidos — FuncionarioArquiteto
nao foi adotado.
EOF
)"
```

---

## Task 3: `lib/constants.js` — reconciliar labels/cores de tipo e interação

**Files:**
- Modify: `frontend/src/lib/constants.js`

**Interfaces:**
- Produces: `TIPO_ARQUITETO_LABELS`, `TIPO_ARQUITETO_COLORS` com as 6 chaves finais do enum (a `arch` só tinha 5, sem `decorador`, e usava a chave `designer` em vez de `designer_interiores`); `TIPO_INTERACAO_ARQUITETO_LABELS` com as 9 chaves da taxonomia unificada.

- [ ] **Step 1: Trocar os 3 objetos inteiros**

A `arch` adicionou isso ao final de `frontend/src/lib/constants.js` (antes de `SEGMENTO_CONFIG`):

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

Trocar esse bloco inteiro (não é só somar chaves — `designer` vira `designer_interiores`, `decorador` é novo, faltam `whatsapp`/`email`/`reuniao` na taxonomia de interação) por:

```javascript
export const TIPO_ARQUITETO_LABELS = {
  arquiteto:            'Arquiteto',
  engenheiro:           'Engenheiro',
  designer_interiores:  'Designer de Interiores',
  decorador:            'Decorador',
  corretor:             'Corretor',
  outro:                'Outro',
}

export const TIPO_ARQUITETO_COLORS = {
  arquiteto:            'blue',
  engenheiro:           'purple',
  designer_interiores:  'amber',
  decorador:            'green',
  corretor:             'primary',
  outro:                'stone',
}

export const TIPO_INTERACAO_ARQUITETO_LABELS = {
  ligacao:            'Ligação',
  whatsapp:           'WhatsApp',
  email:              'E-mail',
  visita_escritorio:  'Visita ao escritório',
  visita_loja:        'Visita à loja',
  reuniao:            'Reunião',
  evento:              'Evento',
  viagem:              'Viagem',
  envio_brinde:        'Envio de brinde',
}
```

- [ ] **Step 2: Adicionar `FLAG_CONFIG.especificador_esfriando`**

Em `FLAG_CONFIG` (mesmo arquivo, seção "Score de Arquitetos"), trocar:

```javascript
export const FLAG_CONFIG = {
  top_indicador:        { label: 'Top Indicador',           color: 'primary' },
  em_risco_de_perda:    { label: 'Em Risco de Perda',       color: 'red' },
  alto_potencial:       { label: 'Alto Potencial',          color: 'blue' },
  indicacao_alto_valor: { label: 'Indicação de Alto Valor', color: 'green' },
}
```

por:

```javascript
export const FLAG_CONFIG = {
  top_indicador:           { label: 'Top Indicador',           color: 'primary' },
  em_risco_de_perda:       { label: 'Em Risco de Perda',       color: 'red' },
  alto_potencial:          { label: 'Alto Potencial',          color: 'blue' },
  indicacao_alto_valor:    { label: 'Indicação de Alto Valor', color: 'green' },
  especificador_esfriando: { label: 'Esfriando',               color: 'amber' },
}
```

- [ ] **Step 3: Renomear `ORIGEM_LABELS.arquiteto`**

Trocar:

```javascript
  arquiteto:   'Arquiteto',
```

(dentro de `ORIGEM_LABELS`) por:

```javascript
  arquiteto:   'Especificador',
```

- [ ] **Step 4: Verificar build**

Run: `cd frontend && npm run build && npm run lint`
Expected: build passa limpo agora (todos os imports de `EspecificadorTabs.jsx`/`EspecificadoresPage.jsx` resolvidos); lint sem erro novo.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/constants.js
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: reconciliar labels de tipo/interacao, add flag esfriando, rename ORIGEM_LABELS

TIPO_ARQUITETO_LABELS/COLORS ganham as 6 chaves finais do enum (decorador
que a arch nao tinha; designer vira designer_interiores). Taxonomia de
interacao ganha whatsapp/email/reuniao que so existiam em especificadores.
EOF
)"
```

---

## Task 4: `EspecificadoresPage.jsx` — `consultor`, filtro de status, coluna de dono

**Files:**
- Modify: `frontend/src/pages/especificadores/EspecificadoresPage.jsx`

**Interfaces:**
- Consumes: `arquitetosApi.list(params)` (aceita `tipo`/`status_carteira`/`consultor_id`), `STATUS_CARTEIRA_CONFIG` (novo, definido nesta task).

- [ ] **Step 1: Adicionar `STATUS_CARTEIRA_CONFIG` em `constants.js`**

Em `frontend/src/lib/constants.js`, logo depois do bloco `TIPO_INTERACAO_ARQUITETO_LABELS` adicionado na Task 3:

```javascript
export const STATUS_CARTEIRA_CONFIG = {
  ativo:          { label: 'Ativo',          color: 'green' },
  em_prospeccao:  { label: 'Em Prospecção',  color: 'amber' },
  inativo:        { label: 'Inativo',        color: 'stone' },
}
```

- [ ] **Step 2: Renomear `vendedor` → `consultor` e adicionar filtro de status**

Trocar:

```javascript
import { arquitetosApi, usersApi } from '../../lib/api'
import { Modal, EmptyState, LoadingPage } from '../../components/ui'
import { TIPO_ARQUITETO_LABELS, TIPO_ARQUITETO_COLORS, STATUS_COLOR_CLASSES } from '../../lib/constants'
import { useAuthStore, podeVerTudo } from '../../store'
import EspecificadorDrawer from './EspecificadorDrawer'
import clsx from 'clsx'
```

por:

```javascript
import { arquitetosApi, usersApi } from '../../lib/api'
import { Modal, EmptyState, LoadingPage } from '../../components/ui'
import {
  TIPO_ARQUITETO_LABELS, TIPO_ARQUITETO_COLORS, STATUS_COLOR_CLASSES, STATUS_CARTEIRA_CONFIG,
} from '../../lib/constants'
import { useAuthStore, podeVerTudo } from '../../store'
import EspecificadoresKpiPanel from '../../components/especificadores/EspecificadoresKpiPanel'
import EspecificadorDrawer from './EspecificadorDrawer'
import clsx from 'clsx'
```

(o import de `EspecificadoresKpiPanel` é usado no Step 5 abaixo — o componente em si é criado na Task 9; até lá o build fica quebrado nesse import, o que é esperado dentro do plano.)

Trocar:

```javascript
export default function EspecificadoresPage() {
  const { user } = useAuthStore()
  const [especificadores, setEspecificadores] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroVendedor, setFiltroVendedor] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selecionadoId, setSelecionadoId] = useState(null)

  const podeGerenciarVendedores = podeVerTudo(user?.perfil)

  const fetchLista = async () => {
    try {
      const params = {}
      if (filtroTipo) params.tipo = filtroTipo
      if (filtroVendedor) params.vendedor_id = filtroVendedor
      const { data } = await arquitetosApi.list(params)
      setEspecificadores(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchLista() }, [filtroTipo, filtroVendedor])

  useEffect(() => {
    if (podeGerenciarVendedores) {
      usersApi.list().then(r => setVendedores(r.data.filter(u => u.perfil === 'vendedor'))).catch(console.error)
    }
  }, [podeGerenciarVendedores])
```

por:

```javascript
export default function EspecificadoresPage() {
  const { user } = useAuthStore()
  const [especificadores, setEspecificadores] = useState([])
  const [consultores, setConsultores] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroConsultor, setFiltroConsultor] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selecionadoId, setSelecionadoId] = useState(null)

  const podeGerenciarConsultores = podeVerTudo(user?.perfil)

  const fetchLista = async () => {
    try {
      const params = {}
      if (filtroTipo) params.tipo = filtroTipo
      if (filtroStatus) params.status_carteira = filtroStatus
      if (filtroConsultor) params.consultor_id = filtroConsultor
      const { data } = await arquitetosApi.list(params)
      setEspecificadores(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchLista() }, [filtroTipo, filtroStatus, filtroConsultor])

  useEffect(() => {
    if (podeGerenciarConsultores) {
      usersApi.list().then(r => setConsultores(r.data.filter(u => u.perfil === 'vendedor'))).catch(console.error)
    }
  }, [podeGerenciarConsultores])
```

- [ ] **Step 3: Toolbar — filtro de status e renomear select de consultor**

Trocar:

```javascript
        {podeGerenciarVendedores && (
          <select className="input w-48" value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)}>
            <option value="">Todos os vendedores</option>
            {vendedores.map(v => (
              <option key={v.id} value={v.id}>{v.nome}</option>
            ))}
          </select>
        )}
```

por:

```javascript
        <select className="input w-40" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_CARTEIRA_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {podeGerenciarConsultores && (
          <select className="input w-48" value={filtroConsultor} onChange={e => setFiltroConsultor(e.target.value)}>
            <option value="">Todos os consultores</option>
            {consultores.map(v => (
              <option key={v.id} value={v.id}>{v.nome}</option>
            ))}
          </select>
        )}
```

- [ ] **Step 4: Tabela — coluna "Vendedor vinculado" vira "Dono da carteira" + status**

Trocar:

```javascript
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Escritório</th>
                <th>Telefone</th>
                <th>Nível de parceria</th>
                <th>Vendedor vinculado</th>
              </tr>
```

por:

```javascript
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Escritório</th>
                <th>Telefone</th>
                <th>Dono da carteira</th>
              </tr>
```

Trocar:

```javascript
                  <td><TipoBadge tipo={a.tipo} /></td>
                  <td>{a.escritorio || '—'}</td>
                  <td>{a.telefone || '—'}</td>
                  <td className="capitalize">{a.nivel_parceria}</td>
                  <td>{a.vendedor_nome || '—'}</td>
```

por:

```javascript
                  <td><TipoBadge tipo={a.tipo} /></td>
                  <td>
                    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLOR_CLASSES[STATUS_CARTEIRA_CONFIG[a.status_carteira]?.color || 'stone'])}>
                      {STATUS_CARTEIRA_CONFIG[a.status_carteira]?.label || a.status_carteira}
                    </span>
                  </td>
                  <td>{a.escritorio || '—'}</td>
                  <td>{a.telefone || '—'}</td>
                  <td>{a.consultor_nome || 'Sem dono'}</td>
```

- [ ] **Step 5: Painel de KPIs no topo da página**

Trocar:

```javascript
  return (
    <div className="p-6">
      {/* Toolbar */}
```

por:

```javascript
  return (
    <div className="p-6">
      <div className="mb-5">
        <EspecificadoresKpiPanel />
      </div>

      {/* Toolbar */}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/constants.js frontend/src/pages/especificadores/EspecificadoresPage.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: EspecificadoresPage usa consultor_id, ganha filtro de status e KPIs

vendedor_id/vendedor_nome renomeados pro nome real do backend
(consultor_id/consultor_nome). Filtro de status_carteira somado ao de
tipo ja existente. Coluna da tabela mostra status + dono da carteira.
Painel de KPIs (Task 9) importado no topo — build so fecha apos essa task.
EOF
)"
```

---

## Task 5: `EditarEspecificadorModal` — remove edição de dono, adiciona especialidade

**Files:**
- Modify: `frontend/src/pages/especificadores/EspecificadorTabs.jsx`

**Interfaces:**
- Consumes: `arquitetosApi.update(id, data)` — schema `ArquitetoUpdate` do backend não aceita `consultor_id` (rejeitado silenciosamente por `exclude_unset`/ausência do campo no schema — mas a UI não deve nem oferecer a opção, pra não sugerir que funciona).

- [ ] **Step 1: Remover a edição de vendedor do modal**

Trocar:

```javascript
export function EditarEspecificadorModal({ open, onClose, onSaved, arquiteto }) {
  const { user } = useAuthStore()
  const podeEditarVendedor = podeVerTudo(user?.perfil)
  const [form, setForm] = useState(arquiteto)
  const [vendedores, setVendedores] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setForm(arquiteto) }, [arquiteto])

  useEffect(() => {
    if (open && podeEditarVendedor) {
      usersApi.list().then(r => setVendedores(r.data.filter(u => u.perfil === 'vendedor'))).catch(console.error)
    }
  }, [open, podeEditarVendedor])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        nome: form.nome, tipo: form.tipo, escritorio: form.escritorio,
        endereco_escritorio: form.endereco_escritorio, telefone: form.telefone,
        email: (form.email || '').trim() || null, nivel_parceria: form.nivel_parceria,
      }
      if (podeEditarVendedor) payload.vendedor_id = form.vendedor_id || null
      await arquitetosApi.update(arquiteto.id, payload)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }
```

por:

```javascript
export function EditarEspecificadorModal({ open, onClose, onSaved, arquiteto }) {
  const [form, setForm] = useState(arquiteto)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setForm(arquiteto) }, [arquiteto])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        nome: form.nome, tipo: form.tipo, especialidade: form.especialidade,
        escritorio: form.escritorio, endereco_escritorio: form.endereco_escritorio,
        telefone: form.telefone, email: (form.email || '').trim() || null,
        nivel_parceria: form.nivel_parceria,
      }
      await arquitetosApi.update(arquiteto.id, payload)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }
```

- [ ] **Step 2: Trocar o campo "Vendedor vinculado" por "Especialidade"**

Trocar:

```javascript
          <div className="col-span-2">
            <label className="label">Endereço do escritório</label>
            <input className="input" value={form.endereco_escritorio || ''} onChange={e => set('endereco_escritorio', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Vendedor vinculado</label>
            {podeEditarVendedor ? (
              <select className="input" value={form.vendedor_id || ''} onChange={e => set('vendedor_id', e.target.value || null)}>
                <option value="">Nenhum</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id}>{v.nome}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-stone-500 py-1.5">{arquiteto.vendedor_nome || 'Nenhum'} (só Diretoria/Gerente pode alterar)</p>
            )}
          </div>
```

por:

```javascript
          <div className="col-span-2">
            <label className="label">Endereço do escritório</label>
            <input className="input" value={form.endereco_escritorio || ''} onChange={e => set('endereco_escritorio', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Especialidade</label>
            <input className="input" value={form.especialidade || ''} onChange={e => set('especialidade', e.target.value)} placeholder="Ex: interiores comerciais" />
          </div>
```

(a reatribuição de dono passa a viver só na aba Perfil, via botão dedicado — Task 6. `usersApi` continua importado no topo do arquivo porque `NovoFuncionarioModal`/`DecisoresTab` ainda o usam até a Task 7 substituí-los.)

- [ ] **Step 3: Verificar build**

Run: `cd frontend && npm run build`
Expected: ainda quebra em runtime em pontos não tocados por esta task (Task 6/7/9) — sem erro novo introduzido aqui.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/especificadores/EspecificadorTabs.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
fix: remove edicao de dono do modal generico, add campo especialidade

consultor_id (renomeado de vendedor_id) so pode mudar via PATCH /dono
dedicado — nunca existiu no schema ArquitetoUpdate do backend, e o
formulario generico nao deve mais sugerir que funciona.
EOF
)"
```

---

## Task 6: `PerfilTab` — interações, lead gerado, dono da carteira + reatribuição + histórico

**Files:**
- Modify: `frontend/src/pages/especificadores/EspecificadorTabs.jsx`

**Interfaces:**
- Consumes: `arquitetosApi.listarInteracoes`, `.registrarInteracao`, `.reatribuirDono`, `.historicoDono` (Task 2); `leadsApi.list()` (já existe em `lib/api.js`, `LeadResponse.arquiteto_id` já existe no backend desde a primeira rodada deste módulo); `usersApi.list()`.

- [ ] **Step 1: Import — `leadsApi` e `timeAgo`**

Trocar:

```javascript
import { arquitetosApi, usersApi } from '../../lib/api'
import {
  TIPO_ARQUITETO_LABELS, TIPO_INTERACAO_ARQUITETO_LABELS, timeAgo,
  STATUS_COLOR_CLASSES, SEGMENTO_CONFIG, FLAG_CONFIG,
} from '../../lib/constants'
import { EmptyState, Modal, Spinner, ScoreBar } from '../../components/ui'
import { useAuthStore, podeVerTudo } from '../../store'

function podeGerenciarRelacionamento(user, arquiteto) {
  if (podeVerTudo(user?.perfil) || user?.perfil === 'recepcao') return true
  return user?.perfil === 'vendedor' && arquiteto?.vendedor_id === user?.id
}
```

por:

```javascript
import { arquitetosApi, usersApi, leadsApi } from '../../lib/api'
import {
  TIPO_ARQUITETO_LABELS, TIPO_INTERACAO_ARQUITETO_LABELS, timeAgo,
  STATUS_COLOR_CLASSES, SEGMENTO_CONFIG, FLAG_CONFIG,
} from '../../lib/constants'
import { EmptyState, Modal, Spinner, ScoreBar, AlertBanner, ConfirmDialog } from '../../components/ui'
import { useAuthStore, podeVerTudo } from '../../store'

function extractErrorMessage(err, fallback) {
  const detail = err.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map(d => d.msg || String(d)).join('; ')
  return fallback
}
```

(`podeGerenciarRelacionamento` some inteira — visibilidade e registro de interação passam a ser abertos pra qualquer usuário autenticado, decisão do spec de reconciliação. Nenhuma checagem de role entra no lugar dela no client: `ContatosTabContent` (Task 7) porta `ArquitetosPage.jsx` de hoje, que também nunca gatekeeper client-side pra Decisores/Concorrentes — quem bloqueia é o backend (`require_roles`), com o erro aparecendo via `extractErrorMessage` no formulário. `AlertBanner`/`ConfirmDialog` são usados a partir do Step 3.)

- [ ] **Step 2: `PerfilTab` — campos de interação (`resumo`/`responsavel_nome`/`data`/`lead_id`) e sem gate de permissão**

Trocar a função `PerfilTab` inteira (do `export function PerfilTab` até o `}` que a fecha, antes de `// === Aba Score ===`) por:

```javascript
export function PerfilTab({ arquiteto, onUpdated }) {
  const { user } = useAuthStore()
  const gestor = podeVerTudo(user?.perfil)

  const [clientes, setClientes] = useState([])
  const [interacoes, setInteracoes] = useState([])
  const [leadsDoEspecificador, setLeadsDoEspecificador] = useState([])
  const [tipo, setTipo] = useState('visita_escritorio')
  const [resumo, setResumo] = useState('')
  const [leadId, setLeadId] = useState('')
  const [loadingRegistro, setLoadingRegistro] = useState(false)

  const [historico, setHistorico] = useState([])
  const [historicoLoading, setHistoricoLoading] = useState(true)
  const [showReatribuir, setShowReatribuir] = useState(false)
  const [consultores, setConsultores] = useState([])
  const [novoConsultorId, setNovoConsultorId] = useState('')
  const [reatribuindo, setReatribuindo] = useState(false)
  const [reatribuirError, setReatribuirError] = useState('')

  const carregar = () => {
    arquitetosApi.listarClientes(arquiteto.id).then(r => setClientes(r.data)).catch(console.error)
    arquitetosApi.listarInteracoes(arquiteto.id).then(r => setInteracoes(r.data)).catch(console.error)
    leadsApi.list().then(r => setLeadsDoEspecificador(r.data.filter(l => l.arquiteto_id === arquiteto.id))).catch(console.error)
  }

  const carregarHistorico = () => {
    arquitetosApi.historicoDono(arquiteto.id)
      .then(r => setHistorico(r.data))
      .catch(console.error)
      .finally(() => setHistoricoLoading(false))
  }

  useEffect(() => { carregar(); carregarHistorico() }, [arquiteto.id])

  const registrar = async () => {
    if (!resumo.trim()) return
    setLoadingRegistro(true)
    try {
      await arquitetosApi.registrarInteracao(arquiteto.id, { tipo, resumo, lead_id: leadId ? Number(leadId) : null })
      setResumo('')
      setLeadId('')
      carregar()
      onUpdated?.()
    } catch (e) { console.error(e) }
    finally { setLoadingRegistro(false) }
  }

  const abrirReatribuir = async () => {
    setReatribuirError('')
    setShowReatribuir(true)
    if (consultores.length === 0) {
      try {
        const { data } = await usersApi.list()
        setConsultores(data.filter(u => u.perfil === 'vendedor'))
      } catch (e) {
        setReatribuirError('Não foi possível carregar a lista de vendedores.')
      }
    }
  }

  const confirmarReatribuir = async () => {
    if (!novoConsultorId) return
    setReatribuindo(true)
    setReatribuirError('')
    try {
      await arquitetosApi.reatribuirDono(arquiteto.id, { consultor_id: Number(novoConsultorId) })
      setShowReatribuir(false)
      setNovoConsultorId('')
      carregarHistorico()
      onUpdated?.()
    } catch (err) {
      setReatribuirError(extractErrorMessage(err, 'Erro ao reatribuir dono'))
    } finally {
      setReatribuindo(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-stone-400">Tipo</p>
          <p className="font-medium text-stone-700">{TIPO_ARQUITETO_LABELS[arquiteto.tipo] || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-stone-400">Nível de parceria</p>
          <p className="font-medium text-stone-700 capitalize">{arquiteto.nivel_parceria}</p>
        </div>
        <div>
          <p className="text-xs text-stone-400">Escritório</p>
          <p className="font-medium text-stone-700">{arquiteto.escritorio || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-stone-400">Telefone</p>
          <p className="font-medium text-stone-700">{arquiteto.telefone || '—'}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-stone-400">Endereço do escritório</p>
          <p className="font-medium text-stone-700">{arquiteto.endereco_escritorio || '—'}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-stone-400">Especialidade</p>
          <p className="font-medium text-stone-700">{arquiteto.especialidade || '—'}</p>
        </div>
      </div>

      <div className="border-t border-stone-100 pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Dono da carteira</p>
          {gestor && (
            <button className="btn-secondary btn-sm" onClick={abrirReatribuir}>Reatribuir</button>
          )}
        </div>
        <p className="text-sm text-stone-700 mb-3">{arquiteto.consultor_nome || 'Sem dono definido'}</p>

        <p className="text-2xs font-semibold text-stone-400 uppercase tracking-wide mb-1.5">Histórico de donos</p>
        {historicoLoading ? (
          <Spinner size={16} />
        ) : historico.length === 0 ? (
          <p className="text-xs text-stone-300">Nenhuma reatribuição registrada</p>
        ) : (
          <ul className="space-y-1">
            {historico.map(h => (
              <li key={h.id} className="text-xs text-stone-500">
                {h.consultor_anterior_nome || 'Sem dono'} → <strong className="text-stone-700">{h.consultor_novo_nome}</strong>
                <span className="text-stone-300"> · {timeAgo(h.alterado_em)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Clientes vinculados</p>
        {clientes.length === 0 ? (
          <p className="text-sm text-stone-300">Nenhum cliente vinculado ainda</p>
        ) : (
          <ul className="space-y-1">
            {clientes.map(c => (
              <li key={c.id} className="text-sm text-stone-600">{c.nome}</li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Histórico de interações</p>

        <div className="space-y-2 mb-4">
          <div className="flex gap-2">
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="input text-sm w-40">
              {Object.entries(TIPO_INTERACAO_ARQUITETO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            {leadsDoEspecificador.length > 0 && (
              <select value={leadId} onChange={e => setLeadId(e.target.value)} className="input text-sm flex-1">
                <option value="">Lead gerado (opcional)</option>
                {leadsDoEspecificador.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            )}
          </div>
          <textarea
            value={resumo}
            onChange={e => setResumo(e.target.value)}
            placeholder="Resumo do contato..."
            className="input resize-none h-20 text-sm"
          />
          <button
            onClick={registrar}
            disabled={loadingRegistro || !resumo.trim()}
            className="btn-primary w-full justify-center"
          >
            {loadingRegistro ? 'Registrando...' : 'Registrar interação'}
          </button>
        </div>

        {interacoes.length === 0 ? (
          <p className="text-sm text-stone-300">Nenhuma interação registrada</p>
        ) : (
          <div className="space-y-3">
            {interacoes.map(i => (
              <div key={i.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 flex-shrink-0">
                  <User size={13} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-stone-600">{TIPO_INTERACAO_ARQUITETO_LABELS[i.tipo] || i.tipo}</span>
                    <span className="text-2xs text-stone-300">{timeAgo(i.data)}</span>
                  </div>
                  <p className="text-sm text-stone-600 leading-relaxed">{i.resumo}</p>
                  <p className="text-2xs text-stone-400 mt-0.5">
                    por {i.responsavel_nome || 'usuário'}
                    {i.lead_id && <span className="text-primary-600"> · gerou lead #{i.lead_id}</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showReatribuir} onClose={() => setShowReatribuir(false)} title="Reatribuir dono da carteira" size="sm">
        {reatribuirError && <div className="mb-3"><AlertBanner type="error" message={reatribuirError} onDismiss={() => setReatribuirError('')} /></div>}
        <label className="label">Novo consultor</label>
        <select value={novoConsultorId} onChange={e => setNovoConsultorId(e.target.value)} className="input mb-4">
          <option value="">Selecione um vendedor...</option>
          {consultores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
        </select>
        <div className="flex gap-2 justify-end">
          <button className="btn-secondary btn-sm" onClick={() => setShowReatribuir(false)}>Cancelar</button>
          <button className="btn-primary btn-sm" disabled={!novoConsultorId || reatribuindo} onClick={confirmarReatribuir}>
            {reatribuindo ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
```

(`User` já está importado no topo do arquivo original — `import { Trash2, Plus, User } from 'lucide-react'` — sem mudança de import de ícone necessária aqui.)

- [ ] **Step 2: Verificar build**

Run: `cd frontend && npm run build`
Expected: ainda falha no ponto de `DecisoresTab` (Task 7) e no import de `EspecificadoresKpiPanel` (Task 9) — sem erro novo introduzido por esta task.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/especificadores/EspecificadorTabs.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: PerfilTab ganha dono da carteira, reatribuicao, historico e lead gerado

Registro de interacao deixa de exigir vendedor_id == self (visibilidade
aberta, decisao do spec de reconciliacao) — qualquer usuario autenticado
registra. Campos renomeados pro schema real (resumo/responsavel_nome/data).
Select de tipo ampliado pra taxonomia unificada (9 valores). Select
opcional de "lead gerado" filtra leadsApi.list() no cliente por
arquiteto_id.
EOF
)"
```

---

## Task 7: `DecisoresTab` → `ContatosTabContent` (Decisores & Concorrentes restaurados)

**Files:**
- Modify: `frontend/src/pages/especificadores/EspecificadorTabs.jsx`
- Modify: `frontend/src/pages/especificadores/EspecificadorDrawer.jsx`
- Modify: `frontend/src/pages/especificadores/EspecificadorDetalhePage.jsx`

**Interfaces:**
- Consumes: `arquitetosApi.listarDecisores/criarDecisor/atualizarDecisor/removerDecisor`, `.listarConcorrentes/criarConcorrente/atualizarConcorrente/removerConcorrente` (Task 2).
- Produces: `<ContatosTabContent arquitetoId={number} />` — substitui `DecisoresTab`. Restaura a regressão de concorrentes encontrada na comparação de branches.

> Este é o código que já existe hoje em `frontend/src/pages/arquitetos/ArquitetosPage.jsx` (`ContatosTabContent`, `DecisorForm`, `ConcorrenteForm`) — a `arch` nunca o deletou do repositório, só parou de usá-lo ao trocar pra `FuncionarioArquiteto`. Esta task porta essas 3 funções de volta pra dentro de `EspecificadorTabs.jsx`, praticamente inalteradas (só o parâmetro passa a ser `arquitetoId` direto em vez de vir embutido em `arquiteto`, pra bater com o padrão do resto deste arquivo).

- [ ] **Step 1: Remover `DecisoresTab` e `NovoFuncionarioModal`, adicionar `ContatosTabContent`/`DecisorForm`/`ConcorrenteForm`**

Trocar (do `// === Aba Decisores ===` até o fim de `NovoFuncionarioModal`, antes de `// === Modal de edição dos dados principais ===`):

```javascript
// === Aba Decisores ===
export function DecisoresTab({ arquiteto }) {
```

... (todo o corpo de `DecisoresTab` e `NovoFuncionarioModal`) ...

por:

```javascript
// === Aba Decisores & Concorrentes ===
export function ContatosTabContent({ arquitetoId }) {
  const [contatos, setContatos] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingDecisor, setEditingDecisor] = useState(undefined)
  const [editingConcorrente, setEditingConcorrente] = useState(undefined)
  const [removerDecisor, setRemoverDecisor] = useState(null)
  const [removerConcorrente, setRemoverConcorrente] = useState(null)
  const [removeError, setRemoveError] = useState('')

  const fetchContatos = async () => {
    setLoading(true)
    setError('')
    try {
      const [d, c] = await Promise.all([
        arquitetosApi.listarDecisores(arquitetoId),
        arquitetosApi.listarConcorrentes(arquitetoId),
      ])
      setContatos({ decisores: d.data, concorrentes: c.data })
    } catch (e) {
      console.error(e)
      setError('Não foi possível carregar decisores e concorrentes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchContatos() }, [arquitetoId])

  if (loading) return <div className="flex justify-center py-8"><Spinner size={24} /></div>
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!contatos) return null

  const decisores = contatos.decisores
  const concorrentes = contatos.concorrentes

  return (
    <div className="space-y-6">
      {removeError && (
        <AlertBanner type="error" message={removeError} onDismiss={() => setRemoveError('')} />
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Decisores</p>
          {editingDecisor === undefined && (
            <button className="btn-secondary btn-sm" onClick={() => setEditingDecisor(null)}>Adicionar</button>
          )}
        </div>

        {editingDecisor !== undefined && (
          <DecisorForm
            key={editingDecisor?.id ?? 'novo'}
            initial={editingDecisor ? {
              nome: editingDecisor.nome,
              cargo: editingDecisor.cargo || '',
              telefone: editingDecisor.telefone || '',
              email: editingDecisor.email || '',
              observacoes: editingDecisor.observacoes || '',
              is_principal: editingDecisor.is_principal,
            } : { nome: '', cargo: '', telefone: '', email: '', observacoes: '', is_principal: false }}
            onCancel={() => setEditingDecisor(undefined)}
            onSubmit={async (form) => {
              if (editingDecisor?.id) {
                await arquitetosApi.atualizarDecisor(arquitetoId, editingDecisor.id, form)
              } else {
                await arquitetosApi.criarDecisor(arquitetoId, form)
              }
              setEditingDecisor(undefined)
              fetchContatos()
            }}
          />
        )}

        {decisores.length === 0 ? (
          <p className="text-sm text-stone-300">Nenhum decisor cadastrado</p>
        ) : (
          <ul className="space-y-2">
            {decisores.map(d => (
              <li key={d.id} className="flex items-start justify-between gap-2 text-sm border-b border-stone-50 pb-2">
                <div>
                  <p className="font-medium text-stone-700">
                    {d.nome} {d.is_principal && <span className="badge badge-ativo ml-1">Principal</span>}
                  </p>
                  <p className="text-xs text-stone-400">{d.cargo || '—'} · {d.telefone || d.email || 'sem contato'}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="text-xs text-stone-500 hover:text-stone-800" onClick={() => setEditingDecisor(d)}>Editar</button>
                  <button className="text-xs text-red-500 hover:text-red-700" onClick={() => setRemoverDecisor(d)}>Remover</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Concorrentes</p>
          {editingConcorrente === undefined && (
            <button className="btn-secondary btn-sm" onClick={() => setEditingConcorrente(null)}>Adicionar</button>
          )}
        </div>

        {editingConcorrente !== undefined && (
          <ConcorrenteForm
            key={editingConcorrente?.id ?? 'novo'}
            initial={editingConcorrente ? {
              nome_concorrente: editingConcorrente.nome_concorrente,
              percentual_fechamento_estimado: editingConcorrente.percentual_fechamento_estimado,
              observacoes: editingConcorrente.observacoes || '',
            } : { nome_concorrente: '', percentual_fechamento_estimado: 0, observacoes: '' }}
            onCancel={() => setEditingConcorrente(undefined)}
            onSubmit={async (form) => {
              const payload = { ...form, percentual_fechamento_estimado: Number(form.percentual_fechamento_estimado) }
              if (editingConcorrente?.id) {
                await arquitetosApi.atualizarConcorrente(arquitetoId, editingConcorrente.id, payload)
              } else {
                await arquitetosApi.criarConcorrente(arquitetoId, payload)
              }
              setEditingConcorrente(undefined)
              fetchContatos()
            }}
          />
        )}

        {concorrentes.length === 0 ? (
          <p className="text-sm text-stone-300">Nenhum concorrente cadastrado</p>
        ) : (
          <ul className="space-y-2">
            {concorrentes.map(c => (
              <li key={c.id} className="flex items-start justify-between gap-2 text-sm border-b border-stone-50 pb-2">
                <div>
                  <p className="font-medium text-stone-700">{c.nome_concorrente}</p>
                  <p className="text-xs text-stone-400">{c.percentual_fechamento_estimado.toFixed(0)}% de fechamento estimado</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="text-xs text-stone-500 hover:text-stone-800" onClick={() => setEditingConcorrente(c)}>Editar</button>
                  <button className="text-xs text-red-500 hover:text-red-700" onClick={() => setRemoverConcorrente(c)}>Remover</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!removerDecisor}
        onClose={() => setRemoverDecisor(null)}
        onConfirm={async () => {
          try {
            await arquitetosApi.removerDecisor(arquitetoId, removerDecisor.id)
            setRemoverDecisor(null)
            fetchContatos()
          } catch (err) {
            setRemoverDecisor(null)
            setRemoveError(extractErrorMessage(err, 'Erro ao remover decisor'))
          }
        }}
        title="Remover decisor"
        message={`Remover ${removerDecisor?.nome} da lista de decisores?`}
        confirmLabel="Remover"
        danger
      />

      <ConfirmDialog
        open={!!removerConcorrente}
        onClose={() => setRemoverConcorrente(null)}
        onConfirm={async () => {
          try {
            await arquitetosApi.removerConcorrente(arquitetoId, removerConcorrente.id)
            setRemoverConcorrente(null)
            fetchContatos()
          } catch (err) {
            setRemoverConcorrente(null)
            setRemoveError(extractErrorMessage(err, 'Erro ao remover concorrente'))
          }
        }}
        title="Remover concorrente"
        message={`Remover ${removerConcorrente?.nome_concorrente} da lista de concorrentes?`}
        confirmLabel="Remover"
        danger
      />
    </div>
  )
}

function DecisorForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onSubmit(form)
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao salvar decisor'))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mb-3 p-3 bg-stone-50 rounded-lg">
      <input className="input" required value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome *" />
      <div className="grid grid-cols-2 gap-2">
        <input className="input" value={form.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Cargo" />
        <input className="input" value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="Telefone" />
      </div>
      <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="E-mail" />
      <textarea className="input resize-none h-16" value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Observações" />
      <label className="flex items-center gap-2 text-sm text-stone-600">
        <input type="checkbox" checked={form.is_principal} onChange={e => set('is_principal', e.target.checked)} />
        Contato principal
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" className="btn-secondary btn-sm" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary btn-sm" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
      </div>
    </form>
  )
}

function ConcorrenteForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onSubmit(form)
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao salvar concorrente'))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mb-3 p-3 bg-stone-50 rounded-lg">
      <input className="input" required value={form.nome_concorrente} onChange={e => set('nome_concorrente', e.target.value)} placeholder="Nome do concorrente *" />
      <input
        className="input" type="number" min="0" max="100" required
        value={form.percentual_fechamento_estimado}
        onChange={e => set('percentual_fechamento_estimado', e.target.value)}
        placeholder="% estimado de fechamento"
      />
      <textarea className="input resize-none h-16" value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Observações" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" className="btn-secondary btn-sm" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary btn-sm" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Atualizar `EspecificadorDrawer.jsx`**

Trocar:

```javascript
import { PerfilTab, ScoreTab, DecisoresTab, EditarEspecificadorModal } from './EspecificadorTabs'
```

por:

```javascript
import { PerfilTab, ScoreTab, ContatosTabContent, EditarEspecificadorModal } from './EspecificadorTabs'
```

Trocar:

```javascript
        {tab === 'decisores' && <DecisoresTab arquiteto={arquiteto} />}
```

por:

```javascript
        {tab === 'decisores' && <ContatosTabContent arquitetoId={arquiteto.id} />}
```

- [ ] **Step 3: Atualizar `EspecificadorDetalhePage.jsx`**

Trocar:

```javascript
import { PerfilTab, ScoreTab, DecisoresTab, EditarEspecificadorModal } from './EspecificadorTabs'
```

por:

```javascript
import { PerfilTab, ScoreTab, ContatosTabContent, EditarEspecificadorModal } from './EspecificadorTabs'
```

Trocar:

```javascript
        {tab === 'decisores' && <DecisoresTab arquiteto={arquiteto} />}
```

por:

```javascript
        {tab === 'decisores' && <ContatosTabContent arquitetoId={arquiteto.id} />}
```

Nos dois arquivos, o rótulo da aba já diz só "Decisores" — trocar pra "Decisores & Concorrentes" (mesmo texto usado em `ArquitetosPage.jsx` hoje):

```javascript
            { key: 'decisores', label: 'Decisores' },
```

por:

```javascript
            { key: 'decisores', label: 'Decisores & Concorrentes' },
```

- [ ] **Step 4: Verificar build**

Run: `cd frontend && npm run build`
Expected: só falha ainda no import de `EspecificadoresKpiPanel` (Task 9). `Trash2`/`Plus` (importados de `lucide-react` no topo de `EspecificadorTabs.jsx` pro `NovoFuncionarioModal` removido) podem ficar sem uso — rodar `npm run lint` e remover da linha de import se acusar `no-unused-vars`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/especificadores/EspecificadorTabs.jsx frontend/src/pages/especificadores/EspecificadorDrawer.jsx frontend/src/pages/especificadores/EspecificadorDetalhePage.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
fix: restaurar Decisores & Concorrentes, remover FuncionarioArquiteto da UI

Regressao real encontrada na comparacao de branches: a arch trocou
Decisores por Funcionarios e perdeu o CRUD de Concorrentes (so leitura
via score). Porta ContatosTabContent/DecisorForm/ConcorrenteForm, ja
existentes e testados em ArquitetosPage.jsx, pra dentro de
EspecificadorTabs.jsx.
EOF
)"
```

---

## Task 8: Restaurar "Desativar" + remover `frontend/src/pages/arquitetos/`

**Files:**
- Modify: `frontend/src/pages/especificadores/EspecificadorTabs.jsx`
- Modify: `frontend/src/pages/especificadores/EspecificadorDrawer.jsx`
- Modify: `frontend/src/pages/especificadores/EspecificadorDetalhePage.jsx`
- Delete: `frontend/src/pages/arquitetos/ArquitetosPage.jsx`

**Interfaces:**
- Consumes: `arquitetosApi.desativar(id)` (Task 2).

- [ ] **Step 1: Botão "Desativar" na aba Perfil**

Em `EspecificadorTabs.jsx`, dentro de `PerfilTab` (adicionada na Task 6), adicionar o estado e o botão. Trocar a assinatura da função:

```javascript
export function PerfilTab({ arquiteto, onUpdated }) {
  const { user } = useAuthStore()
  const gestor = podeVerTudo(user?.perfil)
```

por:

```javascript
export function PerfilTab({ arquiteto, onUpdated, onDesativado }) {
  const { user } = useAuthStore()
  const gestor = podeVerTudo(user?.perfil)
  const [confirmDesativar, setConfirmDesativar] = useState(false)
  const [desativarError, setDesativarError] = useState('')

  const handleDesativar = async () => {
    try {
      await arquitetosApi.desativar(arquiteto.id)
      setConfirmDesativar(false)
      onDesativado?.()
    } catch (err) {
      setConfirmDesativar(false)
      setDesativarError(extractErrorMessage(err, 'Erro ao desativar especificador'))
    }
  }
```

No fim do JSX retornado por `PerfilTab` (logo antes do `<Modal open={showReatribuir}` adicionado na Task 6), adicionar:

```javascript
      {desativarError && (
        <AlertBanner type="error" message={desativarError} onDismiss={() => setDesativarError('')} />
      )}
      <div className="border-t border-stone-100 pt-3">
        <button className="btn-danger btn-sm" onClick={() => setConfirmDesativar(true)}>Desativar</button>
      </div>

      <ConfirmDialog
        open={confirmDesativar}
        onClose={() => setConfirmDesativar(false)}
        onConfirm={handleDesativar}
        title="Desativar especificador"
        message={`Tem certeza que deseja desativar ${arquiteto.nome}? Ele deixará de aparecer na listagem.`}
        confirmLabel="Desativar"
        danger
      />

      <Modal open={showReatribuir} onClose={() => setShowReatribuir(false)} title="Reatribuir dono da carteira" size="sm">
```

(o `<Modal open={showReatribuir}...` já existe da Task 6 — só adicionar o bloco de desativar imediatamente antes dele, sem duplicar o modal de reatribuição.)

- [ ] **Step 2: Passar `onDesativado` de `EspecificadorDrawer.jsx` e `EspecificadorDetalhePage.jsx`**

Em `EspecificadorDrawer.jsx`, trocar:

```javascript
        {tab === 'perfil' && <PerfilTab arquiteto={arquiteto} onUpdated={() => { carregar(); onUpdated?.() }} />}
```

por:

```javascript
        {tab === 'perfil' && (
          <PerfilTab
            arquiteto={arquiteto}
            onUpdated={() => { carregar(); onUpdated?.() }}
            onDesativado={() => { onUpdated?.(); onClose(); }}
          />
        )}
```

Em `EspecificadorDetalhePage.jsx`, trocar:

```javascript
        {tab === 'perfil' && <PerfilTab arquiteto={arquiteto} onUpdated={carregar} />}
```

por:

```javascript
        {tab === 'perfil' && (
          <PerfilTab arquiteto={arquiteto} onUpdated={carregar} onDesativado={() => navigate('/especificadores')} />
        )}
```

(`EspecificadorDetalhePage.jsx` precisa de `useNavigate` — adicionar ao import do topo: trocar `import { useParams } from 'react-router-dom'` por `import { useParams, useNavigate } from 'react-router-dom'`, e dentro do componente, logo após `const { id } = useParams()`, adicionar `const navigate = useNavigate()`.)

- [ ] **Step 3: Remover a pasta antiga, agora sem nenhuma rota apontando pra ela**

```bash
git rm -r frontend/src/pages/arquitetos
```

Confirmar que nada mais importa esse caminho:

```bash
grep -rn "pages/arquitetos" frontend/src
```
Expected: nenhum resultado.

- [ ] **Step 4: Verificar build**

Run: `cd frontend && npm run build`
Expected: só falha ainda no import de `EspecificadoresKpiPanel` (Task 9).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/especificadores
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
fix: restaurar botao Desativar (RN017), remover pages/arquitetos orfao

Segunda regressao real da comparacao de branches: a arch nao tinha
nenhum jeito de desativar um especificador pela UI. pages/arquitetos
removido so agora, depois que ContatosTabContent/DecisorForm/
ConcorrenteForm ja foram portados de la (Task 7).
EOF
)"
```

---

## Task 9: `EspecificadoresKpiPanel` + `MetasVisitasModal`

**Files:**
- Create: `frontend/src/components/especificadores/EspecificadoresKpiPanel.jsx`
- Create: `frontend/src/pages/especificadores/MetasVisitasModal.jsx`
- Modify: `frontend/src/pages/dashboard/DashboardPage.jsx`

**Interfaces:**
- Consumes: `arquitetosApi.kpis()`, `.minhaMetaVisitas()`, `.listarMetasVisitas()`, `.definirMetaVisitas()` (Task 2); `usersApi.list()`.
- Produces: `<EspecificadoresKpiPanel />` (sem props), já importado por `EspecificadoresPage.jsx` desde a Task 4 — esta task cria o arquivo de verdade e fecha o build.

- [ ] **Step 1: Criar `MetasVisitasModal.jsx`**

```javascript
import { useEffect, useState } from 'react'
import { arquitetosApi, usersApi } from '../../lib/api'
import { Modal, Spinner, AlertBanner } from '../../components/ui'

function extractErrorMessage(err, fallback) {
  const detail = err.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map(d => d.msg || String(d)).join('; ')
  return fallback
}

export default function MetasVisitasModal({ open, onClose }) {
  const [vendedores, setVendedores] = useState([])
  const [metas, setMetas] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [salvandoId, setSalvandoId] = useState(null)

  const fetchTudo = async () => {
    setLoading(true)
    setError('')
    try {
      const [u, m] = await Promise.all([usersApi.list(), arquitetosApi.listarMetasVisitas()])
      setVendedores(u.data.filter(x => x.perfil === 'vendedor'))
      setMetas(Object.fromEntries(m.data.map(x => [x.consultor_id, x.meta_visitas_mes])))
    } catch (e) {
      console.error(e)
      setError('Não foi possível carregar vendedores e metas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (open) fetchTudo() }, [open])

  const salvar = async (consultorId, valor) => {
    setSalvandoId(consultorId)
    setError('')
    try {
      await arquitetosApi.definirMetaVisitas({ consultor_id: consultorId, meta_visitas_mes: Number(valor) })
      setMetas(m => ({ ...m, [consultorId]: Number(valor) }))
    } catch (e) {
      setError(extractErrorMessage(e, 'Erro ao salvar meta'))
    } finally {
      setSalvandoId(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Metas de visitas mensais" size="md">
      {error && <div className="mb-3"><AlertBanner type="error" message={error} onDismiss={() => setError('')} /></div>}
      {loading ? (
        <div className="flex justify-center py-8"><Spinner size={22} /></div>
      ) : vendedores.length === 0 ? (
        <p className="text-sm text-stone-400">Nenhum vendedor cadastrado.</p>
      ) : (
        <ul className="space-y-2">
          {vendedores.map(v => (
            <li key={v.id} className="flex items-center justify-between gap-3">
              <span className="text-sm text-stone-700">{v.nome}</span>
              <input
                type="number"
                min="0"
                className="input w-24 text-sm py-1"
                defaultValue={metas[v.id] ?? 0}
                onBlur={e => salvar(v.id, e.target.value)}
                disabled={salvandoId === v.id}
              />
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
```

- [ ] **Step 2: Criar `EspecificadoresKpiPanel.jsx`**

```javascript
import { useEffect, useState } from 'react'
import { Compass, TrendingUp, Target, MessageSquare, Building2, Settings } from 'lucide-react'
import { arquitetosApi } from '../../lib/api'
import { KpiCard, Spinner } from '../ui'
import { useAuthStore, podeVerTudo } from '../../store'
import MetasVisitasModal from '../../pages/especificadores/MetasVisitasModal'

export default function EspecificadoresKpiPanel() {
  const { user } = useAuthStore()
  const gestor = podeVerTudo(user?.perfil)

  const [kpis, setKpis] = useState(null)
  const [minhaMeta, setMinhaMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showMetas, setShowMetas] = useState(false)

  const fetchTudo = async () => {
    try {
      const promessas = [arquitetosApi.kpis()]
      if (!gestor) promessas.push(arquitetosApi.minhaMetaVisitas())
      const [k, m] = await Promise.all(promessas)
      setKpis(k.data)
      if (m) setMinhaMeta(m.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTudo() }, [])

  if (loading) return <div className="flex justify-center py-8"><Spinner size={22} /></div>
  if (!kpis) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Carteira de Especificadores</h3>
        {gestor && (
          <button onClick={() => setShowMetas(true)} className="btn-ghost btn-sm gap-1.5">
            <Settings size={13} /> Configurar metas
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Especificadores Ativos" value={kpis.especificadores_ativos} icon={Compass} color="purple" />
        <KpiCard label="% Venda c/ Especificador (mês)" value={`${kpis.pct_venda_mes}%`} icon={TrendingUp} color="green" />
        <KpiCard label="% Venda c/ Especificador (ano)" value={`${kpis.pct_venda_ano}%`} icon={Target} color="blue" />
        <KpiCard label="Atendimentos no Mês" value={kpis.atendimentos_mes} icon={MessageSquare} color="amber" />
        <KpiCard label="Visitas ao Escritório" value={kpis.visitas_escritorio_mes} icon={Building2} color="primary" />
      </div>
      {!gestor && minhaMeta && (
        <p className="text-xs text-stone-500">
          Sua meta de visitas este mês: <strong>{minhaMeta.visitas_realizadas_mes} de {minhaMeta.meta_visitas_mes}</strong>
        </p>
      )}
      {gestor && (
        <MetasVisitasModal open={showMetas} onClose={() => setShowMetas(false)} />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Usar o painel também no Dashboard**

Em `frontend/src/pages/dashboard/DashboardPage.jsx`, adicionar o import no topo:

```javascript
import EspecificadoresKpiPanel from '../../components/especificadores/EspecificadoresKpiPanel'
```

E inserir o componente logo após o bloco "KPIs principais" (depois do `</div>` que fecha `grid grid-cols-2 md:grid-cols-4 gap-3`), antes de "Funil de leads":

```javascript
      {/* KPIs da carteira de especificadores */}
      <EspecificadoresKpiPanel />

      {/* Funil de leads */}
```

- [ ] **Step 4: Verificar build**

Run: `cd frontend && npm run build && npm run lint`
Expected: build limpo, sem erros. Este é o primeiro build 100% verde desde a Task 1.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/especificadores frontend/src/pages/especificadores/MetasVisitasModal.jsx frontend/src/pages/dashboard/DashboardPage.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add EspecificadoresKpiPanel e MetasVisitasModal, fecha o build

Painel de KPIs reaproveitado em EspecificadoresPage.jsx e DashboardPage.jsx.
Gestao (podeVerTudo) ve botao "Configurar metas"; vendedor ve "visitado X
de Y" com a propria meta. Com esta task, npm run build fecha limpo pela
primeira vez desde a Task 1 — as tasks anteriores deixavam o import de
EspecificadoresKpiPanel pendente de proposito, pra nao acumular tudo numa
task so.
EOF
)"
```

---

## Task 10: Verificação final

**Files:** nenhum.

- [ ] **Step 1: Build, lint e suíte de backend**

```bash
cd frontend && npm run build && npm run lint
cd ../backend && python -m pytest -q
```
Expected: build/lint limpos; `143 passed` (herdado do plano de backend desta reconciliação).

- [ ] **Step 2: Push**

```bash
cd "C:\Users\thiagor\Documents\projeto\Plannit"
git push origin feature/especificadores-reconciliado
```

- [ ] **Step 3: Checklist de verificação manual**

Rodar localmente (`uvicorn` + `npm run dev`) e confirmar, um por um:

- [ ] Sidebar mostra "Especificadores"; visível a diretoria/gerente/vendedor/recepção, **não** a projetista/conferente.
- [ ] Cadastro: tipo obrigatório, mostra as 6 categorias (incluindo Corretor e Outro); especialidade e endereço do escritório são opcionais.
- [ ] Listagem: filtro de tipo, status da carteira e (só gestão) consultor funcionam juntos; coluna "Dono da carteira" mostra "Sem dono" pra um especificador novo.
- [ ] Painel de KPIs aparece igual no topo de Especificadores e no Dashboard.
- [ ] Login vendedor: painel mostra "Sua meta de visitas este mês: X de Y"; **sem** botão "Configurar metas".
- [ ] Login diretoria: "Configurar metas" abre modal, salva, persiste ao reabrir.
- [ ] Drawer/página de detalhe: aba Perfil mostra dono da carteira; botão "Reatribuir" só pra diretoria/gerente; após reatribuir, "Histórico de donos" atualiza.
- [ ] Aba Perfil: registrar interação funciona pra **qualquer** perfil autenticado (não só o dono) — confirma a decisão de visibilidade aberta.
- [ ] Registrar interação com um lead vinculado ao especificador mostra "Lead gerado" no select e "gerou lead #N" depois de salvo.
- [ ] Aba "Decisores & Concorrentes": as duas listas aparecem, CRUD completo nas duas (**confirma o fix da regressão de concorrentes**).
- [ ] Aba Perfil: botão "Desativar" funciona e remove o especificador da listagem (**confirma o fix da regressão de desativação**).
- [ ] Clientes vinculados aparecem na aba Perfil quando um cliente é cadastrado com esse `arquiteto_id`.
- [ ] Score: flag "Esfriando" aparece quando aplicável (mesmo teste de cenário do backend, `test_score_endpoint_inclui_flag_esfriando`, replicado manualmente).
- [ ] `/especificadores/:id` (página cheia) e o drawer da listagem mostram exatamente as mesmas informações.
- [ ] Recarregar `/especificadores` e `/dashboard` do zero (F5) — sem erro no console.

- [ ] **Step 4: Reportar**

Se algum item falhar, criar um fix específico antes de considerar a reconciliação concluída. Se tudo passar: `feature/especificadores-reconciliado` está pronta pra virar PR contra `main`. `feature/especificadores` e `feature/arch` (as duas branches originais) ficam preservadas no GitHub como estão — nenhuma é deletada por este plano.
