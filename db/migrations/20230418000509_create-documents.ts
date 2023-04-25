import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // uma migration sempre vai ser a rotina que decidirá as ações de criação e exclusão de um banco.
  // nesse arquivo, o up serve para rodar as funções no migrate:latest, o que tiver dentro dessa sessão, se válido, rodará no banco de dados.
  await knex.schema.createTable('transactions', (table) => {
    table.uuid('id').primary()
    table.text('title').notNullable()
    table.decimal('amount', 10, 2).notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  // aqui é se der uma merda federal e por um acaso, eu deseje dar um rollback na minha planilha.
  await knex.schema.dropTable('transactions')
}
