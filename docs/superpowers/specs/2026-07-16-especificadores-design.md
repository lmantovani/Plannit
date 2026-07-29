# Módulo Especificadores (evolução do módulo Arquitetos) — Design

**Data:** 2026-07-16
**Branch:** a definir (sugestão: `feature/especificadores`)
**Status:** aprovado, aguardando plano de implementação

## Contexto

O módulo hoje chamado "Arquitetos" (model `Arquiteto`, rota `/arquitetos`, score RFV×Potencial×Lealdade, decisores e concorrentes — já implementado e mesclado em `main` no commit `eaaa90b`) tratava implicitamente todo indicador/parceiro comercial como um arquiteto. Na prática, quem indica a loja para clientes de móveis planejados de alto padrão inclui também designers de interiores, decoradores e engenheiros. Este spec reformula o módulo para tratar qualquer indicador como um **especificador**, e evolui a tela de um cadastro solto para uma ferramenta de **gestão de carteira**: quem é dono de cada relacionamento, quantas interações/visitas acontecem, e o retorno em vendas.

O CLAUDE.md já afirma como regra de negócio existente "Vendedor vê apenas sua carteira (filtro automático por consultor_id)" — isso **não existe no código** (não há `consultor_id` em lugar nenhum do backend). Este spec implementa essa lacuna, mas com uma nuance definida pelo usuário: não é um filtro restritivo — todo mundo continua vendo todos os especificadores (ativos, inativos, em prospecção), para permitir consulta cruzada e evitar que dois vendedores trabalhem o mesmo especificador ao mesmo tempo. O que muda é que cada especificador passa a ter um dono visível e rastreável.

## Decisões de escopo

- **Rename só na camada visual.** Model `Arquiteto`, tabela `arquitetos`, rotas `/arquitetos/*`, `arquitetosApi`, arquivos e componentes React (`ArquitetoCard`, `ArquitetoForm`, `ArquitetoDrawer`) continuam com esse nome internamente. Só o texto visível ao usuário passa a dizer "Especificador(es)". Rename técnico completo fica para uma iteração futura, se decidirem migrar de fato.
- **`tipo` não influencia o score.** RFV×Potencial×Lealdade (`arquiteto_score.py`) continua idêntico para todos os tipos — `tipo` é campo de classificação/filtro, não entra em nenhuma fórmula.
- **`tipo` obrigatório em cadastros novos**, com os 4 registros já existentes recebendo `arquiteto` via migration (era o único tipo suportado até agora).
- **Sem filtro restritivo por dono.** `GET /arquitetos/` continua retornando todos os especificadores ativos para qualquer usuário autenticado (comportamento atual preservado) — `consultor_id`/`status_carteira`/`tipo` viram filtros *opcionais* de busca, não gates de visibilidade.
- **Reatribuição de dono é ação de gestão.** Só `DIRETORIA`/`GERENTE_COMERCIAL` podem trocar o `consultor_id` de um especificador; toda troca é imutável em histórico (mesmo padrão de `HistoricoStatusProjeto`, RN017) e dispara notificação para o novo consultor.
- **Migração assistida de leads antigos com `origem=arquiteto` — fora de escopo.** Todos os cadastros hoje são fictícios (ambiente de demo); não há dado real para reclassificar.
- **Painel de KPIs aparece em dois lugares**: topo da tela de Especificadores e no Dashboard geral, mesmo componente reaproveitado.
- **Meta de visitas é configurada pelo gestor**, não pelo próprio vendedor.

## 1. Campo `tipo`

Novo enum em `app/models/crm.py`:

```python
class TipoEspecificador(str, enum.Enum):
    ARQUITETO = "arquiteto"
    DESIGNER_INTERIORES = "designer_interiores"
    DECORADOR = "decorador"
    ENGENHEIRO = "engenheiro"
```

Nova coluna em `Arquiteto`: `tipo = Column(SAEnum(TipoEspecificador), nullable=False, default=TipoEspecificador.ARQUITETO)`. Migration Alembic com `server_default='arquiteto'` para as linhas existentes.

`ArquitetoCreate`/`ArquitetoResponse` (`schemas/crm.py`) ganham `tipo: TipoEspecificador` (obrigatório no create). `GET /arquitetos/` ganha query param opcional `tipo` para filtrar, mesmo padrão do `nivel_parceria` que já existe.

## 2. Campo `especialidade`

Coluna opcional `especialidade = Column(String(200), nullable=True)` em `Arquiteto` — texto livre (ex.: "engenharia civil", "interiores comerciais"). Não é filtro, só contexto adicional para casos que não se encaixam perfeitamente nas 4 categorias fixas de `tipo`.

## 3. Rename textual da UI

Troca de texto visível (sem tocar em nomes internos de componente/variável/arquivo):

| Local | Antes | Depois |
|---|---|---|
| `Sidebar.jsx:15` | `label: 'Arquitetos'` | `label: 'Especificadores'` |
| `App.jsx:24` (`ROUTE_TITLES['/arquitetos']`) | `title: 'Arquitetos'` | `title: 'Especificadores'` |
| `ArquitetosPage.jsx` botão | "Novo Arquiteto" | "Novo Especificador" |
| `ArquitetosPage.jsx` modal/submit | "Cadastrar Arquiteto" | "Cadastrar Especificador" |
| `ArquitetosPage.jsx` empty state | "Nenhum arquiteto encontrado" / "Cadastre um novo arquiteto parceiro..." | "Nenhum especificador encontrado" / "Cadastre um novo especificador parceiro..." |
| `ArquitetosPage.jsx` busca | placeholder "Buscar arquiteto..." | "Buscar especificador..." |
| `BriefingPage.jsx:707` | "Arquiteto / Especificador (opcional +7 pts)" | "Especificador (opcional +7 pts)" |
| `constants.js:73` (`ORIGEM_LABELS.arquiteto`) | `'Arquiteto'` | `'Especificador'` |

## 4. Dono da carteira

Novas colunas em `Arquiteto`:
- `consultor_id = Column(Integer, ForeignKey("users.id"), nullable=True)`
- `status_carteira = Column(SAEnum(StatusCarteiraEspecificador), nullable=False, default=StatusCarteiraEspecificador.EM_PROSPECCAO)`

```python
class StatusCarteiraEspecificador(str, enum.Enum):
    ATIVO = "ativo"
    EM_PROSPECCAO = "em_prospeccao"
    INATIVO = "inativo"
```

`status_carteira` é independente do `is_active` já existente (que continua sendo o soft-delete da RN017 — nunca deletar, só desativar). `status_carteira` representa o estágio do relacionamento comercial e é editável livremente por quem tem permissão de escrita no cadastro.

Migration: linhas existentes recebem `status_carteira='ativo'` (já têm histórico), `consultor_id=NULL` (sem dono até alguém atribuir manualmente).

**Reatribuição de dono** — novo endpoint dedicado (não um PATCH genérico, para forçar a passagem pelo registro de histórico + notificação):

```
PATCH /arquitetos/{id}/dono
Body: { consultor_id: int }
Roles: DIRETORIA, GERENTE_COMERCIAL
```

Lógica: busca `consultor_anterior_id` atual, atualiza `Arquiteto.consultor_id`, cria registro em `HistoricoDonoArquiteto`, dispara `Notificacao` para o novo consultor.

Novo model:
```python
class HistoricoDonoArquiteto(Base):
    __tablename__ = "historico_dono_arquitetos"
    id = Column(Integer, primary_key=True, index=True)
    arquiteto_id = Column(Integer, ForeignKey("arquitetos.id"), nullable=False)
    consultor_anterior_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    consultor_novo_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    alterado_por_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    alterado_em = Column(DateTime(timezone=True), server_default=func.now())
```

Nova rota de leitura `GET /arquitetos/{id}/historico-dono` (qualquer usuário autenticado).

Notificação: novo valor em `TipoNotificacao` — `ESPECIFICADOR_TRANSFERIDO = "especificador_transferido"`. `Notificacao` ganha coluna nullable `arquiteto_id` (mesmo padrão do `projeto_id` que já existe), para linkar a notificação ao especificador transferido. Mensagem: "Você recebeu {nome} ({tipo}) na sua carteira."

**UI**: no drawer, aba "Perfil" mostra o nome do consultor dono (texto, não editável por qualquer um) + botão "Reatribuir" visível só para `DIRETORIA`/`GERENTE_COMERCIAL`, que abre um modal simples de seleção de novo consultor. Nova sub-seção "Histórico de donos" na mesma aba, lista cronológica somente-leitura.

## 5. Registro de interações

Novo model, mesmo padrão de `InteracaoLead`:

```python
class InteracaoArquiteto(Base):
    __tablename__ = "interacoes_arquitetos"
    id = Column(Integer, primary_key=True, index=True)
    arquiteto_id = Column(Integer, ForeignKey("arquitetos.id"), nullable=False)
    responsavel_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tipo = Column(String(50), nullable=False)  # ligacao, whatsapp, email, visita, reuniao
    resumo = Column(Text, nullable=False)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)  # rastreabilidade: essa interação gerou esse lead
    data = Column(DateTime(timezone=True), server_default=func.now())
```

Endpoints `GET/POST /arquitetos/{id}/interacoes` (mesmo padrão de decisores/concorrentes — qualquer autenticado lê, roles de escrita padrão do módulo criam).

**UI**: nova aba no drawer "Interações" (ao lado de Perfil / Score / Decisores & Concorrentes), reaproveitando o mesmo padrão visual de lista + form que o CRM de Leads já usa para `InteracaoLead`. Ao registrar, campo opcional "Lead gerado" (select dos leads vinculados a esse especificador) preenche `lead_id`.

## 6. Painel de KPIs da carteira

Novo endpoint `GET /arquitetos/kpis`:

```python
class EspecificadoresKpiResponse(BaseModel):
    especificadores_ativos: int
    pct_venda_mes: float
    pct_venda_ano: float
    atendimentos_mes: int
    visitas_escritorio_mes: int
```

Cálculo:
- `especificadores_ativos`: `count(Arquiteto.is_active == True)`
- `pct_venda_mes` / `pct_venda_ano`: `sum(Projeto.valor_contrato where arquiteto_id IS NOT NULL and criado_em no período) / sum(Projeto.valor_contrato no período)`, guardando contra divisão por zero (retorna `0.0` se o denominador for 0)
- `atendimentos_mes`: `count(InteracaoArquiteto no mês corrente, tipo != 'visita')`
- `visitas_escritorio_mes`: `count(InteracaoArquiteto no mês corrente, tipo == 'visita')`

**UI**: componente `EspecificadoresKpiPanel` (4 `KpiCard`s, reaproveitando o componente já existente), usado tanto no topo de `ArquitetosPage.jsx` quanto no `DashboardPage.jsx`.

## 7. Alerta de especificador esfriando

Novo valor em `TipoNotificacao`: `ESPECIFICADOR_ESFRIANDO = "especificador_esfriando"`. Checagem periódica (mesmo padrão de RN016/`PROJETO_PARADO`): para cada especificador com flag `em_risco_de_perda` já calculado pelo score, se a última `InteracaoArquiteto` tem mais de 30 dias (ou nunca houve nenhuma), dispara notificação para o `consultor_id` dono. Sem dono definido, não dispara (não há para quem notificar).

## 8. Meta de visitas configurável

Novo model:
```python
class MetaVisitasConsultor(Base):
    __tablename__ = "metas_visitas_consultor"
    id = Column(Integer, primary_key=True, index=True)
    consultor_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    meta_visitas_mes = Column(Integer, nullable=False, default=0)
    configurado_por_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())
```

Endpoints: `GET/PUT /arquitetos/metas-visitas` (lista/edita todas — roles `DIRETORIA`/`GERENTE_COMERCIAL`) e `GET /arquitetos/metas-visitas/me` (o próprio vendedor consulta sua meta e progresso do mês).

**UI**: tela simples de configuração (acessível só a gerente/diretoria) — tabela de vendedores com input de meta mensal. No painel de KPIs, o vendedor logado vê "visitado X de Y" usando sua própria meta; gestor/diretoria vê a visão agregada do time.

## Fora de escopo (Fase 1)

- Rename técnico (model/tabela/rotas/nomes de arquivo)
- Score influenciado por `tipo`
- Migração assistida de leads antigos (dados fictícios, sem necessidade agora)
- Ranking por tipo, portal do especificador, comissão rastreada, mapa de escritórios, anexos, relatório exportável — ver backlog abaixo

## Backlog Fase 2 (não faz parte deste spec — só registrado para referência futura)

1. Ranking dentro de cada tipo (comparar arquitetos entre si, designers entre si etc., em vez de um ranking único que mistura categorias com tickets muito diferentes)
2. Migração assistida de leads antigos com `origem=arquiteto`, quando os dados deixarem de ser fictícios
3. Ajuste de copy institucional em e-mails/comunicações automáticas que ainda falem em "parceria com arquitetos"
4. Portal do especificador — área externa para ele acompanhar status dos projetos que indicou
5. Programa de indicação com comissão rastreada por especificador
6. Mapa/geolocalização dos escritórios, para planejar rotas de visita por região
7. Anexos no perfil do especificador (book de projetos, catálogo enviado)
8. Relatório exportável (PDF/Excel) da carteira para reunião comercial

## Testes

Backend: migration aplica defaults corretamente em registros existentes (`tipo='arquiteto'`, `status_carteira='ativo'`); `POST /arquitetos/` exige `tipo`; filtro `GET /arquitetos/?tipo=decorador`; `PATCH /arquitetos/{id}/dono` cria histórico e notificação, e é bloqueado (403) para roles sem permissão; `GET /arquitetos/kpis` com casos de denominador zero (nenhum projeto no período); alerta de esfriamento dispara só quando há `consultor_id` e não dispara duplicado no mesmo período.

Frontend: verificação manual via skill `run`/`verify` — cadastro com tipo obrigatório, badge no card, filtro na listagem, reatribuição de dono (com o histórico aparecendo), registro de interação (ligação e visita), painel de KPIs nos dois locais, tela de configuração de metas.
