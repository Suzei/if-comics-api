import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  knex.schema.table('comics', (table) => {
    table.string('title').unique()
  })
}

export async function down(knex: Knex): Promise<void> {
  knex.schema.table('comics', (table) => {
    table.dropColumn('title')
  })
}
