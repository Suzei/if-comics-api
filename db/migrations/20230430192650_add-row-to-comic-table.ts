import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('comics', (table) => {
    table.uuid('user')
    table.dropColumn('session_id')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('comics', (table) => {
    table.dropColumn('user')
  })
}
