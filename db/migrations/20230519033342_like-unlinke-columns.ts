import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('comics', (table) => {
    table.json('peopleLiked')
    table.json('peopleDisliked')
    table.integer('dislike')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('comics', (table) => {
    table.dropColumn('peopleLiked')
    table.dropColumn('peopleDisliked')
    table.dropColumn('dislike')
  })
}
