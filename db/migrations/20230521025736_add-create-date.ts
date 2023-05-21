import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('chapters', (table) => {
    table.date('createdAt')
  })

  await knex.schema.alterTable('comics', (table) => {
    table.date('createdAt')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('chapters', (table) => {
    table.dropColumn('createdAt')
  })

  await knex.schema.table('comics', (table) => {
    table.dropColumn('createdAt')
  })
}
