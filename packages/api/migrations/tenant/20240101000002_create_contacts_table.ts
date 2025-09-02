import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('contacts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('email', 255);
    table.string('phone', 50);
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
    
    table.index('email');
    table.index('phone');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('contacts');
}