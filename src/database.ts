import { knex as setupKnex, Knex } from 'knex'
import { env } from './env'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL NOT FOUND')
}

// aqui, eu consigo configurar meu banco de dados knex que:
export const config: Knex.Config = {
  client: env.DATABASE_CLIENT, // terá o sqlite como seu driver padrão
  connection:
    env.DATABASE_CLIENT === 'sqlite'
      ? {
          filename: env.DATABASE_URL,
        }
      : env.DATABASE_URL,

  useNullAsDefault: true,
  migrations: {
    extension: 'ts',
    // directory: env.MIGRATIONS_DIR,
  },
}

export const knex = setupKnex(config)
