import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'
import env from '#start/env'

const dbConfig = defineConfig({
  /**
   * Default connection used for all queries.
   */
  connection: env.get('DB_CONNECTION') || 'postgres',

  connections: {
    /**
     * PostgreSQL connection (default for Plannit).
     */
    postgres: {
      client: 'pg',
      connection: env.get('DATABASE_URL')
        ? env.get('DATABASE_URL')
        : {
            host: env.get('DB_HOST', 'localhost'),
            port: env.get('DB_PORT', 5432),
            user: env.get('DB_USER', 'postgres'),
            password: env.get('DB_PASSWORD', ''),
            database: env.get('DB_DATABASE', 'plannit'),
          },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      debug: app.inDev,
    },

    /**
     * SQLite connection (fallback / testes rápidos).
     */
    sqlite: {
      client: 'better-sqlite3',
      connection: {
        filename: app.tmpPath('db.sqlite3'),
      },
      useNullAsDefault: true,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
