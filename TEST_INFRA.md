# E2E Test Infra: Módulo de Especificadores (Plannit)

## Test Philosophy
- Opaque-box, requirement-driven e validação determinística de integridade.
- Sem dependência de mocks frágeis; testes executados contra o banco PostgreSQL real e endpoints HTTP reais do AdonisJS v7.
- Metodologia: 4 Tiers de Testes (Feature Coverage, Boundary & Corner Cases, Cross-Feature Combinations, Real-World Application Scenarios) + Hardening Adversarial (Tier 5).

## Feature Inventory
| # | Feature | Requisito de Origem | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Migrations e Integridade de Schema | R1 | 5 | 3 | ✓ |
| 2 | Modelos Lucid ORM e Relacionamentos | R1 | 5 | 3 | ✓ |
| 3 | Cálculo de RFV (Recência, Frequência, Valor) | R2 | 5 | 5 | ✓ |
| 4 | Cálculo de Potencial e Lealdade | R2 | 5 | 5 | ✓ |
| 5 | Classificação nos 7 Segmentos Comportamentais | R2 | 7 | 5 | ✓ |
| 6 | Ativação das 5 Flags Ativas | R2 | 5 | 5 | ✓ |
| 7 | Risco de Concorrência e KPIs | R2 | 4 | 3 | ✓ |
| 8 | Soft Delete e RN017 (is_active = false) | R3 | 5 | 3 | ✓ |
| 9 | Reatribuição de Dono e Auditoria Imutável | R3 | 5 | 4 | ✓ |
| 10 | Endpoints HTTP e Validação VineJS | R1, R3 | 6 | 4 | ✓ |
| 11 | Renderização e Props Inertia.js | R4 | 5 | 3 | ✓ |

## Test Architecture
- **Teste Unitário/Determinístico do Motor de Score**:
  - Script: `/home/porto/codespace/Plannit/plannit/scripts/test_arquiteto_score.js`
  - Invocação: `node scripts/test_arquiteto_score.js`
  - Escopo: Valida integridade das tabelas, colunas FK em `projetos`/`leads`, faixas matemáticas de RFV, Potencial, Lealdade, 7 segmentos, 5 flags, risco de concorrência e ausência de efeitos colaterais.
- **Teste de Integração HTTP E2E**:
  - Script: `/home/porto/codespace/Plannit/plannit/scripts/test_http_arquitetos.js`
  - Invocação: `node scripts/test_http_arquitetos.js`
  - Escopo: Handshake de autenticação, login com sessão, `GET /especificadores` (com cabeçalho Inertia), validação de props, criação de parceiro, registro de interações, gestão de decisores e concorrentes, reatribuição de dono com verificação do histórico imutável (`historico_dono_arquitetos`) e soft delete (`is_active = false`).
- **Validação Estática e Compilação**:
  - `npm run typecheck` (tsc no servidor e no Inertia).
  - `npm run build` (empacotamento de produção Vite).

## Real-World Application Scenarios (Tier 4)
| # | Cenário | Funcionalidades Exercitadas | Complexidade |
|---|---------|-----------------------------|--------------|
| 1 | Ciclo de vida completo do parceiro Campeão | Cadastro, múltiplos projetos no ano, contratos de alto valor, transição de segmento para 'campeao' e ativação de flags 'top_indicador' e 'indicacao_alto_valor' | Alta |
| 2 | Alerta de esfriamento e reatribuição de carteira | Arquiteto parado há >180 dias com dono ativo sem contato há >30 dias, transição para 'em_risco', flag 'especificador_esfriando', reatribuição de consultor com log imutável de auditoria (RN017) | Alta |
| 3 | Monitoramento de concorrência e mitigação | Cadastro de concorrentes com percentuais, cálculo dinâmico de risco 'alto' (>60%), registro de interações para aproximação | Média |
| 4 | Soft delete e preservação de integridade | Desativação de especificador com projetos vinculados, confirmação de sumiço da listagem ativa e persistência referencial | Média |
| 5 | Metas mensais de visitas por consultor | Configuração gerencial de meta, realização e contagem de visitas ao escritório no mês, cálculo de atingimento | Média |

## Coverage Thresholds
- Tier 1: ≥5 por funcionalidade central (total ≥ 50 testes)
- Tier 2: ≥5 limites e casos de borda por métrica de score (total ≥ 30 testes de borda)
- Tier 3: Interações cruzadas (score reagindo a novos projetos, transições de status, etc.)
- Tier 4: ≥5 cenários ponta-a-ponta no seeder e nos scripts de teste
- Total de asserções nos scripts automatizados: > 60 asserções
