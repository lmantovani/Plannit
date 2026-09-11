# Relatório de Revisão Técnica e Parecer Adversarial — Reviewer 1 (Backend, Database & Score)

**Módulo**: Especificadores (Plannit ERP/CRM - Líder Móveis Planejados)  
**Data/Hora**: 2026-09-10T14:22:00Z  
**Autor**: Reviewer 1 (Backend, Database & Score Reviewer & Adversarial Critic)  
**Veredito**: **REQUEST_CHANGES**

---

## 1. Observation (Observações Diretas)

### 1.1. Execução Inicial dos Testes Automatizados
Ao executar os comandos de validação solicitados no diretório `/home/porto/codespace/Plannit/plannit`:

1. **Execução de `node scripts/test_arquiteto_score.js`**:
   - **Comando**: `node scripts/test_arquiteto_score.js`
   - **Resultado**: Código de saída `1` (FALHA).
   - **Erro verbatim**:
     ```text
     ❌ ERRO NA SUITE DE TESTES DO SCORE: Error: [FALHA] Meta do vendedor = 15 visitas/mês -> Esperado: 15, Obtido: 18
         at assertEqual (file:///home/porto/codespace/Plannit/plannit/scripts/test_arquiteto_score.js:145:13)
         at runArquitetoScoreTests (file:///home/porto/codespace/Plannit/plannit/scripts/test_arquiteto_score.js:475:3)
     ```

2. **Execução de `node scripts/test_http_arquitetos.js`**:
   - **Comando**: `node scripts/test_http_arquitetos.js`
   - **Resultado**: Código de saída `1` (FALHA).
   - **Erro verbatim**:
     ```text
     ❌ ERRO NA SUITE DE TESTES HTTP: Error: [FALHA] Asserção #17 falhou: POST /especificadores cria especificador com status 201
         at assert (file:///home/porto/codespace/Plannit/plannit/scripts/test_http_arquitetos.js:95:13)
         at runHttpTests (file:///home/porto/codespace/Plannit/plannit/scripts/test_http_arquitetos.js:197:3)
     ```

3. **Causa Raiz Identificada nas Suites de Teste**:
   - No arquivo `plannit/scripts/test_http_arquitetos.js`:
     - Linha 179: `email: 'beta.design@e2e-teste.com.br'`.
     - Linha 445: `metaVisitasMes: 18`.
     - Linha 455: `assert(metaMeData.metaVisitasMes === 18, 'Meta individual retornada reflete a atualização (18 visitas)')`.
   - Na migration `plannit/database/migrations/1761885935177_create_arquitetos_tables.ts`:
     - Linha 12: `table.string('email', 254).unique().nullable()`.
   - **Comportamento observado**: `test_http_arquitetos.js` altera a tabela `metas_visitas_consultor` (setando `meta_visitas_mes = 18`) e insere o arquiteto `beta.design@e2e-teste.com.br` sem realizar cleanup ao final. Isso quebra a idempotência: a execução subsequente de `test_arquiteto_score.js` falha esperando 15 (obtendo 18), e uma segunda execução de `test_http_arquitetos.js` falha com violação de unicidade de email no PostgreSQL.

4. **Execução após `node ace db:seed --files database/seeders/arquiteto_seeder.ts`**:
   - Seeder executado com sucesso: `[Seeder] Especificadores, Decisores, Concorrentes, Interações e Metas criados com sucesso!`.
   - `node scripts/test_arquiteto_score.js`: Aprovado com 97 asserções (código 0).
   - `node scripts/test_http_arquitetos.js`: Aprovado com 52 asserções (código 0).
   - Total combinado: 149 asserções.

5. **Verificação Estática e Build**:
   - `npm run typecheck`: Concluído com código `0` (0 erros TypeScript).
   - `npm run build`: Concluído com sucesso pelo Vite em 567ms gerando todos os assets e compilando arquivos de servidor em `build/`.

### 1.2. Inspeção de Código

1. **Migrations**:
   - `1761885935177_create_arquitetos_tables.ts`: Cria `arquitetos`, `decisores_arquitetos`, `concorrentes_arquitetos`, `historico_dono_arquitetos`, `interacoes_arquitetos`, `metas_visitas_consultor`. Todas as FKs possuem `onDelete` apropriado (`CASCADE` ou `SET NULL`), índices em colunas de filtro (`is_active`, `consultor_id`, `status_carteira`, `tipo`) e timestamps com timezone. Método `down()` descarta as tabelas na ordem inversa correta.
   - `1761885935178_add_arquiteto_id_to_projetos_and_leads.ts`: Adiciona coluna/índice/FK em `projetos.arquiteto_id` e formaliza FK/índice em `leads.arquiteto_id`. Método `down()` remove constraints e colunas corretamente.

2. **Models Lucid ORM**:
   - Modelos em `plannit/app/models/` (`arquiteto.ts`, `decisor_arquiteto.ts`, `concorrente_arquiteto.ts`, `historico_dono_arquiteto.ts`, `interacao_arquiteto.ts`, `meta_visitas_consultor.ts`) herdam devidamente das classes geradas em `#database/schema` (`ArquitetoSchema`, etc.).
   - Relacionamentos declarados com decorators `@belongsTo`, `@hasMany`, `@hasOne` e chaves estrangeiras explícitas. Vínculos adicionados aos modelos `Projeto`, `Lead` e `User`.

3. **Motor Analítico (`arquiteto_score_service.ts`)**:
   - Fórmulas matemáticas puras cobrem Recência (0, 20, 40, 70, 100), Frequência (0, 30, 60, 85, 100), Valor (0, 30, 55, 75, 90, 100), Potencial (0, 40, 65, 85, 100), Tempo de Parceria (20, 50, 75, 100), Consistência (% de meses distintos no último ano), Conversão (fechados / total de terminais com default neutro de 50.0%).
   - Cascata estrita de 7 segmentos implementada em `determinarSegmento`: `inativo` -> `novo_promissor` -> `em_risco` -> `campeao` -> `parceiro_fiel` -> `em_ascensao` -> `ocasional`.
   - 5 flags ativas em `determinarFlags`: `top_indicador`, `em_risco_de_perda`, `alto_potencial`, `indicacao_alto_valor`, `especificador_esfriando`.
   - Risco de concorrência desacoplado baseado no `max(percentualFechamentoEstimado)`.

4. **Controller (`arquitetos_controller.ts`) e Rotas (`start/routes.ts`)**:
   - Rotas agrupadas sob `middleware.auth()`.
   - Rotas com caminhos fixos (`especificadores/kpis`, `especificadores/metas-visitas`, `especificadores/metas-visitas/me`) registradas antes de parâmetros dinâmicos (`especificadores/:id`).
   - Soft delete estrito em `destroy` (`arquiteto.isActive = false; await arquiteto.save()`).
   - Reatribuição de dono em `reatribuirDono` protegida por transação ACID (`db.transaction`) gravando `HistoricoDonoArquiteto` imutável.
   - **Gargalo N+1 em `index`**: Linhas 92-116 executam `Promise.all(rawArquitetos.map(async (arq) => calcularScoreArquiteto(arq)))`. Para cada arquiteto, `calcularScoreArquiteto` faz 4 queries (`Projeto`, `Lead`, `ConcorrenteArquiteto`, `InteracaoArquiteto`).
   - **Ausência de RBAC**: Métodos `definirMeta`, `reatribuirDono` e `destroy` não verificam o perfil do usuário logado (`auth.user.perfil`). Qualquer usuário autenticado (incluindo `VENDEDOR`) pode alterar metas ou carteiras de terceiros.
   - **Criação não-atômica em `store`**: Linhas 277-300 criam o `Arquiteto` e, se houver consultor, criam o `HistoricoDonoArquiteto` fora de bloco transacional `db.transaction`.

---

## 2. Logic Chain (Cadeia Lógica de Raciocínio)

1. **A partir da Observação 1.1 (Falha dos testes sem re-seed prévio)**:
   - A suíte de testes E2E (`test_http_arquitetos.js`) insere registros com dados estáticos (email fixo `beta.design@e2e-teste.com.br`) e altera dados globais no banco (meta do vendedor para 18).
   - Como o banco possui constraint UNIQUE em `email`, a execução repetida de `test_http_arquitetos.js` quebra na asserção #17.
   - Como `test_arquiteto_score.js` valida o valor 15 na asserção #96, a execução deste após `test_http_arquitetos.js` quebra o teste unitário.
   - **Conclusão lógica**: Os testes não são herméticos nem idempotentes, causando acoplamento temporal e falso-positivo em esteiras de integração contínua (CI/CD).

2. **A partir da Observação 1.2.4 (Inspeção de `arquitetos_controller.ts` linhas 92-116)**:
   - O endpoint `GET /especificadores` carrega todos os registros de `arquitetos` sem paginação e dispara 4 queries adicionais por registro no PostgreSQL.
   - Com 250 arquitetos cadastrados, são geradas 1.001 queries síncronas/concorrentes em uma única requisição HTTP.
   - **Conclusão lógica**: Isso representa um problema grave de N+1 queries que compromete a performance sob carga e causará esgotamento de conexões (pool starvation).

3. **A partir da Observação 1.2.4 (Inspeção de autorização e perfis)**:
   - O método `definirMeta` aceita payload de alteração de metas de qualquer consultor. O teste HTTP comprovou que um `VENDEDOR` autenticado conseguiu alterar a meta com sucesso (linha 440 de `test_http_arquitetos.js`).
   - O método `reatribuirDono` permite a qualquer usuário autenticado transferir a carteira de qualquer especificador.
   - O método `destroy` permite a qualquer usuário autenticado inativar qualquer especificador.
   - **Conclusão lógica**: Viola o princípio de menor privilégio e os requisitos de segurança RBAC do Plannit (onde a gestão de carteiras e metas cabe à Gerência Comercial / Diretoria).

4. **A partir da Verificação de Integridade (Adversarial Check)**:
   - Não foi detectado hardcoding espúrio de resultados ou tabelas falsas nos serviços de produção.
   - O motor analítico em `arquiteto_score_service.ts` contém implementação matemática e relacional real e completa.
   - No entanto, os defeitos de idempotência nos testes, o risco de segurança por ausência de RBAC e a sobrecarga N+1 inviabilizam a aprovação imediata para produção.

---

## 3. Caveats (Ressalvas)

- O frontend React 19 / Inertia.js foi verificado apenas no nível de empacotamento com sucesso do Vite (`npm run build`), pois a validação de renderização visual no navegador cabe ao Reviewer 2.
- O seeder `database/seeders/arquiteto_seeder.ts` é idempotente (realiza limpeza prévia de dados com prefixos `PRJ-ARQ-%` e `@teste-arq.com.br`), o que permitiu demonstrar que, partindo de um estado zerado, as 149 asserções passam integralmente.

---

## 4. Conclusion (Parecer e Veredito)

**Veredito Oficial**: **REQUEST_CHANGES**

O código do backend apresenta excelente fidelidade às regras de negócio analíticas (RFV, Potencial, Lealdade, 7 segmentos, 5 flags, concorrência e soft delete imutável RN017) e tipagem rigorosa (0 erros no TypeScript e compilação limpa do Vite). No entanto, são necessárias correções prévias antes do merge:

### Tabela de Achados (Findings)

| ID | Severidade | Título | Localização | Descrição e Ação Recomendada |
|---|---|---|---|---|
| **F-01** | **Major** | Falha de Idempotência e Efeitos Colaterais nos Testes | `scripts/test_http_arquitetos.js:179, 445` e `test_arquiteto_score.js:475` | O teste HTTP insere email estático em coluna UNIQUE e altera meta global sem teardown. **Ação**: Usar email dinâmico (`Date.now()`), restaurar a meta original ao final do teste HTTP ou adicionar rotina de cleanup inicial nos scripts. |
| **F-02** | **Major** | Gargalo de Desempenho N+1 Queries em `GET /especificadores` | `app/controllers/arquitetos_controller.ts:92-116` | Cálculo de score analítico disparado item a item (4 queries por arquiteto). **Ação**: Implementar paginação no endpoint (ex: 20 por página) e/ou pré-carregar relacionamentos agregados em lote (batch). |
| **F-03** | **Major** | Ausência de RBAC em Metas, Transferência e Exclusão | `app/controllers/arquitetos_controller.ts:343, 362, 652` | Usuários com perfil `VENDEDOR` podem redefinir metas, transferir clientes de outros consultores e inativar registros. **Ação**: Adicionar guardas de autorização (`user.hasRole([PerfilUsuario.GERENTE_COMERCIAL, PerfilUsuario.DIRETORIA])`). |
| **F-04** | **Minor** | Criação de Arquiteto com Dono Não-Atômica | `app/controllers/arquitetos_controller.ts:277-300` | Criação do `Arquiteto` e do primeiro `HistoricoDonoArquiteto` executada fora de transação. **Ação**: Envolver o bloco em `db.transaction(async (trx) => { ... })`. |
| **F-05** | **Minor** | Teste Unitário com Fórmulas Espelhadas em vez de Import do Service | `scripts/test_arquiteto_score.js:8-130` | O script reimplementa em JS puro as fórmulas do TS. **Ação**: Importar diretamente as funções de `arquiteto_score_service.ts` ou estruturar teste com o test runner oficial do Adonis (Japa). |

---

## 5. Verification Method (Método de Verificação Independente)

Para reproduzir os achados e verificar as correções:

1. **Demonstrar a quebra de idempotência**:
   ```bash
   cd /home/porto/codespace/Plannit/plannit
   node ace db:seed --files database/seeders/arquiteto_seeder.ts
   node scripts/test_http_arquitetos.js
   # Execução do teste de score logo após o teste HTTP (deve falhar se não houver isolamento):
   node scripts/test_arquiteto_score.js
   # Segunda execução consecutiva do teste HTTP (deve falhar por colisão de email UNIQUE):
   node scripts/test_http_arquitetos.js
   ```

2. **Demonstrar passagem limpa com seeder**:
   ```bash
   node ace db:seed --files database/seeders/arquiteto_seeder.ts
   node scripts/test_arquiteto_score.js && node scripts/test_http_arquitetos.js
   ```

3. **Verificar tipagem e build**:
   ```bash
   npm run typecheck
   npm run build
   ```

---

## 6. Relatório Adversarial (Stress-Testing & Failure Modes)

- **Overall Risk Assessment**: **MEDIUM-HIGH**
- **Cenário 1: Esgotamento de Conexões sob Produção (N+1)**
  - *Premissa desafiada*: "O controller pode calcular o score de todos os arquitetos em memória a cada requisição."
  - *Cenário de ataque*: 5 vendedores acessando simultaneamente a listagem `/especificadores` com 300 arquitetos na base. Cada requisição abre 1.200 queries, totalizando 6.000 queries concorrentes no PostgreSQL.
  - *Raio de destruição*: Latência de requisição > 10s e estouro de limite do pool de conexões do banco (`connection pool exhausted`).
  - *Mitigação*: Paginação obrigatória com cálculo restrito à página corrente.
- **Cenário 2: Violação de Segurança e Fraude de Carteira (RBAC Bypass)**
  - *Premissa desafiada*: "Apenas gerentes comerciais alteram metas de visitas e transferem carteiras."
  - *Cenário de ataque*: Vendedor mal-intencionado faz requisição `PUT /especificadores/metas-visitas` definindo sua própria meta para 0 visitas/mês, e `PATCH /especificadores/4/dono` transferindo o cliente mais valioso de outro vendedor para si mesmo.
  - *Raio de destruição*: Corrupção da governança comercial e conflito ético/comercial entre consultores.
  - *Mitigação*: Validação obrigatória de perfil no controller.
