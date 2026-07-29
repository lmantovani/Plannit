# Especificadores — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a UI do módulo Especificadores (evolução visual do módulo Arquitetos) conforme `docs/superpowers/specs/2026-07-16-especificadores-design.md`: rename textual, campo tipo/especialidade no cadastro, dono da carteira com reatribuição e histórico, registro de interações, painel de KPIs (reaproveitado no Dashboard), e configuração de meta de visitas — todos os endpoints já existem no backend (`feature/especificadores`, commits até `cb00cc3`).

**Architecture:** Extensão de `frontend/src/pages/arquitetos/ArquitetosPage.jsx` (712 linhas hoje) seguindo o padrão já estabelecido no arquivo (form inline, drawer com abas, sub-formulários inline tipo `DecisorForm`/`ConcorrenteForm`). Duas peças novas viram arquivos próprios por motivo concreto, não por preferência estética: o painel de KPIs precisa ser importado por **duas** páginas (Especificadores e Dashboard), e a aba de Interações é grande o bastante (~130 linhas, mesmo padrão do `LeadDrawer` em `CRMPage.jsx`) para justificar isolamento. Reatribuição de dono e histórico continuam inline no drawer, no mesmo padrão dos formulários de Decisor/Concorrente já existentes. Nenhum rename técnico (nomes de arquivo, componente, model, rota) — só texto visível, conforme decisão de escopo do spec.

**Tech Stack:** React 19, Vite 8, TailwindCSS 3, Zustand, Axios, lucide-react, clsx. Sem framework de teste JS neste projeto (`package.json` não tem `vitest`/`jest`) — a verificação automática de cada tarefa é `npm run build` (pega erros de import/JSX) e `npm run lint`; a verificação funcional é manual, ao final do plano.

## Nota importante: 2 tarefas de backend são pré-requisito

Ao desenhar a UI descobri duas lacunas reais no backend já commitado que impedem a UI de cumprir o spec:

1. **`ArquitetoResponse` não expõe o nome do dono da carteira**, só `consultor_id`. O spec exige que "cada especificador passa a ter um dono visível e rastreável" **para todo mundo** (não só gestão) — mas `GET /users/` (única forma de resolver id→nome hoje) é restrito a `DIRETORIA`/`GERENTE_COMERCIAL`. Sem isso, um vendedor não consegue ver quem é o dono de um especificador que não é ele. Task 1 abaixo resolve isso com um campo computado `consultor_nome`, mesmo padrão que `HistoricoDonoResponse` já usa.
2. O "Lead gerado" do formulário de interação (spec seção 5) **não precisa** de mudança de backend — `LeadResponse` já traz `arquiteto_id`, então o frontend filtra a lista de `GET /leads/` no cliente. Só registrando aqui para deixar claro que essa parte não tem lacuna.

Task 1 é a única mudança de backend deste plano.

## Global Constraints

- **Rename só na camada visual.** Nomes internos (`Arquiteto`, `arquitetosApi`, `ArquitetoCard`, `ArquitetoForm`, `ArquitetoDrawer`, rotas `/arquitetos/*`) continuam iguais — só texto visível ao usuário muda para "Especificador(es)" (spec seção 3).
- **`tipo` não influencia nada visualmente além de badge/filtro** — não recalcula score, não muda cor do card por tipo.
- **Reatribuição de dono e configuração de metas são ações de gestão** — visíveis só quando `podeVerTudo(user.perfil)` (helper já existe em `frontend/src/store/index.js:65`, retorna `true` para `diretoria`/`gerente_comercial`). Usar esse helper, não reimplementar a checagem de perfil.
- **Sem filtro restritivo de visibilidade** — `GET /arquitetos/` continua sem filtro automático por `consultor_id`; os filtros de tipo/status/dono na toolbar são opcionais, escolhidos pelo usuário.
- **Todo componente novo usa os primitivos existentes** de `frontend/src/components/ui/index.jsx` (`Modal`, `KpiCard`, `Tabs`, `AlertBanner`, `ConfirmDialog`, `Spinner`, `EmptyState`) — não criar componentes visuais paralelos.
- **Padrão de erro de formulário:** toda função `onSubmit` de formulário deve deixar o `try/catch` para o componente pai tratar erro via `extractErrorMessage` (já definida no topo de `ArquitetosPage.jsx:11`) — mesmo padrão de `ArquitetoForm`/`DecisorForm`/`ConcorrenteForm`.
- **Sem framework de teste JS.** "Rodar o teste" nas tarefas de frontend significa `npm run build` (falha em erro de import/JSX/sintaxe) seguido de `npm run lint`. Não existe suíte automatizada de comportamento — por isso a Task 11 (final) é uma checklist manual explícita.
- Backend já implementado e commitado (branch `feature/especificadores`, HEAD `cb00cc3`): tipo/especialidade/status_carteira, `PATCH /dono` + histórico + notificação, `GET/POST /interacoes`, `GET /kpis`, flag `especificador_esfriando`, `GET/PUT /metas-visitas` + `GET /metas-visitas/me`. Nenhuma dessas rotas precisa de mudança neste plano (exceto Task 1).

---

## Task 1: Backend — expor `consultor_nome` em `ArquitetoResponse`

**Files:**
- Modify: `backend/app/models/crm.py` (import `Optional`, propriedade `consultor_nome` na classe `Arquiteto`)
- Modify: `backend/app/schemas/crm.py` (`ArquitetoResponse.consultor_nome`)
- Modify: `backend/app/api/v1/endpoints/arquitetos.py` (eager-load do relationship `consultor` em `listar_arquitetos` e `obter_arquiteto`)
- Create: `backend/tests/test_arquitetos_consultor_nome.py`

**Interfaces:**
- Consumes: `Arquiteto.consultor` (relationship já existente, `app/models/crm.py:154`).
- Produces: `Arquiteto.consultor_nome: Optional[str]` (property), `ArquitetoResponse.consultor_nome: Optional[str]` — usado pelo frontend em qualquer card/drawer que mostre o dono da carteira, sem precisar chamar `GET /users/` (restrito a gestão).

- [ ] **Step 1: Escrever o teste que falha**

Criar `backend/tests/test_arquitetos_consultor_nome.py`:

```python
from app.core.security import get_password_hash
from app.models.user import User, PerfilUsuario


def _criar_vendedor(db_session, nome="Vendedor Consultor", email="vendedor.consultor@plannit.com.br"):
    user = User(
        nome=nome, email=email,
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.VENDEDOR, is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_criar_arquiteto_sem_dono_traz_consultor_nome_nulo(auth_client):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": "Sem Dono", "tipo": "arquiteto"})
    assert resp.status_code == 201
    assert resp.json()["consultor_nome"] is None


def test_listar_arquitetos_com_dono_traz_consultor_nome(auth_client, db_session):
    vendedor = _criar_vendedor(db_session)
    criado = auth_client.post("/api/v1/arquitetos/", json={"nome": "Com Dono", "tipo": "arquiteto"}).json()
    auth_client.patch(f"/api/v1/arquitetos/{criado['id']}/dono", json={"consultor_id": vendedor.id})

    resp = auth_client.get("/api/v1/arquitetos/")
    assert resp.status_code == 200
    achado = next(a for a in resp.json() if a["nome"] == "Com Dono")
    assert achado["consultor_nome"] == vendedor.nome


def test_obter_arquiteto_com_dono_traz_consultor_nome(auth_client, db_session):
    vendedor = _criar_vendedor(db_session, "Vendedor Get", "vendedor.get@plannit.com.br")
    criado = auth_client.post("/api/v1/arquitetos/", json={"nome": "Com Dono Get", "tipo": "arquiteto"}).json()
    auth_client.patch(f"/api/v1/arquitetos/{criado['id']}/dono", json={"consultor_id": vendedor.id})

    resp = auth_client.get(f"/api/v1/arquitetos/{criado['id']}")
    assert resp.status_code == 200
    assert resp.json()["consultor_nome"] == vendedor.nome
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/test_arquitetos_consultor_nome.py -v`
Expected: FAIL — `KeyError: 'consultor_nome'` (campo ainda não existe na resposta).

- [ ] **Step 3: Adicionar a propriedade no model**

Em `backend/app/models/crm.py`, trocar a primeira linha:

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum, Text, ForeignKey, Date, Float
```

para:

```python
from typing import Optional
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum, Text, ForeignKey, Date, Float
```

E, na classe `Arquiteto`, logo após `consultor = relationship("User", foreign_keys=[consultor_id])`, adicionar:

```python
    consultor = relationship("User", foreign_keys=[consultor_id])

    @property
    def consultor_nome(self) -> Optional[str]:
        return self.consultor.nome if self.consultor else None
```

- [ ] **Step 4: Adicionar o campo no schema**

Em `backend/app/schemas/crm.py`, na classe `ArquitetoResponse`, adicionar `consultor_nome` logo após `consultor_id`:

```python
class ArquitetoResponse(BaseModel):
    id: int
    nome: str
    escritorio: Optional[str]
    telefone: Optional[str]
    email: Optional[str]
    nivel_parceria: str
    tipo: TipoEspecificador
    especialidade: Optional[str]
    consultor_id: Optional[int]
    consultor_nome: Optional[str]
    status_carteira: StatusCarteiraEspecificador
    is_active: bool

    class Config:
        from_attributes = True
```

- [ ] **Step 5: Eager-load do relationship nas rotas de leitura**

Em `backend/app/api/v1/endpoints/arquitetos.py`, `joinedload` já está importado (usado no fix do N+1 de `historico_dono`). Trocar o corpo de `listar_arquitetos`:

```python
    query = db.query(Arquiteto).options(joinedload(Arquiteto.consultor)).filter(Arquiteto.is_active == True)
```

(troca só a primeira linha do corpo — o resto da função continua igual.)

E trocar o corpo de `obter_arquiteto`:

```python
@router.get("/{arquiteto_id}", response_model=ArquitetoResponse)
def obter_arquiteto(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    arquiteto = db.query(Arquiteto).options(joinedload(Arquiteto.consultor)).filter(Arquiteto.id == arquiteto_id).first()
    if not arquiteto:
        raise HTTPException(404, "Arquiteto não encontrado")
    return arquiteto
```

- [ ] **Step 6: Rodar a suíte completa**

Run: `cd backend && python -m pytest -q`
Expected: PASS — 133 testes (130 + 3 novos).

- [ ] **Step 7: Commit**

```bash
git add backend/app/models/crm.py backend/app/schemas/crm.py backend/app/api/v1/endpoints/arquitetos.py backend/tests/test_arquitetos_consultor_nome.py
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: expor consultor_nome no ArquitetoResponse

Pre-requisito de UI: o dono da carteira precisa ser visivel para
qualquer usuario (nao so gestao), mas GET /users/ e restrito a
DIRETORIA/GERENTE_COMERCIAL. consultor_nome e computado a partir do
relationship ja existente, com eager-load para evitar N+1 na listagem.
EOF
)"
```

---

## Task 2: `lib/api.js` — métodos novos de `arquitetosApi`

**Files:**
- Modify: `frontend/src/lib/api.js`

**Interfaces:**
- Consumes: endpoints já existentes no backend (`PATCH /arquitetos/{id}/dono`, `GET /arquitetos/{id}/historico-dono`, `GET/POST /arquitetos/{id}/interacoes`, `GET /arquitetos/kpis`, `GET/PUT /arquitetos/metas-visitas`, `GET /arquitetos/metas-visitas/me`).
- Produces: `arquitetosApi.reatribuirDono`, `.historicoDono`, `.listarInteracoes`, `.registrarInteracao`, `.kpis`, `.listarMetasVisitas`, `.definirMetaVisitas`, `.minhaMetaVisitas` — usados por todas as tasks seguintes.

- [ ] **Step 1: Adicionar os métodos**

Em `frontend/src/lib/api.js`, trocar o bloco `arquitetosApi` inteiro por:

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
  reatribuirDono: (id, data) => api.patch(`/arquitetos/${id}/dono`, data),
  historicoDono: (id) => api.get(`/arquitetos/${id}/historico-dono`),
  listarInteracoes: (id) => api.get(`/arquitetos/${id}/interacoes`),
  registrarInteracao: (id, data) => api.post(`/arquitetos/${id}/interacoes`, data),
  kpis: () => api.get('/arquitetos/kpis'),
  listarMetasVisitas: () => api.get('/arquitetos/metas-visitas'),
  definirMetaVisitas: (data) => api.put('/arquitetos/metas-visitas', data),
  minhaMetaVisitas: () => api.get('/arquitetos/metas-visitas/me'),
}
```

- [ ] **Step 2: Verificar que o projeto ainda builda**

Run: `cd frontend && npm run build`
Expected: build concluído sem erros (esse arquivo não é importado por JSX ainda com os novos nomes, então só valida sintaxe).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/api.js
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add metodos de api para dono/interacoes/kpis/metas de especificadores

Cobre os endpoints ja existentes no backend (feature/especificadores)
que a UI ainda nao consumia: reatribuicao de dono, historico, interacoes,
KPIs da carteira e metas de visitas.
EOF
)"
```

---

## Task 3: `lib/constants.js` — labels e configs novos

**Files:**
- Modify: `frontend/src/lib/constants.js`

**Interfaces:**
- Consumes: valores dos enums backend `TipoEspecificador` (`arquiteto`, `designer_interiores`, `decorador`, `engenheiro`) e `StatusCarteiraEspecificador` (`ativo`, `em_prospeccao`, `inativo`); flag `especificador_esfriando` (`app/services/arquiteto_score.py`).
- Produces: `TIPO_ESPECIFICADOR_CONFIG`, `STATUS_CARTEIRA_CONFIG` — usados pelo card, filtros e drawer nas próximas tasks. `FLAG_CONFIG` ganha a entrada `especificador_esfriando`.

- [ ] **Step 1: Adicionar os configs novos e ajustar `ORIGEM_LABELS`**

Em `frontend/src/lib/constants.js`, trocar `arquiteto: 'Arquiteto',` dentro de `ORIGEM_LABELS` por:

```javascript
  arquiteto:   'Especificador',
```

No final do arquivo, depois de `FLAG_CONFIG`, adicionar:

```javascript
export const TIPO_ESPECIFICADOR_CONFIG = {
  arquiteto:            { label: 'Arquiteto' },
  designer_interiores:  { label: 'Designer de Interiores' },
  decorador:            { label: 'Decorador' },
  engenheiro:           { label: 'Engenheiro' },
}

export const STATUS_CARTEIRA_CONFIG = {
  ativo:          { label: 'Ativo',          color: 'green' },
  em_prospeccao:  { label: 'Em Prospecção',  color: 'amber' },
  inativo:        { label: 'Inativo',        color: 'stone' },
}
```

E dentro de `FLAG_CONFIG` (não no final do arquivo — é um objeto já existente), adicionar a entrada nova junto às outras três:

```javascript
export const FLAG_CONFIG = {
  top_indicador:          { label: 'Top Indicador',           color: 'primary' },
  em_risco_de_perda:      { label: 'Em Risco de Perda',       color: 'red' },
  alto_potencial:         { label: 'Alto Potencial',          color: 'blue' },
  indicacao_alto_valor:   { label: 'Indicação de Alto Valor', color: 'green' },
  especificador_esfriando:{ label: 'Esfriando',               color: 'amber' },
}
```

- [ ] **Step 2: Verificar build**

Run: `cd frontend && npm run build && npm run lint`
Expected: ambos sem erro.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/constants.js
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add configs de tipo/status_carteira e flag esfriando (constants.js)

TIPO_ESPECIFICADOR_CONFIG e STATUS_CARTEIRA_CONFIG dao label (e cor, no
segundo caso) para os enums novos do backend. FLAG_CONFIG ganha a entrada
especificador_esfriando. ORIGEM_LABELS.arquiteto passa a exibir
'Especificador' (rename textual, spec secao 3).
EOF
)"
```

---

## Task 4: Rename textual da UI (fora de `ArquitetosPage.jsx`)

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.jsx:15`
- Modify: `frontend/src/App.jsx:24`
- Modify: `frontend/src/pages/briefing/BriefingPage.jsx:707,715`

**Interfaces:** nenhuma — só texto visível, sem mudança de props/estado.

- [ ] **Step 1: Sidebar**

Em `frontend/src/components/layout/Sidebar.jsx:15`, trocar:

```javascript
  { path: '/arquitetos', label: 'Arquitetos',    icon: Compass,         perfis: ['*'] },
```

por:

```javascript
  { path: '/arquitetos', label: 'Especificadores', icon: Compass,       perfis: ['*'] },
```

- [ ] **Step 2: App.jsx**

Em `frontend/src/App.jsx:24`, trocar:

```javascript
  '/arquitetos':    { title: 'Arquitetos',          subtitle: 'Parceiros e indicações' },
```

por:

```javascript
  '/arquitetos':    { title: 'Especificadores',     subtitle: 'Parceiros e indicações' },
```

- [ ] **Step 3: BriefingPage.jsx**

Em `frontend/src/pages/briefing/BriefingPage.jsx:707`, trocar:

```javascript
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Arquiteto / Especificador (opcional +7 pts)</p>
```

por:

```javascript
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Especificador (opcional +7 pts)</p>
```

E na linha 715 (mesmo bloco), trocar o placeholder:

```javascript
              placeholder="Nome do arquiteto"
```

por:

```javascript
              placeholder="Nome do especificador"
```

- [ ] **Step 4: Verificar build**

Run: `cd frontend && npm run build && npm run lint`
Expected: ambos sem erro.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/layout/Sidebar.jsx frontend/src/App.jsx frontend/src/pages/briefing/BriefingPage.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: rename textual de Arquitetos para Especificadores (sidebar/titulo/briefing)

Rename so na camada visual (spec secao 3) - nomes internos de rota,
componente e arquivo continuam iguais.
EOF
)"
```

---

## Task 5: `ArquitetosPage.jsx` — campo `tipo`/`especialidade` no cadastro + badges no card

**Files:**
- Modify: `frontend/src/pages/arquitetos/ArquitetosPage.jsx`

**Interfaces:**
- Consumes: `TIPO_ESPECIFICADOR_CONFIG`, `STATUS_CARTEIRA_CONFIG` (Task 3); `ArquitetoResponse.tipo/.especialidade/.status_carteira/.consultor_nome` (backend já expõe todos, `consultor_nome` desde a Task 1).
- Produces: nenhuma interface nova para outras tasks — mudança fica contida neste arquivo.

- [ ] **Step 1: Importar os configs novos**

Trocar a linha de import de `constants.js`:

```javascript
import { STATUS_COLOR_CLASSES, SEGMENTO_CONFIG, FLAG_CONFIG } from '../../lib/constants'
```

por:

```javascript
import { STATUS_COLOR_CLASSES, SEGMENTO_CONFIG, FLAG_CONFIG, TIPO_ESPECIFICADOR_CONFIG, STATUS_CARTEIRA_CONFIG } from '../../lib/constants'
```

- [ ] **Step 2: Renomear textos visíveis da toolbar e empty state**

Trocar:

```javascript
            placeholder="Buscar arquiteto..."
```
por `placeholder="Buscar especificador..."`.

Trocar:
```javascript
        <button onClick={() => setShowModal(true)} className="btn-primary btn-sm gap-1.5 ml-auto">
          <Plus size={13} /> Novo Arquiteto
        </button>
```
por:
```javascript
        <button onClick={() => setShowModal(true)} className="btn-primary btn-sm gap-1.5 ml-auto">
          <Plus size={13} /> Novo Especificador
        </button>
```

Trocar:
```javascript
        <EmptyState title="Nenhum arquiteto encontrado" description="Cadastre um novo arquiteto parceiro para começar" />
```
por:
```javascript
        <EmptyState title="Nenhum especificador encontrado" description="Cadastre um novo especificador parceiro para começar" />
```

- [ ] **Step 3: Card mostra tipo, status da carteira e dono**

Trocar a função `ArquitetoCard` inteira por:

```javascript
function ArquitetoCard({ arquiteto, onClick }) {
  const tipoCfg = TIPO_ESPECIFICADOR_CONFIG[arquiteto.tipo] || { label: arquiteto.tipo }
  const statusCfg = STATUS_CARTEIRA_CONFIG[arquiteto.status_carteira] || { label: arquiteto.status_carteira, color: 'stone' }
  return (
    <div onClick={onClick} className="card-hover p-4 cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-medium text-stone-800">{arquiteto.nome}</p>
        <span className="badge badge-neutro flex-shrink-0">{arquiteto.nivel_parceria}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
          {tipoCfg.label}
        </span>
        <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLOR_CLASSES[statusCfg.color])}>
          {statusCfg.label}
        </span>
      </div>
      {arquiteto.escritorio && (
        <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
          <Building2 size={11} />
          <span>{arquiteto.escritorio}</span>
        </div>
      )}
      {arquiteto.telefone && (
        <div className="flex items-center gap-1.5 text-xs text-stone-400">
          <Phone size={11} />
          <span>{arquiteto.telefone}</span>
        </div>
      )}
      {arquiteto.email && (
        <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-1">
          <Mail size={11} />
          <span>{arquiteto.email}</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-2 pt-2 border-t border-stone-50">
        <UserCog size={11} />
        <span>{arquiteto.consultor_nome || 'Sem dono definido'}</span>
      </div>
    </div>
  )
}
```

E o import de ícones no topo do arquivo, trocar:

```javascript
import { Plus, Search, Phone, Mail, Building2 } from 'lucide-react'
```
por:
```javascript
import { Plus, Search, Phone, Mail, Building2, UserCog, ArrowRightLeft, History } from 'lucide-react'
```

(`ArrowRightLeft` e `History` são usados na Task 9 — importar já agora evita um diff extra depois.)

- [ ] **Step 4: `ArquitetoForm` ganha `tipo` (obrigatório) e `especialidade`**

Trocar o bloco de campos dentro de `ArquitetoForm` (o `<div className="grid grid-cols-2 gap-4">`) por:

```javascript
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Nome *</label>
          <input className="input" required value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" />
        </div>
        <div>
          <label className="label">Tipo *</label>
          <select className="input" required value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            {Object.entries(TIPO_ESPECIFICADOR_CONFIG).map(([value, cfg]) => (
              <option key={value} value={value}>{cfg.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Especialidade</label>
          <input className="input" value={form.especialidade} onChange={e => set('especialidade', e.target.value)} placeholder="Ex: interiores comerciais" />
        </div>
        <div className="col-span-2">
          <label className="label">Escritório</label>
          <input className="input" value={form.escritorio} onChange={e => set('escritorio', e.target.value)} placeholder="Nome do escritório" />
        </div>
        <div>
          <label className="label">Telefone</label>
          <input className="input" value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(11) 99999-0000" />
        </div>
        <div>
          <label className="label">E-mail</label>
          <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" />
        </div>
        <div className="col-span-2">
          <label className="label">Nível de parceria</label>
          <input className="input" required value={form.nivel_parceria} onChange={e => set('nivel_parceria', e.target.value)} placeholder="parceiro" />
        </div>
      </div>
```

- [ ] **Step 5: `NovoArquitetoModal` — copy e `initial` com `tipo`**

Trocar a função inteira por:

```javascript
function NovoArquitetoModal({ open, onClose, onSaved }) {
  return (
    <Modal open={open} onClose={onClose} title="Novo Especificador" size="md">
      <ArquitetoForm
        initial={{ nome: '', escritorio: '', telefone: '', email: '', nivel_parceria: 'parceiro', tipo: 'arquiteto', especialidade: '' }}
        submitLabel="Cadastrar Especificador"
        onCancel={onClose}
        onSubmit={async (form) => {
          await arquitetosApi.create(form)
          onSaved()
        }}
      />
    </Modal>
  )
}
```

- [ ] **Step 6: Form de edição no drawer também envia `tipo`/`especialidade`**

Dentro de `ArquitetoDrawer`, no bloco `editing ? (<ArquitetoForm initial={...}`, trocar o objeto `initial` por:

```javascript
                initial={{
                  nome: atual.nome,
                  escritorio: atual.escritorio || '',
                  telefone: atual.telefone || '',
                  email: atual.email || '',
                  nivel_parceria: atual.nivel_parceria,
                  tipo: atual.tipo,
                  especialidade: atual.especialidade || '',
                }}
```

- [ ] **Step 7: Verificar build**

Run: `cd frontend && npm run build && npm run lint`
Expected: ambos sem erro. `ArrowRightLeft`/`History` importados e não usados ainda vão gerar warning de lint (não erro) — aceitável até a Task 9 usar; se `npm run lint` estiver configurado para falhar em warning de unused-import, mover esses dois imports para a Task 9 em vez de aqui.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/arquitetos/ArquitetosPage.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add tipo/especialidade no cadastro e badges de tipo/status/dono no card

Rename textual da tela principal (spec secao 3) + campo tipo obrigatorio
e especialidade opcional no form de cadastro/edicao (spec secao 1 e 2).
Card do especificador agora mostra tipo, status da carteira e dono.
EOF
)"
```

---

## Task 6: `ArquitetosPage.jsx` — filtros de tipo e status da carteira

**Files:**
- Modify: `frontend/src/pages/arquitetos/ArquitetosPage.jsx`

**Interfaces:**
- Consumes: `arquitetosApi.list(params)` (já aceita `tipo`/`status_carteira`/`consultor_id` como query params opcionais, backend Task 2 do plano anterior).

- [ ] **Step 1: Estado dos filtros e refetch**

No topo de `ArquitetosPage`, trocar:

```javascript
  const [arquitetos, setArquitetos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [listError, setListError] = useState('')

  const fetchArquitetos = async () => {
    try {
      const { data } = await arquitetosApi.list()
      setArquitetos(data)
      setListError('')
    } catch (e) {
      console.error(e)
      setListError('Não foi possível carregar a lista de arquitetos.')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchArquitetos() }, [])
```

por:

```javascript
  const [arquitetos, setArquitetos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [listError, setListError] = useState('')

  const fetchArquitetos = async (params = {}) => {
    try {
      const { data } = await arquitetosApi.list(params)
      setArquitetos(data)
      setListError('')
    } catch (e) {
      console.error(e)
      setListError('Não foi possível carregar a lista de especificadores.')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    fetchArquitetos({
      tipo: filtroTipo || undefined,
      status_carteira: filtroStatus || undefined,
    })
  }, [filtroTipo, filtroStatus])
```

(A mensagem de erro também muda de "arquitetos" para "especificadores" — pega o texto que a Task 5 ainda não tinha coberto, já que está fora do JSX visual mas é texto exibido ao usuário.)

- [ ] **Step 2: Selects de filtro na toolbar**

Trocar o bloco da toolbar:

```javascript
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-1.5 flex-1 max-w-xs">
          <Search size={13} className="text-stone-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar especificador..."
            className="bg-transparent text-sm text-stone-700 outline-none w-full placeholder:text-stone-400"
          />
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary btn-sm gap-1.5 ml-auto">
          <Plus size={13} /> Novo Especificador
        </button>
      </div>
```

por:

```javascript
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-1.5 flex-1 max-w-xs">
          <Search size={13} className="text-stone-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar especificador..."
            className="bg-transparent text-sm text-stone-700 outline-none w-full placeholder:text-stone-400"
          />
        </div>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="input w-auto text-sm py-1.5">
          <option value="">Todos os tipos</option>
          {Object.entries(TIPO_ESPECIFICADOR_CONFIG).map(([value, cfg]) => (
            <option key={value} value={value}>{cfg.label}</option>
          ))}
        </select>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="input w-auto text-sm py-1.5">
          <option value="">Todos os status</option>
          {Object.entries(STATUS_CARTEIRA_CONFIG).map(([value, cfg]) => (
            <option key={value} value={value}>{cfg.label}</option>
          ))}
        </select>
        <button onClick={() => setShowModal(true)} className="btn-primary btn-sm gap-1.5 ml-auto">
          <Plus size={13} /> Novo Especificador
        </button>
      </div>
```

- [ ] **Step 3: Ajustar callback de save do modal e do drawer para refazer fetch com os filtros atuais**

Trocar:
```javascript
      <NovoArquitetoModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSaved={() => { setShowModal(false); fetchArquitetos() }}
      />
```
por:
```javascript
      <NovoArquitetoModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSaved={() => { setShowModal(false); fetchArquitetos({ tipo: filtroTipo || undefined, status_carteira: filtroStatus || undefined }) }}
      />
```

E no drawer:
```javascript
        <ArquitetoDrawer
          key={selected.id}
          arquiteto={selected}
          onClose={() => setSelected(null)}
          onUpdated={fetchArquitetos}
        />
```
por:
```javascript
        <ArquitetoDrawer
          key={selected.id}
          arquiteto={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => fetchArquitetos({ tipo: filtroTipo || undefined, status_carteira: filtroStatus || undefined })}
        />
```

- [ ] **Step 4: Verificar build**

Run: `cd frontend && npm run build && npm run lint`
Expected: ambos sem erro.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/arquitetos/ArquitetosPage.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add filtros de tipo e status da carteira na listagem de especificadores

GET /arquitetos/ ja aceitava tipo/status_carteira como query params
opcionais (backend); UI agora expoe os dois filtros na toolbar.
EOF
)"
```

---

## Task 7: `EspecificadoresKpiPanel` — componente compartilhado

**Files:**
- Create: `frontend/src/components/especificadores/EspecificadoresKpiPanel.jsx`
- Modify: `frontend/src/pages/arquitetos/ArquitetosPage.jsx` (usar o painel no topo)
- Modify: `frontend/src/pages/dashboard/DashboardPage.jsx` (usar o painel também)

**Interfaces:**
- Consumes: `arquitetosApi.kpis()`, `arquitetosApi.minhaMetaVisitas()` (Task 2); `useAuthStore` + `podeVerTudo` (`frontend/src/store/index.js`).
- Produces: `<EspecificadoresKpiPanel />` — componente sem props obrigatórias, usado por duas páginas. Renderiza um botão "Configurar metas" (só para `podeVerTudo`) que abre `MetasVisitasModal` (Task 8) — a Task 8 depende deste arquivo existir primeiro.

- [ ] **Step 1: Criar o componente**

Criar `frontend/src/components/especificadores/EspecificadoresKpiPanel.jsx`:

```javascript
import { useEffect, useState } from 'react'
import { Compass, TrendingUp, Target, MessageSquare, Building2, Settings } from 'lucide-react'
import { arquitetosApi } from '../../lib/api'
import { KpiCard, Spinner } from '../ui'
import { useAuthStore, podeVerTudo } from '../../store'
import MetasVisitasModal from '../../pages/arquitetos/MetasVisitasModal'

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

- [ ] **Step 2: Usar o painel em `ArquitetosPage.jsx`**

No topo do `return` de `ArquitetosPage` (antes do bloco `{listError && ...}`), adicionar o import:

```javascript
import EspecificadoresKpiPanel from '../../components/especificadores/EspecificadoresKpiPanel'
```

E inserir o painel logo no início do JSX retornado, antes de `{listError && (`:

```javascript
    <div className="p-6">
      <div className="mb-5">
        <EspecificadoresKpiPanel />
      </div>

      {listError && (
```

- [ ] **Step 3: Usar o painel em `DashboardPage.jsx`**

Adicionar o import no topo de `frontend/src/pages/dashboard/DashboardPage.jsx`:

```javascript
import EspecificadoresKpiPanel from '../../components/especificadores/EspecificadoresKpiPanel'
```

E inserir o componente logo após o bloco "KPIs principais" (depois do `</div>` que fecha o `grid grid-cols-2 md:grid-cols-4 gap-3`), antes do bloco "Funil de leads":

```javascript
      {/* KPIs da carteira de especificadores */}
      <EspecificadoresKpiPanel />

      {/* Funil de leads */}
```

- [ ] **Step 4: Este componente depende do arquivo da Task 8 — criar um stub temporário para não quebrar o build**

Como `EspecificadoresKpiPanel.jsx` importa `MetasVisitasModal` que só é criado na Task 8, criar aqui um stub mínimo em `frontend/src/pages/arquitetos/MetasVisitasModal.jsx`:

```javascript
export default function MetasVisitasModal() {
  return null
}
```

(A Task 8 substitui esse stub pela implementação real — isso mantém cada task buildável isoladamente, sem depender de reordenar a Task 8 para antes desta.)

- [ ] **Step 5: Verificar build**

Run: `cd frontend && npm run build && npm run lint`
Expected: ambos sem erro.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/especificadores/EspecificadoresKpiPanel.jsx frontend/src/pages/arquitetos/MetasVisitasModal.jsx frontend/src/pages/arquitetos/ArquitetosPage.jsx frontend/src/pages/dashboard/DashboardPage.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add EspecificadoresKpiPanel reaproveitado em Especificadores e Dashboard

GET /arquitetos/kpis (5 KpiCards) + GET /arquitetos/metas-visitas/me para
o vendedor logado ver "visitado X de Y". Gestao (podeVerTudo) ve um botao
"Configurar metas" (stub nesta task, implementado na Task 8).
EOF
)"
```

---

## Task 8: `MetasVisitasModal` — configuração de meta de visitas (gestão)

**Files:**
- Modify: `frontend/src/pages/arquitetos/MetasVisitasModal.jsx` (substitui o stub da Task 7)

**Interfaces:**
- Consumes: `arquitetosApi.listarMetasVisitas()`, `.definirMetaVisitas()` (Task 2); `usersApi.list()` (já existe em `api.js`, restrito a `DIRETORIA`/`GERENTE_COMERCIAL` no backend — compatível, pois este modal só é aberto por esses perfis).
- Produces: `<MetasVisitasModal open={bool} onClose={fn} />` — usado por `EspecificadoresKpiPanel` (Task 7).

- [ ] **Step 1: Implementar o modal**

Substituir todo o conteúdo de `frontend/src/pages/arquitetos/MetasVisitasModal.jsx`:

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
      const porConsultor = Object.fromEntries(m.data.map(x => [x.consultor_id, x.meta_visitas_mes]))
      setMetas(porConsultor)
    } catch (e) {
      console.error(e)
      setError('Não foi possível carregar vendedores e metas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) fetchTudo()
  }, [open])

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

- [ ] **Step 2: Verificar build**

Run: `cd frontend && npm run build && npm run lint`
Expected: ambos sem erro.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/arquitetos/MetasVisitasModal.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: implementar MetasVisitasModal (configuracao de meta por vendedor)

Substitui o stub da task anterior. Lista vendedores (usersApi.list(),
filtrado perfil=vendedor client-side) com input de meta mensal; salva
onBlur via PUT /arquitetos/metas-visitas (upsert por consultor_id).
EOF
)"
```

---

## Task 9: `InteracoesTabContent` — nova aba de interações no drawer

**Files:**
- Create: `frontend/src/pages/arquitetos/InteracoesTabContent.jsx`
- Modify: `frontend/src/pages/arquitetos/ArquitetosPage.jsx` (novo item em `DRAWER_TABS` + renderização condicional)

**Interfaces:**
- Consumes: `arquitetosApi.listarInteracoes(id)`, `.registrarInteracao(id, data)` (Task 2); `leadsApi.list()` (já existe, `LeadResponse.arquiteto_id` já existe no backend — filtragem client-side, sem mudança de backend).
- Produces: `<InteracoesTabContent arquitetoId={number} />` — usado só por `ArquitetoDrawer`.

- [ ] **Step 1: Criar o componente da aba**

Criar `frontend/src/pages/arquitetos/InteracoesTabContent.jsx`:

```javascript
import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import { arquitetosApi, leadsApi } from '../../lib/api'
import { Spinner } from '../../components/ui'
import { timeAgo } from '../../lib/constants'

const TIPOS = ['whatsapp', 'ligacao', 'email', 'visita', 'reuniao']

export default function InteracoesTabContent({ arquitetoId }) {
  const [interacoes, setInteracoes] = useState([])
  const [leadsDoEspecificador, setLeadsDoEspecificador] = useState([])
  const [loading, setLoading] = useState(true)
  const [tipo, setTipo] = useState('whatsapp')
  const [resumo, setResumo] = useState('')
  const [leadId, setLeadId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [error, setError] = useState('')

  const fetchInteracoes = () => arquitetosApi.listarInteracoes(arquitetoId).then(r => setInteracoes(r.data))

  useEffect(() => {
    Promise.all([
      fetchInteracoes(),
      leadsApi.list().then(r => setLeadsDoEspecificador(r.data.filter(l => l.arquiteto_id === arquitetoId))),
    ])
      .catch(e => { console.error(e); setError('Não foi possível carregar as interações.') })
      .finally(() => setLoading(false))
  }, [arquitetoId])

  const registrar = async () => {
    if (!resumo.trim()) return
    setSalvando(true)
    setError('')
    try {
      await arquitetosApi.registrarInteracao(arquitetoId, {
        tipo,
        resumo,
        lead_id: leadId ? Number(leadId) : null,
      })
      setResumo('')
      setLeadId('')
      await fetchInteracoes()
    } catch (e) {
      console.error(e)
      setError('Não foi possível registrar a interação.')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) return <div className="flex justify-center py-8"><Spinner size={24} /></div>

  return (
    <div className="flex flex-col h-full">
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      <div className="flex-1 space-y-3 mb-4">
        {interacoes.length === 0 ? (
          <p className="text-sm text-stone-300">Nenhuma interação registrada</p>
        ) : (
          interacoes.map(i => (
            <div key={i.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 flex-shrink-0">
                <User size={13} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-stone-600 capitalize">{i.tipo}</span>
                  <span className="text-2xs text-stone-300">{timeAgo(i.data)}</span>
                </div>
                <p className="text-sm text-stone-600 leading-relaxed">{i.resumo}</p>
                {i.lead_id && <p className="text-2xs text-primary-600 mt-0.5">Gerou lead #{i.lead_id}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2 border-t border-stone-100 pt-3">
        <div className="flex gap-2">
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="input text-xs py-1.5 w-28">
            {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          {leadsDoEspecificador.length > 0 && (
            <select value={leadId} onChange={e => setLeadId(e.target.value)} className="input text-xs py-1.5 flex-1">
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
        <button onClick={registrar} disabled={salvando || !resumo.trim()} className="btn-primary w-full justify-center">
          {salvando ? 'Registrando...' : 'Registrar interação'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Ligar a aba em `ArquitetosPage.jsx`**

Trocar `DRAWER_TABS`:

```javascript
const DRAWER_TABS = [
  { key: 'perfil', label: 'Perfil' },
  { key: 'score', label: 'Score' },
  { key: 'contatos', label: 'Decisores & Concorrentes' },
]
```

por:

```javascript
const DRAWER_TABS = [
  { key: 'perfil', label: 'Perfil' },
  { key: 'score', label: 'Score' },
  { key: 'contatos', label: 'Decisores & Concorrentes' },
  { key: 'interacoes', label: 'Interações' },
]
```

Adicionar o import no topo do arquivo:

```javascript
import InteracoesTabContent from './InteracoesTabContent'
```

E, dentro de `ArquitetoDrawer`, logo após o bloco `{tab === 'contatos' && (...)}`, adicionar:

```javascript
          {tab === 'interacoes' && (
            <InteracoesTabContent arquitetoId={atual.id} />
          )}
```

- [ ] **Step 3: Verificar build**

Run: `cd frontend && npm run build && npm run lint`
Expected: ambos sem erro.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/arquitetos/InteracoesTabContent.jsx frontend/src/pages/arquitetos/ArquitetosPage.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add aba de Interacoes no drawer de especificadores

Mesmo padrao visual do LeadDrawer (CRMPage.jsx) para InteracaoLead.
Select opcional de "Lead gerado" filtra leadsApi.list() no cliente por
arquiteto_id (LeadResponse ja expunha esse campo, sem mudanca de backend).
EOF
)"
```

---

## Task 10: Dono da carteira — exibição, reatribuição e histórico no drawer

**Files:**
- Modify: `frontend/src/pages/arquitetos/ArquitetosPage.jsx`

**Interfaces:**
- Consumes: `arquitetosApi.reatribuirDono(id, data)`, `.historicoDono(id)` (Task 2); `usersApi.list()`; `podeVerTudo` (`store/index.js`).
- Produces: nenhuma interface nova para outras tasks.

- [ ] **Step 1: Importar `usersApi` e `podeVerTudo`**

Trocar a linha de import de `api.js`:

```javascript
import { arquitetosApi } from '../../lib/api'
```
por:
```javascript
import { arquitetosApi, usersApi } from '../../lib/api'
```

E adicionar, junto aos demais imports do topo:

```javascript
import { useAuthStore, podeVerTudo } from '../../store'
```

- [ ] **Step 2: Estado de histórico + reatribuição dentro de `ArquitetoDrawer`**

Dentro de `ArquitetoDrawer`, logo após a declaração de `const [desativarError, setDesativarError] = useState('')`, adicionar:

```javascript
  const { user } = useAuthStore()
  const gestor = podeVerTudo(user?.perfil)

  const [historico, setHistorico] = useState([])
  const [historicoLoading, setHistoricoLoading] = useState(true)
  const [showReatribuir, setShowReatribuir] = useState(false)
  const [vendedores, setVendedores] = useState([])
  const [novoConsultorId, setNovoConsultorId] = useState('')
  const [reatribuindo, setReatribuindo] = useState(false)
  const [reatribuirError, setReatribuirError] = useState('')

  const fetchHistorico = () => {
    arquitetosApi.historicoDono(atual.id)
      .then(({ data }) => setHistorico(data))
      .catch(console.error)
      .finally(() => setHistoricoLoading(false))
  }

  useEffect(() => { fetchHistorico() }, [atual.id])

  const abrirReatribuir = async () => {
    setReatribuirError('')
    setShowReatribuir(true)
    if (vendedores.length === 0) {
      try {
        const { data } = await usersApi.list()
        setVendedores(data.filter(u => u.perfil === 'vendedor'))
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
      const { data } = await arquitetosApi.reatribuirDono(atual.id, { consultor_id: Number(novoConsultorId) })
      setAtual(data)
      setShowReatribuir(false)
      setNovoConsultorId('')
      fetchHistorico()
      onUpdated()
    } catch (err) {
      setReatribuirError(extractErrorMessage(err, 'Erro ao reatribuir dono'))
    } finally {
      setReatribuindo(false)
    }
  }
```

- [ ] **Step 3: Seção "Dono da carteira" + botão Reatribuir no bloco de visualização do Perfil**

No JSX de `ArquitetoDrawer`, dentro do bloco `tab === 'perfil' && (editing ? (...) : (` — na branch de **visualização** (`: (`), trocar:

```javascript
              <div className="space-y-4">
                <span className="badge badge-neutro">{atual.nivel_parceria}</span>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-stone-400">Telefone</p>
                    <p className="font-medium text-stone-700">{atual.telefone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-400">E-mail</p>
                    <p className="font-medium text-stone-700">{atual.email || '—'}</p>
                  </div>
                </div>
                {desativarError && (
                  <AlertBanner type="error" message={desativarError} onDismiss={() => setDesativarError('')} />
                )}
                <div className="flex gap-2 pt-2">
                  <button className="btn-secondary btn-sm" onClick={() => setEditing(true)}>Editar</button>
                  <button className="btn-danger btn-sm" onClick={() => setConfirmDesativar(true)}>Desativar</button>
                </div>
              </div>
```

por:

```javascript
              <div className="space-y-4">
                <span className="badge badge-neutro">{atual.nivel_parceria}</span>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-stone-400">Telefone</p>
                    <p className="font-medium text-stone-700">{atual.telefone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-400">E-mail</p>
                    <p className="font-medium text-stone-700">{atual.email || '—'}</p>
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Dono da carteira</p>
                    {gestor && (
                      <button className="btn-secondary btn-sm gap-1" onClick={abrirReatribuir}>
                        <ArrowRightLeft size={12} /> Reatribuir
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-stone-700 mb-3">{atual.consultor_nome || 'Sem dono definido'}</p>

                  <p className="text-2xs font-semibold text-stone-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <History size={11} /> Histórico de donos
                  </p>
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

                {desativarError && (
                  <AlertBanner type="error" message={desativarError} onDismiss={() => setDesativarError('')} />
                )}
                <div className="flex gap-2 pt-2">
                  <button className="btn-secondary btn-sm" onClick={() => setEditing(true)}>Editar</button>
                  <button className="btn-danger btn-sm" onClick={() => setConfirmDesativar(true)}>Desativar</button>
                </div>
              </div>
```

- [ ] **Step 4: Modal de reatribuição + `timeAgo` no import de `constants.js`**

Trocar a linha de import de `constants.js` (já modificada na Task 5) para incluir `timeAgo`:

```javascript
import { STATUS_COLOR_CLASSES, SEGMENTO_CONFIG, FLAG_CONFIG, TIPO_ESPECIFICADOR_CONFIG, STATUS_CARTEIRA_CONFIG, timeAgo } from '../../lib/constants'
```

Adicionar o modal de reatribuição no final do JSX retornado por `ArquitetoDrawer`, logo antes do `<ConfirmDialog ... title="Desativar arquiteto" ... />` já existente:

```javascript
        <Modal open={showReatribuir} onClose={() => setShowReatribuir(false)} title="Reatribuir dono da carteira" size="sm">
          {reatribuirError && <div className="mb-3"><AlertBanner type="error" message={reatribuirError} onDismiss={() => setReatribuirError('')} /></div>}
          <label className="label">Novo consultor</label>
          <select value={novoConsultorId} onChange={e => setNovoConsultorId(e.target.value)} className="input mb-4">
            <option value="">Selecione um vendedor...</option>
            {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
          </select>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn-sm" onClick={() => setShowReatribuir(false)}>Cancelar</button>
            <button className="btn-primary btn-sm" disabled={!novoConsultorId || reatribuindo} onClick={confirmarReatribuir}>
              {reatribuindo ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </Modal>

        <ConfirmDialog
          open={confirmDesativar}
```

(A última linha mostrada — `<ConfirmDialog open={confirmDesativar}` — já existe no arquivo; a edição só insere o `<Modal>` novo logo acima dela.)

- [ ] **Step 5: Verificar build**

Run: `cd frontend && npm run build && npm run lint`
Expected: ambos sem erro.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/arquitetos/ArquitetosPage.jsx
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add reatribuicao de dono e historico no drawer de especificadores

Aba Perfil mostra o dono atual (consultor_nome) para qualquer usuario e,
so para DIRETORIA/GERENTE_COMERCIAL (podeVerTudo), botao "Reatribuir" que
abre modal de selecao de vendedor. Historico de donos e somente-leitura,
visivel para todos (spec secao 4).
EOF
)"
```

---

## Task 11: Verificação final

**Files:** nenhum (só validação).

- [ ] **Step 1: Build e lint completos**

Run: `cd frontend && npm run build && npm run lint`
Expected: ambos sem erro, nenhum warning de import não usado sobrando.

- [ ] **Step 2: Suíte de backend completa (garantir que a Task 1 não quebrou nada)**

Run: `cd backend && python -m pytest -q`
Expected: PASS — 133 testes.

- [ ] **Step 3: Checklist de verificação manual (usuário, localmente — sem Postgres/browser neste sandbox)**

Rodar localmente (`uvicorn` + `npm run dev`, conforme `CLAUDE.md`) e confirmar, um por um:

- [ ] Sidebar mostra "Especificadores" (não "Arquitetos"); título da página também.
- [ ] Cadastro: campo "Tipo" é obrigatório (tentar submeter vazio deve bloquear no client, `required` do `<select>`); "Especialidade" é opcional.
- [ ] Card da listagem mostra badge de tipo, badge de status da carteira e "Sem dono definido" para um especificador novo.
- [ ] Filtro por tipo e por status da carteira funcionam na listagem.
- [ ] Painel de KPIs aparece no topo da tela de Especificadores **e** no Dashboard, com os mesmos números.
- [ ] Login como `vendedor@lidermoveis.com.br`: painel de KPIs mostra "Sua meta de visitas este mês: X de Y" (sem botão "Configurar metas").
- [ ] Login como `admin@plannit.com.br` (diretoria): botão "Configurar metas" abre modal, lista vendedores, salvar um valor persiste (reabrir modal mostra o valor salvo).
- [ ] Diretoria/gerente: no drawer, botão "Reatribuir" visível e funcional; após reatribuir, "Histórico de donos" mostra a entrada nova.
- [ ] Vendedor: no drawer, dono da carteira visível, mas **sem** botão "Reatribuir".
- [ ] Aba "Interações": registrar uma interação tipo "visita" e outra tipo "ligação" vinculada a um lead — lead aparece como "Gerou lead #N" na lista.
- [ ] Recarregar a página do zero (F5) em `/arquitetos` e `/dashboard` — nenhum erro no console do navegador.

- [ ] **Step 4: Reportar ao usuário**

Se algum item da checklist falhar, criar um fix específico antes de considerar o plano concluído — não commitar workarounds silenciosos. Se tudo passar, este plano está completo; próximo passo natural é `/code-review` no range `cb00cc3..HEAD` (backend Task 1 + todas as tasks de frontend).
