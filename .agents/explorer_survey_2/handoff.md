# Relatório de Handoff — Explorer 2: Score Engine & Business Logic Surveyor

**Módulo**: Especificadores (Arquitetos, Designers de Interiores, Decoradores, Engenheiros)  
**Data**: 2026-09-10T13:46:00Z  
**Autor**: Explorer 2 (Score Engine & Business Logic Surveyor)  
**Destinatário**: Agente Pai / Equipe de Implementação  
**Status**: Concluído (Hard Handoff)

---

## 1. Observation (Observações Diretas)

Durante o levantamento técnico do repositório `/home/porto/codespace/Plannit`, foram inspecionadas as implementações existentes de referência (Python/FastAPI em `backend/app/services/arquiteto_score.py`, `backend/app/models/crm.py`, `backend/app/api/v1/endpoints/arquitetos.py` e testes associados em `backend/tests/`) bem como a base de código alvo em AdonisJS v7 (`/home/porto/codespace/Plannit/plannit`), além das especificações em `docs/superpowers/specs/2026-07-10-arquitetos-score-backend-design.md` e os requisitos R1-R4 em `.agents/ORIGINAL_REQUEST.md`.

### Principais achados observados:
1. **Regra de Ausência de Persistência do Score**: No design oficial (`docs/superpowers/specs/2026-07-10-arquitetos-score-backend-design.md:18`), o score analítico **não é armazenado em colunas da tabela `arquitetos`**. Ele é calculado sob demanda pelo backend a partir das relações com `projetos`, `leads`, `interacoes_arquitetos` e `concorrentes_arquitetos`. O frontend nunca calcula nem recalcula score.
2. **Implementação de Referência do Motor Analítico**: Em `backend/app/services/arquiteto_score.py:16-183`, todas as faixas e funções determinísticas de pontuação utilizam limiares numéricos fixos, médias aritméticas com arredondamento em 1 casa decimal (`round(val, 1)`) e uma cascata de decisão estrita (short-circuit).
3. **Guardrail RN017 e Imutabilidade**: Em `backend/app/models/crm.py:216-234` e `backend/app/api/v1/endpoints/arquitetos.py:204-273`, o histórico de dono de carteira é registrado na tabela imutável `historico_dono_arquitetos`. Toda reatribuição grava consultor anterior, novo consultor, quem alterou e timestamp UTC, além de gerar notificação. O especificador nunca sofre delete físico (`DELETE`), apenas soft delete via `is_active = false` (`endpoints/arquitetos.py:296-310`).
4. **Estrutura dos Scripts no AdonisJS (`plannit/scripts/`)**: Os scripts de teste de fases anteriores (`test_crm.js`, `test_http_crm.js`, `test_briefings.js`, `test_http_briefings.js`, `test_wip.js`, `test_http_fila.js`) seguem padrões canônicos:
   - Scripts diretos usam `pg.Pool` conectado a `postgresql://postgres:postgres@localhost:5432/plannit`.
   - Scripts HTTP executam handshake com `GET /login`, extraem cookies de sessão e header `X-XSRF-TOKEN`, executam `POST /login` e fazem chamadas subsequentes com cabeçalhos Inertia (`X-Inertia: true`, `X-Inertia-Version: 1`).

---

## 2. Logic Chain (Cadeia de Raciocínio e Especificação Matemática Detalhada)

A partir das observações do código-fonte e das especificações do negócio, detalha-se a engenharia completa do motor de score e das regras de negócio:

### 2.1. Pilar 1: Score RFV (0 a 100)
- **Fórmula Geral**:
  $$\text{RFV} = \text{round}\left(\frac{\text{Recência} + \text{Frequência} + \text{Valor}}{3}, 1\right)$$
- **Universo de Dados**:
  Projetos onde `arquiteto_id == arquiteto.id` e `arquivado == false`.
  Janela de 12 meses: `criado_em >= (agora - 365 dias)`.

#### A. Recência (0-100)
Mede a proximidade do último projeto não arquivado do especificador:
`dias_desde_ultimo_projeto = floor((agora - max(projetos.criado_em)) em dias)`
- Sem projetos no histórico (`null`): **0 pontos**
- $\le 30$ dias: **100 pontos**
- $31$ a $90$ dias ($\le 90$): **70 pontos**
- $91$ a $180$ dias ($\le 180$): **40 pontos**
- $181$ a $365$ dias ($\le 365$): **20 pontos**
- $> 365$ dias: **5 pontos**

#### B. Frequência (0-100)
Mede o volume de projetos nos últimos 12 meses (`qtd_projetos_12m`):
- $0$ projetos: **0 pontos**
- $1$ projeto: **30 pontos**
- $2$ ou $3$ projetos ($\le 3$): **60 pontos**
- $4$, $5$ ou $6$ projetos ($\le 6$): **85 pontos**
- $\ge 7$ projetos: **100 pontos**

#### C. Valor (0-100)
Soma de `valor_contrato` de projetos não arquivados nos últimos 12 meses (`soma_valor_12m`):
- Sem valor ou $\le 0$: **0 pontos**
- $> 0$ e $< \text{R\$ } 50.000$: **30 pontos**
- $\text{R\$ } 50.000$ a $< \text{R\$ } 150.000$: **55 pontos**
- $\text{R\$ } 150.000$ a $< \text{R\$ } 350.000$: **75 pontos**
- $\text{R\$ } 350.000$ a $< \text{R\$ } 700.000$: **90 pontos**
- $\ge \text{R\$ } 700.000$: **100 pontos**

---

### 2.2. Pilar 2: Score Potencial (0 a 100)
Mede o pipeline futuro ativo sob influência do especificador:
$$\text{Ativos} = \text{LeadsAtivos} + \text{ProjetosAtivos}$$
- `LeadsAtivos`: `leads` com `arquiteto_id == arquiteto.id` e `status_funil NOT IN ('fechado', 'perdido', 'desqualificado')`.
- `ProjetosAtivos`: `projetos` com `arquiteto_id == arquiteto.id`, `arquivado == false` e `status NOT IN ('concluido', 'cancelado')`.

Faixas de pontuação:
- $0$ ativos: **0 pontos**
- $1$ ativo: **40 pontos**
- $2$ ou $3$ ativos ($\le 3$): **65 pontos**
- $4$ a $6$ ativos ($\le 6$): **85 pontos**
- $\ge 7$ ativos: **100 pontos**

---

### 2.3. Pilar 3: Score Lealdade (0 a 100)
- **Fórmula Geral**:
  $$\text{Lealdade} = \text{round}\left(\frac{\text{TempoParceria} + \text{Consistência} + \text{TaxaConversão}}{3}, 1\right)$$

#### A. Tempo de Parceria (0-100)
Meses completos entre `arquiteto.criado_em` e `agora`:
`meses = (agora.year - criado_em.year) * 12 + (agora.month - criado_em.month) - (1 se agora.day < criado_em.day senao 0)`
- $< 3$ meses: **20 pontos**
- $3$ a $< 12$ meses: **50 pontos**
- $12$ a $< 24$ meses: **75 pontos**
- $\ge 24$ meses: **100 pontos**

#### B. Consistência Mensal de Projetos (0-100)
Contagem de meses de calendário distintos nos últimos 12 meses em que o especificador teve pelo menos 1 projeto criado (`meses_distintos`, capado entre 0 e 12):
$$\text{Consistência} = \text{round}\left(\frac{\min(12, \text{meses\_distintos})}{12} \times 100, 1\right)$$

#### C. Taxa de Conversão de Leads (0-100)
Aproveitamento de leads terminais originados pelo especificador:
$$\text{TotalTerminal} = \text{leads\_fechados} + \text{leads\_perdidos} + \text{leads\_desqualificados}$$
- Se $\text{TotalTerminal} == 0$: **50.0 pontos** (valor neutro que não penaliza a ausência de dados).
- Se $\text{TotalTerminal} > 0$:
  $$\text{TaxaConversão} = \text{round}\left(\frac{\text{leads\_fechados}}{\text{TotalTerminal}} \times 100, 1\right)$$

---

### 2.4. Score Geral e Tratamento de Falta de Histórico
$$\text{Score Geral} = \text{round}\left(\frac{\text{RFV} + \text{Potencial} + \text{Lealdade}}{3}, 1\right)$$

- **Especificador sem histórico** (0 projetos e 0 leads):
  - RFV = 0.0
  - Potencial = 0.0
  - Lealdade = round((TempoParceria + 0 + 50.0) / 3, 1) (ex: se cadastrado há 1 mês: round((20 + 0 + 50) / 3, 1) = 23.3)
  - Score Geral = round((0 + 0 + 23.3) / 3, 1) = 7.8
  - **Classificação garantida**: cai imediatamente no segmento **`inativo`** pela prioridade 1 da cascata.

---

### 2.5. Cascata dos 7 Segmentos Comportamentais
A avaliação deve ser executada em cascata rigorosa (**a primeira condição verdadeira determina o segmento**):

1. **`inativo`**:
   `!tem_historico` (ou seja, `total_projetos == 0 && total_leads == 0`).
2. **`novo_promissor`**:
   `dias_desde_cadastro < 90` (possui histórico recente; tem precedência sobre `campeao` para acolher recém-chegados).
3. **`em_risco`**:
   `frequencia_all_time > 0 && (dias_desde_ultima_atividade === null || dias_desde_ultima_atividade > 180)`
   (Já teve projetos no passado, mas está há mais de 180 dias sem projeto e sem lead).
4. **`campeao`**:
   `score_geral >= 85`
5. **`parceiro_fiel`**:
   `lealdade >= 75 && rfv >= 50`
6. **`em_ascensao`**:
   `potencial >= 70`
7. **`ocasional`**:
   Fallback padrão se nenhuma condição anterior foi atingida.

---

### 2.6. Condições das 5 Flags Ativas
Podem coexistir simultaneamente (0 a 5 flags):
1. **`top_indicador`**: `score_geral >= 85`
2. **`em_risco_de_perda`**: `em_risco === true`
3. **`alto_potencial`**: `potencial >= 70`
4. **`indicacao_alto_valor`**: `pontos_valor >= 90` (projetos nos últimos 12m somando $\ge \text{R\$ } 350.000$)
5. **`especificador_esfriando`**:
   `em_risco === true && tem_dono === true && (dias_desde_ultima_interacao === null || dias_desde_ultima_interacao > 30)`

---

### 2.7. Risco de Concorrência e KPIs de Carteira
- **Risco de Concorrência**:
  Baseado no maior percentual estimado entre os concorrentes cadastrados em `concorrentes_arquitetos`:
  - `maior < 30%`: nível **`baixo`**
  - `30% <= maior <= 60%`: nível **`medio`**
  - `maior > 60%`: nível **`alto`**
  *Importante*: Não entra no cálculo dos scores analíticos objetivos.
- **KPIs de Carteira**:
  - `especificadores_ativos`: contagem de arquitetos com `is_active = true`.
  - `pct_venda_mes`: % do valor de contratos fechados com `arquiteto_id IS NOT NULL` sobre o valor total fechado no mês.
  - `pct_venda_ano`: % do valor de contratos fechados com `arquiteto_id IS NOT NULL` sobre o total fechado no ano.
  - `atendimentos_mes`: interações no mês com `tipo != 'visita_escritorio'`.
  - `visitas_escritorio_mes`: interações no mês com `tipo == 'visita_escritorio'`.
  - `meta_visitas_mes` e `visitas_realizadas_mes`: meta configurada pelo gestor para o consultor logado versus visitas realizadas no mês atual.

---

### 2.8. Guardrail RN017: Soft Delete e Histórico Imutável
- **Soft Delete**: `DELETE /especificadores/:id` executa exclusivamente `UPDATE arquitetos SET is_active = false`. Não deleta registros nem quebra vínculos de chave estrangeira com projetos ou leads.
- **Reatribuição de Dono**: `PATCH /especificadores/:id/dono` atualiza `consultor_id`, cria registro imutável em `historico_dono_arquitetos` (`consultor_anterior_id`, `consultor_novo_id`, `alterado_por_id`, `alterado_em = UTC`) e dispara notificação para o novo consultor.

---

## 3. Especificação do Serviço Analítico em TypeScript

O serviço deve ser criado em `app/services/arquiteto_score_service.ts`:

```typescript
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export type SegmentoComportamental =
  | 'inativo'
  | 'novo_promissor'
  | 'em_risco'
  | 'campeao'
  | 'parceiro_fiel'
  | 'em_ascensao'
  | 'ocasional'

export type FlagAtiva =
  | 'top_indicador'
  | 'em_risco_de_perda'
  | 'alto_potencial'
  | 'indicacao_alto_valor'
  | 'especificador_esfriando'

export type NivelConcorrencia = 'baixo' | 'medio' | 'alto'

export interface ScoreDetalhes {
  recencia: number
  frequencia: number
  valor: number
  diasDesdeUltimoProjeto: number | null
  projetos12Meses: number
  somaValorContratos12Meses: number
  leadsAtivos: number
  projetosAtivos: number
  tempoParceria: number
  consistencia: number
  taxaConversao: number
  mesesDesdeCadastro: number
}

export interface ConcorrenteInfo {
  id: number
  nomeConcorrente: string
  percentualFechamentoEstimado: number
}

export interface ConcorrenciaResultado {
  risco: number
  nivel: NivelConcorrencia
  concorrentes: ConcorrenteInfo[]
}

export interface ArquitetoScoreResult {
  rfv: number
  potencial: number
  lealdade: number
  scoreGeral: number
  segmento: SegmentoComportamental
  flags: FlagAtiva[]
  detalhes: ScoreDetalhes
  concorrencia: ConcorrenciaResultado
}

// Funções puras de cálculo matemático
export function pontuarRecencia(dias: number | null): number {
  if (dias === null || dias === undefined) return 0
  if (dias <= 30) return 100
  if (dias <= 90) return 70
  if (dias <= 180) return 40
  if (dias <= 365) return 20
  return 5
}

export function pontuarFrequencia(qtd: number): number {
  if (qtd <= 0) return 0
  if (qtd === 1) return 30
  if (qtd <= 3) return 60
  if (qtd <= 6) return 85
  return 100
}

export function pontuarValor(soma: number | null): number {
  if (!soma || soma <= 0) return 0
  if (soma < 50_000) return 30
  if (soma < 150_000) return 55
  if (soma < 350_000) return 75
  if (soma < 700_000) return 90
  return 100
}

export function calcularRFV(recencia: number, frequencia: number, valor: number): number {
  return Number(((recencia + frequencia + valor) / 3).toFixed(1))
}

export function pontuarPotencial(qtdAtivos: number): number {
  if (qtdAtivos <= 0) return 0
  if (qtdAtivos === 1) return 40
  if (qtdAtivos <= 3) return 65
  if (qtdAtivos <= 6) return 85
  return 100
}

export function pontuarTempoParceria(meses: number): number {
  if (meses < 3) return 20
  if (meses < 12) return 50
  if (meses < 24) return 75
  return 100
}

export function pontuarConsistencia(mesesComProjeto: number): number {
  const capado = Math.max(0, Math.min(12, mesesComProjeto))
  return Number(((capado / 12) * 100).toFixed(1))
}

export function pontuarTaxaConversao(fechados: number, perdidos: number, desqualificados: number): number {
  const total = fechados + perdidos + desqualificados
  if (total === 0) return 50.0
  return Number(((fechados / total) * 100).toFixed(1))
}

export function calcularLealdade(tempo: number, consistencia: number, conversao: number): number {
  return Number(((tempo + consistencia + conversao) / 3).toFixed(1))
}

export function calcularScoreGeral(rfv: number, potencial: number, lealdade: number): number {
  return Number(((rfv + potencial + lealdade) / 3).toFixed(1))
}

export function determinarSegmento(params: {
  temHistorico: boolean
  diasDesdeCadastro: number
  emRisco: boolean
  scoreGeral: number
  rfv: number
  potencial: number
  lealdade: number
}): SegmentoComportamental {
  if (!params.temHistorico) return 'inativo'
  if (params.diasDesdeCadastro < 90) return 'novo_promissor'
  if (params.emRisco) return 'em_risco'
  if (params.scoreGeral >= 85) return 'campeao'
  if (params.lealdade >= 75 && params.rfv >= 50) return 'parceiro_fiel'
  if (params.potencial >= 70) return 'em_ascensao'
  return 'ocasional'
}

export function determinarFlags(params: {
  scoreGeral: number
  potencial: number
  valorPontos: number
  emRisco: boolean
  temDono: boolean
  diasDesdeUltimaInteracao: number | null
}): FlagAtiva[] {
  const flags: FlagAtiva[] = []
  if (params.scoreGeral >= 85) flags.push('top_indicador')
  if (params.emRisco) flags.push('em_risco_de_perda')
  if (params.potencial >= 70) flags.push('alto_potencial')
  if (params.valorPontos >= 90) flags.push('indicacao_alto_valor')
  if (params.emRisco && params.temDono && (params.diasDesdeUltimaInteracao === null || params.diasDesdeUltimaInteracao > 30)) {
    flags.push('especificador_esfriando')
  }
  return flags
}

export function calcularRiscoConcorrencia(percentuais: number[]): { risco: number; nivel: NivelConcorrencia } {
  const maior = percentuais.length > 0 ? Math.max(...percentuais) : 0
  let nivel: NivelConcorrencia = 'baixo'
  if (maior >= 30 && maior <= 60) nivel = 'medio'
  else if (maior > 60) nivel = 'alto'
  return { risco: Number(maior.toFixed(1)), nivel }
}
```

---

## 4. Design dos Scripts de Teste Automatizado

### 4.1. `scripts/test_arquiteto_score.js` (Validação Direta do Motor e Banco)
- **Tecnologia**: Node.js ESM nativo com biblioteca `pg` (`Pool`).
- **Casos de Teste Executados**:
  1. **Integridade Estrutural**:
     - Verifica a existência das tabelas `arquitetos`, `decisores_arquitetos`, `concorrentes_arquitetos`, `historico_dono_arquitetos`, `interacoes_arquitetos`, `metas_visitas_consultor`.
     - Verifica a existência da FK `projetos.arquiteto_id` e `leads.arquiteto_id`.
  2. **Validação das Funções Matemáticas Puras**:
     - Recência: 0d (100), 30d (100), 31d (70), 90d (70), 91d (40), 180d (40), 181d (20), 365d (20), 366d (5), null (0).
     - Frequência: 0 (0), 1 (30), 2-3 (60), 4-6 (85), 7+ (100).
     - Valor: null (0), 49k (30), 50k (55), 150k (75), 350k (90), 700k (100).
     - Potencial: 0 (0), 1 (40), 2-3 (65), 4-6 (85), 7+ (100).
     - Tempo Parceria: 2m (20), 3m (50), 12m (75), 24m (100).
     - Consistência: 0/12 (0%), 6/12 (50%), 12/12 (100%).
     - Conversão: sem dados (50% neutro), 8/10 (80%), 0/5 (0%).
  3. **Validação dos 7 Segmentos e 5 Flags nos Registros do Seeder**:
     - Consulta cada arquiteto de teste populado pelo seeder e valida se o segmento obtido e as flags correspondem exatamente ao esperado.
     - `Arq Inativo` -> `inativo`
     - `Arq Novo Promissor` -> `novo_promissor` (mesmo com score alto)
     - `Arq Em Risco` -> `em_risco` + `em_risco_de_perda`
     - `Arq Campeão` -> `campeao` + `top_indicador`
     - `Arq Parceiro Fiel` -> `parceiro_fiel`
     - `Arq Em Ascensão` -> `em_ascensao` + `alto_potencial`
     - `Arq Ocasional` -> `ocasional`
     - `Arq Esfriando` -> `em_risco` + `especificador_esfriando` (possui dono e última interação há > 30 dias)
  4. **Validação do Risco de Concorrência**:
     - 20% -> 'baixo', 45% -> 'medio', 75% -> 'alto'.
     - Confirmação de que o risco não afeta o Score Geral.

### 4.2. `scripts/test_http_arquitetos.js` (Validação HTTP E2E)
- **Tecnologia**: Node.js com `fetch` nativo, gerenciamento de CookieJar e token CSRF.
- **Fluxo do Teste**:
  1. `GET /login` -> colhe `XSRF-TOKEN` e cookie de sessão.
  2. `POST /login` -> autentica como Vendedor e Gerente Comercial.
  3. `GET /especificadores` (com `X-Inertia: true`):
     - Valida retorno HTTP 200 e props `especificadores`, `kpis` e `minhaMeta`.
     - Testa filtros por `tipo` e `status_carteira`.
  4. `GET /especificadores/:id` (ou rota de score):
     - Valida integridade do payload de score (RFV, Potencial, Lealdade, Geral, Segmento, Flags, Concorrência).
  5. `PATCH /especificadores/:id/dono` (Reatribuição e RN017):
     - Transfere especificador para outro consultor.
     - `GET /especificadores/:id/historico-dono` verifica que o log imutável foi persistido com `consultor_anterior_id`, `consultor_novo_id` e `alterado_por_id`.
  6. `POST /especificadores/:id/interacoes`:
     - Registra interação (`visita_escritorio`) e valida sua inserção ordenada no topo.
  7. `POST /especificadores/:id/decisores`:
     - Cria decisor com `is_principal = true` e valida garantia de unicidade de decisor principal.
  8. `POST /especificadores/:id/concorrentes`:
     - Registra concorrente com % estimado.
  9. `DELETE /especificadores/:id` (Soft Delete):
     - Executa desativação lógica.
     - Confirma que `is_active` tornou-se `false` e o arquiteto não aparece na listagem padrão de ativos.
  10. `RBAC / Permissões`:
     - Garante que projetista ou vendedor não autorizado recebe 403 ao tentar reatribuir dono ou editar metas gerenciais.

---

## 5. Caveats (Ressalvas e Suposições)

- **Fuso Horário no Cálculo de Datas**: O banco PostgreSQL armazena timestamps com fuso (`timestamptz`). No serviço TypeScript com Luxon, deve-se usar `DateTime.now().setZone('utc')` para evitar discrepâncias em comparações com datas salvas sem fuso ou em UTC.
- **Relacionamento com Projetos**: O schema atual de `projetos` possui `arquiteto_nome`, mas ainda não possui a coluna `arquiteto_id`. A migration da equipe de dados/backend precisará criar a coluna `arquiteto_id` com FK referenciando `arquitetos.id`.
- **Não persistência do Score**: Reforça-se que o score nunca deve ser persistido como coluna fixa em `arquitetos`, garantindo dados sempre frescos e auditáveis a partir do estado dos projetos e leads.

---

## 6. Conclusion (Conclusão)

A especificação matemática e analítica do módulo de Especificadores do Plannit está completamente mapeada e pronta para ser implementada em AdonisJS v7 e TypeScript.
- Todas as 3 dimensões (RFV, Potencial, Lealdade) e seus subcritérios possuem faixas numéricas inequívocas.
- A cascata dos 7 segmentos comportamentais e as regras das 5 flags estão formalizadas sem ambiguidades.
- O guardrail RN017 para histórico imutável e soft delete está detalhado no nível de modelo de dados e contrato HTTP.
- O design dos scripts de validação automatizada (`scripts/test_arquiteto_score.js` e `scripts/test_http_arquitetos.js`) segue os padrões estabelecidos nas fases anteriores do projeto.

---

## 7. Verification Method (Método de Verificação Independente)

Para auditar e verificar as informações deste relatório:
1. Inspecionar o arquivo de implementação de referência em Python:
   `view_file /home/porto/codespace/Plannit/backend/app/services/arquiteto_score.py`
2. Inspecionar os testes unitários da lógica matemática:
   `view_file /home/porto/codespace/Plannit/backend/tests/test_arquiteto_score_rfv_potencial.py`
   `view_file /home/porto/codespace/Plannit/backend/tests/test_arquiteto_score_segmento_flags.py`
   `view_file /home/porto/codespace/Plannit/backend/tests/test_arquiteto_score_esfriando.py`
3. Inspecionar a convenção dos scripts existentes no AdonisJS:
   `view_file /home/porto/codespace/Plannit/plannit/scripts/test_briefings.js`
   `view_file /home/porto/codespace/Plannit/plannit/scripts/test_http_briefings.js`
4. Quando implementado, rodar:
   `node scripts/test_arquiteto_score.js`
   `node scripts/test_http_arquitetos.js`
