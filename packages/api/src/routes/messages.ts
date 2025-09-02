import { Hono } from 'hono';
import MessageService from '../services/message.service.js';
import { tenantMiddleware } from '../middleware/tenant.js';

const app = new Hono();

app.use('*', tenantMiddleware);

app.post('/', async (c) => {
  try {
    const tenant = c.get('tenant');
    const body = await c.req.json();
    
    if (!body.conversation_id) {
      return c.json({ error: 'conversation_id is required' }, 400);
    }
    
    if (!body.content) {
      return c.json({ error: 'content is required' }, 400);
    }
    
    if (!body.sender_type || !['user', 'contact', 'system'].includes(body.sender_type)) {
      return c.json({ error: 'sender_type must be one of: user, contact, system' }, 400);
    }
    
    const messageService = new MessageService(tenant.knex, tenant.schemaName);
    const message = await messageService.createMessage({
      conversation_id: body.conversation_id,
      sender_type: body.sender_type,
      sender_id: body.sender_id,
      content: body.content
    });
    
    return c.json(message, 201);
  } catch (error: any) {
    console.error('Error creating message:', error);
    
    if (error.message === 'Conversation not found') {
      return c.json({ error: error.message }, 404);
    }
    
    return c.json({ error: 'Failed to create message' }, 500);
  }
});

app.get('/conversation/:conversationId', async (c) => {
  try {
    const tenant = c.get('tenant');
    const conversationId = c.req.param('conversationId');
    
    const messageService = new MessageService(tenant.knex, tenant.schemaName);
    const messages = await messageService.getMessagesByConversation(conversationId);
    
    return c.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

app.get('/:id', async (c) => {
  try {
    const tenant = c.get('tenant');
    const id = c.req.param('id');
    
    const messageService = new MessageService(tenant.knex, tenant.schemaName);
    const message = await messageService.getMessage(id);
    
    if (!message) {
      return c.json({ error: 'Message not found' }, 404);
    }
    
    return c.json(message);
  } catch (error) {
    console.error('Error fetching message:', error);
    return c.json({ error: 'Failed to fetch message' }, 500);
  }
});

app.delete('/:id', async (c) => {
  try {
    const tenant = c.get('tenant');
    const id = c.req.param('id');
    
    const messageService = new MessageService(tenant.knex, tenant.schemaName);
    await messageService.deleteMessage(id);
    
    return c.json({ message: 'Message deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting message:', error);
    
    if (error.message === 'Message not found') {
      return c.json({ error: error.message }, 404);
    }
    
    return c.json({ error: 'Failed to delete message' }, 500);
  }
});

export default app;