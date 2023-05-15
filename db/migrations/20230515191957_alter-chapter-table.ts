import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('chapters', (table) => {
    table.string('fileUrl')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('chapters', (table) => {
    table.dropColumn('fileUrl')
  })
}
