# Plano de Ação — Worker QA (Polimento e Garantia de Qualidade da Suíte de Testes)

## Contexto e Objetivo
Assegurar a execução limpa, sem erros e 100% verde de toda a suíte de testes funcionais do monólito Plannit (AdonisJS v7 + Inertia React 19), com verificação estrita de tipagem (typecheck), compilação de assets e bundles (build) e estabilidade de todos os testes funcionais.

---

## Etapas do Plano de Ação

### Etapa 1: Inspecionar e validar `tests/functional/crm_agenda_challenger_2.spec.ts`
- **Ação:** Verificar o estado da linha 485 e 846 onde ocorria a chamada inválida `db.on is not a function`.
- **Análise:** Confirmar se a implementação atual com `(db.connection() as any).getReadClient()` funciona de forma robusta e genuína, ou avaliar a necessidade de ajustes / limpeza de logs residuais.
- **Critério de Aceite:** Execução isolada do arquivo passando 100% sem erros de runtime.

### Etapa 2: Executar e validar `npm run typecheck`
- **Ação:** Rodar `npm run typecheck` no diretório `plannit/`.
- **Verificação:** Garantir código de saída 0 e 0 erros tanto no tsc do servidor quanto no tsc do frontend (Inertia).
- **Critério de Aceite:** Saída limpa com zero erros de compilação TypeScript.

### Etapa 3: Executar e validar `npm run build`
- **Ação:** Rodar `npm run build` no diretório `plannit/`.
- **Verificação:** Assegurar que os bundles do Vite e do AdonisJS sejam gerados sem falhas.
- **Critério de Aceite:** Código de saída 0, geração completa em `build/`.

### Etapa 4: Executar e validar a suíte oficial da Agenda (`agenda.spec.ts`)
- **Ação:** Rodar `node ace test functional --files=tests/functional/agenda.spec.ts`.
- **Verificação:** Confirmar aprovação de exatamente 15/15 testes especificados nos requisitos originais da tarefa.
- **Critério de Aceite:** 15 testes executados, 15 aprovados, 0 falhas.

### Etapa 5: Executar e validar a suíte completa de testes funcionais
- **Ação:** Rodar `node ace test functional` abrangendo todos os arquivos de teste da aplicação (`agenda.spec.ts`, `agenda_stress_adversarial.spec.ts`, `crm_agenda_challenger_2.spec.ts`, `configuracoes_and_qualificacao.spec.ts`, `leads_campanha.spec.ts`, `leads_especificador.spec.ts`, `leads_origem_outro.spec.ts`, `briefings_lead_duplicado.spec.ts`).
- **Verificação:** Garantir que nenhum teste falhe por concorrência de banco, deadlock ou asserção quebrada.
- **Critério de Aceite:** 100% dos testes aprovados na suíte funcional completa.

### Etapa 6: Documentação e Handoff
- **Ação:** Registrar evidências completas com saídas de terminal e comandos no relatório de 5 componentes em `handoff.md`, atualizar `BRIEFING.md` e `progress.md`.
- **Notificação:** Enviar mensagem formal de conclusão ao orchestrator via `send_message`.
