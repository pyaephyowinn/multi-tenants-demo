import type { Knex } from 'knex';
import type { Conversation, Message } from '../types/models.js';
import { withSchema } from '../utils/database.js';

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export class ConversationService {
  private tenantKnex: Knex;
  private schemaName: string;
  
  constructor(tenantKnex: Knex, schemaName: string) {
    this.tenantKnex = tenantKnex;
    this.schemaName = schemaName;
  }
  
  async getConversationsByContact(contactId: string): Promise<ConversationWithMessages[]> {
    const contact = await withSchema(this.tenantKnex, this.schemaName)
      .table('contacts')
      .where('id', contactId)
      .first();
    
    if (!contact) {
      throw new Error('Contact not found');
    }
    
    const conversations = await withSchema(this.tenantKnex, this.schemaName)
      .table('conversations')
      .where('contact_id', contactId)
      .orderBy('created_at', 'desc');
    
    const conversationsWithMessages: ConversationWithMessages[] = [];
    
    for (const conversation of conversations) {
      const messages = await withSchema(this.tenantKnex, this.schemaName)
        .table('messages')
        .where('conversation_id', conversation.id)
        .orderBy('created_at', 'asc');
      
      conversationsWithMessages.push({
        ...conversation,
        messages
      });
    }
    
    return conversationsWithMessages;
  }
  
  async getConversation(id: string): Promise<ConversationWithMessages | null> {
    const conversation = await withSchema(this.tenantKnex, this.schemaName)
      .table('conversations')
      .where('id', id)
      .first();
    
    if (!conversation) {
      return null;
    }
    
    const messages = await withSchema(this.tenantKnex, this.schemaName)
      .table('messages')
      .where('conversation_id', id)
      .orderBy('created_at', 'asc');
    
    return {
      ...conversation,
      messages
    };
  }
  
  async updateConversationStatus(id: string, status: 'active' | 'archived' | 'closed'): Promise<Conversation> {
    const [conversation] = await withSchema(this.tenantKnex, this.schemaName)
      .table('conversations')
      .where('id', id)
      .update({
        status,
        updated_at: this.tenantKnex.fn.now()
      })
      .returning('*');
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    return conversation;
  }
  
  async deleteConversation(id: string): Promise<void> {
    const deleted = await withSchema(this.tenantKnex, this.schemaName)
      .table('conversations')
      .where('id', id)
      .delete();
    
    if (!deleted) {
      throw new Error('Conversation not found');
    }
  }
}

export default ConversationService;