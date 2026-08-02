# Módulo Colaboradores — Comissões, Bônus e Benefícios (aba Remuneração) — Design

**Data:** 2026-08-02
**Branch:** `feature/rh` (mesma branch do RH01, ainda não mergeada em `main`)
**Status:** aprovado, aguardando plano de implementação

## Contexto

O RH01 (Cadastro do Colaborador) está pronto, com a aba Remuneração hoje limitada a salário CLT (com histórico imutável) ou valor mensal PJ, mais um campo genérico `remuneracao_complementar`. O usuário quer trazer, de forma manual, o registro de comissões, bônus e benefícios para essa aba — sem ainda construir o motor automático que calcula comissão a partir de vendas fechadas (isso depende do módulo CRM/Leads estar 100% funcional, fora do escopo desta entrega).

O `SRS_RH_v1.docx` (raiz do projeto, mesmo documento referenciado no spec do RH01) já descreve isso em detalhe como três módulos próprios do backlog:
- **RH02 — Comissões e Remuneração Variável**: motor de cálculo por cargo, faixas de meta, aprovação dupla (gestor + RH), histórico por competência.
- **RH04 — Acordos e Ajustes**: inclui "Bonificação pontual" (o que o usuário chama de bônus), aprovada pela Diretoria, vinculada à folha da competência.
- **RH09 — Benefícios**: cadastro por tipo, elegibilidade por cargo, custo empresa vs. colaborador, dependentes.

Decisão explícita do usuário: nesta entrega, usar uma versão **rasa** desses conceitos (lançamento manual, sem motor de cálculo, sem aprovação dupla, sem elegibilidade/dependentes), aceitando que o schema pode precisar de retrabalho quando RH02/RH04/RH09 virarem specs e módulos próprios — em vez de já adotar os campos "finais" da seção 18 da SRS (que teriam campos sem uso nenhum hoje, como `dependentes_json` ou `faixa_meta`).

Após esta entrega, o próximo módulo RH priorizado pelo usuário é o **RH03 — Férias e Afastamentos** (não depende de nenhum outro módulo; dor já descrita na SRS como "controle centralizado em uma pessoa, risco de perda de informação") — não faz parte deste spec, só registrado aqui como decisão de sequenciamento.

## Decisões de escopo

- **Remove o campo genérico `remuneracao_complementar`** de `Colaborador` e `HistoricoSalarialColaborador`. Ele só é usado dentro do próprio módulo Colaboradores (confirmado por busca no código — nenhum dashboard ou outro módulo depende dele), então pode ser removido com segurança; sua função é substituída pela estrutura de Benefícios abaixo.
- **Benefícios são itens cadastráveis pelo RH** (não um valor único) — cada colaborador pode ter quantos quiser (Vale-Refeição, Plano de Saúde, etc.), cada um com nome, valor e status ativo/inativo. Ajustes de valor geram histórico imutável, mesmo padrão de `HistoricoSalarialColaborador` — decisão do usuário por consistência com o resto do módulo, mesmo sendo um valor menos "regulado" que salário.
- **Bônus e comissão mensal usam uma tabela única** (`LancamentoRemuneracaoVariavel` com campo `tipo`) em vez de duas tabelas idênticas — ambos são, nesta entrega, um lançamento datado com valor, sem diferença estrutural. Lançamentos são imutáveis (só `POST`/`GET`, sem edição/exclusão), mesmo padrão do histórico salarial.
- **Comissão tem uma regra contratual separada dos lançamentos mensais**: `tipo_comissao` (fixo | percentual | por_meta), `valor_comissao` (número) e `observacoes_comissao` (texto livre, para detalhar condições como faixas de meta) ficam no cadastro do `Colaborador`, editáveis via `PUT /colaboradores/{id}` normal — não são um valor financeiro histórico, são a cláusula contratual vigente, então não passam pelo mesmo bloqueio de campo que salário/cargo.
- **Comissão, bônus e benefícios aparecem tanto para CLT quanto para PJ** — são independentes do regime de contratação (ex.: vendedor PJ também pode ter comissão por meta ou receber vale-refeição). Só o bloco de salário/histórico continua exclusivo de CLT (PJ mantém o valor mensal do contrato, já existente).
- **Fora desta entrega, deliberadamente**: motor de cálculo automático a partir de vendas, faixas de meta, aprovação dupla (gestor + RH), elegibilidade de benefício por cargo, dependentes, consolidação/exportação de folha. Cada um entra quando RH02/RH04/RH09/RH08 virarem specs próprios.

## 1. Modelo de dados — `app/models/colaborador.py`

```python
class TipoLancamentoVariavel(str, enum.Enum):
    BONUS = "bonus"
    COMISSAO = "comissao"


class TipoComissao(str, enum.Enum):
    FIXO = "fixo"
    PERCENTUAL = "percentual"
    POR_META = "por_meta"


class BeneficioColaborador(Base):
    __tablename__ = "beneficios_colaboradores"

    id = Column(Integer, primary_key=True, index=True)
    colaborador_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=False)
    nome = Column(String(150), nullable=False)          # ex: "Vale-Refeição", "Plano de Saúde"
    valor = Column(Float, nullable=False)                # valor atual, denormalizado — trilha em HistoricoBeneficioColaborador
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())


class HistoricoBeneficioColaborador(Base):
    __tablename__ = "historico_beneficios_colaboradores"

    id = Column(Integer, primary_key=True, index=True)
    beneficio_id = Column(Integer, ForeignKey("beneficios_colaboradores.id"), nullable=False)
    valor = Column(Float, nullable=False)
    data_vigencia = Column(Date, nullable=False)
    motivo = Column(String(300), nullable=False)          # ex: "Cadastro inicial", "Reajuste anual do plano"
    registrado_por_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class LancamentoRemuneracaoVariavel(Base):
    __tablename__ = "lancamentos_remuneracao_variavel"

    id = Column(Integer, primary_key=True, index=True)
    colaborador_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=False)
    tipo = Column(SAEnum(TipoLancamentoVariavel), nullable=False)
    valor = Column(Float, nullable=False)
    competencia = Column(Date, nullable=False)             # mês/ano de referência (dia sempre 1)
    descricao = Column(String(300), nullable=True)         # ex: "Meta de 105% atingida"
    registrado_por_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
```

Em `Colaborador`:
- Remove `remuneracao_complementar`.
- Adiciona `tipo_comissao` (`SAEnum(TipoComissao)`, nullable), `valor_comissao` (`Float`, nullable), `observacoes_comissao` (`Text`, nullable).

Em `HistoricoSalarialColaborador`: remove `remuneracao_complementar`.

## 2. Endpoints — `app/api/v1/endpoints/colaboradores.py`

```
POST   /colaboradores/{id}/beneficios                            cria item de benefício (nome, valor, data_vigencia, motivo) -> grava também 1º registro em HistoricoBeneficioColaborador
GET    /colaboradores/{id}/beneficios                             lista itens do colaborador (todos, inclui inativos)
PUT    /colaboradores/{id}/beneficios/{beneficio_id}               edita nome/ativo — NÃO aceita valor (bloqueado, só via histórico dedicado)
POST   /colaboradores/{id}/beneficios/{beneficio_id}/historico     lança ajuste de valor (valor, data_vigencia, motivo) + atualiza valor atual se este for o lançamento mais recente (mesma lógica de carry-forward do histórico salarial)
GET    /colaboradores/{id}/beneficios/{beneficio_id}/historico     lista histórico do item (somente leitura)

POST   /colaboradores/{id}/lancamentos-variaveis                   cria lançamento de bônus ou comissão (tipo, valor, competencia, descricao)
GET    /colaboradores/{id}/lancamentos-variaveis                   lista lançamentos do colaborador (query param opcional `tipo=bonus|comissao`)
```

`PUT /colaboradores/{id}` passa a aceitar `tipo_comissao`, `valor_comissao`, `observacoes_comissao` como campos normais (sem bloqueio) — são cláusula contratual, não valor financeiro histórico.

Sem `PUT`/`DELETE` em `/lancamentos-variaveis/{id}` — imutável, mesmo padrão de `historico-salarial`. Sem `DELETE` em `/beneficios/{id}` — desativa via `PUT` com `ativo=false`, mesmo padrão de `Departamento`/`Cargo`.

## 3. Validações

- `valor` em benefício e em lançamento variável deve ser > 0.
- `competencia` em lançamento variável: guardar sempre com dia = 1 (normalizado no backend, independente do que vier no payload) — representa mês/ano, não uma data específica.
- Editar `BeneficioColaborador` via `PUT` (nome/ativo) não aceita o campo `valor` no payload — se vier, é ignorado (segue o padrão de `ColaboradorUpdate.model_dump(exclude_unset=True)`, mas o schema `BeneficioUpdate` simplesmente não declara o campo `valor`).
- `POST /beneficios/{id}/historico` com `data_vigencia` anterior à vigência atual não atualiza o valor denormalizado (mesma regra de "não sobrescrever lançamento mais novo já vigente" do histórico salarial).

## 4. Frontend

Aba Remuneração (`RemuneracaoTab` em `ColaboradorTabs.jsx`) passa a ter 4 blocos empilhados, todos visíveis para CLT e PJ:

1. **Salário/Contrato** — o que já existe hoje (CLT com histórico, ou valor mensal PJ), sem mudança.
2. **Comissão** — card com a regra atual (`tipo_comissao`/`valor_comissao`/`observacoes_comissao`) + botão "Editar regra" (`EditarRegraComissaoModal`, chama `PUT /colaboradores/{id}`); abaixo, lista de lançamentos mensais (filtrados por `tipo=comissao`) + botão "Lançar comissão do mês" (`LancarVariavelModal` com `tipo` fixo em `comissao`).
3. **Bônus** — lista de lançamentos mensais (`tipo=bonus`) + botão "Lançar bônus" (mesmo `LancarVariavelModal`, `tipo` fixo em `bonus`).
4. **Benefícios** — lista de itens (nome, valor atual, badge ativo/inativo) + botão "Novo benefício" (`NovoBeneficioModal`); cada item tem "Ajustar valor" (`AjustarBeneficioModal`, abre histórico do item) e toggle ativo/inativo.

`lib/api.js` — novo bloco em `colaboradoresApi`:
```js
listarBeneficios: (id) => api.get(`/colaboradores/${id}/beneficios`),
criarBeneficio: (id, data) => api.post(`/colaboradores/${id}/beneficios`, data),
editarBeneficio: (id, beneficioId, data) => api.put(`/colaboradores/${id}/beneficios/${beneficioId}`, data),
historicoBeneficio: (id, beneficioId) => api.get(`/colaboradores/${id}/beneficios/${beneficioId}/historico`),
ajustarBeneficio: (id, beneficioId, data) => api.post(`/colaboradores/${id}/beneficios/${beneficioId}/historico`, data),
listarLancamentosVariaveis: (id, tipo) => api.get(`/colaboradores/${id}/lancamentos-variaveis`, { params: tipo ? { tipo } : {} }),
lancarVariavel: (id, data) => api.post(`/colaboradores/${id}/lancamentos-variaveis`, data),
```

`lib/constants.js` — novo `TIPO_COMISSAO_LABELS` (fixo/percentual/por_meta).

## Fora de escopo (fica para specs futuros)

- Motor de cálculo automático de comissão a partir de vendas fechadas (depende do CRM/Leads) — RH02.
- Faixas de meta e progressão de comissão por % atingido — RH02.
- Aprovação dupla (gestor + RH) antes de incorporar à folha — RH02/RH04.
- Elegibilidade de benefício por cargo e dependentes vinculados — RH09.
- Consolidação e exportação de folha de pagamento — RH08.
- Edição ou exclusão de lançamentos de bônus/comissão já registrados — imutáveis por design, igual ao histórico salarial.

## Migração

Ambiente local já rodou `seed.py` antes com `Colaborador.remuneracao_complementar` existente — remover/renomear coluna em tabela já existente exige `ALTER TABLE` manual (não é criado automaticamente por `create_all`, conforme já registrado no CLAUDE.md). As tabelas novas (`beneficios_colaboradores`, `historico_beneficios_colaboradores`, `lancamentos_remuneracao_variavel`) são criadas normalmente por `python seed.py`. `seed.py` e `tests/test_colaboradores_historico_salarial.py` referenciam `remuneracao_complementar` hoje — ajustar na implementação.

## Backlog (referência futura, não faz parte deste spec)

1. RH02 Comissões — motor de cálculo por cargo, faixas de meta, aprovação dupla, composição CLT/complementar
2. **RH03 Férias e Afastamentos — próximo módulo priorizado pelo usuário (2026-08-02), após esta entrega**
3. RH04 Acordos e Ajustes — adiantamentos, banco de horas, bonificações, rescisão
4. RH05 Avaliação de Desempenho + PDI — ciclo semestral, autoavaliação, avaliação do líder, PDI conjunto
5. RH06 Plano de Carreira e Progressão — trilha Júnior/Pleno/Sênior, requisitos, aprovação de promoção
6. RH07 Manual, Normas e Políticas — upload de PDFs, descrição de cargos, política salarial com acesso controlado
7. RH08 Folha de Pagamento Assistida — consolidação salário + comissões + acordos + descontos para exportação
8. RH09 Benefícios — evolução do que esta entrega cria: elegibilidade por cargo, dependentes, custo por departamento
9. RH10 Clima Organizacional — pesquisa periódica, eNPS interno
10. RH11 Portal do Colaborador — autoatendimento (holerite, férias, PDI, comunicados)
