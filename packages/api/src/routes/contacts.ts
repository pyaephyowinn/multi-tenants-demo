import { Hono } from 'hono';
import ContactService from '../services/contact.service.js';
import { tenantMiddleware } from '../middleware/tenant.js';

const app = new Hono();

app.use('*', tenantMiddleware);

app.post('/', async (c) => {
  try {
    const tenant = c.get('tenant');
    const body = await c.req.json();
    
    if (!body.name) {
      return c.json({ error: 'Name is required' }, 400);
    }
    
    if (!body.email && !body.phone) {
      return c.json({ error: 'Either email or phone is required' }, 400);
    }
    
    const contactService = new ContactService(tenant.knex, tenant.schemaName);
    const result = await contactService.createContact({
      name: body.name,
      email: body.email,
      phone: body.phone,
      metadata: body.metadata
    });
    
    return c.json(result, 201);
  } catch (error: any) {
    console.error('Error creating contact:', error);
    return c.json({ error: 'Failed to create contact' }, 500);
  }
});

app.get('/', async (c) => {
  try {
    const tenant = c.get('tenant');
    const contactService = new ContactService(tenant.knex, tenant.schemaName);
    const contacts = await contactService.getAllContacts();
    
    return c.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return c.json({ error: 'Failed to fetch contacts' }, 500);
  }
});

app.get('/:id', async (c) => {
  try {
    const tenant = c.get('tenant');
    const id = c.req.param('id');
    
    const contactService = new ContactService(tenant.knex, tenant.schemaName);
    const contact = await contactService.getContact(id);
    
    if (!contact) {
      return c.json({ error: 'Contact not found' }, 404);
    }
    
    return c.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return c.json({ error: 'Failed to fetch contact' }, 500);
  }
});

app.put('/:id', async (c) => {
  try {
    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const contactService = new ContactService(tenant.knex, tenant.schemaName);
    const contact = await contactService.updateContact(id, body);
    
    return c.json(contact);
  } catch (error: any) {
    console.error('Error updating contact:', error);
    
    if (error.message === 'Contact not found') {
      return c.json({ error: error.message }, 404);
    }
    
    return c.json({ error: 'Failed to update contact' }, 500);
  }
});

app.delete('/:id', async (c) => {
  try {
    const tenant = c.get('tenant');
    const id = c.req.param('id');
    
    const contactService = new ContactService(tenant.knex, tenant.schemaName);
    await contactService.deleteContact(id);
    
    return c.json({ message: 'Contact deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    
    if (error.message === 'Contact not found') {
      return c.json({ error: error.message }, 404);
    }
    
    return c.json({ error: 'Failed to delete contact' }, 500);
  }
});

export default app;