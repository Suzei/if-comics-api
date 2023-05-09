import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTable('comics')
}

export async function down(knex: Knex): Promise<void> {}
