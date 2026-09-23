# Relatório de Teste Adversarial e Estresse Empírico — Challenger 2 (Saneamento R2)

**Agente:** Challenger 2 (Saneamento R2) (`.agents/challenger_2_saneamento`)  
**Data:** 2026-09-11T18:36:00Z  
**Alvos de Avaliação:** Requisitos R4 (Blindagem de Concorrência em Versões 3D) e R1 (Sincronização e Preservação de Especificador no Briefing)  
**Veredito:** **APPROVE**  

---

## 1. Resumo Executivo

O **Challenger 2** desenvolveu e executou uma bateria independente de testes empíricos de estresse de alta concorrência e validação adversarial relacional contra o ecossistema Plannit (AdonisJS v7, Lucid ORM, PostgreSQL e Inertia).

Foram submetidas ondas paralelas massivas de até 20 requisições simultâneas via `Promise.all` contra o endpoint de submissão de maquetes 3D (`POST /projetos/:id/versoes-3d`), além de testes de borda de mutação parcial em rascunhos de briefing (`PUT /briefings/:id`) e criação via AJAX (`POST /especificadores`).

**Resultados Consolidados:**
- **Total de Asserções Verificadas:** 21 asserções formais.
- **Falhas Detectadas:** 0.
- **Taxa de Unicidade em Concorrência R4:** 100% (0 colisões de versão, 0 duplicações, sequência ordinal contígua comprovada).
- **Integridade Relacional R1:** 100% (persistência em `projetos.arquiteto_id`, imunidade contra exclusão silenciosa em updates parciais e resposta JSON 201 via header `Accept: application/json`).

---

## 2. Metodologia do Teste Adversarial

O teste foi construído no script executável independente:
`plannit/scripts/test_challenger_concorrencia_3d.js`

A metodologia combinou validação da camada HTTP (código de status, headers e payloads JSON) com checagem forense direta no PostgreSQL através de queries SQL de agregação (`GROUP BY ... HAVING COUNT(*) > 1`, ordenação ordinal e contagem estrita de tuplas).

### Dimensões Desafiadas:
1. **R4 (Concorrência e Race Conditions):**
   - Disparo simultâneo em paralelo real (`Promise.all`) de 10 requisições concorrentes de criação de versão 3D para o mesmo projeto.
   - Segunda onda subsequente de 5 requisições concorrentes (validando continuidade ordinal incremental v11 a v15).
   - Mega estresse em novo projeto limpo com 20 requisições simultâneas em paralelo estrito.
2. **R1 (Integridade de Parceria e Defensividade contra Data Loss):**
   - Criação de arquiteto via `POST /especificadores` enviando apenas `Accept: application/json` (sem parâmetro de query string).
   - Atualização de rascunho de briefing vinculando `arquitetoId` -> checagem no banco em `projetos.arquiteto_id`.
   - Atualização subsequente do briefing **omitindo deliberadamente** o campo `arquitetoId` no payload -> validação de que `projetos.arquiteto_id` não sofreu anulação silenciosa (`null`).
   - Atualização explícita com `arquitetoId: null` -> validação da capacidade de desvinculação intencional.
3. **Casos de Borda & Robustez:**
   - Submissão 3D para projeto arquivado (`arquivado = true`) -> bloqueio estrito com HTTP 400.
   - Submissão 3D para projeto inexistente (`id: 999999`) -> resposta HTTP 404.

---

## 3. Análise Detalhada dos Experimentos Empíricos

### 3.1. Requisito R4 — Blindagem contra Concorrência em Versões 3D

#### Cenário 1: Onda Primária de 10 Requisições Simultâneas
- **Projeto Alvo:** ID 493 (`PRJ-3D-STRESS-1789151766879`), estado inicial: `em_projeto` (0 versões existentes).
- **Disparo:** 10 requisições simultâneas via `Promise.all` em `POST /projetos/493/versoes-3d`.
- **Desempenho:** Conclusão das 10 requisições em 80ms (média de 8.0ms/req).
- **Resultados HTTP:** 10/10 requisições responderam com HTTP 201 Created.
- **Auditoria PostgreSQL (`projetos_comerciais`):**
  - Contagem de tuplas: exatamente 10 registros.
  - Conjunto de versões obtidas: `{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}`.
  - Cardinalidade de versões únicas: 10 (zero duplicatas).
  - Consulta `SELECT versao, COUNT(*) FROM projetos_comerciais WHERE projeto_id = 493 GROUP BY versao HAVING COUNT(*) > 1` retornou **0 linhas**.
  - Transição de status do projeto: atualizado para `aguard_validacao` com registro imutável em `historico_status_projeto`.

#### Cenário 2: Onda Incremental Subsequente (5 Requisições Simultâneas)
- **Disparo:** 5 novas requisições concorrentes submetidas para o mesmo projeto após a primeira onda.
- **Resultados HTTP:** 5/5 requisições responderam com HTTP 201 Created.
- **Auditoria PostgreSQL:**
  - Versões registradas: `{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15}`.
  - Continuidade estrita comprovada: nenhum salto ou overlap de versão.

#### Cenário 3: Mega Estresse com 20 Requisições Simultâneas
- **Projeto Alvo:** ID 494 (`PRJ-3D-MEGA-1789151766879`).
- **Disparo:** 20 requisições em paralelo estrito.
- **Desempenho:** Concluído em 145ms (média de 7.3ms/req).
- **Resultados HTTP:** 20/20 requisições responderam HTTP 201.
- **Auditoria PostgreSQL:**
  - Versões registradas: `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]`.
  - Sequência 100% íntegra, demonstrando que o mecanismo de `forUpdate()` no `Projeto` aliado ao `MAX(versao) + 1` dentro de `db.transaction` serializa as escritas com isolamento perfeito e sem risco de deadlock.

---

### 3.2. Requisito R1 — Sincronização e Preservação de Especificador

#### Cenário 1: Cadastro Rápido AJAX via `POST /especificadores`
- **Requisição:** `POST /especificadores` com cabeçalho `Accept: application/json` (sem parâmetro de query string `?format=json`).
- **Resultado HTTP:** HTTP 201 Created com corpo JSON completo do modelo `Arquiteto` (`id: 197`, `nome: "Arq. Challenger ..."`).
- **Auditoria PostgreSQL:** Registro gravado com sucesso com `is_active = true` e dados de contato íntegros.

#### Cenário 2: Atualização de Rascunho com `arquitetoId` Preenchido
- **Requisição:** `PUT /briefings/:id` com `{ arquitetoId: 197, arquitetoNome: "...", ... }`.
- **Auditoria PostgreSQL:** Consulta na tabela `projetos` confirmou `arquiteto_id = 197` e `arquiteto_nome` preenchido.

#### Cenário 3: Atualização Parcial Omitindo `arquitetoId` (Teste de Defensividade)
- **Ataque / Hipótese:** Formulários parciais ou componentes que enviam apenas campos alterados de outras seções (ex: alteração de cidade ou ambientes) poderiam anular acidentalmente `projetos.arquiteto_id` se o backend utilizasse atribuição direta `projeto.arquitetoId = payload.arquitetoId ?? null`.
- **Requisição:** `PUT /briefings/:id` com payload sem a chave `arquitetoId`.
- **Resultado:** A condicional `if (payload.arquitetoId !== undefined)` em `briefings_controller.ts` impediu a deleção.
- **Auditoria PostgreSQL:** `projetos.arquiteto_id` permaneceu estritamente `197`. Defensividade contra regressão aprovada.

#### Cenário 4: Desvinculação Intencional
- **Requisição:** `PUT /briefings/:id` enviando explicitamente `{ arquitetoId: null, arquitetoNome: null }`.
- **Auditoria PostgreSQL:** `projetos.arquiteto_id` atualizado para `NULL` conforme esperado.

---

## 4. Casos de Borda e Resiliência

| Caso de Borda | Entrada | Comportamento Esperado | Comportamento Obtido | Status |
|---|---|---|---|---|
| Projeto Inexistente | `POST /projetos/999999/versoes-3d` | HTTP 404 Not Found | HTTP 404 Not Found | PASS |
| Projeto Arquivado | `POST /projetos/:id/versoes-3d` com `arquivado=true` | HTTP 400 Bad Request | HTTP 400 Bad Request | PASS |
| Desvinculação Explícita | `PUT /briefings/:id` com `arquitetoId: null` | `projetos.arquiteto_id = null` | `projetos.arquiteto_id = null` | PASS |
| Omisso de arquitetoId | `PUT /briefings/:id` sem chave `arquitetoId` | Mantém arquiteto anterior | Mantém arquiteto anterior | PASS |

---

## 5. Conclusão e Veredito

Os testes empíricos de estresse comprovam que:
1. A blindagem contra concorrência em `submeterVersao3D` (R4) é robusta, serializada atomicamente e imune a colisões mesmo sob rajadas de requisições simultâneas.
2. A sincronização de parceiros no briefing (R1) opera de maneira determinística, defensiva e sem vazamentos ou deleções silenciosas.
3. A resposta JSON 201 em `POST /especificadores` atende perfeitamente ao modal AJAX do frontend.

Veredito formal: **APPROVE**.
