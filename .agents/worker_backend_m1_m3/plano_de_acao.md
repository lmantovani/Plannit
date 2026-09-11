# Plano de Ação — Módulo de Especificadores (Backend M1, M2, M3)

## Objetivo
Implementar as Milestones M1, M2 e M3 do módulo de Especificadores do Plannit (AdonisJS v7, Lucid ORM, PostgreSQL) cobrindo schema de banco, models, motor determinístico de score analítico (RFV × Potencial × Lealdade, 7 segmentos, 5 flags), guardrails de auditoria (RN017 - soft delete e reatribuição de dono imutável), controllers e rotas protegidas.

---

## Fases de Execução

### Fase 1: Migrations e Schema de Banco de Dados (M1)
1. Criar migration `1761885935177_create_arquitetos_tables.ts`:
   - Tabela `arquitetos`: campos cadastrais, `consultor_id` (FK `users.id`), `is_active` (default true) e índices.
   - Tabela `decisores_arquitetos`: contatos do escritório, `is_principal`, FK cascata para `arquitetos.id`.
   - Tabela `concorrentes_arquitetos`: concorrentes, `percentual_fechamento_estimado`, FK cascata para `arquitetos.id`.
   - Tabela `historico_dono_arquitetos`: imutabilidade de dono de carteira (RN017), consultor anterior, consultor novo, alterado por, motivo e timestamp UTC.
   - Tabela `interacoes_arquitetos`: histórico cronológico de contatos (`tipo`, `resumo`, `data`, `responsavel_id`, `lead_id`).
   - Tabela `metas_visitas_consultor`: metas mensais de visitas comerciais por consultor (`consultor_id` UNIQUE).
2. Criar migration `1761885935178_add_arquiteto_id_to_projetos_and_leads.ts`:
   - Adicionar coluna `arquiteto_id` em `projetos` com foreign key (`ON DELETE SET NULL`) e índice.
   - Adicionar constraint `fk_leads_arquiteto` em `leads.arquiteto_id` referenciando `arquitetos.id` (`ON DELETE SET NULL`) e índice.
3. Executar `node ace migration:run` e certificar que as tabelas e classes de schema foram geradas em `database/schema.ts`.

### Fase 2: Modelos Lucid ORM e Relacionamentos (M1)
1. Criar os models tipados herdando dos schemas gerados em `database/schema.ts`:
   - `app/models/arquiteto.ts` com enums (`NivelParceria`, `TipoEspecificador`, `StatusCarteiraEspecificador`) e relações `@belongsTo`, `@hasMany`.
   - `app/models/decisor_arquiteto.ts` com relação `@belongsTo(() => Arquiteto)`.
   - `app/models/concorrente_arquiteto.ts` com relações para `Arquiteto` e `User`.
   - `app/models/historico_dono_arquiteto.ts` com relações para `Arquiteto`, `User` (consultor anterior, novo, alterador).
   - `app/models/interacao_arquiteto.ts` com enum `TipoInteracaoArquiteto` e relações para `Arquiteto`, `User`, `Lead`.
   - `app/models/meta_visitas_consultor.ts` com relações para `User`.
2. Atualizar models existentes:
   - `app/models/user.ts`: adicionar relações `arquitetos` (`hasMany`) e `metaVisitas` (`hasOne`).
   - `app/models/projeto.ts`: adicionar relação `arquiteto` (`belongsTo`).
   - `app/models/lead.ts`: adicionar relação `arquiteto` (`belongsTo`).

### Fase 3: Motor Analítico de Score e Regras de Negócio (M2)
1. Criar `app/services/arquiteto_score_service.ts`:
   - Funções puras de cálculo:
     - `pontuarRecencia`: faixas <=30d (100), <=90d (70), <=180d (40), <=365d (20), >365d (5), null (0).
     - `pontuarFrequencia`: 0 (0), 1 (30), 2-3 (60), 4-6 (85), 7+ (100).
     - `pontuarValor`: null/0 (0), <50k (30), <150k (55), <350k (75), <700k (90), >=700k (100).
     - `calcularRFV`: média aritmética arredondada para 1 casa decimal.
     - `pontuarPotencial`: pipeline futuro (leads ativos + projetos ativos).
     - `pontuarTempoParceria`: meses desde cadastro (<3m: 20, <12m: 50, <24m: 75, >=24m: 100).
     - `pontuarConsistencia`: proporção de meses distintos com projetos no último ano.
     - `pontuarTaxaConversao`: leads fechados / total terminal (50.0 neutro se sem leads terminais).
     - `calcularLealdade` e `calcularScoreGeral`.
   - Cascata exata dos 7 segmentos comportamentais (`inativo`, `novo_promissor`, `em_risco`, `campeao`, `parceiro_fiel`, `em_ascensao`, `ocasional`).
   - Avaliação simultânea das 5 flags ativas (`top_indicador`, `em_risco_de_perda`, `alto_potencial`, `indicacao_alto_valor`, `especificador_esfriando`).
   - `calcularRiscoConcorrencia`: maior percentual estimado (baixo <30%, médio 30-60%, alto >60%).
   - Funções de integração com banco: `calcularScoreArquiteto`, `calcularKpisCarteira` e `obterMetaVisitasConsultor`.

### Fase 4: Validações com VineJS (M3)
1. Criar `app/validators/arquiteto.ts`:
   - `createArquitetoValidator`, `updateArquitetoValidator`.
   - `reatribuirDonoValidator`.
   - `decisorValidator`, `updateDecisorValidator`.
   - `concorrenteValidator`, `updateConcorrenteValidator`.
   - `interacaoArquitetoValidator`.
   - `metaVisitasValidator`.

### Fase 5: Controllers, Endpoints e Guardrails RN017 (M3)
1. Criar `app/controllers/arquitetos_controller.ts`:
   - `index`: listagem com filtros (tipo, statusCarteira, consultorId, busca), cálculo de scores, KPIs de carteira, meta individual e suporte duplo (Inertia view e JSON).
   - `show`: detalhamento com decisores, concorrentes, interações cronológicas, histórico de dono e score.
   - `store`: criação com persistência e log inicial de dono se atribuído.
   - `update`: atualização dos dados cadastrais.
   - `destroy`: soft delete estrito (`is_active = false`) sem exclusão física.
   - `reatribuirDono`: transação com atualização do `consultor_id` e inserção imutável em `historico_dono_arquitetos`.
   - Sub-recursos: CRUD de decisores (com controle de decisor único principal), CRUD de concorrentes e registro de interações.
   - Gestão de metas: `listarMetas`, `definirMeta` e `minhaMeta`.
2. Registrar rotas em `start/routes.ts`:
   - Declaração estrita de rotas estáticas antes de dinâmicas dentro do grupo `middleware.auth()`.

### Fase 6: Verificação, Compilação e Handoff
1. Executar `npm run typecheck` para garantir 0 erros de compilação TypeScript.
2. Atualizar documentação e gerar o relatório final de 5 seções em `handoff.md`.
3. Notificar o agente pai via `send_message`.
