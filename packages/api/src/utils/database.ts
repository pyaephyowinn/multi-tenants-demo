import knex from 'knex';
import type { Knex } from 'knex';
import { getDbConfig } from '../config/database.js';
import db from '../config/database.js';

const tenantKnexInstances = new Map<string, Knex>();

export async function getTenantKnex(tenantId: string): Promise<Knex> {
  const tenant = await db('tenants')
    .where('id', tenantId)
    .first();
  
  if (!tenant) {
    throw new Error(`Tenant with ID ${tenantId} not found`);
  }
  
  const schemaName = tenant.schema_name;
  
  if (!tenantKnexInstances.has(schemaName)) {
    const config = getDbConfig();
    const tenantKnex = knex({
      client: 'postgresql',
      connection: config.connection,
      pool: config.pool,
      searchPath: [schemaName, 'public'],
    });
    
    tenantKnexInstances.set(schemaName, tenantKnex);
  }
  
  return tenantKnexInstances.get(schemaName)!;
}

export function withSchema(knexInstance: Knex, schemaName: string): Knex {
  return knexInstance.withSchema(schemaName);
}

export function sanitizeSchemaName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50);
}

export async function schemaExists(schemaName: string): Promise<boolean> {
  const result = await db.raw(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name = ?
  `, [schemaName]);
  
  return result.rows.length > 0;
}

export async function createSchema(schemaName: string): Promise<void> {
  const safeName = sanitizeSchemaName(schemaName);
  
  if (await schemaExists(safeName)) {
    throw new Error(`Schema ${safeName} already exists`);
  }
  
  await db.raw(`CREATE SCHEMA IF NOT EXISTS ??`, [safeName]);
}

export async function dropSchema(schemaName: string): Promise<void> {
  const safeName = sanitizeSchemaName(schemaName);
  await db.raw(`DROP SCHEMA IF EXISTS ?? CASCADE`, [safeName]);
}

export function closeTenantConnection(schemaName: string): void {
  const knexInstance = tenantKnexInstances.get(schemaName);
  if (knexInstance) {
    knexInstance.destroy();
    tenantKnexInstances.delete(schemaName);
  }
}

export async function closeAllConnections(): Promise<void> {
  const promises: Promise<void>[] = [];
  
  for (const [, knexInstance] of tenantKnexInstances) {
    promises.push(knexInstance.destroy());
  }
  
  await Promise.all(promises);
  tenantKnexInstances.clear();
}