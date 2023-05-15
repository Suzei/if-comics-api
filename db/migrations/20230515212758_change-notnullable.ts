import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('chapters', (table) => {
    table.setNullable('chapterFile')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('chapters', (table) => {
    table.string('chapterFile').notNullable()
  })
}
