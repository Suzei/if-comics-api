import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('chapters', (table) => {
    table.uuid('id').primary()
    table.string('comicId').notNullable()
    table.string('chapterTitle').notNullable()
    table.string('chapterNumber').notNullable()
    table.string('chapterFile').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('chapters')
}
