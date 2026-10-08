# Plano de Ação — Challenger 2: Integração CRM, Linha do Tempo e Ausência de N+1

## Objetivo
Realizar verificação empírica rigorosa da integração do módulo de Agenda com o CRM e Kanban de Leads no Plannit, atestando o funcionamento do badge do LeadCard com as cores de urgência corretas, a seção de compromissos e agendamento no LeadDrawer, a alimentação imediata da linha do tempo na conclusão de compromissos e a inexistência de regressões por consultas N+1 no endpoint `/crm`.

---

## Etapas de Execução

### Etapa 1: Validação de Tipagem e Build
- Executar `npm run typecheck` no diretório `plannit`.
- Assegurar 0 erros de TypeScript na integração backend/frontend.

### Etapa 2: Execução dos Testes Automatizados Japa
- Executar a suíte de testes funcionais `node ace test functional --files=tests/functional/agenda.spec.ts`.
- Validar se os testes existentes de integração com CRM passam com sucesso.

### Etapa 3: Desenvolvimento do Harness Empírico de Stress e Verificação
- Criar script de verificação empírica e stress (`plannit/scripts/test_challenger2_crm_agenda.js` ou suite equivalente) para testar diretamente:
  1. **Badge do LeadCard e urgência cromática**:
     - Simular compromissos de 3 cenários: Hoje, Atrasado e Futuro.
     - Validar que a API `/crm` entrega os flags booleanos `isHoje`, `isAtrasado` e que a função `getBadgeUrgenciaCompromisso` mapeia para as classes CSS exatas (`bg-blue-50`, `bg-rose-50`, `bg-stone-50`).
  2. **LeadDrawer**:
     - Validar dados de compromissos vinculados: tipo, status, responsável, desfecho, observações.
  3. **Vínculo do Lead no agendamento**:
     - Testar criação via `/agenda/compromissos` com `leadId` pré-selecionado (como enviado pelo modal do LeadDrawer).
  4. **Conclusão de compromisso e timeline imediata**:
     - Concluir compromisso com desfecho via `PATCH /agenda/compromissos/:id/concluir`.
     - Validar que `InteracaoLead` é gerada com o resumo contendo título e desfecho.
     - Validar que a consulta de `/crm` reflete imediatamente a timeline atualizada e limpa o badge se não houver outros pendentes.
  5. **Verificação Empírica de N+1 Queries**:
     - Monitorar e contar o número exato de consultas SQL disparadas em `GET /crm` com 1 lead versus 10 leads com compromissos e interações.
     - Provar empiricamente se a complexidade de queries é $O(1)$ (eager loading) ou $O(N)$ (N+1 query bug).

### Etapa 4: Execução dos Testes e Análise dos Resultados
- Executar o script de teste e capturar as evidências exatas (consultas SQL, dados retornados, assertivas).

### Etapa 5: Elaboração do Handoff e Emissão de Veredito
- Compilar o relatório completo com Observação, Logic Chain, Caveats, Conclusão e Método de Verificação.
- Emitir veredito explícito: APPROVE ou REJECT.
- Atualizar BRIEFING.md e progress.md.
- Enviar mensagem ao agente orquestrador via `send_message`.
