# Relatório de Levantamento de Backend & Banco de Dados — Módulo de Especificadores (Plannit)

**Autor**: Explorer 1 (Backend & Database Surveyor)  
**Data**: 2026-09-10  
**Workspace**: `/home/porto/codespace/Plannit/.agents/explorer_survey_1`  
**Escopo**: Levantamento arquitetural, schema PostgreSQL, models Lucid ORM, rotas e dependências para os Requisitos R1, R2 e R3 do módulo de Especificadores.

---

## 1. Observation (Observações Técnicas Diretas)

### 1.1. Arquitetura do Backend em `/home/porto/codespace/Plannit/plannit`
- **Framework & Runtime**: AdonisJS v7 (`@adonisjs/core: ^7.5.0`), Node.js `>=24.0.0`, TypeScript `~6.0.3` (`package.json`, linhas 7-8, 64, 70).
- **ORM & Banco de Dados**: `@adonisjs/lucid: ^22.4.2` com driver `pg: ^8.23.0` conectado em PostgreSQL (`config/database.ts`, linhas 15-31; `.env`, linhas 16-22).
- **Validação**: `@vinejs/vine: ^4.4.0` para validação tipada de payloads em `#validators/*` (`package.json`, linha 80).
- **Autenticação & Sessão**: `@adonisjs/auth: ^10.1.0` utilizando o guard `web` baseado em sessões de cookie (`config/auth.ts`, linhas 11-25; `app/models/user.ts`, linha 4).
- **Frontend Integrado**: `@adonisjs/inertia: ^5.0.1`, `@inertiajs/react: ^3.7.0`, React `19.2.8` e TailwindCSS `3.4.19` (`package.json`, linhas 72, 78, 88).
- **Subpath Imports**: Configurados em `package.json` (`imports`), permitindo imports limpos como `#models/*`, `#controllers/*`, `#services/*`, `#validators/*`, `#database/*`.

### 1.2. Estado Atual do Banco de Dados e Migrations
No diretório `database/migrations`, existem 9 migrations executadas com sucesso (Batch 1 a 4):
1. `1761885935168_create_users_table.ts` — Tabela `users` com enum nativo `perfil_usuario_enum` contendo os 15 perfis (incluindo `arquiteto`, `vendedor`, `diretoria`, `gerente_comercial`, `recepcao`).
2. `1761885935169_create_leads_table.ts` — Tabela `leads`. **Observação crítica**: linha 27 declara `table.integer('arquiteto_id').unsigned().nullable()`, porém **sem** foreign key constraint para `arquitetos`, pois a tabela de arquitetos ainda não existia.
3. `1761885935170_create_interacoes_lead_table.ts` — Tabela `interacoes_lead` (vinculada a `leads`).
4. `1761885935171_create_projetos_table.ts` — Tabela `projetos`. **Observação crítica**: linha 39 declara apenas `table.string('arquiteto_nome', 200).nullable()`. **NÃO existe coluna `arquiteto_id` na tabela `projetos`**.
5. `1761885935172_create_briefings_table.ts` — Tabela `briefings` (contém `arquiteto_nome`, `arquiteto_email`, `arquiteto_telefone` como strings de contato).
6. `1761885935173_create_ambientes_briefing_table.ts` — Ambientes do briefing.
7. `1761885935174_create_fila_projetos_table.ts` — Fila de projetos e distribuição por prioridade.
8. `1761885935175_create_config_wip_projetistas_table.ts` — Limites de WIP por projetista.
9. `1761885935176_create_historico_status_projeto_table.ts` — Histórico imutável de transição de status (RN017).

### 1.3. Padrão Lucid ORM em AdonisJS v7
- O Adonis v7 utiliza geração automática de schemas: ao rodar `node ace migration:run`, o arquivo `database/schema.ts` é gerado contendo classes como `UserSchema`, `LeadSchema`, `ProjetoSchema` com tipagem estrita de cada coluna (`database/schema.ts`, linhas 10-266).
- Os models em `app/models/` herdam dessas classes de schema (ex: `class Lead extends LeadSchema`, `class Projeto extends ProjetoSchema`) e declaram relacionamentos com os decorators `@belongsTo`, `@hasMany`, `@hasOne` de `@adonisjs/lucid/orm`.
- Datas utilizam objetos `DateTime` do Luxon (`luxon: ^3.7.2`), e as colunas timestamp no banco utilizam `{ useTz: true }`.

### 1.4. Roteamento e Controllers
- Rotas são registradas em `start/routes.ts`.
- O grupo protegido com `middleware.auth()` engloba rotas do CRM, Briefings e Fila.
- Controllers são referenciados via `controllers.<NomeController>` importados de `#generated/controllers`.
- **Invariante de roteamento**: Rotas estáticas (ex: `/kpis`, `/metas-visitas`, `/calcular-score`) **devem** ser declaradas antes de rotas com parâmetros dinâmicos (`/:id`) para evitar colisão no roteador do Adonis.

### 1.5. Regras de Negócio e Domínio dos Especificadores (Evidência do Módulo Legado)
Em `backend/app/models/crm.py` (linhas 140-277) e `backend/app/services/arquiteto_score.py`:
- Foram identificadas com exatidão as entidades:
  - `Arquiteto`: id, nome, escritorio, endereco_escritorio, telefone, email (unique), nivel_parceria ('parceiro', 'premium', 'vip'), tipo ('arquiteto', 'designer_interiores', 'decorador', 'engenheiro', 'corretor', 'outro'), especialidade, consultor_id (dono da carteira), status_carteira ('ativo', 'em_prospeccao', 'inativo'), is_active (soft delete), created_at/criado_em.
  - `DecisorArquiteto`: id, arquiteto_id, nome, cargo, telefone, email, observacoes, is_principal (apenas 1 principal por escritório).
  - `ConcorrenteArquiteto`: id, arquiteto_id, nome_concorrente, percentual_fechamento_estimado (0-100), observacoes, registrado_por_id.
  - `HistoricoDonoArquiteto`: id, arquiteto_id, consultor_anterior_id, consultor_novo_id, alterado_por_id, alterado_em / created_at (imutável).
  - `InteracaoArquiteto`: id, arquiteto_id, responsavel_id, tipo ('ligacao', 'whatsapp', 'email', 'visita_escritorio', 'visita_loja', 'reuniao', 'evento', 'viagem', 'envio_brinde'), resumo, lead_id (nullable, rastreabilidade), data.
  - `MetaVisitasConsultor`: id, consultor_id (unique), meta_visitas_mes, configurado_por_id, created_at, updated_at.

---

## 2. Logic Chain (Cadeia de Raciocínio e Arquitetura Proposta)

### 2.1. Da Observação da Ausência de `arquiteto_id` em `projetos` à Estratégia de Migration
1. **Premissa**: O requisito R1 e o cálculo de RFV (R2) exigem que projetos possam ser agregados e consultados por `arquiteto_id` (`Projeto.arquiteto_id == arquiteto.id`).
2. **Fato**: A tabela `projetos` possui apenas `arquiteto_nome` em texto livre, e a tabela `leads` possui `arquiteto_id`, mas sem foreign key formal.
3. **Conclusão**: É indispensável criar uma migration para criar as tabelas do ecossistema de especificadores e outra (ou combinada) para adicionar `arquiteto_id` em `projetos` com foreign key (`onDelete('SET NULL')`) e índice, além de formalizar a foreign key em `leads.arquiteto_id`.

### 2.2. Do Padrão Lucid ORM v22 / Adonis v7 à Estrutura dos Novos Models
1. **Premissa**: O projeto utiliza `#database/schema` gerado automaticamente pelo Lucid para fornecer tipagem e colunas básicas aos models.
2. **Fato**: Os models existentes estendem as classes `<Nome>Schema` geradas (ex: `Briefing extends BriefingSchema`).
3. **Conclusão**:
   - A criação das migrations deve ocorrer primeiro.
   - Ao rodar `node ace migration:run`, o Lucid gerará automaticamente as classes `ArquitetoSchema`, `DecisorArquitetoSchema`, etc. em `database/schema.ts`.
   - Os novos models (`app/models/arquiteto.ts`, etc.) estendem essas classes, definem `static table = '...'` e mapeiam os relacionamentos com `@belongsTo`, `@hasMany` e `@hasOne`.
   - Os models existentes `Projeto`, `Lead` e `User` devem ser estendidos com os novos relacionamentos.

### 2.3. Da Regra RN017 ao Soft Delete e Auditoria Imutável
1. **Premissa**: Especificadores nunca devem ser deletados fisicamente; a desativação deve ser lógica (`is_active = false`). A transferência de carteira exige registro imutável em `historico_dono_arquitetos`.
2. **Fato**: Lucid ORM suporta queries filtradas por padrão ou scopes, mas no padrão do Plannit (observado no controller de leads e projetos), o soft delete é gerido explicitamente com `is_active = true` nas consultas da carteira (`.where('is_active', true)`).
3. **Conclusão**: O endpoint `DELETE /especificadores/:id` deve executar `arquiteto.isActive = false` e persistir sem remover o registro. A troca de dono deve inserir uma linha em `HistoricoDonoArquiteto` dentro de uma transação do banco (`db.transaction`).

### 2.4. Do Cálculo do Score RFV × Potencial × Lealdade ao Serviço de Backend
1. **Premissa**: O score deve ser 100% calculado no backend, determinístico, em escala de 0 a 100, gerando 7 segmentos e 5 flags.
2. **Fato**: O cálculo necessita de dados de 4 fontes: `projetos` (recência, frequência de 12 meses, valor de contratos), `leads` (ativos no funil, fechados, perdidos), `concorrentes_arquitetos` (risco de concorrência) e `interacoes_arquitetos` (última interação para flag de esfriando).
3. **Conclusão**: Deve ser criado o serviço `app/services/arquiteto_score_service.ts` espelhando rigorosamente as faixas fixas validadas no módulo de negócio.

---

## 3. Schemas Detalhados e Modelagem de Dados (R1 e R3)

Abaixo está o DDL e as definições TypeScript propostas para todas as entidades necessárias.

### 3.1. Tabela `arquitetos`
```sql
CREATE TABLE arquitetos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  escritorio VARCHAR(200) NULL,
  endereco_escritorio VARCHAR(300) NULL,
  telefone VARCHAR(30) NULL,
  email VARCHAR(254) UNIQUE NULL,
  nivel_parceria VARCHAR(50) NOT NULL DEFAULT 'parceiro', -- 'parceiro', 'premium', 'vip'
  tipo VARCHAR(50) NOT NULL DEFAULT 'arquiteto',          -- 'arquiteto', 'designer_interiores', 'decorador', 'engenheiro', 'corretor', 'outro'
  especialidade VARCHAR(200) NULL,
  consultor_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  status_carteira VARCHAR(50) NOT NULL DEFAULT 'em_prospeccao', -- 'ativo', 'em_prospeccao', 'inativo'
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_arquitetos_consultor ON arquitetos(consultor_id);
CREATE INDEX idx_arquitetos_status ON arquitetos(status_carteira);
CREATE INDEX idx_arquitetos_tipo ON arquitetos(tipo);
CREATE INDEX idx_arquitetos_is_active ON arquitetos(is_active);
```

### 3.2. Tabela `decisores_arquitetos`
```sql
CREATE TABLE decisores_arquitetos (
  id SERIAL PRIMARY KEY,
  arquiteto_id INTEGER NOT NULL REFERENCES arquitetos(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  cargo VARCHAR(100) NULL,
  telefone VARCHAR(30) NULL,
  email VARCHAR(254) NULL,
  observacoes TEXT NULL,
  is_principal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_decisores_arquiteto ON decisores_arquitetos(arquiteto_id);
CREATE INDEX idx_decisores_principal ON decisores_arquitetos(arquiteto_id, is_principal);
```

### 3.3. Tabela `concorrentes_arquitetos`
```sql
CREATE TABLE concorrentes_arquitetos (
  id SERIAL PRIMARY KEY,
  arquiteto_id INTEGER NOT NULL REFERENCES arquitetos(id) ON DELETE CASCADE,
  nome_concorrente VARCHAR(200) NOT NULL,
  percentual_fechamento_estimado DECIMAL(5, 2) NOT NULL DEFAULT 0.00, -- 0.00 a 100.00
  observacoes TEXT NULL,
  registrado_por_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_concorrentes_arquiteto ON concorrentes_arquitetos(arquiteto_id);
```

### 3.4. Tabela `historico_dono_arquitetos` (Auditoria Imutável — RN017)
```sql
CREATE TABLE historico_dono_arquitetos (
  id SERIAL PRIMARY KEY,
  arquiteto_id INTEGER NOT NULL REFERENCES arquitetos(id) ON DELETE CASCADE,
  consultor_anterior_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  consultor_novo_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alterado_por_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  motivo TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_historico_dono_arquiteto ON historico_dono_arquitetos(arquiteto_id);
CREATE INDEX idx_historico_dono_consultor ON historico_dono_arquitetos(consultor_novo_id);
```

### 3.5. Tabela `interacoes_arquitetos`
```sql
CREATE TABLE interacoes_arquitetos (
  id SERIAL PRIMARY KEY,
  arquiteto_id INTEGER NOT NULL REFERENCES arquitetos(id) ON DELETE CASCADE,
  responsavel_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'ligacao', 'whatsapp', 'email', 'visita_escritorio', 'visita_loja', 'reuniao', 'evento', 'viagem', 'envio_brinde'
  resumo TEXT NOT NULL,
  lead_id INTEGER NULL REFERENCES leads(id) ON DELETE SET NULL,
  data TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_interacoes_arquiteto ON interacoes_arquitetos(arquiteto_id);
CREATE INDEX idx_interacoes_responsavel ON interacoes_arquitetos(responsavel_id);
CREATE INDEX idx_interacoes_data ON interacoes_arquitetos(data);
CREATE INDEX idx_interacoes_tipo ON interacoes_arquitetos(tipo);
```

### 3.6. Tabela `metas_visitas_consultor`
```sql
CREATE TABLE metas_visitas_consultor (
  id SERIAL PRIMARY KEY,
  consultor_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  meta_visitas_mes INTEGER NOT NULL DEFAULT 0,
  configurado_por_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_metas_visitas_consultor ON metas_visitas_consultor(consultor_id);
```

### 3.7. Alterações em Tabelas Existentes
```sql
-- Adiciona arquiteto_id em projetos
ALTER TABLE projetos 
ADD COLUMN arquiteto_id INTEGER NULL REFERENCES arquitetos(id) ON DELETE SET NULL;

CREATE INDEX idx_projetos_arquiteto_id ON projetos(arquiteto_id);

-- Adiciona foreign key em leads (coluna já existe como unsigned int)
ALTER TABLE leads
ADD CONSTRAINT fk_leads_arquiteto
FOREIGN KEY (arquiteto_id) REFERENCES arquitetos(id) ON DELETE SET NULL;

CREATE INDEX idx_leads_arquiteto_id ON leads(arquiteto_id);
```

---

## 4. Estrutura de Models Lucid ORM e Relacionamentos

### 4.1. `app/models/arquiteto.ts`
```typescript
import { ArquitetoSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import DecisorArquiteto from '#models/decisor_arquiteto'
import ConcorrenteArquiteto from '#models/concorrente_arquiteto'
import HistoricoDonoArquiteto from '#models/historico_dono_arquiteto'
import InteracaoArquiteto from '#models/interacao_arquiteto'
import Projeto from '#models/projeto'
import Lead from '#models/lead'

export enum NivelParceria {
  PARCEIRO = 'parceiro',
  PREMIUM = 'premium',
  VIP = 'vip',
}

export enum TipoEspecificador {
  ARQUITETO = 'arquiteto',
  DESIGNER_INTERIORES = 'designer_interiores',
  DECORADOR = 'decorador',
  ENGENHEIRO = 'engenheiro',
  CORRETOR = 'corretor',
  OUTRO = 'outro',
}

export enum StatusCarteiraEspecificador {
  ATIVO = 'ativo',
  EM_PROSPECCAO = 'em_prospeccao',
  INATIVO = 'inativo',
}

export default class Arquiteto extends ArquitetoSchema {
  static table = 'arquitetos'

  @belongsTo(() => User, { foreignKey: 'consultorId' })
  declare consultor: BelongsTo<typeof User>

  @hasMany(() => DecisorArquiteto, { foreignKey: 'arquitetoId' })
  declare decisores: HasMany<typeof DecisorArquiteto>

  @hasMany(() => ConcorrenteArquiteto, { foreignKey: 'arquitetoId' })
  declare concorrentes: HasMany<typeof ConcorrenteArquiteto>

  @hasMany(() => HistoricoDonoArquiteto, { foreignKey: 'arquitetoId' })
  declare historicoDono: HasMany<typeof HistoricoDonoArquiteto>

  @hasMany(() => InteracaoArquiteto, { foreignKey: 'arquitetoId' })
  declare interacoes: HasMany<typeof InteracaoArquiteto>

  @hasMany(() => Projeto, { foreignKey: 'arquitetoId' })
  declare projetos: HasMany<typeof Projeto>

  @hasMany(() => Lead, { foreignKey: 'arquitetoId' })
  declare leads: HasMany<typeof Lead>
}
```

### 4.2. `app/models/decisor_arquiteto.ts`
```typescript
import { DecisorArquitetoSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Arquiteto from '#models/arquiteto'

export default class DecisorArquiteto extends DecisorArquitetoSchema {
  static table = 'decisores_arquitetos'

  @belongsTo(() => Arquiteto, { foreignKey: 'arquitetoId' })
  declare arquiteto: BelongsTo<typeof Arquiteto>
}
```

### 4.3. `app/models/concorrente_arquiteto.ts`
```typescript
import { ConcorrenteArquitetoSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Arquiteto from '#models/arquiteto'
import User from '#models/user'

export default class ConcorrenteArquiteto extends ConcorrenteArquitetoSchema {
  static table = 'concorrentes_arquitetos'

  @belongsTo(() => Arquiteto, { foreignKey: 'arquitetoId' })
  declare arquiteto: BelongsTo<typeof Arquiteto>

  @belongsTo(() => User, { foreignKey: 'registradoPorId' })
  declare registradoPor: BelongsTo<typeof User>
}
```

### 4.4. `app/models/historico_dono_arquiteto.ts`
```typescript
import { HistoricoDonoArquitetoSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Arquiteto from '#models/arquiteto'
import User from '#models/user'

export default class HistoricoDonoArquiteto extends HistoricoDonoArquitetoSchema {
  static table = 'historico_dono_arquitetos'

  @belongsTo(() => Arquiteto, { foreignKey: 'arquitetoId' })
  declare arquiteto: BelongsTo<typeof Arquiteto>

  @belongsTo(() => User, { foreignKey: 'consultorAnteriorId' })
  declare consultorAnterior: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'consultorNovoId' })
  declare consultorNovo: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'alteradoPorId' })
  declare alteradoPor: BelongsTo<typeof User>
}
```

### 4.5. `app/models/interacao_arquiteto.ts`
```typescript
import { InteracaoArquitetoSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Arquiteto from '#models/arquiteto'
import User from '#models/user'
import Lead from '#models/lead'

export enum TipoInteracaoArquiteto {
  LIGACAO = 'ligacao',
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  VISITA_ESCRITORIO = 'visita_escritorio',
  VISITA_LOJA = 'visita_loja',
  REUNIAO = 'reuniao',
  EVENTO = 'evento',
  VIAGEM = 'viagem',
  ENVIO_BRINDE = 'envio_brinde',
}

export default class InteracaoArquiteto extends InteracaoArquitetoSchema {
  static table = 'interacoes_arquitetos'

  @belongsTo(() => Arquiteto, { foreignKey: 'arquitetoId' })
  declare arquiteto: BelongsTo<typeof Arquiteto>

  @belongsTo(() => User, { foreignKey: 'responsavelId' })
  declare responsavel: BelongsTo<typeof User>

  @belongsTo(() => Lead, { foreignKey: 'leadId' })
  declare lead: BelongsTo<typeof Lead>
}
```

### 4.6. `app/models/meta_visitas_consultor.ts`
```typescript
import { MetaVisitasConsultorSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class MetaVisitasConsultor extends MetaVisitasConsultorSchema {
  static table = 'metas_visitas_consultor'

  @belongsTo(() => User, { foreignKey: 'consultorId' })
  declare consultor: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'configuradoPorId' })
  declare configuradoPor: BelongsTo<typeof User>
}
```

### 4.7. Atualizações em Models Existentes
- **`app/models/user.ts`**:
  ```typescript
  // Adicionar relações
  @hasMany(() => Arquiteto, { foreignKey: 'consultorId' })
  declare arquitetos: HasMany<typeof Arquiteto>

  @hasOne(() => MetaVisitasConsultor, { foreignKey: 'consultorId' })
  declare metaVisitas: HasOne<typeof MetaVisitasConsultor>
  ```
- **`app/models/projeto.ts`**:
  ```typescript
  // Adicionar relação com Arquiteto
  @belongsTo(() => Arquiteto, { foreignKey: 'arquitetoId' })
  declare arquiteto: BelongsTo<typeof Arquiteto>
  ```
- **`app/models/lead.ts`**:
  ```typescript
  // Adicionar relação com Arquiteto
  @belongsTo(() => Arquiteto, { foreignKey: 'arquitetoId' })
  declare arquiteto: BelongsTo<typeof Arquiteto>
  ```

---

## 5. Rotas HTTP e Endpoints de Especificadores (`start/routes.ts`)

As rotas devem ser declaradas dentro do grupo autenticado (`middleware.auth()`) com a ordem estrita de caminhos fixos antes dos dinâmicos:

```typescript
// Especificadores (Fase 5 - R1 a R4)
// Rotas com caminhos fixos primeiro
router.get('especificadores', [controllers.Arquitetos, 'index']).as('especificadores.index')
router.post('especificadores', [controllers.Arquitetos, 'store']).as('especificadores.store')
router.get('especificadores/kpis', [controllers.Arquitetos, 'kpis']).as('especificadores.kpis')
router.get('especificadores/metas-visitas', [controllers.Arquitetos, 'listarMetas']).as('especificadores.metas.index')
router.put('especificadores/metas-visitas', [controllers.Arquitetos, 'definirMeta']).as('especificadores.metas.update')
router.get('especificadores/metas-visitas/me', [controllers.Arquitetos, 'minhaMeta']).as('especificadores.metas.me')

// Rotas com ID dinâmico
router.get('especificadores/:id', [controllers.Arquitetos, 'show']).as('especificadores.show')
router.patch('especificadores/:id', [controllers.Arquitetos, 'update']).as('especificadores.update')
router.delete('especificadores/:id', [controllers.Arquitetos, 'destroy']).as('especificadores.destroy')
router.patch('especificadores/:id/dono', [controllers.Arquitetos, 'reatribuirDono']).as('especificadores.reatribuir_dono')
router.get('especificadores/:id/historico-dono', [controllers.Arquitetos, 'historicoDono']).as('especificadores.historico_dono')
router.get('especificadores/:id/score', [controllers.Arquitetos, 'score']).as('especificadores.score')

// Sub-recursos: Decisores
router.get('especificadores/:id/decisores', [controllers.Arquitetos, 'listarDecisores']).as('especificadores.decisores.index')
router.post('especificadores/:id/decisores', [controllers.Arquitetos, 'criarDecisor']).as('especificadores.decisores.store')
router.patch('especificadores/:id/decisores/:decisorId', [controllers.Arquitetos, 'atualizarDecisor']).as('especificadores.decisores.update')
router.delete('especificadores/:id/decisores/:decisorId', [controllers.Arquitetos, 'removerDecisor']).as('especificadores.decisores.destroy')

// Sub-recursos: Concorrentes
router.get('especificadores/:id/concorrentes', [controllers.Arquitetos, 'listarConcorrentes']).as('especificadores.concorrentes.index')
router.post('especificadores/:id/concorrentes', [controllers.Arquitetos, 'criarConcorrente']).as('especificadores.concorrentes.store')
router.patch('especificadores/:id/concorrentes/:concorrenteId', [controllers.Arquitetos, 'atualizarConcorrente']).as('especificadores.concorrentes.update')
router.delete('especificadores/:id/concorrentes/:concorrenteId', [controllers.Arquitetos, 'removerConcorrente']).as('especificadores.concorrentes.destroy')

// Sub-recursos: Interações
router.get('especificadores/:id/interacoes', [controllers.Arquitetos, 'listarInteracoes']).as('especificadores.interacoes.index')
router.post('especificadores/:id/interacoes', [controllers.Arquitetos, 'criarInteracao']).as('especificadores.interacoes.store')
```

---

## 6. Caveats (Ressalvas e Pontos de Atenção)

1. **Re-geração do `database/schema.ts`**:
   No Adonis v7, quando migrations são executadas via `node ace migration:run`, o Lucid reescreve `database/schema.ts`. É fundamental que o implementador execute as migrations antes de finalizar os models, para que as classes `ArquitetoSchema`, etc. já existam e não causem erro no TypeScript (`npm run typecheck`).
2. **Conversão de Numéricos do PostgreSQL**:
   Colunas `DECIMAL` (como `valor_contrato` e `percentual_fechamento_estimado`) são retornadas pelo driver `pg` do Node como strings (`"150000.00"`). O serviço de score e os serializers devem sempre fazer a coerção com `Number(valor)` ou `parseFloat(valor) || 0` para evitar erros de concatenação de strings.
3. **Data e Timezone Aware**:
   Para evitar inconsistências entre ambientes locais e produção, todas as comparações de datas no serviço de score devem usar o Luxon em UTC (`DateTime.now().toUTC()`).
4. **Isolamento de Carteira por Perfil de Usuário**:
   Assim como no CRM (`leads_controller.ts`), quando o usuário logado for `vendedor`, a listagem de especificadores pode ser restrita ou destacar sua carteira (`where('consultor_id', user.id)`), enquanto perfis de gestão (`DIRETORIA`, `GERENTE_COMERCIAL`) e `RECEPCAO` possuem visão global e permissão para reatribuição de dono e cadastro.

---

## 7. Conclusion (Conclusão e Plano de Ação em PT-BR)

### 7.1. Síntese
A arquitetura do Plannit está madura e pronta para receber o módulo de Especificadores. Os padrões de ORM, rotas, validações VineJS e testes já foram estabelecidos pelas fases de CRM e Briefing. A adição da foreign key `arquiteto_id` na tabela `projetos` é a única alteração necessária no schema existente, e o novo conjunto de 6 tabelas cobrirá 100% dos requisitos R1 e R3 com garantia de integridade referencial e auditoria imutável (RN017).

### 7.2. Plano de Ação Passo a Passo para o Implementador
1. **Migrations**:
   - Criar migration `database/migrations/xxxx_create_arquitetos_tables.ts` com as 6 novas tabelas (`arquitetos`, `decisores_arquitetos`, `concorrentes_arquitetos`, `historico_dono_arquitetos`, `interacoes_arquitetos`, `metas_visitas_consultor`).
   - Criar migration `database/migrations/xxxx_add_arquiteto_id_to_projetos_and_leads.ts` para adicionar `arquiteto_id` em `projetos` e criar a constraint em `leads`.
   - Executar `node ace migration:run` para aplicar no banco e re-gerar `database/schema.ts`.
2. **Models**:
   - Criar os models em `app/models/`: `arquiteto.ts`, `decisor_arquiteto.ts`, `concorrente_arquiteto.ts`, `historico_dono_arquiteto.ts`, `interacao_arquiteto.ts`, `meta_visitas_consultor.ts`.
   - Atualizar `app/models/user.ts`, `app/models/projeto.ts` e `app/models/lead.ts` com as relações recíprocas.
3. **Serviço de Score Analítico (R2)**:
   - Criar `app/services/arquiteto_score_service.ts` com as funções determinísticas de RFV, Potencial, Lealdade, Score Geral, Segmentos em cascata, 5 Flags e Risco de Concorrência.
4. **Validators VineJS**:
   - Criar `app/validators/arquiteto.ts` com schemas para criação, atualização, reatribuição de dono, decisor, concorrente, interação e metas.
5. **Controller e Rotas**:
   - Criar `app/controllers/arquitetos_controller.ts` implementando todos os métodos com suporte duplo (Inertia view e JSON).
   - Registrar as rotas em `start/routes.ts`.
6. **Seeder e Testes Automatizados**:
   - Criar seeder `database/seeders/arquiteto_seeder.ts` populando os 7 segmentos e metas de visitas.
   - Criar `scripts/test_arquiteto_score.js` para teste unitário determinístico.
   - Criar `scripts/test_http_arquitetos.js` para teste de integração HTTP.

---

## 8. Verification Method (Método de Verificação Independente)

O implementador e os revisores podem verificar de forma independente o sucesso da implementação através dos seguintes passos:

1. **Validação de Schema e Migrations**:
   ```bash
   cd /home/porto/codespace/Plannit/plannit
   node ace migration:run
   node ace migration:status
   ```
   *Critério de aceitação*: Todas as tabelas constam como `completed` sem erros de foreign key.

2. **Validação de Tipagem TypeScript**:
   ```bash
   npm run typecheck
   ```
   *Critério de aceitação*: 0 erros de tipagem no servidor e no Inertia.

3. **Carga de Dados de Teste (Seeder)**:
   ```bash
   node ace db:seed --files database/seeders/arquiteto_seeder.ts
   ```
   *Critério de aceitação*: Popula especificadores cobrindo os 7 segmentos e metas de visitas sem falhas.

4. **Execução dos Testes Automatizados**:
   ```bash
   node scripts/test_arquiteto_score.js
   node scripts/test_http_arquitetos.js
   ```
   *Critério de aceitação*: 100% dos testes passam, validando cálculo de score (0-100), soft delete e auditoria imutável de dono.

5. **Condições de Invalidação**:
   - Falha se `projetos` não possuir a coluna `arquiteto_id` no banco.
   - Falha se a exclusão de um especificador apagar fisicamente a linha do banco em vez de atualizar `is_active = false`.
   - Falha se a reatribuição de dono não inserir uma linha em `historico_dono_arquitetos`.
   - Falha se o cálculo de score for realizado no frontend.
