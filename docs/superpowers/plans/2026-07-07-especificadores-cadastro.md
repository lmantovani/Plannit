# Especificadores — Cadastro (Sub-projeto 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o `Arquiteto` atual (cadastro raso, sem tipos, sem ficha) pelo módulo de
`Especificador` — cadastro PF/PJ completo com tipos configuráveis, pessoas vinculadas,
portfólio, checklist de ativação, potencial calculado automaticamente e permissões por papel —
fundação para todos os sub-projetos futuros do módulo (RFV, P×L, Next Best Action etc.).

**Architecture:** Backend FastAPI + SQLAlchemy (modelos novos em `app/models/especificador.py`,
endpoints em `app/api/v1/endpoints/especificadores.py`), frontend React (nova página com
drawer de ficha em abas). Sem multi-tenancy. `Arquiteto` é removido e substituído — não
coexiste com `Especificador`.

**Tech Stack:** FastAPI 0.111, SQLAlchemy 2.0, Alembic, Pydantic v2, pytest (backend) · React
19, Axios, TanStack Query, TailwindCSS (frontend).

**Spec:** `docs/superpowers/specs/2026-07-07-especificadores-cadastro-design.md`

## Global Constraints

- Nomenclatura: tudo em português, seguindo o padrão do restante do código
  (`nome`, `criado_em`, etc.).
- Endpoints usam `response_model` do Pydantic (padrão já usado em `arquitetos.py`), não
  serialização manual por dict.
- `require_roles(*perfis)` para rotas restritas por papel; `get_current_user` para rotas
  autenticadas sem restrição de perfil — ambos já existem em `app/core/security.py`, não
  recriar.
- Nunca deletar registros de fato — desativação lógica (`status=inativo`), seguindo o padrão
  RN017 já usado em Projetos.
- Sem multi-tenancy — nenhuma tabela deste sub-projeto ganha `tenant_id`.
- `potencial` nunca é aceito como input do cliente (nem em Create nem em Update) — é sempre
  calculado no backend a partir de `obras_por_ano` × `valor_medio_obra`.
- `lealdade` não tem input manual neste sub-projeto — fica sempre `None` até o sub-projeto 2
  (RFV) implementar o cálculo automático via share of wallet real.
- Frontend não tem framework de testes configurado hoje (nem vitest nem Testing Library) —
  as tarefas de frontend deste plano são verificadas manualmente rodando o dev server,
  seguindo a convenção já existente no restante do projeto (nenhuma página tem testes
  automatizados hoje).

---

## Observação importante descoberta durante o planejamento

O documento de design cobria `Lead.arquiteto_id` como o único vínculo a atualizar (seção 28),
mas o código também tem `Projeto.arquiteto_id` (`app/models/projeto.py:74`), com FK apontando
para `arquitetos.id` e um relationship `arquiteto = relationship("Arquiteto")`
(`app/models/projeto.py:104`). Como a tabela `arquitetos` deixa de existir, esse FK ficaria
apontando para uma tabela inexistente. A Task 2 abaixo renomeia esse campo também
(`arquiteto_id` → `especificador_id` em `Projeto`), e a Task 3 inclui isso na migration. Os
campos livres `arquiteto_nome`/`arquiteto_email` em `Briefing` (`app/models/projeto.py:170-171`)
são texto solto captado no briefing, não uma FK — não são afetados.

---

### Task 1: Infraestrutura de testes (pytest)

Não existe hoje nenhum teste automatizado no backend (só `pytest`/`pytest-asyncio` nas
dependências, sem uso). Esta task cria a base para todos os testes das tasks seguintes: um
banco SQLite em memória isolado do Postgres real, com override da dependency `get_db`.

**Files:**
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`

**Interfaces:**
- Produces: fixtures `db` (Session SQLite em memória), `client` (TestClient com `get_db`
  sobrescrito), `vendedor`, `outro_vendedor`, `gestor`, `admin` (instâncias de `User`),
  helper `auth_headers(user) -> dict`.

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
def gestor(db):
    return make_user(db, PerfilUsuario.GERENTE_COMERCIAL, "gestor@teste.com", "Gestor")


@pytest.fixture()
def admin(db):
    return make_user(db, PerfilUsuario.DIRETORIA, "admin@teste.com", "Admin")
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

### Task 2: Models — `Especificador` e entidades relacionadas

Cria o novo arquivo de models, remove `Arquiteto` de `crm.py`, e corrige os dois pontos que
referenciavam a tabela `arquitetos` (`Lead` e `Projeto`).

**Files:**
- Create: `backend/app/models/especificador.py`
- Modify: `backend/app/models/crm.py` (remove `Arquiteto`; renomeia `Lead.arquiteto_id` →
  `especificador_id`)
- Modify: `backend/app/models/projeto.py:74,104` (renomeia `Projeto.arquiteto_id` →
  `especificador_id`)
- Modify: `backend/app/models/__init__.py`

**Interfaces:**
- Produces: `TipoCadastro`, `StatusEspecificador`, `EstagioCarreira`, `Especialidade`,
  `FitPortfolio`, `PapelPessoaVinculada` (enums); `TipoEspecificador`, `FaixaPotencial`,
  `Especificador`, `PessoaVinculada`, `TipoAtributoDinamico`, `AtributoDinamico`,
  `ObservacaoEspecificador`, `ResponsavelHistorico`, `ChecklistTemplateItem`,
  `EspecificadorChecklistItem` (models). `Especificador.potencial_anual_bruto` (property,
  `float | None`), `Especificador.responsavel_atual_id` (property, `int | None`).

- [ ] **Step 1: Criar `backend/app/models/especificador.py`**

```python
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date, Enum as SAEnum, Text, ForeignKey, Float,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class TipoCadastro(str, enum.Enum):
    PF = "pf"
    PJ = "pj"


class StatusEspecificador(str, enum.Enum):
    ATIVO = "ativo"
    INATIVO = "inativo"
    PROSPECT = "prospect"


class EstagioCarreira(str, enum.Enum):
    INICIANTE = "iniciante"
    ESTABELECIDO = "estabelecido"
    SENIOR = "senior"
    SOCIO = "socio"


class Especialidade(str, enum.Enum):
    RESIDENCIAL_ALTO_PADRAO = "residencial_alto_padrao"
    RESIDENCIAL_MEDIO = "residencial_medio"
    COMERCIAL = "comercial"
    HOTELEIRO = "hoteleiro"
    CORPORATIVO = "corporativo"
    OUTRO = "outro"


class FitPortfolio(str, enum.Enum):
    ALTO = "alto"
    MEDIO = "medio"
    BAIXO = "baixo"


class PapelPessoaVinculada(str, enum.Enum):
    RESPONSAVEL = "responsavel"
    DECISOR = "decisor"
    FUNCIONARIO = "funcionario"


class TipoEspecificador(Base):
    """Tipos configuráveis pelo Admin (Arquiteto, Designer de Interiores, Engenheiro...)."""
    __tablename__ = "tipos_especificador"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False, unique=True)
    ativo = Column(Boolean, default=True)
    ordem = Column(Integer, default=0)


class FaixaPotencial(Base):
    """Faixas de R$/ano usadas para derivar a nota de Potencial (1-5) automaticamente."""
    __tablename__ = "faixas_potencial"

    id = Column(Integer, primary_key=True, index=True)
    nota = Column(Integer, nullable=False, unique=True)
    valor_minimo = Column(Float, nullable=False)


class Especificador(Base):
    __tablename__ = "especificadores"

    id = Column(Integer, primary_key=True, index=True)
    tipo_cadastro = Column(SAEnum(TipoCadastro), nullable=False, default=TipoCadastro.PF)
    tipo_especificador_id = Column(Integer, ForeignKey("tipos_especificador.id"), nullable=False)

    nome = Column(String(200), nullable=False)
    cpf_cnpj = Column(String(20), nullable=True)
    telefone = Column(String(20), nullable=False)
    email = Column(String(200), nullable=True, unique=True)
    endereco_escritorio = Column(String(300), nullable=True)

    aniversario_dia = Column(Integer, nullable=True)
    aniversario_mes = Column(Integer, nullable=True)
    aniversario_ano = Column(Integer, nullable=True)

    estagio_carreira = Column(SAEnum(EstagioCarreira), nullable=True)
    especialidade = Column(SAEnum(Especialidade), nullable=True)
    fit_portfolio = Column(SAEnum(FitPortfolio), nullable=True)

    # Calculado automaticamente — nunca aceito como input direto do cliente
    potencial = Column(Integer, nullable=True)
    # Reservado para o sub-projeto 2 (RFV) — cálculo automático via share of wallet real
    lealdade = Column(Integer, nullable=True)

    status = Column(SAEnum(StatusEspecificador), nullable=False, default=StatusEspecificador.PROSPECT)

    # Portfólio e perfil do escritório
    faixa_valor_tipica = Column(String(100), nullable=True)
    estilo_predominante = Column(String(200), nullable=True)
    tipos_projeto_frequentes = Column(String(200), nullable=True)
    obras_por_ano = Column(Integer, nullable=True)
    valor_medio_obra = Column(Float, nullable=True)
    regioes_atuacao = Column(String(200), nullable=True)
    instagram = Column(String(200), nullable=True)
    linkedin = Column(String(200), nullable=True)
    site = Column(String(200), nullable=True)
    influenciador = Column(Boolean, default=False)
    observacoes_portfolio = Column(Text, nullable=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    tipo_especificador = relationship("TipoEspecificador")
    pessoas_vinculadas = relationship(
        "PessoaVinculada", back_populates="especificador", cascade="all, delete-orphan"
    )
    atributos = relationship(
        "AtributoDinamico", back_populates="especificador", cascade="all, delete-orphan"
    )
    observacoes = relationship(
        "ObservacaoEspecificador", back_populates="especificador",
        cascade="all, delete-orphan", order_by="ObservacaoEspecificador.criado_em.desc()",
    )
    checklist_items = relationship(
        "EspecificadorChecklistItem", back_populates="especificador",
        cascade="all, delete-orphan", order_by="EspecificadorChecklistItem.ordem",
    )
    responsaveis_historico = relationship(
        "ResponsavelHistorico", back_populates="especificador", cascade="all, delete-orphan"
    )

    @property
    def potencial_anual_bruto(self):
        if self.obras_por_ano and self.valor_medio_obra:
            return self.obras_por_ano * self.valor_medio_obra
        return None

    @property
    def responsavel_atual_id(self):
        for historico in self.responsaveis_historico:
            if historico.data_fim is None:
                return historico.vendedor_id
        return None

    def __repr__(self):
        return f"<Especificador {self.nome} [{self.status}]>"


class PessoaVinculada(Base):
    """Só relevante quando Especificador.tipo_cadastro == PJ (UI esconde a aba pra PF)."""
    __tablename__ = "pessoas_vinculadas"

    id = Column(Integer, primary_key=True, index=True)
    especificador_id = Column(Integer, ForeignKey("especificadores.id"), nullable=False)
    nome = Column(String(200), nullable=False)
    papel = Column(SAEnum(PapelPessoaVinculada), nullable=False, default=PapelPessoaVinculada.FUNCIONARIO)
    telefone = Column(String(20), nullable=True)
    email = Column(String(200), nullable=True)
    aniversario_dia = Column(Integer, nullable=True)
    aniversario_mes = Column(Integer, nullable=True)
    aniversario_ano = Column(Integer, nullable=True)
    observacao = Column(Text, nullable=True)

    especificador = relationship("Especificador", back_populates="pessoas_vinculadas")


class TipoAtributoDinamico(Base):
    """Tipos configuráveis pelo Admin para a ficha de relacionamento (4.8)."""
    __tablename__ = "tipos_atributo_dinamico"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False, unique=True)
    ativo = Column(Boolean, default=True)


class AtributoDinamico(Base):
    __tablename__ = "atributos_dinamicos"

    id = Column(Integer, primary_key=True, index=True)
    especificador_id = Column(Integer, ForeignKey("especificadores.id"), nullable=False)
    tipo = Column(String(100), nullable=False)
    valor = Column(String(500), nullable=False)

    especificador = relationship("Especificador", back_populates="atributos")


class ObservacaoEspecificador(Base):
    """Append-only — sem edição ou remoção."""
    __tablename__ = "observacoes_especificador"

    id = Column(Integer, primary_key=True, index=True)
    especificador_id = Column(Integer, ForeignKey("especificadores.id"), nullable=False)
    autor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    texto = Column(Text, nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    especificador = relationship("Especificador", back_populates="observacoes")
    autor = relationship("User", foreign_keys=[autor_id])


class ResponsavelHistorico(Base):
    """RN008 — ao trocar responsável, o vínculo atual recebe data_fim e um novo é aberto."""
    __tablename__ = "responsavel_historico"

    id = Column(Integer, primary_key=True, index=True)
    especificador_id = Column(Integer, ForeignKey("especificadores.id"), nullable=False)
    vendedor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    data_inicio = Column(Date, nullable=False)
    data_fim = Column(Date, nullable=True)

    especificador = relationship("Especificador", back_populates="responsaveis_historico")
    vendedor = relationship("User", foreign_keys=[vendedor_id])


class ChecklistTemplateItem(Base):
    """Template configurável pelo Admin, por tipo de especificador."""
    __tablename__ = "checklist_template_items"

    id = Column(Integer, primary_key=True, index=True)
    tipo_especificador_id = Column(Integer, ForeignKey("tipos_especificador.id"), nullable=False)
    descricao = Column(String(300), nullable=False)
    ordem = Column(Integer, default=0)
    ativo = Column(Boolean, default=True)


class EspecificadorChecklistItem(Base):
    """Snapshot copiado do template ativo no momento do cadastro do especificador."""
    __tablename__ = "especificador_checklist_items"

    id = Column(Integer, primary_key=True, index=True)
    especificador_id = Column(Integer, ForeignKey("especificadores.id"), nullable=False)
    descricao = Column(String(300), nullable=False)
    ordem = Column(Integer, default=0)
    concluido = Column(Boolean, default=False)
    concluido_em = Column(DateTime(timezone=True), nullable=True)

    especificador = relationship("Especificador", back_populates="checklist_items")
```

- [ ] **Step 2: Remover `Arquiteto` de `backend/app/models/crm.py` e renomear o FK do `Lead`**

Remover completamente o bloco (linhas 121-136 do arquivo atual):

```python
class Arquiteto(Base):
    __tablename__ = "arquitetos"
    ...
    def __repr__(self):
        return f"<Arquiteto {self.nome}>"
```

Em `Lead` (linha 51), trocar:
```python
    arquiteto_id = Column(Integer, ForeignKey("arquitetos.id"), nullable=True)
```
por:
```python
    especificador_id = Column(Integer, ForeignKey("especificadores.id"), nullable=True)
```

Em `Lead` (linha 69), trocar:
```python
    arquiteto = relationship("Arquiteto", foreign_keys=[arquiteto_id])
```
por:
```python
    especificador = relationship("Especificador", foreign_keys=[especificador_id])
```

- [ ] **Step 3: Renomear o FK de `Projeto` em `backend/app/models/projeto.py`**

Linha 74, trocar:
```python
    arquiteto_id = Column(Integer, ForeignKey("arquitetos.id"), nullable=True)
```
por:
```python
    especificador_id = Column(Integer, ForeignKey("especificadores.id"), nullable=True)
```

Linha 104, trocar:
```python
    arquiteto = relationship("Arquiteto")
```
por:
```python
    especificador = relationship("Especificador")
```

- [ ] **Step 4: Atualizar `backend/app/models/__init__.py`**

```python
# Importar todos os models para garantir registro no SQLAlchemy
from app.models.user import User, PerfilUsuario
from app.models.crm import Lead, InteracaoLead, Cliente
from app.models.especificador import (
    TipoCadastro, StatusEspecificador, EstagioCarreira, Especialidade, FitPortfolio,
    PapelPessoaVinculada, TipoEspecificador, FaixaPotencial, Especificador, PessoaVinculada,
    TipoAtributoDinamico, AtributoDinamico, ObservacaoEspecificador, ResponsavelHistorico,
    ChecklistTemplateItem, EspecificadorChecklistItem,
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
    "Lead", "InteracaoLead", "Cliente",
    "TipoCadastro", "StatusEspecificador", "EstagioCarreira", "Especialidade", "FitPortfolio",
    "PapelPessoaVinculada", "TipoEspecificador", "FaixaPotencial", "Especificador",
    "PessoaVinculada", "TipoAtributoDinamico", "AtributoDinamico", "ObservacaoEspecificador",
    "ResponsavelHistorico", "ChecklistTemplateItem", "EspecificadorChecklistItem",
    "Projeto", "HistoricoStatusProjeto", "StatusProjeto",
    "Briefing", "AmbienteBriefing", "TipoAmbiente",
    "FilaProjeto", "ConfigWIPProjetista",
    "ProjetoComercial", "Fechamento", "Parcela", "Handoff",
    "Notificacao", "TipoNotificacao",
]
```

- [ ] **Step 5: Escrever teste que só verifica que os models sobem sem erro**

Create: `backend/tests/models/__init__.py` (vazio) e `backend/tests/models/test_especificador.py`

```python
from app.models.especificador import (
    Especificador, TipoEspecificador, PessoaVinculada, TipoCadastro, StatusEspecificador,
)


def test_cria_especificador_pf_minimo(db):
    tipo = TipoEspecificador(nome="Arquiteto")
    db.add(tipo)
    db.commit()

    especificador = Especificador(
        tipo_cadastro=TipoCadastro.PF,
        tipo_especificador_id=tipo.id,
        nome="Ana Arquiteta",
        telefone="11999990000",
    )
    db.add(especificador)
    db.commit()
    db.refresh(especificador)

    assert especificador.id is not None
    assert especificador.status == StatusEspecificador.PROSPECT
    assert especificador.potencial_anual_bruto is None
    assert especificador.responsavel_atual_id is None


def test_potencial_anual_bruto_calculado_a_partir_do_portfolio(db):
    tipo = TipoEspecificador(nome="Arquiteto")
    db.add(tipo)
    db.commit()

    especificador = Especificador(
        tipo_especificador_id=tipo.id,
        nome="Estúdio Grande",
        telefone="11999990000",
        obras_por_ano=10,
        valor_medio_obra=400_000,
    )
    db.add(especificador)
    db.commit()

    assert especificador.potencial_anual_bruto == 4_000_000
```

- [ ] **Step 6: Rodar os testes**

Run: `cd backend && python -m pytest tests/models/test_especificador.py -v`
Expected: 2 passed

- [ ] **Step 7: Commit**

```bash
git add backend/app/models/especificador.py backend/app/models/crm.py backend/app/models/projeto.py backend/app/models/__init__.py backend/tests/models/
git commit -m "feat: add Especificador models, remove Arquiteto"
```

---

### Task 3: Migration Alembic

**Files:**
- Create: migration gerada em `backend/alembic/versions/` (nome exato definido pelo Alembic)

**Interfaces:**
- Consumes: todos os models da Task 2 (já registrados via `app/models/__init__.py`, que o
  `alembic/env.py` importa para popular `Base.metadata`).
- Produces: tabelas `especificadores`, `tipos_especificador`, `faixas_potencial`,
  `pessoas_vinculadas`, `tipos_atributo_dinamico`, `atributos_dinamicos`,
  `observacoes_especificador`, `responsavel_historico`, `checklist_template_items`,
  `especificador_checklist_items` no banco local; drop de `arquitetos`; rename de
  `leads.arquiteto_id` e `projetos.arquiteto_id` para `especificador_id`.

- [ ] **Step 1: Confirmar que o `.env` local aponta pro Postgres de desenvolvimento**

Run: `cd backend && cat .env | grep DATABASE_URL` (ou `type .env` no PowerShell)
Expected: uma linha `DATABASE_URL=postgresql://...` apontando pro banco local (per
`CLAUDE.md`, deve ser algo como `postgresql://postgres:861401@localhost:5432/plannit`).

- [ ] **Step 2: Gerar a migration**

Run: `cd backend && alembic revision --autogenerate -m "especificadores_cadastro"`
Expected: um novo arquivo em `alembic/versions/`, sem erros de conexão.

- [ ] **Step 3: Revisar o arquivo gerado**

Abrir o arquivo criado no Step 2 e confirmar que o `upgrade()` contém, nesta ordem lógica
(a ordem exata das operações pode variar conforme o autogenerate, mas todas devem estar
presentes):

- `op.create_table('tipos_especificador', ...)`
- `op.create_table('faixas_potencial', ...)`
- `op.create_table('especificadores', ...)` com todas as colunas da Task 2
- `op.create_table('pessoas_vinculadas', ...)`
- `op.create_table('tipos_atributo_dinamico', ...)`
- `op.create_table('atributos_dinamicos', ...)`
- `op.create_table('observacoes_especificador', ...)`
- `op.create_table('responsavel_historico', ...)`
- `op.create_table('checklist_template_items', ...)`
- `op.create_table('especificador_checklist_items', ...)`
- `op.drop_table('arquitetos')`
- Em `leads`: drop da coluna `arquiteto_id` e add da coluna `especificador_id` (com FK para
  `especificadores.id`)
- Em `projetos`: drop da coluna `arquiteto_id` e add da coluna `especificador_id` (com FK
  para `especificadores.id`)

Se o autogenerate detectar as colunas de `leads`/`projetos` como "alter" em vez de
drop+add, tudo bem também — o importante é que ao final `especificador_id` exista e
`arquiteto_id` não exista mais em nenhuma das duas tabelas.

Se alguma tabela ou coluna da lista acima não aparecer, adicionar manualmente ao
`upgrade()`/`downgrade()` antes de prosseguir.

- [ ] **Step 4: Aplicar a migration**

Run: `cd backend && alembic upgrade head`
Expected: saída sem erros, terminando em algo como `Running upgrade ... -> ..., especificadores_cadastro`.

- [ ] **Step 5: Confirmar visualmente que as tabelas existem**

Run: `cd backend && python -c "from app.core.database import engine; from sqlalchemy import inspect; print(sorted(inspect(engine).get_table_names()))"`
Expected: lista incluindo `especificadores`, `tipos_especificador`, `faixas_potencial`,
`pessoas_vinculadas`, `tipos_atributo_dinamico`, `atributos_dinamicos`,
`observacoes_especificador`, `responsavel_historico`, `checklist_template_items`,
`especificador_checklist_items`, e **sem** `arquitetos`.

- [ ] **Step 6: Commit**

```bash
git add backend/alembic/versions/
git commit -m "feat: migration for Especificador tables, drop Arquiteto"
```

---

### Task 4: Serviço de cálculo de Potencial

**Files:**
- Create: `backend/app/services/potencial_service.py`
- Create: `backend/tests/services/__init__.py` (vazio)
- Create: `backend/tests/services/test_potencial_service.py`

**Interfaces:**
- Consumes: `app.models.especificador.FaixaPotencial`
- Produces: `calcular_potencial(db: Session, obras_por_ano: int | None, valor_medio_obra: float | None) -> int | None`
  — usado pela Task 7 (criação/atualização de Especificador).

- [ ] **Step 1: Escrever o teste**

```python
from app.models.especificador import FaixaPotencial
from app.services.potencial_service import calcular_potencial


def _seed_faixas(db):
    db.add_all([
        FaixaPotencial(nota=1, valor_minimo=0),
        FaixaPotencial(nota=2, valor_minimo=300_000),
        FaixaPotencial(nota=3, valor_minimo=700_000),
        FaixaPotencial(nota=4, valor_minimo=1_500_000),
        FaixaPotencial(nota=5, valor_minimo=3_000_000),
    ])
    db.commit()


def test_calcula_potencial_pela_faixa_correta(db):
    _seed_faixas(db)

    assert calcular_potencial(db, obras_por_ano=2, valor_medio_obra=100_000) == 1   # 200k
    assert calcular_potencial(db, obras_por_ano=5, valor_medio_obra=100_000) == 2   # 500k
    assert calcular_potencial(db, obras_por_ano=10, valor_medio_obra=100_000) == 3  # 1M
    assert calcular_potencial(db, obras_por_ano=10, valor_medio_obra=200_000) == 4  # 2M
    assert calcular_potencial(db, obras_por_ano=10, valor_medio_obra=400_000) == 5  # 4M


def test_calcula_potencial_retorna_none_sem_dado_suficiente(db):
    _seed_faixas(db)

    assert calcular_potencial(db, obras_por_ano=None, valor_medio_obra=100_000) is None
    assert calcular_potencial(db, obras_por_ano=5, valor_medio_obra=None) is None


def test_calcula_potencial_retorna_none_sem_faixas_configuradas(db):
    assert calcular_potencial(db, obras_por_ano=10, valor_medio_obra=1_000_000) is None
```

- [ ] **Step 2: Rodar e confirmar que falha (módulo não existe)**

Run: `cd backend && python -m pytest tests/services/test_potencial_service.py -v`
Expected: FAIL com `ModuleNotFoundError: No module named 'app.services.potencial_service'`

- [ ] **Step 3: Implementar**

```python
from typing import Optional
from sqlalchemy.orm import Session
from app.models.especificador import FaixaPotencial


def calcular_potencial(
    db: Session,
    obras_por_ano: Optional[int],
    valor_medio_obra: Optional[float],
) -> Optional[int]:
    """Deriva a nota de Potencial (1-5) a partir do potencial anual bruto
    (obras_por_ano x valor_medio_obra), usando as faixas configuradas pelo Admin.
    Retorna None se faltar dado ou não houver faixa configurada."""
    if not obras_por_ano or not valor_medio_obra:
        return None

    potencial_anual_bruto = obras_por_ano * valor_medio_obra

    faixa = (
        db.query(FaixaPotencial)
        .filter(FaixaPotencial.valor_minimo <= potencial_anual_bruto)
        .order_by(FaixaPotencial.valor_minimo.desc())
        .first()
    )
    return faixa.nota if faixa else None
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `cd backend && python -m pytest tests/services/test_potencial_service.py -v`
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/potencial_service.py backend/tests/services/
git commit -m "feat: add potencial_service to auto-calculate Potencial from portfolio data"
```

---

### Task 5: Schemas Pydantic

**Files:**
- Create: `backend/app/schemas/especificador.py`
- Modify: `backend/app/schemas/crm.py` (remove `ArquitetoCreate`/`ArquitetoResponse`; renomeia
  `arquiteto_id` → `especificador_id` em `LeadCreate`/`LeadUpdate`/`LeadResponse`)

**Interfaces:**
- Produces: `TipoEspecificadorCreate/Response`, `FaixaPotencialCreate/Response`,
  `TipoAtributoDinamicoCreate/Response`, `ChecklistTemplateItemCreate/Response`,
  `EspecificadorCreate/Update/Response/FichaResponse`, `PessoaVinculadaCreate/Response`,
  `AtributoDinamicoCreate/Response`, `ObservacaoCreate/Response`, `ChecklistItemResponse`,
  `TransferirRequest` — todos consumidos pelas Tasks 6, 7, 8, 9, 10, 11, 12.

- [ ] **Step 1: Criar `backend/app/schemas/especificador.py`**

```python
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.especificador import (
    TipoCadastro, StatusEspecificador, EstagioCarreira, Especialidade, FitPortfolio,
    PapelPessoaVinculada,
)


# === CONFIG: TIPO ESPECIFICADOR ===

class TipoEspecificadorCreate(BaseModel):
    nome: str
    ativo: bool = True
    ordem: int = 0


class TipoEspecificadorResponse(BaseModel):
    id: int
    nome: str
    ativo: bool
    ordem: int

    class Config:
        from_attributes = True


# === CONFIG: FAIXA DE POTENCIAL ===

class FaixaPotencialCreate(BaseModel):
    nota: int
    valor_minimo: float


class FaixaPotencialResponse(BaseModel):
    id: int
    nota: int
    valor_minimo: float

    class Config:
        from_attributes = True


# === CONFIG: TIPO DE ATRIBUTO DINÂMICO ===

class TipoAtributoDinamicoCreate(BaseModel):
    nome: str
    ativo: bool = True


class TipoAtributoDinamicoResponse(BaseModel):
    id: int
    nome: str
    ativo: bool

    class Config:
        from_attributes = True


# === CONFIG: CHECKLIST TEMPLATE ITEM ===

class ChecklistTemplateItemCreate(BaseModel):
    tipo_especificador_id: int
    descricao: str
    ordem: int = 0
    ativo: bool = True


class ChecklistTemplateItemResponse(BaseModel):
    id: int
    tipo_especificador_id: int
    descricao: str
    ordem: int
    ativo: bool

    class Config:
        from_attributes = True


# === ESPECIFICADOR ===

class EspecificadorCreate(BaseModel):
    tipo_cadastro: TipoCadastro = TipoCadastro.PF
    tipo_especificador_id: int
    nome: str
    cpf_cnpj: Optional[str] = None
    telefone: str
    email: Optional[EmailStr] = None
    endereco_escritorio: Optional[str] = None
    aniversario_dia: Optional[int] = None
    aniversario_mes: Optional[int] = None
    aniversario_ano: Optional[int] = None
    estagio_carreira: Optional[EstagioCarreira] = None
    especialidade: Optional[Especialidade] = None
    fit_portfolio: Optional[FitPortfolio] = None
    faixa_valor_tipica: Optional[str] = None
    estilo_predominante: Optional[str] = None
    tipos_projeto_frequentes: Optional[str] = None
    obras_por_ano: Optional[int] = None
    valor_medio_obra: Optional[float] = None
    regioes_atuacao: Optional[str] = None
    instagram: Optional[str] = None
    linkedin: Optional[str] = None
    site: Optional[str] = None
    influenciador: bool = False
    observacoes_portfolio: Optional[str] = None
    # Obrigatório quando quem cria é Gestor/Admin; ignorado (forçado ao próprio usuário)
    # quando quem cria é Vendedor.
    vendedor_responsavel_id: Optional[int] = None


class EspecificadorUpdate(BaseModel):
    tipo_cadastro: Optional[TipoCadastro] = None
    tipo_especificador_id: Optional[int] = None
    nome: Optional[str] = None
    cpf_cnpj: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    endereco_escritorio: Optional[str] = None
    aniversario_dia: Optional[int] = None
    aniversario_mes: Optional[int] = None
    aniversario_ano: Optional[int] = None
    estagio_carreira: Optional[EstagioCarreira] = None
    especialidade: Optional[Especialidade] = None
    fit_portfolio: Optional[FitPortfolio] = None
    faixa_valor_tipica: Optional[str] = None
    estilo_predominante: Optional[str] = None
    tipos_projeto_frequentes: Optional[str] = None
    obras_por_ano: Optional[int] = None
    valor_medio_obra: Optional[float] = None
    regioes_atuacao: Optional[str] = None
    instagram: Optional[str] = None
    linkedin: Optional[str] = None
    site: Optional[str] = None
    influenciador: Optional[bool] = None
    observacoes_portfolio: Optional[str] = None


class EspecificadorResponse(BaseModel):
    id: int
    tipo_cadastro: TipoCadastro
    tipo_especificador_id: int
    nome: str
    cpf_cnpj: Optional[str]
    telefone: str
    email: Optional[str]
    endereco_escritorio: Optional[str]
    aniversario_dia: Optional[int]
    aniversario_mes: Optional[int]
    aniversario_ano: Optional[int]
    estagio_carreira: Optional[EstagioCarreira]
    especialidade: Optional[Especialidade]
    fit_portfolio: Optional[FitPortfolio]
    potencial: Optional[int]
    lealdade: Optional[int]
    status: StatusEspecificador
    faixa_valor_tipica: Optional[str]
    estilo_predominante: Optional[str]
    tipos_projeto_frequentes: Optional[str]
    obras_por_ano: Optional[int]
    valor_medio_obra: Optional[float]
    regioes_atuacao: Optional[str]
    instagram: Optional[str]
    linkedin: Optional[str]
    site: Optional[str]
    influenciador: bool
    observacoes_portfolio: Optional[str]
    potencial_anual_bruto: Optional[float]
    responsavel_atual_id: Optional[int]
    criado_em: datetime

    class Config:
        from_attributes = True


# === PESSOA VINCULADA ===

class PessoaVinculadaCreate(BaseModel):
    nome: str
    papel: PapelPessoaVinculada = PapelPessoaVinculada.FUNCIONARIO
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    aniversario_dia: Optional[int] = None
    aniversario_mes: Optional[int] = None
    aniversario_ano: Optional[int] = None
    observacao: Optional[str] = None


class PessoaVinculadaResponse(BaseModel):
    id: int
    especificador_id: int
    nome: str
    papel: PapelPessoaVinculada
    telefone: Optional[str]
    email: Optional[str]
    aniversario_dia: Optional[int]
    aniversario_mes: Optional[int]
    aniversario_ano: Optional[int]
    observacao: Optional[str]

    class Config:
        from_attributes = True


# === ATRIBUTO DINÂMICO ===

class AtributoDinamicoCreate(BaseModel):
    tipo: str
    valor: str


class AtributoDinamicoResponse(BaseModel):
    id: int
    especificador_id: int
    tipo: str
    valor: str

    class Config:
        from_attributes = True


# === OBSERVAÇÃO ===

class ObservacaoCreate(BaseModel):
    texto: str


class ObservacaoResponse(BaseModel):
    id: int
    especificador_id: int
    autor_id: int
    texto: str
    criado_em: datetime

    class Config:
        from_attributes = True


# === CHECKLIST ===

class ChecklistItemResponse(BaseModel):
    id: int
    especificador_id: int
    descricao: str
    ordem: int
    concluido: bool
    concluido_em: Optional[datetime]

    class Config:
        from_attributes = True


# === TRANSFERIR RESPONSÁVEL ===

class TransferirRequest(BaseModel):
    novo_vendedor_id: int


# === FICHA COMPLETA (usada no drawer) ===

class EspecificadorFichaResponse(EspecificadorResponse):
    pessoas_vinculadas: List[PessoaVinculadaResponse] = []
    atributos: List[AtributoDinamicoResponse] = []
    observacoes: List[ObservacaoResponse] = []
    checklist_items: List[ChecklistItemResponse] = []
```

- [ ] **Step 2: Atualizar `backend/app/schemas/crm.py`**

Remover o bloco `# === ARQUITETO ===` inteiro (linhas 103-124 do arquivo atual: classes
`ArquitetoCreate` e `ArquitetoResponse`).

Em `LeadCreate` (linha 18), `LeadUpdate` (linha 29) e `LeadResponse` (linha 47), trocar
`arquiteto_id: Optional[int] = None` (ou sem `= None` em `LeadResponse`) por
`especificador_id: Optional[int] = None` / `especificador_id: Optional[int]` respectivamente.

- [ ] **Step 3: Rodar um import rápido para confirmar que não há erro de sintaxe/referência**

Run: `cd backend && python -c "import app.schemas.especificador; import app.schemas.crm; print('ok')"`
Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add backend/app/schemas/especificador.py backend/app/schemas/crm.py
git commit -m "feat: add Especificador schemas, rename Lead.arquiteto_id references"
```

---

### Task 6: Endpoints de configuração (Admin)

CRUD dos 4 recursos de configuração: tipos, faixas de potencial, tipos de atributo dinâmico e
itens de template de checklist. **Importante:** estas rotas usam paths literais (`/tipos`,
`/faixas-potencial`, etc.) que precisam ser registradas **antes** das rotas dinâmicas
`/{especificador_id}` da Task 7 no mesmo arquivo — caso contrário, FastAPI tentaria
interpretar `"tipos"` como um `especificador_id` inteiro e devolveria 422 em vez de rotear
corretamente. Este arquivo é a primeira metade de `especificadores.py`; a Task 7 adiciona o
restante embaixo.

**Files:**
- Create: `backend/app/api/v1/endpoints/especificadores.py`
- Create: `backend/tests/api/__init__.py` (vazio)
- Create: `backend/tests/api/test_especificadores_config.py`

**Interfaces:**
- Consumes: fixtures `client`, `db`, `admin`, `vendedor` da Task 1; schemas da Task 5.
- Produces: `router` (APIRouter, prefixo `/especificadores`) — a Task 7 continua adicionando
  rotas neste mesmo `router`; a Task 13 registra este `router` em `app/api/v1/__init__.py`.

- [ ] **Step 1: Escrever os testes**

```python
from tests.conftest import auth_headers


def test_admin_cria_tipo_especificador(client, admin):
    resp = client.post(
        "/api/v1/especificadores/tipos",
        json={"nome": "Designer de Interiores", "ordem": 2},
        headers=auth_headers(admin),
    )
    assert resp.status_code == 201
    assert resp.json()["nome"] == "Designer de Interiores"


def test_vendedor_nao_pode_criar_tipo_especificador(client, vendedor):
    resp = client.post(
        "/api/v1/especificadores/tipos",
        json={"nome": "Engenheiro"},
        headers=auth_headers(vendedor),
    )
    assert resp.status_code == 403


def test_vendedor_pode_listar_tipos(client, admin, vendedor):
    client.post(
        "/api/v1/especificadores/tipos", json={"nome": "Arquiteto"}, headers=auth_headers(admin)
    )
    resp = client.get("/api/v1/especificadores/tipos", headers=auth_headers(vendedor))
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_admin_cria_faixa_potencial(client, admin):
    resp = client.post(
        "/api/v1/especificadores/faixas-potencial",
        json={"nota": 5, "valor_minimo": 3_000_000},
        headers=auth_headers(admin),
    )
    assert resp.status_code == 201
    assert resp.json()["nota"] == 5


def test_admin_cria_tipo_atributo_dinamico(client, admin):
    resp = client.post(
        "/api/v1/especificadores/tipos-atributo",
        json={"nome": "Hobbie"},
        headers=auth_headers(admin),
    )
    assert resp.status_code == 201


def test_admin_cria_checklist_template_item(client, admin):
    tipo = client.post(
        "/api/v1/especificadores/tipos", json={"nome": "Arquiteto"}, headers=auth_headers(admin)
    ).json()

    resp = client.post(
        "/api/v1/especificadores/checklist-templates",
        json={"tipo_especificador_id": tipo["id"], "descricao": "Enviar kit de boas-vindas", "ordem": 1},
        headers=auth_headers(admin),
    )
    assert resp.status_code == 201

    listagem = client.get(
        f"/api/v1/especificadores/checklist-templates?tipo_especificador_id={tipo['id']}",
        headers=auth_headers(admin),
    )
    assert len(listagem.json()) == 1
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/api/test_especificadores_config.py -v`
Expected: FAIL com `404` (rota `/api/v1/especificadores/tipos` não existe ainda) ou erro de
import, dependendo de quando o router é registrado — nesta task ele ainda não está
registrado em `api_router` (isso é a Task 13), então ao rodar isoladamente o teste vai
falhar com 404 em todas as chamadas. Isso é esperado neste ponto.

- [ ] **Step 3: Implementar `backend/app/api/v1/endpoints/especificadores.py` (parte 1 de 2 — config)**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, PerfilUsuario
from app.models.especificador import (
    TipoEspecificador, FaixaPotencial, TipoAtributoDinamico, ChecklistTemplateItem,
)
from app.schemas.especificador import (
    TipoEspecificadorCreate, TipoEspecificadorResponse,
    FaixaPotencialCreate, FaixaPotencialResponse,
    TipoAtributoDinamicoCreate, TipoAtributoDinamicoResponse,
    ChecklistTemplateItemCreate, ChecklistTemplateItemResponse,
)

GESTAO = (PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.DIRETORIA)

router = APIRouter(prefix="/especificadores", tags=["Especificadores"])


# === CONFIG: TIPOS DE ESPECIFICADOR ===

@router.get("/tipos", response_model=List[TipoEspecificadorResponse])
def listar_tipos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(TipoEspecificador).order_by(TipoEspecificador.ordem).all()


@router.post("/tipos", response_model=TipoEspecificadorResponse, status_code=201)
def criar_tipo(
    payload: TipoEspecificadorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(PerfilUsuario.DIRETORIA)),
):
    tipo = TipoEspecificador(**payload.model_dump())
    db.add(tipo)
    db.commit()
    db.refresh(tipo)
    return tipo


@router.patch("/tipos/{tipo_id}", response_model=TipoEspecificadorResponse)
def atualizar_tipo(
    tipo_id: int,
    payload: TipoEspecificadorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(PerfilUsuario.DIRETORIA)),
):
    tipo = db.query(TipoEspecificador).filter(TipoEspecificador.id == tipo_id).first()
    if not tipo:
        raise HTTPException(404, "Tipo de especificador não encontrado")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(tipo, field, value)
    db.commit()
    db.refresh(tipo)
    return tipo


# === CONFIG: FAIXAS DE POTENCIAL ===

@router.get("/faixas-potencial", response_model=List[FaixaPotencialResponse])
def listar_faixas_potencial(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(FaixaPotencial).order_by(FaixaPotencial.valor_minimo).all()


@router.post("/faixas-potencial", response_model=FaixaPotencialResponse, status_code=201)
def criar_faixa_potencial(
    payload: FaixaPotencialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(PerfilUsuario.DIRETORIA)),
):
    faixa = FaixaPotencial(**payload.model_dump())
    db.add(faixa)
    db.commit()
    db.refresh(faixa)
    return faixa


@router.patch("/faixas-potencial/{faixa_id}", response_model=FaixaPotencialResponse)
def atualizar_faixa_potencial(
    faixa_id: int,
    payload: FaixaPotencialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(PerfilUsuario.DIRETORIA)),
):
    faixa = db.query(FaixaPotencial).filter(FaixaPotencial.id == faixa_id).first()
    if not faixa:
        raise HTTPException(404, "Faixa de potencial não encontrada")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(faixa, field, value)
    db.commit()
    db.refresh(faixa)
    return faixa


# === CONFIG: TIPOS DE ATRIBUTO DINÂMICO ===

@router.get("/tipos-atributo", response_model=List[TipoAtributoDinamicoResponse])
def listar_tipos_atributo(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(TipoAtributoDinamico).order_by(TipoAtributoDinamico.nome).all()


@router.post("/tipos-atributo", response_model=TipoAtributoDinamicoResponse, status_code=201)
def criar_tipo_atributo(
    payload: TipoAtributoDinamicoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(PerfilUsuario.DIRETORIA)),
):
    tipo = TipoAtributoDinamico(**payload.model_dump())
    db.add(tipo)
    db.commit()
    db.refresh(tipo)
    return tipo


# === CONFIG: CHECKLIST TEMPLATE ITEMS ===

@router.get("/checklist-templates", response_model=List[ChecklistTemplateItemResponse])
def listar_checklist_templates(
    tipo_especificador_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ChecklistTemplateItem)
    if tipo_especificador_id:
        query = query.filter(ChecklistTemplateItem.tipo_especificador_id == tipo_especificador_id)
    return query.order_by(ChecklistTemplateItem.ordem).all()


@router.post("/checklist-templates", response_model=ChecklistTemplateItemResponse, status_code=201)
def criar_checklist_template_item(
    payload: ChecklistTemplateItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(PerfilUsuario.DIRETORIA)),
):
    item = ChecklistTemplateItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/checklist-templates/{item_id}", response_model=ChecklistTemplateItemResponse)
def atualizar_checklist_template_item(
    item_id: int,
    payload: ChecklistTemplateItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(PerfilUsuario.DIRETORIA)),
):
    item = db.query(ChecklistTemplateItem).filter(ChecklistTemplateItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Item de template não encontrado")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/checklist-templates/{item_id}", status_code=204)
def remover_checklist_template_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(PerfilUsuario.DIRETORIA)),
):
    item = db.query(ChecklistTemplateItem).filter(ChecklistTemplateItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Item de template não encontrado")
    db.delete(item)
    db.commit()
```

- [ ] **Step 4: Registrar temporariamente o router para os testes passarem**

Esta task ainda não é o registro definitivo (isso é a Task 13, que também remove
`arquitetos.py`), mas os testes desta task precisam do router acessível. Adicionar, só por
enquanto, ao final de `backend/app/api/v1/__init__.py`:

```python
from app.api.v1.endpoints import especificadores
api_router.include_router(especificadores.router)
```

(A Task 13 vai reorganizar este arquivo por completo — não se preocupe em deixá-lo bonito
agora.)

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `cd backend && python -m pytest tests/api/test_especificadores_config.py -v`
Expected: 6 passed

- [ ] **Step 6: Commit**

```bash
git add backend/app/api/v1/endpoints/especificadores.py backend/app/api/v1/__init__.py backend/tests/api/
git commit -m "feat: add config CRUD endpoints for Especificador module (tipos, faixas, atributos, checklist templates)"
```

---

### Task 7: Endpoints principais de Especificador (list/create/get/patch/delete)

Adiciona ao **mesmo arquivo** `especificadores.py` da Task 6 (abaixo das rotas de config, pela
razão de ordering explicada na Task 6).

**Files:**
- Modify: `backend/app/api/v1/endpoints/especificadores.py`
- Create: `backend/tests/api/test_especificadores.py`

**Interfaces:**
- Consumes: `router` da Task 6; `calcular_potencial` da Task 4; schemas da Task 5.
- Produces: helpers `_get_especificador_or_404(db, especificador_id) -> Especificador`,
  `_responsavel_atual(db, especificador_id) -> ResponsavelHistorico | None`,
  `_is_dono(db, especificador_id, user) -> bool`, `_checar_acesso(db, especificador_id, user)`
  — usados pelas Tasks 8, 9, 10, 11, 12.

- [ ] **Step 1: Escrever os testes**

```python
from tests.conftest import auth_headers
from app.models.especificador import FaixaPotencial, ChecklistTemplateItem, TipoEspecificador


def _criar_tipo(client, admin, nome="Arquiteto"):
    return client.post(
        "/api/v1/especificadores/tipos", json={"nome": nome}, headers=auth_headers(admin)
    ).json()


def test_vendedor_cria_especificador_e_vira_responsavel(client, admin, vendedor):
    tipo = _criar_tipo(client, admin)

    resp = client.post(
        "/api/v1/especificadores/",
        json={"tipo_especificador_id": tipo["id"], "nome": "Estúdio Bonatto", "telefone": "11999990000"},
        headers=auth_headers(vendedor),
    )

    assert resp.status_code == 201
    data = resp.json()
    assert data["nome"] == "Estúdio Bonatto"
    assert data["status"] == "prospect"
    assert data["responsavel_atual_id"] == vendedor.id
    assert data["potencial"] is None
    assert data["lealdade"] is None


def test_gestor_deve_informar_vendedor_responsavel_ao_criar(client, admin, gestor):
    tipo = _criar_tipo(client, admin)

    resp = client.post(
        "/api/v1/especificadores/",
        json={"tipo_especificador_id": tipo["id"], "nome": "Sem Dono", "telefone": "1"},
        headers=auth_headers(gestor),
    )

    assert resp.status_code == 400


def test_gestor_cria_especificador_atribuindo_vendedor(client, admin, gestor, vendedor):
    tipo = _criar_tipo(client, admin)

    resp = client.post(
        "/api/v1/especificadores/",
        json={
            "tipo_especificador_id": tipo["id"], "nome": "Com Dono", "telefone": "1",
            "vendedor_responsavel_id": vendedor.id,
        },
        headers=auth_headers(gestor),
    )

    assert resp.status_code == 201
    assert resp.json()["responsavel_atual_id"] == vendedor.id


def test_criar_com_tipo_invalido_retorna_400(client, vendedor):
    resp = client.post(
        "/api/v1/especificadores/",
        json={"tipo_especificador_id": 999, "nome": "Inválido", "telefone": "1"},
        headers=auth_headers(vendedor),
    )
    assert resp.status_code == 400


def test_vendedor_so_ve_especificadores_da_propria_carteira(client, admin, vendedor, outro_vendedor):
    tipo = _criar_tipo(client, admin)
    client.post(
        "/api/v1/especificadores/",
        json={"tipo_especificador_id": tipo["id"], "nome": "Meu", "telefone": "1"},
        headers=auth_headers(vendedor),
    )
    client.post(
        "/api/v1/especificadores/",
        json={"tipo_especificador_id": tipo["id"], "nome": "Do Outro", "telefone": "2"},
        headers=auth_headers(outro_vendedor),
    )

    resp = client.get("/api/v1/especificadores/", headers=auth_headers(vendedor))
    assert [e["nome"] for e in resp.json()] == ["Meu"]


def test_gestor_ve_todos_especificadores(client, admin, vendedor, outro_vendedor, gestor):
    tipo = _criar_tipo(client, admin)
    client.post(
        "/api/v1/especificadores/",
        json={"tipo_especificador_id": tipo["id"], "nome": "Meu", "telefone": "1"},
        headers=auth_headers(vendedor),
    )
    client.post(
        "/api/v1/especificadores/",
        json={"tipo_especificador_id": tipo["id"], "nome": "Do Outro", "telefone": "2"},
        headers=auth_headers(outro_vendedor),
    )

    resp = client.get("/api/v1/especificadores/", headers=auth_headers(gestor))
    assert len(resp.json()) == 2


def test_vendedor_nao_acessa_especificador_de_outro(client, admin, vendedor, outro_vendedor):
    tipo = _criar_tipo(client, admin)
    criado = client.post(
        "/api/v1/especificadores/",
        json={"tipo_especificador_id": tipo["id"], "nome": "Do Outro", "telefone": "2"},
        headers=auth_headers(outro_vendedor),
    ).json()

    resp = client.get(f"/api/v1/especificadores/{criado['id']}", headers=auth_headers(vendedor))
    assert resp.status_code == 403


def test_potencial_calculado_automaticamente_na_criacao(client, db, admin, vendedor):
    tipo = _criar_tipo(client, admin)
    db.add_all([
        FaixaPotencial(nota=1, valor_minimo=0),
        FaixaPotencial(nota=5, valor_minimo=3_000_000),
    ])
    db.commit()

    resp = client.post(
        "/api/v1/especificadores/",
        json={
            "tipo_especificador_id": tipo["id"], "nome": "Estúdio Grande", "telefone": "1",
            "obras_por_ano": 10, "valor_medio_obra": 400_000,
        },
        headers=auth_headers(vendedor),
    )

    assert resp.json()["potencial"] == 5
    assert resp.json()["potencial_anual_bruto"] == 4_000_000


def test_potencial_recalculado_ao_atualizar_portfolio(client, db, admin, vendedor):
    tipo = _criar_tipo(client, admin)
    db.add_all([
        FaixaPotencial(nota=1, valor_minimo=0),
        FaixaPotencial(nota=5, valor_minimo=3_000_000),
    ])
    db.commit()

    criado = client.post(
        "/api/v1/especificadores/",
        json={"tipo_especificador_id": tipo["id"], "nome": "Estúdio", "telefone": "1"},
        headers=auth_headers(vendedor),
    ).json()
    assert criado["potencial"] is None

    atualizado = client.patch(
        f"/api/v1/especificadores/{criado['id']}",
        json={"obras_por_ano": 10, "valor_medio_obra": 400_000},
        headers=auth_headers(vendedor),
    )
    assert atualizado.json()["potencial"] == 5


def test_checklist_criado_automaticamente_a_partir_do_template(client, db, admin, vendedor):
    tipo = _criar_tipo(client, admin)
    db.add_all([
        ChecklistTemplateItem(tipo_especificador_id=tipo["id"], descricao="Enviar kit", ordem=1, ativo=True),
        ChecklistTemplateItem(tipo_especificador_id=tipo["id"], descricao="Agendar visita", ordem=2, ativo=True),
    ])
    db.commit()

    criado = client.post(
        "/api/v1/especificadores/",
        json={"tipo_especificador_id": tipo["id"], "nome": "Novo", "telefone": "1"},
        headers=auth_headers(vendedor),
    ).json()

    ficha = client.get(f"/api/v1/especificadores/{criado['id']}", headers=auth_headers(vendedor)).json()
    assert [i["descricao"] for i in ficha["checklist_items"]] == ["Enviar kit", "Agendar visita"]
    assert all(not i["concluido"] for i in ficha["checklist_items"])


def test_desativar_requer_gestor_ou_admin(client, admin, vendedor):
    tipo = _criar_tipo(client, admin)
    criado = client.post(
        "/api/v1/especificadores/",
        json={"tipo_especificador_id": tipo["id"], "nome": "Novo", "telefone": "1"},
        headers=auth_headers(vendedor),
    ).json()

    resp = client.delete(f"/api/v1/especificadores/{criado['id']}", headers=auth_headers(vendedor))
    assert resp.status_code == 403


def test_admin_desativa_especificador(client, admin, vendedor):
    tipo = _criar_tipo(client, admin)
    criado = client.post(
        "/api/v1/especificadores/",
        json={"tipo_especificador_id": tipo["id"], "nome": "Novo", "telefone": "1"},
        headers=auth_headers(vendedor),
    ).json()

    resp = client.delete(f"/api/v1/especificadores/{criado['id']}", headers=auth_headers(admin))
    assert resp.status_code == 204

    ficha = client.get(f"/api/v1/especificadores/{criado['id']}", headers=auth_headers(admin)).json()
    assert ficha["status"] == "inativo"
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/api/test_especificadores.py -v`
Expected: FAIL — rotas `POST /api/v1/especificadores/` e `GET /api/v1/especificadores/{id}`
ainda não existem (404 em todos os testes).

- [ ] **Step 3: Adicionar ao final de `especificadores.py` (depois do bloco de config da Task 6)**

```python
from datetime import date
from app.models.especificador import (
    Especificador, ResponsavelHistorico, EspecificadorChecklistItem, StatusEspecificador,
)
from app.schemas.especificador import EspecificadorCreate, EspecificadorUpdate, EspecificadorResponse, EspecificadorFichaResponse
from app.services.potencial_service import calcular_potencial


def _get_especificador_or_404(db: Session, especificador_id: int) -> Especificador:
    especificador = db.query(Especificador).filter(Especificador.id == especificador_id).first()
    if not especificador:
        raise HTTPException(404, "Especificador não encontrado")
    return especificador


def _responsavel_atual(db: Session, especificador_id: int):
    return (
        db.query(ResponsavelHistorico)
        .filter(
            ResponsavelHistorico.especificador_id == especificador_id,
            ResponsavelHistorico.data_fim.is_(None),
        )
        .first()
    )


def _is_dono(db: Session, especificador_id: int, user: User) -> bool:
    resp = _responsavel_atual(db, especificador_id)
    return resp is not None and resp.vendedor_id == user.id


def _checar_acesso(db: Session, especificador_id: int, user: User):
    if user.perfil in GESTAO:
        return
    if not _is_dono(db, especificador_id, user):
        raise HTTPException(403, "Você só pode acessar especificadores da sua própria carteira")


@router.get("/", response_model=List[EspecificadorResponse])
def listar_especificadores(
    tipo_especificador_id: Optional[int] = None,
    status: Optional[str] = None,
    responsavel_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Especificador)
    if tipo_especificador_id:
        query = query.filter(Especificador.tipo_especificador_id == tipo_especificador_id)
    if status:
        query = query.filter(Especificador.status == status)

    if current_user.perfil in GESTAO:
        if responsavel_id:
            query = (
                query.join(
                    ResponsavelHistorico,
                    ResponsavelHistorico.especificador_id == Especificador.id,
                )
                .filter(
                    ResponsavelHistorico.vendedor_id == responsavel_id,
                    ResponsavelHistorico.data_fim.is_(None),
                )
            )
    else:
        query = (
            query.join(
                ResponsavelHistorico,
                ResponsavelHistorico.especificador_id == Especificador.id,
            )
            .filter(
                ResponsavelHistorico.vendedor_id == current_user.id,
                ResponsavelHistorico.data_fim.is_(None),
            )
        )

    return query.order_by(Especificador.nome).offset(skip).limit(limit).all()


@router.post("/", response_model=EspecificadorResponse, status_code=201)
def criar_especificador(
    payload: EspecificadorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        PerfilUsuario.VENDEDOR, PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.DIRETORIA
    )),
):
    tipo = db.query(TipoEspecificador).filter(TipoEspecificador.id == payload.tipo_especificador_id).first()
    if not tipo:
        raise HTTPException(400, "Tipo de especificador inválido")

    if payload.email:
        existente = db.query(Especificador).filter(Especificador.email == payload.email).first()
        if existente:
            raise HTTPException(400, "E-mail já cadastrado para outro especificador")

    if current_user.perfil == PerfilUsuario.VENDEDOR:
        vendedor_id = current_user.id
    else:
        if not payload.vendedor_responsavel_id:
            raise HTTPException(400, "vendedor_responsavel_id é obrigatório para Gestor/Admin")
        vendedor_id = payload.vendedor_responsavel_id

    dados = payload.model_dump(exclude={"vendedor_responsavel_id"})
    potencial = calcular_potencial(db, dados.get("obras_por_ano"), dados.get("valor_medio_obra"))

    especificador = Especificador(**dados, potencial=potencial)
    db.add(especificador)
    db.flush()

    db.add(ResponsavelHistorico(
        especificador_id=especificador.id,
        vendedor_id=vendedor_id,
        data_inicio=date.today(),
    ))

    templates = (
        db.query(ChecklistTemplateItem)
        .filter(
            ChecklistTemplateItem.tipo_especificador_id == especificador.tipo_especificador_id,
            ChecklistTemplateItem.ativo == True,  # noqa: E712
        )
        .order_by(ChecklistTemplateItem.ordem)
        .all()
    )
    for item in templates:
        db.add(EspecificadorChecklistItem(
            especificador_id=especificador.id,
            descricao=item.descricao,
            ordem=item.ordem,
        ))

    db.commit()
    db.refresh(especificador)
    return especificador


@router.get("/{especificador_id}", response_model=EspecificadorFichaResponse)
def obter_especificador(
    especificador_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    especificador = _get_especificador_or_404(db, especificador_id)
    _checar_acesso(db, especificador_id, current_user)
    return especificador


@router.patch("/{especificador_id}", response_model=EspecificadorResponse)
def atualizar_especificador(
    especificador_id: int,
    payload: EspecificadorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    especificador = _get_especificador_or_404(db, especificador_id)
    _checar_acesso(db, especificador_id, current_user)

    dados = payload.model_dump(exclude_unset=True)
    for field, value in dados.items():
        setattr(especificador, field, value)

    if "obras_por_ano" in dados or "valor_medio_obra" in dados:
        especificador.potencial = calcular_potencial(
            db, especificador.obras_por_ano, especificador.valor_medio_obra
        )

    db.commit()
    db.refresh(especificador)
    return especificador


@router.delete("/{especificador_id}", status_code=204)
def desativar_especificador(
    especificador_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.DIRETORIA)),
):
    especificador = _get_especificador_or_404(db, especificador_id)
    especificador.status = StatusEspecificador.INATIVO
    db.commit()
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `cd backend && python -m pytest tests/api/test_especificadores.py -v`
Expected: 12 passed

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/v1/endpoints/especificadores.py backend/tests/api/test_especificadores.py
git commit -m "feat: add core Especificador CRUD endpoints with ownership-based permissions"
```

---

### Task 8: Pessoas vinculadas

**Files:**
- Modify: `backend/app/api/v1/endpoints/especificadores.py`
- Create: `backend/tests/api/test_pessoas_vinculadas.py`

**Interfaces:**
- Consumes: `_get_especificador_or_404`, `_checar_acesso` da Task 7.

- [ ] **Step 1: Escrever os testes**

```python
from tests.conftest import auth_headers


def _criar_especificador(client, admin, vendedor):
    tipo = client.post(
        "/api/v1/especificadores/tipos", json={"nome": "Arquiteto"}, headers=auth_headers(admin)
    ).json()
    return client.post(
        "/api/v1/especificadores/",
        json={"tipo_especificador_id": tipo["id"], "nome": "Estúdio PJ", "telefone": "1"},
        headers=auth_headers(vendedor),
    ).json()


def test_adiciona_pessoa_vinculada(client, admin, vendedor):
    especificador = _criar_especificador(client, admin, vendedor)

    resp = client.post(
        f"/api/v1/especificadores/{especificador['id']}/pessoas",
        json={"nome": "João Sócio", "papel": "responsavel"},
        headers=auth_headers(vendedor),
    )

    assert resp.status_code == 201
    assert resp.json()["nome"] == "João Sócio"


def test_outro_vendedor_nao_adiciona_pessoa(client, admin, vendedor, outro_vendedor):
    especificador = _criar_especificador(client, admin, vendedor)

    resp = client.post(
        f"/api/v1/especificadores/{especificador['id']}/pessoas",
        json={"nome": "Intruso"},
        headers=auth_headers(outro_vendedor),
    )
    assert resp.status_code == 403


def test_remove_pessoa_vinculada(client, admin, vendedor):
    especificador = _criar_especificador(client, admin, vendedor)
    pessoa = client.post(
        f"/api/v1/especificadores/{especificador['id']}/pessoas",
        json={"nome": "João Sócio"},
        headers=auth_headers(vendedor),
    ).json()

    resp = client.delete(
        f"/api/v1/especificadores/{especificador['id']}/pessoas/{pessoa['id']}",
        headers=auth_headers(vendedor),
    )
    assert resp.status_code == 204
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/api/test_pessoas_vinculadas.py -v`
Expected: FAIL com 404 (rotas ainda não existem)

- [ ] **Step 3: Adicionar ao final de `especificadores.py`**

```python
from app.models.especificador import PessoaVinculada
from app.schemas.especificador import PessoaVinculadaCreate, PessoaVinculadaResponse


@router.post("/{especificador_id}/pessoas", response_model=PessoaVinculadaResponse, status_code=201)
def adicionar_pessoa_vinculada(
    especificador_id: int,
    payload: PessoaVinculadaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_especificador_or_404(db, especificador_id)
    _checar_acesso(db, especificador_id, current_user)

    pessoa = PessoaVinculada(especificador_id=especificador_id, **payload.model_dump())
    db.add(pessoa)
    db.commit()
    db.refresh(pessoa)
    return pessoa


@router.patch("/{especificador_id}/pessoas/{pessoa_id}", response_model=PessoaVinculadaResponse)
def atualizar_pessoa_vinculada(
    especificador_id: int,
    pessoa_id: int,
    payload: PessoaVinculadaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_especificador_or_404(db, especificador_id)
    _checar_acesso(db, especificador_id, current_user)

    pessoa = db.query(PessoaVinculada).filter(
        PessoaVinculada.id == pessoa_id, PessoaVinculada.especificador_id == especificador_id
    ).first()
    if not pessoa:
        raise HTTPException(404, "Pessoa vinculada não encontrada")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(pessoa, field, value)
    db.commit()
    db.refresh(pessoa)
    return pessoa


@router.delete("/{especificador_id}/pessoas/{pessoa_id}", status_code=204)
def remover_pessoa_vinculada(
    especificador_id: int,
    pessoa_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_especificador_or_404(db, especificador_id)
    _checar_acesso(db, especificador_id, current_user)

    pessoa = db.query(PessoaVinculada).filter(
        PessoaVinculada.id == pessoa_id, PessoaVinculada.especificador_id == especificador_id
    ).first()
    if not pessoa:
        raise HTTPException(404, "Pessoa vinculada não encontrada")
    db.delete(pessoa)
    db.commit()
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `cd backend && python -m pytest tests/api/test_pessoas_vinculadas.py -v`
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/v1/endpoints/especificadores.py backend/tests/api/test_pessoas_vinculadas.py
git commit -m "feat: add linked-people endpoints for Especificador (PJ)"
```

---

### Task 9: Atributos dinâmicos

**Files:**
- Modify: `backend/app/api/v1/endpoints/especificadores.py`
- Create: `backend/tests/api/test_atributos_dinamicos.py`

- [ ] **Step 1: Escrever os testes**

```python
from tests.conftest import auth_headers


def _criar_especificador(client, admin, vendedor):
    tipo = client.post(
        "/api/v1/especificadores/tipos", json={"nome": "Arquiteto"}, headers=auth_headers(admin)
    ).json()
    return client.post(
        "/api/v1/especificadores/",
        json={"tipo_especificador_id": tipo["id"], "nome": "Estúdio", "telefone": "1"},
        headers=auth_headers(vendedor),
    ).json()


def test_adiciona_atributo_dinamico(client, admin, vendedor):
    especificador = _criar_especificador(client, admin, vendedor)

    resp = client.post(
        f"/api/v1/especificadores/{especificador['id']}/atributos",
        json={"tipo": "Hobbie", "valor": "Golfe"},
        headers=auth_headers(vendedor),
    )
    assert resp.status_code == 201
    assert resp.json()["valor"] == "Golfe"


def test_remove_atributo_dinamico(client, admin, vendedor):
    especificador = _criar_especificador(client, admin, vendedor)
    atributo = client.post(
        f"/api/v1/especificadores/{especificador['id']}/atributos",
        json={"tipo": "Hobbie", "valor": "Golfe"},
        headers=auth_headers(vendedor),
    ).json()

    resp = client.delete(
        f"/api/v1/especificadores/{especificador['id']}/atributos/{atributo['id']}",
        headers=auth_headers(vendedor),
    )
    assert resp.status_code == 204
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/api/test_atributos_dinamicos.py -v`
Expected: FAIL com 404

- [ ] **Step 3: Adicionar ao final de `especificadores.py`**

```python
from app.models.especificador import AtributoDinamico
from app.schemas.especificador import AtributoDinamicoCreate, AtributoDinamicoResponse


@router.post("/{especificador_id}/atributos", response_model=AtributoDinamicoResponse, status_code=201)
def adicionar_atributo(
    especificador_id: int,
    payload: AtributoDinamicoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_especificador_or_404(db, especificador_id)
    _checar_acesso(db, especificador_id, current_user)

    atributo = AtributoDinamico(especificador_id=especificador_id, **payload.model_dump())
    db.add(atributo)
    db.commit()
    db.refresh(atributo)
    return atributo


@router.delete("/{especificador_id}/atributos/{atributo_id}", status_code=204)
def remover_atributo(
    especificador_id: int,
    atributo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_especificador_or_404(db, especificador_id)
    _checar_acesso(db, especificador_id, current_user)

    atributo = db.query(AtributoDinamico).filter(
        AtributoDinamico.id == atributo_id, AtributoDinamico.especificador_id == especificador_id
    ).first()
    if not atributo:
        raise HTTPException(404, "Atributo não encontrado")
    db.delete(atributo)
    db.commit()
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `cd backend && python -m pytest tests/api/test_atributos_dinamicos.py -v`
Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/v1/endpoints/especificadores.py backend/tests/api/test_atributos_dinamicos.py
git commit -m "feat: add dynamic attribute endpoints for Especificador"
```

---

### Task 10: Observações cronológicas

**Files:**
- Modify: `backend/app/api/v1/endpoints/especificadores.py`
- Create: `backend/tests/api/test_observacoes.py`

- [ ] **Step 1: Escrever os testes**

```python
from tests.conftest import auth_headers


def _criar_especificador(client, admin, vendedor):
    tipo = client.post(
        "/api/v1/especificadores/tipos", json={"nome": "Arquiteto"}, headers=auth_headers(admin)
    ).json()
    return client.post(
        "/api/v1/especificadores/",
        json={"tipo_especificador_id": tipo["id"], "nome": "Estúdio", "telefone": "1"},
        headers=auth_headers(vendedor),
    ).json()


def test_adiciona_observacao(client, admin, vendedor):
    especificador = _criar_especificador(client, admin, vendedor)

    resp = client.post(
        f"/api/v1/especificadores/{especificador['id']}/observacoes",
        json={"texto": "Cliente gostou muito da última visita"},
        headers=auth_headers(vendedor),
    )
    assert resp.status_code == 201
    assert resp.json()["autor_id"] == vendedor.id


def test_observacoes_aparecem_na_ficha_mais_recente_primeiro(client, admin, vendedor):
    especificador = _criar_especificador(client, admin, vendedor)
    client.post(
        f"/api/v1/especificadores/{especificador['id']}/observacoes",
        json={"texto": "Primeira"}, headers=auth_headers(vendedor),
    )
    client.post(
        f"/api/v1/especificadores/{especificador['id']}/observacoes",
        json={"texto": "Segunda"}, headers=auth_headers(vendedor),
    )

    ficha = client.get(f"/api/v1/especificadores/{especificador['id']}", headers=auth_headers(vendedor)).json()
    assert [o["texto"] for o in ficha["observacoes"]] == ["Segunda", "Primeira"]
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/api/test_observacoes.py -v`
Expected: FAIL com 404

- [ ] **Step 3: Adicionar ao final de `especificadores.py`**

```python
from app.models.especificador import ObservacaoEspecificador
from app.schemas.especificador import ObservacaoCreate, ObservacaoResponse


@router.post("/{especificador_id}/observacoes", response_model=ObservacaoResponse, status_code=201)
def adicionar_observacao(
    especificador_id: int,
    payload: ObservacaoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_especificador_or_404(db, especificador_id)
    _checar_acesso(db, especificador_id, current_user)

    observacao = ObservacaoEspecificador(
        especificador_id=especificador_id,
        autor_id=current_user.id,
        texto=payload.texto,
    )
    db.add(observacao)
    db.commit()
    db.refresh(observacao)
    return observacao
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `cd backend && python -m pytest tests/api/test_observacoes.py -v`
Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/v1/endpoints/especificadores.py backend/tests/api/test_observacoes.py
git commit -m "feat: add append-only observation log for Especificador"
```

---

### Task 11: Concluir item de checklist

**Files:**
- Modify: `backend/app/api/v1/endpoints/especificadores.py`
- Create: `backend/tests/api/test_checklist.py`

- [ ] **Step 1: Escrever os testes**

```python
from tests.conftest import auth_headers
from app.models.especificador import ChecklistTemplateItem


def test_conclui_item_de_checklist(client, admin, db, vendedor):
    tipo = client.post(
        "/api/v1/especificadores/tipos", json={"nome": "Arquiteto"}, headers=auth_headers(admin)
    ).json()
    db.add(ChecklistTemplateItem(tipo_especificador_id=tipo["id"], descricao="Enviar kit", ordem=1))
    db.commit()

    especificador = client.post(
        "/api/v1/especificadores/",
        json={"tipo_especificador_id": tipo["id"], "nome": "Estúdio", "telefone": "1"},
        headers=auth_headers(vendedor),
    ).json()
    ficha = client.get(f"/api/v1/especificadores/{especificador['id']}", headers=auth_headers(vendedor)).json()
    item_id = ficha["checklist_items"][0]["id"]

    resp = client.post(
        f"/api/v1/especificadores/{especificador['id']}/checklist/{item_id}/concluir",
        headers=auth_headers(vendedor),
    )
    assert resp.status_code == 200
    assert resp.json()["concluido"] is True
    assert resp.json()["concluido_em"] is not None
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/api/test_checklist.py -v`
Expected: FAIL com 404

- [ ] **Step 3: Adicionar ao final de `especificadores.py`**

```python
from datetime import datetime
from app.schemas.especificador import ChecklistItemResponse


@router.post("/{especificador_id}/checklist/{item_id}/concluir", response_model=ChecklistItemResponse)
def concluir_item_checklist(
    especificador_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_especificador_or_404(db, especificador_id)
    _checar_acesso(db, especificador_id, current_user)

    item = db.query(EspecificadorChecklistItem).filter(
        EspecificadorChecklistItem.id == item_id,
        EspecificadorChecklistItem.especificador_id == especificador_id,
    ).first()
    if not item:
        raise HTTPException(404, "Item de checklist não encontrado")

    item.concluido = True
    item.concluido_em = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return item
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `cd backend && python -m pytest tests/api/test_checklist.py -v`
Expected: 1 passed

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/v1/endpoints/especificadores.py backend/tests/api/test_checklist.py
git commit -m "feat: add checklist item completion endpoint"
```

---

### Task 12: Transferir responsável (RN008)

**Files:**
- Modify: `backend/app/api/v1/endpoints/especificadores.py`
- Create: `backend/tests/api/test_transferir.py`

- [ ] **Step 1: Escrever os testes**

```python
from tests.conftest import auth_headers


def test_gestor_transfere_responsavel(client, admin, gestor, vendedor, outro_vendedor):
    tipo = client.post(
        "/api/v1/especificadores/tipos", json={"nome": "Arquiteto"}, headers=auth_headers(admin)
    ).json()
    especificador = client.post(
        "/api/v1/especificadores/",
        json={"tipo_especificador_id": tipo["id"], "nome": "Estúdio", "telefone": "1"},
        headers=auth_headers(vendedor),
    ).json()

    resp = client.post(
        f"/api/v1/especificadores/{especificador['id']}/transferir",
        json={"novo_vendedor_id": outro_vendedor.id},
        headers=auth_headers(gestor),
    )

    assert resp.status_code == 200
    assert resp.json()["responsavel_atual_id"] == outro_vendedor.id


def test_vendedor_nao_pode_transferir(client, admin, vendedor, outro_vendedor):
    tipo = client.post(
        "/api/v1/especificadores/tipos", json={"nome": "Arquiteto"}, headers=auth_headers(admin)
    ).json()
    especificador = client.post(
        "/api/v1/especificadores/",
        json={"tipo_especificador_id": tipo["id"], "nome": "Estúdio", "telefone": "1"},
        headers=auth_headers(vendedor),
    ).json()

    resp = client.post(
        f"/api/v1/especificadores/{especificador['id']}/transferir",
        json={"novo_vendedor_id": outro_vendedor.id},
        headers=auth_headers(vendedor),
    )
    assert resp.status_code == 403


def test_transferir_para_usuario_que_nao_e_vendedor_retorna_400(client, admin, vendedor):
    tipo = client.post(
        "/api/v1/especificadores/tipos", json={"nome": "Arquiteto"}, headers=auth_headers(admin)
    ).json()
    especificador = client.post(
        "/api/v1/especificadores/",
        json={"tipo_especificador_id": tipo["id"], "nome": "Estúdio", "telefone": "1"},
        headers=auth_headers(vendedor),
    ).json()

    resp = client.post(
        f"/api/v1/especificadores/{especificador['id']}/transferir",
        json={"novo_vendedor_id": admin.id},
        headers=auth_headers(admin),
    )
    assert resp.status_code == 400
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/api/test_transferir.py -v`
Expected: FAIL com 404

- [ ] **Step 3: Adicionar ao final de `especificadores.py`**

```python
from app.schemas.especificador import TransferirRequest


@router.post("/{especificador_id}/transferir", response_model=EspecificadorResponse)
def transferir_responsavel(
    especificador_id: int,
    payload: TransferirRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.DIRETORIA)),
):
    especificador = _get_especificador_or_404(db, especificador_id)

    novo_vendedor = db.query(User).filter(
        User.id == payload.novo_vendedor_id, User.perfil == PerfilUsuario.VENDEDOR
    ).first()
    if not novo_vendedor:
        raise HTTPException(400, "Novo vendedor responsável inválido")

    atual = _responsavel_atual(db, especificador_id)
    if atual:
        atual.data_fim = date.today()

    db.add(ResponsavelHistorico(
        especificador_id=especificador_id,
        vendedor_id=novo_vendedor.id,
        data_inicio=date.today(),
    ))
    db.commit()
    db.refresh(especificador)
    return especificador
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `cd backend && python -m pytest tests/api/test_transferir.py -v`
Expected: 3 passed

- [ ] **Step 5: Rodar a suíte inteira do backend**

Run: `cd backend && python -m pytest tests/ -v`
Expected: todos os testes das Tasks 1-12 passando.

- [ ] **Step 6: Commit**

```bash
git add backend/app/api/v1/endpoints/especificadores.py backend/tests/api/test_transferir.py
git commit -m "feat: add transfer-ownership endpoint with vigencia history (RN008)"
```

---

### Task 13: Registrar router definitivo, remover `arquitetos.py`, corrigir `projetos.py`

**Files:**
- Delete: `backend/app/api/v1/endpoints/arquitetos.py`
- Modify: `backend/app/api/v1/__init__.py`
- Modify: `backend/app/api/v1/endpoints/projetos.py` (renomeia `arquiteto_id` →
  `especificador_id` nas duas classes locais `ProjetoCreate`/`ProjetoUpdate`)

- [ ] **Step 1: Deletar o arquivo antigo**

Run: `cd backend && rm app/api/v1/endpoints/arquitetos.py`

- [ ] **Step 2: Reescrever `backend/app/api/v1/__init__.py`**

```python
from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, leads, briefings, dashboard, users, clientes, especificadores, projetos,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(leads.router)
api_router.include_router(briefings.router)
api_router.include_router(dashboard.router)
api_router.include_router(clientes.router)
api_router.include_router(especificadores.router)
api_router.include_router(projetos.router)
```

- [ ] **Step 3: Corrigir `backend/app/api/v1/endpoints/projetos.py`**

Linha 21, em `ProjetoCreate`, trocar `arquiteto_id: Optional[int] = None` por
`especificador_id: Optional[int] = None`.

Linha 30, em `ProjetoUpdate`, trocar `arquiteto_id: Optional[int] = None` por
`especificador_id: Optional[int] = None`.

- [ ] **Step 4: Rodar a suíte inteira do backend**

Run: `cd backend && python -m pytest tests/ -v`
Expected: todos os testes continuam passando (nada deveria testar `arquitetos.py`
diretamente — se algo falhar aqui, é sinal de uma referência esquecida a `Arquiteto`).

- [ ] **Step 5: Subir o servidor local e checar o Swagger**

Run: `cd backend && uvicorn app.main:app --reload --port 8000` (rodar em background ou em
outro terminal)
Acessar `http://localhost:8000/docs` e confirmar visualmente que:
- Não existe mais a tag "CRM — Arquitetos"
- Existe a tag "Especificadores" com todas as rotas das Tasks 6-12

- [ ] **Step 6: Commit**

```bash
git add -A backend/app/api/v1/
git commit -m "feat: register Especificador router, remove Arquiteto endpoint"
```

---

### Task 14: Seed de dados padrão

**Files:**
- Modify: `backend/seed.py`

**Interfaces:**
- Consumes: `TipoEspecificador`, `TipoAtributoDinamico`, `FaixaPotencial`,
  `ChecklistTemplateItem` (Task 2).

- [ ] **Step 1: Adicionar imports no topo de `seed.py`**

```python
from app.models.especificador import (
    TipoEspecificador, TipoAtributoDinamico, FaixaPotencial, ChecklistTemplateItem,
)
```

- [ ] **Step 2: Adicionar bloco de seed, logo depois do bloco `# === WIP LIMIT para projetista ===`**

```python
        # === TIPOS DE ESPECIFICADOR ===
        tipos_especificador = ["Arquiteto", "Designer de Interiores", "Engenheiro"]
        tipos_criados = {}
        for i, nome in enumerate(tipos_especificador):
            existente = db.query(TipoEspecificador).filter(TipoEspecificador.nome == nome).first()
            if not existente:
                tipo = TipoEspecificador(nome=nome, ordem=i)
                db.add(tipo)
                db.flush()
                tipos_criados[nome] = tipo
            else:
                tipos_criados[nome] = existente
        print(f"✅ {len(tipos_especificador)} tipos de especificador configurados")

        # === TIPOS DE ATRIBUTO DINÂMICO ===
        tipos_atributo = ["Decisor", "Time", "Hobbie", "Indicado por", "Parceiro de negócios", "Outro"]
        for nome in tipos_atributo:
            existente = db.query(TipoAtributoDinamico).filter(TipoAtributoDinamico.nome == nome).first()
            if not existente:
                db.add(TipoAtributoDinamico(nome=nome))
        print(f"✅ {len(tipos_atributo)} tipos de atributo dinâmico configurados")

        # === FAIXAS DE POTENCIAL ===
        faixas_potencial = [
            (1, 0), (2, 300_000), (3, 700_000), (4, 1_500_000), (5, 3_000_000),
        ]
        for nota, valor_minimo in faixas_potencial:
            existente = db.query(FaixaPotencial).filter(FaixaPotencial.nota == nota).first()
            if not existente:
                db.add(FaixaPotencial(nota=nota, valor_minimo=valor_minimo))
        print(f"✅ {len(faixas_potencial)} faixas de potencial configuradas")

        # === CHECKLIST DE ATIVAÇÃO (template padrão — tipo Arquiteto) ===
        tipo_arquiteto = tipos_criados.get("Arquiteto")
        if tipo_arquiteto:
            checklist_padrao = [
                "Enviar kit de boas-vindas",
                "Agendar visita ao showroom",
                "Apresentar portfólio de projetos",
                "Adicionar ao grupo de WhatsApp da loja",
                "Convidar para o próximo evento",
            ]
            existente = db.query(ChecklistTemplateItem).filter(
                ChecklistTemplateItem.tipo_especificador_id == tipo_arquiteto.id
            ).first()
            if not existente:
                for i, descricao in enumerate(checklist_padrao):
                    db.add(ChecklistTemplateItem(
                        tipo_especificador_id=tipo_arquiteto.id, descricao=descricao, ordem=i,
                    ))
                print(f"✅ Checklist de ativação padrão configurado ({len(checklist_padrao)} itens)")
```

- [ ] **Step 2: Rodar o seed localmente**

Run: `cd backend && python seed.py`
Expected: saída incluindo as 4 novas linhas de `✅` acima, sem exceções.

- [ ] **Step 3: Commit**

```bash
git add backend/seed.py
git commit -m "feat: seed default Especificador types, attributes, potencial bands, checklist template"
```

---

### Task 15: `especificadoresApi` no frontend + labels em `constants.js`

**Files:**
- Modify: `frontend/src/lib/api.js`
- Modify: `frontend/src/lib/constants.js`

**Interfaces:**
- Produces: `especificadoresApi` (objeto com `list`, `get`, `create`, `update`, `deactivate`,
  `addPessoa`, `updatePessoa`, `removePessoa`, `addAtributo`, `removeAtributo`,
  `addObservacao`, `concluirChecklistItem`, `transferir`, `tipos.*`, `tiposAtributo.*`,
  `checklistTemplates.*`, `faixasPotencial.*`) — consumido pelas Tasks 16-19.
- Produces: `TIPO_CADASTRO_LABELS`, `ESTAGIO_CARREIRA_LABELS`, `ESPECIALIDADE_LABELS`,
  `FIT_PORTFOLIO_LABELS`, `PAPEL_PESSOA_LABELS` em `constants.js`, e entradas `ativo`,
  `inativo`, `prospect` adicionadas a `STATUS_CONFIG` (reaproveitando `getStatusBadge`).

- [ ] **Step 1: Adicionar ao final de `frontend/src/lib/api.js`**

```javascript
export const especificadoresApi = {
  list: (params) => api.get('/especificadores/', { params }),
  get: (id) => api.get(`/especificadores/${id}`),
  create: (data) => api.post('/especificadores/', data),
  update: (id, data) => api.patch(`/especificadores/${id}`, data),
  deactivate: (id) => api.delete(`/especificadores/${id}`),
  transferir: (id, novoVendedorId) => api.post(`/especificadores/${id}/transferir`, { novo_vendedor_id: novoVendedorId }),

  addPessoa: (id, data) => api.post(`/especificadores/${id}/pessoas`, data),
  updatePessoa: (id, pessoaId, data) => api.patch(`/especificadores/${id}/pessoas/${pessoaId}`, data),
  removePessoa: (id, pessoaId) => api.delete(`/especificadores/${id}/pessoas/${pessoaId}`),

  addAtributo: (id, data) => api.post(`/especificadores/${id}/atributos`, data),
  removeAtributo: (id, atributoId) => api.delete(`/especificadores/${id}/atributos/${atributoId}`),

  addObservacao: (id, texto) => api.post(`/especificadores/${id}/observacoes`, { texto }),

  concluirChecklistItem: (id, itemId) => api.post(`/especificadores/${id}/checklist/${itemId}/concluir`),

  tipos: {
    list: () => api.get('/especificadores/tipos'),
    create: (data) => api.post('/especificadores/tipos', data),
    update: (id, data) => api.patch(`/especificadores/tipos/${id}`, data),
  },
  tiposAtributo: {
    list: () => api.get('/especificadores/tipos-atributo'),
    create: (data) => api.post('/especificadores/tipos-atributo', data),
  },
  checklistTemplates: {
    list: (tipoEspecificadorId) => api.get('/especificadores/checklist-templates', { params: { tipo_especificador_id: tipoEspecificadorId } }),
    create: (data) => api.post('/especificadores/checklist-templates', data),
    update: (id, data) => api.patch(`/especificadores/checklist-templates/${id}`, data),
    remove: (id) => api.delete(`/especificadores/checklist-templates/${id}`),
  },
  faixasPotencial: {
    list: () => api.get('/especificadores/faixas-potencial'),
    create: (data) => api.post('/especificadores/faixas-potencial', data),
    update: (id, data) => api.patch(`/especificadores/faixas-potencial/${id}`, data),
  },
}
```

- [ ] **Step 2: Adicionar a `frontend/src/lib/constants.js`**

Adicionar estas três chaves dentro do objeto `STATUS_CONFIG` já existente (qualquer posição,
por exemplo logo após a chave `cancelado:`):

```javascript
  ativo:                 { label: 'Ativo',                  color: 'green',  fase: 'especificador' },
  inativo:               { label: 'Inativo',                color: 'stone',  fase: 'especificador' },
  prospect:              { label: 'Prospect',                color: 'blue',   fase: 'especificador' },
```

E adicionar estes novos exports ao final do arquivo:

```javascript
export const TIPO_CADASTRO_LABELS = {
  pf: 'Pessoa Física',
  pj: 'Pessoa Jurídica',
}

export const ESTAGIO_CARREIRA_LABELS = {
  iniciante: 'Iniciante',
  estabelecido: 'Estabelecido',
  senior: 'Sênior',
  socio: 'Sócio',
}

export const ESPECIALIDADE_LABELS = {
  residencial_alto_padrao: 'Residencial Alto Padrão',
  residencial_medio: 'Residencial Médio',
  comercial: 'Comercial',
  hoteleiro: 'Hoteleiro',
  corporativo: 'Corporativo',
  outro: 'Outro',
}

export const FIT_PORTFOLIO_LABELS = {
  alto: 'Alto',
  medio: 'Médio',
  baixo: 'Baixo',
}

export const PAPEL_PESSOA_LABELS = {
  responsavel: 'Responsável',
  decisor: 'Decisor',
  funcionario: 'Funcionário',
}
```

- [ ] **Step 3: Verificação manual**

Run: `cd frontend && npm run dev` (deixar rodando)
Abrir o console do navegador em qualquer página já logada e rodar:
`import('/src/lib/api.js').then(m => console.log(Object.keys(m.especificadoresApi)))`
Expected: array incluindo `list, get, create, update, deactivate, transferir, addPessoa,
updatePessoa, removePessoa, addAtributo, removeAtributo, addObservacao,
concluirChecklistItem, tipos, tiposAtributo, checklistTemplates, faixasPotencial`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/api.js frontend/src/lib/constants.js
git commit -m "feat: add especificadoresApi and label maps"
```

---

### Task 16: `EspecificadoresPage.jsx` — lista, filtros e modal de criação

Segue exatamente o padrão de `CRMPage.jsx` (Modal + lista + estado local com `useState`/
`useEffect`, sem TanStack Query — o projeto tem a lib instalada mas as páginas existentes não
a usam ainda, então mantemos consistência com o que já existe).

**Files:**
- Create: `frontend/src/pages/especificadores/EspecificadoresPage.jsx`

**Interfaces:**
- Consumes: `especificadoresApi`, `especificadoresApi.tipos.list()` (Task 15);
  `Modal, EmptyState, LoadingPage, StatusBadge` de `components/ui`; `useAuthStore` de
  `store` para saber o perfil do usuário atual.
- Produces: componente default export `EspecificadoresPage`, usado na Task 20 (rotas).
  Exporta também `EspecificadorDrawer` (função nomeada, não exportada do módulo — implementada
  na Task 17 no mesmo arquivo) via import direto no fim do arquivo.

- [ ] **Step 1: Criar `frontend/src/pages/especificadores/EspecificadoresPage.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { especificadoresApi, usersApi } from '../../lib/api'
import { Modal, EmptyState, LoadingPage, StatusBadge, Card } from '../../components/ui'
import { useAuthStore, podeVerTudo } from '../../store'
import clsx from 'clsx'

export default function EspecificadoresPage() {
  const { user } = useAuthStore()
  const vendoTudo = podeVerTudo(user?.perfil)
  const [especificadores, setEspecificadores] = useState([])
  const [tipos, setTipos] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroResponsavel, setFiltroResponsavel] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selecionado, setSelecionado] = useState(null)

  const fetchTudo = async () => {
    try {
      const [especRes, tiposRes] = await Promise.all([
        especificadoresApi.list({
          tipo_especificador_id: filtroTipo || undefined,
          status: filtroStatus || undefined,
          responsavel_id: vendoTudo ? (filtroResponsavel || undefined) : undefined,
        }),
        especificadoresApi.tipos.list(),
      ])
      setEspecificadores(especRes.data)
      setTipos(tiposRes.data)
      if (vendoTudo) {
        const { data } = await usersApi.list()
        setVendedores(data.filter(u => u.perfil === 'vendedor'))
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTudo() }, [filtroTipo, filtroStatus, filtroResponsavel])

  const filtrados = especificadores.filter(e =>
    !search || e.nome.toLowerCase().includes(search.toLowerCase())
  )

  const nomeTipo = (id) => tipos.find(t => t.id === id)?.nome || '—'

  if (loading) return <LoadingPage />

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-stone-100 rounded-lg px-3 py-1.5 flex-1 max-w-xs">
          <Search size={13} className="text-stone-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar especificador..."
            className="bg-transparent text-sm text-stone-700 outline-none w-full placeholder:text-stone-400"
          />
        </div>

        <select className="input w-44" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Todos os tipos</option>
          {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>

        <select className="input w-40" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="prospect">Prospect</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>

        {vendoTudo && (
          <select className="input w-44" value={filtroResponsavel} onChange={e => setFiltroResponsavel(e.target.value)}>
            <option value="">Todos os responsáveis</option>
            {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
          </select>
        )}

        <button onClick={() => setShowModal(true)} className="btn-primary btn-sm gap-1.5 ml-auto">
          <Plus size={13} /> Novo Especificador
        </button>
      </div>

      {/* Grid */}
      {filtrados.length === 0 ? (
        <EmptyState title="Nenhum especificador encontrado" description="Ajuste os filtros ou cadastre um novo especificador" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtrados.map(e => (
            <Card key={e.id} onClick={() => setSelecionado(e)}>
              <div className="flex items-start justify-between mb-2">
                <p className="font-medium text-stone-800">{e.nome}</p>
                <StatusBadge status={e.status} />
              </div>
              <p className="text-xs text-stone-400 mb-2">{nomeTipo(e.tipo_especificador_id)}</p>
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>{e.potencial ? `Potencial P${e.potencial}` : 'Sem potencial calculado'}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Novo Especificador */}
      <NovoEspecificadorModal
        open={showModal}
        tipos={tipos}
        onClose={() => setShowModal(false)}
        onSaved={() => { setShowModal(false); fetchTudo() }}
      />
    </div>
  )
}

// === Modal Novo Especificador ===
function NovoEspecificadorModal({ open, tipos, onClose, onSaved }) {
  const [form, setForm] = useState({
    tipo_cadastro: 'pf', tipo_especificador_id: '', nome: '', telefone: '', email: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await especificadoresApi.create({ ...form, tipo_especificador_id: Number(form.tipo_especificador_id) })
      onSaved()
      setForm({ tipo_cadastro: 'pf', tipo_especificador_id: '', nome: '', telefone: '', email: '' })
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
          <div>
            <label className="label">Tipo de cadastro *</label>
            <select className="input" value={form.tipo_cadastro} onChange={e => set('tipo_cadastro', e.target.value)}>
              <option value="pf">Pessoa Física</option>
              <option value="pj">Pessoa Jurídica</option>
            </select>
          </div>
          <div>
            <label className="label">Tipo de especificador *</label>
            <select className="input" required value={form.tipo_especificador_id} onChange={e => set('tipo_especificador_id', e.target.value)}>
              <option value="">Selecione...</option>
              {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Nome / Razão social *</label>
            <input className="input" required value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo ou razão social" />
          </div>
          <div>
            <label className="label">Telefone *</label>
            <input className="input" required value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(11) 99999-0000" />
          </div>
          <div>
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

Nota: a Task 17 adiciona `EspecificadorDrawer` neste mesmo arquivo e conecta
`{selecionado && <EspecificadorDrawer .../>}` no JSX principal.

- [ ] **Step 2: Verificação manual**

Run: `cd frontend && npm run dev`
Acessar `http://localhost:5173` (após login), navegar manualmente para
`http://localhost:5173/especificadores` (a rota ainda não existe no menu — será adicionada na
Task 20, mas a URL já deve funcionar assim que a Task 20 registrar a rota; por ora, confirmar
apenas que o componente compila sem erros abrindo o console do navegador e checando que não
há erros de import).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/especificadores/EspecificadoresPage.jsx
git commit -m "feat: add EspecificadoresPage with list, filters, and creation modal"
```

---

### Task 17: `EspecificadorDrawer` — ficha com abas

**Files:**
- Modify: `frontend/src/pages/especificadores/EspecificadoresPage.jsx`

**Interfaces:**
- Consumes: `especificadoresApi.get/update/addPessoa/removePessoa/addAtributo/
  removeAtributo/addObservacao/concluirChecklistItem/transferir`;
  `Tabs, StatusBadge` de `components/ui`; labels de `constants.js` (Task 15).

- [ ] **Step 1: Conectar o drawer no componente principal**

No final do `return` de `EspecificadoresPage` (logo antes do `</div>` de fechamento, depois
do `<NovoEspecificadorModal .../>`), adicionar:

```jsx
      {selecionado && (
        <EspecificadorDrawer
          especificadorId={selecionado.id}
          onClose={() => setSelecionado(null)}
          onUpdated={fetchTudo}
        />
      )}
```

- [ ] **Step 2: Adicionar o componente `EspecificadorDrawer` ao final do arquivo**

```jsx
import { Tabs } from '../../components/ui'
import {
  TIPO_CADASTRO_LABELS, ESTAGIO_CARREIRA_LABELS, ESPECIALIDADE_LABELS,
  FIT_PORTFOLIO_LABELS, PAPEL_PESSOA_LABELS, formatDate, formatCurrency,
} from '../../lib/constants'

function EspecificadorDrawer({ especificadorId, onClose, onUpdated }) {
  const [ficha, setFicha] = useState(null)
  const [tab, setTab] = useState('perfil')
  const [novaObservacao, setNovaObservacao] = useState('')
  const [salvandoObs, setSalvandoObs] = useState(false)

  const carregarFicha = async () => {
    try {
      const { data } = await especificadoresApi.get(especificadorId)
      setFicha(data)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { carregarFicha() }, [especificadorId])

  if (!ficha) return null

  const registrarObservacao = async () => {
    if (!novaObservacao.trim()) return
    setSalvandoObs(true)
    try {
      await especificadoresApi.addObservacao(especificadorId, novaObservacao)
      setNovaObservacao('')
      await carregarFicha()
    } catch (e) { console.error(e) }
    finally { setSalvandoObs(false) }
  }

  const concluirItem = async (itemId) => {
    try {
      await especificadoresApi.concluirChecklistItem(especificadorId, itemId)
      await carregarFicha()
    } catch (e) { console.error(e) }
  }

  const TABS = [
    { key: 'perfil', label: 'Perfil' },
    { key: 'portfolio', label: 'Portfólio' },
    { key: 'atributos', label: 'Atributos' },
    { key: 'observacoes', label: 'Observações', count: ficha.observacoes.length },
    { key: 'checklist', label: 'Checklist', count: ficha.checklist_items.filter(i => !i.concluido).length },
  ]

  return (
    <div className="fixed inset-y-0 right-0 w-[28rem] bg-white shadow-elevated border-l border-stone-200 z-50 flex flex-col animate-slide-in-right">
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
        <div>
          <h3 className="font-semibold text-stone-800">{ficha.nome}</h3>
          <p className="text-xs text-stone-400">{ficha.telefone}</p>
        </div>
        <button onClick={onClose} className="btn-icon">✕</button>
      </div>

      <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
        <StatusBadge status={ficha.status} />
        {ficha.potencial && <span className="badge badge-alerta text-2xs">Potencial P{ficha.potencial}</span>}
      </div>

      <div className="px-5 py-3 border-b border-stone-100">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === 'perfil' && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-stone-400">Tipo de cadastro</p><p className="font-medium text-stone-700">{TIPO_CADASTRO_LABELS[ficha.tipo_cadastro]}</p></div>
              <div><p className="text-xs text-stone-400">E-mail</p><p className="font-medium text-stone-700">{ficha.email || '—'}</p></div>
              <div><p className="text-xs text-stone-400">Estágio de carreira</p><p className="font-medium text-stone-700">{ESTAGIO_CARREIRA_LABELS[ficha.estagio_carreira] || '—'}</p></div>
              <div><p className="text-xs text-stone-400">Especialidade</p><p className="font-medium text-stone-700">{ESPECIALIDADE_LABELS[ficha.especialidade] || '—'}</p></div>
              <div><p className="text-xs text-stone-400">Fit com portfólio</p><p className="font-medium text-stone-700">{FIT_PORTFOLIO_LABELS[ficha.fit_portfolio] || '—'}</p></div>
              <div><p className="text-xs text-stone-400">Cadastrado em</p><p className="font-medium text-stone-700">{formatDate(ficha.criado_em)}</p></div>
            </div>

            {ficha.tipo_cadastro === 'pj' && (
              <div className="pt-3 border-t border-stone-100">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Pessoas vinculadas</p>
                {ficha.pessoas_vinculadas.length === 0 ? (
                  <p className="text-sm text-stone-300">Nenhuma pessoa vinculada</p>
                ) : (
                  <div className="space-y-2">
                    {ficha.pessoas_vinculadas.map(p => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span>{p.nome} <span className="text-xs text-stone-400">({PAPEL_PESSOA_LABELS[p.papel]})</span></span>
                        <span className="text-xs text-stone-400">{p.telefone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'portfolio' && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-stone-400">Obras/ano</p><p className="font-medium text-stone-700">{ficha.obras_por_ano ?? '—'}</p></div>
              <div><p className="text-xs text-stone-400">Valor médio da obra</p><p className="font-medium text-stone-700">{ficha.valor_medio_obra ? formatCurrency(ficha.valor_medio_obra) : '—'}</p></div>
              <div className="col-span-2"><p className="text-xs text-stone-400">Potencial anual bruto</p><p className="font-medium text-stone-700">{ficha.potencial_anual_bruto ? formatCurrency(ficha.potencial_anual_bruto) : '—'}</p></div>
              <div className="col-span-2"><p className="text-xs text-stone-400">Estilo predominante</p><p className="font-medium text-stone-700">{ficha.estilo_predominante || '—'}</p></div>
              <div className="col-span-2"><p className="text-xs text-stone-400">Regiões de atuação</p><p className="font-medium text-stone-700">{ficha.regioes_atuacao || '—'}</p></div>
            </div>
          </div>
        )}

        {tab === 'atributos' && (
          <div className="space-y-2">
            {ficha.atributos.length === 0 ? (
              <p className="text-sm text-stone-300">Nenhum atributo cadastrado</p>
            ) : (
              ficha.atributos.map(a => (
                <div key={a.id} className="flex items-center justify-between text-sm border-b border-stone-50 pb-1.5">
                  <span className="text-stone-500">{a.tipo}</span>
                  <span className="font-medium text-stone-700">{a.valor}</span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'observacoes' && (
          <div className="space-y-3">
            {ficha.observacoes.length === 0 ? (
              <p className="text-sm text-stone-300">Nenhuma observação registrada</p>
            ) : (
              ficha.observacoes.map(o => (
                <div key={o.id} className="text-sm">
                  <p className="text-2xs text-stone-300 mb-0.5">{formatDate(o.criado_em)}</p>
                  <p className="text-stone-600 leading-relaxed">{o.texto}</p>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'checklist' && (
          <div className="space-y-2">
            {ficha.checklist_items.length === 0 ? (
              <p className="text-sm text-stone-300">Sem checklist de ativação</p>
            ) : (
              ficha.checklist_items.map(item => (
                <label key={item.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.concluido}
                    disabled={item.concluido}
                    onChange={() => concluirItem(item.id)}
                  />
                  <span className={item.concluido ? 'line-through text-stone-400' : 'text-stone-700'}>
                    {item.descricao}
                  </span>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      {tab === 'observacoes' && (
        <div className="px-5 py-4 border-t border-stone-100 space-y-2">
          <textarea
            value={novaObservacao}
            onChange={e => setNovaObservacao(e.target.value)}
            placeholder="Nova observação..."
            className="input resize-none h-20 text-sm"
          />
          <button
            onClick={registrarObservacao}
            disabled={salvandoObs || !novaObservacao.trim()}
            className="btn-primary w-full justify-center"
          >
            {salvandoObs ? 'Anotando...' : 'Anotar'}
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificação manual**

Run: `cd frontend && npm run dev`
Fazer login, ir para `/especificadores` (rota ainda depende da Task 20 — se ela ainda não
foi feita, testar navegando manualmente pela URL), clicar em um card e confirmar que o
drawer abre com as 5 abas navegáveis e sem erros no console.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/especificadores/EspecificadoresPage.jsx
git commit -m "feat: add EspecificadorDrawer with Perfil/Portfolio/Atributos/Observacoes/Checklist tabs"
```

---

### Task 18: Botão flutuante "+"

**Files:**
- Create: `frontend/src/components/layout/FloatingAddButton.jsx`
- Modify: `frontend/src/components/layout/AppLayout.jsx`

**Interfaces:**
- Consumes: `NovoEspecificadorModal` — precisa ser exportado de
  `EspecificadoresPage.jsx` para ser reutilizado aqui (ver Step 1).

- [ ] **Step 1: Exportar `NovoEspecificadorModal` de `EspecificadoresPage.jsx`**

Em `frontend/src/pages/especificadores/EspecificadoresPage.jsx`, trocar a declaração:
```jsx
function NovoEspecificadorModal({ open, tipos, onClose, onSaved }) {
```
por:
```jsx
export function NovoEspecificadorModal({ open, tipos, onClose, onSaved }) {
```

- [ ] **Step 2: Criar `frontend/src/components/layout/FloatingAddButton.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import { especificadoresApi } from '../../lib/api'
import { NovoEspecificadorModal } from '../../pages/especificadores/EspecificadoresPage'
import clsx from 'clsx'

export default function FloatingAddButton() {
  const [open, setOpen] = useState(false)
  const [showEspecificadorModal, setShowEspecificadorModal] = useState(false)
  const [tipos, setTipos] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    especificadoresApi.tipos.list().then(r => setTipos(r.data)).catch(console.error)
  }, [])

  const OPCOES = [
    { label: 'Novo Especificador', action: () => { setOpen(false); setShowEspecificadorModal(true) } },
    { label: 'Novo Cliente', action: () => { setOpen(false); navigate('/clientes') } },
    { label: 'Novo Lead', action: () => { setOpen(false); navigate('/crm') } },
  ]

  return (
    <>
      <div className="fixed top-4 right-4 z-40">
        {open && (
          <div className="absolute right-0 top-11 w-48 bg-white rounded-xl shadow-elevated border border-stone-100 py-1.5 animate-slide-up">
            {OPCOES.map(o => (
              <button
                key={o.label}
                onClick={o.action}
                className="w-full text-left px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setOpen(v => !v)}
          className={clsx(
            'w-9 h-9 rounded-full flex items-center justify-center shadow-elevated transition-colors',
            open ? 'bg-stone-700 text-white' : 'bg-primary-600 text-white hover:bg-primary-700'
          )}
          title="Cadastrar novo"
        >
          {open ? <X size={16} /> : <Plus size={16} />}
        </button>
      </div>

      <NovoEspecificadorModal
        open={showEspecificadorModal}
        tipos={tipos}
        onClose={() => setShowEspecificadorModal(false)}
        onSaved={() => setShowEspecificadorModal(false)}
      />
    </>
  )
}
```

- [ ] **Step 3: Integrar em `AppLayout.jsx`**

```jsx
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import FloatingAddButton from './FloatingAddButton'
import { useUIStore } from '../../store'
import clsx from 'clsx'

export default function AppLayout({ title, subtitle }) {
  const { sidebarOpen } = useUIStore()

  return (
    <div className="min-h-screen bg-stone-100">
      <Sidebar />
      <FloatingAddButton />
      <div className={clsx(
        'transition-all duration-300',
        sidebarOpen ? 'ml-60' : 'ml-14'
      )}>
        <Header title={title} subtitle={subtitle} />
        <main className="pt-14 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

(Apenas a linha `import FloatingAddButton from './FloatingAddButton'` e
`<FloatingAddButton />` são novas — o resto do arquivo permanece idêntico.)

- [ ] **Step 4: Verificação manual**

Run: `cd frontend && npm run dev`
Fazer login, confirmar que o botão "+" aparece fixo no canto superior direito em qualquer
tela (Dashboard, CRM, Projetos), clicar nele, ver o menu com as 3 opções, clicar em "Novo
Especificador" e confirmar que o modal de criação abre corretamente. Clicar em "Novo Cliente"
e "Novo Lead" e confirmar que navegam para `/clientes` e `/crm` respectivamente.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/layout/FloatingAddButton.jsx frontend/src/components/layout/AppLayout.jsx frontend/src/pages/especificadores/EspecificadoresPage.jsx
git commit -m "feat: add global floating add button (Especificador/Cliente/Lead)"
```

---

### Task 19: `EspecificadoresConfigPage.jsx` (Admin)

**Files:**
- Create: `frontend/src/pages/especificadores/EspecificadoresConfigPage.jsx`

**Interfaces:**
- Consumes: `especificadoresApi.tipos`, `.tiposAtributo`, `.checklistTemplates`,
  `.faixasPotencial` (Task 15).

- [ ] **Step 1: Criar `frontend/src/pages/especificadores/EspecificadoresConfigPage.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { especificadoresApi } from '../../lib/api'
import { Tabs, LoadingPage } from '../../components/ui'

export default function EspecificadoresConfigPage() {
  const [tab, setTab] = useState('tipos')

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-4">
        <Tabs
          tabs={[
            { key: 'tipos', label: 'Tipos' },
            { key: 'atributos', label: 'Tipos de Atributo' },
            { key: 'checklist', label: 'Checklist' },
            { key: 'potencial', label: 'Faixas de Potencial' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'tipos' && <TiposTab />}
      {tab === 'atributos' && <AtributosTab />}
      {tab === 'checklist' && <ChecklistTab />}
      {tab === 'potencial' && <PotencialTab />}
    </div>
  )
}

function TiposTab() {
  const [tipos, setTipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [novoNome, setNovoNome] = useState('')

  const carregar = () => especificadoresApi.tipos.list().then(r => setTipos(r.data)).finally(() => setLoading(false))
  useEffect(() => { carregar() }, [])

  const adicionar = async () => {
    if (!novoNome.trim()) return
    await especificadoresApi.tipos.create({ nome: novoNome, ordem: tipos.length })
    setNovoNome('')
    carregar()
  }

  if (loading) return <LoadingPage />

  return (
    <div className="card p-4 space-y-3">
      {tipos.map(t => (
        <div key={t.id} className="flex items-center justify-between text-sm border-b border-stone-50 pb-2">
          <span>{t.nome}</span>
          <span className={t.ativo ? 'text-green-600 text-xs' : 'text-stone-400 text-xs'}>{t.ativo ? 'Ativo' : 'Inativo'}</span>
        </div>
      ))}
      <div className="flex gap-2 pt-2">
        <input className="input" value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Novo tipo (ex: Paisagista)" />
        <button onClick={adicionar} className="btn-primary btn-sm gap-1"><Plus size={13} /> Adicionar</button>
      </div>
    </div>
  )
}

function AtributosTab() {
  const [tipos, setTipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [novoNome, setNovoNome] = useState('')

  const carregar = () => especificadoresApi.tiposAtributo.list().then(r => setTipos(r.data)).finally(() => setLoading(false))
  useEffect(() => { carregar() }, [])

  const adicionar = async () => {
    if (!novoNome.trim()) return
    await especificadoresApi.tiposAtributo.create({ nome: novoNome })
    setNovoNome('')
    carregar()
  }

  if (loading) return <LoadingPage />

  return (
    <div className="card p-4 space-y-3">
      {tipos.map(t => (
        <div key={t.id} className="text-sm border-b border-stone-50 pb-2">{t.nome}</div>
      ))}
      <div className="flex gap-2 pt-2">
        <input className="input" value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Novo tipo de atributo" />
        <button onClick={adicionar} className="btn-primary btn-sm gap-1"><Plus size={13} /> Adicionar</button>
      </div>
    </div>
  )
}

function ChecklistTab() {
  const [tiposEspecificador, setTiposEspecificador] = useState([])
  const [tipoSelecionado, setTipoSelecionado] = useState('')
  const [itens, setItens] = useState([])
  const [novaDescricao, setNovaDescricao] = useState('')

  useEffect(() => {
    especificadoresApi.tipos.list().then(r => {
      setTiposEspecificador(r.data)
      if (r.data.length > 0) setTipoSelecionado(String(r.data[0].id))
    })
  }, [])

  const carregarItens = () => {
    if (!tipoSelecionado) return
    especificadoresApi.checklistTemplates.list(tipoSelecionado).then(r => setItens(r.data))
  }
  useEffect(() => { carregarItens() }, [tipoSelecionado])

  const adicionar = async () => {
    if (!novaDescricao.trim()) return
    await especificadoresApi.checklistTemplates.create({
      tipo_especificador_id: Number(tipoSelecionado), descricao: novaDescricao, ordem: itens.length,
    })
    setNovaDescricao('')
    carregarItens()
  }

  const remover = async (id) => {
    await especificadoresApi.checklistTemplates.remove(id)
    carregarItens()
  }

  return (
    <div className="card p-4 space-y-3">
      <select className="input" value={tipoSelecionado} onChange={e => setTipoSelecionado(e.target.value)}>
        {tiposEspecificador.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
      </select>
      {itens.map(i => (
        <div key={i.id} className="flex items-center justify-between text-sm border-b border-stone-50 pb-2">
          <span>{i.descricao}</span>
          <button onClick={() => remover(i.id)} className="text-red-500 text-xs">Remover</button>
        </div>
      ))}
      <div className="flex gap-2 pt-2">
        <input className="input" value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} placeholder="Novo item do checklist" />
        <button onClick={adicionar} className="btn-primary btn-sm gap-1"><Plus size={13} /> Adicionar</button>
      </div>
    </div>
  )
}

function PotencialTab() {
  const [faixas, setFaixas] = useState([])
  const [loading, setLoading] = useState(true)

  const carregar = () => especificadoresApi.faixasPotencial.list().then(r => setFaixas(r.data)).finally(() => setLoading(false))
  useEffect(() => { carregar() }, [])

  const atualizarValor = async (id, valor_minimo) => {
    await especificadoresApi.faixasPotencial.update(id, { valor_minimo: Number(valor_minimo) })
    carregar()
  }

  if (loading) return <LoadingPage />

  return (
    <div className="card p-4 space-y-3">
      {faixas.sort((a, b) => a.nota - b.nota).map(f => (
        <div key={f.id} className="flex items-center gap-3 text-sm">
          <span className="w-12 font-medium">P{f.nota}</span>
          <span className="text-stone-400">a partir de R$</span>
          <input
            type="number"
            className="input w-40"
            defaultValue={f.valor_minimo}
            onBlur={e => atualizarValor(f.id, e.target.value)}
          />
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verificação manual**

Run: `cd frontend && npm run dev`
Navegar manualmente para `/especificadores/config` (rota adicionada na Task 20), confirmar
que as 4 abas carregam e que adicionar um novo tipo/atributo/item de checklist funciona e
reflete na lista imediatamente.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/especificadores/EspecificadoresConfigPage.jsx
git commit -m "feat: add EspecificadoresConfigPage for Admin (tipos, atributos, checklist, faixas)"
```

---

### Task 20: Rotas e navegação

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/layout/Sidebar.jsx`

- [ ] **Step 1: Atualizar `frontend/src/App.jsx`**

Adicionar o import (junto aos outros imports de página):
```jsx
import EspecificadoresPage from './pages/especificadores/EspecificadoresPage'
import EspecificadoresConfigPage from './pages/especificadores/EspecificadoresConfigPage'
```

Adicionar a `ROUTE_TITLES` (junto às entradas existentes):
```jsx
  '/especificadores':        { title: 'Especificadores',      subtitle: 'Carteira de arquitetos e designers' },
  '/especificadores/config': { title: 'Config. Especificadores', subtitle: 'Tipos, checklist e faixas de potencial' },
```

Adicionar as rotas dentro do `<Route element={<ProtectedLayout />}>` (junto às demais):
```jsx
            <Route path="/especificadores"        element={<EspecificadoresPage />} />
            <Route path="/especificadores/config" element={<EspecificadoresConfigPage />} />
```

- [ ] **Step 2: Atualizar `frontend/src/components/layout/Sidebar.jsx`**

Adicionar o import do ícone (junto aos outros ícones de `lucide-react`):
```jsx
import {
  LayoutDashboard, Users, FileText, Layers, DollarSign,
  Truck, Hammer, HeadphonesIcon, BarChart2, Settings, LogOut,
  ChevronLeft, Building2, Compass
} from 'lucide-react'
```

Adicionar ao array `NAV`, logo após a entrada `/briefing`:
```jsx
  { path: '/especificadores', label: 'Especificadores', icon: Compass, perfis: ['diretoria','gerente_comercial','vendedor'] },
```

- [ ] **Step 3: Verificação manual completa (fluxo ponta a ponta)**

Run: `cd frontend && npm run dev` e `cd backend && uvicorn app.main:app --reload --port 8000`
(ambos rodando)

1. Fazer login como `vendedor@lidermoveis.com.br` / `Teste@123`.
2. Confirmar que "Especificadores" aparece no menu lateral, na seção Comercial.
3. Clicar, ver a lista (vazia inicialmente), clicar em "Novo Especificador", preencher e
   salvar — confirmar que aparece na lista com badge "Prospect".
4. Clicar no card criado, confirmar que o drawer abre nas 5 abas, adicionar uma observação,
   marcar um item de checklist (se o seed rodou, deve haver 5 itens no tipo Arquiteto).
5. Fazer logout, logar como `admin@plannit.com.br` / `Admin@123456`.
6. Confirmar que o especificador criado pelo vendedor aparece na lista do Admin (visão
   "vê tudo").
7. Navegar manualmente para `/especificadores/config`, adicionar um novo tipo de
   especificador e confirmar que ele aparece no dropdown do modal de criação.
8. Clicar no botão "+" flutuante em qualquer tela, confirmar que o menu abre e "Novo
   Especificador" funciona a partir de qualquer página (ex: estando no Dashboard).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx frontend/src/components/layout/Sidebar.jsx
git commit -m "feat: register Especificadores routes and sidebar navigation"
```

---

## Ordem de execução recomendada

Tasks 1-14 (backend) são sequenciais entre si (cada uma depende de arquivos criados pela
anterior). Tasks 15-20 (frontend) dependem de todas as rotas de backend estarem registradas
(Task 13) para verificação manual end-to-end, mas os arquivos em si (Task 15: `api.js`/
`constants.js`) podem ser escritos em paralelo às tasks de backend se for usar
subagent-driven-development com mais de um worker — na dúvida, seguir a ordem 1→20.
