import { Hono } from 'hono';
import TenantService from '../services/tenant.service.js';
import db from '../config/database.js';

const app = new Hono();
const tenantService = new TenantService(db);

app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body.name) {
      return c.json({ error: 'Name is required' }, 400);
    }
    
    const tenant = await tenantService.createTenant({
      name: body.name
    });
    
    return c.json(tenant, 201);
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    
    if (error.message.includes('already exists')) {
      return c.json({ error: error.message }, 409);
    }
    
    return c.json({ error: 'Failed to create tenant' }, 500);
  }
});

app.get('/', async (c) => {
  try {
    const tenants = await tenantService.getAllTenants();
    return c.json(tenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return c.json({ error: 'Failed to fetch tenants' }, 500);
  }
});

app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = await tenantService.getTenant(id);
    
    if (!tenant) {
      return c.json({ error: 'Tenant not found' }, 404);
    }
    
    return c.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return c.json({ error: 'Failed to fetch tenant' }, 500);
  }
});

export default app;