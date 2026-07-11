# Backend de Score de Arquitetos — Design

**Data:** 2026-07-10
**Branch:** feature/arch
**Status:** aprovado, aguardando plano de implementação

## Contexto

O CLAUDE.md descreve o módulo de Arquitetos como tendo "score RFV × Potencial × Lealdade, 7 segmentos, 4 flags, decisores multi-contato" já implementado. Isso não é verdade: o backend real (`models/crm.py::Arquiteto`, `schemas/crm.py`, `endpoints/arquitetos.py`) é um CRUD simples — `nome`, `escritorio`, `telefone`, `email`, `nivel_parceria`, `is_active`. Não existe `arquiteto_score.py`, não existe model `DecisorArquiteto`, não existem campos de score. O frontend de Arquitetos também não existe (sem página, sem `arquitetosApi`, sem rota, sem item de sidebar).

Este spec cobre a construção do **backend completo** do módulo de score de Arquitetos. O frontend fica para uma fase seguinte, depois que este backend estiver pronto e testável via `/docs` (Swagger).

## Decisões de escopo

- **Fonte de dados RFV**: Recência/Frequência/Valor vêm de `Projeto.arquiteto_id` (negócio real, com `valor_contrato`). `Lead.arquiteto_id` (leads ainda ativos no funil) alimenta o pilar de Potencial.
- **Lealdade**: combina tempo de parceria + consistência de indicações ao longo do tempo + taxa de conversão dos leads indicados.
- **Formato do score**: um `score_geral` 0-100 (média dos 3 pilares) + os 3 sub-scores (RFV, Potencial, Lealdade) sempre visíveis na resposta.
- **Cálculo**: sob demanda, sem cache no banco. Nenhuma coluna nova em `Arquiteto` para armazenar score — sempre recalculado a partir de Projetos/Leads/Concorrentes no momento da consulta.
- **Metodologia de pontuação**: critérios fixos por faixas (mesmo padrão do `briefing_score.py` já existente no projeto), não percentil relativo entre arquitetos. Justificativa: previsível, explicável ao usuário de negócio, consistente com o resto do código. Limiares numéricos ficam como constantes nomeadas, ajustáveis depois sem reescrever lógica.
- **Decisores multi-contato**: lista de contatos por arquiteto (cargo em texto livre, um marcado como principal).
- **Concorrência**: dado manual e subjetivo (loja/concorrente + % estimado de fechamento), guardado à parte e **exposto como indicador separado**, sem entrar na conta de RFV/Potencial/Lealdade/score_geral — mantém o score 100% baseado em dado objetivo e explicável.

## Modelo de dados (novo)

Dois models novos em `app/models/crm.py` (mesmo arquivo do `Arquiteto` existente):

```python
class DecisorArquiteto(Base):
    __tablename__ = "decisores_arquitetos"
    id = Column(Integer, primary_key=True, index=True)
    arquiteto_id = Column(Integer, ForeignKey("arquitetos.id"), nullable=False)
    nome = Column(String(200), nullable=False)
    cargo = Column(String(100), nullable=True)          # texto livre
    telefone = Column(String(20), nullable=True)
    email = Column(String(200), nullable=True)
    observacoes = Column(Text, nullable=True)
    is_principal = Column(Boolean, default=False)       # só 1 por arquiteto — garantido no service
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    arquiteto = relationship("Arquiteto", foreign_keys=[arquiteto_id])


class ConcorrenteArquiteto(Base):
    __tablename__ = "concorrentes_arquitetos"
    id = Column(Integer, primary_key=True, index=True)
    arquiteto_id = Column(Integer, ForeignKey("arquitetos.id"), nullable=False)
    nome_concorrente = Column(String(200), nullable=False)
    percentual_fechamento_estimado = Column(Float, nullable=False)  # 0-100
    observacoes = Column(Text, nullable=True)
    registrado_por_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # é opinião — audita quem inseriu
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    arquiteto = relationship("Arquiteto", foreign_keys=[arquiteto_id])
    registrado_por = relationship("User", foreign_keys=[registrado_por_id])
```

Nenhuma coluna nova na tabela `arquitetos` existente. Migration via `alembic revision --autogenerate` + `alembic upgrade head`.

## Cálculo de score — `app/services/arquiteto_score.py`

Função principal: `calcular_score(db: Session, arquiteto: Arquiteto) -> dict`.

Três pilares, cada um 0-100:

### RFV = média(Recência, Frequência, Valor)

Calculado sobre `Projeto` onde `arquiteto_id == arquiteto.id` e `arquivado == False`.

- **Recência** (dias desde `criado_em` do projeto mais recente do arquiteto):
  - ≤30 dias → 100 · ≤90 → 70 · ≤180 → 40 · ≤365 → 20 · >365 → 5 · nenhum projeto → 0
- **Frequência** (nº de projetos com `criado_em` nos últimos 12 meses):
  - 0 → 0 · 1 → 30 · 2-3 → 60 · 4-6 → 85 · 7+ → 100
- **Valor** (soma de `valor_contrato` dos projetos dos últimos 12 meses, ignorando nulos):
  - 0 ou sem valor → 0 · <R$50k → 30 · R$50-150k → 55 · R$150-350k → 75 · R$350-700k → 90 · >R$700k → 100

### Potencial (pipeline futuro)

Conta = (leads com `arquiteto_id` e `status_funil` fora de `[FECHADO, PERDIDO, DESQUALIFICADO]`) + (projetos com `arquiteto_id` e `status` fora de `[CONCLUIDO, CANCELADO]`, não arquivados).

Mesma faixa da Frequência: 0 → 0 · 1 → 40 · 2-3 → 65 · 4-6 → 85 · 7+ → 100

### Lealdade = média(tempo_parceria, consistência, taxa_conversão)

- **Tempo de parceria** (meses desde `Arquiteto.criado_em`): <3m → 20 · 3-12m → 50 · 12-24m → 75 · >24m → 100
- **Consistência**: % dos últimos 12 meses-calendário com pelo menos 1 projeto criado pelo arquiteto (meses_com_projeto / 12 × 100, capado em 100)
- **Taxa de conversão**: `leads_fechados / (leads_fechados + leads_perdidos + leads_desqualificados) × 100`. Se o denominador for 0 (sem leads terminais ainda), usar 50 (neutro — não penaliza por falta de dado)

### Score geral

`score_geral = média(RFV, Potencial, Lealdade)`, 0-100.

Resposta do serviço inclui `detalhes`: breakdown de cada critério individual (mesmo padrão do `score_detalhes` do `Briefing`), para transparência.

## Segmentação (7, avaliados em ordem — primeira regra que bate vence)

1. **Inativo** — nenhum projeto e nenhum lead associados (histórico total zero)
2. **Novo Promissor** — `Arquiteto.criado_em` há menos de 90 dias, com pelo menos 1 lead ou projeto
3. **Em Risco** — já teve pelo menos 1 projeto no histórico (frequência all-time > 0), mas nenhum projeto/lead nos últimos 180 dias
4. **Campeão** — `score_geral ≥ 85`
5. **Parceiro Fiel** — `Lealdade ≥ 75` e `RFV ≥ 50`
6. **Em Ascensão** — `Potencial ≥ 70`
7. **Ocasional** — fallback (nenhuma regra acima bateu)

## Flags (badges independentes — 0 a 4 simultâneas)

- 🏆 **Top Indicador** — `score_geral ≥ 85`
- ⚠️ **Em Risco de Perda** — mesmo critério do segmento "Em Risco"
- 🚀 **Alto Potencial** — `Potencial ≥ 70`
- 🎯 **Indicação de Alto Valor** — sub-critério Valor (dentro do RFV) individual `≥ 90`

## Concorrência (indicador separado, manual)

`risco_concorrencia` = maior `percentual_fechamento_estimado` entre os `ConcorrenteArquiteto` cadastrados para o arquiteto (0 se nenhum cadastrado), classificado em:
- **Baixo** (<30%) · **Médio** (30-60%) · **Alto** (>60%)

Exposto junto da resposta de `GET /arquitetos/{id}/score`, num campo separado (`concorrencia: { risco, nivel, concorrentes: [...] }`) — não entra na média de RFV/Potencial/Lealdade/score_geral.

## Schemas novos (`app/schemas/crm.py` ou novo `app/schemas/arquiteto_score.py`)

- `DecisorArquitetoCreate` / `DecisorArquitetoResponse`
- `ConcorrenteArquitetoCreate` / `ConcorrenteArquitetoResponse`
- `ArquitetoScoreResponse`: `rfv`, `potencial`, `lealdade`, `score_geral`, `segmento`, `flags: List[str]`, `detalhes: dict`, `concorrencia: dict`

## Endpoints novos (`app/api/v1/endpoints/arquitetos.py`)

- `GET /arquitetos/{id}/score` → `ArquitetoScoreResponse`
- `GET /arquitetos/{id}/decisores` · `POST /arquitetos/{id}/decisores` · `PATCH /arquitetos/{id}/decisores/{decisor_id}` · `DELETE /arquitetos/{id}/decisores/{decisor_id}`
- `GET /arquitetos/{id}/concorrentes` · `POST /arquitetos/{id}/concorrentes` · `PATCH /arquitetos/{id}/concorrentes/{concorrente_id}` · `DELETE /arquitetos/{id}/concorrentes/{concorrente_id}`

Permissões seguem o padrão já usado no arquivo: leitura para `get_current_user`, escrita (criar/editar/apagar decisores e concorrentes) restrita a `DIRETORIA`, `GERENTE_COMERCIAL`, `RECEPCAO` — mesmo grupo que já cria/edita arquitetos.

## Fora de escopo (explicitamente)

- Frontend do módulo de Arquitetos (fase seguinte, depois deste backend)
- Filtro/ordenação da listagem de arquitetos por segmento ou score (exigiria calcular o score de todos os arquitetos na listagem — avaliar quando o frontend precisar disso)
- Ajuste fino dos limiares numéricos das faixas de pontuação — ficam como constantes nomeadas no serviço, para tunar depois com dados reais de uso
- Qualquer alteração no cálculo do `briefing_score.py` existente (referência de padrão, não é tocado)

## Testes

- Testes unitários do `arquiteto_score.py` cobrindo cada faixa de pontuação (Recência/Frequência/Valor/Potencial/Lealdade) e a árvore de decisão dos 7 segmentos (um teste por segmento, incluindo casos de fronteira entre regras)
- Testes de endpoint para os CRUDs de decisores e concorrentes (criação, `is_principal` único, permissões)
