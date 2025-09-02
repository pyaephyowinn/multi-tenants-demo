import type { Knex } from 'knex';
import type { Message, MessageInput } from '../types/models.js';
import { withSchema } from '../utils/database.js';

export class MessageService {
  private tenantKnex: Knex;
  private schemaName: string;
  
  constructor(tenantKnex: Knex, schemaName: string) {
    this.tenantKnex = tenantKnex;
    this.schemaName = schemaName;
  }
  
  async createMessage(input: MessageInput): Promise<Message> {
    const trx = await this.tenantKnex.transaction();
    
    try {
      const conversation = await withSchema(trx, this.schemaName)
        .table('conversations')
        .where('id', input.conversation_id)
        .first();
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      
      const [message] = await withSchema(trx, this.schemaName)
        .table('messages')
        .insert({
          conversation_id: input.conversation_id,
          sender_type: input.sender_type,
          sender_id: input.sender_id,
          content: input.content
        })
        .returning('*');
      
      await withSchema(trx, this.schemaName)
        .table('conversations')
        .where('id', input.conversation_id)
        .update({
          last_message_at: message.created_at,
          updated_at: trx.fn.now()
        });
      
      await trx.commit();
      
      return message;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
  
  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    return await withSchema(this.tenantKnex, this.schemaName)
      .table('messages')
      .where('conversation_id', conversationId)
      .orderBy('created_at', 'asc');
  }
  
  async getMessage(id: string): Promise<Message | null> {
    return await withSchema(this.tenantKnex, this.schemaName)
      .table('messages')
      .where('id', id)
      .first();
  }
  
  async deleteMessage(id: string): Promise<void> {
    const deleted = await withSchema(this.tenantKnex, this.schemaName)
      .table('messages')
      .where('id', id)
      .delete();
    
    if (!deleted) {
      throw new Error('Message not found');
    }
  }
}

export default MessageService;