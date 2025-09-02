import type { Knex } from 'knex';

function sanitizeSchemaName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50);
}

export async function seed(knex: Knex): Promise<void> {
  try {
    console.log('Starting seed process...');
    
    // Create tenant
    console.log('Creating Acme Corp tenant...');
    const tenantName = 'Acme Corp';
    const schemaName = sanitizeSchemaName(tenantName);
    
    const [tenant] = await knex('tenants')
      .insert({
        name: tenantName,
        schema_name: schemaName
      })
      .returning('*');
    
    console.log(`Created tenant: ${tenant.name} (ID: ${tenant.id})`);
    
    // Create schema
    await knex.raw(`CREATE SCHEMA IF NOT EXISTS ??`, [schemaName]);
    console.log(`Created schema: ${schemaName}`);
    
    // Run tenant migrations by creating tables directly
    await knex.raw(`SET search_path TO ??`, [schemaName]);
    
    // Create contacts table
    await knex.raw(`
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create conversations table
    await knex.raw(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
        last_message_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create messages table
    await knex.raw(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'contact', 'system')),
        sender_id VARCHAR(255),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('Created tenant schema tables');
    
    // Create first contact with conversation
    const contact1Result = await knex.raw(`
      INSERT INTO contacts (name, email, phone, metadata)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `, [
      'John Doe',
      'john.doe@example.com',
      '+1-555-0123',
      JSON.stringify({
        company: 'Example Inc',
        position: 'Product Manager',
        source: 'referral'
      })
    ]);
    
    const johnDoe = contact1Result.rows[0];
    console.log(`Created contact: ${johnDoe.name} (ID: ${johnDoe.id})`);
    
    // Create conversation for John
    const conversation1Result = await knex.raw(`
      INSERT INTO conversations (contact_id, status)
      VALUES (?, 'active')
      RETURNING *
    `, [johnDoe.id]);
    
    const johnConversation = conversation1Result.rows[0];
    console.log(`Created conversation: ${johnConversation.id}`);
    
    // Add messages to John's conversation
    await knex.raw(`INSERT INTO messages (conversation_id, sender_type, sender_id, content) VALUES (?, 'contact', ?, ?)`, 
      [johnConversation.id, johnDoe.id, 'Hi! I\'m interested in learning more about your products.']);
    
    await knex.raw(`INSERT INTO messages (conversation_id, sender_type, sender_id, content) VALUES (?, 'user', 'system', ?)`, 
      [johnConversation.id, 'Hello John! Thanks for reaching out. I\'d be happy to help you learn more about our solutions.']);
    
    await knex.raw(`INSERT INTO messages (conversation_id, sender_type, sender_id, content) VALUES (?, 'contact', ?, ?)`, 
      [johnConversation.id, johnDoe.id, 'Great! Could you tell me more about your pricing plans?']);
    
    await knex.raw(`INSERT INTO messages (conversation_id, sender_type, sender_id, content) VALUES (?, 'user', 'system', ?)`, 
      [johnConversation.id, 'Of course! We have three main pricing tiers: Starter, Professional, and Enterprise. Let me send you our detailed pricing guide.']);
    
    // Create second contact
    const contact2Result = await knex.raw(`
      INSERT INTO contacts (name, email, phone, metadata)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `, [
      'Jane Smith',
      'jane.smith@techcorp.com',
      '+1-555-0456',
      JSON.stringify({
        company: 'TechCorp',
        position: 'CTO',
        source: 'website'
      })
    ]);
    
    const janeSmith = contact2Result.rows[0];
    console.log(`Created contact: ${janeSmith.name} (ID: ${janeSmith.id})`);
    
    // Create conversation for Jane
    const conversation2Result = await knex.raw(`
      INSERT INTO conversations (contact_id, status)
      VALUES (?, 'active')
      RETURNING *
    `, [janeSmith.id]);
    
    const janeConversation = conversation2Result.rows[0];
    
    // Add messages to Jane's conversation
    await knex.raw(`INSERT INTO messages (conversation_id, sender_type, sender_id, content) VALUES (?, 'contact', ?, ?)`, 
      [janeConversation.id, janeSmith.id, 'Hello, I saw your demo at the conference. Very impressive!']);
    
    await knex.raw(`INSERT INTO messages (conversation_id, sender_type, sender_id, content) VALUES (?, 'user', 'system', ?)`, 
      [janeConversation.id, 'Hi Jane! Thank you for stopping by our booth. I\'m glad you found the demo interesting. How can we help you get started?']);
    
    // Reset search path
    await knex.raw(`SET search_path TO public`);
    
    console.log('Seed data created successfully!');
    console.log(`Tenant: ${tenant.name}`);
    console.log(`Schema: ${tenant.schema_name}`);
    console.log(`Contacts: 2`);
    console.log(`Conversations: 2`);
    console.log(`Messages: 6`);
    
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}