---
name: criacao-migrations-models-lucid
description: >-
  Use esta skill sempre que criar novas tabelas, adicionar colunas, criar models ou alterar o banco
  de dados PostgreSQL no Plannit. A skill ensina o fluxo estrito do Lucid ORM no AdonisJS v7, o uso
  correto do schema gerado (database/schema.ts) e a definição de relacionamentos e getters computados.
---

# Criação de Migrations e Models no Lucid ORM (AdonisJS v7)

No Plannit, toda a camada de banco de dados é gerenciada pelo **Lucid ORM** com **PostgreSQL 16**. O projeto utiliza o gerador automático de schema do AdonisJS v7, que exige um fluxo disciplinado.

---

## 🚨 Regra Absoluta: Nunca Edite `database/schema.ts`

O arquivo `database/schema.ts` é **regenerado automaticamente** pelo comando `node ace migration:run` a partir da inspeção real do banco de dados. Qualquer alteração manual nele será sumariamente apagada na próxima migração.

---

## 🛠️ Fluxo de Trabalho Passo a Passo

### 1. Criar uma Nova Migration
Utilize o Ace CLI para gerar o arquivo de migração versionado:

```bash
# Para nova tabela:
node ace make:migration create_etapas_producao_table

# Para adicionar colunas a tabela existente:
node ace make:migration add_observacao_to_projetos_table
```

### 2. Escrever a Migration (Métodos `up` e `down`)
Sempre garanta que tanto a aplicação (`up`) quanto o rollback (`down`) funcionem:

```typescript
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'etapas_producao'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('projeto_id').unsigned().references('id').inTable('projetos').onDelete('CASCADE')
      table.string('nome', 120).notNullable()
      table.jsonb('dados_tecnicos').nullable()
      table.boolean('is_active').defaultTo(true).notNullable()
      table.integer('ordem').defaultTo(0).notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

### 3. Executar a Migration
Execute na raiz do projeto:

```bash
node ace migration:run
```

Este comando aplica as alterações no PostgreSQL e **reconstrói automaticamente** o `database/schema.ts`.

---

### 4. Criar ou Atualizar o Model (`app/models/`)

O Model deve **estender a classe do schema gerado** (`class MeuModel extends MeuModelSchema`):

```typescript
import { DateTime } from 'luxon'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Projeto from '#models/projeto'
import { EtapasProducaoSchema } from '#database/schema'

export default class EtapaProducao extends EtapasProducaoSchema {
  // Declare relacionamentos
  @belongsTo(() => Projeto, {
    foreignKey: 'projetoId',
  })
  declare projeto: BelongsTo<typeof Projeto>

  // Getters computados
  get isPendente() {
    return this.isActive && !this.concluidaEm
  }
}
```

> [!TIP]
> **Campos JSONB:** Para colunas do tipo JSONB (`jsonPrepareConsume`), redeclare a coluna no Model caso precise garantir parsing estrito de objetos ou arrays vazios padrão (`defaultTo([])`).
