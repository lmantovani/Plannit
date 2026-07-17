# Backend de Score de Arquitetos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend for the Arquitetos scoring module — RFV × Potencial × Lealdade score, 7-segment classification, 4 flags, multi-contact decisores, and manual competitor tracking — none of which exist today despite CLAUDE.md claiming they do.

**Architecture:** Two new SQLAlchemy models (`DecisorArquiteto`, `ConcorrenteArquiteto`) with standard CRUD endpoints following the existing `arquitetos.py` pattern. A new pure-function scoring service (`app/services/arquiteto_score.py`) split into small, independently-testable calculation functions plus one DB-querying orchestrator (`calcular_score`), exposed via `GET /arquitetos/{id}/score`. No score is ever stored — always computed on demand.

**Tech Stack:** FastAPI, SQLAlchemy 2.0, Pydantic v2, pytest + FastAPI TestClient (SQLite in-memory for tests — no existing test suite in this repo, so test infrastructure is built as part of this plan).

## Global Constraints

- Escopo apenas backend. Frontend do módulo de Arquitetos fica para uma fase seguinte (fora deste plano).
- Nenhuma coluna nova na tabela `arquitetos` — score é sempre calculado sob demanda, nunca cacheado.
- Critérios de pontuação são faixas fixas (não percentil relativo), como constantes/regras nomeadas dentro do serviço — mesmo estilo do `app/services/briefing_score.py` já existente.
- O dado de concorrência é manual/subjetivo e **nunca** entra na média de RFV/Potencial/Lealdade/score_geral — fica isolado no campo `concorrencia` da resposta.
- Seguir o padrão real já em uso em `app/api/v1/endpoints/arquitetos.py`: `response_model` com schemas Pydantic (`from_attributes = True`), e `require_roles(PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.RECEPCAO)` para escrita. (A seção genérica "Padrões de Código" do CLAUDE.md descreve serialização manual por dict — isso não reflete o código real deste arquivo; siga o código, não essa seção do CLAUDE.md.)
- Este projeto **não** usa migrations Alembic geradas de fato — `alembic/versions/` está vazio no repositório. O schema é criado via `Base.metadata.create_all(bind=engine)`, disparado em `seed.py`. Não gere migration Alembic neste plano; os models novos aparecem automaticamente na próxima vez que `Base.metadata.create_all` rodar (localmente: `python seed.py`).
- Para aritmética de datas, use `datetime.utcnow()` (naive) — mesmo padrão já usado em `app/api/v1/endpoints/dashboard.py`. Não use `datetime.now(timezone.utc)` (aware): os testes rodam contra SQLite, que retorna datetimes naive mesmo para colunas `DateTime(timezone=True)`, e comparar naive com aware lança `TypeError`.
- Nenhuma dependência nova: `pytest`, `httpx` (usado pelo `TestClient`) e `email-validator` já estão em `requirements.txt`.

---

## File Structure

- `backend/pytest.ini` — **create**: config mínima para o pacote `app` ser importável nos testes
- `backend/tests/conftest.py` — **create**: fixtures de banco SQLite in-memory, `TestClient`, usuário autenticado
- `backend/tests/test_arquitetos_decisores.py` — **create**: testes de CRUD de decisores
- `backend/tests/test_arquitetos_concorrentes.py` — **create**: testes de CRUD de concorrentes
- `backend/tests/test_arquiteto_score_rfv_potencial.py` — **create**: testes unitários das funções puras de RFV/Potencial
- `backend/tests/test_arquiteto_score_lealdade.py` — **create**: testes unitários das funções puras de Lealdade
- `backend/tests/test_arquiteto_score_segmento_flags.py` — **create**: testes unitários de segmentação/flags/concorrência
- `backend/tests/test_arquiteto_score_endpoint.py` — **create**: teste de integração do orquestrador + endpoint
- `backend/app/models/crm.py` — **modify**: adicionar `DecisorArquiteto`, `ConcorrenteArquiteto`
- `backend/app/models/__init__.py` — **modify**: registrar os 2 models novos
- `backend/app/schemas/crm.py` — **modify**: adicionar schemas de decisor/concorrente/score
- `backend/app/services/arquiteto_score.py` — **create**: funções puras de pontuação + orquestrador `calcular_score`
- `backend/app/api/v1/endpoints/arquitetos.py` — **modify**: adicionar endpoints de decisores, concorrentes e score

---

### Task 1: Infraestrutura de testes

**Files:**
- Create: `backend/pytest.ini`
- Create: `backend/tests/conftest.py`
- Test: `backend/tests/test_arquitetos_decisores.py` (só o teste de sanidade nesta task)

**Interfaces:**
- Produces: fixtures `db_session`, `client`, `diretoria_user`, `auth_client` — usadas por todas as tasks seguintes que escrevem testes de endpoint.

- [ ] **Step 1: Criar `backend/pytest.ini`**

```ini
[pytest]
pythonpath = .
```

- [ ] **Step 2: Criar `backend/tests/conftest.py`**

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

import app.models  # garante que todos os models sejam registrados no Base.metadata
from app.core.database import Base, get_db
from app.core.security import get_current_user, get_password_hash
from app.main import app as fastapi_app
from app.models.user import User, PerfilUsuario


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def _override_get_db():
        yield db_session

    fastapi_app.dependency_overrides[get_db] = _override_get_db
    yield TestClient(fastapi_app)
    fastapi_app.dependency_overrides.pop(get_db, None)


@pytest.fixture()
def diretoria_user(db_session):
    user = User(
        nome="Admin Teste",
        email="admin.teste@plannit.com.br",
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.DIRETORIA,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def auth_client(client, diretoria_user):
    def _override_get_current_user():
        return diretoria_user

    fastapi_app.dependency_overrides[get_current_user] = _override_get_current_user
    yield client
    fastapi_app.dependency_overrides.pop(get_current_user, None)
```

- [ ] **Step 3: Escrever o teste de sanidade em `backend/tests/test_arquitetos_decisores.py`**

```python
def test_listar_arquitetos_vazio(auth_client):
    resp = auth_client.get("/api/v1/arquitetos/")
    assert resp.status_code == 200
    assert resp.json() == []
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `cd backend && pytest tests/test_arquitetos_decisores.py -v`
Expected: `test_listar_arquitetos_vazio PASSED` — confirma que `db_session`, `client` e `auth_client` funcionam de ponta a ponta (banco SQLite criado, override de auth funcionando, rota existente respondendo).

- [ ] **Step 5: Commit**

```bash
git add backend/pytest.ini backend/tests/conftest.py backend/tests/test_arquitetos_decisores.py
git commit -m "test: add pytest infrastructure with SQLite test DB and auth override"
```

---

### Task 2: Model, schema e endpoints de `DecisorArquiteto`

**Files:**
- Modify: `backend/app/models/crm.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/schemas/crm.py`
- Modify: `backend/app/api/v1/endpoints/arquitetos.py`
- Modify: `backend/tests/test_arquitetos_decisores.py`

**Interfaces:**
- Consumes: fixtures de `tests/conftest.py` (Task 1) — `auth_client`, `db_session`.
- Produces: model `DecisorArquiteto` (`app.models.crm.DecisorArquiteto`, campos `id, arquiteto_id, nome, cargo, telefone, email, observacoes, is_principal, criado_em`), schemas `DecisorArquitetoCreate`/`DecisorArquitetoResponse` (`app.schemas.crm`), endpoints `GET/POST /arquitetos/{arquiteto_id}/decisores`, `PATCH/DELETE /arquitetos/{arquiteto_id}/decisores/{decisor_id}`.

- [ ] **Step 1: Escrever os testes (falhando) em `backend/tests/test_arquitetos_decisores.py`**

```python
def _criar_arquiteto(auth_client, nome="Ana Arquiteta"):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": nome})
    assert resp.status_code == 201
    return resp.json()


def test_listar_arquitetos_vazio(auth_client):
    resp = auth_client.get("/api/v1/arquitetos/")
    assert resp.status_code == 200
    assert resp.json() == []


def test_criar_decisor(auth_client):
    arquiteto = _criar_arquiteto(auth_client)

    resp = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/decisores",
        json={"nome": "João Sócio", "cargo": "Sócio", "is_principal": True},
    )

    assert resp.status_code == 201
    data = resp.json()
    assert data["nome"] == "João Sócio"
    assert data["arquiteto_id"] == arquiteto["id"]
    assert data["is_principal"] is True


def test_criar_decisor_arquiteto_inexistente_404(auth_client):
    resp = auth_client.post(
        "/api/v1/arquitetos/9999/decisores",
        json={"nome": "Fulano"},
    )
    assert resp.status_code == 404


def test_apenas_um_decisor_principal_por_arquiteto(auth_client):
    arquiteto = _criar_arquiteto(auth_client)

    primeiro = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/decisores",
        json={"nome": "Primeiro", "is_principal": True},
    ).json()

    segundo = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/decisores",
        json={"nome": "Segundo", "is_principal": True},
    ).json()

    listagem = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/decisores").json()
    principais = [d for d in listagem if d["is_principal"]]

    assert len(principais) == 1
    assert principais[0]["id"] == segundo["id"]
    assert primeiro["id"] != segundo["id"]


def test_atualizar_decisor(auth_client):
    arquiteto = _criar_arquiteto(auth_client)
    decisor = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/decisores",
        json={"nome": "João Sócio"},
    ).json()

    resp = auth_client.patch(
        f"/api/v1/arquitetos/{arquiteto['id']}/decisores/{decisor['id']}",
        json={"nome": "João Sócio", "cargo": "Sócio-diretor"},
    )

    assert resp.status_code == 200
    assert resp.json()["cargo"] == "Sócio-diretor"


def test_remover_decisor(auth_client):
    arquiteto = _criar_arquiteto(auth_client)
    decisor = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/decisores",
        json={"nome": "João Sócio"},
    ).json()

    resp = auth_client.delete(f"/api/v1/arquitetos/{arquiteto['id']}/decisores/{decisor['id']}")
    assert resp.status_code == 204

    listagem = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/decisores").json()
    assert listagem == []
```

- [ ] **Step 2: Rodar e confirmar que os testes novos falham**

Run: `cd backend && pytest tests/test_arquitetos_decisores.py -v`
Expected: `test_criar_decisor` e os demais novos testes FAIL com erro 404 (rota não existe) ou `AttributeError`/`ImportError` — o model e os endpoints ainda não existem.

- [ ] **Step 3: Adicionar o model em `backend/app/models/crm.py`** (ao final do arquivo)

```python
class DecisorArquiteto(Base):
    """Contato dentro de um escritório de arquitetura (RN — decisores multi-contato)."""
    __tablename__ = "decisores_arquitetos"

    id = Column(Integer, primary_key=True, index=True)
    arquiteto_id = Column(Integer, ForeignKey("arquitetos.id"), nullable=False)

    nome = Column(String(200), nullable=False)
    cargo = Column(String(100), nullable=True)
    telefone = Column(String(20), nullable=True)
    email = Column(String(200), nullable=True)
    observacoes = Column(Text, nullable=True)
    is_principal = Column(Boolean, default=False)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    arquiteto = relationship("Arquiteto", foreign_keys=[arquiteto_id])

    def __repr__(self):
        return f"<DecisorArquiteto {self.nome} [arquiteto={self.arquiteto_id}]>"
```

- [ ] **Step 4: Registrar o model em `backend/app/models/__init__.py`**

Substitua a linha existente:

```python
from app.models.crm import Lead, InteracaoLead, Cliente, Arquiteto
```

por:

```python
from app.models.crm import Lead, InteracaoLead, Cliente, Arquiteto, DecisorArquiteto
```

E adicione `"DecisorArquiteto"` à lista `__all__` (`ConcorrenteArquiteto` só é adicionado na Task 3, quando o model passar a existir).

- [ ] **Step 5: Adicionar os schemas em `backend/app/schemas/crm.py`** (após o bloco `# === ARQUITETO ===` existente)

```python
# === DECISOR ARQUITETO ===

class DecisorArquitetoCreate(BaseModel):
    nome: str
    cargo: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    observacoes: Optional[str] = None
    is_principal: bool = False


class DecisorArquitetoResponse(BaseModel):
    id: int
    arquiteto_id: int
    nome: str
    cargo: Optional[str]
    telefone: Optional[str]
    email: Optional[str]
    observacoes: Optional[str]
    is_principal: bool
    criado_em: datetime

    class Config:
        from_attributes = True
```

- [ ] **Step 6: Adicionar os endpoints em `backend/app/api/v1/endpoints/arquitetos.py`**

Atualize o import do topo do arquivo:

```python
from app.models.crm import Arquiteto, DecisorArquiteto
from app.schemas.crm import (
    ArquitetoCreate, ArquitetoResponse,
    DecisorArquitetoCreate, DecisorArquitetoResponse,
)
```

Adicione ao final do arquivo:

```python
def _get_arquiteto_ou_404(arquiteto_id: int, db: Session) -> Arquiteto:
    arquiteto = db.query(Arquiteto).filter(Arquiteto.id == arquiteto_id).first()
    if not arquiteto:
        raise HTTPException(404, "Arquiteto não encontrado")
    return arquiteto


# === DECISORES ===

@router.get("/{arquiteto_id}/decisores", response_model=List[DecisorArquitetoResponse])
def listar_decisores(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_arquiteto_ou_404(arquiteto_id, db)
    return (
        db.query(DecisorArquiteto)
        .filter(DecisorArquiteto.arquiteto_id == arquiteto_id)
        .order_by(DecisorArquiteto.is_principal.desc(), DecisorArquiteto.nome)
        .all()
    )


@router.post("/{arquiteto_id}/decisores", response_model=DecisorArquitetoResponse, status_code=201)
def criar_decisor(
    arquiteto_id: int,
    payload: DecisorArquitetoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.RECEPCAO
    )),
):
    _get_arquiteto_ou_404(arquiteto_id, db)

    if payload.is_principal:
        db.query(DecisorArquiteto).filter(
            DecisorArquiteto.arquiteto_id == arquiteto_id
        ).update({"is_principal": False})

    decisor = DecisorArquiteto(arquiteto_id=arquiteto_id, **payload.model_dump())
    db.add(decisor)
    db.commit()
    db.refresh(decisor)
    return decisor


@router.patch("/{arquiteto_id}/decisores/{decisor_id}", response_model=DecisorArquitetoResponse)
def atualizar_decisor(
    arquiteto_id: int,
    decisor_id: int,
    payload: DecisorArquitetoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.RECEPCAO
    )),
):
    decisor = (
        db.query(DecisorArquiteto)
        .filter(DecisorArquiteto.id == decisor_id, DecisorArquiteto.arquiteto_id == arquiteto_id)
        .first()
    )
    if not decisor:
        raise HTTPException(404, "Decisor não encontrado")

    dados = payload.model_dump(exclude_unset=True)
    if dados.get("is_principal"):
        db.query(DecisorArquiteto).filter(
            DecisorArquiteto.arquiteto_id == arquiteto_id,
            DecisorArquiteto.id != decisor_id,
        ).update({"is_principal": False})

    for field, value in dados.items():
        setattr(decisor, field, value)

    db.commit()
    db.refresh(decisor)
    return decisor


@router.delete("/{arquiteto_id}/decisores/{decisor_id}", status_code=204)
def remover_decisor(
    arquiteto_id: int,
    decisor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.RECEPCAO
    )),
):
    decisor = (
        db.query(DecisorArquiteto)
        .filter(DecisorArquiteto.id == decisor_id, DecisorArquiteto.arquiteto_id == arquiteto_id)
        .first()
    )
    if not decisor:
        raise HTTPException(404, "Decisor não encontrado")
    db.delete(decisor)
    db.commit()
```

- [ ] **Step 7: Rodar os testes e confirmar que passam**

Run: `cd backend && pytest tests/test_arquitetos_decisores.py -v`
Expected: todos os testes PASSED.

- [ ] **Step 8: Commit**

```bash
git add backend/app/models/crm.py backend/app/models/__init__.py backend/app/schemas/crm.py backend/app/api/v1/endpoints/arquitetos.py backend/tests/test_arquitetos_decisores.py
git commit -m "feat: add DecisorArquiteto CRUD (multi-contact decision-makers per architect)"
```

---

### Task 3: Model, schema e endpoints de `ConcorrenteArquiteto`

**Files:**
- Modify: `backend/app/models/crm.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/schemas/crm.py`
- Modify: `backend/app/api/v1/endpoints/arquitetos.py`
- Create: `backend/tests/test_arquitetos_concorrentes.py`

**Interfaces:**
- Consumes: fixtures de `tests/conftest.py` (Task 1); helper `_get_arquiteto_ou_404` (Task 2).
- Produces: model `ConcorrenteArquiteto` (`app.models.crm.ConcorrenteArquiteto`, campos `id, arquiteto_id, nome_concorrente, percentual_fechamento_estimado, observacoes, registrado_por_id, criado_em, atualizado_em`), schemas `ConcorrenteArquitetoCreate`/`ConcorrenteArquitetoResponse`, endpoints `GET/POST /arquitetos/{arquiteto_id}/concorrentes`, `PATCH/DELETE /arquitetos/{arquiteto_id}/concorrentes/{concorrente_id}`. Usado pela Task 7 (`calcular_risco_concorrencia`).

- [ ] **Step 1: Escrever os testes (falhando) em `backend/tests/test_arquitetos_concorrentes.py`**

```python
def _criar_arquiteto(auth_client, nome="Ana Arquiteta"):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": nome})
    assert resp.status_code == 201
    return resp.json()


def test_criar_concorrente(auth_client):
    arquiteto = _criar_arquiteto(auth_client)

    resp = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/concorrentes",
        json={"nome_concorrente": "Móveis Rivais", "percentual_fechamento_estimado": 40},
    )

    assert resp.status_code == 201
    data = resp.json()
    assert data["nome_concorrente"] == "Móveis Rivais"
    assert data["percentual_fechamento_estimado"] == 40
    assert data["arquiteto_id"] == arquiteto["id"]
    assert data["registrado_por_id"] is not None


def test_criar_concorrente_percentual_invalido_422(auth_client):
    arquiteto = _criar_arquiteto(auth_client)

    resp = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/concorrentes",
        json={"nome_concorrente": "Móveis Rivais", "percentual_fechamento_estimado": 150},
    )

    assert resp.status_code == 422


def test_listar_concorrentes_ordenado_por_percentual_desc(auth_client):
    arquiteto = _criar_arquiteto(auth_client)
    auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/concorrentes",
        json={"nome_concorrente": "Loja A", "percentual_fechamento_estimado": 20},
    )
    auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/concorrentes",
        json={"nome_concorrente": "Loja B", "percentual_fechamento_estimado": 70},
    )

    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/concorrentes")

    assert resp.status_code == 200
    nomes = [c["nome_concorrente"] for c in resp.json()]
    assert nomes == ["Loja B", "Loja A"]


def test_atualizar_concorrente(auth_client):
    arquiteto = _criar_arquiteto(auth_client)
    concorrente = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/concorrentes",
        json={"nome_concorrente": "Loja A", "percentual_fechamento_estimado": 20},
    ).json()

    resp = auth_client.patch(
        f"/api/v1/arquitetos/{arquiteto['id']}/concorrentes/{concorrente['id']}",
        json={"nome_concorrente": "Loja A", "percentual_fechamento_estimado": 55},
    )

    assert resp.status_code == 200
    assert resp.json()["percentual_fechamento_estimado"] == 55


def test_remover_concorrente(auth_client):
    arquiteto = _criar_arquiteto(auth_client)
    concorrente = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/concorrentes",
        json={"nome_concorrente": "Loja A", "percentual_fechamento_estimado": 20},
    ).json()

    resp = auth_client.delete(f"/api/v1/arquitetos/{arquiteto['id']}/concorrentes/{concorrente['id']}")
    assert resp.status_code == 204

    listagem = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/concorrentes").json()
    assert listagem == []
```

- [ ] **Step 2: Rodar e confirmar que os testes falham**

Run: `cd backend && pytest tests/test_arquitetos_concorrentes.py -v`
Expected: FAIL (404 nas rotas — ainda não existem).

- [ ] **Step 3: Adicionar o model em `backend/app/models/crm.py`** (ao final do arquivo)

```python
class ConcorrenteArquiteto(Base):
    """Percepção manual de onde o arquiteto costuma fechar com a concorrência.
    Dado subjetivo — nunca entra no cálculo automático de score."""
    __tablename__ = "concorrentes_arquitetos"

    id = Column(Integer, primary_key=True, index=True)
    arquiteto_id = Column(Integer, ForeignKey("arquitetos.id"), nullable=False)

    nome_concorrente = Column(String(200), nullable=False)
    percentual_fechamento_estimado = Column(Float, nullable=False)  # 0-100
    observacoes = Column(Text, nullable=True)
    registrado_por_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    arquiteto = relationship("Arquiteto", foreign_keys=[arquiteto_id])
    registrado_por = relationship("User", foreign_keys=[registrado_por_id])

    def __repr__(self):
        return f"<ConcorrenteArquiteto {self.nome_concorrente} [arquiteto={self.arquiteto_id}]>"
```

Adicione `Float` ao import do topo do arquivo se ainda não estiver lá:

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum, Text, ForeignKey, Date, Float
```

- [ ] **Step 4: Corrigir/completar `backend/app/models/__init__.py`**

```python
from app.models.crm import Lead, InteracaoLead, Cliente, Arquiteto, DecisorArquiteto, ConcorrenteArquiteto
```

E adicione `"ConcorrenteArquiteto"` à lista `__all__`.

- [ ] **Step 5: Adicionar os schemas em `backend/app/schemas/crm.py`** (após o bloco `# === DECISOR ARQUITETO ===`)

```python
# === CONCORRENTE ARQUITETO ===

class ConcorrenteArquitetoCreate(BaseModel):
    nome_concorrente: str
    percentual_fechamento_estimado: float = Field(..., ge=0, le=100)
    observacoes: Optional[str] = None


class ConcorrenteArquitetoResponse(BaseModel):
    id: int
    arquiteto_id: int
    nome_concorrente: str
    percentual_fechamento_estimado: float
    observacoes: Optional[str]
    registrado_por_id: Optional[int]
    criado_em: datetime

    class Config:
        from_attributes = True
```

Adicione `Field` ao import do topo do arquivo:

```python
from pydantic import BaseModel, EmailStr, Field
```

- [ ] **Step 6: Adicionar os endpoints em `backend/app/api/v1/endpoints/arquitetos.py`**

Atualize os imports do topo:

```python
from app.models.crm import Arquiteto, DecisorArquiteto, ConcorrenteArquiteto
from app.schemas.crm import (
    ArquitetoCreate, ArquitetoResponse,
    DecisorArquitetoCreate, DecisorArquitetoResponse,
    ConcorrenteArquitetoCreate, ConcorrenteArquitetoResponse,
)
```

Adicione ao final do arquivo:

```python
# === CONCORRENTES ===

@router.get("/{arquiteto_id}/concorrentes", response_model=List[ConcorrenteArquitetoResponse])
def listar_concorrentes(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_arquiteto_ou_404(arquiteto_id, db)
    return (
        db.query(ConcorrenteArquiteto)
        .filter(ConcorrenteArquiteto.arquiteto_id == arquiteto_id)
        .order_by(ConcorrenteArquiteto.percentual_fechamento_estimado.desc())
        .all()
    )


@router.post("/{arquiteto_id}/concorrentes", response_model=ConcorrenteArquitetoResponse, status_code=201)
def criar_concorrente(
    arquiteto_id: int,
    payload: ConcorrenteArquitetoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.RECEPCAO
    )),
):
    _get_arquiteto_ou_404(arquiteto_id, db)
    concorrente = ConcorrenteArquiteto(
        arquiteto_id=arquiteto_id,
        registrado_por_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(concorrente)
    db.commit()
    db.refresh(concorrente)
    return concorrente


@router.patch("/{arquiteto_id}/concorrentes/{concorrente_id}", response_model=ConcorrenteArquitetoResponse)
def atualizar_concorrente(
    arquiteto_id: int,
    concorrente_id: int,
    payload: ConcorrenteArquitetoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.RECEPCAO
    )),
):
    concorrente = (
        db.query(ConcorrenteArquiteto)
        .filter(ConcorrenteArquiteto.id == concorrente_id, ConcorrenteArquiteto.arquiteto_id == arquiteto_id)
        .first()
    )
    if not concorrente:
        raise HTTPException(404, "Concorrente não encontrado")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(concorrente, field, value)

    db.commit()
    db.refresh(concorrente)
    return concorrente


@router.delete("/{arquiteto_id}/concorrentes/{concorrente_id}", status_code=204)
def remover_concorrente(
    arquiteto_id: int,
    concorrente_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.RECEPCAO
    )),
):
    concorrente = (
        db.query(ConcorrenteArquiteto)
        .filter(ConcorrenteArquiteto.id == concorrente_id, ConcorrenteArquiteto.arquiteto_id == arquiteto_id)
        .first()
    )
    if not concorrente:
        raise HTTPException(404, "Concorrente não encontrado")
    db.delete(concorrente)
    db.commit()
```

- [ ] **Step 7: Rodar todos os testes de arquitetos e confirmar que passam**

Run: `cd backend && pytest tests/test_arquitetos_decisores.py tests/test_arquitetos_concorrentes.py -v`
Expected: todos PASSED.

- [ ] **Step 8: Commit**

```bash
git add backend/app/models/crm.py backend/app/models/__init__.py backend/app/schemas/crm.py backend/app/api/v1/endpoints/arquitetos.py backend/tests/test_arquitetos_concorrentes.py
git commit -m "feat: add ConcorrenteArquiteto CRUD (manual competitor tracking per architect)"
```

---

### Task 4: Funções puras — Recência, Frequência, Valor, RFV, Potencial

**Files:**
- Create: `backend/app/services/arquiteto_score.py`
- Create: `backend/tests/test_arquiteto_score_rfv_potencial.py`

**Interfaces:**
- Produces: `pontuar_recencia(dias: Optional[int]) -> int`, `pontuar_frequencia(qtd: int) -> int`, `pontuar_valor(soma: float) -> int`, `calcular_rfv(recencia, frequencia, valor) -> float`, `pontuar_potencial(qtd: int) -> int` — todas puras (sem DB), usadas pelo orquestrador na Task 7.

- [ ] **Step 1: Escrever os testes (falhando) em `backend/tests/test_arquiteto_score_rfv_potencial.py`**

```python
import pytest
from app.services.arquiteto_score import (
    pontuar_recencia,
    pontuar_frequencia,
    pontuar_valor,
    calcular_rfv,
    pontuar_potencial,
)


@pytest.mark.parametrize("dias,esperado", [
    (None, 0),
    (0, 100),
    (30, 100),
    (31, 70),
    (90, 70),
    (91, 40),
    (180, 40),
    (181, 20),
    (365, 20),
    (366, 5),
])
def test_pontuar_recencia(dias, esperado):
    assert pontuar_recencia(dias) == esperado


@pytest.mark.parametrize("qtd,esperado", [
    (0, 0),
    (1, 30),
    (2, 60),
    (3, 60),
    (4, 85),
    (6, 85),
    (7, 100),
    (10, 100),
])
def test_pontuar_frequencia(qtd, esperado):
    assert pontuar_frequencia(qtd) == esperado


@pytest.mark.parametrize("soma,esperado", [
    (0, 0),
    (None, 0),
    (49_999, 30),
    (50_000, 55),
    (149_999, 55),
    (150_000, 75),
    (349_999, 75),
    (350_000, 90),
    (699_999, 90),
    (700_000, 100),
    (1_000_000, 100),
])
def test_pontuar_valor(soma, esperado):
    assert pontuar_valor(soma) == esperado


def test_calcular_rfv_e_media_simples():
    assert calcular_rfv(recencia=100, frequencia=60, valor=30) == pytest.approx(63.3, abs=0.1)


@pytest.mark.parametrize("qtd,esperado", [
    (0, 0),
    (1, 40),
    (2, 65),
    (3, 65),
    (4, 85),
    (6, 85),
    (7, 100),
])
def test_pontuar_potencial(qtd, esperado):
    assert pontuar_potencial(qtd) == esperado
```

- [ ] **Step 2: Rodar e confirmar que falham**

Run: `cd backend && pytest tests/test_arquiteto_score_rfv_potencial.py -v`
Expected: FAIL com `ModuleNotFoundError: No module named 'app.services.arquiteto_score'`.

- [ ] **Step 3: Criar `backend/app/services/arquiteto_score.py`**

```python
"""
Serviço de Score de Arquitetos — RFV x Potencial x Lealdade.
Critérios de pontuação são faixas fixas (mesmo padrão de app/services/briefing_score.py),
não percentil relativo entre arquitetos. Limiares numéricos ficam como constantes
nomeadas abaixo, ajustáveis sem reescrever a lógica.
"""
from typing import Optional


def pontuar_recencia(dias_desde_ultimo_projeto: Optional[int]) -> int:
    if dias_desde_ultimo_projeto is None:
        return 0
    if dias_desde_ultimo_projeto <= 30:
        return 100
    if dias_desde_ultimo_projeto <= 90:
        return 70
    if dias_desde_ultimo_projeto <= 180:
        return 40
    if dias_desde_ultimo_projeto <= 365:
        return 20
    return 5


def pontuar_frequencia(qtd_projetos_12_meses: int) -> int:
    if qtd_projetos_12_meses <= 0:
        return 0
    if qtd_projetos_12_meses == 1:
        return 30
    if qtd_projetos_12_meses <= 3:
        return 60
    if qtd_projetos_12_meses <= 6:
        return 85
    return 100


def pontuar_valor(soma_valor_contratos_12_meses: Optional[float]) -> int:
    if not soma_valor_contratos_12_meses or soma_valor_contratos_12_meses <= 0:
        return 0
    if soma_valor_contratos_12_meses < 50_000:
        return 30
    if soma_valor_contratos_12_meses < 150_000:
        return 55
    if soma_valor_contratos_12_meses < 350_000:
        return 75
    if soma_valor_contratos_12_meses < 700_000:
        return 90
    return 100


def calcular_rfv(recencia: float, frequencia: float, valor: float) -> float:
    return round((recencia + frequencia + valor) / 3, 1)


def pontuar_potencial(qtd_leads_e_projetos_ativos: int) -> int:
    if qtd_leads_e_projetos_ativos <= 0:
        return 0
    if qtd_leads_e_projetos_ativos == 1:
        return 40
    if qtd_leads_e_projetos_ativos <= 3:
        return 65
    if qtd_leads_e_projetos_ativos <= 6:
        return 85
    return 100
```

- [ ] **Step 4: Rodar e confirmar que passam**

Run: `cd backend && pytest tests/test_arquiteto_score_rfv_potencial.py -v`
Expected: todos PASSED.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/arquiteto_score.py backend/tests/test_arquiteto_score_rfv_potencial.py
git commit -m "feat: add RFV and Potencial scoring functions for arquitetos"
```

---

### Task 5: Funções puras — Lealdade (tempo de parceria, consistência, taxa de conversão)

**Files:**
- Modify: `backend/app/services/arquiteto_score.py`
- Create: `backend/tests/test_arquiteto_score_lealdade.py`

**Interfaces:**
- Consumes: nenhuma função da Task 4 diretamente (mas mora no mesmo módulo).
- Produces: `pontuar_tempo_parceria(meses: int) -> int`, `pontuar_consistencia(meses_com_projeto: int) -> float`, `pontuar_taxa_conversao(fechados, perdidos, desqualificados) -> float`, `calcular_lealdade(tempo_parceria, consistencia, taxa_conversao) -> float`, `calcular_score_geral(rfv, potencial, lealdade) -> float`, `meses_entre(inicio, fim) -> int`, `contar_meses_distintos(datas) -> int` — usadas pelo orquestrador na Task 7.

- [ ] **Step 1: Escrever os testes (falhando) em `backend/tests/test_arquiteto_score_lealdade.py`**

```python
from datetime import datetime
import pytest
from app.services.arquiteto_score import (
    pontuar_tempo_parceria,
    pontuar_consistencia,
    pontuar_taxa_conversao,
    calcular_lealdade,
    calcular_score_geral,
    meses_entre,
    contar_meses_distintos,
)


@pytest.mark.parametrize("meses,esperado", [
    (0, 20),
    (2, 20),
    (3, 50),
    (11, 50),
    (12, 75),
    (23, 75),
    (24, 100),
    (48, 100),
])
def test_pontuar_tempo_parceria(meses, esperado):
    assert pontuar_tempo_parceria(meses) == esperado


@pytest.mark.parametrize("meses_com_projeto,esperado", [
    (0, 0.0),
    (6, 50.0),
    (12, 100.0),
    (15, 100.0),  # capado em 12
])
def test_pontuar_consistencia(meses_com_projeto, esperado):
    assert pontuar_consistencia(meses_com_projeto) == esperado


@pytest.mark.parametrize("fechados,perdidos,desq,esperado", [
    (0, 0, 0, 50.0),   # sem dado — neutro
    (5, 5, 0, 50.0),
    (8, 2, 0, 80.0),
    (0, 5, 5, 0.0),
])
def test_pontuar_taxa_conversao(fechados, perdidos, desq, esperado):
    assert pontuar_taxa_conversao(fechados, perdidos, desq) == esperado


def test_calcular_lealdade_e_media_simples():
    assert calcular_lealdade(tempo_parceria=100, consistencia=50, taxa_conversao=0) == pytest.approx(50.0)


def test_calcular_score_geral_e_media_simples():
    assert calcular_score_geral(rfv=90, potencial=60, lealdade=30) == pytest.approx(60.0)


def test_meses_entre():
    assert meses_entre(datetime(2025, 1, 15), datetime(2026, 3, 1)) == 13


def test_meses_entre_sem_inicio_retorna_zero():
    assert meses_entre(None, datetime(2026, 3, 1)) == 0


def test_contar_meses_distintos():
    datas = [
        datetime(2026, 1, 5),
        datetime(2026, 1, 20),
        datetime(2026, 3, 1),
    ]
    assert contar_meses_distintos(datas) == 2


def test_contar_meses_distintos_ignora_none():
    assert contar_meses_distintos([datetime(2026, 1, 5), None]) == 1
```

- [ ] **Step 2: Rodar e confirmar que falham**

Run: `cd backend && pytest tests/test_arquiteto_score_lealdade.py -v`
Expected: FAIL com `ImportError` (funções ainda não existem em `arquiteto_score.py`).

- [ ] **Step 3: Adicionar ao final de `backend/app/services/arquiteto_score.py`**

```python
from datetime import datetime
from typing import Iterable, Optional


def pontuar_tempo_parceria(meses_desde_cadastro: int) -> int:
    if meses_desde_cadastro < 3:
        return 20
    if meses_desde_cadastro < 12:
        return 50
    if meses_desde_cadastro < 24:
        return 75
    return 100


def pontuar_consistencia(meses_com_projeto_ultimos_12: int) -> float:
    meses = max(0, min(12, meses_com_projeto_ultimos_12))
    return round((meses / 12) * 100, 1)


def pontuar_taxa_conversao(leads_fechados: int, leads_perdidos: int, leads_desqualificados: int) -> float:
    total_terminal = leads_fechados + leads_perdidos + leads_desqualificados
    if total_terminal == 0:
        return 50.0
    return round((leads_fechados / total_terminal) * 100, 1)


def calcular_lealdade(tempo_parceria: float, consistencia: float, taxa_conversao: float) -> float:
    return round((tempo_parceria + consistencia + taxa_conversao) / 3, 1)


def calcular_score_geral(rfv: float, potencial: float, lealdade: float) -> float:
    return round((rfv + potencial + lealdade) / 3, 1)


def meses_entre(inicio: Optional[datetime], fim: datetime) -> int:
    if inicio is None:
        return 0
    return (fim.year - inicio.year) * 12 + (fim.month - inicio.month)


def contar_meses_distintos(datas: Iterable[Optional[datetime]]) -> int:
    chaves = {(d.year, d.month) for d in datas if d is not None}
    return len(chaves)
```

Mova o `from typing import Optional` do topo do arquivo para não duplicar o import — deixe um único bloco de imports no topo do arquivo reunindo `Optional`, `Iterable` e `datetime`.

- [ ] **Step 4: Rodar e confirmar que passam**

Run: `cd backend && pytest tests/test_arquiteto_score_lealdade.py -v`
Expected: todos PASSED.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/arquiteto_score.py backend/tests/test_arquiteto_score_lealdade.py
git commit -m "feat: add Lealdade scoring functions for arquitetos"
```

---

### Task 6: Funções puras — Segmentação, Flags, Risco de Concorrência

**Files:**
- Modify: `backend/app/services/arquiteto_score.py`
- Create: `backend/tests/test_arquiteto_score_segmento_flags.py`

**Interfaces:**
- Produces: `determinar_segmento(**kwargs) -> str`, `determinar_flags(**kwargs) -> list[str]`, `calcular_risco_concorrencia(percentuais: list[float]) -> dict` — usadas pelo orquestrador na Task 7.

- [ ] **Step 1: Escrever os testes (falhando) em `backend/tests/test_arquiteto_score_segmento_flags.py`**

```python
import pytest
from app.services.arquiteto_score import (
    determinar_segmento,
    determinar_flags,
    calcular_risco_concorrencia,
)


def _base_segmento(**overrides):
    base = dict(
        tem_historico=True,
        dias_desde_cadastro=400,
        em_risco=False,
        score_geral=50,
        rfv=50,
        potencial=50,
        lealdade=50,
    )
    base.update(overrides)
    return base


def test_segmento_inativo_sem_historico():
    assert determinar_segmento(**_base_segmento(tem_historico=False)) == "inativo"


def test_segmento_novo_promissor():
    assert determinar_segmento(**_base_segmento(dias_desde_cadastro=10)) == "novo_promissor"


def test_segmento_em_risco():
    assert determinar_segmento(**_base_segmento(em_risco=True)) == "em_risco"


def test_segmento_campeao():
    assert determinar_segmento(**_base_segmento(score_geral=90)) == "campeao"


def test_segmento_parceiro_fiel():
    assert determinar_segmento(**_base_segmento(lealdade=80, rfv=60, score_geral=60)) == "parceiro_fiel"


def test_segmento_em_ascensao():
    assert determinar_segmento(**_base_segmento(potencial=75, lealdade=30, rfv=30, score_geral=45)) == "em_ascensao"


def test_segmento_ocasional_fallback():
    assert determinar_segmento(**_base_segmento(
        score_geral=40, rfv=40, potencial=40, lealdade=40,
    )) == "ocasional"


def test_novo_promissor_tem_precedencia_sobre_campeao():
    """Um arquiteto recém-cadastrado com score alto ainda é 'novo_promissor', não 'campeao'."""
    assert determinar_segmento(**_base_segmento(dias_desde_cadastro=5, score_geral=95)) == "novo_promissor"


def test_flags_top_indicador():
    flags = determinar_flags(score_geral=90, potencial=10, valor_pontos=10, em_risco=False)
    assert "top_indicador" in flags


def test_flags_em_risco_de_perda():
    flags = determinar_flags(score_geral=10, potencial=10, valor_pontos=10, em_risco=True)
    assert "em_risco_de_perda" in flags


def test_flags_alto_potencial():
    flags = determinar_flags(score_geral=10, potencial=80, valor_pontos=10, em_risco=False)
    assert "alto_potencial" in flags


def test_flags_indicacao_alto_valor():
    flags = determinar_flags(score_geral=10, potencial=10, valor_pontos=95, em_risco=False)
    assert "indicacao_alto_valor" in flags


def test_flags_pode_ter_zero():
    flags = determinar_flags(score_geral=10, potencial=10, valor_pontos=10, em_risco=False)
    assert flags == []


def test_flags_pode_ter_varias_simultaneas():
    flags = determinar_flags(score_geral=90, potencial=80, valor_pontos=95, em_risco=False)
    assert set(flags) == {"top_indicador", "alto_potencial", "indicacao_alto_valor"}


@pytest.mark.parametrize("percentuais,nivel_esperado", [
    ([], "baixo"),
    ([10, 20], "baixo"),
    ([29], "baixo"),
    ([30], "medio"),
    ([60], "medio"),
    ([61], "alto"),
    ([10, 80], "alto"),
])
def test_calcular_risco_concorrencia_nivel(percentuais, nivel_esperado):
    resultado = calcular_risco_concorrencia(percentuais)
    assert resultado["nivel"] == nivel_esperado


def test_calcular_risco_concorrencia_usa_maior_percentual():
    resultado = calcular_risco_concorrencia([10, 45, 30])
    assert resultado["risco"] == 45
```

- [ ] **Step 2: Rodar e confirmar que falham**

Run: `cd backend && pytest tests/test_arquiteto_score_segmento_flags.py -v`
Expected: FAIL com `ImportError`.

- [ ] **Step 3: Adicionar ao final de `backend/app/services/arquiteto_score.py`**

```python
from typing import Any, Dict, List


def determinar_segmento(
    *,
    tem_historico: bool,
    dias_desde_cadastro: int,
    em_risco: bool,
    score_geral: float,
    rfv: float,
    potencial: float,
    lealdade: float,
) -> str:
    if not tem_historico:
        return "inativo"
    if dias_desde_cadastro < 90:
        return "novo_promissor"
    if em_risco:
        return "em_risco"
    if score_geral >= 85:
        return "campeao"
    if lealdade >= 75 and rfv >= 50:
        return "parceiro_fiel"
    if potencial >= 70:
        return "em_ascensao"
    return "ocasional"


def determinar_flags(
    *,
    score_geral: float,
    potencial: float,
    valor_pontos: float,
    em_risco: bool,
) -> List[str]:
    flags = []
    if score_geral >= 85:
        flags.append("top_indicador")
    if em_risco:
        flags.append("em_risco_de_perda")
    if potencial >= 70:
        flags.append("alto_potencial")
    if valor_pontos >= 90:
        flags.append("indicacao_alto_valor")
    return flags


def calcular_risco_concorrencia(percentuais: List[float]) -> Dict[str, Any]:
    maior = max(percentuais) if percentuais else 0.0
    if maior < 30:
        nivel = "baixo"
    elif maior <= 60:
        nivel = "medio"
    else:
        nivel = "alto"
    return {"risco": round(maior, 1), "nivel": nivel}
```

- [ ] **Step 4: Rodar e confirmar que passam**

Run: `cd backend && pytest tests/test_arquiteto_score_segmento_flags.py -v`
Expected: todos PASSED.

- [ ] **Step 5: Consolidar os imports no topo de `backend/app/services/arquiteto_score.py`**

Substitua os múltiplos `from typing import ...` e `from datetime import ...` espalhados pelo arquivo (adicionados nas Tasks 4-6) por um único bloco no topo:

```python
"""
Serviço de Score de Arquitetos — RFV x Potencial x Lealdade.
Critérios de pontuação são faixas fixas (mesmo padrão de app/services/briefing_score.py),
não percentil relativo entre arquitetos. Limiares numéricos ficam como constantes
nomeadas abaixo, ajustáveis sem reescrever a lógica.
"""
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional
```

Rode `pytest tests/test_arquiteto_score_rfv_potencial.py tests/test_arquiteto_score_lealdade.py tests/test_arquiteto_score_segmento_flags.py -v` de novo depois de limpar os imports para confirmar que nada quebrou.

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/arquiteto_score.py backend/tests/test_arquiteto_score_segmento_flags.py
git commit -m "feat: add segmentation, flags and competitor-risk functions for arquitetos"
```

---

### Task 7: Orquestrador `calcular_score` + endpoint `GET /arquitetos/{id}/score`

**Files:**
- Modify: `backend/app/services/arquiteto_score.py`
- Modify: `backend/app/schemas/crm.py`
- Modify: `backend/app/api/v1/endpoints/arquitetos.py`
- Create: `backend/tests/test_arquiteto_score_endpoint.py`

**Interfaces:**
- Consumes: todas as funções puras das Tasks 4-6; models `Arquiteto`, `Lead`, `StatusFunil` (`app.models.crm`), `Projeto`, `StatusProjeto` (`app.models.projeto`), `ConcorrenteArquiteto` (`app.models.crm`, Task 3).
- Produces: `calcular_score(db: Session, arquiteto: Arquiteto) -> dict` e endpoint `GET /arquitetos/{arquiteto_id}/score`.

- [ ] **Step 1: Escrever o teste de integração (falhando) em `backend/tests/test_arquiteto_score_endpoint.py`**

```python
from datetime import datetime, timedelta
from app.models.crm import Arquiteto, Lead, StatusFunil, ConcorrenteArquiteto
from app.models.projeto import Projeto, StatusProjeto


def test_score_arquiteto_sem_historico_e_inativo(auth_client, db_session):
    arquiteto = Arquiteto(nome="Sem Histórico")
    db_session.add(arquiteto)
    db_session.commit()

    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto.id}/score")

    assert resp.status_code == 200
    data = resp.json()
    assert data["segmento"] == "inativo"
    assert data["rfv"] == 0.0
    assert data["potencial"] == 0.0
    assert data["flags"] == []
    assert data["concorrencia"]["nivel"] == "baixo"
    assert data["concorrencia"]["concorrentes"] == []


def test_score_arquiteto_com_projeto_recente_e_valor_alto(auth_client, db_session):
    agora = datetime.utcnow()
    arquiteto = Arquiteto(nome="Alto Performer", criado_em=agora - timedelta(days=800))
    db_session.add(arquiteto)
    db_session.commit()

    cliente_id = _criar_cliente(db_session)
    projeto = Projeto(
        codigo="PROJ-TEST-001",
        cliente_id=cliente_id,
        arquiteto_id=arquiteto.id,
        status=StatusProjeto.CONCLUIDO,
        valor_contrato=800_000,
        criado_em=agora - timedelta(days=10),
    )
    db_session.add(projeto)
    db_session.commit()

    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto.id}/score")

    assert resp.status_code == 200
    data = resp.json()
    assert data["detalhes"]["recencia"] == 100
    assert data["detalhes"]["valor"] == 100
    assert "indicacao_alto_valor" in data["flags"]


def test_score_arquiteto_em_risco(auth_client, db_session):
    agora = datetime.utcnow()
    arquiteto = Arquiteto(nome="Sumiu", criado_em=agora - timedelta(days=800))
    db_session.add(arquiteto)
    db_session.commit()

    cliente_id = _criar_cliente(db_session)
    projeto = Projeto(
        codigo="PROJ-TEST-002",
        cliente_id=cliente_id,
        arquiteto_id=arquiteto.id,
        status=StatusProjeto.CONCLUIDO,
        valor_contrato=100_000,
        criado_em=agora - timedelta(days=400),
    )
    db_session.add(projeto)
    db_session.commit()

    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto.id}/score")

    assert resp.status_code == 200
    data = resp.json()
    assert data["segmento"] == "em_risco"
    assert "em_risco_de_perda" in data["flags"]


def test_score_inclui_concorrencia_sem_afetar_pilares(auth_client, db_session):
    agora = datetime.utcnow()
    arquiteto = Arquiteto(nome="Com Concorrente", criado_em=agora - timedelta(days=800))
    db_session.add(arquiteto)
    db_session.commit()

    concorrente = ConcorrenteArquiteto(
        arquiteto_id=arquiteto.id,
        nome_concorrente="Loja Rival",
        percentual_fechamento_estimado=90,
    )
    db_session.add(concorrente)
    db_session.commit()

    resp_sem_concorrente_no_score = auth_client.get(f"/api/v1/arquitetos/{arquiteto.id}/score")
    data = resp_sem_concorrente_no_score.json()

    assert data["concorrencia"]["risco"] == 90
    assert data["concorrencia"]["nivel"] == "alto"
    assert len(data["concorrencia"]["concorrentes"]) == 1
    # concorrência não deve mexer nos pilares objetivos
    assert data["rfv"] == 0.0
    assert data["potencial"] == 0.0
    assert data["lealdade"] != None


def test_score_arquiteto_inexistente_404(auth_client):
    resp = auth_client.get("/api/v1/arquitetos/9999/score")
    assert resp.status_code == 404


def _criar_cliente(db_session):
    from app.models.crm import Cliente
    cliente = Cliente(nome="Cliente Teste", telefone="11999999999")
    db_session.add(cliente)
    db_session.commit()
    return cliente.id
```

- [ ] **Step 2: Rodar e confirmar que falham**

Run: `cd backend && pytest tests/test_arquiteto_score_endpoint.py -v`
Expected: FAIL — rota `/score` retorna 404 (não existe ainda) e/ou `AttributeError` em `calcular_score`.

- [ ] **Step 3: Atualizar o bloco de imports no topo de `backend/app/services/arquiteto_score.py`**

Troque a linha de imports consolidada na Task 6 (`from datetime import datetime` + `from typing import ...`) por:

```python
from datetime import datetime, timedelta
from typing import Any, Dict, Iterable, List, Optional

from sqlalchemy.orm import Session

from app.models.crm import Arquiteto, Lead, StatusFunil, ConcorrenteArquiteto
from app.models.projeto import Projeto, StatusProjeto
```

- [ ] **Step 4: Adicionar o orquestrador ao final de `backend/app/services/arquiteto_score.py`**

```python
LEADS_STATUS_TERMINAL = {StatusFunil.FECHADO, StatusFunil.PERDIDO, StatusFunil.DESQUALIFICADO}
PROJETO_STATUS_ENCERRADO = {StatusProjeto.CONCLUIDO, StatusProjeto.CANCELADO}


def calcular_score(db: Session, arquiteto: Arquiteto) -> Dict[str, Any]:
    agora = datetime.utcnow()
    limite_12_meses = agora - timedelta(days=365)

    projetos = (
        db.query(Projeto)
        .filter(Projeto.arquiteto_id == arquiteto.id, Projeto.arquivado == False)
        .all()
    )
    leads = db.query(Lead).filter(Lead.arquiteto_id == arquiteto.id).all()
    concorrentes = (
        db.query(ConcorrenteArquiteto)
        .filter(ConcorrenteArquiteto.arquiteto_id == arquiteto.id)
        .all()
    )

    projetos_12m = [p for p in projetos if p.criado_em and p.criado_em >= limite_12_meses]

    datas_projetos = [p.criado_em for p in projetos if p.criado_em]
    ultimo_projeto_em = max(datas_projetos) if datas_projetos else None
    dias_desde_ultimo_projeto = (agora - ultimo_projeto_em).days if ultimo_projeto_em else None

    datas_leads = [l.criado_em for l in leads if l.criado_em]
    ultimo_lead_em = max(datas_leads) if datas_leads else None
    candidatos_atividade = [d for d in (ultimo_projeto_em, ultimo_lead_em) if d]
    ultima_atividade_em = max(candidatos_atividade) if candidatos_atividade else None
    dias_desde_ultima_atividade = (agora - ultima_atividade_em).days if ultima_atividade_em else None

    recencia = pontuar_recencia(dias_desde_ultimo_projeto)
    frequencia = pontuar_frequencia(len(projetos_12m))
    soma_valor = sum(p.valor_contrato for p in projetos_12m if p.valor_contrato)
    valor = pontuar_valor(soma_valor)
    rfv = calcular_rfv(recencia, frequencia, valor)

    leads_ativos = [l for l in leads if l.status_funil not in LEADS_STATUS_TERMINAL]
    projetos_ativos = [p for p in projetos if p.status not in PROJETO_STATUS_ENCERRADO]
    potencial = pontuar_potencial(len(leads_ativos) + len(projetos_ativos))

    meses_desde_cadastro = meses_entre(arquiteto.criado_em, agora)
    tempo_parceria = pontuar_tempo_parceria(meses_desde_cadastro)
    meses_com_projeto = contar_meses_distintos(p.criado_em for p in projetos_12m)
    consistencia = pontuar_consistencia(meses_com_projeto)
    leads_fechados = sum(1 for l in leads if l.status_funil == StatusFunil.FECHADO)
    leads_perdidos = sum(1 for l in leads if l.status_funil == StatusFunil.PERDIDO)
    leads_desqualificados = sum(1 for l in leads if l.status_funil == StatusFunil.DESQUALIFICADO)
    taxa_conversao = pontuar_taxa_conversao(leads_fechados, leads_perdidos, leads_desqualificados)
    lealdade = calcular_lealdade(tempo_parceria, consistencia, taxa_conversao)

    score_geral = calcular_score_geral(rfv, potencial, lealdade)

    frequencia_all_time = len(projetos)
    em_risco = frequencia_all_time > 0 and (
        dias_desde_ultima_atividade is None or dias_desde_ultima_atividade > 180
    )
    tem_historico = bool(projetos) or bool(leads)
    dias_desde_cadastro = (agora - arquiteto.criado_em).days if arquiteto.criado_em else 0

    segmento = determinar_segmento(
        tem_historico=tem_historico,
        dias_desde_cadastro=dias_desde_cadastro,
        em_risco=em_risco,
        score_geral=score_geral,
        rfv=rfv,
        potencial=potencial,
        lealdade=lealdade,
    )
    flags = determinar_flags(
        score_geral=score_geral,
        potencial=potencial,
        valor_pontos=valor,
        em_risco=em_risco,
    )

    concorrencia = calcular_risco_concorrencia(
        [c.percentual_fechamento_estimado for c in concorrentes]
    )
    concorrencia["concorrentes"] = [
        {
            "id": c.id,
            "nome_concorrente": c.nome_concorrente,
            "percentual_fechamento_estimado": c.percentual_fechamento_estimado,
        }
        for c in concorrentes
    ]

    return {
        "rfv": rfv,
        "potencial": potencial,
        "lealdade": lealdade,
        "score_geral": score_geral,
        "segmento": segmento,
        "flags": flags,
        "detalhes": {
            "recencia": recencia,
            "frequencia": frequencia,
            "valor": valor,
            "dias_desde_ultimo_projeto": dias_desde_ultimo_projeto,
            "projetos_12_meses": len(projetos_12m),
            "soma_valor_contratos_12_meses": soma_valor,
            "leads_ativos": len(leads_ativos),
            "projetos_ativos": len(projetos_ativos),
            "tempo_parceria": tempo_parceria,
            "consistencia": consistencia,
            "taxa_conversao": taxa_conversao,
            "meses_desde_cadastro": meses_desde_cadastro,
        },
        "concorrencia": concorrencia,
    }
```

Substitua o `limite_12_meses = agora - __import__("datetime").timedelta(days=365)` por um import limpo: adicione `timedelta` ao import já existente no topo do arquivo (`from datetime import datetime, timedelta`) e troque a linha por:

```python
    limite_12_meses = agora - timedelta(days=365)
```

- [ ] **Step 5: Adicionar o schema de resposta em `backend/app/schemas/crm.py`** (após `# === CONCORRENTE ARQUITETO ===`)

```python
# === SCORE DO ARQUITETO ===

class ArquitetoScoreResponse(BaseModel):
    rfv: float
    potencial: float
    lealdade: float
    score_geral: float
    segmento: str
    flags: List[str]
    detalhes: dict
    concorrencia: dict
```

- [ ] **Step 6: Adicionar o endpoint em `backend/app/api/v1/endpoints/arquitetos.py`**

Atualize os imports do topo:

```python
from app.schemas.crm import (
    ArquitetoCreate, ArquitetoResponse,
    DecisorArquitetoCreate, DecisorArquitetoResponse,
    ConcorrenteArquitetoCreate, ConcorrenteArquitetoResponse,
    ArquitetoScoreResponse,
)
from app.services import arquiteto_score as score_service
```

Adicione a rota (pode ficar logo após `_get_arquiteto_ou_404`, antes das rotas de decisores):

```python
@router.get("/{arquiteto_id}/score", response_model=ArquitetoScoreResponse)
def obter_score_arquiteto(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    arquiteto = _get_arquiteto_ou_404(arquiteto_id, db)
    return score_service.calcular_score(db, arquiteto)
```

- [ ] **Step 7: Rodar e confirmar que passam**

Run: `cd backend && pytest tests/test_arquiteto_score_endpoint.py -v`
Expected: todos PASSED.

- [ ] **Step 8: Rodar a suíte completa**

Run: `cd backend && pytest -v`
Expected: todos os testes de todas as tasks (1-7) PASSED, nenhuma falha.

- [ ] **Step 9: Commit**

```bash
git add backend/app/services/arquiteto_score.py backend/app/schemas/crm.py backend/app/api/v1/endpoints/arquitetos.py backend/tests/test_arquiteto_score_endpoint.py
git commit -m "feat: add calcular_score orchestrator and GET /arquitetos/{id}/score endpoint"
```

---

## Depois deste plano

- Rodar `python seed.py` localmente (com Postgres ativo) para que as tabelas `decisores_arquitetos` e `concorrentes_arquitetos` sejam criadas de fato no banco de desenvolvimento.
- Testar manualmente via `/docs` (Swagger): criar um arquiteto, adicionar decisores/concorrentes, conferir `GET /arquitetos/{id}/score` com dados reais.
- Frontend do módulo de Arquitetos (`ArquitetosPage.jsx`, `arquitetosApi`, rota, item de sidebar) — próximo spec, fora deste plano.
