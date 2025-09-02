const API_BASE_URL = 'http://localhost:3000';

export interface Tenant {
  id: string;
  name: string;
  schema_name: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  contact_id: string;
  status: 'active' | 'archived' | 'closed';
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'contact' | 'system';
  sender_id?: string;
  content: string;
  created_at: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export type TenantInput = {
  name: string;
};

export type ContactInput = {
  name: string;
  email?: string;
  phone?: string;
  metadata?: Record<string, any>;
};

export type MessageInput = {
  conversation_id: string;
  sender_type: 'user' | 'contact' | 'system';
  sender_id?: string;
  content: string;
};

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new ApiError(response.status, error.error || 'Unknown error');
  }

  return response.json();
}

export const apiClient = {
  // Tenant operations
  async createTenant(data: TenantInput): Promise<Tenant> {
    return fetchApi<Tenant>('/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getTenants(): Promise<Tenant[]> {
    return fetchApi<Tenant[]>('/tenants');
  },

  async getTenant(id: string): Promise<Tenant> {
    return fetchApi<Tenant>(`/tenants/${id}`);
  },

  // Contact operations (requires tenant context)
  async createContact(tenantId: string, data: ContactInput): Promise<{ contact: Contact; conversation: Conversation }> {
    return fetchApi<{ contact: Contact; conversation: Conversation }>('/contacts', {
      method: 'POST',
      headers: {
        'X-Tenant-Id': tenantId,
      },
      body: JSON.stringify(data),
    });
  },

  async getContacts(tenantId: string): Promise<Contact[]> {
    return fetchApi<Contact[]>('/contacts', {
      headers: {
        'X-Tenant-Id': tenantId,
      },
    });
  },

  async getContact(tenantId: string, id: string): Promise<Contact> {
    return fetchApi<Contact>(`/contacts/${id}`, {
      headers: {
        'X-Tenant-Id': tenantId,
      },
    });
  },

  // Message operations (requires tenant context)
  async createMessage(tenantId: string, data: MessageInput): Promise<Message> {
    return fetchApi<Message>('/messages', {
      method: 'POST',
      headers: {
        'X-Tenant-Id': tenantId,
      },
      body: JSON.stringify(data),
    });
  },

  // Conversation operations (requires tenant context)
  async getConversations(tenantId: string, contactId: string): Promise<ConversationWithMessages[]> {
    return fetchApi<ConversationWithMessages[]>(`/conversations/contact/${contactId}`, {
      headers: {
        'X-Tenant-Id': tenantId,
      },
    });
  },

  async getConversation(tenantId: string, id: string): Promise<ConversationWithMessages> {
    return fetchApi<ConversationWithMessages>(`/conversations/${id}`, {
      headers: {
        'X-Tenant-Id': tenantId,
      },
    });
  },
};

export { ApiError };