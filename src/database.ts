import { knex as setupKnex, Knex } from 'knex'
import { env } from './env'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL NOT FOUND')
}

// aqui, eu consigo configurar meu banco de dados knex que:
export const config: Knex.Config = {
  client: 'sqlite', // terá o sqlite como seu driver padrão
  connection: {
    filename: env.DATABASE_URL, // e que quando conectar, criará um arquivo que vai ter os dados do banco localmente.
  },

  useNullAsDefault: true,
  migrations: {
    extension: 'ts',
    directory: env.MIGRATIONS_DIR,
  },
}

export const knex = setupKnex(config)
