# Comissões, Bônus e Benefícios na aba Remuneração — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar lançamento manual de comissão, bônus e benefícios à aba Remuneração do módulo Colaboradores, substituindo o campo genérico `remuneracao_complementar` por estruturas próprias, sem motor de cálculo automático (fica para o RH02, quando existir).

**Architecture:** Backend: 2 tabelas novas (`BeneficioColaborador` + `HistoricoBeneficioColaborador` para itens de benefício com histórico imutável de valor; `LancamentoRemuneracaoVariavel` com campo `tipo` para bônus e comissão mensal, também imutável), mais 3 campos novos em `Colaborador` para a regra contratual de comissão (`tipo_comissao`, `valor_comissao`, `observacoes_comissao`, editáveis via `PUT` normal). Frontend: `RemuneracaoTab` (`ColaboradorTabs.jsx`) ganha 3 seções novas (Comissão, Bônus, Benefícios) abaixo do bloco de salário/contrato existente, visíveis para CLT e PJ.

**Tech Stack:** FastAPI + SQLAlchemy 2.0 + Pydantic v2 (backend), React 19 + Axios (frontend), pytest + SQLite in-memory (testes backend).

## Global Constraints

- Só os perfis `RH` e `DIRETORIA` acessam qualquer endpoint deste módulo — todo endpoint novo usa `Depends(require_roles(*_ROLES_MODULO))`, `_ROLES_MODULO` já definido em `app/api/v1/endpoints/colaboradores.py`.
- Toda tabela de histórico é imutável — só `POST` (criar) e `GET` (listar), nunca `PUT`/`DELETE`, mesmo padrão de `HistoricoSalarialColaborador`/`HistoricoCargoColaborador`.
- Valores monetários no backend usam `Float` (SQLAlchemy) e `float` (Pydantic) — não `Numeric` — seguindo o padrão já existente no arquivo (`salario_clt`, `pj_valor_mensal` etc.), mesmo que o spec de design mencione `Numeric` no pseudocódigo.
- Testes backend usam a fixture `auth_client` (perfil `DIRETORIA`, ver `tests/conftest.py`) contra SQLite em memória; reaproveitar os helpers `_criar_departamento_e_cargo` e `_payload_base` já existentes em `tests/test_colaboradores_cadastro.py`.
- Frontend não tem framework de teste automatizado — verificação é `npm run lint`, `npm run build` e teste manual no navegador (`npm run dev`), conforme CLAUDE.md.
- Frontend segue o padrão visual já existente do módulo: classes `.input`, `.label`, `.btn-primary`, `.btn-secondary`, `.btn-sm`, componentes `Modal`/`Spinner` de `components/ui`, helper local `extractErrorMessage` já definido no topo de `ColaboradorTabs.jsx`.
- Spec de referência: `docs/superpowers/specs/2026-08-02-colaboradores-remuneracao-variavel-design.md`.

---

## Task 1: Remove `remuneracao_complementar`, adiciona regra de comissão ao `Colaborador`

**Files:**
- Modify: `backend/app/models/colaborador.py`
- Modify: `backend/app/schemas/colaborador.py`
- Modify: `backend/app/api/v1/endpoints/colaboradores.py`
- Modify: `backend/tests/test_colaboradores_historico_salarial.py`
- Modify: `backend/tests/test_colaboradores_cadastro.py`
- Test: `backend/tests/test_colaboradores_historico_salarial.py`, `backend/tests/test_colaboradores_cadastro.py`

**Interfaces:**
- Produces: `Colaborador.tipo_comissao` (`Optional[str]`, valores `"fixo"|"percentual"|"por_meta"`), `Colaborador.valor_comissao` (`Optional[float]`), `Colaborador.observacoes_comissao` (`Optional[str]`) — expostos em `ColaboradorResponse` e editáveis via `PUT /colaboradores/{id}`. Consumidos pela Task 5 (frontend, seção Comissão).
- Consumes: nada de tasks anteriores (primeira task do plano).

- [ ] **Step 1: Remover os testes obsoletos de `remuneracao_complementar`**

Em `backend/tests/test_colaboradores_historico_salarial.py`, remover por completo o helper `_criar_com_complementar` e as 4 funções de teste que dependem dele:
- `_criar_com_complementar`
- `test_lancar_salario_sem_complementar_preserva_valor_atual`
- `test_lancar_salario_com_complementar_atualiza_valor_atual`
- `test_lancar_salario_complementar_zero_e_respeitada`
- `test_lancamento_retroativo_preserva_complementar_atual`

O arquivo final deve manter apenas: `test_editar_colaborador_dados_basicos`, `test_editar_colaborador_nao_altera_salario_direto`, `test_lancar_novo_salario_atualiza_atual_e_grava_historico`, `test_lancamento_retroativo_nao_sobrescreve_salario_atual`, `test_lancar_salario_negativo_422`.

- [ ] **Step 2: Escrever o teste que falha para a regra de comissão**

Em `backend/tests/test_colaboradores_cadastro.py`, adicionar (logo após `test_editar_colaborador_nao_altera_salario_direto`):

```python
def test_editar_regra_comissao(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    criado = auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()
    assert criado["tipo_comissao"] is None

    resp = auth_client.put(
        f"/api/v1/colaboradores/{criado['id']}",
        json={
            "tipo_comissao": "por_meta",
            "valor_comissao": 5.0,
            "observacoes_comissao": "5% sobre vendas acima da meta mensal",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["tipo_comissao"] == "por_meta"
    assert data["valor_comissao"] == 5.0
    assert data["observacoes_comissao"] == "5% sobre vendas acima da meta mensal"
```

- [ ] **Step 3: Rodar os testes para confirmar a falha esperada**

Run: `cd backend && python -m pytest tests/test_colaboradores_cadastro.py::test_editar_regra_comissao tests/test_colaboradores_historico_salarial.py -v`
Expected: `test_editar_regra_comissao` falha com `KeyError: 'tipo_comissao'` (o campo ainda não existe na resposta); os testes restantes de `test_colaboradores_historico_salarial.py` passam normalmente (não dependem do que foi removido).

- [ ] **Step 4: Remover `remuneracao_complementar` do model e adicionar os campos de comissão**

Em `backend/app/models/colaborador.py`, adicionar o enum `TipoComissao` junto aos demais enums do topo do arquivo (depois de `ModalidadeTrabalho`):

```python
class TipoComissao(str, enum.Enum):
    FIXO = "fixo"
    PERCENTUAL = "percentual"
    POR_META = "por_meta"
```

Na classe `Colaborador`, remover a linha `remuneracao_complementar = Column(Float, nullable=True)` e, no bloco "# Remuneração atual", adicionar logo abaixo de `data_vigencia_salario`:

```python
    # Comissão — regra contratual (cláusula); lançamentos mensais ficam em LancamentoRemuneracaoVariavel
    tipo_comissao = Column(SAEnum(TipoComissao), nullable=True)
    valor_comissao = Column(Float, nullable=True)
    observacoes_comissao = Column(Text, nullable=True)
```

Na classe `HistoricoSalarialColaborador`, remover a linha `remuneracao_complementar = Column(Float, nullable=True)`.

- [ ] **Step 5: Atualizar os schemas Pydantic**

Em `backend/app/schemas/colaborador.py`, atualizar o import do topo:

```python
from app.models.colaborador import RegimeContratacao, ModalidadeTrabalho, TipoComissao
```

Em `ColaboradorCreate`: remover `remuneracao_complementar: Optional[float] = Field(default=None, ge=0)` e adicionar, no mesmo bloco de remuneração:

```python
    tipo_comissao: Optional[TipoComissao] = None
    valor_comissao: Optional[float] = Field(default=None, ge=0)
    observacoes_comissao: Optional[str] = None
```

Em `ColaboradorUpdate`: adicionar os mesmos três campos (`tipo_comissao`, `valor_comissao`, `observacoes_comissao`, todos `Optional`, sem `remuneracao_complementar` — esse schema nunca teve o campo).

Em `ColaboradorResponse`: remover `remuneracao_complementar: Optional[float]` e adicionar `tipo_comissao: Optional[TipoComissao]`, `valor_comissao: Optional[float]`, `observacoes_comissao: Optional[str]`.

Em `HistoricoSalarialCreate` e `HistoricoSalarialResponse`: remover o campo `remuneracao_complementar` de ambos.

- [ ] **Step 6: Atualizar os endpoints que referenciam `remuneracao_complementar`**

Em `backend/app/api/v1/endpoints/colaboradores.py`, em `criar_colaborador`, remover a linha `remuneracao_complementar=colaborador.remuneracao_complementar,` de dentro do `HistoricoSalarialColaborador(...)`.

Em `lancar_historico_salarial`, remover o bloco:

```python
        # Carry-forward: complementar omitida no payload não zera o valor atual.
        if payload.remuneracao_complementar is not None:
            colaborador.remuneracao_complementar = payload.remuneracao_complementar
```

(mantendo as duas linhas de `colaborador.salario_clt = ...` e `colaborador.data_vigencia_salario = ...` que ficam antes/depois desse bloco).

- [ ] **Step 7: Rodar os testes para confirmar que passam**

Run: `cd backend && python -m pytest tests/test_colaboradores_cadastro.py tests/test_colaboradores_historico_salarial.py -v`
Expected: PASS em todos.

- [ ] **Step 8: Commit**

```bash
git add app/models/colaborador.py app/schemas/colaborador.py app/api/v1/endpoints/colaboradores.py tests/test_colaboradores_historico_salarial.py tests/test_colaboradores_cadastro.py
git commit -m "feat: regra de comissao no cadastro do colaborador, remove remuneracao_complementar"
```

---

## Task 2: Benefícios — modelo, schema, endpoints e testes

**Files:**
- Modify: `backend/app/models/colaborador.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/schemas/colaborador.py`
- Modify: `backend/app/api/v1/endpoints/colaboradores.py`
- Create: `backend/tests/test_colaboradores_beneficios.py`

**Interfaces:**
- Consumes: `_get_colaborador_ou_404` (já existe em `colaboradores.py`), helpers `_criar_departamento_e_cargo`/`_payload_base` de `tests/test_colaboradores_cadastro.py`.
- Produces: endpoints `POST/GET /colaboradores/{id}/beneficios`, `PUT /colaboradores/{id}/beneficios/{beneficio_id}`, `POST/GET /colaboradores/{id}/beneficios/{beneficio_id}/historico`. Consumidos pela Task 7 (frontend, seção Benefícios).

- [ ] **Step 1: Escrever os testes que falham**

Criar `backend/tests/test_colaboradores_beneficios.py`:

```python
from tests.test_colaboradores_cadastro import _criar_departamento_e_cargo, _payload_base


def _criar_colaborador(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    return auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()


def test_criar_beneficio_grava_historico_inicial(auth_client):
    colaborador = _criar_colaborador(auth_client)

    resp = auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios",
        json={"nome": "Vale-Refeição", "valor": 600.0, "data_vigencia": "2024-01-10", "motivo": "Cadastro inicial"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["nome"] == "Vale-Refeição"
    assert data["valor"] == 600.0
    assert data["ativo"] is True

    historico = auth_client.get(f"/api/v1/colaboradores/{colaborador['id']}/beneficios/{data['id']}/historico").json()
    assert len(historico) == 1
    assert historico[0]["valor"] == 600.0
    assert historico[0]["motivo"] == "Cadastro inicial"


def test_listar_beneficios(auth_client):
    colaborador = _criar_colaborador(auth_client)
    auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios",
        json={"nome": "Vale-Refeição", "valor": 600.0, "data_vigencia": "2024-01-10", "motivo": "Cadastro inicial"},
    )
    auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios",
        json={"nome": "Plano de Saúde", "valor": 300.0, "data_vigencia": "2024-01-10", "motivo": "Cadastro inicial"},
    )

    resp = auth_client.get(f"/api/v1/colaboradores/{colaborador['id']}/beneficios")
    assert resp.status_code == 200
    nomes = [b["nome"] for b in resp.json()]
    assert nomes == ["Plano de Saúde", "Vale-Refeição"]  # ordenado por nome


def test_editar_beneficio_nome_e_ativo_nao_altera_valor(auth_client):
    colaborador = _criar_colaborador(auth_client)
    beneficio = auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios",
        json={"nome": "Vale-Refeição", "valor": 600.0, "data_vigencia": "2024-01-10", "motivo": "Cadastro inicial"},
    ).json()

    resp = auth_client.put(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios/{beneficio['id']}",
        json={"nome": "Vale-Refeição Flex", "ativo": False, "valor": 9999.0},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["nome"] == "Vale-Refeição Flex"
    assert data["ativo"] is False
    assert data["valor"] == 600.0  # "valor" não existe em BeneficioUpdate — ignorado


def test_ajustar_valor_beneficio_atualiza_atual_e_grava_historico(auth_client):
    colaborador = _criar_colaborador(auth_client)
    beneficio = auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios",
        json={"nome": "Plano de Saúde", "valor": 300.0, "data_vigencia": "2024-01-10", "motivo": "Cadastro inicial"},
    ).json()

    resp = auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios/{beneficio['id']}/historico",
        json={"valor": 350.0, "data_vigencia": "2025-01-01", "motivo": "Reajuste anual do plano"},
    )
    assert resp.status_code == 201

    atualizado = auth_client.get(f"/api/v1/colaboradores/{colaborador['id']}/beneficios").json()
    beneficio_atualizado = next(b for b in atualizado if b["id"] == beneficio["id"])
    assert beneficio_atualizado["valor"] == 350.0

    historico = auth_client.get(f"/api/v1/colaboradores/{colaborador['id']}/beneficios/{beneficio['id']}/historico").json()
    assert len(historico) == 2
    assert historico[0]["valor"] == 350.0  # mais recente primeiro


def test_ajuste_retroativo_nao_sobrescreve_valor_atual(auth_client):
    colaborador = _criar_colaborador(auth_client)
    beneficio = auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios",
        json={"nome": "Plano de Saúde", "valor": 300.0, "data_vigencia": "2024-01-10", "motivo": "Cadastro inicial"},
    ).json()
    auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios/{beneficio['id']}/historico",
        json={"valor": 350.0, "data_vigencia": "2025-06-01", "motivo": "Reajuste junho"},
    )

    auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios/{beneficio['id']}/historico",
        json={"valor": 320.0, "data_vigencia": "2025-01-01", "motivo": "Correção retroativa"},
    )

    atualizado = auth_client.get(f"/api/v1/colaboradores/{colaborador['id']}/beneficios").json()
    beneficio_atualizado = next(b for b in atualizado if b["id"] == beneficio["id"])
    assert beneficio_atualizado["valor"] == 350.0  # continua o mais recente


def test_valor_beneficio_zero_ou_negativo_422(auth_client):
    colaborador = _criar_colaborador(auth_client)
    resp = auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/beneficios",
        json={"nome": "Vale-Refeição", "valor": 0, "data_vigencia": "2024-01-10", "motivo": "Cadastro inicial"},
    )
    assert resp.status_code == 422
```

- [ ] **Step 2: Rodar os testes para confirmar a falha esperada**

Run: `cd backend && python -m pytest tests/test_colaboradores_beneficios.py -v`
Expected: FAIL em todos com `404 Not Found` (rotas `/beneficios` ainda não existem).

- [ ] **Step 3: Adicionar os models**

Em `backend/app/models/colaborador.py`, adicionar após a classe `HistoricoSalarialColaborador`:

```python
class BeneficioColaborador(Base):
    __tablename__ = "beneficios_colaboradores"

    id = Column(Integer, primary_key=True, index=True)
    colaborador_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=False)
    nome = Column(String(150), nullable=False)
    valor = Column(Float, nullable=False)  # valor atual, denormalizado — trilha em HistoricoBeneficioColaborador
    data_vigencia_atual = Column(Date, nullable=True)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())


class HistoricoBeneficioColaborador(Base):
    __tablename__ = "historico_beneficios_colaboradores"

    id = Column(Integer, primary_key=True, index=True)
    beneficio_id = Column(Integer, ForeignKey("beneficios_colaboradores.id"), nullable=False)
    valor = Column(Float, nullable=False)
    data_vigencia = Column(Date, nullable=False)
    motivo = Column(String(300), nullable=False)
    registrado_por_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    registrado_por = relationship("User", foreign_keys=[registrado_por_id])

    @property
    def registrado_por_nome(self):
        return self.registrado_por.nome if self.registrado_por else None
```

Em `backend/app/models/__init__.py`, atualizar o import e o `__all__`:

```python
from app.models.colaborador import (
    Departamento, Cargo, Colaborador,
    RegimeContratacao, ModalidadeTrabalho, TipoComissao,
    HistoricoSalarialColaborador, HistoricoCargoColaborador,
    DocumentoColaborador,
    BeneficioColaborador, HistoricoBeneficioColaborador,
)
```

E adicionar `"BeneficioColaborador", "HistoricoBeneficioColaborador"` (e `"TipoComissao"`, que ficou de fora na Task 1) à lista `__all__`.

- [ ] **Step 4: Adicionar os schemas**

Em `backend/app/schemas/colaborador.py`, adicionar (após a seção `# === HISTÓRICO SALARIAL ===`):

```python
# === BENEFÍCIOS ===

class BeneficioCreate(BaseModel):
    nome: str
    valor: float = Field(gt=0)
    data_vigencia: date
    motivo: str = "Cadastro inicial"


class BeneficioUpdate(BaseModel):
    nome: Optional[str] = None
    ativo: Optional[bool] = None


class BeneficioResponse(BaseModel):
    id: int
    colaborador_id: int
    nome: str
    valor: float
    data_vigencia_atual: Optional[date]
    ativo: bool
    criado_em: Optional[datetime]

    class Config:
        from_attributes = True


class HistoricoBeneficioCreate(BaseModel):
    valor: float = Field(gt=0)
    data_vigencia: date
    motivo: str


class HistoricoBeneficioResponse(BaseModel):
    id: int
    beneficio_id: int
    valor: float
    data_vigencia: date
    motivo: str
    registrado_por_id: int
    registrado_por_nome: Optional[str] = None
    criado_em: Optional[datetime]

    class Config:
        from_attributes = True
```

- [ ] **Step 5: Adicionar os endpoints**

Em `backend/app/api/v1/endpoints/colaboradores.py`, atualizar os imports do topo:

```python
from app.models.colaborador import (
    Departamento, Cargo, Colaborador, HistoricoSalarialColaborador, HistoricoCargoColaborador,
    DocumentoColaborador, RegimeContratacao,
    BeneficioColaborador, HistoricoBeneficioColaborador,
)
from app.schemas.colaborador import (
    DepartamentoCreate, DepartamentoUpdate, DepartamentoResponse,
    CargoCreate, CargoUpdate, CargoResponse,
    ColaboradorCreate, ColaboradorUpdate, ColaboradorResponse,
    HistoricoSalarialCreate, HistoricoSalarialResponse,
    HistoricoCargoCreate, HistoricoCargoResponse,
    DesligamentoRequest,
    DocumentoCreate, DocumentoResponse,
    BeneficioCreate, BeneficioUpdate, BeneficioResponse,
    HistoricoBeneficioCreate, HistoricoBeneficioResponse,
)
```

Adicionar as rotas (posicionar logo antes da seção `# === DOCUMENTOS ===`, próximo ao final do arquivo):

```python
# === BENEFÍCIOS ===

@router.post("/{colaborador_id}/beneficios", response_model=BeneficioResponse, status_code=201)
def criar_beneficio(
    colaborador_id: int,
    payload: BeneficioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    _get_colaborador_ou_404(colaborador_id, db)
    beneficio = BeneficioColaborador(
        colaborador_id=colaborador_id,
        nome=payload.nome,
        valor=payload.valor,
        data_vigencia_atual=payload.data_vigencia,
        ativo=True,
    )
    db.add(beneficio)
    db.flush()  # gera o id sem encerrar a transação — histórico entra no mesmo commit
    db.add(HistoricoBeneficioColaborador(
        beneficio_id=beneficio.id,
        valor=payload.valor,
        data_vigencia=payload.data_vigencia,
        motivo=payload.motivo,
        registrado_por_id=current_user.id,
    ))
    db.commit()
    db.refresh(beneficio)
    return beneficio


@router.get("/{colaborador_id}/beneficios", response_model=List[BeneficioResponse])
def listar_beneficios(
    colaborador_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    _get_colaborador_ou_404(colaborador_id, db)
    return (
        db.query(BeneficioColaborador)
        .filter(BeneficioColaborador.colaborador_id == colaborador_id)
        .order_by(BeneficioColaborador.nome)
        .all()
    )


@router.put("/{colaborador_id}/beneficios/{beneficio_id}", response_model=BeneficioResponse)
def atualizar_beneficio(
    colaborador_id: int,
    beneficio_id: int,
    payload: BeneficioUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    beneficio = _get_beneficio_ou_404(colaborador_id, beneficio_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(beneficio, field, value)
    db.commit()
    db.refresh(beneficio)
    return beneficio


@router.post("/{colaborador_id}/beneficios/{beneficio_id}/historico", response_model=HistoricoBeneficioResponse, status_code=201)
def lancar_historico_beneficio(
    colaborador_id: int,
    beneficio_id: int,
    payload: HistoricoBeneficioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    beneficio = _get_beneficio_ou_404(colaborador_id, beneficio_id, db)

    registro = HistoricoBeneficioColaborador(
        beneficio_id=beneficio_id,
        registrado_por_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(registro)

    e_mais_recente = (
        beneficio.data_vigencia_atual is None
        or payload.data_vigencia >= beneficio.data_vigencia_atual
    )
    if e_mais_recente:
        beneficio.valor = payload.valor
        beneficio.data_vigencia_atual = payload.data_vigencia

    db.commit()
    db.refresh(registro)
    return registro


@router.get("/{colaborador_id}/beneficios/{beneficio_id}/historico", response_model=List[HistoricoBeneficioResponse])
def listar_historico_beneficio(
    colaborador_id: int,
    beneficio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    _get_beneficio_ou_404(colaborador_id, beneficio_id, db)
    return (
        db.query(HistoricoBeneficioColaborador)
        .filter(HistoricoBeneficioColaborador.beneficio_id == beneficio_id)
        .order_by(HistoricoBeneficioColaborador.data_vigencia.desc(), HistoricoBeneficioColaborador.id.desc())
        .all()
    )


def _get_beneficio_ou_404(colaborador_id: int, beneficio_id: int, db: Session) -> BeneficioColaborador:
    beneficio = (
        db.query(BeneficioColaborador)
        .filter(BeneficioColaborador.id == beneficio_id, BeneficioColaborador.colaborador_id == colaborador_id)
        .first()
    )
    if not beneficio:
        raise HTTPException(404, "Benefício não encontrado")
    return beneficio
```

- [ ] **Step 6: Rodar os testes para confirmar que passam**

Run: `cd backend && python -m pytest tests/test_colaboradores_beneficios.py -v`
Expected: PASS em todos.

- [ ] **Step 7: Rodar a suíte completa do backend para checar regressão**

Run: `cd backend && python -m pytest -v`
Expected: PASS em todos (nenhuma quebra nos módulos existentes).

- [ ] **Step 8: Commit**

```bash
git add app/models/colaborador.py app/models/__init__.py app/schemas/colaborador.py app/api/v1/endpoints/colaboradores.py tests/test_colaboradores_beneficios.py
git commit -m "feat: cadastro de beneficios do colaborador com historico de ajuste de valor"
```

---

## Task 3: Bônus e comissão mensal (`LancamentoRemuneracaoVariavel`) — modelo, schema, endpoints e testes

**Files:**
- Modify: `backend/app/models/colaborador.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/schemas/colaborador.py`
- Modify: `backend/app/api/v1/endpoints/colaboradores.py`
- Create: `backend/tests/test_colaboradores_lancamentos_variaveis.py`

**Interfaces:**
- Consumes: `_get_colaborador_ou_404` (de `colaboradores.py`), helpers de `tests/test_colaboradores_cadastro.py`.
- Produces: endpoints `POST/GET /colaboradores/{id}/lancamentos-variaveis`. Consumidos pela Task 5 (seção Comissão) e Task 6 (seção Bônus) do frontend.

- [ ] **Step 1: Escrever os testes que falham**

Criar `backend/tests/test_colaboradores_lancamentos_variaveis.py`:

```python
from tests.test_colaboradores_cadastro import _criar_departamento_e_cargo, _payload_base


def _criar_colaborador(auth_client):
    dep, cargo = _criar_departamento_e_cargo(auth_client)
    return auth_client.post("/api/v1/colaboradores/", json=_payload_base(cargo["id"], dep["id"])).json()


def test_criar_lancamento_bonus(auth_client):
    colaborador = _criar_colaborador(auth_client)

    resp = auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/lancamentos-variaveis",
        json={"tipo": "bonus", "valor": 500.0, "competencia": "2025-06-15", "descricao": "Fechamento do mês"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["tipo"] == "bonus"
    assert data["valor"] == 500.0
    assert data["competencia"] == "2025-06-01"  # normalizado para o dia 1


def test_criar_lancamento_comissao(auth_client):
    colaborador = _criar_colaborador(auth_client)

    resp = auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/lancamentos-variaveis",
        json={"tipo": "comissao", "valor": 1200.0, "competencia": "2025-06-01", "descricao": "Meta 105% atingida"},
    )
    assert resp.status_code == 201
    assert resp.json()["tipo"] == "comissao"


def test_listar_lancamentos_filtra_por_tipo(auth_client):
    colaborador = _criar_colaborador(auth_client)
    auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/lancamentos-variaveis",
        json={"tipo": "bonus", "valor": 500.0, "competencia": "2025-06-01"},
    )
    auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/lancamentos-variaveis",
        json={"tipo": "comissao", "valor": 1200.0, "competencia": "2025-06-01"},
    )

    resp_todos = auth_client.get(f"/api/v1/colaboradores/{colaborador['id']}/lancamentos-variaveis")
    assert len(resp_todos.json()) == 2

    resp_bonus = auth_client.get(
        f"/api/v1/colaboradores/{colaborador['id']}/lancamentos-variaveis", params={"tipo": "bonus"}
    )
    assert len(resp_bonus.json()) == 1
    assert resp_bonus.json()[0]["tipo"] == "bonus"


def test_lancamento_variavel_valor_negativo_422(auth_client):
    colaborador = _criar_colaborador(auth_client)
    resp = auth_client.post(
        f"/api/v1/colaboradores/{colaborador['id']}/lancamentos-variaveis",
        json={"tipo": "bonus", "valor": -10.0, "competencia": "2025-06-01"},
    )
    assert resp.status_code == 422
```

- [ ] **Step 2: Rodar os testes para confirmar a falha esperada**

Run: `cd backend && python -m pytest tests/test_colaboradores_lancamentos_variaveis.py -v`
Expected: FAIL em todos com `404 Not Found`.

- [ ] **Step 3: Adicionar o model**

Em `backend/app/models/colaborador.py`, adicionar o enum junto aos demais do topo (depois de `TipoComissao`):

```python
class TipoLancamentoVariavel(str, enum.Enum):
    BONUS = "bonus"
    COMISSAO = "comissao"
```

E a classe, após `HistoricoBeneficioColaborador`:

```python
class LancamentoRemuneracaoVariavel(Base):
    __tablename__ = "lancamentos_remuneracao_variavel"

    id = Column(Integer, primary_key=True, index=True)
    colaborador_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=False)
    tipo = Column(SAEnum(TipoLancamentoVariavel), nullable=False)
    valor = Column(Float, nullable=False)
    competencia = Column(Date, nullable=False)  # mês/ano de referência — sempre normalizado para o dia 1
    descricao = Column(String(300), nullable=True)
    registrado_por_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    registrado_por = relationship("User", foreign_keys=[registrado_por_id])

    @property
    def registrado_por_nome(self):
        return self.registrado_por.nome if self.registrado_por else None
```

Em `backend/app/models/__init__.py`, incluir `TipoLancamentoVariavel` e `LancamentoRemuneracaoVariavel` no import de `app.models.colaborador` e em `__all__`.

- [ ] **Step 4: Adicionar os schemas**

Em `backend/app/schemas/colaborador.py`, atualizar o import do topo:

```python
from app.models.colaborador import RegimeContratacao, ModalidadeTrabalho, TipoComissao, TipoLancamentoVariavel
```

E adicionar (após a seção `# === BENEFÍCIOS ===`):

```python
# === LANÇAMENTOS DE REMUNERAÇÃO VARIÁVEL (BÔNUS / COMISSÃO MENSAL) ===

class LancamentoVariavelCreate(BaseModel):
    tipo: TipoLancamentoVariavel
    valor: float = Field(gt=0)
    competencia: date
    descricao: Optional[str] = None

    @field_validator("competencia")
    @classmethod
    def normalizar_competencia(cls, v):
        return v.replace(day=1)


class LancamentoVariavelResponse(BaseModel):
    id: int
    colaborador_id: int
    tipo: TipoLancamentoVariavel
    valor: float
    competencia: date
    descricao: Optional[str]
    registrado_por_id: int
    registrado_por_nome: Optional[str] = None
    criado_em: Optional[datetime]

    class Config:
        from_attributes = True
```

- [ ] **Step 5: Adicionar os endpoints**

Em `backend/app/api/v1/endpoints/colaboradores.py`, atualizar os imports:

```python
from app.models.colaborador import (
    Departamento, Cargo, Colaborador, HistoricoSalarialColaborador, HistoricoCargoColaborador,
    DocumentoColaborador, RegimeContratacao,
    BeneficioColaborador, HistoricoBeneficioColaborador,
    LancamentoRemuneracaoVariavel, TipoLancamentoVariavel,
)
from app.schemas.colaborador import (
    DepartamentoCreate, DepartamentoUpdate, DepartamentoResponse,
    CargoCreate, CargoUpdate, CargoResponse,
    ColaboradorCreate, ColaboradorUpdate, ColaboradorResponse,
    HistoricoSalarialCreate, HistoricoSalarialResponse,
    HistoricoCargoCreate, HistoricoCargoResponse,
    DesligamentoRequest,
    DocumentoCreate, DocumentoResponse,
    BeneficioCreate, BeneficioUpdate, BeneficioResponse,
    HistoricoBeneficioCreate, HistoricoBeneficioResponse,
    LancamentoVariavelCreate, LancamentoVariavelResponse,
)
```

Adicionar as rotas (após a seção `# === BENEFÍCIOS ===`, antes de `# === DOCUMENTOS ===`):

```python
# === LANÇAMENTOS DE REMUNERAÇÃO VARIÁVEL (BÔNUS / COMISSÃO MENSAL) ===

@router.post("/{colaborador_id}/lancamentos-variaveis", response_model=LancamentoVariavelResponse, status_code=201)
def criar_lancamento_variavel(
    colaborador_id: int,
    payload: LancamentoVariavelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    _get_colaborador_ou_404(colaborador_id, db)
    lancamento = LancamentoRemuneracaoVariavel(
        colaborador_id=colaborador_id,
        registrado_por_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(lancamento)
    db.commit()
    db.refresh(lancamento)
    return lancamento


@router.get("/{colaborador_id}/lancamentos-variaveis", response_model=List[LancamentoVariavelResponse])
def listar_lancamentos_variaveis(
    colaborador_id: int,
    tipo: Optional[TipoLancamentoVariavel] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_ROLES_MODULO)),
):
    _get_colaborador_ou_404(colaborador_id, db)
    query = db.query(LancamentoRemuneracaoVariavel).filter(
        LancamentoRemuneracaoVariavel.colaborador_id == colaborador_id
    )
    if tipo:
        query = query.filter(LancamentoRemuneracaoVariavel.tipo == tipo)
    return query.order_by(
        LancamentoRemuneracaoVariavel.competencia.desc(), LancamentoRemuneracaoVariavel.id.desc()
    ).all()
```

- [ ] **Step 6: Rodar os testes para confirmar que passam**

Run: `cd backend && python -m pytest tests/test_colaboradores_lancamentos_variaveis.py -v`
Expected: PASS em todos.

- [ ] **Step 7: Rodar a suíte completa do backend**

Run: `cd backend && python -m pytest -v`
Expected: PASS em todos.

- [ ] **Step 8: Commit**

```bash
git add app/models/colaborador.py app/models/__init__.py app/schemas/colaborador.py app/api/v1/endpoints/colaboradores.py tests/test_colaboradores_lancamentos_variaveis.py
git commit -m "feat: lancamento mensal de bonus e comissao do colaborador"
```

---

## Task 4: Frontend — `lib/api.js` e `lib/constants.js`

**Files:**
- Modify: `frontend/src/lib/api.js`
- Modify: `frontend/src/lib/constants.js`

**Interfaces:**
- Consumes: endpoints das Tasks 1–3 (`PUT /colaboradores/{id}`, `/beneficios*`, `/lancamentos-variaveis`).
- Produces: `colaboradoresApi.listarBeneficios(id)`, `colaboradoresApi.criarBeneficio(id, data)`, `colaboradoresApi.editarBeneficio(id, beneficioId, data)`, `colaboradoresApi.historicoBeneficio(id, beneficioId)`, `colaboradoresApi.ajustarBeneficio(id, beneficioId, data)`, `colaboradoresApi.listarLancamentosVariaveis(id, tipo)`, `colaboradoresApi.lancarVariavel(id, data)`; `TIPO_COMISSAO_LABELS`, `formatCompetencia(date)`. Consumidos pelas Tasks 5–7.

- [ ] **Step 1: Adicionar as funções em `colaboradoresApi`**

Em `frontend/src/lib/api.js`, dentro do objeto `colaboradoresApi` (após `removerDocumento`, antes do `}` de fechamento):

```js
  listarBeneficios: (id) => api.get(`/colaboradores/${id}/beneficios`),
  criarBeneficio: (id, data) => api.post(`/colaboradores/${id}/beneficios`, data),
  editarBeneficio: (id, beneficioId, data) => api.put(`/colaboradores/${id}/beneficios/${beneficioId}`, data),
  historicoBeneficio: (id, beneficioId) => api.get(`/colaboradores/${id}/beneficios/${beneficioId}/historico`),
  ajustarBeneficio: (id, beneficioId, data) => api.post(`/colaboradores/${id}/beneficios/${beneficioId}/historico`, data),
  listarLancamentosVariaveis: (id, tipo) => api.get(`/colaboradores/${id}/lancamentos-variaveis`, { params: tipo ? { tipo } : {} }),
  lancarVariavel: (id, data) => api.post(`/colaboradores/${id}/lancamentos-variaveis`, data),
```

- [ ] **Step 2: Adicionar `TIPO_COMISSAO_LABELS` e `formatCompetencia`**

Em `frontend/src/lib/constants.js`, após `TIPO_DESLIGAMENTO_LABELS` (bloco "Módulo Colaboradores (RH)"):

```js
export const TIPO_COMISSAO_LABELS = {
  fixo:       'Fixo',
  percentual: 'Percentual sobre venda',
  por_meta:   'Por meta atingida',
}
```

E, após `formatDate` (perto de `formatDatetime`):

```js
export const formatCompetencia = (date) => {
  if (!date) return '—'
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(String(date))
  if (match) return `${match[2]}/${match[1]}`
  return '—'
}
```

- [ ] **Step 3: Verificar que o projeto ainda builda**

Run: `cd frontend && npm run lint && npm run build`
Expected: sem erros (as novas funções/constantes não são usadas ainda nesta task, então não há import quebrado).

- [ ] **Step 4: Commit**

```bash
git add src/lib/api.js src/lib/constants.js
git commit -m "feat: api e labels de beneficios/lancamentos variaveis do colaborador"
```

---

## Task 5: Frontend — `RemuneracaoTab`: remove complementar, adiciona seção Comissão

**Files:**
- Modify: `frontend/src/pages/colaboradores/ColaboradorTabs.jsx`

**Interfaces:**
- Consumes: `colaboradoresApi.listarLancamentosVariaveis`, `colaboradoresApi.lancarVariavel`, `colaboradoresApi.update` (já existe), `TIPO_COMISSAO_LABELS`, `formatCompetencia`, `STATUS_COLOR_CLASSES` (de `lib/constants.js`), `clsx`.
- Produces: componente `LancamentosVariaveisLista` e `LancarVariavelModal` (reaproveitados pela Task 6), seção Comissão dentro de `RemuneracaoTab`.

- [ ] **Step 1: Atualizar os imports do topo do arquivo**

Em `frontend/src/pages/colaboradores/ColaboradorTabs.jsx`, trocar as linhas 1–5 (todos os imports do topo do arquivo, incluindo o `useAuthStore` do final do bloco) por:

```jsx
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import {
  formatDate, formatCurrency, formatCompetencia, REGIME_CONFIG, MODALIDADE_LABELS,
  TIPO_DESLIGAMENTO_LABELS, TIPO_DOCUMENTO_COLABORADOR_LABELS, SEXO_LABELS, ESTADO_CIVIL_LABELS,
  PERFIL_DISC_LABELS, TIPO_CONTRATO_LABELS, TIPO_CONTRATO_CLT_LABELS, TIPO_CONTRATO_PJ_LABELS,
  TIPO_COMISSAO_LABELS, STATUS_COLOR_CLASSES,
} from '../../lib/constants'
import { Modal, Spinner, ConfirmDialog } from '../../components/ui'
import { colaboradoresApi, cargosApi } from '../../lib/api'
import { useAuthStore } from '../../store'
```

- [ ] **Step 2: Reescrever `RemuneracaoTab` e `LancarSalarioModal`, remover a "remuneração complementar"**

Substituir o bloco de `// === Aba Remuneração ===` até o fim de `LancarSalarioModal` (linhas 337–475 do arquivo atual) por:

```jsx
// === Aba Remuneração ===
export function RemuneracaoTab({ colaborador, onUpdated }) {
  const isPj = colaborador.regime === 'pj'
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(!isPj)
  const [showLancar, setShowLancar] = useState(false)

  const carregar = () => {
    colaboradoresApi.historicoSalarial(colaborador.id)
      .then(r => setHistorico(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!isPj) carregar() }, [colaborador.id, isPj])

  return (
    <div className="space-y-8">
      {isPj ? (
        <div className="rounded-xl bg-stone-50 p-4">
          <p className="text-xs text-stone-400">Valor mensal (PJ)</p>
          <p className="text-xl font-semibold text-stone-800">{colaborador.pj_valor_mensal ? formatCurrency(colaborador.pj_valor_mensal) : 'Não informado'}</p>
          <p className="text-xs text-stone-400 mt-1">Editável na aba Contratação.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl bg-stone-50 p-4">
            <p className="text-xs text-stone-400">Salário CLT atual</p>
            <p className="text-xl font-semibold text-stone-800">{colaborador.salario_clt ? formatCurrency(colaborador.salario_clt) : 'Não informado'}</p>
            <p className="text-xs text-stone-400 mt-1">Vigente desde {formatDate(colaborador.data_vigencia_salario)}</p>
          </div>

          <div className="flex justify-end">
            <button className="btn-secondary btn-sm" onClick={() => setShowLancar(true)}>Lançar novo salário</button>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Histórico</h3>
            {loading ? <Spinner size={18} /> : historico.length === 0 ? (
              <p className="text-sm text-stone-400">Nenhum registro.</p>
            ) : (
              <ul className="space-y-2">
                {historico.map(h => (
                  <li key={h.id} className="text-sm border-l-2 border-stone-200 pl-3">
                    <p className="text-stone-700 font-medium">{formatCurrency(h.salario_clt)}</p>
                    <p className="text-xs text-stone-400">{formatDate(h.data_vigencia)} — {h.motivo} — {h.registrado_por_nome}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <LancarSalarioModal
            open={showLancar}
            onClose={() => setShowLancar(false)}
            colaborador={colaborador}
            onSaved={() => { setShowLancar(false); carregar(); onUpdated?.() }}
          />
        </div>
      )}

      <ComissaoSection colaborador={colaborador} onUpdated={onUpdated} />
      <BonusSection colaborador={colaborador} />
      <BeneficiosSection colaborador={colaborador} />
    </div>
  )
}

function LancarSalarioModal({ open, onClose, colaborador, onSaved }) {
  const [form, setForm] = useState({ salario_clt: '', data_vigencia: '', motivo: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const resetForm = () => {
    setForm({ salario_clt: '', data_vigencia: '', motivo: '' })
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await colaboradoresApi.lancarSalario(colaborador.id, {
        salario_clt: Number(form.salario_clt),
        data_vigencia: form.data_vigencia,
        motivo: form.motivo,
      })
      resetForm()
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao lançar salário'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Lançar novo salário" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Salário CLT *</label>
          <input type="number" step="0.01" className="input" required value={form.salario_clt} onChange={e => set('salario_clt', e.target.value)} />
        </div>
        <div>
          <label className="label">Vigência *</label>
          <input type="date" className="input" required value={form.data_vigencia} onChange={e => set('data_vigencia', e.target.value)} />
        </div>
        <div>
          <label className="label">Motivo *</label>
          <input className="input" required value={form.motivo} onChange={e => set('motivo', e.target.value)} placeholder="Ex: Reajuste anual" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={handleClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Lançar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// === Lançamentos de remuneração variável (bônus/comissão) — compartilhado entre as seções ===
function LancamentosVariaveisLista({ loading, lancamentos, vazio }) {
  if (loading) return <Spinner size={18} />
  if (lancamentos.length === 0) return <p className="text-sm text-stone-400">{vazio}</p>
  return (
    <ul className="space-y-2">
      {lancamentos.map(l => (
        <li key={l.id} className="text-sm border-l-2 border-stone-200 pl-3">
          <p className="text-stone-700 font-medium">{formatCurrency(l.valor)}</p>
          <p className="text-xs text-stone-400">
            {formatCompetencia(l.competencia)}{l.descricao ? ` — ${l.descricao}` : ''} — {l.registrado_por_nome}
          </p>
        </li>
      ))}
    </ul>
  )
}

function LancarVariavelModal({ open, onClose, colaborador, tipo, titulo, onSaved }) {
  const [form, setForm] = useState({ valor: '', competencia: '', descricao: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const resetForm = () => {
    setForm({ valor: '', competencia: '', descricao: '' })
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await colaboradoresApi.lancarVariavel(colaborador.id, {
        tipo,
        valor: Number(form.valor),
        competencia: `${form.competencia}-01`,
        descricao: form.descricao || null,
      })
      resetForm()
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao lançar'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={titulo} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Valor *</label>
          <input type="number" step="0.01" className="input" required value={form.valor} onChange={e => set('valor', e.target.value)} />
        </div>
        <div>
          <label className="label">Competência (mês) *</label>
          <input type="month" className="input" required value={form.competencia} onChange={e => set('competencia', e.target.value)} />
        </div>
        <div>
          <label className="label">Descrição</label>
          <input className="input" value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ex: Meta de 105% atingida" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={handleClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Lançar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// === Comissão ===
function ComissaoSection({ colaborador, onUpdated }) {
  const [lancamentos, setLancamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEditarRegra, setShowEditarRegra] = useState(false)
  const [showLancar, setShowLancar] = useState(false)

  const carregar = () => {
    setLoading(true)
    colaboradoresApi.listarLancamentosVariaveis(colaborador.id, 'comissao')
      .then(r => setLancamentos(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { carregar() }, [colaborador.id])

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">Comissão</h3>

      <div className="rounded-xl bg-stone-50 p-4">
        {colaborador.tipo_comissao ? (
          <>
            <p className="text-sm font-medium text-stone-700">
              {TIPO_COMISSAO_LABELS[colaborador.tipo_comissao]}
              {colaborador.valor_comissao != null && ` — ${colaborador.tipo_comissao === 'percentual' ? `${colaborador.valor_comissao}%` : formatCurrency(colaborador.valor_comissao)}`}
            </p>
            {colaborador.observacoes_comissao && <p className="text-xs text-stone-500 mt-1">{colaborador.observacoes_comissao}</p>}
          </>
        ) : (
          <p className="text-sm text-stone-400">Regra de comissão não definida.</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button className="btn-secondary btn-sm" onClick={() => setShowEditarRegra(true)}>Editar regra</button>
        <button className="btn-secondary btn-sm" onClick={() => setShowLancar(true)}>Lançar comissão do mês</button>
      </div>

      <LancamentosVariaveisLista loading={loading} lancamentos={lancamentos} vazio="Nenhuma comissão lançada." />

      <EditarRegraComissaoModal
        open={showEditarRegra}
        onClose={() => setShowEditarRegra(false)}
        colaborador={colaborador}
        onSaved={() => { setShowEditarRegra(false); onUpdated?.() }}
      />
      <LancarVariavelModal
        open={showLancar}
        onClose={() => setShowLancar(false)}
        colaborador={colaborador}
        tipo="comissao"
        titulo="Lançar comissão do mês"
        onSaved={() => { setShowLancar(false); carregar() }}
      />
    </div>
  )
}

function EditarRegraComissaoModal({ open, onClose, colaborador, onSaved }) {
  const [form, setForm] = useState({ tipo_comissao: '', valor_comissao: '', observacoes_comissao: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm({
        tipo_comissao: colaborador.tipo_comissao || '',
        valor_comissao: colaborador.valor_comissao ?? '',
        observacoes_comissao: colaborador.observacoes_comissao || '',
      })
      setError('')
    }
  }, [open, colaborador])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await colaboradoresApi.update(colaborador.id, {
        tipo_comissao: form.tipo_comissao || null,
        valor_comissao: form.valor_comissao === '' ? null : Number(form.valor_comissao),
        observacoes_comissao: form.observacoes_comissao || null,
      })
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao salvar regra de comissão'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar regra de comissão" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Tipo</label>
          <select className="input" value={form.tipo_comissao} onChange={e => set('tipo_comissao', e.target.value)}>
            <option value="">Não definido</option>
            {Object.entries(TIPO_COMISSAO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Valor (R$ se fixo, % se percentual)</label>
          <input type="number" step="0.01" className="input" value={form.valor_comissao} onChange={e => set('valor_comissao', e.target.value)} />
        </div>
        <div>
          <label className="label">Observações</label>
          <textarea className="input" rows={3} value={form.observacoes_comissao} onChange={e => set('observacoes_comissao', e.target.value)} placeholder="Ex: faixas de meta, condições específicas" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
```

Observação: `BonusSection` e `BeneficiosSection`, usados no fim de `RemuneracaoTab` acima, ainda não existem — são criados nas Tasks 6 e 7. O projeto vai ficar com erro de build entre esta task e a Task 6; isso é esperado dentro do plano (as tasks são sequenciais e cada uma deixa o arquivo num estado intermediário), mas **se for rodar o frontend isoladamente após esta task**, comente temporariamente as duas linhas `<BonusSection .../>` e `<BeneficiosSection .../>` para testar no navegador, e volte a descomentá-las ao concluir a Task 7.

- [ ] **Step 3: Lint e build**

Run: `cd frontend && npm run lint`
Expected: falha apontando `BonusSection`/`BeneficiosSection` não definidos — **esperado nesta task**, confirma que o restante do arquivo está sintaticamente correto. Se houver qualquer outro erro (import não usado, variável não declarada), corrigir antes de prosseguir.

- [ ] **Step 4: Commit**

```bash
git add src/pages/colaboradores/ColaboradorTabs.jsx
git commit -m "feat: secao de comissao (regra + lancamento mensal) na aba Remuneracao"
```

---

## Task 6: Frontend — `RemuneracaoTab`: adiciona seção Bônus

**Files:**
- Modify: `frontend/src/pages/colaboradores/ColaboradorTabs.jsx`

**Interfaces:**
- Consumes: `LancamentosVariaveisLista`, `LancarVariavelModal` (definidos na Task 5), `colaboradoresApi.listarLancamentosVariaveis`.
- Produces: componente `BonusSection`, referenciado por `RemuneracaoTab` desde a Task 5.

- [ ] **Step 1: Adicionar `BonusSection`**

Em `frontend/src/pages/colaboradores/ColaboradorTabs.jsx`, adicionar logo após o fim de `EditarRegraComissaoModal` (fechamento da Task 5):

```jsx
// === Bônus ===
function BonusSection({ colaborador }) {
  const [lancamentos, setLancamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLancar, setShowLancar] = useState(false)

  const carregar = () => {
    setLoading(true)
    colaboradoresApi.listarLancamentosVariaveis(colaborador.id, 'bonus')
      .then(r => setLancamentos(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { carregar() }, [colaborador.id])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">Bônus</h3>
        <button className="btn-secondary btn-sm" onClick={() => setShowLancar(true)}>Lançar bônus</button>
      </div>

      <LancamentosVariaveisLista loading={loading} lancamentos={lancamentos} vazio="Nenhum bônus lançado." />

      <LancarVariavelModal
        open={showLancar}
        onClose={() => setShowLancar(false)}
        colaborador={colaborador}
        tipo="bonus"
        titulo="Lançar bônus"
        onSaved={() => { setShowLancar(false); carregar() }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Lint**

Run: `cd frontend && npm run lint`
Expected: falha apontando só `BeneficiosSection` não definido (esperado — falta a Task 7). Nenhum outro erro.

- [ ] **Step 3: Commit**

```bash
git add src/pages/colaboradores/ColaboradorTabs.jsx
git commit -m "feat: secao de bonus mensal na aba Remuneracao"
```

---

## Task 7: Frontend — `RemuneracaoTab`: adiciona seção Benefícios

**Files:**
- Modify: `frontend/src/pages/colaboradores/ColaboradorTabs.jsx`

**Interfaces:**
- Consumes: `colaboradoresApi.listarBeneficios`, `criarBeneficio`, `editarBeneficio`, `historicoBeneficio`, `ajustarBeneficio`; `STATUS_COLOR_CLASSES`, `clsx`, `formatDate`, `formatCurrency`.
- Produces: componente `BeneficiosSection`, referenciado por `RemuneracaoTab` desde a Task 5. Fecha o ciclo — depois desta task o build volta a ficar 100% verde.

- [ ] **Step 1: Adicionar `BeneficiosSection`, `NovoBeneficioModal` e `AjustarBeneficioModal`**

Em `frontend/src/pages/colaboradores/ColaboradorTabs.jsx`, adicionar logo após o fim de `BonusSection` (fechamento da Task 6):

```jsx
// === Benefícios ===
function BeneficiosSection({ colaborador }) {
  const [beneficios, setBeneficios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNovo, setShowNovo] = useState(false)
  const [ajustando, setAjustando] = useState(null)

  const carregar = () => {
    setLoading(true)
    colaboradoresApi.listarBeneficios(colaborador.id)
      .then(r => setBeneficios(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { carregar() }, [colaborador.id])

  const toggleAtivo = async (beneficio) => {
    await colaboradoresApi.editarBeneficio(colaborador.id, beneficio.id, { ativo: !beneficio.ativo })
    carregar()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">Benefícios</h3>
        <button className="btn-secondary btn-sm" onClick={() => setShowNovo(true)}>Novo benefício</button>
      </div>

      {loading ? <Spinner size={18} /> : beneficios.length === 0 ? (
        <p className="text-sm text-stone-400">Nenhum benefício cadastrado.</p>
      ) : (
        <ul className="space-y-2">
          {beneficios.map(b => (
            <li key={b.id} className="flex items-center justify-between text-sm border-l-2 border-stone-200 pl-3 py-1">
              <div>
                <p className="text-stone-700 font-medium">{b.nome} — {formatCurrency(b.valor)}</p>
                <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mt-1', STATUS_COLOR_CLASSES[b.ativo ? 'green' : 'stone'])}>
                  {b.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary btn-sm" onClick={() => setAjustando(b)}>Ajustar valor</button>
                <button className="btn-secondary btn-sm" onClick={() => toggleAtivo(b)}>{b.ativo ? 'Desativar' : 'Ativar'}</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <NovoBeneficioModal
        open={showNovo}
        onClose={() => setShowNovo(false)}
        colaborador={colaborador}
        onSaved={() => { setShowNovo(false); carregar() }}
      />
      <AjustarBeneficioModal
        beneficio={ajustando}
        onClose={() => setAjustando(null)}
        colaborador={colaborador}
        onSaved={() => { setAjustando(null); carregar() }}
      />
    </div>
  )
}

function NovoBeneficioModal({ open, onClose, colaborador, onSaved }) {
  const [form, setForm] = useState({ nome: '', valor: '', data_vigencia: '', motivo: 'Cadastro inicial' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const resetForm = () => {
    setForm({ nome: '', valor: '', data_vigencia: '', motivo: 'Cadastro inicial' })
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await colaboradoresApi.criarBeneficio(colaborador.id, {
        nome: form.nome,
        valor: Number(form.valor),
        data_vigencia: form.data_vigencia,
        motivo: form.motivo,
      })
      resetForm()
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao criar benefício'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Novo benefício" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Nome *</label>
          <input className="input" required value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Vale-Refeição" />
        </div>
        <div>
          <label className="label">Valor *</label>
          <input type="number" step="0.01" className="input" required value={form.valor} onChange={e => set('valor', e.target.value)} />
        </div>
        <div>
          <label className="label">Vigência *</label>
          <input type="date" className="input" required value={form.data_vigencia} onChange={e => set('data_vigencia', e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={handleClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Criar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function AjustarBeneficioModal({ beneficio, onClose, colaborador, onSaved }) {
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ valor: '', data_vigencia: '', motivo: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (beneficio) {
      setLoading(true)
      colaboradoresApi.historicoBeneficio(colaborador.id, beneficio.id)
        .then(r => setHistorico(r.data))
        .catch(console.error)
        .finally(() => setLoading(false))
      setForm({ valor: '', data_vigencia: '', motivo: '' })
      setError('')
    }
  }, [beneficio, colaborador.id])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await colaboradoresApi.ajustarBeneficio(colaborador.id, beneficio.id, {
        valor: Number(form.valor),
        data_vigencia: form.data_vigencia,
        motivo: form.motivo,
      })
      onSaved()
    } catch (err) {
      setError(extractErrorMessage(err, 'Erro ao ajustar valor'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={!!beneficio} onClose={onClose} title={beneficio ? `Ajustar valor — ${beneficio.nome}` : ''} size="sm">
      {beneficio && (
        <div className="space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Novo valor *</label>
              <input type="number" step="0.01" className="input" required value={form.valor} onChange={e => set('valor', e.target.value)} />
            </div>
            <div>
              <label className="label">Vigência *</label>
              <input type="date" className="input" required value={form.data_vigencia} onChange={e => set('data_vigencia', e.target.value)} />
            </div>
            <div>
              <label className="label">Motivo *</label>
              <input className="input" required value={form.motivo} onChange={e => set('motivo', e.target.value)} placeholder="Ex: Reajuste anual do plano" />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end pt-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : 'Registrar ajuste'}
              </button>
            </div>
          </form>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Histórico</h3>
            {loading ? <Spinner size={18} /> : historico.length === 0 ? (
              <p className="text-sm text-stone-400">Nenhum registro.</p>
            ) : (
              <ul className="space-y-2">
                {historico.map(h => (
                  <li key={h.id} className="text-sm border-l-2 border-stone-200 pl-3">
                    <p className="text-stone-700 font-medium">{formatCurrency(h.valor)}</p>
                    <p className="text-xs text-stone-400">{formatDate(h.data_vigencia)} — {h.motivo} — {h.registrado_por_nome}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
```

- [ ] **Step 2: Lint e build**

Run: `cd frontend && npm run lint && npm run build`
Expected: sem erros — todos os componentes referenciados por `RemuneracaoTab` agora existem.

- [ ] **Step 3: Commit**

```bash
git add src/pages/colaboradores/ColaboradorTabs.jsx
git commit -m "feat: secao de beneficios (cadastro + ajuste de valor com historico) na aba Remuneracao"
```

---

## Task 8: Verificação final — suíte completa e teste manual

**Files:** nenhum arquivo novo — só execução e verificação.

**Interfaces:**
- Consumes: tudo das Tasks 1–7.

- [ ] **Step 1: Rodar a suíte completa do backend**

Run: `cd backend && python -m pytest -v`
Expected: PASS em todos os testes do projeto (não só os novos).

- [ ] **Step 2: Lint e build do frontend**

Run: `cd frontend && npm run lint && npm run build`
Expected: sem erros.

- [ ] **Step 3: Teste manual no navegador**

Rodar `cd backend && uvicorn app.main:app --reload --port 8000` e `cd frontend && npm run dev` (portas conforme CLAUDE.md), logar como `admin@plannit.com.br` / `Admin@123456`, abrir Colaboradores → selecionar (ou criar) um colaborador CLT → aba Remuneração, e confirmar manualmente:
1. Editar a regra de comissão (tipo + valor + observações) e ver refletido no card.
2. Lançar uma comissão do mês e ver aparecer na lista, mais recente primeiro.
3. Lançar um bônus e ver aparecer na lista de Bônus.
4. Criar um benefício novo (ex: Vale-Refeição, R$ 600) e ver aparecer na lista com badge "Ativo".
5. Ajustar o valor do benefício criado e confirmar que o valor exibido na lista principal atualiza, e que o histórico do modal de ajuste mostra os dois registros.
6. Desativar o benefício e confirmar que o badge muda para "Inativo".
7. Repetir o passo 1–4 (comissão, bônus, benefício) num colaborador PJ, confirmando que as três seções aparecem normalmente mesmo sem bloco de salário CLT.

- [ ] **Step 4: Reportar ao usuário**

Sem commit nesta task (é só verificação) — se algum passo falhar, voltar à task correspondente, corrigir, e repetir esta verificação antes de considerar o plano concluído.
