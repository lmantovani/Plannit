# Especificadores (Arquitetos) — Lista, Perfil, Score e Decisores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir do zero a interface de "Especificadores" (nome exibido; internamente continua
`Arquiteto`) — lista alfabética, drawer com abas Perfil/Score/Decisores, página completa, histórico
de interações estruturado, funcionários do escritório com flag de decisor, e vínculo direto com
Cliente.

**Architecture:** Backend FastAPI + SQLAlchemy (extensão do model `Arquiteto` existente em
`app/models/crm.py`, dois models novos `InteracaoArquiteto`/`FuncionarioArquiteto` no mesmo
arquivo, extensão do endpoint `arquitetos.py` existente). Frontend React (página de lista nova,
drawer lateral, página completa, todos reaproveitando componentes de `components/ui/index.jsx`).

**Tech Stack:** FastAPI 0.111, SQLAlchemy 2.0, Alembic, Pydantic v2, pytest (backend) · React 19,
Axios, React Router, TailwindCSS (frontend).

**Spec:** `docs/superpowers/specs/2026-07-14-arquitetos-especificador-ui-design.md`

## Global Constraints

- Nomenclatura: tudo em português, seguindo o padrão do restante do código (`nome`, `criado_em`,
  etc.).
- **Nome interno permanece `Arquiteto`** (model, tabela `arquitetos`, endpoint `/arquitetos`,
  arquivo `arquitetos.py`) — só a interface (sidebar, título de página, rotas do frontend) exibe
  "Especificador(es)". Não renomear nada no backend.
- Endpoints de `arquitetos.py` usam `response_model` Pydantic (padrão já estabelecido nesse
  arquivo específico), não o padrão de dict manual usado em outros módulos.
- `require_roles(*perfis)` para rotas restritas; `get_current_user` para rotas autenticadas sem
  restrição — ambos já existem em `app/core/security.py`, não recriar.
- Campo `tipo` do `Arquiteto` é **obrigatório no schema de criação** (`ArquitetoCreate`), mas a
  coluna no banco é `nullable=True` — evita quebrar a migration caso já existam registros de
  teste sem esse dado na tabela `arquitetos` local.
- `vendedor_id` do `Arquiteto` só pode ser definido/alterado por Diretoria ou Gerente Comercial —
  aplicado manualmente dentro do endpoint de PATCH (não dá para expressar isso só com
  `require_roles`, pois as outras alterações continuam liberadas para Recepção).
- Não existe hoje nenhuma tela de Cliente no frontend — o nome do cliente vinculado aparece como
  texto não-clicável (sem navegação), conforme decidido no spec.
- Frontend não tem framework de testes configurado (nem vitest nem Testing Library) — tasks de
  frontend são verificadas manualmente rodando o dev server, seguindo a convenção já usada no
  resto do projeto.
- Não existe nenhum arquivo em `backend/alembic/versions/` ainda, embora o projeto já tenha
  `alembic.ini`/`env.py` configurados e o banco local já tenha sido criado via
  `Base.metadata.create_all` (chamado em `seed.py`). Antes de gerar a migration real deste
  plano, é preciso criar uma migration-baseline e "carimbar" o banco (`alembic stamp`), sem
  executar `create_table` para tabelas que já existem — ver Task 1.

---

## Ordem de execução

Tasks 1-9 (backend) são sequenciais. Tasks 10-13 (frontend) dependem das rotas de backend das
Tasks 6-9 estarem prontas para verificação manual, mas os arquivos de frontend em si só
dependem uns dos outros na ordem listada. Task 14 é a verificação manual ponta-a-ponta final.

---

### Task 1: Bootstrap do Alembic (baseline do schema existente)

O banco local já existe (criado via `Base.metadata.create_all` em `seed.py`), mas nunca houve
nenhuma revision do Alembic. Esta task cria uma revision-baseline que reflete o schema atual e
marca o banco como estando nela, sem tentar recriar tabelas que já existem.

**Files:**
- Create: `backend/alembic/versions/<hash>_baseline_existing_schema.py` (nome exato gerado pelo
  Alembic)

- [ ] **Step 1: Confirmar que o `.env` local aponta pro Postgres de desenvolvimento**

Run: `cd backend && cat .env | grep DATABASE_URL` (ou `type .env` no PowerShell)
Expected: uma linha `DATABASE_URL=postgresql://...` apontando pro banco local (per `CLAUDE.md`:
`postgresql://postgres:861401@localhost:5432/plannit`).

- [ ] **Step 2: Gerar a migration-baseline**

Run: `cd backend && alembic revision --autogenerate -m "baseline_existing_schema"`
Expected: um novo arquivo em `alembic/versions/`, sem erro de conexão.

- [ ] **Step 3: Revisar o arquivo gerado — confirmar que só tem `create_table`**

Abrir o arquivo criado no Step 2. O método `upgrade()` deve conter **só** chamadas
`op.create_table(...)` (uma por tabela existente: `users`, `leads`, `interacoes_lead`,
`clientes`, `arquitetos`, `projetos`, `historico_status_projeto`, `briefings`,
`ambientes_briefing`, `fila_projeto`, `config_wip_projetista`, `projetos_comerciais`,
`fechamentos`, `parcelas`, `handoffs`, `notificacoes`).

Se o arquivo contiver `op.add_column`, `op.drop_column` ou `op.alter_column`, o banco local está
com schema desatualizado em relação aos models — **parar aqui** e reconciliar manualmente
(rodar `python seed.py` de novo para criar o que falta, ou ajustar o model) antes de continuar.

- [ ] **Step 4: Carimbar o banco nessa revision (sem executar `create_table`)**

Run: `cd backend && alembic stamp head`
Expected: saída indicando que o banco foi marcado na revision gerada, sem erros de "relation
already exists" (porque `stamp` não executa SQL, só grava a revision na tabela
`alembic_version`).

- [ ] **Step 5: Confirmar**

Run: `cd backend && alembic current`
Expected: mostra a revision recém-criada como current.

- [ ] **Step 6: Commit**

```bash
git add backend/alembic/versions/
git commit -m "chore: add Alembic baseline migration for existing schema"
```

---

### Task 2: Infraestrutura de testes (pytest)

Não existe hoje nenhum teste automatizado no backend. Cria a base para os testes das tasks
seguintes: banco SQLite em memória isolado do Postgres real, com override da dependency
`get_db`.

**Files:**
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`

**Interfaces:**
- Produces: fixtures `db` (Session SQLite em memória), `client` (TestClient com `get_db`
  sobrescrito), `vendedor`, `outro_vendedor`, `gerente`, `recepcao`, `diretoria` (instâncias de
  `User`), helper `auth_headers(user) -> dict`.

- [ ] **Step 1: Criar `backend/tests/__init__.py` vazio**

```python
```

- [ ] **Step 2: Escrever `backend/tests/conftest.py`**

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.core.database import Base, get_db
from app.core.security import get_password_hash, create_access_token
from app.main import app
from app.models.user import User, PerfilUsuario
import app.models  # noqa: F401 — garante que todos os models estão registrados no Base

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def make_user(db, perfil, email, nome="Usuário Teste"):
    user = User(
        nome=nome,
        email=email,
        hashed_password=get_password_hash("Teste@123"),
        perfil=perfil,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def auth_headers(user):
    token = create_access_token({"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def vendedor(db):
    return make_user(db, PerfilUsuario.VENDEDOR, "vendedor@teste.com", "Vendedor Um")


@pytest.fixture()
def outro_vendedor(db):
    return make_user(db, PerfilUsuario.VENDEDOR, "outro-vendedor@teste.com", "Vendedor Dois")


@pytest.fixture()
def gerente(db):
    return make_user(db, PerfilUsuario.GERENTE_COMERCIAL, "gerente@teste.com", "Gerente")


@pytest.fixture()
def recepcao(db):
    return make_user(db, PerfilUsuario.RECEPCAO, "recepcao@teste.com", "Recepção")


@pytest.fixture()
def diretoria(db):
    return make_user(db, PerfilUsuario.DIRETORIA, "diretoria@teste.com", "Diretoria")
```

- [ ] **Step 3: Rodar para confirmar que a infraestrutura sobe sem erro**

Run: `cd backend && python -m pytest tests/ -v`
Expected: `no tests ran` (sem erros de import/coleta) — confirma que `conftest.py` importa
`app.main` e os models corretamente antes de haver testes reais.

- [ ] **Step 4: Commit**

```bash
git add backend/tests/__init__.py backend/tests/conftest.py
git commit -m "test: add pytest infra with SQLite-backed FastAPI test client"
```

---

### Task 3: Models — extensão de `Arquiteto`/`Cliente` e entidades novas

**Files:**
- Modify: `backend/app/models/crm.py`
- Modify: `backend/app/models/__init__.py`
- Create: `backend/tests/models/__init__.py` (vazio)
- Create: `backend/tests/models/test_arquiteto_especificador.py`

**Interfaces:**
- Produces: `TipoArquiteto`, `TipoInteracaoArquiteto` (enums); `InteracaoArquiteto`,
  `FuncionarioArquiteto` (models); `Arquiteto.tipo`, `Arquiteto.endereco_escritorio`,
  `Arquiteto.vendedor_id`, `Arquiteto.vendedor_nome` (property), `Cliente.arquiteto_id` —
  consumidos pelas Tasks 5, 6, 7, 8, 9.

- [ ] **Step 1: Escrever o teste (vai falhar — os campos/models ainda não existem)**

```python
from app.models.crm import (
    Arquiteto, Cliente, TipoArquiteto, InteracaoArquiteto, TipoInteracaoArquiteto,
    FuncionarioArquiteto,
)


def test_cria_arquiteto_com_tipo_e_vendedor_vinculado(db, vendedor):
    arquiteto = Arquiteto(nome="Ana Arquiteta", tipo=TipoArquiteto.ARQUITETO, vendedor_id=vendedor.id)
    db.add(arquiteto)
    db.commit()
    db.refresh(arquiteto)

    assert arquiteto.id is not None
    assert arquiteto.vendedor_nome == vendedor.nome


def test_cliente_vinculado_a_arquiteto(db):
    arquiteto = Arquiteto(nome="Ana Arquiteta", tipo=TipoArquiteto.ARQUITETO)
    db.add(arquiteto)
    db.commit()

    cliente = Cliente(nome="Cliente Teste", telefone="11999990000", arquiteto_id=arquiteto.id)
    db.add(cliente)
    db.commit()
    db.refresh(cliente)

    assert cliente.arquiteto_id == arquiteto.id


def test_interacao_arquiteto_com_autor(db, vendedor):
    arquiteto = Arquiteto(nome="Ana Arquiteta", tipo=TipoArquiteto.ARQUITETO)
    db.add(arquiteto)
    db.commit()

    interacao = InteracaoArquiteto(
        arquiteto_id=arquiteto.id, autor_id=vendedor.id,
        tipo=TipoInteracaoArquiteto.LIGACAO, observacao="Ligou para agendar visita",
    )
    db.add(interacao)
    db.commit()
    db.refresh(interacao)

    assert interacao.autor_nome == vendedor.nome


def test_funcionario_arquiteto_flag_decisor(db):
    arquiteto = Arquiteto(nome="Ana Arquiteta", tipo=TipoArquiteto.ARQUITETO)
    db.add(arquiteto)
    db.commit()

    funcionario = FuncionarioArquiteto(arquiteto_id=arquiteto.id, nome="João Sócio", decisor=True)
    db.add(funcionario)
    db.commit()
    db.refresh(funcionario)

    assert funcionario.decisor is True
```

Create também `backend/tests/models/__init__.py` vazio.

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/models/test_arquiteto_especificador.py -v`
Expected: FAIL — `ImportError: cannot import name 'TipoArquiteto' from 'app.models.crm'` (ou
similar).

- [ ] **Step 3: Editar `backend/app/models/crm.py`**

No topo do arquivo, adicionar os dois enums novos junto aos enums já existentes (logo após
`TipoCliente`):

```python
class TipoArquiteto(str, enum.Enum):
    ARQUITETO = "arquiteto"
    ENGENHEIRO = "engenheiro"
    DESIGNER = "designer"
    CORRETOR = "corretor"
    OUTRO = "outro"


class TipoInteracaoArquiteto(str, enum.Enum):
    VISITA_ESCRITORIO = "visita_escritorio"
    LIGACAO = "ligacao"
    VISITA_LOJA = "visita_loja"
    EVENTO = "evento"
    VIAGEM = "viagem"
    ENVIO_BRINDE = "envio_brinde"
```

Na classe `Cliente`, logo abaixo de `atualizado_em`, adicionar a coluna e o relationship:

```python
    arquiteto_id = Column(Integer, ForeignKey("arquitetos.id"), nullable=True)
```

E no bloco `# Relationships` da mesma classe (junto de `projetos = relationship(...)`):

```python
    arquiteto = relationship("Arquiteto", foreign_keys=[arquiteto_id])
```

Substituir a classe `Arquiteto` inteira por:

```python
class Arquiteto(Base):
    __tablename__ = "arquitetos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False)
    tipo = Column(SAEnum(TipoArquiteto), nullable=True)
    escritorio = Column(String(200), nullable=True)
    endereco_escritorio = Column(String(300), nullable=True)
    telefone = Column(String(20), nullable=True)
    email = Column(String(200), nullable=True, unique=True)
    nivel_parceria = Column(String(50), default="parceiro")  # parceiro, premium, vip
    vendedor_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    is_active = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    vendedor = relationship("User", foreign_keys=[vendedor_id])
    interacoes = relationship(
        "InteracaoArquiteto", back_populates="arquiteto", cascade="all, delete-orphan",
        order_by="InteracaoArquiteto.criado_em.desc()",
    )
    funcionarios = relationship(
        "FuncionarioArquiteto", back_populates="arquiteto", cascade="all, delete-orphan",
    )

    @property
    def vendedor_nome(self):
        return self.vendedor.nome if self.vendedor else None

    def __repr__(self):
        return f"<Arquiteto {self.nome}>"


class InteracaoArquiteto(Base):
    """Histórico estruturado de interações com o arquiteto/especificador. Append-only."""
    __tablename__ = "interacoes_arquiteto"

    id = Column(Integer, primary_key=True, index=True)
    arquiteto_id = Column(Integer, ForeignKey("arquitetos.id"), nullable=False)
    autor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tipo = Column(SAEnum(TipoInteracaoArquiteto), nullable=False)
    observacao = Column(Text, nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    arquiteto = relationship("Arquiteto", back_populates="interacoes")
    autor = relationship("User", foreign_keys=[autor_id])

    @property
    def autor_nome(self):
        return self.autor.nome if self.autor else None


class FuncionarioArquiteto(Base):
    """Funcionários do escritório do arquiteto/especificador — aba Decisores."""
    __tablename__ = "funcionarios_arquiteto"

    id = Column(Integer, primary_key=True, index=True)
    arquiteto_id = Column(Integer, ForeignKey("arquitetos.id"), nullable=False)
    nome = Column(String(200), nullable=False)
    funcao = Column(String(100), nullable=True)
    telefone = Column(String(20), nullable=True)
    email = Column(String(200), nullable=True)
    observacoes = Column(Text, nullable=True)
    decisor = Column(Boolean, default=False)

    arquiteto = relationship("Arquiteto", back_populates="funcionarios")
```

- [ ] **Step 4: Atualizar `backend/app/models/__init__.py`**

```python
# Importar todos os models para garantir registro no SQLAlchemy
from app.models.user import User, PerfilUsuario
from app.models.crm import (
    Lead, InteracaoLead, Cliente, Arquiteto, TipoArquiteto, TipoInteracaoArquiteto,
    InteracaoArquiteto, FuncionarioArquiteto,
)
from app.models.projeto import (
    Projeto, HistoricoStatusProjeto, StatusProjeto,
    Briefing, AmbienteBriefing, TipoAmbiente,
    FilaProjeto, ConfigWIPProjetista,
)
from app.models.fechamento import ProjetoComercial, Fechamento, Parcela, Handoff
from app.models.notificacao import Notificacao, TipoNotificacao

__all__ = [
    "User", "PerfilUsuario",
    "Lead", "InteracaoLead", "Cliente", "Arquiteto", "TipoArquiteto", "TipoInteracaoArquiteto",
    "InteracaoArquiteto", "FuncionarioArquiteto",
    "Projeto", "HistoricoStatusProjeto", "StatusProjeto",
    "Briefing", "AmbienteBriefing", "TipoAmbiente",
    "FilaProjeto", "ConfigWIPProjetista",
    "ProjetoComercial", "Fechamento", "Parcela", "Handoff",
    "Notificacao", "TipoNotificacao",
]
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `cd backend && python -m pytest tests/models/test_arquiteto_especificador.py -v`
Expected: 4 passed

- [ ] **Step 6: Commit**

```bash
git add backend/app/models/crm.py backend/app/models/__init__.py backend/tests/models/
git commit -m "feat: extend Arquiteto/Cliente models, add InteracaoArquiteto and FuncionarioArquiteto"
```

---

### Task 4: Migration Alembic para o novo schema

**Files:**
- Create: migration gerada em `backend/alembic/versions/` (nome exato definido pelo Alembic)

**Interfaces:**
- Consumes: models da Task 3 (já registrados via `app/models/__init__.py`, que
  `alembic/env.py` importa).
- Produces: colunas `arquitetos.tipo`, `arquitetos.endereco_escritorio`,
  `arquitetos.vendedor_id`, `clientes.arquiteto_id`; tabelas `interacoes_arquiteto` e
  `funcionarios_arquiteto` no banco local.

- [ ] **Step 1: Gerar a migration**

Run: `cd backend && alembic revision --autogenerate -m "arquiteto_especificador_fields"`
Expected: um novo arquivo em `alembic/versions/`, sem erro de conexão.

- [ ] **Step 2: Revisar o arquivo gerado**

Confirmar que `upgrade()` contém, nesta ordem lógica (a ordem exata pode variar, mas todas devem
estar presentes):

- `op.add_column('arquitetos', sa.Column('tipo', ...))`
- `op.add_column('arquitetos', sa.Column('endereco_escritorio', ...))`
- `op.add_column('arquitetos', sa.Column('vendedor_id', ...))` + `op.create_foreign_key(...)`
  ligando a `users.id`
- `op.add_column('clientes', sa.Column('arquiteto_id', ...))` + `op.create_foreign_key(...)`
  ligando a `arquitetos.id`
- `op.create_table('interacoes_arquiteto', ...)`
- `op.create_table('funcionarios_arquiteto', ...)`

Se alguma dessas operações não aparecer, adicionar manualmente ao `upgrade()`/`downgrade()`
antes de prosseguir.

- [ ] **Step 3: Aplicar a migration**

Run: `cd backend && alembic upgrade head`
Expected: saída sem erros, terminando em `Running upgrade ... -> ..., arquiteto_especificador_fields`.

- [ ] **Step 4: Confirmar visualmente**

Run: `cd backend && python -c "from app.core.database import engine; from sqlalchemy import inspect; i = inspect(engine); print([c['name'] for c in i.get_columns('arquitetos')]); print([c['name'] for c in i.get_columns('clientes')]); print(sorted(i.get_table_names()))"`
Expected: `arquitetos` inclui `tipo`, `endereco_escritorio`, `vendedor_id`; `clientes` inclui
`arquiteto_id`; a lista de tabelas inclui `interacoes_arquiteto` e `funcionarios_arquiteto`.

- [ ] **Step 5: Commit**

```bash
git add backend/alembic/versions/
git commit -m "feat: migration for Arquiteto/Cliente extensions and relationship tables"
```

---

### Task 5: Schemas Pydantic

**Files:**
- Modify: `backend/app/schemas/crm.py`

**Interfaces:**
- Produces: `ArquitetoUpdate`, `InteracaoArquitetoCreate/Response`,
  `FuncionarioArquitetoCreate/Update/Response` — consumidos pela Task 6, 7, 8, 9. Modifica
  `ArquitetoCreate/Response` e `ClienteCreate/Response` existentes.

- [ ] **Step 1: Editar `backend/app/schemas/crm.py`**

No topo, atualizar o import de models:

```python
from app.models.crm import (
    OrigemLead, StatusFunil, TipoCliente, TipoArquiteto, TipoInteracaoArquiteto,
)
```

Em `ClienteCreate`, adicionar o campo (no final da classe):

```python
    arquiteto_id: Optional[int] = None
```

Em `ClienteResponse`, adicionar (no final da classe, antes do `class Config`):

```python
    arquiteto_id: Optional[int]
```

Substituir o bloco `# === ARQUITETO ===` inteiro por:

```python
# === ARQUITETO ===

class ArquitetoCreate(BaseModel):
    nome: str
    tipo: TipoArquiteto
    escritorio: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    nivel_parceria: str = "parceiro"


class ArquitetoUpdate(BaseModel):
    nome: Optional[str] = None
    tipo: Optional[TipoArquiteto] = None
    escritorio: Optional[str] = None
    endereco_escritorio: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    nivel_parceria: Optional[str] = None
    vendedor_id: Optional[int] = None


class ArquitetoResponse(BaseModel):
    id: int
    nome: str
    tipo: Optional[TipoArquiteto]
    escritorio: Optional[str]
    endereco_escritorio: Optional[str]
    telefone: Optional[str]
    email: Optional[str]
    nivel_parceria: str
    vendedor_id: Optional[int]
    vendedor_nome: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


# === INTERAÇÃO COM ARQUITETO ===

class InteracaoArquitetoCreate(BaseModel):
    tipo: TipoInteracaoArquiteto
    observacao: str


class InteracaoArquitetoResponse(BaseModel):
    id: int
    arquiteto_id: int
    autor_id: int
    autor_nome: Optional[str]
    tipo: TipoInteracaoArquiteto
    observacao: str
    criado_em: datetime

    class Config:
        from_attributes = True


# === FUNCIONÁRIO DO ESCRITÓRIO (DECISORES) ===

class FuncionarioArquitetoCreate(BaseModel):
    nome: str
    funcao: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    observacoes: Optional[str] = None
    decisor: bool = False


class FuncionarioArquitetoUpdate(BaseModel):
    nome: Optional[str] = None
    funcao: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    observacoes: Optional[str] = None
    decisor: Optional[bool] = None


class FuncionarioArquitetoResponse(BaseModel):
    id: int
    arquiteto_id: int
    nome: str
    funcao: Optional[str]
    telefone: Optional[str]
    email: Optional[str]
    observacoes: Optional[str]
    decisor: bool

    class Config:
        from_attributes = True
```

- [ ] **Step 2: Rodar um import rápido para confirmar que não há erro de sintaxe/referência**

Run: `cd backend && python -c "import app.schemas.crm; print('ok')"`
Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add backend/app/schemas/crm.py
git commit -m "feat: add/extend Pydantic schemas for Arquiteto, InteracaoArquiteto, FuncionarioArquiteto"
```

---

### Task 6: Backend — estender CRUD de Arquiteto (tipo, endereço, vendedor vinculado)

**Files:**
- Modify: `backend/app/api/v1/endpoints/arquitetos.py`
- Create: `backend/tests/api/__init__.py` (vazio)
- Create: `backend/tests/api/test_arquitetos.py`

**Interfaces:**
- Produces: helper `_get_arquiteto_or_404(db, arquiteto_id) -> Arquiteto` — usado pelas Tasks
  7, 8, 9.

- [ ] **Step 1: Escrever os testes**

```python
from tests.conftest import auth_headers


def test_criar_arquiteto_exige_tipo(client, recepcao):
    resp = client.post(
        "/api/v1/arquitetos/",
        json={"nome": "Ana Arquiteta", "telefone": "11999990000"},
        headers=auth_headers(recepcao),
    )
    assert resp.status_code == 422


def test_recepcao_cria_arquiteto_com_tipo(client, recepcao):
    resp = client.post(
        "/api/v1/arquitetos/",
        json={"nome": "Ana Arquiteta", "tipo": "arquiteto", "telefone": "11999990000"},
        headers=auth_headers(recepcao),
    )
    assert resp.status_code == 201
    assert resp.json()["tipo"] == "arquiteto"
    assert resp.json()["vendedor_id"] is None


def test_lista_ordenada_alfabeticamente_e_filtra_por_tipo(client, recepcao):
    client.post("/api/v1/arquitetos/", json={"nome": "Zeca Designer", "tipo": "designer"}, headers=auth_headers(recepcao))
    client.post("/api/v1/arquitetos/", json={"nome": "Ana Arquiteta", "tipo": "arquiteto"}, headers=auth_headers(recepcao))

    resp = client.get("/api/v1/arquitetos/", headers=auth_headers(recepcao))
    nomes = [a["nome"] for a in resp.json()]
    assert nomes == ["Ana Arquiteta", "Zeca Designer"]

    resp_filtrado = client.get("/api/v1/arquitetos/?tipo=designer", headers=auth_headers(recepcao))
    assert [a["nome"] for a in resp_filtrado.json()] == ["Zeca Designer"]


def test_gerente_define_vendedor_vinculado(client, gerente, vendedor):
    criado = client.post(
        "/api/v1/arquitetos/", json={"nome": "Ana Arquiteta", "tipo": "arquiteto"},
        headers=auth_headers(gerente),
    ).json()

    resp = client.patch(
        f"/api/v1/arquitetos/{criado['id']}",
        json={"vendedor_id": vendedor.id},
        headers=auth_headers(gerente),
    )
    assert resp.status_code == 200
    assert resp.json()["vendedor_id"] == vendedor.id
    assert resp.json()["vendedor_nome"] == vendedor.nome


def test_recepcao_nao_pode_definir_vendedor_vinculado(client, recepcao, gerente, vendedor):
    criado = client.post(
        "/api/v1/arquitetos/", json={"nome": "Ana Arquiteta", "tipo": "arquiteto"},
        headers=auth_headers(gerente),
    ).json()

    resp = client.patch(
        f"/api/v1/arquitetos/{criado['id']}",
        json={"vendedor_id": vendedor.id},
        headers=auth_headers(recepcao),
    )
    assert resp.status_code == 403


def test_recepcao_ainda_pode_editar_outros_campos(client, recepcao, gerente):
    criado = client.post(
        "/api/v1/arquitetos/", json={"nome": "Ana Arquiteta", "tipo": "arquiteto"},
        headers=auth_headers(gerente),
    ).json()

    resp = client.patch(
        f"/api/v1/arquitetos/{criado['id']}",
        json={"endereco_escritorio": "Rua das Flores, 100"},
        headers=auth_headers(recepcao),
    )
    assert resp.status_code == 200
    assert resp.json()["endereco_escritorio"] == "Rua das Flores, 100"
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/api/test_arquitetos.py -v`
Expected: FAIL — `422` esperado onde vem `201` (tipo ainda não obrigatório), ou `KeyError`/
`AssertionError` nos demais (campos/rotas ainda não existem do jeito esperado).

- [ ] **Step 3: Editar `backend/app/api/v1/endpoints/arquitetos.py`**

Substituir o arquivo inteiro por:

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, PerfilUsuario
from app.models.crm import Arquiteto, TipoArquiteto
from app.schemas.crm import ArquitetoCreate, ArquitetoUpdate, ArquitetoResponse

router = APIRouter(prefix="/arquitetos", tags=["CRM — Arquitetos"])

GESTAO_ARQUITETOS = (PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.RECEPCAO)


def _get_arquiteto_or_404(db: Session, arquiteto_id: int) -> Arquiteto:
    arquiteto = db.query(Arquiteto).filter(Arquiteto.id == arquiteto_id).first()
    if not arquiteto:
        raise HTTPException(404, "Arquiteto não encontrado")
    return arquiteto


def _checar_acesso_relacionamento(arquiteto: Arquiteto, user: User):
    """Diretoria/Gerente/Recepção sempre podem. Vendedor só se for o vinculado."""
    if user.perfil in GESTAO_ARQUITETOS:
        return
    if user.perfil == PerfilUsuario.VENDEDOR and arquiteto.vendedor_id == user.id:
        return
    raise HTTPException(403, "Sem permissão para esta ação")


@router.get("/", response_model=List[ArquitetoResponse])
def listar_arquitetos(
    nivel_parceria: Optional[str] = None,
    tipo: Optional[TipoArquiteto] = None,
    vendedor_id: Optional[int] = None,
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
    if vendedor_id:
        query = query.filter(Arquiteto.vendedor_id == vendedor_id)
    return query.order_by(Arquiteto.nome).offset(skip).limit(limit).all()


@router.post("/", response_model=ArquitetoResponse, status_code=201)
def criar_arquiteto(
    payload: ArquitetoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*GESTAO_ARQUITETOS)),
):
    if payload.email:
        existente = db.query(Arquiteto).filter(Arquiteto.email == payload.email).first()
        if existente:
            raise HTTPException(400, "E-mail já cadastrado para outro arquiteto")

    arquiteto = Arquiteto(**payload.model_dump())
    db.add(arquiteto)
    db.commit()
    db.refresh(arquiteto)
    return arquiteto


@router.get("/{arquiteto_id}", response_model=ArquitetoResponse)
def obter_arquiteto(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_arquiteto_or_404(db, arquiteto_id)


@router.patch("/{arquiteto_id}", response_model=ArquitetoResponse)
def atualizar_arquiteto(
    arquiteto_id: int,
    payload: ArquitetoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*GESTAO_ARQUITETOS)),
):
    arquiteto = _get_arquiteto_or_404(db, arquiteto_id)

    dados = payload.model_dump(exclude_unset=True)
    if "vendedor_id" in dados and current_user.perfil not in (
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL
    ):
        raise HTTPException(403, "Apenas Diretoria ou Gerente podem definir o vendedor vinculado")

    for field, value in dados.items():
        setattr(arquiteto, field, value)

    db.commit()
    db.refresh(arquiteto)
    return arquiteto


@router.delete("/{arquiteto_id}", status_code=204)
def desativar_arquiteto(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.DIRETORIA, PerfilUsuario.GERENTE_COMERCIAL
    )),
):
    arquiteto = _get_arquiteto_or_404(db, arquiteto_id)
    arquiteto.is_active = False
    db.commit()
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `cd backend && python -m pytest tests/api/test_arquitetos.py -v`
Expected: 6 passed

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/v1/endpoints/arquitetos.py backend/tests/api/
git commit -m "feat: add tipo/endereco_escritorio/vendedor_id to Arquiteto CRUD with permission rules"
```

---

### Task 7: Backend — clientes vinculados ao arquiteto

**Files:**
- Modify: `backend/app/api/v1/endpoints/arquitetos.py`
- Modify: `backend/app/api/v1/endpoints/clientes.py`
- Create: `backend/tests/api/test_arquitetos_clientes.py`

**Interfaces:**
- Consumes: `_get_arquiteto_or_404` da Task 6.
- Produces: `GET /arquitetos/{id}/clientes`.

- [ ] **Step 1: Escrever o teste**

```python
from tests.conftest import auth_headers


def test_lista_clientes_vinculados_ao_arquiteto(client, gerente):
    arquiteto = client.post(
        "/api/v1/arquitetos/", json={"nome": "Ana Arquiteta", "tipo": "arquiteto"},
        headers=auth_headers(gerente),
    ).json()

    cliente = client.post(
        "/api/v1/clientes/",
        json={"nome": "Cliente da Ana", "telefone": "11999990000", "arquiteto_id": arquiteto["id"]},
        headers=auth_headers(gerente),
    ).json()
    assert cliente["arquiteto_id"] == arquiteto["id"]

    client.post(
        "/api/v1/clientes/", json={"nome": "Cliente Sem Vínculo", "telefone": "11999990001"},
        headers=auth_headers(gerente),
    )

    resp = client.get(f"/api/v1/arquitetos/{arquiteto['id']}/clientes", headers=auth_headers(gerente))
    assert resp.status_code == 200
    nomes = [c["nome"] for c in resp.json()]
    assert nomes == ["Cliente da Ana"]


def test_lista_clientes_vazia_quando_arquiteto_sem_vinculo(client, gerente):
    arquiteto = client.post(
        "/api/v1/arquitetos/", json={"nome": "Ana Arquiteta", "tipo": "arquiteto"},
        headers=auth_headers(gerente),
    ).json()

    resp = client.get(f"/api/v1/arquitetos/{arquiteto['id']}/clientes", headers=auth_headers(gerente))
    assert resp.json() == []
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/api/test_arquitetos_clientes.py -v`
Expected: FAIL — `404` na rota `/arquitetos/{id}/clientes` (ainda não existe) e/ou `arquiteto_id`
não aceito no POST de `/clientes/` (schema ainda sem o campo até a Task 5 — se já estiver feita,
só a rota de listagem falha).

- [ ] **Step 3: Adicionar ao final de `backend/app/api/v1/endpoints/arquitetos.py`**

No topo do arquivo, adicionar aos imports:

```python
from app.models.crm import Cliente
from app.schemas.crm import ClienteResponse
```

E adicionar a rota (após `obter_arquiteto`, antes de `atualizar_arquiteto` — a posição exata
entre rotas não importa, contanto que fique depois de `/{arquiteto_id}` estar declarado):

```python
@router.get("/{arquiteto_id}/clientes", response_model=List[ClienteResponse])
def listar_clientes_do_arquiteto(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_arquiteto_or_404(db, arquiteto_id)
    return (
        db.query(Cliente)
        .filter(Cliente.arquiteto_id == arquiteto_id)
        .order_by(Cliente.nome)
        .all()
    )
```

- [ ] **Step 4: Confirmar que `clientes.py` já aceita `arquiteto_id`**

`backend/app/api/v1/endpoints/clientes.py` não precisa de nenhuma mudança de código — os
endpoints `POST /clientes/` e `PATCH /clientes/{id}` já usam `payload.model_dump()` de forma
genérica, então passam a aceitar `arquiteto_id` automaticamente assim que o campo existir em
`ClienteCreate` (Task 5). Só confirmar rodando os testes.

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `cd backend && python -m pytest tests/api/test_arquitetos_clientes.py -v`
Expected: 2 passed

- [ ] **Step 6: Commit**

```bash
git add backend/app/api/v1/endpoints/arquitetos.py backend/tests/api/test_arquitetos_clientes.py
git commit -m "feat: add endpoint to list clients linked to an Arquiteto"
```

---

### Task 8: Backend — histórico de interações

**Files:**
- Modify: `backend/app/api/v1/endpoints/arquitetos.py`
- Create: `backend/tests/api/test_arquitetos_interacoes.py`

**Interfaces:**
- Consumes: `_get_arquiteto_or_404`, `_checar_acesso_relacionamento` da Task 6.
- Produces: `GET/POST /arquitetos/{id}/interacoes`.

- [ ] **Step 1: Escrever os testes**

```python
from tests.conftest import auth_headers


def test_vendedor_vinculado_registra_interacao(client, gerente, vendedor):
    arquiteto = client.post(
        "/api/v1/arquitetos/", json={"nome": "Ana Arquiteta", "tipo": "arquiteto"},
        headers=auth_headers(gerente),
    ).json()
    client.patch(
        f"/api/v1/arquitetos/{arquiteto['id']}", json={"vendedor_id": vendedor.id},
        headers=auth_headers(gerente),
    )

    resp = client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/interacoes",
        json={"tipo": "ligacao", "observacao": "Combinei visita para semana que vem"},
        headers=auth_headers(vendedor),
    )
    assert resp.status_code == 201
    assert resp.json()["autor_nome"] == vendedor.nome
    assert resp.json()["tipo"] == "ligacao"


def test_vendedor_nao_vinculado_nao_pode_registrar_interacao(client, gerente, vendedor, outro_vendedor):
    arquiteto = client.post(
        "/api/v1/arquitetos/", json={"nome": "Ana Arquiteta", "tipo": "arquiteto"},
        headers=auth_headers(gerente),
    ).json()
    client.patch(
        f"/api/v1/arquitetos/{arquiteto['id']}", json={"vendedor_id": vendedor.id},
        headers=auth_headers(gerente),
    )

    resp = client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/interacoes",
        json={"tipo": "ligacao", "observacao": "Tentando registrar sem ser o dono"},
        headers=auth_headers(outro_vendedor),
    )
    assert resp.status_code == 403


def test_lista_interacoes_mais_recente_primeiro(client, gerente):
    arquiteto = client.post(
        "/api/v1/arquitetos/", json={"nome": "Ana Arquiteta", "tipo": "arquiteto"},
        headers=auth_headers(gerente),
    ).json()

    client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/interacoes",
        json={"tipo": "visita_escritorio", "observacao": "Primeira visita"},
        headers=auth_headers(gerente),
    )
    client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/interacoes",
        json={"tipo": "envio_brinde", "observacao": "Enviamos um brinde de fim de ano"},
        headers=auth_headers(gerente),
    )

    resp = client.get(f"/api/v1/arquitetos/{arquiteto['id']}/interacoes", headers=auth_headers(gerente))
    assert resp.status_code == 200
    tipos = [i["tipo"] for i in resp.json()]
    assert tipos == ["envio_brinde", "visita_escritorio"]
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/api/test_arquitetos_interacoes.py -v`
Expected: FAIL com `404` (rotas ainda não existem).

- [ ] **Step 3: Adicionar ao final de `backend/app/api/v1/endpoints/arquitetos.py`**

Nos imports do topo, adicionar:

```python
from app.models.crm import InteracaoArquiteto
from app.schemas.crm import InteracaoArquitetoCreate, InteracaoArquitetoResponse
```

E as rotas:

```python
@router.get("/{arquiteto_id}/interacoes", response_model=List[InteracaoArquitetoResponse])
def listar_interacoes(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_arquiteto_or_404(db, arquiteto_id)
    return (
        db.query(InteracaoArquiteto)
        .filter(InteracaoArquiteto.arquiteto_id == arquiteto_id)
        .order_by(InteracaoArquiteto.criado_em.desc())
        .all()
    )


@router.post("/{arquiteto_id}/interacoes", response_model=InteracaoArquitetoResponse, status_code=201)
def registrar_interacao(
    arquiteto_id: int,
    payload: InteracaoArquitetoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    arquiteto = _get_arquiteto_or_404(db, arquiteto_id)
    _checar_acesso_relacionamento(arquiteto, current_user)

    interacao = InteracaoArquiteto(
        arquiteto_id=arquiteto_id,
        autor_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(interacao)
    db.commit()
    db.refresh(interacao)
    return interacao
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `cd backend && python -m pytest tests/api/test_arquitetos_interacoes.py -v`
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/v1/endpoints/arquitetos.py backend/tests/api/test_arquitetos_interacoes.py
git commit -m "feat: add structured interaction history endpoints for Arquiteto"
```

---

### Task 9: Backend — funcionários do escritório (Decisores)

**Files:**
- Modify: `backend/app/api/v1/endpoints/arquitetos.py`
- Create: `backend/tests/api/test_arquitetos_funcionarios.py`

**Interfaces:**
- Consumes: `_get_arquiteto_or_404`, `_checar_acesso_relacionamento` da Task 6.
- Produces: `GET/POST /arquitetos/{id}/funcionarios`,
  `PATCH/DELETE /arquitetos/{id}/funcionarios/{funcionario_id}`.

- [ ] **Step 1: Escrever os testes**

```python
from tests.conftest import auth_headers


def test_cria_funcionario_com_flag_decisor(client, gerente):
    arquiteto = client.post(
        "/api/v1/arquitetos/", json={"nome": "Ana Arquiteta", "tipo": "arquiteto"},
        headers=auth_headers(gerente),
    ).json()

    resp = client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/funcionarios",
        json={"nome": "João Sócio", "funcao": "Sócio", "decisor": True},
        headers=auth_headers(gerente),
    )
    assert resp.status_code == 201
    assert resp.json()["decisor"] is True


def test_atualiza_e_remove_funcionario(client, gerente):
    arquiteto = client.post(
        "/api/v1/arquitetos/", json={"nome": "Ana Arquiteta", "tipo": "arquiteto"},
        headers=auth_headers(gerente),
    ).json()
    funcionario = client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/funcionarios",
        json={"nome": "Estagiária", "decisor": False},
        headers=auth_headers(gerente),
    ).json()

    resp_patch = client.patch(
        f"/api/v1/arquitetos/{arquiteto['id']}/funcionarios/{funcionario['id']}",
        json={"decisor": True, "observacoes": "Passou a decidir compras pequenas"},
        headers=auth_headers(gerente),
    )
    assert resp_patch.status_code == 200
    assert resp_patch.json()["decisor"] is True

    resp_delete = client.delete(
        f"/api/v1/arquitetos/{arquiteto['id']}/funcionarios/{funcionario['id']}",
        headers=auth_headers(gerente),
    )
    assert resp_delete.status_code == 204

    resp_lista = client.get(
        f"/api/v1/arquitetos/{arquiteto['id']}/funcionarios", headers=auth_headers(gerente)
    )
    assert resp_lista.json() == []


def test_vendedor_nao_vinculado_nao_pode_gerenciar_funcionarios(client, gerente, vendedor, outro_vendedor):
    arquiteto = client.post(
        "/api/v1/arquitetos/", json={"nome": "Ana Arquiteta", "tipo": "arquiteto"},
        headers=auth_headers(gerente),
    ).json()
    client.patch(
        f"/api/v1/arquitetos/{arquiteto['id']}", json={"vendedor_id": vendedor.id},
        headers=auth_headers(gerente),
    )

    resp = client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/funcionarios",
        json={"nome": "Alguém"},
        headers=auth_headers(outro_vendedor),
    )
    assert resp.status_code == 403
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/api/test_arquitetos_funcionarios.py -v`
Expected: FAIL com `404` (rotas ainda não existem).

- [ ] **Step 3: Adicionar ao final de `backend/app/api/v1/endpoints/arquitetos.py`**

Nos imports do topo, adicionar:

```python
from app.models.crm import FuncionarioArquiteto
from app.schemas.crm import (
    FuncionarioArquitetoCreate, FuncionarioArquitetoUpdate, FuncionarioArquitetoResponse,
)
```

E as rotas:

```python
@router.get("/{arquiteto_id}/funcionarios", response_model=List[FuncionarioArquitetoResponse])
def listar_funcionarios(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_arquiteto_or_404(db, arquiteto_id)
    return (
        db.query(FuncionarioArquiteto)
        .filter(FuncionarioArquiteto.arquiteto_id == arquiteto_id)
        .order_by(FuncionarioArquiteto.nome)
        .all()
    )


@router.post("/{arquiteto_id}/funcionarios", response_model=FuncionarioArquitetoResponse, status_code=201)
def criar_funcionario(
    arquiteto_id: int,
    payload: FuncionarioArquitetoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    arquiteto = _get_arquiteto_or_404(db, arquiteto_id)
    _checar_acesso_relacionamento(arquiteto, current_user)

    funcionario = FuncionarioArquiteto(arquiteto_id=arquiteto_id, **payload.model_dump())
    db.add(funcionario)
    db.commit()
    db.refresh(funcionario)
    return funcionario


@router.patch("/{arquiteto_id}/funcionarios/{funcionario_id}", response_model=FuncionarioArquitetoResponse)
def atualizar_funcionario(
    arquiteto_id: int,
    funcionario_id: int,
    payload: FuncionarioArquitetoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    arquiteto = _get_arquiteto_or_404(db, arquiteto_id)
    _checar_acesso_relacionamento(arquiteto, current_user)

    funcionario = db.query(FuncionarioArquiteto).filter(
        FuncionarioArquiteto.id == funcionario_id,
        FuncionarioArquiteto.arquiteto_id == arquiteto_id,
    ).first()
    if not funcionario:
        raise HTTPException(404, "Funcionário não encontrado")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(funcionario, field, value)
    db.commit()
    db.refresh(funcionario)
    return funcionario


@router.delete("/{arquiteto_id}/funcionarios/{funcionario_id}", status_code=204)
def remover_funcionario(
    arquiteto_id: int,
    funcionario_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    arquiteto = _get_arquiteto_or_404(db, arquiteto_id)
    _checar_acesso_relacionamento(arquiteto, current_user)

    funcionario = db.query(FuncionarioArquiteto).filter(
        FuncionarioArquiteto.id == funcionario_id,
        FuncionarioArquiteto.arquiteto_id == arquiteto_id,
    ).first()
    if not funcionario:
        raise HTTPException(404, "Funcionário não encontrado")
    db.delete(funcionario)
    db.commit()
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `cd backend && python -m pytest tests/api/test_arquitetos_funcionarios.py -v`
Expected: 3 passed

- [ ] **Step 5: Rodar a suíte inteira do backend**

Run: `cd backend && python -m pytest tests/ -v`
Expected: todos os testes passam (models + api).

- [ ] **Step 6: Commit**

```bash
git add backend/app/api/v1/endpoints/arquitetos.py backend/tests/api/test_arquitetos_funcionarios.py
git commit -m "feat: add employee (decisor) management endpoints for Arquiteto"
```

---

### Task 10: Frontend — `arquitetosApi` e labels

**Files:**
- Modify: `frontend/src/lib/api.js`
- Modify: `frontend/src/lib/constants.js`

**Interfaces:**
- Produces: `arquitetosApi` (objeto), `TIPO_ARQUITETO_LABELS`,
  `TIPO_INTERACAO_ARQUITETO_LABELS` — consumidos pelas Tasks 11, 12, 13.

- [ ] **Step 1: Adicionar ao final de `frontend/src/lib/api.js`**

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

- [ ] **Step 2: Adicionar ao final de `frontend/src/lib/constants.js`**

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

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/api.js frontend/src/lib/constants.js
git commit -m "feat: add arquitetosApi and Especificador label maps"
```

---

### Task 11: Frontend — lista de Especificadores

**Files:**
- Create: `frontend/src/pages/especificadores/EspecificadoresPage.jsx`

**Interfaces:**
- Consumes: `arquitetosApi`, `usersApi` (`lib/api.js`), `TIPO_ARQUITETO_LABELS`,
  `TIPO_ARQUITETO_COLORS`, `STATUS_COLOR_CLASSES` (`lib/constants.js`), `Modal`, `EmptyState`,
  `LoadingPage` (`components/ui`), `useAuthStore` (`store`).
- Produces: `EspecificadoresPage` (default export) — usado pela Task 13 (rota).

- [ ] **Step 1: Criar `frontend/src/pages/especificadores/EspecificadoresPage.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { arquitetosApi, usersApi } from '../../lib/api'
import { Modal, EmptyState, LoadingPage } from '../../components/ui'
import { TIPO_ARQUITETO_LABELS, TIPO_ARQUITETO_COLORS, STATUS_COLOR_CLASSES } from '../../lib/constants'
import { useAuthStore, podeVerTudo } from '../../store'
import EspecificadorDrawer from './EspecificadorDrawer'
import clsx from 'clsx'

export function TipoBadge({ tipo }) {
  if (!tipo) return <span className="text-stone-300 text-xs">—</span>
  const color = TIPO_ARQUITETO_COLORS[tipo] || 'stone'
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLOR_CLASSES[color])}>
      {TIPO_ARQUITETO_LABELS[tipo] || tipo}
    </span>
  )
}

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

  const filtrados = especificadores.filter(a =>
    !search || a.nome.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingPage />

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 bg-stone-100 rounded-lg px-3 py-1.5 flex-1 max-w-xs">
          <Search size={13} className="text-stone-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar especificador..."
            className="bg-transparent text-sm text-stone-700 outline-none w-full placeholder:text-stone-400"
          />
        </div>

        <select className="input w-40" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Todos os tipos</option>
          {Object.entries(TIPO_ARQUITETO_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        {podeGerenciarVendedores && (
          <select className="input w-48" value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)}>
            <option value="">Todos os vendedores</option>
            {vendedores.map(v => (
              <option key={v.id} value={v.id}>{v.nome}</option>
            ))}
          </select>
        )}

        <button onClick={() => setShowModal(true)} className="btn-primary btn-sm gap-1.5 ml-auto">
          <Plus size={13} /> Novo Especificador
        </button>
      </div>

      {/* Tabela */}
      {filtrados.length === 0 ? (
        <EmptyState title="Nenhum especificador encontrado" description="Tente ajustar os filtros ou cadastre um novo." />
      ) : (
        <div className="card overflow-hidden">
          <table className="table-base">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Escritório</th>
                <th>Telefone</th>
                <th>Nível de parceria</th>
                <th>Vendedor vinculado</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(a => (
                <tr key={a.id}>
                  <td>
                    <button
                      className="font-medium text-stone-800 hover:text-primary-600 transition-colors text-left"
                      onClick={() => setSelecionadoId(a.id)}
                    >
                      {a.nome}
                    </button>
                  </td>
                  <td><TipoBadge tipo={a.tipo} /></td>
                  <td>{a.escritorio || '—'}</td>
                  <td>{a.telefone || '—'}</td>
                  <td className="capitalize">{a.nivel_parceria}</td>
                  <td>{a.vendedor_nome || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NovoEspecificadorModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSaved={() => { setShowModal(false); fetchLista() }}
      />

      {selecionadoId && (
        <EspecificadorDrawer
          arquitetoId={selecionadoId}
          onClose={() => setSelecionadoId(null)}
          onUpdated={fetchLista}
        />
      )}
    </div>
  )
}

// === Modal Novo Especificador ===
function NovoEspecificadorModal({ open, onClose, onSaved }) {
  const vazio = { nome: '', tipo: '', escritorio: '', telefone: '', email: '', nivel_parceria: 'parceiro' }
  const [form, setForm] = useState(vazio)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await arquitetosApi.create(form)
      onSaved()
      setForm(vazio)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao salvar especificador')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Especificador" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nome *</label>
            <input className="input" required value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" />
          </div>
          <div>
            <label className="label">Tipo *</label>
            <select className="input" required value={form.tipo} onChange={e => set('tipo', e.target.value)}>
              <option value="" disabled>Selecione...</option>
              {Object.entries(TIPO_ARQUITETO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Nível de parceria</label>
            <select className="input" value={form.nivel_parceria} onChange={e => set('nivel_parceria', e.target.value)}>
              <option value="parceiro">Parceiro</option>
              <option value="premium">Premium</option>
              <option value="vip">VIP</option>
            </select>
          </div>
          <div>
            <label className="label">Escritório</label>
            <input className="input" value={form.escritorio} onChange={e => set('escritorio', e.target.value)} placeholder="Nome do escritório" />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input className="input" value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(11) 99999-0000" />
          </div>
          <div className="col-span-2">
            <label className="label">E-mail</label>
            <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Cadastrar Especificador'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/especificadores/EspecificadoresPage.jsx
git commit -m "feat: add Especificadores list page with filters and creation modal"
```

---

### Task 12: Frontend — conteúdo das abas (Perfil, Score, Decisores)

**Files:**
- Create: `frontend/src/pages/especificadores/EspecificadorTabs.jsx`

**Interfaces:**
- Consumes: `arquitetosApi`, `usersApi` (`lib/api.js`), `TIPO_INTERACAO_ARQUITETO_LABELS`,
  `timeAgo`, `formatDatetime` (`lib/constants.js`), `EmptyState` (`components/ui`),
  `useAuthStore`, `podeVerTudo` (`store`).
- Produces: `PerfilTab`, `ScoreTab`, `DecisoresTab`, `EditarEspecificadorModal` — usados pelas
  Task 13 (drawer e página completa).

- [ ] **Step 1: Criar `frontend/src/pages/especificadores/EspecificadorTabs.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { TrendingUp, Trash2, Plus, User } from 'lucide-react'
import { arquitetosApi, usersApi } from '../../lib/api'
import { TIPO_ARQUITETO_LABELS, TIPO_INTERACAO_ARQUITETO_LABELS, timeAgo } from '../../lib/constants'
import { EmptyState, Modal } from '../../components/ui'
import { useAuthStore, podeVerTudo } from '../../store'

function podeGerenciarRelacionamento(user, arquiteto) {
  if (podeVerTudo(user?.perfil) || user?.perfil === 'recepcao') return true
  return user?.perfil === 'vendedor' && arquiteto?.vendedor_id === user?.id
}

// === Aba Perfil ===
export function PerfilTab({ arquiteto, onUpdated }) {
  const { user } = useAuthStore()
  const [clientes, setClientes] = useState([])
  const [interacoes, setInteracoes] = useState([])
  const [tipo, setTipo] = useState('visita_escritorio')
  const [observacao, setObservacao] = useState('')
  const [loadingRegistro, setLoadingRegistro] = useState(false)

  const podeRegistrar = podeGerenciarRelacionamento(user, arquiteto)

  const carregar = () => {
    arquitetosApi.listarClientes(arquiteto.id).then(r => setClientes(r.data)).catch(console.error)
    arquitetosApi.listarInteracoes(arquiteto.id).then(r => setInteracoes(r.data)).catch(console.error)
  }

  useEffect(() => { carregar() }, [arquiteto.id])

  const registrar = async () => {
    if (!observacao.trim()) return
    setLoadingRegistro(true)
    try {
      await arquitetosApi.registrarInteracao(arquiteto.id, { tipo, observacao })
      setObservacao('')
      carregar()
      onUpdated?.()
    } catch (e) { console.error(e) }
    finally { setLoadingRegistro(false) }
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
          <p className="text-xs text-stone-400">Vendedor vinculado</p>
          <p className="font-medium text-stone-700">{arquiteto.vendedor_nome || 'Nenhum'}</p>
        </div>
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

        {podeRegistrar && (
          <div className="space-y-2 mb-4">
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="input text-sm">
              {Object.entries(TIPO_INTERACAO_ARQUITETO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <textarea
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Observações sobre o contato..."
              className="input resize-none h-20 text-sm"
            />
            <button
              onClick={registrar}
              disabled={loadingRegistro || !observacao.trim()}
              className="btn-primary w-full justify-center"
            >
              {loadingRegistro ? 'Registrando...' : 'Registrar interação'}
            </button>
          </div>
        )}

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
                    <span className="text-2xs text-stone-300">{timeAgo(i.criado_em)}</span>
                  </div>
                  <p className="text-sm text-stone-600 leading-relaxed">{i.observacao}</p>
                  <p className="text-2xs text-stone-400 mt-0.5">por {i.autor_nome || 'usuário'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// === Aba Score ===
export function ScoreTab() {
  return (
    <EmptyState
      icon={TrendingUp}
      title="Score ainda não disponível"
      description="O RFV (Recência, Frequência, Valor) deste especificador depende de pedidos e fechamentos vinculados a ele — funcionalidade prevista para uma próxima etapa. Assim que houver dados suficientes, o score aparecerá aqui automaticamente."
    />
  )
}

// === Aba Decisores ===
export function DecisoresTab({ arquiteto }) {
  const { user } = useAuthStore()
  const [funcionarios, setFuncionarios] = useState([])
  const [showModal, setShowModal] = useState(false)

  const podeGerenciar = podeGerenciarRelacionamento(user, arquiteto)

  const carregar = () => {
    arquitetosApi.listarFuncionarios(arquiteto.id).then(r => setFuncionarios(r.data)).catch(console.error)
  }

  useEffect(() => { carregar() }, [arquiteto.id])

  const toggleDecisor = async (funcionario) => {
    try {
      await arquitetosApi.atualizarFuncionario(arquiteto.id, funcionario.id, { decisor: !funcionario.decisor })
      carregar()
    } catch (e) { console.error(e) }
  }

  const remover = async (funcionarioId) => {
    try {
      await arquitetosApi.removerFuncionario(arquiteto.id, funcionarioId)
      carregar()
    } catch (e) { console.error(e) }
  }

  return (
    <div className="space-y-4">
      {podeGerenciar && (
        <button onClick={() => setShowModal(true)} className="btn-secondary btn-sm gap-1.5">
          <Plus size={13} /> Adicionar funcionário
        </button>
      )}

      {funcionarios.length === 0 ? (
        <EmptyState title="Nenhum funcionário cadastrado" description="Adicione as pessoas do escritório e marque quem participa das decisões de compra." />
      ) : (
        <div className="space-y-3">
          {funcionarios.map(f => (
            <div key={f.id} className="card p-3 flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-stone-800 text-sm">{f.nome}</p>
                  {f.funcao && <span className="text-xs text-stone-400">— {f.funcao}</span>}
                </div>
                <div className="text-xs text-stone-400 mt-0.5 space-x-2">
                  {f.telefone && <span>{f.telefone}</span>}
                  {f.email && <span>{f.email}</span>}
                </div>
                {f.observacoes && <p className="text-sm text-stone-500 mt-1">{f.observacoes}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <label className="flex items-center gap-1.5 text-xs text-stone-500">
                  <input
                    type="checkbox"
                    checked={f.decisor}
                    disabled={!podeGerenciar}
                    onChange={() => toggleDecisor(f)}
                  />
                  Decisor
                </label>
                {podeGerenciar && (
                  <button onClick={() => remover(f.id)} className="text-stone-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <NovoFuncionarioModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSaved={() => { setShowModal(false); carregar() }}
        arquitetoId={arquiteto.id}
      />
    </div>
  )
}

function NovoFuncionarioModal({ open, onClose, onSaved, arquitetoId }) {
  const vazio = { nome: '', funcao: '', telefone: '', email: '', observacoes: '', decisor: false }
  const [form, setForm] = useState(vazio)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await arquitetosApi.criarFuncionario(arquitetoId, form)
      onSaved()
      setForm(vazio)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao salvar funcionário')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo funcionário" size="sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Nome *</label>
          <input className="input" required value={form.nome} onChange={e => set('nome', e.target.value)} />
        </div>
        <div>
          <label className="label">Função</label>
          <input className="input" value={form.funcao} onChange={e => set('funcao', e.target.value)} placeholder="Ex: Sócio, Estagiário" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Telefone</label>
            <input className="input" value={form.telefone} onChange={e => set('telefone', e.target.value)} />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Observações</label>
          <textarea className="input resize-none h-16" value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" checked={form.decisor} onChange={e => set('decisor', e.target.checked)} />
          É decisor
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// === Modal de edição dos dados principais ===
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
        email: form.email, nivel_parceria: form.nivel_parceria,
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

  return (
    <Modal open={open} onClose={onClose} title="Editar especificador" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nome *</label>
            <input className="input" required value={form.nome || ''} onChange={e => set('nome', e.target.value)} />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={form.tipo || ''} onChange={e => set('tipo', e.target.value)}>
              {Object.entries(TIPO_ARQUITETO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Nível de parceria</label>
            <select className="input" value={form.nivel_parceria || 'parceiro'} onChange={e => set('nivel_parceria', e.target.value)}>
              <option value="parceiro">Parceiro</option>
              <option value="premium">Premium</option>
              <option value="vip">VIP</option>
            </select>
          </div>
          <div>
            <label className="label">Escritório</label>
            <input className="input" value={form.escritorio || ''} onChange={e => set('escritorio', e.target.value)} />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input className="input" value={form.telefone || ''} onChange={e => set('telefone', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">E-mail</label>
            <input className="input" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
          </div>
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
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/especificadores/EspecificadorTabs.jsx
git commit -m "feat: add Perfil/Score/Decisores tab content for Especificador"
```

---

### Task 13: Frontend — drawer, página completa, rotas e sidebar

**Files:**
- Create: `frontend/src/pages/especificadores/EspecificadorDrawer.jsx`
- Create: `frontend/src/pages/especificadores/EspecificadorDetalhePage.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/layout/Sidebar.jsx`

**Interfaces:**
- Consumes: `arquitetosApi` (`lib/api.js`); `PerfilTab`, `ScoreTab`, `DecisoresTab`,
  `EditarEspecificadorModal` (Task 12); `Tabs`, `LoadingPage` (`components/ui`).

- [ ] **Step 1: Criar `frontend/src/pages/especificadores/EspecificadorDrawer.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { arquitetosApi } from '../../lib/api'
import { Tabs, Spinner } from '../../components/ui'
import { PerfilTab, ScoreTab, DecisoresTab, EditarEspecificadorModal } from './EspecificadorTabs'

export default function EspecificadorDrawer({ arquitetoId, onClose, onUpdated }) {
  const navigate = useNavigate()
  const [arquiteto, setArquiteto] = useState(null)
  const [tab, setTab] = useState('perfil')
  const [showEdit, setShowEdit] = useState(false)

  const carregar = () => {
    arquitetosApi.get(arquitetoId).then(r => setArquiteto(r.data)).catch(console.error)
  }

  useEffect(() => { carregar() }, [arquitetoId])

  if (!arquiteto) {
    return (
      <div className="fixed inset-y-0 right-0 w-[28rem] bg-white shadow-elevated border-l border-stone-200 z-50 flex items-center justify-center animate-slide-in-right">
        <Spinner size={24} />
      </div>
    )
  }

  return (
    <div className="fixed inset-y-0 right-0 w-[28rem] bg-white shadow-elevated border-l border-stone-200 z-50 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
        <div>
          <button
            className="font-semibold text-stone-800 hover:text-primary-600 transition-colors text-left"
            onClick={() => navigate(`/especificadores/${arquiteto.id}`)}
          >
            {arquiteto.nome}
          </button>
          <p className="text-xs text-stone-400">{arquiteto.telefone}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary btn-sm" onClick={() => setShowEdit(true)}>Editar</button>
          <button onClick={onClose} className="btn-icon">✕</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-4">
        <Tabs
          tabs={[
            { key: 'perfil', label: 'Perfil' },
            { key: 'score', label: 'Score' },
            { key: 'decisores', label: 'Decisores' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === 'perfil' && <PerfilTab arquiteto={arquiteto} onUpdated={() => { carregar(); onUpdated?.() }} />}
        {tab === 'score' && <ScoreTab />}
        {tab === 'decisores' && <DecisoresTab arquiteto={arquiteto} />}
      </div>

      <EditarEspecificadorModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        arquiteto={arquiteto}
        onSaved={() => { setShowEdit(false); carregar(); onUpdated?.() }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Criar `frontend/src/pages/especificadores/EspecificadorDetalhePage.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { arquitetosApi } from '../../lib/api'
import { Tabs, LoadingPage } from '../../components/ui'
import { PerfilTab, ScoreTab, DecisoresTab, EditarEspecificadorModal } from './EspecificadorTabs'

export default function EspecificadorDetalhePage() {
  const { id } = useParams()
  const [arquiteto, setArquiteto] = useState(null)
  const [tab, setTab] = useState('perfil')
  const [showEdit, setShowEdit] = useState(false)

  const carregar = () => {
    arquitetosApi.get(id).then(r => setArquiteto(r.data)).catch(console.error)
  }

  useEffect(() => { carregar() }, [id])

  if (!arquiteto) return <LoadingPage />

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-stone-800">{arquiteto.nome}</h1>
          <p className="text-sm text-stone-400">{arquiteto.telefone}</p>
        </div>
        <button className="btn-secondary btn-sm" onClick={() => setShowEdit(true)}>Editar</button>
      </div>

      <Tabs
        tabs={[
          { key: 'perfil', label: 'Perfil' },
          { key: 'score', label: 'Score' },
          { key: 'decisores', label: 'Decisores' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="mt-5 card p-5">
        {tab === 'perfil' && <PerfilTab arquiteto={arquiteto} onUpdated={carregar} />}
        {tab === 'score' && <ScoreTab />}
        {tab === 'decisores' && <DecisoresTab arquiteto={arquiteto} />}
      </div>

      <EditarEspecificadorModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        arquiteto={arquiteto}
        onSaved={() => { setShowEdit(false); carregar() }}
      />
    </div>
  )
}
```

- [ ] **Step 3: Editar `frontend/src/App.jsx`**

Adicionar os imports (junto aos demais imports de página):

```jsx
import EspecificadoresPage from './pages/especificadores/EspecificadoresPage'
import EspecificadorDetalhePage from './pages/especificadores/EspecificadorDetalhePage'
```

Alterar a função `ProtectedLayout` para lidar com a rota dinâmica `/especificadores/:id`:

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

Adicionar as rotas dentro do `<Route element={<ProtectedLayout />}>`, logo após `/crm`:

```jsx
            <Route path="/especificadores"     element={<EspecificadoresPage />} />
            <Route path="/especificadores/:id" element={<EspecificadorDetalhePage />} />
```

- [ ] **Step 4: Editar `frontend/src/components/layout/Sidebar.jsx`**

No import de ícones, adicionar `Compass`:

```jsx
import {
  LayoutDashboard, Users, FileText, Layers, DollarSign,
  Truck, Hammer, HeadphonesIcon, BarChart2, Settings, LogOut,
  ChevronLeft, Building2, Compass
} from 'lucide-react'
```

No array `NAV`, adicionar logo após a entrada `/crm`:

```jsx
  { path: '/especificadores', label: 'Especificadores', icon: Compass, perfis: ['diretoria','gerente_comercial','vendedor','recepcao'] },
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/especificadores/EspecificadorDrawer.jsx frontend/src/pages/especificadores/EspecificadorDetalhePage.jsx frontend/src/App.jsx frontend/src/components/layout/Sidebar.jsx
git commit -m "feat: register Especificadores routes, drawer, full page and sidebar navigation"
```

---

### Task 14: Verificação manual ponta-a-ponta

**Files:** nenhum (task de verificação)

- [ ] **Step 1: Subir backend e frontend**

Run: `cd backend && uvicorn app.main:app --reload --port 8000` (em um terminal)
Run: `cd frontend && npm run dev` (em outro terminal)

- [ ] **Step 2: Fluxo como Gerente**

1. Login como `gerente@lidermoveis.com.br` / `Teste@123`.
2. Confirmar que "Especificadores" aparece no menu lateral, na seção Comercial.
3. Clicar, ver a lista vazia inicialmente, clicar em "Novo Especificador", preencher nome +
   tipo (obrigatório) e salvar — confirmar que aparece na lista ordenada alfabeticamente com o
   badge de tipo correto.
4. Clicar no nome — drawer abre com abas Perfil/Score/Decisores.
5. Na aba Perfil, clicar em "Editar", definir o vendedor vinculado, endereço do escritório, e
   salvar — confirmar que os dados aparecem atualizados na aba.
6. Ainda na aba Perfil, registrar uma interação (ex: "Ligação" + observação) e confirmar que
   aparece na timeline logo abaixo, mais recente primeiro.
7. Na aba Decisores, adicionar um funcionário, marcar como decisor, confirmar que o checkbox
   reflete o estado, e testar remoção.
8. Na aba Score, confirmar que aparece a mensagem de "ainda não disponível" em vez de dados
   vazios/quebrados.
9. Clicar no nome no header do drawer — confirmar que navega para
   `/especificadores/{id}` e mostra o mesmo conteúdo em página cheia.

- [ ] **Step 3: Fluxo como Vendedor vinculado vs. não vinculado**

1. Logout, login como `vendedor@lidermoveis.com.br` / `Teste@123`.
2. Abrir o especificador cujo vendedor vinculado é este usuário — confirmar que consegue
   registrar interação e gerenciar funcionários.
3. Criar (via Gerente, em outra aba/sessão, ou via `/docs`) um segundo vendedor de teste e um
   especificador vinculado a ele; logado como o primeiro vendedor, confirmar que os campos de
   registrar interação/gerenciar funcionários ficam ocultos ou bloqueados para esse
   especificador que não é seu.

- [ ] **Step 4: Vínculo com Cliente**

1. Como Gerente, criar um cliente via `POST /api/v1/clientes/` (pelo `/docs`, já que não há
   tela de Cliente) com `arquiteto_id` apontando para um especificador criado no Step 2.
2. Voltar à aba Perfil desse especificador no frontend — confirmar que o cliente aparece em
   "Clientes vinculados" (como texto, sem link, conforme decidido no spec).

- [ ] **Step 5: Confirmar que os testes automatizados do backend continuam passando**

Run: `cd backend && python -m pytest tests/ -v`
Expected: todos os testes passam.
