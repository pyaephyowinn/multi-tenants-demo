import type { Context, Next } from 'hono';
import { getTenantKnex } from '../utils/database.js';
import type { Knex } from 'knex';

export interface TenantContext {
  tenantId: string;
  schemaName: string;
  knex: Knex;
}

declare module 'hono' {
  interface ContextVariableMap {
    tenant: TenantContext;
  }
}

export async function tenantMiddleware(c: Context, next: Next): Promise<void> {
  const tenantId = c.req.header('X-Tenant-Id');
  
  if (!tenantId) {
    return c.json({ error: 'Missing X-Tenant-Id header' }, 401);
  }
  
  try {
    // First, get tenant info from public schema using main db connection
    const db = await import('../config/database.js').then(m => m.default);
    
    const tenant = await db('tenants')
      .where('id', tenantId)
      .first();
    
    if (!tenant) {
      return c.json({ error: 'Invalid tenant' }, 401);
    }
    
    // Then get tenant-scoped Knex instance
    const knexInstance = await getTenantKnex(tenantId);
    
    c.set('tenant', {
      tenantId: tenant.id,
      schemaName: tenant.schema_name,
      knex: knexInstance
    });
    
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid tenant context' }, 401);
  }
}