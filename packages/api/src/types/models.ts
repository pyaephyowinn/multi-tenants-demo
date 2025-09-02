export interface Tenant {
  id: string;
  name: string;
  schema_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Conversation {
  id: string;
  contact_id: string;
  status: 'active' | 'archived' | 'closed';
  last_message_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'contact' | 'system';
  sender_id?: string;
  content: string;
  created_at: Date;
}

export type TenantInput = Omit<Tenant, 'id' | 'created_at' | 'updated_at' | 'schema_name'>;
export type ContactInput = Omit<Contact, 'id' | 'created_at' | 'updated_at'>;
export type MessageInput = Omit<Message, 'id' | 'created_at'>;
export type ConversationInput = Omit<Conversation, 'id' | 'created_at' | 'updated_at'>;