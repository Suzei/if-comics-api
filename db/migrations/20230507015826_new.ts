import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('comics', (table) => {
    table.uuid('id').primary()
    table.string('title').notNullable()
    table.string('user_id').notNullable()
    table.string('author').notNullable()
    table.string('description').notNullable()
    table.string('comic_cover')
    table.string('imageUrl')
    table.integer('likes')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('comics')
}
