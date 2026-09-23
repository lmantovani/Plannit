# Plano de Ação — Saneamento Arquitetural e Correções do Plannit (R1 a R5)

## 1. Visão Geral e Objetivos
Este plano estabelece a estratégia rigorosa para implementar as 5 correções arquiteturais e de integridade de regras de negócio solicitadas para a aplicação Plannit (AdonisJS v7 + Lucid ORM + Inertia.js + React 19):
- **R1**: Integração Relacional de Especificadores no Briefing e Projetos.
- **R2**: Integridade Relacional de Clientes em Projetos e na Conversão de Leads.
- **R3**: Auditoria Imutável no Envio de Briefing à Fila (RN017).
- **R4**: Blindagem contra Concorrência em Versões 3D.
- **R5**: Validação Estrita do Funil de Qualificação de Leads (RN001).

## 2. Fases de Execução

### Fase 0: Mapeamento e Diagnóstico Técnico (Survey)
- **Objetivo**: Inspecionar em detalhes o código-fonte atual dos arquivos afetados sem realizar modificações prematuras.
- **Subagentes**: 3 Explorers em paralelo:
  - `explorer_1_r2`: Foco em R1 (`inertia/pages/briefings/edit.tsx`, `app/controllers/briefings_controller.ts`, `app/validators/briefing.ts`, tabelas e modelos `arquitetos` e `projetos`).
  - `explorer_2_r2`: Foco em R2 e R3 (`app/controllers/clientes_controller.ts`, `app/controllers/briefings_controller.ts`, tabelas e modelos `clientes`, `projetos`, `leads`, `historico_status_projeto`, RN017).
  - `explorer_3_r2`: Foco em R4 e R5 (`app/controllers/projetos_controller.ts:submeterVersao3D`, `app/controllers/briefings_controller.ts:store`, `clientes_controller.ts:converterLead`, tabela `versoes_3d`, RN001).
- **Entregável**: Relatórios detalhados com localização de linhas, assinaturas, fluxos atuais e pontos de intervenção cirúrgica.

### Fase 1: Síntese e Consolidação dos Milestones
- **Objetivo**: Consolidar os relatórios dos Explorers, refinar interface contracts e preparar as diretrizes para os Workers.
- **Entregável**: Atualização de `PROJECT.md` e briefing técnico.

### Fase 2: Implementação com Workers Especializados
- **Subagentes**:
  - `worker_backend_r2`: Implementação cirúrgica no backend (controllers, validators, models, transações atômicas, queries forUpdate / MAX+1, validações HTTP 400 RN001 e auditoria RN017).
  - `worker_frontend_r2`: Implementação no frontend (`inertia/pages/briefings/edit.tsx` Seção 6 com seleção de parceiros, preenchimento automático, modal de cadastro rápido sem perda de rascunho).
- **Validação Preliminar**: Workers devem rodar `npm run typecheck` e `npm run build` e registrar resultados em seus relatórios de handoff.

### Fase 3: Verificação Independente e Testes Automatizados
- **Subagentes**:
  - `teamwork_preview_reviewer` (2 instâncias independentes): Verificação de corretude, tipagem, conformidade de contratos e ausência de regressões.
  - `teamwork_preview_challenger` (2 instâncias independentes): Criação de testes adversariais automatizados (concorrência 3D, tentativa de violação de RN001, rastreamento RN017, integridade relacional).

### Fase 4: Auditoria Forense de Integridade
- **Subagente**: `teamwork_preview_auditor`: Verificação estrita contra mocks, hardcoded strings, falsificação de dados ou bypass de regras de negócio. Binary Veto incondicional.

### Fase 5: Conclusão, Relatório de Handoff e Notificação ao Sentinel
- Elaboração do `handoff.md` estruturado.
- Comunicação formal ao Sentinel (`send_message`) para acionamento da Victory Audit independente.

## 3. Critérios de Aceite Inegociáveis
1. `npm run typecheck` com exatamente zero erros.
2. `npm run build` gerando os bundles de produção com sucesso.
3. Todas as 5 regras (R1 a R5) funcionando de forma integrada e comprovadas por testes automatizados.
4. Veredicto CLEAN em auditoria forense.
