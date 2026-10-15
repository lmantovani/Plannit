import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('nome', 200).notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.string('telefone', 30).nullable()
      table
        .enum(
          'perfil',
          [
            'diretoria',
            'gerente_comercial',
            'vendedor',
            'recepcao',
            'projetista',
            'conferente',
            'supervisor_montagem',
            'gestor_logistica',
            'sac',
            'financeiro',
            'montador_proprio',
            'montador_terceiro',
            'arquiteto',
            'rh',
            'cliente',
          ],
          {
            useNative: true,
            enumName: 'perfil_usuario_enum',
          }
        )
        .notNullable()
        .defaultTo('vendedor')
      table.boolean('is_active').notNullable().defaultTo(true)
      table.boolean('is_superuser').notNullable().defaultTo(false)
      table.timestamp('ultimo_login', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS perfil_usuario_enum')
  }
}
