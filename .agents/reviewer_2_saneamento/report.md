# Relatório de Revisão Técnica e Adversarial (Reviewer 2 — Saneamento R2)

**Data:** 2026-09-11T18:35:00Z  
**Revisor:** Reviewer 2 (Saneamento R2)  
**Diretório:** `.agents/reviewer_2_saneamento`  
**Escopo:** Robustez transacional, concorrência, integridade relacional, RN001 e RN017  
**Alvo:** Full-stack Plannit (AdonisJS v7 + Lucid ORM + Inertia.js + React 19)

---

## 1. Quality Review Summary

**Veredito Geral:** **APPROVE**  
Nenhuma violação de integridade detectada (sem facades, sem bypasses, sem mocks ocultos, sem hardcoded overrides). Os 5 requisitos da rodada de saneamento R2 (R1 a R5) foram implementados com rigor técnico exemplar, observando os princípios de isolamento transacional, locking pessimista, blindagem de funil (RN001) e auditoria imutável (RN017).

---

## 2. Avaliação por Dimensão de Engenharia

### 2.1. Concorrência e Locking Pessimista (R4: `submeterVersao3D`)
- **Arquivo:** `plannit/app/controllers/projetos_controller.ts` (linhas 490–585)
- **Mecanismo:** Abertura imediata de transação `db.transaction(async (trx) => { ... })` com aquisição de trava de linha pessimista `FOR UPDATE` no registro pai:
  ```typescript
  const projeto = await Projeto.query({ client: trx })
    .where('id', params.id)
    .forUpdate()
    .first()
  ```
- **Cálculo Atômico de Versão:** A query de agregação executa diretamente no banco de dados sob o escopo da mesma conexão transacional:
  ```typescript
  const maxVersaoRes = await trx
    .from('projetos_comerciais')
    .where('projeto_id', projeto.id)
    .max('versao as max_versao')
    .first()
  proximaVersao = (Number(maxVersaoRes?.max_versao) || 0) + 1
  ```
- **Avaliação de Robustez:** Em caso de requisições simultâneas de submissão 3D para o mesmo projeto, a segunda transação é pausada pelo PostgreSQL (`RowExclusiveLock`) até a primeira realizar o commit. Sob isolamento *Read Committed*, a segunda transação enxerga a nova tupla inserida e incrementa sequencialmente a versão (`v+1`), eliminando race conditions e conflitos de chave única.
- **Tratamento de Exceção:** Caso o projeto não exista (`projetoNaoEncontrado = true`) ou esteja arquivado (`projetoArquivado = true`), a transação fecha sem efetuar escritas espúrias e o controller retorna HTTP 404 ou 400 adequadamente.

### 2.2. Transacionalidade e Integridade em Massa (R2: `converterLead`)
- **Arquivo:** `plannit/app/controllers/clientes_controller.ts` (linhas 296–362)
- **Barreira RN001:** Verificação prévia estrita:
  ```typescript
  if (!lead.qualificado) {
    session.flash('error', 'RN001: Lead não pode ser convertido sem qualificação registrada')
    return response.badRequest({
      message: 'RN001: Lead não pode ser convertido sem qualificação registrada',
      code: 'RN001_LEAD_NAO_QUALIFICADO',
    })
  }
  ```
- **Escopo da Transação:** Envolve 4 operações atômicas sob `trx`:
  1. `Cliente.create(..., { client: trx })`
  2. `EnderecoCliente.create(..., { client: trx })` (se endereço preenchido)
  3. Atualização em massa dos projetos pré-existentes:
     ```typescript
     await Projeto.query({ client: trx })
       .where('lead_id', lead.id)
       .update({ cliente_id: cliente.id })
     ```
  4. Atualização de status e vínculo do lead (`lead.useTransaction(trx)`, `lead.convertidoEmCliente = true`, `lead.clienteId = cliente.id`, `lead.statusFunil = 'fechado'`, `lead.save()`).
- **Avaliação de Robustez:** Se qualquer etapa falhar (ex: violação de constraint de CPF/e-mail no cliente), a transação é 100% revertida por rollback automático do Lucid. Nenhum cliente órfão é criado e os projetos permanecem intactos.

### 2.3. Auditoria Imutável de Transição (R3: `enviarParaFila` & RN017)
- **Arquivo:** `plannit/app/controllers/briefings_controller.ts` (linhas 507–624)
- **Barreira RN002:** Cálculo determinístico de score prévio. Se `< 70 pts`, rejeita imediatamente com HTTP 400 sem iniciar transação nem alterar status.
- **Atomicidade da Esteira:** Dentro de `db.transaction(async (trx) => { ... })`:
  - `briefing.status = StatusBriefing.ENVIADO`
  - Upsert na `FilaProjeto` (`status: StatusFila.AGUARDANDO`)
  - `projeto.status = StatusProjeto.NA_FILA`
  - Gravação compulsória da tupla de auditoria em `HistoricoStatusProjeto`:
    ```typescript
    await HistoricoStatusProjeto.create(
      {
        projetoId: projeto.id,
        statusDe: statusAnterior,
        statusPara: StatusProjeto.NA_FILA,
        alteradoPorId: user.id,
        observacao: 'Briefing aprovado com score de qualificação e enviado para a fila de projetos (RN017)',
      },
      { client: trx }
    )
    ```
- **Avaliação de Robustez:** Garantia matemática de que nenhum projeto transita de `EM_BRIEFING` para `NA_FILA` sem que o registro de auditoria imutável seja persistido na mesma unidade de trabalho.

### 2.4. Respeito ao Funil de Qualificação (R5 / RN001: `briefings_controller.ts:store`)
- **Arquivo:** `plannit/app/controllers/briefings_controller.ts` (linhas 282–297)
- **Mecanismo:** Checagem precoce de `leadId`. Se `!lead.qualificado`, responde com HTTP 400 (`RN001_LEAD_NAO_QUALIFICADO`).
- **Resolução de Cliente:** Quando o lead é qualificado, reaproveita `lead.clienteId` ou invoca `Cliente.firstOrCreate(...)`, garantindo que `projetos.cliente_id` seja obrigatoriamente preenchido.

### 2.5. Resiliência do Frontend (R1: `inertia/pages/briefings/edit.tsx`)
- **Arquivo:** `plannit/inertia/pages/briefings/edit.tsx`
- **Isolamento de Rascunho:** A criação de parceiro no modal rápido inline utiliza requisição assíncrona AJAX nativa (`fetch('/especificadores?format=json', ...)` com cabeçalho `X-XSRF-TOKEN` e `Accept: application/json`).
- **Tratamento de Erros e Feedback:**
  - Validação prévia de campos obrigatórios (nome >= 2 chars).
  - Estado de loading explícito (`salvando`, botão desabilitado e spinner animado `Loader2`).
  - Tratamento de erro 4xx/5xx com extração de mensagens de validação (`errData.errors[0].message`) e exibição em banner estilizado.
  - Zero recarregamento de tela (`router.reload` NÃO é chamado), preservando na íntegra o rascunho de todas as Seções 1 a 5.
- **Sincronização Bidirecional:** Atualização de `formData.arquitetoId` no `handleSave` e `handleEnviarFila`, impedindo perda de vínculo do parceiro no backend.

---

## 3. Findings & Observações Técnicas

### [Observação Positiva] Proteção Contra Regressão de Telefone
Em `plannit/app/validators/briefing.ts`, o campo `arquitetoTelefone` foi ampliado de `maxLength(20)` para `maxLength(30)`, alinhando o validador do VineJS com a coluna da tabela `arquitetos` no PostgreSQL e evitando erros espúrios de validação em números internacionais ou com ramal.

### [Observação Menor / Não-Bloqueante] Uso de `useTransaction` em `filaExistente`
Em `briefings_controller.ts:585-588`:
```typescript
filaExistente.status = StatusFila.AGUARDANDO
filaExistente.dataEntradaFila = DateTime.now()
await filaExistente.save()
```
Como `filaExistente` foi recuperado através de `FilaProjeto.query({ client: trx })`, a instância do Lucid já possui `$trx` vinculado. No entanto, para fins de simetria com `projeto.useTransaction(trx)` na linha 594, uma chamada explícita a `filaExistente.useTransaction(trx)` pode ser adotada em futuras manutenções defensivas.

---

## 4. Adversarial Challenge Report

### 4.1. Challenge 1 — Concorrência de Submissão 3D e Race Conditions
- **Hipótese Desafiada:** Duas maquetes submetidas simultaneamente no mesmo milissegundo por projetistas poderiam ler o mesmo `MAX(versao)` e gerar duplicidade ou corromper a ordenação.
- **Cenário de Estresse:** Chamadas paralelas de `POST /projetos/:id/submeter-versao-3d` com o mesmo `projetoId`.
- **Resultado:** A cláusula `.forUpdate()` impõe bloqueio exclusivo no nível de linha do PostgreSQL. A segunda transação aguarda a conclusão da primeira. A agregação `MAX(versao)` é reavaliada no momento da execução, garantindo que a versão subsequente seja exatamente `v + 1`.
- **Status:** **PASS** (Blindagem confirmada).

### 4.2. Challenge 2 — Bypass de Qualificação RN001 via Payload Direto
- **Hipótese Desafiada:** Um cliente de API ou script automatizado poderia tentar criar projeto ou converter lead não qualificado enviando requisições REST manuais para `/briefings` ou `/clientes/converter-lead/:id`.
- **Cenário de Estresse:** Submissão com `leadId` não qualificado (`qualificado = false`).
- **Resultado:** Ambos os endpoints rejeitam a requisição antes de qualquer escrita no banco, respondendo estritamente com status HTTP 400 e payload `{ message: 'RN001: ...', code: 'RN001_LEAD_NAO_QUALIFICADO' }`.
- **Status:** **PASS** (Zero efeitos colaterais).

### 4.3. Challenge 3 — Integridade em Falhas de Conversão de Lead (Rollback)
- **Hipótese Desafiada:** Se o cadastro de endereço ou atualização de projetos falhar durante a conversão do lead, o lead poderia ficar marcado como convertido ou o cliente ficar órfão.
- **Cenário de Estresse:** Lançamento de erro ou falha no meio do bloco de transação.
- **Resultado:** O encapsulamento de `Cliente.create`, `EnderecoCliente.create`, `Projeto.query({ client: trx }).update` e `lead.save()` em `db.transaction` assegura rollback atômico.
- **Status:** **PASS** (Sem orfandade de registros).

### 4.4. Challenge 4 — Perda de Rascunho no Modal de Parceiro (Frontend)
- **Hipótese Desafiada:** Ao cadastrar um novo arquiteto na Seção 6 do briefing, um submit padrão de formulário ou recarregamento de página destruiria o rascunho de cômodos e medidas digitado nas Seções 1 a 5.
- **Cenário de Estresse:** Preenchimento de ambientes detalhados seguido de cadastro rápido de arquiteto via modal.
- **Resultado:** O modal utiliza `fetch` assíncrono com cabeçalho `Accept: application/json` e `X-XSRF-TOKEN`. O backend retorna status 201 com o novo registro JSON. O callback `handleArquitetoCriado` atualiza apenas o estado local React (`setListaEspecificadores` e `formData`), mantendo 100% dos dados pré-preenchidos intactos.
- **Status:** **PASS** (Rascunho 100% preservado).

---

## 5. Verified Claims Matrix

| Reivindicação | Método de Verificação Independente | Resultado |
|---|---|---|
| `npm run typecheck` passa com 0 erros | `tsc --noEmit && tsc --noEmit --project inertia/tsconfig.json` | **PASS (0 erros)** |
| `npm run build` compila o bundle sem falhas | `vite build` + compilação Adonis TypeScript | **PASS (0 erros)** |
| `test_http_projetos_render.js` passa em 100% dos testes | Execução Node HTTP (13 asserções: RN004, RN005, RN017, submeterVersao3D) | **PASS (13/13)** |
| `test_http_clientes.js` passa em 100% dos testes | Execução Node HTTP (7 asserções: clientes, histórico, RBAC) | **PASS (7/7)** |
| `test_http_arquitetos.js` passa em 100% dos testes | Execução Node HTTP (58 asserções: score, RN017, reatribuição) | **PASS (58/58)** |
| Ausência de código facade / hardcoded cheat | Inspeção do código-fonte e histórico de diffs | **PASS (Sem violações)** |

---

## 6. Conclusão da Revisão

O trabalho implementado no Round 2 de Saneamento atende com primor a todos os requisitos de negócio e padrões arquiteturais do Plannit. A aplicação está estável, tipada estaticamente com zero erros e pronta para produção.
