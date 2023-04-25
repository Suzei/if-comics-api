import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('comics', (table) => {
    table.uuid('id').primary()
    table.text('title').notNullable()
    table.text('author').notNullable()
    table.text('description').notNullable()
    table.date('release-date')
    table.integer('likes')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('comics')
}
