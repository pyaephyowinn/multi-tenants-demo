import { Hono } from 'hono';
import ConversationService from '../services/conversation.service.js';
import { tenantMiddleware } from '../middleware/tenant.js';

const app = new Hono();

app.use('*', tenantMiddleware);

app.get('/contact/:contactId', async (c) => {
  try {
    const tenant = c.get('tenant');
    const contactId = c.req.param('contactId');
    
    const conversationService = new ConversationService(tenant.knex, tenant.schemaName);
    const conversations = await conversationService.getConversationsByContact(contactId);
    
    return c.json(conversations);
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    
    if (error.message === 'Contact not found') {
      return c.json({ error: error.message }, 404);
    }
    
    return c.json({ error: 'Failed to fetch conversations' }, 500);
  }
});

app.get('/:id', async (c) => {
  try {
    const tenant = c.get('tenant');
    const id = c.req.param('id');
    
    const conversationService = new ConversationService(tenant.knex, tenant.schemaName);
    const conversation = await conversationService.getConversation(id);
    
    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }
    
    return c.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return c.json({ error: 'Failed to fetch conversation' }, 500);
  }
});

app.patch('/:id/status', async (c) => {
  try {
    const tenant = c.get('tenant');
    const id = c.req.param('id');
    const body = await c.req.json();
    
    if (!body.status || !['active', 'archived', 'closed'].includes(body.status)) {
      return c.json({ error: 'status must be one of: active, archived, closed' }, 400);
    }
    
    const conversationService = new ConversationService(tenant.knex, tenant.schemaName);
    const conversation = await conversationService.updateConversationStatus(id, body.status);
    
    return c.json(conversation);
  } catch (error: any) {
    console.error('Error updating conversation status:', error);
    
    if (error.message === 'Conversation not found') {
      return c.json({ error: error.message }, 404);
    }
    
    return c.json({ error: 'Failed to update conversation status' }, 500);
  }
});

app.delete('/:id', async (c) => {
  try {
    const tenant = c.get('tenant');
    const id = c.req.param('id');
    
    const conversationService = new ConversationService(tenant.knex, tenant.schemaName);
    await conversationService.deleteConversation(id);
    
    return c.json({ message: 'Conversation deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    
    if (error.message === 'Conversation not found') {
      return c.json({ error: error.message }, 404);
    }
    
    return c.json({ error: 'Failed to delete conversation' }, 500);
  }
});

export default app;