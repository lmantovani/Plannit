# Colaboradores RH01 — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o backend do módulo Colaboradores — RH01 Cadastro do Colaborador — conforme `docs/superpowers/specs/2026-07-26-colaboradores-rh01-design.md`: perfil RH, Departamento/Cargo, ficha completa do colaborador, histórico imutável de salário/cargo, documentos, desligamento e mini organograma.

**Architecture:** Domínio novo (`app/models/colaborador.py`, `app/schemas/colaborador.py`, `app/api/v1/endpoints/colaboradores.py`), seguindo exatamente os padrões já usados no módulo Arquitetos/Especificadores (`crm.py`/`arquitetos.py`): `response_model` Pydantic com `Config.from_attributes = True`, properties no model SQLAlchemy para campos calculados (`nome` relacionado), rotas fixas antes de dinâmicas.

**Tech Stack:** FastAPI, SQLAlchemy 2.0, Pydantic v2 (`field_validator` para CPF), pytest + SQLite in-memory (`tests/conftest.py`).

## Global Constraints

- Não há Alembic versionado neste repo (`alembic/versions/` vazio, `seed.py` usa `Base.metadata.create_all`) — nenhuma task deste plano precisa de migration para rodar localmente/nos testes. Isso só vira relevante ao subir para o Postgres do Railway (fora de escopo deste plano, ver seção final).
- Todo endpoint novo usa `response_model` Pydantic com `class Config: from_attributes = True` — não serialização manual em dict, exceto onde o campo não existe como atributo/property do model (nesses casos, construir o dict manualmente, igual a `listar_metas_visitas`/`definir_meta_visitas` em `arquitetos.py`).
- Campos monetários usam `Float`, não `Numeric` — segue a convenção já usada em `Projeto.valor_contrato` (`app/models/projeto.py:83`). O pseudocódigo do spec usa `Numeric(10,2)`; este plano usa `Float` para bater com o resto do código.
- Rotas fixas (`/departamentos`, `/cargos`) DEVEM ser declaradas antes de `GET /{colaborador_id}` no arquivo — mesma regra já documentada no CLAUDE.md e seguida em `arquitetos.py` (`/kpis`, `/metas-visitas` antes de `/{arquiteto_id}`).
- Todas as rotas deste módulo usam `require_roles(PerfilUsuario.RH, PerfilUsuario.DIRETORIA)` — nenhum endpoint de Colaboradores é acessível para outros perfis nesta entrega (ver Decisões de escopo do spec).
- `salario_clt`, `remuneracao_complementar`, `data_vigencia_salario` e `cargo_id` NUNCA são editáveis via `PUT /colaboradores/{id}` — só via os endpoints dedicados de histórico (RH-RN001).
- Commits deste plano usam `git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>"` (padrão já usado no plano da Especificadores, garante autoria correta independente da config local da máquina).

---

## Task 1: Perfil RH, Departamento e Cargo

**Files:**
- Modify: `backend/app/models/user.py`
- Create: `backend/app/models/colaborador.py`
- Create: `backend/app/schemas/colaborador.py`
- Create: `backend/app/api/v1/endpoints/colaboradores.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/api/v1/__init__.py`
- Modify: `backend/tests/conftest.py`
- Test: `backend/tests/test_colaboradores_departamentos_cargos.py`

**Interfaces:**
- Produces:
  - `app.models.user.PerfilUsuario.RH` (`"rh"`)
  - `app.models.colaborador.Departamento(id, nome, ativo)`
  - `app.models.colaborador.Cargo(id, nome, departamento_id, ativo)` com property `departamento_nome`
  - Router `colaboradores.router`, prefixo `/colaboradores`, registrado em `api_router`
  - `GET/POST /colaboradores/departamentos`, `PUT /colaboradores/departamentos/{departamento_id}`
  - `GET/POST /colaboradores/cargos` (query opcional `departamento_id`), `PUT /colaboradores/cargos/{cargo_id}`
  - Fixture `rh_user` em `conftest.py` (mesmo padrão de `diretoria_user`/`projetista_user`)

- [ ] **Step 1: Escrever o teste que falha**

Criar `backend/tests/test_colaboradores_departamentos_cargos.py`:

```python
def test_criar_departamento(auth_client):
    resp = auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Comercial"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["nome"] == "Comercial"
    assert data["ativo"] is True


def test_listar_departamentos(auth_client):
    auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Comercial"})
    auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Produção"})

    resp = auth_client.get("/api/v1/colaboradores/departamentos")
    assert resp.status_code == 200
    nomes = [d["nome"] for d in resp.json()]
    assert nomes == ["Comercial", "Produção"]


def test_editar_departamento_inativar(auth_client):
    dep = auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Comercial"}).json()

    resp = auth_client.put(f"/api/v1/colaboradores/departamentos/{dep['id']}", json={"ativo": False})
    assert resp.status_code == 200
    assert resp.json()["ativo"] is False
    assert resp.json()["nome"] == "Comercial"


def test_criar_cargo(auth_client):
    dep = auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Comercial"}).json()

    resp = auth_client.post("/api/v1/colaboradores/cargos", json={"nome": "Vendedor", "departamento_id": dep["id"]})
    assert resp.status_code == 201
    data = resp.json()
    assert data["nome"] == "Vendedor"
    assert data["departamento_id"] == dep["id"]
    assert data["departamento_nome"] == "Comercial"
    assert data["ativo"] is True


def test_listar_cargos_filtro_departamento(auth_client):
    dep1 = auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Comercial"}).json()
    dep2 = auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Produção"}).json()
    auth_client.post("/api/v1/colaboradores/cargos", json={"nome": "Vendedor", "departamento_id": dep1["id"]})
    auth_client.post("/api/v1/colaboradores/cargos", json={"nome": "Projetista", "departamento_id": dep2["id"]})

    resp = auth_client.get("/api/v1/colaboradores/cargos", params={"departamento_id": dep1["id"]})
    assert resp.status_code == 200
    nomes = [c["nome"] for c in resp.json()]
    assert nomes == ["Vendedor"]


def test_editar_cargo(auth_client):
    dep = auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Comercial"}).json()
    cargo = auth_client.post("/api/v1/colaboradores/cargos", json={"nome": "Vendedor", "departamento_id": dep["id"]}).json()

    resp = auth_client.put(f"/api/v1/colaboradores/cargos/{cargo['id']}", json={"nome": "Vendedor Sênior"})
    assert resp.status_code == 200
    assert resp.json()["nome"] == "Vendedor Sênior"


def test_departamentos_bloqueado_para_perfil_sem_permissao(create_client_com_user, projetista_user):
    projetista_client = create_client_com_user(projetista_user)
    resp = projetista_client.get("/api/v1/colaboradores/departamentos")
    assert resp.status_code == 403


def test_rh_tem_acesso(create_client_com_user, rh_user):
    rh_client = create_client_com_user(rh_user)
    resp = rh_client.post("/api/v1/colaboradores/departamentos", json={"nome": "Comercial"})
    assert resp.status_code == 201
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/test_colaboradores_departamentos_cargos.py -v`
Expected: FAIL — `404 Not Found` (rotas não existem) e `fixture 'rh_user' not found`.

- [ ] **Step 3: Adicionar o perfil RH em `app/models/user.py`**

Em `PerfilUsuario`, adicionar (logo após `ARQUITETO = "arquiteto"`, antes de `CLIENTE`):

```python
    RH = "rh"
```

Em `PERFIS_INTERNOS`, adicionar `PerfilUsuario.RH` à lista (não adicionar a `PERFIS_GESTAO` — RH não tem "acesso total ao sistema", só ao módulo Colaboradores).

- [ ] **Step 4: Criar `app/models/colaborador.py`**

```python
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Departamento(Base):
    __tablename__ = "departamentos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    ativo = Column(Boolean, default=True)

    def __repr__(self):
        return f"<Departamento {self.nome}>"


class Cargo(Base):
    __tablename__ = "cargos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    departamento_id = Column(Integer, ForeignKey("departamentos.id"), nullable=False)
    ativo = Column(Boolean, default=True)

    departamento = relationship("Departamento")

    @property
    def departamento_nome(self):
        return self.departamento.nome if self.departamento else None

    def __repr__(self):
        return f"<Cargo {self.nome}>"
```

- [ ] **Step 5: Criar `app/schemas/colaborador.py`**

```python
from pydantic import BaseModel
from typing import Optional


# === DEPARTAMENTO ===

class DepartamentoCreate(BaseModel):
    nome: str


class DepartamentoUpdate(BaseModel):
    nome: Optional[str] = None
    ativo: Optional[bool] = None


class DepartamentoResponse(BaseModel):
    id: int
    nome: str
    ativo: bool

    class Config:
        from_attributes = True


# === CARGO ===

class CargoCreate(BaseModel):
    nome: str
    departamento_id: int


class CargoUpdate(BaseModel):
    nome: Optional[str] = None
    departamento_id: Optional[int] = None
    ativo: Optional[bool] = None


class CargoResponse(BaseModel):
    id: int
    nome: str
    departamento_id: int
    departamento_nome: Optional[str] = None
    ativo: bool

    class Config:
        from_attributes = True
```

- [ ] **Step 6: Criar `app/api/v1/endpoints/colaboradores.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import require_roles
from app.models.user import User, PerfilUsuario
from app.models.colaborador import Departamento, Cargo
from app.schemas.colaborador import (
    DepartamentoCreate, DepartamentoUpdate, DepartamentoResponse,
    CargoCreate, CargoUpdate, CargoResponse,
)

router = APIRouter(prefix="/colaboradores", tags=["Colaboradores"])

_ROLES_MODULO = (PerfilUsuario.RH, PerfilUsuario.DIRETORIA)


# === DEPARTAMENTOS ===

@router.get("/departamentos", response_model=List[DepartamentoResponse])
def listar_departamentos(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    return db.query(Departamento).order_by(Departamento.nome).all()


@router.post("/departamentos", response_model=DepartamentoResponse, status_code=201)
def criar_departamento(
    payload: DepartamentoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    departamento = Departamento(**payload.model_dump())
    db.add(departamento)
    db.commit()
    db.refresh(departamento)
    return departamento


@router.put("/departamentos/{departamento_id}", response_model=DepartamentoResponse)
def atualizar_departamento(
    departamento_id: int,
    payload: DepartamentoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    departamento = db.query(Departamento).filter(Departamento.id == departamento_id).first()
    if not departamento:
        raise HTTPException(404, "Departamento não encontrado")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(departamento, field, value)
    db.commit()
    db.refresh(departamento)
    return departamento


# === CARGOS ===

@router.get("/cargos", response_model=List[CargoResponse])
def listar_cargos(
    departamento_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    query = db.query(Cargo)
    if departamento_id:
        query = query.filter(Cargo.departamento_id == departamento_id)
    return query.order_by(Cargo.nome).all()


@router.post("/cargos", response_model=CargoResponse, status_code=201)
def criar_cargo(
    payload: CargoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    if not db.query(Departamento).filter(Departamento.id == payload.departamento_id).first():
        raise HTTPException(400, "Departamento inválido")
    cargo = Cargo(**payload.model_dump())
    db.add(cargo)
    db.commit()
    db.refresh(cargo)
    return cargo


@router.put("/cargos/{cargo_id}", response_model=CargoResponse)
def atualizar_cargo(
    cargo_id: int,
    payload: CargoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    cargo = db.query(Cargo).filter(Cargo.id == cargo_id).first()
    if not cargo:
        raise HTTPException(404, "Cargo não encontrado")
    dados = payload.model_dump(exclude_unset=True)
    if "departamento_id" in dados and not db.query(Departamento).filter(Departamento.id == dados["departamento_id"]).first():
        raise HTTPException(400, "Departamento inválido")
    for field, value in dados.items():
        setattr(cargo, field, value)
    db.commit()
    db.refresh(cargo)
    return cargo
```

- [ ] **Step 7: Registrar o router e os models**

Em `backend/app/models/__init__.py`, adicionar o import e o `__all__`:

```python
from app.models.colaborador import Departamento, Cargo
```

E em `__all__`: `"Departamento", "Cargo",`.

Em `backend/app/api/v1/__init__.py`:

```python
from app.api.v1.endpoints import auth, leads, briefings, dashboard, users, clientes, arquitetos, projetos, colaboradores
```

E adicionar `api_router.include_router(colaboradores.router)` junto dos demais.

- [ ] **Step 8: Adicionar a fixture `rh_user` em `tests/conftest.py`**

Logo após a fixture `projetista_user`:

```python
@pytest.fixture()
def rh_user(db_session):
    user = User(
        nome="RH Teste",
        email="rh.teste@plannit.com.br",
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.RH,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user
```

- [ ] **Step 9: Rodar a suíte completa**

Run: `cd backend && python -m pytest -q`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add backend/app/models/user.py backend/app/models/colaborador.py backend/app/models/__init__.py backend/app/schemas/colaborador.py backend/app/api/v1/endpoints/colaboradores.py backend/app/api/v1/__init__.py backend/tests/conftest.py backend/tests/test_colaboradores_departamentos_cargos.py
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add modulo Colaboradores (perfil RH, Departamento e Cargo)

Base do RH01 (Cadastro do Colaborador): novo perfil RH no
PerfilUsuario, entidades Departamento e Cargo com CRUD restrito a
RH/DIRETORIA, router registrado em /colaboradores.
EOF
)"
```

---

## Task 2: Colaborador — criação, listagem, detalhe e mini organograma

**Files:**
- Modify: `backend/app/models/colaborador.py`
- Modify: `backend/app/schemas/colaborador.py`
- Modify: `backend/app/api/v1/endpoints/colaboradores.py`
- Modify: `backend/app/models/__init__.py`
- Test: `backend/tests/test_colaboradores_cadastro.py`

**Interfaces:**
- Consumes: `Departamento`, `Cargo` (Task 1).
- Produces:
  - `app.models.colaborador.RegimeContratacao` (`CLT`, `PJ`), `ModalidadeTrabalho` (`PRESENCIAL`, `HIBRIDO`, `REMOTO`)
  - `app.models.colaborador.Colaborador` — todos os campos da seção 2 do spec, com relationships `cargo`, `departamento`, `gestor` (via `subordinados_diretos` self-referencial) e properties `cargo_nome`, `departamento_nome`, `gestor_nome`
  - `app.models.colaborador.HistoricoSalarialColaborador`, `HistoricoCargoColaborador` (só o model nesta task — endpoints de histórico ficam nas Tasks 4/5; a criação do colaborador já grava o primeiro registro de cada um)
  - `ColaboradorCreate` (todos os campos de cadastro, com validação de CPF)
  - `ColaboradorResponse` (todos os campos + `cargo_nome`, `departamento_nome`, `gestor_nome`, `subordinados_diretos: List[ColaboradorResumo]`)
  - `GET /colaboradores/` (filtros: `departamento_id`, `cargo_id`, `regime`, `is_active`, `busca`), `POST /colaboradores/`, `GET /colaboradores/{colaborador_id}`

- [ ] **Step 1: Escrever o teste que falha**

Criar `backend/tests/test_colaboradores_cadastro.py`:

```python
def _criar_departamento_e_cargo(auth_client, dep_nome="Comercial", cargo_nome="Vendedor"):
    dep = auth_client.post("/api/v1/colaboradores/departamentos", json={"nome": dep_nome}).json()
    cargo = auth_client.post("/api/v1/colaboradores/cargos", json={"nome": cargo_nome, "departamento_id": dep["id"]}).json()
    return dep, cargo


def _payload_base(cargo_id, departamento_id, cpf="52998224725", nome="Ana Colaboradora"):
    return {
        "nome": nome,
        "cpf": cpf,
        "data_admissao": "2024-01-10",
        "cargo_id": cargo_id,
        "departamento_id": departamento_id,
        "regime": "clt",
        "salario_clt": 3500.0,
        "data_vigencia_salario": "2024-01-10",
    }


def test_criar_colaborador(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)

    resp = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"]))
    assert resp.status_code == 201
    data = resp.json()
    assert data["nome"] == "Ana Colaboradora"
    assert data["cpf"] == "52998224725"
    assert data["cargo_nome"] == "Vendedor"
    assert data["departamento_nome"] == "Comercial"
    assert data["is_active"] is True
    assert data["salario_clt"] == 3500.0


def test_criar_colaborador_cpf_invalido_422(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)

    resp = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"], cpf="11111111111"))
    assert resp.status_code == 422


def test_criar_colaborador_cpf_duplicado_400(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"]))

    resp = auth_client.post(
        "/api/v1/colaboradores/",
        json=_payload_base(cargo["id"], dep["id"], nome="Outro Nome"),
    )
    assert resp.status_code == 400


def test_listar_colaboradores_filtros(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"], cpf="52998224725", nome="Ana"))
    auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"], cpf="15350946056", nome="Bruno"))

    resp = auth_client.get("/api/v1/colaboradores/", params={"busca": "ana"})
    nomes = [c["nome"] for c in resp.json()]
    assert nomes == ["Ana"]

    resp = auth_client.get("/api/v1/colaboradores/", params={"departamento_id": dep["id"]})
    assert len(resp.json()) == 2


def test_organograma_gestor_e_subordinados(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    gestor = auth_client.post(
        "/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"], cpf="52998224725", nome="Gestora")
    ).json()

    payload_subordinado = _payload_base(cargo["id"], dep["id"], cpf="15350946056", nome="Subordinado")
    payload_subordinado["gestor_id"] = gestor["id"]
    subordinado = auth_client.post("/api/v1/colaboradores/", json=payload_subordinado).json()

    resp_gestor = auth_client.get(f"/api/v1/colaboradores/{gestor['id']}")
    assert resp_gestor.json()["gestor_nome"] is None
    assert [s["nome"] for s in resp_gestor.json()["subordinados_diretos"]] == ["Subordinado"]

    resp_subordinado = auth_client.get(f"/api/v1/colaboradores/{subordinado['id']}")
    assert resp_subordinado.json()["gestor_nome"] == "Gestora"
    assert resp_subordinado.json()["subordinados_diretos"] == []


def test_colaboradores_bloqueado_para_perfil_sem_permissao(create_client_com_user, projetista_user):
    projetista_client = create_client_com_user(projetista_user)
    resp = projetista_client.get("/api/v1/colaboradores/")
    assert resp.status_code == 403
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/test_colaboradores_cadastro.py -v`
Expected: FAIL — `404 Not Found` (rotas não existem ainda).

- [ ] **Step 3: Adicionar enums e models a `app/models/colaborador.py`**

No topo do arquivo, ampliar os imports:

```python
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, DateTime, Float, Text, Enum as SAEnum
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
import enum
from app.core.database import Base
```

Logo abaixo dos imports, adicionar os enums:

```python
class RegimeContratacao(str, enum.Enum):
    CLT = "clt"
    PJ = "pj"


class ModalidadeTrabalho(str, enum.Enum):
    PRESENCIAL = "presencial"
    HIBRIDO = "hibrido"
    REMOTO = "remoto"
```

No final do arquivo, adicionar:

```python
class Colaborador(Base):
    __tablename__ = "colaboradores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Identificação
    nome = Column(String(200), nullable=False)
    cpf = Column(String(14), nullable=False, unique=True, index=True)
    rg = Column(String(20), nullable=True)
    data_nascimento = Column(Date, nullable=True)
    sexo = Column(String(20), nullable=True)
    estado_civil = Column(String(30), nullable=True)
    foto_url = Column(String(500), nullable=True)

    # Contato
    telefone = Column(String(20), nullable=True)
    email_pessoal = Column(String(200), nullable=True)
    email_corporativo = Column(String(200), nullable=True)
    endereco_logradouro = Column(String(300), nullable=True)
    endereco_numero = Column(String(20), nullable=True)
    endereco_complemento = Column(String(100), nullable=True)
    endereco_bairro = Column(String(100), nullable=True)
    endereco_cidade = Column(String(100), nullable=True)
    endereco_estado = Column(String(2), nullable=True)
    endereco_cep = Column(String(10), nullable=True)

    # Contratação
    data_admissao = Column(Date, nullable=False)
    cargo_id = Column(Integer, ForeignKey("cargos.id"), nullable=False)
    departamento_id = Column(Integer, ForeignKey("departamentos.id"), nullable=False)
    regime = Column(SAEnum(RegimeContratacao), nullable=False)
    tipo_contrato = Column(String(100), nullable=True)

    # PJ (condicional a regime == PJ)
    pj_cnpj = Column(String(20), nullable=True)
    pj_contrato_url = Column(String(500), nullable=True)
    pj_valor_mensal = Column(Float, nullable=True)
    pj_vigencia_inicio = Column(Date, nullable=True)
    pj_vigencia_fim = Column(Date, nullable=True)

    # Remuneração atual (denormalizado — trilha em HistoricoSalarialColaborador)
    salario_clt = Column(Float, nullable=True)
    remuneracao_complementar = Column(Float, nullable=True)
    data_vigencia_salario = Column(Date, nullable=True)

    # Regime de trabalho
    carga_horaria = Column(String(50), nullable=True)
    escala = Column(String(100), nullable=True)
    modalidade = Column(SAEnum(ModalidadeTrabalho), nullable=True)
    jornada_especial = Column(String(200), nullable=True)

    # Dados bancários
    banco = Column(String(100), nullable=True)
    agencia = Column(String(20), nullable=True)
    conta = Column(String(20), nullable=True)
    tipo_conta = Column(String(20), nullable=True)

    # Organograma
    gestor_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=True)

    # Desligamento
    is_active = Column(Boolean, default=True)
    data_desligamento = Column(Date, nullable=True)
    tipo_desligamento = Column(String(50), nullable=True)
    motivo_desligamento = Column(Text, nullable=True)
    entrevista_saida = Column(Text, nullable=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    cargo = relationship("Cargo", foreign_keys=[cargo_id])
    departamento = relationship("Departamento", foreign_keys=[departamento_id])
    subordinados_diretos = relationship(
        "Colaborador", backref=backref("gestor", remote_side=[id])
    )

    @property
    def cargo_nome(self):
        return self.cargo.nome if self.cargo else None

    @property
    def departamento_nome(self):
        return self.departamento.nome if self.departamento else None

    @property
    def gestor_nome(self):
        return self.gestor.nome if self.gestor else None

    def __repr__(self):
        return f"<Colaborador {self.nome}>"


class HistoricoSalarialColaborador(Base):
    __tablename__ = "historico_salarial_colaboradores"

    id = Column(Integer, primary_key=True, index=True)
    colaborador_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=False)
    salario_clt = Column(Float, nullable=False)
    remuneracao_complementar = Column(Float, nullable=True)
    data_vigencia = Column(Date, nullable=False)
    motivo = Column(String(300), nullable=False)
    registrado_por_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    registrado_por = relationship("User", foreign_keys=[registrado_por_id])


class HistoricoCargoColaborador(Base):
    __tablename__ = "historico_cargo_colaboradores"

    id = Column(Integer, primary_key=True, index=True)
    colaborador_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=False)
    cargo_anterior_id = Column(Integer, ForeignKey("cargos.id"), nullable=True)
    cargo_novo_id = Column(Integer, ForeignKey("cargos.id"), nullable=False)
    data = Column(Date, nullable=False)
    aprovado_por_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    justificativa = Column(String(300), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    cargo_anterior = relationship("Cargo", foreign_keys=[cargo_anterior_id])
    cargo_novo = relationship("Cargo", foreign_keys=[cargo_novo_id])
    aprovado_por = relationship("User", foreign_keys=[aprovado_por_id])
```

`tipo_desligamento` (na `Colaborador`) e `tipo` (na `DocumentoColaborador`, Task 6) ficam como `String` no banco, não `SAEnum` — para simplificar a coluna. A validação de quais valores são aceitos acontece no schema Pydantic: `TipoDesligamento` é definido em `app/schemas/colaborador.py` na Task 5 (junto de `DesligamentoRequest`) e `TipoDocumentoColaborador` na Task 6 (junto de `DocumentoCreate`) — cada um no ponto onde é usado pela primeira vez, evitando enum "morto" numa task que ainda não o consome.

- [ ] **Step 4: Adicionar os schemas em `app/schemas/colaborador.py`**

No topo do arquivo, ampliar os imports:

```python
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime
import re
from app.models.colaborador import RegimeContratacao, ModalidadeTrabalho
```

Campos de enum usam o tipo do enum diretamente (`RegimeContratacao`, não `str`) — mesmo padrão já usado em `ArquitetoCreate.tipo: TipoEspecificador` (`app/schemas/crm.py`), para que o FastAPI rejeite com `422` um valor inválido em vez de deixar passar qualquer string.

No final do arquivo, adicionar:

```python
# === CPF ===

def _cpf_valido(cpf: str) -> bool:
    cpf = re.sub(r"\D", "", cpf)
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False
    for i in (9, 10):
        soma = sum(int(cpf[num]) * ((i + 1) - num) for num in range(i))
        digito = ((soma * 10) % 11) % 10
        if digito != int(cpf[i]):
            return False
    return True


# === COLABORADOR ===

class ColaboradorCreate(BaseModel):
    nome: str
    cpf: str
    rg: Optional[str] = None
    data_nascimento: Optional[date] = None
    sexo: Optional[str] = None
    estado_civil: Optional[str] = None
    foto_url: Optional[str] = None

    telefone: Optional[str] = None
    email_pessoal: Optional[str] = None
    email_corporativo: Optional[str] = None
    endereco_logradouro: Optional[str] = None
    endereco_numero: Optional[str] = None
    endereco_complemento: Optional[str] = None
    endereco_bairro: Optional[str] = None
    endereco_cidade: Optional[str] = None
    endereco_estado: Optional[str] = None
    endereco_cep: Optional[str] = None

    data_admissao: date
    cargo_id: int
    departamento_id: int
    regime: RegimeContratacao
    tipo_contrato: Optional[str] = None

    pj_cnpj: Optional[str] = None
    pj_contrato_url: Optional[str] = None
    pj_valor_mensal: Optional[float] = None
    pj_vigencia_inicio: Optional[date] = None
    pj_vigencia_fim: Optional[date] = None

    salario_clt: Optional[float] = None
    remuneracao_complementar: Optional[float] = None
    data_vigencia_salario: Optional[date] = None

    carga_horaria: Optional[str] = None
    escala: Optional[str] = None
    modalidade: Optional[ModalidadeTrabalho] = None
    jornada_especial: Optional[str] = None

    banco: Optional[str] = None
    agencia: Optional[str] = None
    conta: Optional[str] = None
    tipo_conta: Optional[str] = None

    gestor_id: Optional[int] = None
    user_id: Optional[int] = None

    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, v):
        if not _cpf_valido(v):
            raise ValueError("CPF inválido")
        return re.sub(r"\D", "", v)


class ColaboradorUpdate(BaseModel):
    nome: Optional[str] = None
    rg: Optional[str] = None
    data_nascimento: Optional[date] = None
    sexo: Optional[str] = None
    estado_civil: Optional[str] = None
    foto_url: Optional[str] = None

    telefone: Optional[str] = None
    email_pessoal: Optional[str] = None
    email_corporativo: Optional[str] = None
    endereco_logradouro: Optional[str] = None
    endereco_numero: Optional[str] = None
    endereco_complemento: Optional[str] = None
    endereco_bairro: Optional[str] = None
    endereco_cidade: Optional[str] = None
    endereco_estado: Optional[str] = None
    endereco_cep: Optional[str] = None

    departamento_id: Optional[int] = None
    tipo_contrato: Optional[str] = None

    pj_cnpj: Optional[str] = None
    pj_contrato_url: Optional[str] = None
    pj_valor_mensal: Optional[float] = None
    pj_vigencia_inicio: Optional[date] = None
    pj_vigencia_fim: Optional[date] = None

    carga_horaria: Optional[str] = None
    escala: Optional[str] = None
    modalidade: Optional[ModalidadeTrabalho] = None
    jornada_especial: Optional[str] = None

    banco: Optional[str] = None
    agencia: Optional[str] = None
    conta: Optional[str] = None
    tipo_conta: Optional[str] = None

    gestor_id: Optional[int] = None
    user_id: Optional[int] = None


class ColaboradorResumo(BaseModel):
    id: int
    nome: str
    cargo_nome: Optional[str] = None

    class Config:
        from_attributes = True


class ColaboradorResponse(BaseModel):
    id: int
    user_id: Optional[int]
    nome: str
    cpf: str
    rg: Optional[str]
    data_nascimento: Optional[date]
    sexo: Optional[str]
    estado_civil: Optional[str]
    foto_url: Optional[str]

    telefone: Optional[str]
    email_pessoal: Optional[str]
    email_corporativo: Optional[str]
    endereco_logradouro: Optional[str]
    endereco_numero: Optional[str]
    endereco_complemento: Optional[str]
    endereco_bairro: Optional[str]
    endereco_cidade: Optional[str]
    endereco_estado: Optional[str]
    endereco_cep: Optional[str]

    data_admissao: date
    cargo_id: int
    cargo_nome: Optional[str] = None
    departamento_id: int
    departamento_nome: Optional[str] = None
    regime: RegimeContratacao
    tipo_contrato: Optional[str]

    pj_cnpj: Optional[str]
    pj_contrato_url: Optional[str]
    pj_valor_mensal: Optional[float]
    pj_vigencia_inicio: Optional[date]
    pj_vigencia_fim: Optional[date]

    salario_clt: Optional[float]
    remuneracao_complementar: Optional[float]
    data_vigencia_salario: Optional[date]

    carga_horaria: Optional[str]
    escala: Optional[str]
    modalidade: Optional[ModalidadeTrabalho]
    jornada_especial: Optional[str]

    banco: Optional[str]
    agencia: Optional[str]
    conta: Optional[str]
    tipo_conta: Optional[str]

    gestor_id: Optional[int]
    gestor_nome: Optional[str] = None
    subordinados_diretos: List[ColaboradorResumo] = []

    is_active: bool
    data_desligamento: Optional[date]
    tipo_desligamento: Optional[str]
    motivo_desligamento: Optional[str]
    entrevista_saida: Optional[str]

    criado_em: Optional[datetime]

    class Config:
        from_attributes = True
```

- [ ] **Step 5: Implementar os endpoints em `app/api/v1/endpoints/colaboradores.py`**

Ampliar os imports do topo:

```python
from datetime import date as date_type
from app.models.colaborador import (
    Departamento, Cargo, Colaborador, HistoricoSalarialColaborador, HistoricoCargoColaborador,
)
from app.schemas.colaborador import (
    DepartamentoCreate, DepartamentoUpdate, DepartamentoResponse,
    CargoCreate, CargoUpdate, CargoResponse,
    ColaboradorCreate, ColaboradorUpdate, ColaboradorResponse,
)
```

Adicionar, depois do bloco `# === CARGOS ===` e antes do fim do arquivo:

```python
# === COLABORADORES ===

@router.get("/", response_model=List[ColaboradorResponse])
def listar_colaboradores(
    departamento_id: Optional[int] = None,
    cargo_id: Optional[int] = None,
    regime: Optional[str] = None,
    is_active: Optional[bool] = None,
    busca: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    query = db.query(Colaborador)
    if departamento_id:
        query = query.filter(Colaborador.departamento_id == departamento_id)
    if cargo_id:
        query = query.filter(Colaborador.cargo_id == cargo_id)
    if regime:
        query = query.filter(Colaborador.regime == regime)
    if is_active is not None:
        query = query.filter(Colaborador.is_active == is_active)
    if busca:
        query = query.filter(Colaborador.nome.ilike(f"%{busca}%"))
    return query.order_by(Colaborador.nome).all()


@router.post("/", response_model=ColaboradorResponse, status_code=201)
def criar_colaborador(
    payload: ColaboradorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    if db.query(Colaborador).filter(Colaborador.cpf == payload.cpf).first():
        raise HTTPException(400, "CPF já cadastrado para outro colaborador")
    if not db.query(Cargo).filter(Cargo.id == payload.cargo_id).first():
        raise HTTPException(400, "Cargo inválido")
    if not db.query(Departamento).filter(Departamento.id == payload.departamento_id).first():
        raise HTTPException(400, "Departamento inválido")
    if payload.gestor_id and not db.query(Colaborador).filter(Colaborador.id == payload.gestor_id).first():
        raise HTTPException(400, "Gestor inválido")

    colaborador = Colaborador(**payload.model_dump())
    db.add(colaborador)
    db.commit()
    db.refresh(colaborador)

    if colaborador.salario_clt is not None:
        db.add(HistoricoSalarialColaborador(
            colaborador_id=colaborador.id,
            salario_clt=colaborador.salario_clt,
            remuneracao_complementar=colaborador.remuneracao_complementar,
            data_vigencia=colaborador.data_vigencia_salario or colaborador.data_admissao,
            motivo="Admissão",
            registrado_por_id=current_user.id,
        ))

    db.add(HistoricoCargoColaborador(
        colaborador_id=colaborador.id,
        cargo_anterior_id=None,
        cargo_novo_id=colaborador.cargo_id,
        data=colaborador.data_admissao,
        aprovado_por_id=current_user.id,
        justificativa="Admissão",
    ))
    db.commit()
    db.refresh(colaborador)
    return colaborador


@router.get("/{colaborador_id}", response_model=ColaboradorResponse)
def obter_colaborador(
    colaborador_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    return _get_colaborador_ou_404(colaborador_id, db)


def _get_colaborador_ou_404(colaborador_id: int, db: Session) -> Colaborador:
    colaborador = db.query(Colaborador).filter(Colaborador.id == colaborador_id).first()
    if not colaborador:
        raise HTTPException(404, "Colaborador não encontrado")
    return colaborador
```

- [ ] **Step 6: Registrar os models novos em `app/models/__init__.py`**

Trocar a linha adicionada na Task 1 por:

```python
from app.models.colaborador import (
    Departamento, Cargo, Colaborador,
    RegimeContratacao, ModalidadeTrabalho,
    HistoricoSalarialColaborador, HistoricoCargoColaborador,
)
```

E em `__all__`, trocar `"Departamento", "Cargo",` por:

```python
    "Departamento", "Cargo", "Colaborador",
    "RegimeContratacao", "ModalidadeTrabalho",
    "HistoricoSalarialColaborador", "HistoricoCargoColaborador",
```

- [ ] **Step 7: Rodar a suíte completa**

Run: `cd backend && python -m pytest -q`
Expected: PASS — este arquivo só cobre criação/listagem/detalhe/organograma, sem depender dos endpoints de histórico (que ainda não existem; a verificação de que a criação grava o primeiro registro de histórico fica para o final da Task 4, quando os dois `GET` de histórico já existem).

- [ ] **Step 8: Commit**

```bash
git add backend/app/models/colaborador.py backend/app/models/__init__.py backend/app/schemas/colaborador.py backend/app/api/v1/endpoints/colaboradores.py backend/tests/test_colaboradores_cadastro.py
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add cadastro de Colaborador com CPF, historico inicial e organograma

Model Colaborador completo (identificacao, contato, contratacao, PJ,
remuneracao atual, regime de trabalho, dados bancarios, desligamento).
POST /colaboradores/ valida CPF (digito verificador + unicidade) e ja
grava o primeiro registro em HistoricoSalarialColaborador/
HistoricoCargoColaborador. GET /colaboradores/{id} inclui gestor_nome e
subordinados_diretos (mini organograma via self-relacionamento).
EOF
)"
```

---

## Task 3: Editar colaborador (protegendo salário/cargo) e histórico salarial

**Files:**
- Modify: `backend/app/schemas/colaborador.py`
- Modify: `backend/app/api/v1/endpoints/colaboradores.py`
- Test: `backend/tests/test_colaboradores_cadastro.py` (roda de novo, agora completo)
- Test: `backend/tests/test_colaboradores_historico_salarial.py`

**Interfaces:**
- Consumes: `Colaborador`, `HistoricoSalarialColaborador` (Task 2).
- Produces:
  - `PUT /colaboradores/{colaborador_id}` → `ColaboradorResponse` (usa `ColaboradorUpdate`, que já não tem `salario_clt`/`cargo_id`/`remuneracao_complementar`/`data_vigencia_salario` — Task 2)
  - `HistoricoSalarialCreate(salario_clt, remuneracao_complementar, data_vigencia, motivo)`
  - `HistoricoSalarialResponse(id, colaborador_id, salario_clt, remuneracao_complementar, data_vigencia, motivo, registrado_por_id, registrado_por_nome, criado_em)`
  - `POST /colaboradores/{colaborador_id}/historico-salarial` → `HistoricoSalarialResponse` (grava histórico E atualiza `salario_clt`/`remuneracao_complementar`/`data_vigencia_salario` no `Colaborador`)
  - `GET /colaboradores/{colaborador_id}/historico-salarial` → `List[HistoricoSalarialResponse]`, mais recente primeiro

- [ ] **Step 1: Escrever o teste que falha**

Criar `backend/tests/test_colaboradores_historico_salarial.py`:

```python
from tests.test_colaboradores_cadastro import _criar_departamento_e_cargo, _payload_base


def test_editar_colaborador_dados_basicos(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    resp = auth_client.put(f"/api/v1/colaboradores/{criado['id']}", json={"telefone": "11988887777"})
    assert resp.status_code == 200
    assert resp.json()["telefone"] == "11988887777"


def test_editar_colaborador_nao_altera_salario_direto(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    resp = auth_client.put(f"/api/v1/colaboradores/{criado['id']}", json={"salario_clt": 99999.0})
    assert resp.status_code == 200
    assert resp.json()["salario_clt"] == 3500.0  # não mudou — campo extra ignorado por ColaboradorUpdate


def test_lancar_novo_salario_atualiza_atual_e_grava_historico(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    resp = auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/historico-salarial",
        json={"salario_clt": 4200.0, "data_vigencia": "2025-01-01", "motivo": "Reajuste anual"},
    )
    assert resp.status_code == 201
    assert resp.json()["salario_clt"] == 4200.0

    atualizado = auth_client.get(f"/api/v1/colaboradores/{criado['id']}").json()
    assert atualizado["salario_clt"] == 4200.0
    assert atualizado["data_vigencia_salario"] == "2025-01-01"

    historico = auth_client.get(f"/api/v1/colaboradores/{criado['id']}/historico-salarial").json()
    assert len(historico) == 2  # admissão + reajuste
    assert historico[0]["motivo"] == "Reajuste anual"  # mais recente primeiro
    assert historico[1]["motivo"] == "Admissão"
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/test_colaboradores_historico_salarial.py tests/test_colaboradores_cadastro.py -v`
Expected: FAIL — `PUT` e `POST/GET .../historico-salarial` retornam `404`/`405`.

- [ ] **Step 3: Adicionar os schemas de histórico salarial em `app/schemas/colaborador.py`**

No final do arquivo:

```python
# === HISTÓRICO SALARIAL ===

class HistoricoSalarialCreate(BaseModel):
    salario_clt: float
    remuneracao_complementar: Optional[float] = None
    data_vigencia: date
    motivo: str


class HistoricoSalarialResponse(BaseModel):
    id: int
    colaborador_id: int
    salario_clt: float
    remuneracao_complementar: Optional[float]
    data_vigencia: date
    motivo: str
    registrado_por_id: int
    registrado_por_nome: Optional[str] = None
    criado_em: Optional[datetime]

    class Config:
        from_attributes = True
```

E adicionar a property correspondente no model — em `app/models/colaborador.py`, na classe `HistoricoSalarialColaborador`, logo após `registrado_por = relationship(...)`:

```python
    @property
    def registrado_por_nome(self):
        return self.registrado_por.nome if self.registrado_por else None
```

- [ ] **Step 4: Implementar os endpoints em `app/api/v1/endpoints/colaboradores.py`**

Ampliar os imports:

```python
from app.schemas.colaborador import (
    DepartamentoCreate, DepartamentoUpdate, DepartamentoResponse,
    CargoCreate, CargoUpdate, CargoResponse,
    ColaboradorCreate, ColaboradorUpdate, ColaboradorResponse,
    HistoricoSalarialCreate, HistoricoSalarialResponse,
)
```

Adicionar logo após `obter_colaborador`:

```python
@router.put("/{colaborador_id}", response_model=ColaboradorResponse)
def atualizar_colaborador(
    colaborador_id: int,
    payload: ColaboradorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    colaborador = _get_colaborador_ou_404(colaborador_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(colaborador, field, value)
    db.commit()
    db.refresh(colaborador)
    return colaborador


@router.post("/{colaborador_id}/historico-salarial", response_model=HistoricoSalarialResponse, status_code=201)
def lancar_historico_salarial(
    colaborador_id: int,
    payload: HistoricoSalarialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    colaborador = _get_colaborador_ou_404(colaborador_id, db)

    registro = HistoricoSalarialColaborador(
        colaborador_id=colaborador_id,
        registrado_por_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(registro)

    colaborador.salario_clt = payload.salario_clt
    colaborador.remuneracao_complementar = payload.remuneracao_complementar
    colaborador.data_vigencia_salario = payload.data_vigencia

    db.commit()
    db.refresh(registro)
    return registro


@router.get("/{colaborador_id}/historico-salarial", response_model=List[HistoricoSalarialResponse])
def listar_historico_salarial(
    colaborador_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    _get_colaborador_ou_404(colaborador_id, db)
    return (
        db.query(HistoricoSalarialColaborador)
        .filter(HistoricoSalarialColaborador.colaborador_id == colaborador_id)
        .order_by(HistoricoSalarialColaborador.data_vigencia.desc(), HistoricoSalarialColaborador.id.desc())
        .all()
    )
```

`ColaboradorUpdate` (definido na Task 2) já não tem `salario_clt`/`remuneracao_complementar`/`data_vigencia_salario`/`cargo_id` — por isso `payload.model_dump(exclude_unset=True)` em `atualizar_colaborador` nunca inclui esses campos, mesmo que o cliente HTTP os envie no JSON (Pydantic ignora campos desconhecidos por padrão).

- [ ] **Step 5: Rodar a suíte completa**

Run: `cd backend && python -m pytest -q`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/app/schemas/colaborador.py backend/app/models/colaborador.py backend/app/api/v1/endpoints/colaboradores.py backend/tests/test_colaboradores_historico_salarial.py
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add PUT de colaborador e historico salarial

PUT /colaboradores/{id} edita dados cadastrais sem tocar em
salario/cargo atual (RH-RN001 — ColaboradorUpdate nao inclui esses
campos). POST/GET /colaboradores/{id}/historico-salarial: novo
lancamento atualiza o valor atual no Colaborador e fica registrado no
historico imutavel.
EOF
)"
```

---

## Task 4: Histórico de cargo (promoções)

**Files:**
- Modify: `backend/app/schemas/colaborador.py`
- Modify: `backend/app/models/colaborador.py`
- Modify: `backend/app/api/v1/endpoints/colaboradores.py`
- Test: `backend/tests/test_colaboradores_historico_cargo.py`

**Interfaces:**
- Consumes: `Colaborador`, `Cargo`, `HistoricoCargoColaborador` (Task 2).
- Produces:
  - `HistoricoCargoCreate(cargo_novo_id, data, justificativa)`
  - `HistoricoCargoResponse(id, colaborador_id, cargo_anterior_id, cargo_anterior_nome, cargo_novo_id, cargo_novo_nome, data, aprovado_por_id, aprovado_por_nome, justificativa, criado_em)`
  - `POST /colaboradores/{colaborador_id}/historico-cargo` → `HistoricoCargoResponse` (grava histórico E atualiza `cargo_id` no `Colaborador`)
  - `GET /colaboradores/{colaborador_id}/historico-cargo` → `List[HistoricoCargoResponse]`, mais recente primeiro

- [ ] **Step 1: Escrever o teste que falha**

Criar `backend/tests/test_colaboradores_historico_cargo.py`:

```python
from tests.test_colaboradores_cadastro import _criar_departamento_e_cargo, _payload_base


def test_promover_colaborador_atualiza_cargo_e_grava_historico(auth_client):
    dep, cargo_junior = _criar_departamento_e_cargo(auth_client, cargo_nome="Vendedor Júnior")
    cargo_pleno = auth_client.post(
        "/api/v1/colaboradores/cargos", json={"nome": "Vendedor Pleno", "departamento_id": dep["id"]}
    ).json()
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo_junior["id"], dep["id"])).json()

    resp = auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/historico-cargo",
        json={"cargo_novo_id": cargo_pleno["id"], "data": "2025-02-01", "justificativa": "Promoção por desempenho"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["cargo_anterior_id"] == cargo_junior["id"]
    assert data["cargo_anterior_nome"] == "Vendedor Júnior"
    assert data["cargo_novo_id"] == cargo_pleno["id"]
    assert data["cargo_novo_nome"] == "Vendedor Pleno"

    atualizado = auth_client.get(f"/api/v1/colaboradores/{criado['id']}").json()
    assert atualizado["cargo_id"] == cargo_pleno["id"]
    assert atualizado["cargo_nome"] == "Vendedor Pleno"

    historico = auth_client.get(f"/api/v1/colaboradores/{criado['id']}/historico-cargo").json()
    assert len(historico) == 2  # admissão + promoção
    assert historico[0]["justificativa"] == "Promoção por desempenho"
    assert historico[1]["justificativa"] == "Admissão"


def test_promover_colaborador_cargo_invalido_400(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    resp = auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/historico-cargo",
        json={"cargo_novo_id": 9999, "data": "2025-02-01"},
    )
    assert resp.status_code == 400


def test_criar_colaborador_grava_primeiro_historico_salarial_e_cargo(auth_client):
    """Fecha a verificação deixada pendente na Task 2: só dá pra checar os dois
    GET de histórico juntos depois que historico-cargo existe (esta task)."""
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    historico_salarial = auth_client.get(f"/api/v1/colaboradores/{criado['id']}/historico-salarial").json()
    assert len(historico_salarial) == 1
    assert historico_salarial[0]["salario_clt"] == 3500.0
    assert historico_salarial[0]["motivo"] == "Admissão"

    historico_cargo = auth_client.get(f"/api/v1/colaboradores/{criado['id']}/historico-cargo").json()
    assert len(historico_cargo) == 1
    assert historico_cargo[0]["cargo_anterior_id"] is None
    assert historico_cargo[0]["cargo_novo_id"] == cargo["id"]
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/test_colaboradores_historico_cargo.py -v`
Expected: FAIL — `404 Not Found`.

- [ ] **Step 3: Adicionar a property de nomes em `HistoricoCargoColaborador` (`app/models/colaborador.py`)**

Logo após `aprovado_por = relationship(...)`:

```python
    @property
    def cargo_anterior_nome(self):
        return self.cargo_anterior.nome if self.cargo_anterior else None

    @property
    def cargo_novo_nome(self):
        return self.cargo_novo.nome if self.cargo_novo else None

    @property
    def aprovado_por_nome(self):
        return self.aprovado_por.nome if self.aprovado_por else None
```

- [ ] **Step 4: Adicionar os schemas em `app/schemas/colaborador.py`**

No final do arquivo:

```python
# === HISTÓRICO DE CARGO ===

class HistoricoCargoCreate(BaseModel):
    cargo_novo_id: int
    data: date
    justificativa: Optional[str] = None


class HistoricoCargoResponse(BaseModel):
    id: int
    colaborador_id: int
    cargo_anterior_id: Optional[int]
    cargo_anterior_nome: Optional[str] = None
    cargo_novo_id: int
    cargo_novo_nome: Optional[str] = None
    data: date
    aprovado_por_id: int
    aprovado_por_nome: Optional[str] = None
    justificativa: Optional[str]
    criado_em: Optional[datetime]

    class Config:
        from_attributes = True
```

- [ ] **Step 5: Implementar os endpoints em `app/api/v1/endpoints/colaboradores.py`**

Ampliar os imports:

```python
from app.schemas.colaborador import (
    DepartamentoCreate, DepartamentoUpdate, DepartamentoResponse,
    CargoCreate, CargoUpdate, CargoResponse,
    ColaboradorCreate, ColaboradorUpdate, ColaboradorResponse,
    HistoricoSalarialCreate, HistoricoSalarialResponse,
    HistoricoCargoCreate, HistoricoCargoResponse,
)
```

Adicionar logo após `listar_historico_salarial`:

```python
@router.post("/{colaborador_id}/historico-cargo", response_model=HistoricoCargoResponse, status_code=201)
def lancar_historico_cargo(
    colaborador_id: int,
    payload: HistoricoCargoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    colaborador = _get_colaborador_ou_404(colaborador_id, db)
    if not db.query(Cargo).filter(Cargo.id == payload.cargo_novo_id).first():
        raise HTTPException(400, "Cargo inválido")

    registro = HistoricoCargoColaborador(
        colaborador_id=colaborador_id,
        cargo_anterior_id=colaborador.cargo_id,
        aprovado_por_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(registro)

    colaborador.cargo_id = payload.cargo_novo_id

    db.commit()
    db.refresh(registro)
    return registro


@router.get("/{colaborador_id}/historico-cargo", response_model=List[HistoricoCargoResponse])
def listar_historico_cargo(
    colaborador_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    _get_colaborador_ou_404(colaborador_id, db)
    return (
        db.query(HistoricoCargoColaborador)
        .filter(HistoricoCargoColaborador.colaborador_id == colaborador_id)
        .order_by(HistoricoCargoColaborador.data.desc(), HistoricoCargoColaborador.id.desc())
        .all()
    )
```

- [ ] **Step 6: Rodar a suíte completa**

Run: `cd backend && python -m pytest -q`
Expected: PASS — todos os testes, incluindo o novo `test_criar_colaborador_grava_primeiro_historico_salarial_e_cargo` que fecha a verificação deixada pendente na Task 2.

- [ ] **Step 7: Commit**

```bash
git add backend/app/schemas/colaborador.py backend/app/models/colaborador.py backend/app/api/v1/endpoints/colaboradores.py backend/tests/test_colaboradores_historico_cargo.py
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add historico de cargo (promocoes)

POST/GET /colaboradores/{id}/historico-cargo: nova promocao atualiza
cargo_id atual no Colaborador e fica registrada no historico imutavel
(cargo anterior, cargo novo, aprovador, justificativa).
EOF
)"
```

---

## Task 5: Desligamento

**Files:**
- Modify: `backend/app/schemas/colaborador.py`
- Modify: `backend/app/api/v1/endpoints/colaboradores.py`
- Test: `backend/tests/test_colaboradores_desligamento.py`

**Interfaces:**
- Consumes: `Colaborador` (Task 2).
- Produces:
  - `app.schemas.colaborador.TipoDesligamento` (enum: `PEDIDO_DEMISSAO`, `DISPENSA_SEM_JUSTA_CAUSA`, `DISPENSA_COM_JUSTA_CAUSA`)
  - `DesligamentoRequest(data_desligamento, tipo_desligamento, motivo_desligamento, entrevista_saida)`
  - `POST /colaboradores/{colaborador_id}/desligar` → `ColaboradorResponse`, seta `is_active=False`; bloqueia (400) se já desligado

- [ ] **Step 1: Escrever o teste que falha**

Criar `backend/tests/test_colaboradores_desligamento.py`:

```python
from tests.test_colaboradores_cadastro import _criar_departamento_e_cargo, _payload_base


def test_desligar_colaborador(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    resp = auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/desligar",
        json={
            "data_desligamento": "2025-03-01",
            "tipo_desligamento": "pedido_demissao",
            "motivo_desligamento": "Mudança de cidade",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_active"] is False
    assert data["data_desligamento"] == "2025-03-01"
    assert data["tipo_desligamento"] == "pedido_demissao"
    assert data["motivo_desligamento"] == "Mudança de cidade"


def test_desligar_colaborador_ja_desligado_400(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()
    payload = {"data_desligamento": "2025-03-01", "tipo_desligamento": "pedido_demissao", "motivo_desligamento": "Motivo"}
    auth_client.post(f"/api/v1/colaboradores/{criado['id']}/desligar", json=payload)

    resp = auth_client.post(f"/api/v1/colaboradores/{criado['id']}/desligar", json=payload)
    assert resp.status_code == 400


def test_desligar_colaborador_continua_visivel_por_id(auth_client):
    """RH-RN009: colaborador desligado nunca é excluído, só inativado."""
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()
    auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/desligar",
        json={"data_desligamento": "2025-03-01", "tipo_desligamento": "pedido_demissao", "motivo_desligamento": "Motivo"},
    )

    resp = auth_client.get(f"/api/v1/colaboradores/{criado['id']}")
    assert resp.status_code == 200
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/test_colaboradores_desligamento.py -v`
Expected: FAIL — `404 Not Found`.

- [ ] **Step 3: Adicionar o schema em `app/schemas/colaborador.py`**

No topo do arquivo, ampliar o import (`enum` da stdlib, não confundir com os enums SQLAlchemy de `app.models.colaborador`):

```python
import enum
```

No final do arquivo:

```python
# === DESLIGAMENTO ===

class TipoDesligamento(str, enum.Enum):
    PEDIDO_DEMISSAO = "pedido_demissao"
    DISPENSA_SEM_JUSTA_CAUSA = "dispensa_sem_justa_causa"
    DISPENSA_COM_JUSTA_CAUSA = "dispensa_com_justa_causa"


class DesligamentoRequest(BaseModel):
    data_desligamento: date
    tipo_desligamento: TipoDesligamento
    motivo_desligamento: str
    entrevista_saida: Optional[str] = None
```

Ao gravar em `Colaborador.tipo_desligamento` (coluna `String`), o endpoint (Step 4 abaixo) usa `payload.tipo_desligamento` diretamente — como `TipoDesligamento` herda de `str`, o SQLAlchemy grava o valor (`"pedido_demissao"` etc.) sem conversão extra.

- [ ] **Step 4: Implementar o endpoint em `app/api/v1/endpoints/colaboradores.py`**

Ampliar os imports:

```python
from app.schemas.colaborador import (
    DepartamentoCreate, DepartamentoUpdate, DepartamentoResponse,
    CargoCreate, CargoUpdate, CargoResponse,
    ColaboradorCreate, ColaboradorUpdate, ColaboradorResponse,
    HistoricoSalarialCreate, HistoricoSalarialResponse,
    HistoricoCargoCreate, HistoricoCargoResponse,
    DesligamentoRequest,
)
```

Adicionar logo após `listar_historico_cargo`:

```python
@router.post("/{colaborador_id}/desligar", response_model=ColaboradorResponse)
def desligar_colaborador(
    colaborador_id: int,
    payload: DesligamentoRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    colaborador = _get_colaborador_ou_404(colaborador_id, db)
    if not colaborador.is_active:
        raise HTTPException(400, "Colaborador já está desligado")

    colaborador.is_active = False
    colaborador.data_desligamento = payload.data_desligamento
    colaborador.tipo_desligamento = payload.tipo_desligamento
    colaborador.motivo_desligamento = payload.motivo_desligamento
    colaborador.entrevista_saida = payload.entrevista_saida

    db.commit()
    db.refresh(colaborador)
    return colaborador
```

- [ ] **Step 5: Rodar a suíte completa**

Run: `cd backend && python -m pytest -q`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/app/schemas/colaborador.py backend/app/api/v1/endpoints/colaboradores.py backend/tests/test_colaboradores_desligamento.py
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add endpoint de desligamento de colaborador

POST /colaboradores/{id}/desligar seta is_active=False e preenche o
bloco de desligamento (data, tipo, motivo, entrevista de saida).
Bloqueia (400) desligar quem ja esta desligado. Colaborador nunca e
excluido (RH-RN009) — continua acessivel por GET normalmente.
EOF
)"
```

---

## Task 6: Documentos do colaborador

**Files:**
- Modify: `backend/app/models/colaborador.py`
- Modify: `backend/app/schemas/colaborador.py`
- Modify: `backend/app/api/v1/endpoints/colaboradores.py`
- Modify: `backend/app/models/__init__.py`
- Test: `backend/tests/test_colaboradores_documentos.py`

**Interfaces:**
- Consumes: `Colaborador` (Task 2).
- Produces:
  - `app.models.colaborador.DocumentoColaborador(id, colaborador_id, tipo, url, data_vencimento, criado_em)`
  - `app.schemas.colaborador.TipoDocumentoColaborador` (enum: `CTPS`, `ASO_ADMISSIONAL`, `CONTRATO_ASSINADO`, `EXAME_PERIODICO`, `CERTIDAO`, `PIS_PASEP`, `OUTRO`)
  - `DocumentoCreate(tipo, url, data_vencimento)`
  - `DocumentoResponse(id, colaborador_id, tipo, url, data_vencimento, criado_em)`
  - `POST /colaboradores/{colaborador_id}/documentos` → `DocumentoResponse`
  - `GET /colaboradores/{colaborador_id}/documentos` → `List[DocumentoResponse]`
  - `DELETE /colaboradores/{colaborador_id}/documentos/{documento_id}` → 204

- [ ] **Step 1: Escrever o teste que falha**

Criar `backend/tests/test_colaboradores_documentos.py`:

```python
from tests.test_colaboradores_cadastro import _criar_departamento_e_cargo, _payload_base


def test_adicionar_e_listar_documento(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    resp = auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/documentos",
        json={"tipo": "aso_admissional", "url": "https://exemplo.com/aso.pdf", "data_vencimento": "2025-06-01"},
    )
    assert resp.status_code == 201
    assert resp.json()["tipo"] == "aso_admissional"

    listagem = auth_client.get(f"/api/v1/colaboradores/{criado['id']}/documentos").json()
    assert len(listagem) == 1
    assert listagem[0]["url"] == "https://exemplo.com/aso.pdf"


def test_documento_sem_data_vencimento(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()

    resp = auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/documentos",
        json={"tipo": "ctps", "url": "https://exemplo.com/ctps.pdf"},
    )
    assert resp.status_code == 201
    assert resp.json()["data_vencimento"] is None


def test_remover_documento(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()
    doc = auth_client.post(
        f"/api/v1/colaboradores/{criado['id']}/documentos",
        json={"tipo": "ctps", "url": "https://exemplo.com/ctps.pdf"},
    ).json()

    resp = auth_client.delete(f"/api/v1/colaboradores/{criado['id']}/documentos/{doc['id']}")
    assert resp.status_code == 204

    listagem = auth_client.get(f"/api/v1/colaboradores/{criado['id']}/documentos").json()
    assert listagem == []
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/test_colaboradores_documentos.py -v`
Expected: FAIL — `404 Not Found`.

- [ ] **Step 3: Adicionar o model em `app/models/colaborador.py`**

No final do arquivo:

```python
class DocumentoColaborador(Base):
    __tablename__ = "documentos_colaboradores"

    id = Column(Integer, primary_key=True, index=True)
    colaborador_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=False)
    tipo = Column(String(50), nullable=False)
    # ctps | aso_admissional | contrato_assinado | exame_periodico | certidao | pis_pasep | outro
    url = Column(String(500), nullable=False)
    data_vencimento = Column(Date, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
```

- [ ] **Step 4: Adicionar os schemas em `app/schemas/colaborador.py`**

No final do arquivo:

```python
# === DOCUMENTOS ===

class TipoDocumentoColaborador(str, enum.Enum):
    CTPS = "ctps"
    ASO_ADMISSIONAL = "aso_admissional"
    CONTRATO_ASSINADO = "contrato_assinado"
    EXAME_PERIODICO = "exame_periodico"
    CERTIDAO = "certidao"
    PIS_PASEP = "pis_pasep"
    OUTRO = "outro"


class DocumentoCreate(BaseModel):
    tipo: TipoDocumentoColaborador
    url: str
    data_vencimento: Optional[date] = None


class DocumentoResponse(BaseModel):
    id: int
    colaborador_id: int
    tipo: TipoDocumentoColaborador
    url: str
    data_vencimento: Optional[date]
    criado_em: Optional[datetime]

    class Config:
        from_attributes = True
```

(`import enum` já foi adicionado ao topo do arquivo na Task 5.)

- [ ] **Step 5: Implementar os endpoints em `app/api/v1/endpoints/colaboradores.py`**

Ampliar os imports:

```python
from app.models.colaborador import (
    Departamento, Cargo, Colaborador, HistoricoSalarialColaborador, HistoricoCargoColaborador,
    DocumentoColaborador,
)
from app.schemas.colaborador import (
    DepartamentoCreate, DepartamentoUpdate, DepartamentoResponse,
    CargoCreate, CargoUpdate, CargoResponse,
    ColaboradorCreate, ColaboradorUpdate, ColaboradorResponse,
    HistoricoSalarialCreate, HistoricoSalarialResponse,
    HistoricoCargoCreate, HistoricoCargoResponse,
    DesligamentoRequest,
    DocumentoCreate, DocumentoResponse,
)
```

Adicionar no final do arquivo:

```python
# === DOCUMENTOS ===

@router.post("/{colaborador_id}/documentos", response_model=DocumentoResponse, status_code=201)
def adicionar_documento(
    colaborador_id: int,
    payload: DocumentoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    _get_colaborador_ou_404(colaborador_id, db)
    documento = DocumentoColaborador(colaborador_id=colaborador_id, **payload.model_dump())
    db.add(documento)
    db.commit()
    db.refresh(documento)
    return documento


@router.get("/{colaborador_id}/documentos", response_model=List[DocumentoResponse])
def listar_documentos(
    colaborador_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    _get_colaborador_ou_404(colaborador_id, db)
    return (
        db.query(DocumentoColaborador)
        .filter(DocumentoColaborador.colaborador_id == colaborador_id)
        .order_by(DocumentoColaborador.criado_em.desc())
        .all()
    )


@router.delete("/{colaborador_id}/documentos/{documento_id}", status_code=204)
def remover_documento(
    colaborador_id: int,
    documento_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    documento = (
        db.query(DocumentoColaborador)
        .filter(DocumentoColaborador.id == documento_id, DocumentoColaborador.colaborador_id == colaborador_id)
        .first()
    )
    if not documento:
        raise HTTPException(404, "Documento não encontrado")
    db.delete(documento)
    db.commit()
```

- [ ] **Step 6: Registrar o model em `app/models/__init__.py`**

Ampliar o import já existente de `app.models.colaborador` com `DocumentoColaborador`, e adicionar `"DocumentoColaborador"` a `__all__`.

- [ ] **Step 7: Rodar a suíte completa**

Run: `cd backend && python -m pytest -q`
Expected: PASS — todos os testes de todas as tasks deste plano.

- [ ] **Step 8: Commit**

```bash
git add backend/app/models/colaborador.py backend/app/models/__init__.py backend/app/schemas/colaborador.py backend/app/api/v1/endpoints/colaboradores.py backend/tests/test_colaboradores_documentos.py
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add documentos do colaborador

POST/GET/DELETE /colaboradores/{id}/documentos — tabela propria
(nao colunas fixas), so campo de URL (mesmo padrao ja usado em
Fechamento.contrato_url — projeto nao tem upload real de arquivo
ainda). data_vencimento opcional, pronta para o alerta futuro
(RH-RF003, fora de escopo nesta entrega).
EOF
)"
```

---

## Fora de escopo deste plano

- Frontend — plano separado (`docs/superpowers/plans/2026-07-26-colaboradores-rh01-frontend.md`).
- RH02–RH11 (Comissões, Férias, Acordos, Avaliação+PDI, Carreira, Manual/Políticas, Folha, Benefícios, Clima, Portal) — cada um vira spec e plano próprios quando chegar a vez.
- Upload real de arquivo, criptografia de dados bancários, alertas automáticos de documento vencendo — ver seção "Fora de escopo" do spec.
- Deploy em produção (Railway): como não há Alembic de fato neste projeto, as tabelas novas (`departamentos`, `cargos`, `colaboradores`, `historico_salarial_colaboradores`, `historico_cargo_colaboradores`, `documentos_colaboradores`) só existem localmente via `Base.metadata.create_all` (usado nos testes e no `seed.py`). Subir para o Postgres do Railway exige rodar algo equivalente lá (`seed.py` ou uma migration manual) — fora do escopo deste plano de implementação local.
