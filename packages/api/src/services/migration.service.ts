import type { Knex } from 'knex';
import knex from 'knex';
import { getDbConfig } from '../config/database.js';
import { createSchema, dropSchema, sanitizeSchemaName } from '../utils/database.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MigrationService {
  private db: Knex;
  
  constructor(db: Knex) {
    this.db = db;
  }
  
  async createTenantSchema(schemaName: string): Promise<void> {
    const safeName = sanitizeSchemaName(schemaName);
    
    try {
      await this.db.transaction(async (trx) => {
        await createSchema(safeName);
        
        await trx.raw(`SET search_path TO ??`, [safeName]);
      });
    } catch (error) {
      throw new Error(`Failed to create tenant schema: ${error}`);
    }
  }
  
  async runTenantMigrations(schemaName: string): Promise<void> {
    const safeName = sanitizeSchemaName(schemaName);
    const config = getDbConfig();
    
    const tenantKnex = knex({
      client: 'postgresql',
      connection: config.connection,
      searchPath: [safeName],
      migrations: {
        directory: path.join(__dirname, '../../migrations/tenant'),
        extension: 'ts',
        tableName: 'knex_migrations',
        schemaName: safeName
      }
    });
    
    try {
      await tenantKnex.raw(`SET search_path TO ??`, [safeName]);
      
      await tenantKnex.migrate.latest();
    } catch (error) {
      throw new Error(`Failed to run tenant migrations: ${error}`);
    } finally {
      await tenantKnex.destroy();
    }
  }
  
  async rollbackTenantMigrations(schemaName: string): Promise<void> {
    const safeName = sanitizeSchemaName(schemaName);
    const config = getDbConfig();
    
    const tenantKnex = knex({
      client: 'postgresql',
      connection: config.connection,
      searchPath: [safeName],
      migrations: {
        directory: path.join(__dirname, '../../migrations/tenant'),
        extension: 'ts',
        tableName: 'knex_migrations',
        schemaName: safeName
      }
    });
    
    try {
      await tenantKnex.raw(`SET search_path TO ??`, [safeName]);
      
      await tenantKnex.migrate.rollback();
    } catch (error) {
      throw new Error(`Failed to rollback tenant migrations: ${error}`);
    } finally {
      await tenantKnex.destroy();
    }
  }
  
  async dropTenantSchema(schemaName: string): Promise<void> {
    const safeName = sanitizeSchemaName(schemaName);
    
    try {
      await dropSchema(safeName);
    } catch (error) {
      throw new Error(`Failed to drop tenant schema: ${error}`);
    }
  }
  
  async createAndMigrateTenantSchema(schemaName: string): Promise<void> {
    const safeName = sanitizeSchemaName(schemaName);
    
    try {
      await this.createTenantSchema(safeName);
      await this.runTenantMigrations(safeName);
    } catch (error) {
      await this.dropTenantSchema(safeName);
      throw error;
    }
  }
}

export default MigrationService;