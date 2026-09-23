# Progress — Worker Backend (R2)

- Last visited: 2026-09-11T18:30:00Z
- Status: Concluído com sucesso (M6).

## Atividades Realizadas:
1. `plannit/app/validators/briefing.ts`:
   - Atualizado `arquitetoTelefone` para `maxLength(30)` nos schemas `saveBriefingValidator` e `calcularScoreValidator`.
2. `plannit/app/controllers/clientes_controller.ts`:
   - Importados `db` e `Projeto`.
   - Em `converterLead`: validação estrita da RN001 (`lead.qualificado === false`) retornando HTTP 400 (`RN001_LEAD_NAO_QUALIFICADO`).
   - Transação atômica englobando criação de `Cliente`, `EnderecoCliente`, atualização de projetos associados via `Projeto.query({ client: trx }).where('lead_id', lead.id).update({ cliente_id: cliente.id })` e atualização do `Lead`.
3. `plannit/app/controllers/briefings_controller.ts`:
   - Importados `Cliente` e `Lead`.
   - Em `store`: validação estrita da RN001 (`lead.qualificado === false`) retornando HTTP 400 (`RN001_LEAD_NAO_QUALIFICADO`). Resolução relacional de `clienteId` via `lead.clienteId` ou `Cliente.firstOrCreate` garantindo vínculo em `Projeto.create`.
   - Em `update`: sincronização relacional defensiva de `arquitetoId` e `arquitetoNome` no projeto associado.
   - Em `enviarParaFila`: captura de `auth.user.id` e registro imutável em `HistoricoStatusProjeto` (`EM_BRIEFING` -> `NA_FILA`) na mesma transação atômica.
4. `plannit/app/controllers/projetos_controller.ts`:
   - Em `submeterVersao3D`: transação imediata, bloqueio pessimista `.forUpdate()` no `Projeto`, cálculo atômico do número da versão via `MAX(versao) + 1` no banco de dados e atualização de status/histórico.
5. Verificação:
   - `npm run typecheck` executado com 0 erros.
   - `npm run build` executado com sucesso gerando bundles sem falhas.
