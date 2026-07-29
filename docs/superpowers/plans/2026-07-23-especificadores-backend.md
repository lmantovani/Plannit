# Especificadores — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o backend do módulo Especificadores (evolução do módulo Arquitetos) conforme `docs/superpowers/specs/2026-07-16-especificadores-design.md`: campo `tipo`/`especialidade`, dono da carteira com histórico e notificação, registro de interações, painel de KPIs, flag de especificador esfriando, e meta de visitas configurável.

**Architecture:** Extensão do módulo `arquitetos` existente (`app/models/crm.py`, `app/schemas/crm.py`, `app/api/v1/endpoints/arquitetos.py`, `app/services/arquiteto_score.py`). Nenhum rename técnico — só o spec de UI (plano separado de frontend) muda texto visível. Não há Alembic versionado neste repo (confirmado: `seed.py` usa `Base.metadata.create_all`, `alembic/versions/` está vazio e nunca foi commitado) — mudanças de schema não exigem migration nesta fase local/demo.

**Tech Stack:** FastAPI, SQLAlchemy 2.0, Pydantic v2, pytest + SQLite in-memory (via `tests/conftest.py`).

## Global Constraints

- Todo endpoint novo segue o padrão já estabelecido em `arquitetos.py`: `response_model` Pydantic com `Config.from_attributes = True`, não serialização manual em dict (a nota do CLAUDE.md sobre "serialização manual" está desatualizada — o módulo Arquitetos real usa response_model).
- Rotas fixas (`/kpis`, `/metas-visitas`, `/metas-visitas/me`) DEVEM ser declaradas antes de `GET /{arquiteto_id}` no arquivo, senão o FastAPI tenta casar `"kpis"` como `arquiteto_id: int` primeiro.
- `consultor_id` do `Arquiteto` só pode ser alterado via `PATCH /arquitetos/{id}/dono` — nunca deve fazer parte do schema `ArquitetoUpdate` usado no PATCH genérico.
- **Desvio deliberado do spec, seção 7 (esfriando):** o spec pede "dispara notificação" com checagem periódica. Este projeto não tem nenhum motor de notificação (nenhum `Notificacao` é inserido em lugar nenhum do código hoje, não há endpoint de listagem de notificações, não há cron/scheduler) — o próprio CLAUDE.md já registra isso como "motor pendente Fase 2". RN016 (`projeto_parado`), que o spec cita como precedente, também não insere `Notificacao`: é um flag calculado em tempo de consulta no dashboard. Este plano implementa a seção 7 no mesmo padrão real do RN016 — como flag calculado (`especificador_esfriando`) devolvido pelo endpoint de score existente — e NÃO cria linhas em `Notificacao` nem job periódico. Se o usuário quiser o motor de notificação de verdade, isso é um plano à parte.
- Seção 4 (reatribuição de dono) É diferente: é um evento único disparado por uma ação explícita do usuário (clicar "Reatribuir"), não uma checagem periódica — por isso aqui SIM inserimos uma linha em `Notificacao` na hora do PATCH. Ela ficará no banco sem UI para exibi-la ainda (não existe tela de notificações no frontend) — isso é esperado e consistente com o resto do projeto.
- `seed.py` não cria nenhum registro de `Arquiteto` hoje — nenhuma tarefa deste plano precisa tocar em `seed.py`.

---

## Task 1: Commit dos models já implementados

Os models desta feature já foram escritos numa sessão anterior e estão no working tree sem commit, na branch `feature/especificadores`. Antes de continuar, precisamos confirmar que não quebram nada e commitá-los como ponto de partida limpo.

**Files:**
- Modify (já modificado, sem commit): `backend/app/models/crm.py`
- Modify (já modificado, sem commit): `backend/app/models/notificacao.py`
- Modify (já modificado, sem commit): `backend/app/models/__init__.py`

**Interfaces:**
- Produces (já existentes no working tree, usados pelas tasks seguintes):
  - `app.models.crm.TipoEspecificador` (enum: `ARQUITETO`, `DESIGNER_INTERIORES`, `DECORADOR`, `ENGENHEIRO`)
  - `app.models.crm.StatusCarteiraEspecificador` (enum: `ATIVO`, `EM_PROSPECCAO`, `INATIVO`)
  - `app.models.crm.Arquiteto.tipo`, `.especialidade`, `.consultor_id`, `.status_carteira`
  - `app.models.crm.HistoricoDonoArquiteto` (`arquiteto_id`, `consultor_anterior_id`, `consultor_novo_id`, `alterado_por_id`, `alterado_em`)
  - `app.models.crm.InteracaoArquiteto` (`arquiteto_id`, `responsavel_id`, `tipo`, `resumo`, `lead_id`, `data`)
  - `app.models.crm.MetaVisitasConsultor` (`consultor_id`, `meta_visitas_mes`, `configurado_por_id`, `atualizado_em`)
  - `app.models.notificacao.TipoNotificacao.ESPECIFICADOR_TRANSFERIDO`
  - `app.models.notificacao.Notificacao.arquiteto_id`

- [ ] **Step 1: Rodar a suíte de testes completa para confirmar que os models novos não quebram nada existente**

Run: `cd backend && python -m pytest -q`
Expected: todos os testes existentes passam (nenhum teste novo ainda cobre os campos novos — isso é esperado, eles serão adicionados nas próximas tasks).

- [ ] **Step 2: Conferir o diff manualmente**

Run: `git diff -- app/models/__init__.py app/models/crm.py app/models/notificacao.py`
Expected: as mudanças batem com a descrição da seção "Interfaces" acima (enums `TipoEspecificador`/`StatusCarteiraEspecificador`, colunas novas em `Arquiteto`, models `HistoricoDonoArquiteto`/`InteracaoArquiteto`/`MetaVisitasConsultor`, `TipoNotificacao.ESPECIFICADOR_TRANSFERIDO`, `Notificacao.arquiteto_id`).

- [ ] **Step 3: Commit**

```bash
git add backend/app/models/__init__.py backend/app/models/crm.py backend/app/models/notificacao.py
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add especificadores models (tipo, dono da carteira, interacoes, metas)

Base de dados para o modulo Especificadores (evolucao do Arquitetos):
TipoEspecificador/StatusCarteiraEspecificador, HistoricoDonoArquiteto,
InteracaoArquiteto, MetaVisitasConsultor e o tipo de notificacao de
transferencia de dono.
EOF
)"
```

---

## Task 2: Campo `tipo`/`especialidade`/`status_carteira` — schemas e endpoints

**Files:**
- Modify: `backend/app/schemas/crm.py`
- Modify: `backend/app/api/v1/endpoints/arquitetos.py`
- Modify: `backend/tests/test_arquitetos_decisores.py` (helper `_criar_arquiteto` quebra sem `tipo`)
- Modify: `backend/tests/test_arquitetos_concorrentes.py` (idem)
- Create: `backend/tests/test_arquitetos_tipo_carteira.py`

**Interfaces:**
- Consumes: `TipoEspecificador`, `StatusCarteiraEspecificador` de `app.models.crm` (Task 1).
- Produces:
  - `ArquitetoCreate(nome, escritorio, telefone, email, nivel_parceria, tipo, especialidade)` — `tipo` obrigatório.
  - `ArquitetoUpdate(nome, escritorio, telefone, email, nivel_parceria, tipo, especialidade, status_carteira)` — todos opcionais, SEM `consultor_id`.
  - `ArquitetoResponse` ganha `tipo`, `especialidade`, `consultor_id`, `status_carteira`.
  - `GET /arquitetos/` ganha query params opcionais `tipo`, `status_carteira`, `consultor_id`.
  - `PATCH /arquitetos/{id}` passa a usar `ArquitetoUpdate` (antes usava `ArquitetoCreate`, o que tornaria `tipo` obrigatório também no update — bug que esta task corrige).

- [ ] **Step 1: Escrever o teste que falha — POST exige tipo, filtro por tipo funciona**

Criar `backend/tests/test_arquitetos_tipo_carteira.py`:

```python
def test_criar_arquiteto_sem_tipo_falha_422(auth_client):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": "Sem Tipo"})
    assert resp.status_code == 422


def test_criar_arquiteto_com_tipo(auth_client):
    resp = auth_client.post(
        "/api/v1/arquitetos/",
        json={"nome": "Ana Designer", "tipo": "designer_interiores", "especialidade": "interiores comerciais"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["tipo"] == "designer_interiores"
    assert data["especialidade"] == "interiores comerciais"
    assert data["status_carteira"] == "em_prospeccao"
    assert data["consultor_id"] is None


def test_filtro_por_tipo(auth_client):
    auth_client.post("/api/v1/arquitetos/", json={"nome": "Arq 1", "tipo": "arquiteto"})
    auth_client.post("/api/v1/arquitetos/", json={"nome": "Dec 1", "tipo": "decorador"})

    resp = auth_client.get("/api/v1/arquitetos/", params={"tipo": "decorador"})
    assert resp.status_code == 200
    nomes = [a["nome"] for a in resp.json()]
    assert nomes == ["Dec 1"]


def test_filtro_por_status_carteira(auth_client):
    criado = auth_client.post(
        "/api/v1/arquitetos/", json={"nome": "Prospeccao", "tipo": "arquiteto"}
    ).json()
    auth_client.patch(f"/api/v1/arquitetos/{criado['id']}", json={"status_carteira": "ativo"})
    auth_client.post("/api/v1/arquitetos/", json={"nome": "Ainda Prospeccao", "tipo": "arquiteto"})

    resp = auth_client.get("/api/v1/arquitetos/", params={"status_carteira": "ativo"})
    assert resp.status_code == 200
    nomes = [a["nome"] for a in resp.json()]
    assert nomes == ["Prospeccao"]


def test_patch_generico_nao_altera_consultor_id(auth_client):
    criado = auth_client.post(
        "/api/v1/arquitetos/", json={"nome": "Teste", "tipo": "arquiteto"}
    ).json()

    resp = auth_client.patch(f"/api/v1/arquitetos/{criado['id']}", json={"consultor_id": 999})
    assert resp.status_code == 200
    assert resp.json()["consultor_id"] is None


def test_patch_sem_tipo_nao_falha(auth_client):
    """Regressão: antes desta task, PATCH usava ArquitetoCreate e exigia tipo mesmo em update parcial."""
    criado = auth_client.post(
        "/api/v1/arquitetos/", json={"nome": "Teste", "tipo": "arquiteto"}
    ).json()

    resp = auth_client.patch(f"/api/v1/arquitetos/{criado['id']}", json={"escritorio": "Novo Escritório"})
    assert resp.status_code == 200
    assert resp.json()["escritorio"] == "Novo Escritório"
    assert resp.json()["tipo"] == "arquiteto"
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/test_arquitetos_tipo_carteira.py -v`
Expected: FAIL — `422` porque `ArquitetoCreate` ainda não tem `tipo`, e os demais testes falham por `KeyError`/schema ausente.

- [ ] **Step 3: Atualizar `app/schemas/crm.py`**

No topo do arquivo, trocar o import:

```python
from app.models.crm import (
    OrigemLead, StatusFunil, TipoCliente,
    TipoEspecificador, StatusCarteiraEspecificador,
)
```

Substituir o bloco `# === ARQUITETO ===` inteiro por:

```python
# === ARQUITETO ===

class ArquitetoCreate(BaseModel):
    nome: str
    escritorio: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    nivel_parceria: str = "parceiro"
    tipo: TipoEspecificador
    especialidade: Optional[str] = None


class ArquitetoUpdate(BaseModel):
    nome: Optional[str] = None
    escritorio: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    nivel_parceria: Optional[str] = None
    tipo: Optional[TipoEspecificador] = None
    especialidade: Optional[str] = None
    status_carteira: Optional[StatusCarteiraEspecificador] = None


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
    status_carteira: StatusCarteiraEspecificador
    is_active: bool

    class Config:
        from_attributes = True
```

- [ ] **Step 4: Atualizar `app/api/v1/endpoints/arquitetos.py`**

Trocar o import de models e schemas no topo:

```python
from app.models.crm import Arquiteto, DecisorArquiteto, ConcorrenteArquiteto, TipoEspecificador, StatusCarteiraEspecificador
from app.schemas.crm import (
    ArquitetoCreate, ArquitetoUpdate, ArquitetoResponse,
    DecisorArquitetoCreate, DecisorArquitetoResponse,
    ConcorrenteArquitetoCreate, ConcorrenteArquitetoResponse,
    ArquitetoScoreResponse,
)
```

Substituir a função `listar_arquitetos` por:

```python
@router.get("/", response_model=List[ArquitetoResponse])
def listar_arquitetos(
    nivel_parceria: Optional[str] = None,
    tipo: Optional[TipoEspecificador] = None,
    status_carteira: Optional[StatusCarteiraEspecificador] = None,
    consultor_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Arquiteto).filter(Arquiteto.is_active == True)
    if nivel_parceria:
        query = query.filter(Arquiteto.nivel_parceria == nivel_parceria)
    if tipo:
        query = query.filter(Arquiteto.tipo == tipo)
    if status_carteira:
        query = query.filter(Arquiteto.status_carteira == status_carteira)
    if consultor_id:
        query = query.filter(Arquiteto.consultor_id == consultor_id)
    return query.order_by(Arquiteto.nome).offset(skip).limit(limit).all()
```

Substituir a assinatura de `atualizar_arquiteto` (só o parâmetro `payload` muda de tipo):

```python
@router.patch("/{arquiteto_id}", response_model=ArquitetoResponse)
def atualizar_arquiteto(
    arquiteto_id: int,
    payload: ArquitetoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.RECEPCAO
    )),
):
```

(o corpo da função continua igual — `payload.model_dump(exclude_unset=True)` já ignora campos não enviados, e como `ArquitetoUpdate` não tem `consultor_id`, esse campo nunca pode ser setado por aqui.)

- [ ] **Step 5: Corrigir os testes existentes que quebram com `tipo` obrigatório**

Em `backend/tests/test_arquitetos_decisores.py` e `backend/tests/test_arquitetos_concorrentes.py`, trocar a primeira linha do corpo de `_criar_arquiteto`:

De:
```python
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": nome})
```
Para:
```python
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": nome, "tipo": "arquiteto"})
```

- [ ] **Step 6: Rodar a suíte completa**

Run: `cd backend && python -m pytest -q`
Expected: PASS — todos os testes, incluindo os novos e os dois arquivos corrigidos.

- [ ] **Step 7: Commit**

```bash
git add backend/app/schemas/crm.py backend/app/api/v1/endpoints/arquitetos.py backend/tests/test_arquitetos_decisores.py backend/tests/test_arquitetos_concorrentes.py backend/tests/test_arquitetos_tipo_carteira.py
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: require tipo on arquiteto create, add filtros e ArquitetoUpdate

tipo passa a ser obrigatorio no cadastro; GET /arquitetos/ ganha filtros
opcionais de tipo/status_carteira/consultor_id; PATCH generico passa a usar
um schema proprio (ArquitetoUpdate) sem consultor_id, que so pode ser
alterado via endpoint dedicado de reatribuicao de dono.
EOF
)"
```

---

## Task 3: Dono da carteira — reatribuição, histórico e notificação

**Files:**
- Modify: `backend/app/schemas/crm.py`
- Modify: `backend/app/api/v1/endpoints/arquitetos.py`
- Create: `backend/tests/test_arquitetos_dono.py`

**Interfaces:**
- Consumes: `HistoricoDonoArquiteto` (Task 1), `TipoNotificacao.ESPECIFICADOR_TRANSFERIDO` + `Notificacao` (Task 1), `ArquitetoResponse` (Task 2).
- Produces:
  - `ArquitetoDonoUpdate(consultor_id: int)`
  - `HistoricoDonoResponse(id, arquiteto_id, consultor_anterior_id, consultor_anterior_nome, consultor_novo_id, consultor_novo_nome, alterado_por_id, alterado_por_nome, alterado_em)`
  - `PATCH /arquitetos/{arquiteto_id}/dono` → `ArquitetoResponse` (roles `DIRETORIA`, `GERENTE_COMERCIAL`)
  - `GET /arquitetos/{arquiteto_id}/historico-dono` → `List[HistoricoDonoResponse]` (qualquer autenticado)

- [ ] **Step 1: Escrever o teste que falha**

Criar `backend/tests/test_arquitetos_dono.py`:

```python
from app.core.security import get_password_hash
from app.models.user import User, PerfilUsuario
from app.models.notificacao import Notificacao, TipoNotificacao


def _criar_arquiteto(auth_client, nome="Ana Arquiteta"):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": nome, "tipo": "arquiteto"})
    assert resp.status_code == 201
    return resp.json()


def _criar_vendedor(db_session, nome="Vendedor Teste", email="vendedor.dono@plannit.com.br"):
    user = User(
        nome=nome, email=email,
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.VENDEDOR, is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_reatribuir_dono_sucesso(auth_client, db_session):
    arquiteto = _criar_arquiteto(auth_client)
    vendedor = _criar_vendedor(db_session)

    resp = auth_client.patch(
        f"/api/v1/arquitetos/{arquiteto['id']}/dono",
        json={"consultor_id": vendedor.id},
    )

    assert resp.status_code == 200
    assert resp.json()["consultor_id"] == vendedor.id


def test_reatribuir_dono_cria_historico(auth_client, db_session):
    arquiteto = _criar_arquiteto(auth_client)
    vendedor1 = _criar_vendedor(db_session, "Vendedor 1", "v1@plannit.com.br")
    vendedor2 = _criar_vendedor(db_session, "Vendedor 2", "v2@plannit.com.br")

    auth_client.patch(f"/api/v1/arquitetos/{arquiteto['id']}/dono", json={"consultor_id": vendedor1.id})
    auth_client.patch(f"/api/v1/arquitetos/{arquiteto['id']}/dono", json={"consultor_id": vendedor2.id})

    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/historico-dono")
    assert resp.status_code == 200
    historico = resp.json()
    assert len(historico) == 2
    # mais recente primeiro
    assert historico[0]["consultor_novo_id"] == vendedor2.id
    assert historico[0]["consultor_anterior_id"] == vendedor1.id
    assert historico[0]["consultor_novo_nome"] == "Vendedor 2"
    assert historico[1]["consultor_anterior_id"] is None
    assert historico[1]["consultor_novo_id"] == vendedor1.id


def test_reatribuir_dono_dispara_notificacao(auth_client, db_session):
    arquiteto = _criar_arquiteto(auth_client)
    vendedor = _criar_vendedor(db_session)

    auth_client.patch(f"/api/v1/arquitetos/{arquiteto['id']}/dono", json={"consultor_id": vendedor.id})

    notificacao = (
        db_session.query(Notificacao)
        .filter(Notificacao.tipo == TipoNotificacao.ESPECIFICADOR_TRANSFERIDO)
        .first()
    )
    assert notificacao is not None
    assert notificacao.destinatario_id == vendedor.id
    assert notificacao.arquiteto_id == arquiteto["id"]


def test_reatribuir_dono_consultor_invalido_400(auth_client):
    arquiteto = _criar_arquiteto(auth_client)

    resp = auth_client.patch(f"/api/v1/arquitetos/{arquiteto['id']}/dono", json={"consultor_id": 9999})
    assert resp.status_code == 400


def test_reatribuir_dono_bloqueado_403(auth_client, create_client_com_user, projetista_user, db_session):
    arquiteto = _criar_arquiteto(auth_client)
    vendedor = _criar_vendedor(db_session)

    projetista_client = create_client_com_user(projetista_user)
    resp = projetista_client.patch(
        f"/api/v1/arquitetos/{arquiteto['id']}/dono",
        json={"consultor_id": vendedor.id},
    )
    assert resp.status_code == 403
```

Remover o teste `test_reatribuir_dono_bloqueado_para_perfil_sem_permissao` acima antes de rodar — ele foi um rascunho de raciocínio, não um teste válido (deixado por engano). Ficar só com os outros cinco testes do arquivo.

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/test_arquitetos_dono.py -v`
Expected: FAIL — `404 Not Found` nos PATCH/GET de `/dono` e `/historico-dono`, que ainda não existem.

- [ ] **Step 3: Adicionar os schemas em `app/schemas/crm.py`**

Logo após a classe `ArquitetoResponse` (ainda dentro da seção `# === ARQUITETO ===`), adicionar:

```python
class ArquitetoDonoUpdate(BaseModel):
    consultor_id: int


class HistoricoDonoResponse(BaseModel):
    id: int
    arquiteto_id: int
    consultor_anterior_id: Optional[int]
    consultor_anterior_nome: Optional[str]
    consultor_novo_id: int
    consultor_novo_nome: str
    alterado_por_id: Optional[int]
    alterado_por_nome: Optional[str]
    alterado_em: datetime
```

- [ ] **Step 4: Implementar os endpoints em `app/api/v1/endpoints/arquitetos.py`**

Adicionar aos imports do topo do arquivo:

```python
from app.models.notificacao import Notificacao, TipoNotificacao
from app.models.crm import HistoricoDonoArquiteto
from app.schemas.crm import ArquitetoDonoUpdate, HistoricoDonoResponse
```

(a segunda linha soma à importação de `app.models.crm` já existente — pode juntar num único `from app.models.crm import (...)` se preferir; mantenha o restante da lista de nomes já importados.)

Adicionar logo depois da função `obter_arquiteto` (antes de `atualizar_arquiteto`):

```python
@router.patch("/{arquiteto_id}/dono", response_model=ArquitetoResponse)
def reatribuir_dono(
    arquiteto_id: int,
    payload: ArquitetoDonoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL
    )),
):
    arquiteto = _get_arquiteto_ou_404(arquiteto_id, db)

    novo_consultor = db.query(User).filter(User.id == payload.consultor_id, User.is_active == True).first()
    if not novo_consultor:
        raise HTTPException(400, "Consultor inválido")

    consultor_anterior_id = arquiteto.consultor_id
    arquiteto.consultor_id = payload.consultor_id

    db.add(HistoricoDonoArquiteto(
        arquiteto_id=arquiteto.id,
        consultor_anterior_id=consultor_anterior_id,
        consultor_novo_id=payload.consultor_id,
        alterado_por_id=current_user.id,
    ))
    db.add(Notificacao(
        tipo=TipoNotificacao.ESPECIFICADOR_TRANSFERIDO,
        titulo="Novo especificador na sua carteira",
        mensagem=f"Você recebeu {arquiteto.nome} ({arquiteto.tipo.value}) na sua carteira.",
        destinatario_id=payload.consultor_id,
        arquiteto_id=arquiteto.id,
    ))

    db.commit()
    db.refresh(arquiteto)
    return arquiteto


@router.get("/{arquiteto_id}/historico-dono", response_model=List[HistoricoDonoResponse])
def historico_dono(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_arquiteto_ou_404(arquiteto_id, db)
    registros = (
        db.query(HistoricoDonoArquiteto)
        .filter(HistoricoDonoArquiteto.arquiteto_id == arquiteto_id)
        .order_by(HistoricoDonoArquiteto.alterado_em.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "arquiteto_id": r.arquiteto_id,
            "consultor_anterior_id": r.consultor_anterior_id,
            "consultor_anterior_nome": r.consultor_anterior.nome if r.consultor_anterior else None,
            "consultor_novo_id": r.consultor_novo_id,
            "consultor_novo_nome": r.consultor_novo.nome,
            "alterado_por_id": r.alterado_por_id,
            "alterado_por_nome": r.alterado_por.nome if r.alterado_por else None,
            "alterado_em": r.alterado_em,
        }
        for r in registros
    ]
```

- [ ] **Step 5: Rodar a suíte completa**

Run: `cd backend && python -m pytest -q`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/app/schemas/crm.py backend/app/api/v1/endpoints/arquitetos.py backend/tests/test_arquitetos_dono.py
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add endpoint de reatribuicao de dono da carteira de especificadores

PATCH /arquitetos/{id}/dono (DIRETORIA/GERENTE_COMERCIAL) registra a troca
em HistoricoDonoArquiteto (imutavel) e notifica o novo consultor. GET
/arquitetos/{id}/historico-dono lista o historico completo.
EOF
)"
```

---

## Task 4: Registro de interações com especificador

**Files:**
- Modify: `backend/app/schemas/crm.py`
- Modify: `backend/app/api/v1/endpoints/arquitetos.py`
- Create: `backend/tests/test_arquitetos_interacoes.py`

**Interfaces:**
- Consumes: `InteracaoArquiteto` (Task 1).
- Produces:
  - `InteracaoArquitetoCreate(tipo: str, resumo: str, lead_id: Optional[int])`
  - `InteracaoArquitetoResponse(id, arquiteto_id, responsavel_id, tipo, resumo, lead_id, data)`
  - `GET /arquitetos/{arquiteto_id}/interacoes` → `List[InteracaoArquitetoResponse]` (qualquer autenticado)
  - `POST /arquitetos/{arquiteto_id}/interacoes` → `InteracaoArquitetoResponse` (qualquer autenticado — mesmo padrão de `POST /leads/{id}/interacoes`, já que quem registra a visita/ligação é o próprio consultor, não um perfil de gestão)

- [ ] **Step 1: Escrever o teste que falha**

Criar `backend/tests/test_arquitetos_interacoes.py`:

```python
def _criar_arquiteto(auth_client, nome="Ana Arquiteta"):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": nome, "tipo": "arquiteto"})
    assert resp.status_code == 201
    return resp.json()


def test_listar_interacoes_vazio(auth_client):
    arquiteto = _criar_arquiteto(auth_client)
    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/interacoes")
    assert resp.status_code == 200
    assert resp.json() == []


def test_registrar_interacao(auth_client):
    arquiteto = _criar_arquiteto(auth_client)

    resp = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/interacoes",
        json={"tipo": "visita", "resumo": "Visita ao escritório para apresentar portfólio"},
    )

    assert resp.status_code == 201
    data = resp.json()
    assert data["tipo"] == "visita"
    assert data["arquiteto_id"] == arquiteto["id"]
    assert data["lead_id"] is None
    assert data["responsavel_id"] is not None


def test_registrar_interacao_com_lead_gerado(auth_client):
    arquiteto = _criar_arquiteto(auth_client)
    lead = auth_client.post(
        "/api/v1/leads/",
        json={"nome": "Cliente Indicado", "telefone": "11999990000", "arquiteto_id": arquiteto["id"]},
    ).json()

    resp = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/interacoes",
        json={"tipo": "ligacao", "resumo": "Indicou um cliente novo", "lead_id": lead["id"]},
    )

    assert resp.status_code == 201
    assert resp.json()["lead_id"] == lead["id"]


def test_registrar_interacao_arquiteto_inexistente_404(auth_client):
    resp = auth_client.post(
        "/api/v1/arquitetos/9999/interacoes",
        json={"tipo": "email", "resumo": "Teste"},
    )
    assert resp.status_code == 404


def test_listar_interacoes_ordem_mais_recente_primeiro(auth_client):
    arquiteto = _criar_arquiteto(auth_client)
    auth_client.post(f"/api/v1/arquitetos/{arquiteto['id']}/interacoes", json={"tipo": "email", "resumo": "Primeira"})
    auth_client.post(f"/api/v1/arquitetos/{arquiteto['id']}/interacoes", json={"tipo": "whatsapp", "resumo": "Segunda"})

    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/interacoes")
    resumos = [i["resumo"] for i in resp.json()]
    assert resumos == ["Segunda", "Primeira"]
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/test_arquitetos_interacoes.py -v`
Expected: FAIL — `404 Not Found`, rotas ainda não existem.

- [ ] **Step 3: Adicionar os schemas em `app/schemas/crm.py`**

Logo após a seção `# === CONCORRENTE ARQUITETO ===` (antes de `# === SCORE DO ARQUITETO ===`), adicionar:

```python
# === INTERAÇÃO COM ARQUITETO/ESPECIFICADOR ===

class InteracaoArquitetoCreate(BaseModel):
    tipo: str  # ligacao | whatsapp | email | visita | reuniao
    resumo: str
    lead_id: Optional[int] = None


class InteracaoArquitetoResponse(BaseModel):
    id: int
    arquiteto_id: int
    responsavel_id: int
    tipo: str
    resumo: str
    lead_id: Optional[int]
    data: datetime

    class Config:
        from_attributes = True
```

- [ ] **Step 4: Implementar os endpoints em `app/api/v1/endpoints/arquitetos.py`**

Adicionar aos imports: `InteracaoArquiteto` em `app.models.crm`, `InteracaoArquitetoCreate, InteracaoArquitetoResponse` em `app.schemas.crm`.

Adicionar no final do arquivo, depois do bloco `# === CONCORRENTES ===`:

```python
# === INTERAÇÕES ===

@router.get("/{arquiteto_id}/interacoes", response_model=List[InteracaoArquitetoResponse])
def listar_interacoes_arquiteto(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_arquiteto_ou_404(arquiteto_id, db)
    return (
        db.query(InteracaoArquiteto)
        .filter(InteracaoArquiteto.arquiteto_id == arquiteto_id)
        .order_by(InteracaoArquiteto.data.desc())
        .all()
    )


@router.post("/{arquiteto_id}/interacoes", response_model=InteracaoArquitetoResponse, status_code=201)
def registrar_interacao_arquiteto(
    arquiteto_id: int,
    payload: InteracaoArquitetoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_arquiteto_ou_404(arquiteto_id, db)
    interacao = InteracaoArquiteto(
        arquiteto_id=arquiteto_id,
        responsavel_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(interacao)
    db.commit()
    db.refresh(interacao)
    return interacao
```

- [ ] **Step 5: Rodar a suíte completa**

Run: `cd backend && python -m pytest -q`
Expected: PASS. (Se `test_registrar_interacao_com_lead_gerado` falhar por causa do endpoint de leads, conferir o payload mínimo exigido por `LeadCreate` em `app/schemas/crm.py` — `nome` e `telefone` são obrigatórios, o resto é opcional.)

- [ ] **Step 6: Commit**

```bash
git add backend/app/schemas/crm.py backend/app/api/v1/endpoints/arquitetos.py backend/tests/test_arquitetos_interacoes.py
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add registro de interacoes com especificador

GET/POST /arquitetos/{id}/interacoes, mesmo padrao de InteracaoLead —
qualquer usuario autenticado registra (quem visita/liga geralmente e o
proprio consultor). Campo lead_id opcional rastreia quando a interacao
gerou um lead novo.
EOF
)"
```

---

## Task 5: Painel de KPIs da carteira

**Files:**
- Modify: `backend/app/schemas/crm.py`
- Modify: `backend/app/api/v1/endpoints/arquitetos.py`
- Create: `backend/tests/test_arquitetos_kpis.py`

**Interfaces:**
- Consumes: `Arquiteto`, `InteracaoArquiteto` (Task 1/4); `Projeto` (`app.models.projeto`, já existente — campos `arquiteto_id`, `valor_contrato`, `criado_em`, `arquivado`).
- Produces:
  - `EspecificadoresKpiResponse(especificadores_ativos, pct_venda_mes, pct_venda_ano, atendimentos_mes, visitas_escritorio_mes)`
  - `GET /arquitetos/kpis` → `EspecificadoresKpiResponse` (qualquer autenticado)

- [ ] **Step 1: Escrever o teste que falha**

Criar `backend/tests/test_arquitetos_kpis.py`:

```python
from datetime import datetime, timedelta
from app.models.crm import Arquiteto, Cliente, InteracaoArquiteto
from app.models.projeto import Projeto


def test_kpis_sem_dados(auth_client):
    resp = auth_client.get("/api/v1/arquitetos/kpis")
    assert resp.status_code == 200
    data = resp.json()
    assert data["especificadores_ativos"] == 0
    assert data["pct_venda_mes"] == 0.0
    assert data["pct_venda_ano"] == 0.0
    assert data["atendimentos_mes"] == 0
    assert data["visitas_escritorio_mes"] == 0


def test_kpis_especificadores_ativos_conta_apenas_ativos(auth_client, db_session):
    ativo = Arquiteto(nome="Ativo", tipo="arquiteto", is_active=True)
    inativo = Arquiteto(nome="Inativo", tipo="arquiteto", is_active=False)
    db_session.add_all([ativo, inativo])
    db_session.commit()

    resp = auth_client.get("/api/v1/arquitetos/kpis")
    assert resp.json()["especificadores_ativos"] == 1


def test_kpis_pct_venda_mes(auth_client, db_session):
    arquiteto = Arquiteto(nome="Com Vendas", tipo="arquiteto", is_active=True)
    cliente = Cliente(nome="Cliente", telefone="11999990000")
    db_session.add_all([arquiteto, cliente])
    db_session.commit()

    agora = datetime.utcnow()
    projeto_com_especificador = Projeto(
        codigo="PROJ-2026-001", cliente_id=cliente.id, arquiteto_id=arquiteto.id,
        valor_contrato=100_000.0, criado_em=agora, arquivado=False,
    )
    projeto_sem_especificador = Projeto(
        codigo="PROJ-2026-002", cliente_id=cliente.id, arquiteto_id=None,
        valor_contrato=100_000.0, criado_em=agora, arquivado=False,
    )
    db_session.add_all([projeto_com_especificador, projeto_sem_especificador])
    db_session.commit()

    resp = auth_client.get("/api/v1/arquitetos/kpis")
    assert resp.json()["pct_venda_mes"] == 50.0


def test_kpis_atendimentos_e_visitas_mes(auth_client, db_session, diretoria_user):
    arquiteto = Arquiteto(nome="Com Interacoes", tipo="arquiteto", is_active=True)
    db_session.add(arquiteto)
    db_session.commit()

    agora = datetime.utcnow()
    db_session.add_all([
        InteracaoArquiteto(arquiteto_id=arquiteto.id, responsavel_id=diretoria_user.id, tipo="visita", resumo="V1", data=agora),
        InteracaoArquiteto(arquiteto_id=arquiteto.id, responsavel_id=diretoria_user.id, tipo="visita", resumo="V2", data=agora),
        InteracaoArquiteto(arquiteto_id=arquiteto.id, responsavel_id=diretoria_user.id, tipo="ligacao", resumo="L1", data=agora),
        InteracaoArquiteto(
            arquiteto_id=arquiteto.id, responsavel_id=diretoria_user.id, tipo="visita", resumo="Mes passado",
            data=agora - timedelta(days=60),
        ),
    ])
    db_session.commit()

    resp = auth_client.get("/api/v1/arquitetos/kpis")
    data = resp.json()
    assert data["visitas_escritorio_mes"] == 2
    assert data["atendimentos_mes"] == 1
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/test_arquitetos_kpis.py -v`
Expected: FAIL — `404 Not Found`, rota ainda não existe.

- [ ] **Step 3: Adicionar o schema em `app/schemas/crm.py`**

No final do arquivo (depois de `ArquitetoScoreResponse`), adicionar:

```python
# === KPIs DA CARTEIRA DE ESPECIFICADORES ===

class EspecificadoresKpiResponse(BaseModel):
    especificadores_ativos: int
    pct_venda_mes: float
    pct_venda_ano: float
    atendimentos_mes: int
    visitas_escritorio_mes: int
```

- [ ] **Step 4: Implementar o endpoint em `app/api/v1/endpoints/arquitetos.py`**

Adicionar aos imports do topo: `from datetime import datetime`, `from sqlalchemy import func`, `InteracaoArquiteto` (se ainda não importado na Task 4), `from app.models.projeto import Projeto`, `EspecificadoresKpiResponse` de `app.schemas.crm`.

**Importante:** esta rota precisa ficar ANTES de `GET /{arquiteto_id}` no arquivo (rota fixa vs. dinâmica — ver Global Constraints). Inserir logo após `criar_arquiteto` e antes de `obter_arquiteto`:

```python
@router.get("/kpis", response_model=EspecificadoresKpiResponse)
def kpis_especificadores(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agora = datetime.utcnow()
    inicio_mes = agora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    inicio_ano = agora.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    especificadores_ativos = db.query(Arquiteto).filter(Arquiteto.is_active == True).count()

    def _pct_venda_desde(desde: datetime) -> float:
        total = db.query(func.sum(Projeto.valor_contrato)).filter(
            Projeto.criado_em >= desde, Projeto.arquivado == False
        ).scalar() or 0.0
        com_especificador = db.query(func.sum(Projeto.valor_contrato)).filter(
            Projeto.criado_em >= desde, Projeto.arquivado == False, Projeto.arquiteto_id.isnot(None)
        ).scalar() or 0.0
        if not total:
            return 0.0
        return round((com_especificador / total) * 100, 1)

    atendimentos_mes = (
        db.query(InteracaoArquiteto)
        .filter(InteracaoArquiteto.data >= inicio_mes, InteracaoArquiteto.tipo != "visita")
        .count()
    )
    visitas_escritorio_mes = (
        db.query(InteracaoArquiteto)
        .filter(InteracaoArquiteto.data >= inicio_mes, InteracaoArquiteto.tipo == "visita")
        .count()
    )

    return {
        "especificadores_ativos": especificadores_ativos,
        "pct_venda_mes": _pct_venda_desde(inicio_mes),
        "pct_venda_ano": _pct_venda_desde(inicio_ano),
        "atendimentos_mes": atendimentos_mes,
        "visitas_escritorio_mes": visitas_escritorio_mes,
    }
```

- [ ] **Step 5: Rodar a suíte completa**

Run: `cd backend && python -m pytest -q`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/app/schemas/crm.py backend/app/api/v1/endpoints/arquitetos.py backend/tests/test_arquitetos_kpis.py
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add endpoint de KPIs da carteira de especificadores

GET /arquitetos/kpis: especificadores ativos, % do valor vendido com
especificador no mes/ano, atendimentos e visitas ao escritorio no mes.
Guarda contra divisao por zero quando nao ha projetos no periodo.
EOF
)"
```

---

## Task 6: Flag de especificador esfriando

**Files:**
- Modify: `backend/app/services/arquiteto_score.py`
- Create: `backend/tests/test_arquiteto_score_esfriando.py`

**Interfaces:**
- Consumes: `InteracaoArquiteto` (Task 1/4).
- Produces: `determinar_flags(..., tem_dono: bool, dias_desde_ultima_interacao: Optional[int])` — adiciona `"especificador_esfriando"` à lista quando `em_risco and tem_dono and (dias_desde_ultima_interacao is None or dias_desde_ultima_interacao > 30)`. `calcular_score` passa a calcular e repassar esses dois valores; o flag aparece em `GET /arquitetos/{id}/score` (resposta já existente, sem endpoint novo).

> Nota de escopo (ver Global Constraints): isto substitui a "notificação periódica" pedida no spec por um flag calculado em tempo de consulta, no mesmo padrão real do RN016 (`projeto_parado`). Não há `Notificacao` inserida nem job periódico nesta task.

- [ ] **Step 1: Escrever o teste unitário que falha (mesmo padrão de `test_arquiteto_score_segmento_flags.py`)**

Criar `backend/tests/test_arquiteto_score_esfriando.py`:

```python
from app.services.arquiteto_score import determinar_flags


def test_esfriando_quando_em_risco_com_dono_e_sem_interacao_recente():
    flags = determinar_flags(
        score_geral=10, potencial=10, valor_pontos=10, em_risco=True,
        tem_dono=True, dias_desde_ultima_interacao=45,
    )
    assert "especificador_esfriando" in flags


def test_esfriando_quando_nunca_houve_interacao():
    flags = determinar_flags(
        score_geral=10, potencial=10, valor_pontos=10, em_risco=True,
        tem_dono=True, dias_desde_ultima_interacao=None,
    )
    assert "especificador_esfriando" in flags


def test_nao_esfria_sem_dono():
    flags = determinar_flags(
        score_geral=10, potencial=10, valor_pontos=10, em_risco=True,
        tem_dono=False, dias_desde_ultima_interacao=45,
    )
    assert "especificador_esfriando" not in flags


def test_nao_esfria_se_nao_em_risco():
    flags = determinar_flags(
        score_geral=10, potencial=10, valor_pontos=10, em_risco=False,
        tem_dono=True, dias_desde_ultima_interacao=45,
    )
    assert "especificador_esfriando" not in flags


def test_nao_esfria_com_interacao_recente():
    flags = determinar_flags(
        score_geral=10, potencial=10, valor_pontos=10, em_risco=True,
        tem_dono=True, dias_desde_ultima_interacao=10,
    )
    assert "especificador_esfriando" not in flags
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/test_arquiteto_score_esfriando.py -v`
Expected: FAIL — `TypeError: determinar_flags() got an unexpected keyword argument 'tem_dono'`.

- [ ] **Step 3: Atualizar `determinar_flags` em `app/services/arquiteto_score.py`**

Substituir a função `determinar_flags` inteira por:

```python
def determinar_flags(
    *,
    score_geral: float,
    potencial: float,
    valor_pontos: float,
    em_risco: bool,
    tem_dono: bool = False,
    dias_desde_ultima_interacao: Optional[int] = None,
) -> list[str]:
    flags = []
    if score_geral >= 85:
        flags.append("top_indicador")
    if em_risco:
        flags.append("em_risco_de_perda")
    if potencial >= 70:
        flags.append("alto_potencial")
    if valor_pontos >= 90:
        flags.append("indicacao_alto_valor")
    if em_risco and tem_dono and (dias_desde_ultima_interacao is None or dias_desde_ultima_interacao > 30):
        flags.append("especificador_esfriando")
    return flags
```

- [ ] **Step 4: Rodar o teste unitário e confirmar que passa**

Run: `cd backend && python -m pytest tests/test_arquiteto_score_esfriando.py -v`
Expected: PASS.

- [ ] **Step 5: Escrever o teste de integração (endpoint de score reflete o flag)**

Adicionar ao final de `backend/tests/test_arquiteto_score_esfriando.py`:

```python
from datetime import datetime, timedelta
from app.models.crm import Arquiteto, InteracaoArquiteto
from app.models.projeto import Projeto
from app.models.crm import Cliente


def test_score_endpoint_inclui_flag_esfriando(auth_client, db_session, diretoria_user):
    agora = datetime.utcnow()
    arquiteto = Arquiteto(
        nome="Esfriando", tipo="arquiteto", is_active=True,
        criado_em=agora - timedelta(days=800), consultor_id=diretoria_user.id,
    )
    cliente = Cliente(nome="Cliente", telefone="11999990000")
    db_session.add_all([arquiteto, cliente])
    db_session.commit()

    # projeto antigo o suficiente para gerar em_risco=True (>180 dias sem atividade)
    db_session.add(Projeto(
        codigo="PROJ-2024-001", cliente_id=cliente.id, arquiteto_id=arquiteto.id,
        valor_contrato=50_000.0, criado_em=agora - timedelta(days=400), arquivado=False,
    ))
    db_session.add(InteracaoArquiteto(
        arquiteto_id=arquiteto.id, responsavel_id=diretoria_user.id,
        tipo="ligacao", resumo="Contato antigo", data=agora - timedelta(days=60),
    ))
    db_session.commit()

    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto.id}/score")
    assert resp.status_code == 200
    assert "especificador_esfriando" in resp.json()["flags"]
```

- [ ] **Step 6: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/test_arquiteto_score_esfriando.py::test_score_endpoint_inclui_flag_esfriando -v`
Expected: FAIL — `calcular_score` ainda não passa `tem_dono`/`dias_desde_ultima_interacao` para `determinar_flags`, então o flag não aparece.

- [ ] **Step 7: Atualizar `calcular_score` em `app/services/arquiteto_score.py`**

No topo do arquivo, atualizar o import:

```python
from app.models.crm import Arquiteto, Lead, StatusFunil, ConcorrenteArquiteto, InteracaoArquiteto
```

Dentro de `calcular_score`, logo após o bloco que já busca `concorrentes` (antes do cálculo de `recencia`), adicionar:

```python
    interacoes = (
        db.query(InteracaoArquiteto)
        .filter(InteracaoArquiteto.arquiteto_id == arquiteto.id)
        .all()
    )
    datas_interacoes = [i.data for i in interacoes if i.data]
    ultima_interacao_em = max(datas_interacoes) if datas_interacoes else None
    dias_desde_ultima_interacao = (agora - ultima_interacao_em).days if ultima_interacao_em else None
```

E trocar a chamada existente de `determinar_flags(...)` (dentro do mesmo `calcular_score`) para:

```python
    flags = determinar_flags(
        score_geral=score_geral,
        potencial=potencial,
        valor_pontos=valor,
        em_risco=em_risco,
        tem_dono=arquiteto.consultor_id is not None,
        dias_desde_ultima_interacao=dias_desde_ultima_interacao,
    )
```

- [ ] **Step 8: Rodar a suíte completa**

Run: `cd backend && python -m pytest -q`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/app/services/arquiteto_score.py backend/tests/test_arquiteto_score_esfriando.py
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add flag especificador_esfriando ao score

Calculado em tempo de consulta (mesmo padrao real do RN016/projeto_parado
neste projeto — nao ha motor de notificacao nem job periodico ainda),
disparado quando o especificador esta em_risco_de_perda, tem dono e nao
tem interacao registrada nos ultimos 30 dias (ou nunca teve nenhuma).
EOF
)"
```

---

## Task 7: Meta de visitas configurável

**Files:**
- Modify: `backend/app/schemas/crm.py`
- Modify: `backend/app/api/v1/endpoints/arquitetos.py`
- Create: `backend/tests/test_arquitetos_metas_visitas.py`

**Interfaces:**
- Consumes: `MetaVisitasConsultor` (Task 1), `InteracaoArquiteto` (Task 4).
- Produces:
  - `MetaVisitasUpsert(consultor_id: int, meta_visitas_mes: int)`
  - `MetaVisitasResponse(id, consultor_id, consultor_nome, meta_visitas_mes, configurado_por_id, atualizado_em)`
  - `MinhaMetaResponse(meta_visitas_mes: int, visitas_realizadas_mes: int)`
  - `GET /arquitetos/metas-visitas` → `List[MetaVisitasResponse]` (roles `DIRETORIA`, `GERENTE_COMERCIAL`)
  - `PUT /arquitetos/metas-visitas` → `MetaVisitasResponse` (roles `DIRETORIA`, `GERENTE_COMERCIAL`) — upsert por `consultor_id`
  - `GET /arquitetos/metas-visitas/me` → `MinhaMetaResponse` (qualquer autenticado)

- [ ] **Step 1: Escrever o teste que falha**

Criar `backend/tests/test_arquitetos_metas_visitas.py`:

```python
from datetime import datetime, timedelta
from app.core.security import get_password_hash
from app.models.user import User, PerfilUsuario
from app.models.crm import InteracaoArquiteto, Arquiteto


def _criar_vendedor(db_session, nome="Vendedor Meta", email="vendedor.meta@plannit.com.br"):
    user = User(
        nome=nome, email=email,
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.VENDEDOR, is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_definir_meta_visitas(auth_client, db_session):
    vendedor = _criar_vendedor(db_session)

    resp = auth_client.put(
        "/api/v1/arquitetos/metas-visitas",
        json={"consultor_id": vendedor.id, "meta_visitas_mes": 10},
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["consultor_id"] == vendedor.id
    assert data["consultor_nome"] == vendedor.nome
    assert data["meta_visitas_mes"] == 10


def test_definir_meta_visitas_upsert(auth_client, db_session):
    vendedor = _criar_vendedor(db_session)

    auth_client.put("/api/v1/arquitetos/metas-visitas", json={"consultor_id": vendedor.id, "meta_visitas_mes": 10})
    resp = auth_client.put("/api/v1/arquitetos/metas-visitas", json={"consultor_id": vendedor.id, "meta_visitas_mes": 15})

    assert resp.status_code == 200
    assert resp.json()["meta_visitas_mes"] == 15

    listagem = auth_client.get("/api/v1/arquitetos/metas-visitas").json()
    assert len(listagem) == 1


def test_definir_meta_visitas_bloqueado_403(create_client_com_user, projetista_user, db_session):
    vendedor = _criar_vendedor(db_session)
    projetista_client = create_client_com_user(projetista_user)

    resp = projetista_client.put(
        "/api/v1/arquitetos/metas-visitas",
        json={"consultor_id": vendedor.id, "meta_visitas_mes": 10},
    )
    assert resp.status_code == 403


def test_minha_meta_sem_meta_configurada(create_client_com_user, db_session):
    vendedor = _criar_vendedor(db_session)
    vendedor_client = create_client_com_user(vendedor)

    resp = vendedor_client.get("/api/v1/arquitetos/metas-visitas/me")
    assert resp.status_code == 200
    assert resp.json() == {"meta_visitas_mes": 0, "visitas_realizadas_mes": 0}


def test_minha_meta_com_progresso(create_client_com_user, db_session):
    vendedor = _criar_vendedor(db_session)
    arquiteto = Arquiteto(nome="Alvo Visita", tipo="arquiteto", is_active=True)
    db_session.add(arquiteto)
    db_session.commit()

    agora = datetime.utcnow()
    db_session.add_all([
        InteracaoArquiteto(arquiteto_id=arquiteto.id, responsavel_id=vendedor.id, tipo="visita", resumo="V1", data=agora),
        InteracaoArquiteto(arquiteto_id=arquiteto.id, responsavel_id=vendedor.id, tipo="visita", resumo="V2", data=agora),
        InteracaoArquiteto(
            arquiteto_id=arquiteto.id, responsavel_id=vendedor.id, tipo="visita", resumo="Mes passado",
            data=agora - timedelta(days=60),
        ),
    ])
    db_session.commit()

    vendedor_client = create_client_com_user(vendedor)
    vendedor_client.put("/api/v1/arquitetos/metas-visitas", json={"consultor_id": vendedor.id, "meta_visitas_mes": 5})

    resp = vendedor_client.get("/api/v1/arquitetos/metas-visitas/me")
    assert resp.status_code == 200
    assert resp.json() == {"meta_visitas_mes": 5, "visitas_realizadas_mes": 2}
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/test_arquitetos_metas_visitas.py -v`
Expected: FAIL — `404 Not Found`, rotas ainda não existem.

- [ ] **Step 3: Adicionar os schemas em `app/schemas/crm.py`**

No final do arquivo, depois de `EspecificadoresKpiResponse`, adicionar:

```python
# === META DE VISITAS ===

class MetaVisitasUpsert(BaseModel):
    consultor_id: int
    meta_visitas_mes: int = Field(..., ge=0)


class MetaVisitasResponse(BaseModel):
    id: int
    consultor_id: int
    consultor_nome: str
    meta_visitas_mes: int
    configurado_por_id: Optional[int]
    atualizado_em: Optional[datetime]


class MinhaMetaResponse(BaseModel):
    meta_visitas_mes: int
    visitas_realizadas_mes: int
```

- [ ] **Step 4: Implementar os endpoints em `app/api/v1/endpoints/arquitetos.py`**

Adicionar aos imports: `MetaVisitasConsultor` de `app.models.crm`; `MetaVisitasUpsert, MetaVisitasResponse, MinhaMetaResponse` de `app.schemas.crm`.

**Importante:** `/metas-visitas` e `/metas-visitas/me` são rotas fixas — precisam ficar ANTES de `GET /{arquiteto_id}`. Inserir logo após o endpoint `kpis_especificadores` (Task 5) e antes de `obter_arquiteto`:

```python
@router.get("/metas-visitas", response_model=List[MetaVisitasResponse])
def listar_metas_visitas(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL
    )),
):
    metas = db.query(MetaVisitasConsultor).all()
    return [
        {
            "id": m.id,
            "consultor_id": m.consultor_id,
            "consultor_nome": m.consultor.nome,
            "meta_visitas_mes": m.meta_visitas_mes,
            "configurado_por_id": m.configurado_por_id,
            "atualizado_em": m.atualizado_em,
        }
        for m in metas
    ]


@router.put("/metas-visitas", response_model=MetaVisitasResponse)
def definir_meta_visitas(
    payload: MetaVisitasUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL
    )),
):
    consultor = db.query(User).filter(User.id == payload.consultor_id).first()
    if not consultor:
        raise HTTPException(400, "Consultor inválido")

    meta = db.query(MetaVisitasConsultor).filter(MetaVisitasConsultor.consultor_id == payload.consultor_id).first()
    if meta:
        meta.meta_visitas_mes = payload.meta_visitas_mes
        meta.configurado_por_id = current_user.id
    else:
        meta = MetaVisitasConsultor(
            consultor_id=payload.consultor_id,
            meta_visitas_mes=payload.meta_visitas_mes,
            configurado_por_id=current_user.id,
        )
        db.add(meta)
    db.commit()
    db.refresh(meta)

    return {
        "id": meta.id,
        "consultor_id": meta.consultor_id,
        "consultor_nome": consultor.nome,
        "meta_visitas_mes": meta.meta_visitas_mes,
        "configurado_por_id": meta.configurado_por_id,
        "atualizado_em": meta.atualizado_em,
    }


@router.get("/metas-visitas/me", response_model=MinhaMetaResponse)
def minha_meta_visitas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meta = db.query(MetaVisitasConsultor).filter(MetaVisitasConsultor.consultor_id == current_user.id).first()
    meta_valor = meta.meta_visitas_mes if meta else 0

    agora = datetime.utcnow()
    inicio_mes = agora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    visitas_realizadas = (
        db.query(InteracaoArquiteto)
        .filter(
            InteracaoArquiteto.responsavel_id == current_user.id,
            InteracaoArquiteto.tipo == "visita",
            InteracaoArquiteto.data >= inicio_mes,
        )
        .count()
    )

    return {"meta_visitas_mes": meta_valor, "visitas_realizadas_mes": visitas_realizadas}
```

- [ ] **Step 5: Rodar a suíte completa**

Run: `cd backend && python -m pytest -q`
Expected: PASS — todos os testes de todas as tasks deste plano.

- [ ] **Step 6: Commit**

```bash
git add backend/app/schemas/crm.py backend/app/api/v1/endpoints/arquitetos.py backend/tests/test_arquitetos_metas_visitas.py
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add meta de visitas mensal configuravel por consultor

GET/PUT /arquitetos/metas-visitas (gestao define, upsert por consultor)
e GET /arquitetos/metas-visitas/me (o proprio vendedor consulta meta e
progresso do mes, contando InteracaoArquiteto tipo=visita).
EOF
)"
```

---

## Fora de escopo deste plano

- Rename técnico e qualquer mudança de frontend — plano separado (`docs/superpowers/plans/2026-07-23-especificadores-frontend.md` ou nome equivalente, a escrever depois que este for revisado).
- Motor de notificação real (listagem, leitura, push) para `Notificacao` — pré-existente como pendência (CLAUDE.md já registra isso como Fase 2); a linha inserida na Task 3 fica no banco mas sem UI para exibi-la ainda.
- Migração assistida de leads antigos `origem=arquiteto` — fora de escopo no spec original.
- Deploy em produção (Railway): como não há Alembic de fato neste projeto, colunas novas na tabela `arquitetos` do Postgres de produção (se já existirem linhas) exigirão `ALTER TABLE` manual — está fora do escopo deste plano de implementação local, mas deve ser feito antes de subir para o Railway.
