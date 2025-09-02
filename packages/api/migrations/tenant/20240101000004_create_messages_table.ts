import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('conversation_id').notNullable()
      .references('id').inTable('conversations').onDelete('CASCADE');
    table.enum('sender_type', ['user', 'contact', 'system']).notNullable();
    table.string('sender_id', 255);
    table.text('content').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['conversation_id', 'created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('messages');
}