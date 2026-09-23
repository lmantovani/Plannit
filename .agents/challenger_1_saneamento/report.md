# Relatório de Desafio Adversarial — Challenger 1 (Saneamento R2)

**Data:** 2026-09-11T18:41:00Z  
**Autor:** Challenger 1 (Saneamento R2) (`.agents/challenger_1_saneamento`)  
**Escopo:** Validação empírica de RN001 (Qualificação de Leads), RN017 (Auditoria Imutável em `HistoricoStatusProjeto`) e R2 (Integridade Relacional de Clientes em Projetos e Conversão de Leads)

---

## Challenge Summary

**Overall risk assessment**: LOW

A implementação sob teste atendeu com rigor absoluto aos critérios de aceitação e aos guardrails de integridade relacional e auditoria. Todas as 47 asserções empíricas executadas contra o servidor HTTP real e o banco PostgreSQL 18 foram bem-sucedidas (100% de taxa de sucesso). As hipóteses adversariais de violação foram rejeitadas com os códigos de erro e transações atômicas esperadas.

---

## Challenges

### [Low] Desafio 1: Tentativa de avanço no funil via criação de briefing para lead desqualificado (RN001)
- **Assumption challenged:** "A API impede que um lead não qualificado (`qualificado = false`) avance no funil comercial ao gerar briefing ou projeto."
- **Attack scenario:** Enviar requisição `POST /briefings` informando apenas o `leadId` de um lead explicitamente registrado com `qualificado = false` em status preliminar de funil (`qualificando`).
- **Blast radius:** Se falhasse, permitiria que vendedores burlassem a qualificação de leads estabelecida na RN001, inflando a esteira de projetos com clientes frios ou desqualificados.
- **Resultado empírico:** O endpoint `briefings_controller.ts:store` interceptou a requisição antes de qualquer mutação, respondeu com HTTP 400, corpo `{ message: 'RN001: Lead não pode avançar no funil sem qualificação registrada', code: 'RN001_LEAD_NAO_QUALIFICADO' }`, e nenhuma linha foi criada nas tabelas `projetos`, `briefings` ou `clientes`.
- **Status:** PASS

### [Low] Desafio 2: Tentativa de conversão de lead não qualificado em cliente formal (RN001)
- **Assumption challenged:** "A conversão de lead em cliente (`POST /clientes/converter-lead/:leadId`) exige estritamente qualificação prévia."
- **Attack scenario:** Enviar requisição `POST /clientes/converter-lead/:leadId` com payload válido e completo de cliente (CPF, telefone, endereço) para um lead não qualificado.
- **Blast radius:** Se falhasse, permitiria converter leads não qualificados diretamente em clientes cadastrados na carteira.
- **Resultado empírico:** O endpoint `clientes_controller.ts:converterLead` validou a propriedade `!lead.qualificado`, retornando HTTP 400 `{ message: 'RN001: Lead não pode ser convertido sem qualificação registrada', code: 'RN001_LEAD_NAO_QUALIFICADO' }`. O lead permaneceu com `convertido_em_cliente = false`, `cliente_id = null` e `status_funil = 'qualificando'`.
- **Status:** PASS

### [Medium] Desafio 3: Desvinculação ou perda relacional de projetos na conversão de leads (R2)
- **Assumption challenged:** "Projetos pré-existentes criados durante a fase de prospecção do lead são atualizados atomicamente para apontar para o novo `cliente_id` gerado."
- **Attack scenario:** Criar 2 projetos com `lead_id = X` e `cliente_id = null`. Executar a conversão do lead. Verificar se a transação do banco atinge todos os projetos sem colateralidades ou registros órfãos.
- **Blast radius:** Se falhasse, projetos ficariam órfãos de cliente ou dissociados do histórico da ficha `/clientes/:id`.
- **Resultado empírico:** Ambos os projetos (`PRJ-CHALL-001` e `PRJ-CHALL-002`) tiveram `cliente_id` atualizado via transação atômica (`db.transaction`) para o identificador do cliente recém-criado. O lead foi sincronizado com `convertido_em_cliente = true`, `cliente_id = cliente.id` e `status_funil = 'fechado'`.
- **Status:** PASS

### [Medium] Desafio 4: Criação de briefing a partir de lead qualificado sem cliente prévio (R2)
- **Assumption challenged:** "Ao iniciar um briefing/projeto para lead qualificado sem cadastro de cliente, o sistema resolve e cria a entidade relacional na tabela `clientes` vinculando `projetos.cliente_id`."
- **Attack scenario:** Executar `POST /briefings` com `leadId` de lead qualificado que possui `cliente_id = null`.
- **Blast radius:** Se falhasse, geraria projeto com `cliente_id = null` violando a integridade relacional.
- **Resultado empírico:** O método `briefings_controller.ts:store` invocou `Cliente.firstOrCreate`, populou o cliente relacional no banco, atrelou `lead.cliente_id` e persistiu `projetos.cliente_id = cliente.id` de forma síncrona.
- **Status:** PASS

### [High] Desafio 5: Transição para a fila sem registro de auditoria imutável (RN017)
- **Assumption challenged:** "A transição de status do projeto de `EM_BRIEFING` para `NA_FILA` grava compulsoriamente um registro em `HistoricoStatusProjeto` com autor, status de origem, status de destino e justificativa descritiva dentro da mesma transação."
- **Attack scenario:** Submeter briefing qualificado (score >= 70) via `POST /briefings/:id/enviar-para-fila`. Consultar a tabela `historico_status_projeto` para verificar os metadados da tupla gravada.
- **Blast radius:** Se falhasse, haveria quebra do guardrail RN017 e perda de rastreabilidade de SLA na esteira de projetos.
- **Resultado empírico:** A transação atômica gerou exatamente 1 registro com `status_de = 'em_briefing'`, `status_para = 'na_fila'`, `alterado_por_id = vendedor.id`, e `observacao = 'Briefing aprovado com score de qualificação e enviado para a fila de projetos (RN017)'`.
- **Status:** PASS

### [Low] Desafio 6: Tentativa de avanço redundante / duplicação de histórico de projeto
- **Assumption challenged:** "Reenviar briefing que já se encontra no status 'enviado' deve ser rejeitado sem gerar novos registros de auditoria nem alterar a fila."
- **Attack scenario:** Repetir a requisição `POST /briefings/:id/enviar-para-fila` para o briefing já aprovado.
- **Blast radius:** Se falhasse, poluiria o histórico imutável com entradas repetidas ou reiniciaria a prioridade na fila.
- **Resultado empírico:** Requisição bloqueada com HTTP 400 (`Briefing já se encontra no status "enviado"`). A contagem de tuplas em `historico_status_projeto` permaneceu estritamente 1.
- **Status:** PASS

---

## Stress Test Results

| Cenário de Teste | Comportamento Esperado | Comportamento Observado | Status |
|---|---|---|---|
| `POST /briefings` com lead não qualificado (`qualificado = false`) | HTTP 400 com código `RN001_LEAD_NAO_QUALIFICADO` e sem persistência | HTTP 400 `{ code: 'RN001_LEAD_NAO_QUALIFICADO' }`, 0 projetos criados | PASS |
| `POST /briefings` com `leadId: 99999999` (inexistente) | HTTP 400 com código `LEAD_NOT_FOUND` | HTTP 400 `{ code: 'LEAD_NOT_FOUND' }` | PASS |
| `POST /clientes/converter-lead` com lead não qualificado | HTTP 400 com código `RN001_LEAD_NAO_QUALIFICADO` e lead inalterado | HTTP 400 `{ code: 'RN001_LEAD_NAO_QUALIFICADO' }`, lead inalterado | PASS |
| Conversão de lead qualificado com 2 projetos associados | HTTP 201, `projetos.cliente_id` de todos os 2 projetos atualizados | HTTP 201, projetos PRJ-CHALL-001 e PRJ-CHALL-002 atualizados com cliente ID | PASS |
| Criação de briefing para lead qualificado sem cliente prévio | Cria `Cliente`, vincula `cliente_id` no projeto e no lead | HTTP 201, `Cliente` criado e `projetos.cliente_id` populado | PASS |
| `POST /briefings/:id/enviar-para-fila` (score >= 70) | `projetos.status = 'na_fila'` + registro em `historico_status_projeto` (RN017) | HTTP 200, status atualizado e auditoria imutável gravada | PASS |
| Reenvio de briefing já enviado | HTTP 400 bloqueando mutação | HTTP 400, histórico imutável mantido sem duplicação | PASS |

---

## Unchallenged Areas

- **Concorrência em Versões 3D (R4 / `submeterVersao3D` com `forUpdate`)**: Atribuído exclusivamente ao Challenger 2 para testes de concorrência com requisições concorrentes paralelas.
- **Frontend Briefing Seção 6 (Inertia React 19 UI / Modal AJAX)**: Escopo de interface visual inspecionado pelo Reviewer Frontend e pelo próprio bundle do Vite.
