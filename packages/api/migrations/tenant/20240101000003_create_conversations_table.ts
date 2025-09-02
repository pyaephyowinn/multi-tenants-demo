import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('conversations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('contact_id').notNullable()
      .references('id').inTable('contacts').onDelete('CASCADE');
    table.enum('status', ['active', 'archived', 'closed']).defaultTo('active');
    table.timestamp('last_message_at');
    table.timestamps(true, true);
    
    table.index('contact_id');
    table.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('conversations');
}