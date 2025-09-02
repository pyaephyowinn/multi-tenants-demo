import type { Knex } from 'knex';
import type { Tenant, TenantInput } from '../types/models.js';
import { sanitizeSchemaName } from '../utils/database.js';
import { MigrationService } from './migration.service.js';

export class TenantService {
  private db: Knex;
  private migrationService: MigrationService;
  
  constructor(db: Knex) {
    this.db = db;
    this.migrationService = new MigrationService(db);
  }
  
  async createTenant(input: TenantInput): Promise<Tenant> {
    const schemaName = sanitizeSchemaName(input.name);
    
    const existingSchema = await this.db('tenants')
      .where('schema_name', schemaName)
      .first();
    
    if (existingSchema) {
      throw new Error(`Tenant with similar name already exists`);
    }
    
    const trx = await this.db.transaction();
    
    try {
      const [tenant] = await trx('tenants')
        .insert({
          name: input.name,
          schema_name: schemaName
        })
        .returning('*');
      
      await this.migrationService.createAndMigrateTenantSchema(schemaName);
      
      await trx.commit();
      
      return tenant;
    } catch (error) {
      await trx.rollback();
      
      try {
        await this.migrationService.dropTenantSchema(schemaName);
      } catch (cleanupError) {
        console.error('Failed to clean up schema after error:', cleanupError);
      }
      
      throw error;
    }
  }
  
  async getTenant(id: string): Promise<Tenant | null> {
    return await this.db('tenants')
      .where('id', id)
      .first();
  }
  
  async getAllTenants(): Promise<Tenant[]> {
    return await this.db('tenants')
      .orderBy('created_at', 'desc');
  }
  
  async deleteTenant(id: string): Promise<void> {
    const tenant = await this.getTenant(id);
    
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    
    await this.db.transaction(async (trx) => {
      await trx('tenants')
        .where('id', id)
        .delete();
      
      await this.migrationService.dropTenantSchema(tenant.schema_name);
    });
  }
}

export default TenantService;