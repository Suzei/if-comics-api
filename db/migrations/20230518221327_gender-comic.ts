import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('comics', (table) => {
    table.string('genres')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('comics', (table) => {
    table.dropColumn('genres')
  })
}
