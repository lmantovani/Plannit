# Original User Request

## Initial Request — 2026-09-10T13:41:09Z

Implementar o módulo completo de Especificadores (Arquitetos, Designers, Decoradores e Engenheiros) no ERP/CRM Plannit (Líder Móveis Planejados) utilizando a stack full-stack AdonisJS v7, Inertia.js e React 19 no PostgreSQL. O módulo inclui o motor analítico de Score RFV × Potencial × Lealdade calculado no backend, classificação em 7 segmentos comportamentais, 5 flags de risco/oportunidade, gestão de decisores do escritório, monitoramento de concorrência, auditoria imutável de dono de carteira (RN017), metas mensais de visitas comerciais e interface web integrada com KPIs e drawer lateral.

Working directory: /home/porto/codespace/Plannit/plannit
Integrity mode: development

## Requirements

### R1. Domínio de Dados e Relacionamentos de Especificadores
O sistema deve persistir e gerenciar as entidades de Especificadores (`arquitetos`), Decisores de escritório (`decisores_arquitetos`), Monitoramento de concorrência (`concorrentes_arquitetos`), Histórico de dono de carteira (`historico_dono_arquitetos`), Registro cronológico de interações (`interacoes_arquitetos`), Metas de visitas mensais por consultor (`metas_visitas_consultor`) e vínculo bidirecional com `projetos` (`arquiteto_id`) e `leads`.

### R2. Motor de Pontuação Analítico RFV × Potencial × Lealdade
O backend deve disponibilizar um serviço determinístico que calcula sob demanda, a partir dos dados reais do banco, a pontuação multidimensional de cada especificador:
- **RFV (0-100)**: média aritmética de Recência (dias desde último projeto), Frequência (projetos nos últimos 12 meses) e Valor (soma de contratos nos últimos 12 meses).
- **Potencial (0-100)**: pipeline futuro composto por leads ativos no funil + projetos em andamento não arquivados.
- **Lealdade (0-100)**: média de Tempo de parceria (meses desde cadastro), Consistência (% de meses distintos com projetos no último ano) e Taxa de conversão de leads (default neutro 50%).
- **Score Geral (0-100)**: média dos 3 pilares.
- **7 Segmentos Comportamentais**: classificação em cascata (`inativo`, `novo_promissor`, `em_risco`, `campeao`, `parceiro_fiel`, `em_ascensao`, `ocasional`).
- **5 Flags Ativas**: `top_indicador`, `em_risco_de_perda`, `alto_potencial`, `indicacao_alto_valor`, `especificador_esfriando`.
- **Risco de Concorrência**: indicador isolado derivado do maior percentual de fechamento estimado entre os concorrentes (baixo < 30%, médio 30-60%, alto > 60%).
- **KPIs de Carteira**: total de ativos, % vendas com especificador no mês/ano, total de atendimentos e visitas ao escritório.

### R3. Preservação de Histórico e Guardrails de Auditoria (RN017)
- Especificadores nunca devem sofrer exclusão física do banco de dados na rotina operacional; a desativação deve ser estritamente lógica (`is_active = false`).
- Qualquer alteração no consultor dono do especificador deve registrar auditoria imutável em `historico_dono_arquitetos` com consultor anterior, novo consultor, autor da mudança e timestamp UTC, notificando o destinatário.

### R4. Interface Visual Interativa (Inertia.js + React 19)
- Adicionar o item "Especificadores" na sidebar com navegação nativa e indicador visual ativo.
- Visão principal em `/especificadores` contendo painel superior de KPIs de carteira, meta individual de visitas para vendedores, toolbar com busca textual e filtros combinados (tipo, status de carteira, consultor para gestores), tabela estruturada com badges e botão de criação.
- Drawer lateral retrátil e página dedicada `/especificadores/:id` organizados em 3 abas:
  - **Aba Perfil**: informações cadastrais, histórico cronológico de interações com formulário de novo contato e painel de transferências com reatribuição de dono.
  - **Aba Score**: valor numérico do Score Geral, badge do segmento, tags das flags ativas, barras de progresso comparativas dos 3 pilares, breakdown detalhado e risco de concorrência.
  - **Aba Decisores & Concorrentes**: lista de contatos-chave com identificação do decisor principal (permitindo adição/remoção) e tabela de concorrentes com percentuais de fechamento.
- Modais para cadastro de novo especificador e configuração gerencial de metas de visitas mensais por consultor.

## Acceptance Criteria

### Integridade do Modelo e Migrations
- [ ] Todas as migrations executam com sucesso via `node ace migration:run` sem erros de chave estrangeira ou duplicidade.
- [ ] O relacionamento com `projetos` e `leads` permite consultas e agregações corretas por `arquiteto_id`.

### Exatidão do Motor de Pontuação
- [ ] O cálculo de score produz notas entre 0 e 100 para todos os pilares (RFV, Potencial, Lealdade, Score Geral).
- [ ] Especificadores sem histórico recebem segmento `inativo`; especificadores com score >= 85 recebem segmento `campeao` e flag `top_indicador`; especificadores parados há > 180 dias com dono recebem flag `especificador_esfriando` quando aplicável.
- [ ] O frontend consome o score exclusivamente gerado pelo backend, sem recalcular valores localmente.

### Regras de Negócio e Auditoria (RN017)
- [ ] A exclusão de um especificador executa soft delete (`is_active = false`) e ele deixa de aparecer na listagem padrão.
- [ ] A reatribuição de consultor dono gera um registro imutável em `historico_dono_arquitetos`.

### Validação Automatizada e Compilação
- [ ] O seeder `database/seeders/arquiteto_seeder.ts` roda com sucesso populando dados para os 7 segmentos e metas de visitas.
- [ ] O script de teste automatizado `scripts/test_arquiteto_score.js` é executado com 100% de sucesso.
- [ ] O script de teste de integração HTTP `scripts/test_http_arquitetos.js` valida autenticação, rotas de listagem, reatribuição, interações e soft delete.
- [ ] O comando `npm run typecheck` conclui com 0 erros de tipagem TypeScript.
- [ ] O comando `npm run build` conclui o empacotamento do Vite com sucesso.

## 2026-09-11T18:07:30Z

Saneamento arquitetural e implementação das correções para as 5 inconsistências identificadas no ecossistema Plannit (AdonisJS v7 + Lucid ORM + Inertia React 19): integridade relacional de clientes e arquitetos, auditoria imutável RN017, blindagem contra concorrência em versões 3D e respeito rigoroso à qualificação de leads RN001.

Working directory: /home/porto/codespace/Plannit/plannit
Integrity mode: development

## Requirements

### R1. Integração Relacional de Especificadores/Parceiros no Briefing e Projetos
Na Seção 6 de `inertia/pages/briefings/edit.tsx`, permitir selecionar parceiros da tabela `arquitetos` com auto-preenchimento de dados de contato (Nome, Escritório, E-mail, Telefone), mantendo opção de cadastro rápido via modal sem recarregar a tela (sem perda de rascunho). Em `app/controllers/briefings_controller.ts` (`edit` e `update`) e `app/validators/briefing.ts`, aceitar `arquitetoId` e sincronizar em `projetos.arquiteto_id`.

### R2. Integridade Relacional de Clientes em Projetos e Conversão de Leads
Garantir que a criação de projetos em `briefings_controller.ts` e modais associe ou crie a entidade relacional na tabela `clientes` populando `projetos.cliente_id`. Em `app/controllers/clientes_controller.ts:converterLead`, ao converter um lead em cliente, atualizar todos os projetos associados àquele lead (`where('lead_id', lead.id)`) definindo `cliente_id = cliente.id`.

### R3. Auditoria Imutável no Envio de Briefing à Fila (RN017)
Em `app/controllers/briefings_controller.ts:enviarParaFila`, registrar obrigatoriamente a transição de status em `HistoricoStatusProjeto` (`statusDe: EM_BRIEFING`, `statusPara: NA_FILA`, autor e justificativa descritiva), garantindo a rastreabilidade e métricas de SLA da esteira.

### R4. Blindagem Contra Concorrência em Versões 3D
Em `app/controllers/projetos_controller.ts:submeterVersao3D`, garantir transação atômica segura com bloqueio (`forUpdate`) ou query de `MAX(versao) + 1` no banco para evitar conflitos de versão sob concorrência.

### R5. Validação Estrita do Funil de Qualificação (RN001)
Em `app/controllers/briefings_controller.ts:store` e `app/controllers/clientes_controller.ts:converterLead`, rejeitar a criação de briefing/projeto ou conversão a partir de leads que possuam `qualificado === false`, retornando erro HTTP 400 com mensagem informativa da RN001.

## Acceptance Criteria

### Integridade e Tipagem
- [ ] `npm run typecheck` executado com sucesso e zero erros de tipagem TypeScript.
- [ ] `npm run build` executado com sucesso gerando bundles sem falhas.

### Verificação Funcional e de Banco de Dados
- [ ] Briefing editado com arquiteto parceiro selecionado persiste `projetos.arquiteto_id` e exibe os dados de contato no formulário.
- [ ] Conversão de lead com projeto associado atualiza `projetos.cliente_id` e a ficha do cliente em `/clientes/:id` exibe seus projetos históricos.
- [ ] Envio de briefing para a fila gera registro correspondente na tabela `historico_status_projeto`.
- [ ] Tentativa de criar projeto a partir de lead não qualificado é bloqueada com erro explicativo da RN001.
- [ ] Submissão de versão 3D gera incrementos sequenciais íntegros.

