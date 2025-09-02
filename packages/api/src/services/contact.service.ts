import type { Knex } from 'knex';
import type { Contact, ContactInput, Conversation } from '../types/models.js';
import { withSchema } from '../utils/database.js';

export class ContactService {
  private tenantKnex: Knex;
  private schemaName: string;
  
  constructor(tenantKnex: Knex, schemaName: string) {
    this.tenantKnex = tenantKnex;
    this.schemaName = schemaName;
  }
  
  async createContact(input: ContactInput): Promise<{ contact: Contact; conversation: Conversation }> {
    const trx = await this.tenantKnex.transaction();
    
    try {
      const [contact] = await withSchema(trx, this.schemaName)
        .table('contacts')
        .insert({
          name: input.name,
          email: input.email,
          phone: input.phone,
          metadata: input.metadata || {}
        })
        .returning('*');
      
      const [conversation] = await withSchema(trx, this.schemaName)
        .table('conversations')
        .insert({
          contact_id: contact.id,
          status: 'active'
        })
        .returning('*');
      
      await trx.commit();
      
      return { contact, conversation };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
  
  async getContact(id: string): Promise<Contact | null> {
    return await withSchema(this.tenantKnex, this.schemaName)
      .table('contacts')
      .where('id', id)
      .first();
  }
  
  async getAllContacts(): Promise<Contact[]> {
    return await withSchema(this.tenantKnex, this.schemaName)
      .table('contacts')
      .orderBy('created_at', 'desc');
  }
  
  async updateContact(id: string, input: Partial<ContactInput>): Promise<Contact> {
    const [contact] = await withSchema(this.tenantKnex, this.schemaName)
      .table('contacts')
      .where('id', id)
      .update({
        ...input,
        updated_at: this.tenantKnex.fn.now()
      })
      .returning('*');
    
    if (!contact) {
      throw new Error('Contact not found');
    }
    
    return contact;
  }
  
  async deleteContact(id: string): Promise<void> {
    const deleted = await withSchema(this.tenantKnex, this.schemaName)
      .table('contacts')
      .where('id', id)
      .delete();
    
    if (!deleted) {
      throw new Error('Contact not found');
    }
  }
}

export default ContactService;