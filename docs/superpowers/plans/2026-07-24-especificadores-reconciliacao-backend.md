# Especificadores — Reconciliação Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portar pro backend as 3 peças que só existem em `origin/feature/arch` (categorias novas de `tipo`, `endereco_escritorio`, `Cliente.arquiteto_id`) e aplicar as correções decididas no spec de reconciliação (taxonomia de interação unificada, fix de timezone), tudo em cima do backend já implementado e testado de `feature/especificadores`.

**Architecture:** Extensão pontual dos mesmos arquivos já tocados nas rodadas anteriores deste módulo (`app/models/crm.py`, `app/schemas/crm.py`, `app/api/v1/endpoints/arquitetos.py`, `app/services/arquiteto_score.py`). Nenhum model novo — só colunas novas em models existentes e um endpoint de leitura novo.

**Tech Stack:** FastAPI, SQLAlchemy 2.0, Pydantic v2, pytest + SQLite in-memory (`tests/conftest.py`).

## Global Constraints

- Segue `docs/superpowers/specs/2026-07-24-especificadores-reconciliacao-design.md` — leia esse spec inteiro antes de começar; ele documenta o *porquê* de cada decisão (por que `tipo` ganha Corretor/Outro, por que a checagem de acesso por linha da `arch` não é portada, por que `visita_escritorio` substitui `visita` nos KPIs).
- **Sem Alembic versionado neste repo** — `seed.py` usa `Base.metadata.create_all`. Colunas novas não exigem migration nesta fase.
- Verificação via SQLite in-memory + `TestClient`, não Postgres real.
- `DecisorArquiteto`, `ConcorrenteArquiteto`, `HistoricoDonoArquiteto`, `MetaVisitasConsultor`, `GET /arquitetos/kpis` e a flag `especificador_esfriando` **não mudam neste plano** — só a leitura de `tipo` de interação dentro dos dois endpoints que hoje comparam com `"visita"` (Task 5).
- `FuncionarioArquiteto`/`TipoArquiteto`/`TipoInteracaoArquiteto` (models de `feature/arch`) **não são portados** — a reconciliação usa os models já existentes em `feature/especificadores`, só estendidos.

---

## Task 1: Branch nova + `tipo` ganha Corretor e Outro

**Files:**
- Modify: `backend/app/models/crm.py` (enum `TipoEspecificador`)
- Modify: `backend/tests/test_arquitetos_tipo_carteira.py`

**Interfaces:**
- Produces: `TipoEspecificador.CORRETOR = "corretor"`, `TipoEspecificador.OUTRO = "outro"` — somam aos 4 valores já existentes (`ARQUITETO`, `DESIGNER_INTERIORES`, `DECORADOR`, `ENGENHEIRO`).

- [ ] **Step 1: Criar a branch nova a partir de `feature/especificadores`**

```bash
cd "C:\Users\thiagor\Documents\projeto\Plannit"
git status --short   # confirmar working tree limpo antes de trocar de branch
git checkout feature/especificadores
git checkout -b feature/especificadores-reconciliado
cd backend && python -m pytest -q
```
Expected: working tree limpo, `python -m pytest -q` reporta `133 passed` (estado herdado de `feature/especificadores`, ponto de partida confirmado).

- [ ] **Step 2: Escrever o teste que falha**

Adicionar ao final de `backend/tests/test_arquitetos_tipo_carteira.py`:

```python
def test_criar_arquiteto_tipo_corretor(auth_client):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": "Corretor Ana", "tipo": "corretor"})
    assert resp.status_code == 201
    assert resp.json()["tipo"] == "corretor"


def test_criar_arquiteto_tipo_outro(auth_client):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": "Caso Especial", "tipo": "outro"})
    assert resp.status_code == 201
    assert resp.json()["tipo"] == "outro"
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/test_arquitetos_tipo_carteira.py -v`
Expected: FAIL — `422 Unprocessable Entity`, `"corretor"`/`"outro"` ainda não são valores válidos do enum.

- [ ] **Step 4: Estender o enum**

Em `backend/app/models/crm.py`, trocar:

```python
class TipoEspecificador(str, enum.Enum):
    ARQUITETO = "arquiteto"
    DESIGNER_INTERIORES = "designer_interiores"
    DECORADOR = "decorador"
    ENGENHEIRO = "engenheiro"
```

por:

```python
class TipoEspecificador(str, enum.Enum):
    ARQUITETO = "arquiteto"
    DESIGNER_INTERIORES = "designer_interiores"
    DECORADOR = "decorador"
    ENGENHEIRO = "engenheiro"
    CORRETOR = "corretor"
    OUTRO = "outro"
```

- [ ] **Step 5: Rodar a suíte completa**

Run: `cd backend && python -m pytest -q`
Expected: PASS — 135 testes (133 + 2 novos).

- [ ] **Step 6: Commit**

```bash
git add backend/app/models/crm.py backend/tests/test_arquitetos_tipo_carteira.py
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add tipos Corretor e Outro ao enum TipoEspecificador

Portado de origin/feature/arch (TipoArquiteto.CORRETOR/OUTRO), decisao
validada no spec de reconciliacao de 24/07 — corretor de imoveis tambem
indica cliente de moveis planejados; Outro evita bloquear cadastro de
caso que nao se encaixa nas 4 categorias fixas.
EOF
)"
```

---

## Task 2: Campo `endereco_escritorio`

**Files:**
- Modify: `backend/app/models/crm.py` (`Arquiteto.endereco_escritorio`)
- Modify: `backend/app/schemas/crm.py` (`ArquitetoCreate`, `ArquitetoUpdate`, `ArquitetoResponse`)
- Modify: `backend/tests/test_arquitetos_tipo_carteira.py`

**Interfaces:**
- Produces: `Arquiteto.endereco_escritorio: Optional[str]` — coluna independente de `escritorio` (nome) e `especialidade`, sem conflito com nenhuma das duas.

- [ ] **Step 1: Escrever o teste que falha**

Adicionar ao final de `backend/tests/test_arquitetos_tipo_carteira.py`:

```python
def test_criar_arquiteto_com_endereco_escritorio(auth_client):
    resp = auth_client.post("/api/v1/arquitetos/", json={
        "nome": "Escritorio Central", "tipo": "arquiteto",
        "endereco_escritorio": "Av. Paulista, 1000",
    })
    assert resp.status_code == 201
    assert resp.json()["endereco_escritorio"] == "Av. Paulista, 1000"


def test_patch_endereco_escritorio(auth_client):
    criado = auth_client.post("/api/v1/arquitetos/", json={"nome": "Teste Endereco", "tipo": "arquiteto"}).json()
    assert criado["endereco_escritorio"] is None

    resp = auth_client.patch(f"/api/v1/arquitetos/{criado['id']}", json={"endereco_escritorio": "Rua Nova, 50"})
    assert resp.status_code == 200
    assert resp.json()["endereco_escritorio"] == "Rua Nova, 50"
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/test_arquitetos_tipo_carteira.py -v`
Expected: FAIL — `KeyError: 'endereco_escritorio'`, campo ainda não existe na resposta.

- [ ] **Step 3: Adicionar a coluna no model**

Em `backend/app/models/crm.py`, na classe `Arquiteto`, trocar:

```python
    escritorio = Column(String(200), nullable=True)
```

por:

```python
    escritorio = Column(String(200), nullable=True)
    endereco_escritorio = Column(String(300), nullable=True)
```

- [ ] **Step 4: Adicionar o campo nos 3 schemas**

Em `backend/app/schemas/crm.py`, em `ArquitetoCreate`, trocar:

```python
    tipo: TipoEspecificador
    especialidade: Optional[str] = None
```

por:

```python
    tipo: TipoEspecificador
    especialidade: Optional[str] = None
    endereco_escritorio: Optional[str] = None
```

Em `ArquitetoUpdate`, trocar:

```python
    tipo: Optional[TipoEspecificador] = None
    especialidade: Optional[str] = None
    status_carteira: Optional[StatusCarteiraEspecificador] = None
```

por:

```python
    tipo: Optional[TipoEspecificador] = None
    especialidade: Optional[str] = None
    endereco_escritorio: Optional[str] = None
    status_carteira: Optional[StatusCarteiraEspecificador] = None
```

Em `ArquitetoResponse`, trocar:

```python
    tipo: TipoEspecificador
    especialidade: Optional[str]
    consultor_id: Optional[int]
```

por:

```python
    tipo: TipoEspecificador
    especialidade: Optional[str]
    endereco_escritorio: Optional[str]
    consultor_id: Optional[int]
```

- [ ] **Step 5: Rodar a suíte completa**

Run: `cd backend && python -m pytest -q`
Expected: PASS — 137 testes.

- [ ] **Step 6: Commit**

```bash
git add backend/app/models/crm.py backend/app/schemas/crm.py backend/tests/test_arquitetos_tipo_carteira.py
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add endereco_escritorio ao cadastro de especificador

Portado de origin/feature/arch. Campo de texto livre, independente de
escritorio (nome) e especialidade.
EOF
)"
```

---

## Task 3: `Cliente.arquiteto_id` + `GET /arquitetos/{id}/clientes`

**Files:**
- Modify: `backend/app/models/crm.py` (`Cliente.arquiteto_id`)
- Modify: `backend/app/schemas/crm.py` (`ClienteCreate`, `ClienteResponse`)
- Modify: `backend/app/api/v1/endpoints/arquitetos.py`
- Create: `backend/tests/test_arquitetos_clientes.py`

**Interfaces:**
- Consumes: `Cliente` (`app/models/crm.py`, já existente), `ClienteResponse` (`app/schemas/crm.py`, já existente).
- Produces: `Cliente.arquiteto_id: Optional[int]`, `GET /arquitetos/{id}/clientes` → `List[ClienteResponse]` (qualquer usuário autenticado, mesmo padrão de `/decisores` e `/concorrentes`).

- [ ] **Step 1: Escrever o teste que falha**

Criar `backend/tests/test_arquitetos_clientes.py`:

```python
def _criar_arquiteto(auth_client, nome="Ana Arquiteta"):
    resp = auth_client.post("/api/v1/arquitetos/", json={"nome": nome, "tipo": "arquiteto"})
    assert resp.status_code == 201
    return resp.json()


def test_listar_clientes_vazio(auth_client):
    arquiteto = _criar_arquiteto(auth_client)
    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/clientes")
    assert resp.status_code == 200
    assert resp.json() == []


def test_criar_cliente_vinculado_e_listar(auth_client):
    arquiteto = _criar_arquiteto(auth_client)

    resp_cliente = auth_client.post("/api/v1/clientes/", json={
        "nome": "Cliente Indicado", "telefone": "11999990000", "arquiteto_id": arquiteto["id"],
    })
    assert resp_cliente.status_code == 201
    assert resp_cliente.json()["arquiteto_id"] == arquiteto["id"]

    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/clientes")
    assert resp.status_code == 200
    nomes = [c["nome"] for c in resp.json()]
    assert nomes == ["Cliente Indicado"]


def test_listar_clientes_nao_mistura_outro_arquiteto(auth_client):
    arquiteto1 = _criar_arquiteto(auth_client, "Arq 1")
    arquiteto2 = _criar_arquiteto(auth_client, "Arq 2")
    auth_client.post("/api/v1/clientes/", json={"nome": "Do Arq 1", "telefone": "11900000001", "arquiteto_id": arquiteto1["id"]})
    auth_client.post("/api/v1/clientes/", json={"nome": "Do Arq 2", "telefone": "11900000002", "arquiteto_id": arquiteto2["id"]})

    resp = auth_client.get(f"/api/v1/arquitetos/{arquiteto1['id']}/clientes")
    nomes = [c["nome"] for c in resp.json()]
    assert nomes == ["Do Arq 1"]


def test_listar_clientes_arquiteto_inexistente_404(auth_client):
    resp = auth_client.get("/api/v1/arquitetos/9999/clientes")
    assert resp.status_code == 404
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/test_arquitetos_clientes.py -v`
Expected: FAIL — `422` no POST de cliente (campo `arquiteto_id` não existe em `ClienteCreate`) e `404` na rota de listagem (ainda não existe).

- [ ] **Step 3: Adicionar a coluna e o relationship no model**

Em `backend/app/models/crm.py`, na classe `Cliente`, trocar:

```python
    is_active = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    projetos = relationship("Projeto", back_populates="cliente")
```

por:

```python
    arquiteto_id = Column(Integer, ForeignKey("arquitetos.id"), nullable=True)

    is_active = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    projetos = relationship("Projeto", back_populates="cliente")
    arquiteto = relationship("Arquiteto", foreign_keys=[arquiteto_id])
```

- [ ] **Step 4: Adicionar o campo nos schemas de Cliente**

Em `backend/app/schemas/crm.py`, em `ClienteCreate`, trocar:

```python
    tipo: TipoCliente = TipoCliente.PESSOA_FISICA
```

por:

```python
    tipo: TipoCliente = TipoCliente.PESSOA_FISICA
    arquiteto_id: Optional[int] = None
```

Em `ClienteResponse`, trocar:

```python
    tipo: TipoCliente
    cadastro_aprovado: bool
    criado_em: datetime
```

por:

```python
    tipo: TipoCliente
    cadastro_aprovado: bool
    arquiteto_id: Optional[int]
    criado_em: datetime
```

- [ ] **Step 5: Adicionar o endpoint em `arquitetos.py`**

Adicionar ao import de `app.models.crm` (topo do arquivo) o nome `Cliente`, e ao import de `app.schemas.crm` o nome `ClienteResponse`:

```python
from app.models.crm import Arquiteto, DecisorArquiteto, ConcorrenteArquiteto, TipoEspecificador, StatusCarteiraEspecificador, HistoricoDonoArquiteto, InteracaoArquiteto, MetaVisitasConsultor, Cliente
```

```python
from app.schemas.crm import (
    ArquitetoCreate, ArquitetoUpdate, ArquitetoResponse,
    DecisorArquitetoCreate, DecisorArquitetoResponse,
    ConcorrenteArquitetoCreate, ConcorrenteArquitetoResponse,
    ArquitetoScoreResponse, ArquitetoDonoUpdate, HistoricoDonoResponse,
    InteracaoArquitetoCreate, InteracaoArquitetoResponse,
    EspecificadoresKpiResponse,
    MetaVisitasUpsert, MetaVisitasResponse, MinhaMetaResponse,
    ClienteResponse,
)
```

Adicionar, logo após o bloco `# === INTERAÇÕES ===` no final do arquivo:

```python
# === CLIENTES VINCULADOS ===

@router.get("/{arquiteto_id}/clientes", response_model=List[ClienteResponse])
def listar_clientes_do_arquiteto(
    arquiteto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_arquiteto_ou_404(arquiteto_id, db)
    return (
        db.query(Cliente)
        .filter(Cliente.arquiteto_id == arquiteto_id)
        .order_by(Cliente.nome)
        .all()
    )
```

- [ ] **Step 6: Rodar a suíte completa**

Run: `cd backend && python -m pytest -q`
Expected: PASS — 141 testes.

- [ ] **Step 7: Commit**

```bash
git add backend/app/models/crm.py backend/app/schemas/crm.py backend/app/api/v1/endpoints/arquitetos.py backend/tests/test_arquitetos_clientes.py
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add Cliente.arquiteto_id e GET /arquitetos/{id}/clientes

Portado de origin/feature/arch. Rastreia quais clientes vieram de qual
especificador. Aditivo — nao muda POST/PATCH /clientes/ existentes,
so ganham o campo opcional novo via model_dump() generico.
EOF
)"
```

---

## Task 4: `responsavel_nome` em `InteracaoArquiteto` + taxonomia unificada

**Files:**
- Modify: `backend/app/models/crm.py` (`InteracaoArquiteto`, propriedade `responsavel_nome`)
- Modify: `backend/app/schemas/crm.py` (`InteracaoArquitetoResponse`)
- Modify: `backend/app/api/v1/endpoints/arquitetos.py` (eager-load em `listar_interacoes_arquiteto`)
- Modify: `backend/tests/test_arquitetos_interacoes.py`

**Interfaces:**
- Produces: `InteracaoArquiteto.responsavel_nome: Optional[str]` (property), `InteracaoArquitetoResponse.responsavel_nome: Optional[str]` — necessário pro frontend portado de `feature/arch` (que exibe "por {nome}" em cada interação) sem depender de `GET /users/`, restrito a gestão.

> Nota: `InteracaoArquiteto.tipo` continua `String(50)` livre — nenhuma migration de schema aqui. Os 4 novos valores da taxonomia unificada (`visita_escritorio` já existia como `visita`; somam-se `visita_loja`, `evento`, `viagem`, `envio_brinde`) são só documentação/comentário e validação no frontend, não constraint de banco.

- [ ] **Step 1: Escrever o teste que falha**

Adicionar ao final de `backend/tests/test_arquitetos_interacoes.py`:

```python
def test_interacao_traz_responsavel_nome(auth_client):
    arquiteto = _criar_arquiteto(auth_client)
    resp = auth_client.post(
        f"/api/v1/arquitetos/{arquiteto['id']}/interacoes",
        json={"tipo": "visita_loja", "resumo": "Especificador veio conhecer o showroom"},
    )
    assert resp.status_code == 201
    assert resp.json()["responsavel_nome"] is not None

    listagem = auth_client.get(f"/api/v1/arquitetos/{arquiteto['id']}/interacoes").json()
    assert listagem[0]["responsavel_nome"] == resp.json()["responsavel_nome"]
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/test_arquitetos_interacoes.py -v`
Expected: FAIL — `KeyError: 'responsavel_nome'`, campo ainda não existe na resposta.

- [ ] **Step 3: Adicionar a propriedade no model**

Em `backend/app/models/crm.py`, na classe `InteracaoArquiteto`, trocar:

```python
    tipo = Column(String(50), nullable=False)  # ligacao, whatsapp, email, visita, reuniao
    resumo = Column(Text, nullable=False)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)  # rastreabilidade: interação → lead gerado
    data = Column(DateTime(timezone=True), server_default=func.now())

    arquiteto = relationship("Arquiteto", foreign_keys=[arquiteto_id])
    responsavel = relationship("User", foreign_keys=[responsavel_id])
    lead = relationship("Lead", foreign_keys=[lead_id])

    def __repr__(self):
        return f"<InteracaoArquiteto {self.tipo} [arquiteto={self.arquiteto_id}]>"
```

por:

```python
    # ligacao, whatsapp, email, visita_escritorio, visita_loja, reuniao, evento, viagem, envio_brinde
    tipo = Column(String(50), nullable=False)
    resumo = Column(Text, nullable=False)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)  # rastreabilidade: interação → lead gerado
    data = Column(DateTime(timezone=True), server_default=func.now())

    arquiteto = relationship("Arquiteto", foreign_keys=[arquiteto_id])
    responsavel = relationship("User", foreign_keys=[responsavel_id])
    lead = relationship("Lead", foreign_keys=[lead_id])

    @property
    def responsavel_nome(self) -> Optional[str]:
        return self.responsavel.nome if self.responsavel else None

    def __repr__(self):
        return f"<InteracaoArquiteto {self.tipo} [arquiteto={self.arquiteto_id}]>"
```

(`Optional` já foi importado no topo do arquivo na Task 1 do plano de backend anterior — `from typing import Optional`. Se este plano estiver rodando sobre um checkout que não teve aquele plano executado, adicionar o import agora.)

- [ ] **Step 4: Adicionar o campo no schema**

Em `backend/app/schemas/crm.py`, em `InteracaoArquitetoResponse`, trocar:

```python
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

por:

```python
class InteracaoArquitetoResponse(BaseModel):
    id: int
    arquiteto_id: int
    responsavel_id: int
    responsavel_nome: Optional[str]
    tipo: str
    resumo: str
    lead_id: Optional[int]
    data: datetime

    class Config:
        from_attributes = True
```

- [ ] **Step 5: Eager-load do relationship em `listar_interacoes_arquiteto`**

Em `backend/app/api/v1/endpoints/arquitetos.py`, trocar o corpo de `listar_interacoes_arquiteto`:

```python
    _get_arquiteto_ou_404(arquiteto_id, db)
    return (
        db.query(InteracaoArquiteto)
        .filter(InteracaoArquiteto.arquiteto_id == arquiteto_id)
        .order_by(InteracaoArquiteto.data.desc(), InteracaoArquiteto.id.desc())
        .all()
    )
```

por:

```python
    _get_arquiteto_ou_404(arquiteto_id, db)
    return (
        db.query(InteracaoArquiteto)
        .options(joinedload(InteracaoArquiteto.responsavel))
        .filter(InteracaoArquiteto.arquiteto_id == arquiteto_id)
        .order_by(InteracaoArquiteto.data.desc(), InteracaoArquiteto.id.desc())
        .all()
    )
```

(`joinedload` já está importado no arquivo desde o fix do N+1 de `historico_dono`.)

- [ ] **Step 6: Rodar a suíte completa**

Run: `cd backend && python -m pytest -q`
Expected: PASS — 142 testes.

- [ ] **Step 7: Commit**

```bash
git add backend/app/models/crm.py backend/app/schemas/crm.py backend/app/api/v1/endpoints/arquitetos.py backend/tests/test_arquitetos_interacoes.py
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
feat: add responsavel_nome em InteracaoArquiteto, documenta taxonomia unificada

Necessario pro frontend portado de feature/arch exibir "por {nome}" sem
depender de GET /users/ (restrito a gestao). tipo continua String livre;
o comentario na coluna documenta os 9 valores da uniao das duas branches.
EOF
)"
```

---

## Task 5: KPIs e meta de visitas passam a ler `visita_escritorio`

**Files:**
- Modify: `backend/app/api/v1/endpoints/arquitetos.py` (`kpis_especificadores`, `minha_meta_visitas`)
- Modify: `backend/tests/test_arquitetos_kpis.py`
- Modify: `backend/tests/test_arquitetos_metas_visitas.py`

**Interfaces:**
- Consumes: `InteracaoArquiteto.tipo` (agora aceita `visita_escritorio`/`visita_loja` em vez de só `visita`, Task 4).
- Produces: nenhuma interface nova — só corrige a leitura dos dois endpoints existentes pra não ficarem "cegos" pro valor novo.

> Contexto (ver spec de reconciliação, seção 3): como `visita` virou dois valores (`visita_escritorio`, `visita_loja`), `visitas_escritorio_mes`/`visitas_realizadas_mes` passam a contar só `visita_escritorio` — é literalmente "o especificador foi visitado no escritório dele". `atendimentos_mes` passa a contar tudo que não é `visita_escritorio`, incluindo agora `visita_loja` (o especificador visitando a nossa loja é um atendimento nosso a ele).

- [ ] **Step 1: Atualizar os testes existentes que quebram com o valor antigo**

Em `backend/tests/test_arquitetos_kpis.py`, na função `test_kpis_atendimentos_e_visitas_mes`, trocar todo `tipo="visita"` por `tipo="visita_escritorio"` (são 3 ocorrências: duas nas interações "visitas do mês" e uma na interação "mês passado").

Em `backend/tests/test_arquitetos_metas_visitas.py`, na função `test_minha_meta_com_progresso`, trocar todo `tipo="visita"` por `tipo="visita_escritorio"` (mesmas 3 ocorrências).

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/test_arquitetos_kpis.py tests/test_arquitetos_metas_visitas.py -v`
Expected: FAIL — os asserts de contagem não batem mais, porque o endpoint ainda filtra por `"visita"` e os testes agora inserem `"visita_escritorio"`.

- [ ] **Step 3: Atualizar `kpis_especificadores`**

Em `backend/app/api/v1/endpoints/arquitetos.py`, trocar:

```python
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
```

por:

```python
    atendimentos_mes = (
        db.query(InteracaoArquiteto)
        .filter(InteracaoArquiteto.data >= inicio_mes, InteracaoArquiteto.tipo != "visita_escritorio")
        .count()
    )
    visitas_escritorio_mes = (
        db.query(InteracaoArquiteto)
        .filter(InteracaoArquiteto.data >= inicio_mes, InteracaoArquiteto.tipo == "visita_escritorio")
        .count()
    )
```

- [ ] **Step 4: Atualizar `minha_meta_visitas`**

Trocar:

```python
    visitas_realizadas = (
        db.query(InteracaoArquiteto)
        .filter(
            InteracaoArquiteto.responsavel_id == current_user.id,
            InteracaoArquiteto.tipo == "visita",
            InteracaoArquiteto.data >= inicio_mes,
        )
        .count()
    )
```

por:

```python
    visitas_realizadas = (
        db.query(InteracaoArquiteto)
        .filter(
            InteracaoArquiteto.responsavel_id == current_user.id,
            InteracaoArquiteto.tipo == "visita_escritorio",
            InteracaoArquiteto.data >= inicio_mes,
        )
        .count()
    )
```

- [ ] **Step 5: Rodar a suíte completa**

Run: `cd backend && python -m pytest -q`
Expected: PASS — 142 testes (mesmo total da Task 4 — esta task só corrige valor usado dentro de testes já existentes, não soma teste novo).

- [ ] **Step 6: Commit**

```bash
git add backend/app/api/v1/endpoints/arquitetos.py backend/tests/test_arquitetos_kpis.py backend/tests/test_arquitetos_metas_visitas.py
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
fix: KPIs e meta de visitas passam a contar visita_escritorio, nao visita

"visita" virou dois valores na taxonomia unificada de interacoes
(visita_escritorio, visita_loja). Sem este fix, os dois endpoints ficariam
sempre zerados pra visitas registradas apos a Task 4 deste plano.
EOF
)"
```

---

## Task 6: Fix de timezone naive/aware em `calcular_score`

**Files:**
- Modify: `backend/app/services/arquiteto_score.py`
- Create: `backend/tests/test_arquiteto_score_timezone.py`

**Interfaces:**
- Consumes: nenhuma interface nova.
- Produces: `calcular_score` passa a normalizar todo datetime lido do banco pra timezone-aware antes de comparar com `agora` — não muda o formato de retorno.

> Contexto (ver spec de reconciliação, achado à parte): Postgres devolve datetime timezone-aware pra colunas `DateTime(timezone=True)`; SQLite (usado nos testes) devolve naive independente da declaração da coluna. `datetime.utcnow()` é sempre naive. Comparar os dois levanta `TypeError: can't subtract offset-naive and offset-aware datetimes` — só acontece em produção (Postgres), nunca nos testes locais, por isso ninguém pegou isso antes. Fix portado de `origin/feature/arch`, que já resolveu isso (só dentro deste arquivo).

- [ ] **Step 1: Escrever o teste que falha**

Criar `backend/tests/test_arquiteto_score_timezone.py`:

```python
from datetime import datetime, timedelta, timezone
from app.models.crm import Arquiteto, InteracaoArquiteto
from app.services.arquiteto_score import calcular_score


def test_calcular_score_nao_quebra_com_datetime_timezone_aware(db_session, diretoria_user):
    """
    Regressao: simula o que o Postgres real devolve (datetime timezone-aware)
    pra colunas DateTime(timezone=True) — o SQLite dos testes devolve naive
    por padrao, entao sem isso o bug nunca aparece localmente, só em producao.
    """
    agora_aware = datetime.now(timezone.utc)

    arquiteto = Arquiteto(nome="TZ Test", tipo="arquiteto", is_active=True)
    db_session.add(arquiteto)
    db_session.commit()
    db_session.refresh(arquiteto)

    db_session.add(InteracaoArquiteto(
        arquiteto_id=arquiteto.id, responsavel_id=diretoria_user.id,
        tipo="ligacao", resumo="Contato", data=agora_aware - timedelta(days=5),
    ))
    db_session.commit()
    db_session.refresh(arquiteto)

    # Simula o retorno timezone-aware do Postgres sobrescrevendo em memoria
    # (SQLite ja teria devolvido naive no refresh acima).
    arquiteto.criado_em = agora_aware - timedelta(days=100)

    resultado = calcular_score(db_session, arquiteto)  # não pode levantar TypeError

    assert resultado["score_geral"] >= 0
    assert resultado["detalhes"]["meses_desde_cadastro"] >= 3
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `cd backend && python -m pytest tests/test_arquiteto_score_timezone.py -v`
Expected: FAIL — `TypeError: can't subtract offset-naive and offset-aware datetimes`.

- [ ] **Step 3: Adicionar o helper `_utc` e trocar `datetime.utcnow()`**

Em `backend/app/services/arquiteto_score.py`, trocar o import do topo:

```python
from datetime import datetime, timedelta
```

por:

```python
from datetime import datetime, timedelta, timezone
```

Adicionar, logo antes de `def meses_entre(...)`:

```python
def _utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Normaliza para timezone-aware UTC. SQLite (usado nos testes) devolve datetimes
    naive mesmo para colunas `DateTime(timezone=True)`; Postgres devolve aware. Sem isso,
    subtrair/comparar com `agora` (aware) explode com `TypeError` num dos dois ambientes."""
    if dt is None:
        return None
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)


def meses_entre(inicio: Optional[datetime], fim: datetime) -> int:
```

(a linha `def meses_entre(...)` já existe — só adicionar o `_utc` imediatamente antes dela, sem duplicar a definição existente.)

- [ ] **Step 4: Aplicar `_utc()` em todos os pontos de `calcular_score` que leem datetime do banco**

Dentro de `calcular_score`, trocar:

```python
def calcular_score(db: Session, arquiteto: Arquiteto) -> Dict[str, Any]:
    agora = datetime.utcnow()
    limite_12_meses = agora - timedelta(days=365)
```

por:

```python
def calcular_score(db: Session, arquiteto: Arquiteto) -> Dict[str, Any]:
    agora = datetime.now(timezone.utc)
    limite_12_meses = agora - timedelta(days=365)
```

Trocar:

```python
    datas_interacoes = [i.data for i in interacoes if i.data]
    ultima_interacao_em = max(datas_interacoes) if datas_interacoes else None
    dias_desde_ultima_interacao = (agora - ultima_interacao_em).days if ultima_interacao_em else None

    projetos_12m = [p for p in projetos if p.criado_em and p.criado_em >= limite_12_meses]

    datas_projetos = [p.criado_em for p in projetos if p.criado_em]
    ultimo_projeto_em = max(datas_projetos) if datas_projetos else None
    dias_desde_ultimo_projeto = (agora - ultimo_projeto_em).days if ultimo_projeto_em else None

    datas_leads = [l.criado_em for l in leads if l.criado_em]
```

por:

```python
    datas_interacoes = [_utc(i.data) for i in interacoes if i.data]
    ultima_interacao_em = max(datas_interacoes) if datas_interacoes else None
    dias_desde_ultima_interacao = (agora - ultima_interacao_em).days if ultima_interacao_em else None

    projetos_12m = [p for p in projetos if p.criado_em and _utc(p.criado_em) >= limite_12_meses]

    datas_projetos = [_utc(p.criado_em) for p in projetos if p.criado_em]
    ultimo_projeto_em = max(datas_projetos) if datas_projetos else None
    dias_desde_ultimo_projeto = (agora - ultimo_projeto_em).days if ultimo_projeto_em else None

    datas_leads = [_utc(l.criado_em) for l in leads if l.criado_em]
```

Trocar:

```python
    dias_desde_cadastro = (agora - arquiteto.criado_em).days if arquiteto.criado_em else 0
```

por:

```python
    dias_desde_cadastro = (agora - _utc(arquiteto.criado_em)).days if arquiteto.criado_em else 0
```

- [ ] **Step 5: Rodar o teste de regressão e confirmar que passa**

Run: `cd backend && python -m pytest tests/test_arquiteto_score_timezone.py -v`
Expected: PASS.

- [ ] **Step 6: Rodar a suíte completa**

Run: `cd backend && python -m pytest -q`
Expected: PASS — 143 testes.

- [ ] **Step 7: Commit**

```bash
git add backend/app/services/arquiteto_score.py backend/tests/test_arquiteto_score_timezone.py
git commit --author="Thiago Ribeiro <thiaguim.16@gmail.com>" -m "$(cat <<'EOF'
fix: normaliza datetime naive/aware em calcular_score

Postgres devolve timezone-aware pra DateTime(timezone=True); SQLite (usado
nos testes) devolve naive independente da coluna — o bug so aparece em
producao. Fix portado de origin/feature/arch, escopo restrito a este
arquivo (fix do mesmo padrao no resto do backend fica pra tarefa separada,
ver spec de reconciliacao).
EOF
)"
```

---

## Task 7: Push da branch e checagem final

**Files:** nenhum.

- [ ] **Step 1: Suíte completa uma última vez**

Run: `cd backend && python -m pytest -q`
Expected: PASS — 143 testes.

- [ ] **Step 2: Conferir `git log` da branch nova**

Run: `git log --oneline feature/especificadores..feature/especificadores-reconciliado`
Expected: 6 commits (Tasks 1–6), todos com `Thiago Ribeiro <thiaguim.16@gmail.com>`.

- [ ] **Step 3: Push**

```bash
git push origin feature/especificadores-reconciliado -u
```
Expected: branch nova criada no GitHub (não sobrescreve nada — `feature/especificadores` e `feature/arch` continuam intactas).

- [ ] **Step 4: Próximo passo**

Backend da reconciliação está completo. O plano de frontend (`docs/superpowers/plans/2026-07-24-especificadores-reconciliacao-frontend.md`) parte deste ponto — usa os 4 arquivos de `origin/feature/arch/frontend/src/pages/especificadores/` como base e os adapta às mudanças deste plano (principalmente: `consultor_id`/`consultor_nome` em vez de `vendedor_id`/`vendedor_nome`, e os campos/endpoints novos das Tasks 1–5 acima).
