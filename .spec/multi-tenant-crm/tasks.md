# Implementation Plan

## Phase 1: Database Setup and Configuration

- [ ] 1. Install PostgreSQL and Knex dependencies in API package
  - Add knex, pg, and dotenv to packages/api
  - Add @types/pg as dev dependency
  - _Requirements: 6.1_

- [ ] 2. Create Knex configuration file with multi-environment support
  - Create knexfile.ts in packages/api root
  - Configure development, test, and production environments
  - Set up connection pooling and migration directories
  - _Requirements: 6.1, 6.2_

- [ ] 3. Create database configuration module
  - Implement packages/api/src/config/database.ts
  - Create connection factory with environment variable support
  - Export configured Knex instance for public schema
  - _Requirements: 6.1_

## Phase 2: Database Migrations and Models

- [ ] 4. Create public schema migration for tenants table
  - Generate migration file for public.tenants table
  - Define columns: id (UUID), name, schema_name, created_at, updated_at
  - Add unique constraint on schema_name
  - _Requirements: 1.4, 2.1_

- [ ] 5. Create tenant schema migrations
  - [ ] 5.1 Create contacts table migration
    - Define columns: id, name, email, phone, metadata (JSON), timestamps
    - Add indexes on email and phone
    - _Requirements: 3.1_
  
  - [ ] 5.2 Create conversations table migration
    - Define columns: id, contact_id (FK), status, last_message_at, timestamps
    - Add foreign key constraint to contacts
    - _Requirements: 3.2_
  
  - [ ] 5.3 Create messages table migration
    - Define columns: id, conversation_id (FK), sender_type, sender_id, content, created_at
    - Add foreign key constraint to conversations
    - Add index on conversation_id and created_at
    - _Requirements: 4.1_

- [ ] 6. Create TypeScript interfaces for all models
  - Implement packages/api/src/types/models.ts
  - Define Tenant, Contact, Conversation, and Message interfaces
  - Export all type definitions
  - _Requirements: 2.1, 3.1, 4.1, 5.1_

## Phase 3: Core Database Utilities

- [ ] 7. Implement getTenantKnex utility function
  - Create packages/api/src/utils/database.ts
  - Implement function to create schema-scoped Knex instance
  - Add schema name sanitization to prevent SQL injection
  - Include connection pooling per tenant
  - _Requirements: 6.4, 1.2_

- [ ] 8. Create migration service for dynamic schema management
  - [ ] 8.1 Implement schema creation logic
    - Create packages/api/src/services/migration.service.ts
    - Implement createTenantSchema function with transaction support
    - Add error handling for duplicate schemas
    - _Requirements: 1.1, 2.2_
  
  - [ ] 8.2 Implement tenant migration runner
    - Create runTenantMigrations function
    - Configure Knex migrator to run in specific schema
    - Add rollback capability for failed migrations
    - _Requirements: 2.3, 2.4_

## Phase 4: API Routes Implementation

- [ ] 9. Set up CORS and JSON middleware in Hono app
  - Update packages/api/src/index.ts
  - Add cors middleware for frontend communication
  - Add JSON body parser middleware
  - _Requirements: 8.3_

- [ ] 10. Implement tenant context middleware
  - Create packages/api/src/middleware/tenant.ts
  - Extract tenant ID from X-Tenant-Id header
  - Validate tenant exists and attach context to request
  - Return 401 for invalid tenant context
  - _Requirements: 1.2, 3.3, 5.3_

- [ ] 11. Implement POST /tenants endpoint
  - [ ] 11.1 Create tenant service
    - Implement packages/api/src/services/tenant.service.ts
    - Add createTenant function with transaction support
    - Generate sanitized schema_name from company name
    - _Requirements: 2.1, 2.2_
  
  - [ ] 11.2 Create tenant route handler
    - Implement packages/api/src/routes/tenants.ts
    - Add validation for required fields
    - Call service to create tenant and schema
    - Return tenant details on success
    - _Requirements: 2.1, 2.5_

- [ ] 12. Implement POST /contacts endpoint
  - [ ] 12.1 Create contact service
    - Implement packages/api/src/services/contact.service.ts
    - Add createContact function with conversation auto-creation
    - Use getTenantKnex for schema-scoped queries
    - _Requirements: 3.1, 3.2_
  
  - [ ] 12.2 Create contact route handler
    - Implement packages/api/src/routes/contacts.ts
    - Apply tenant middleware for authentication
    - Validate required fields (name, email/phone)
    - Return contact and conversation objects
    - _Requirements: 3.1, 3.4_

- [ ] 13. Implement POST /messages endpoint
  - [ ] 13.1 Create message service
    - Implement packages/api/src/services/message.service.ts
    - Add createMessage function
    - Update conversation.last_message_at timestamp
    - _Requirements: 4.1, 4.2_
  
  - [ ] 13.2 Create message route handler
    - Implement packages/api/src/routes/messages.ts
    - Validate conversation exists in tenant schema
    - Return created message with timestamp
    - _Requirements: 4.1, 4.3, 4.4_

- [ ] 14. Implement GET /conversations/:contactId endpoint
  - [ ] 14.1 Create conversation service
    - Implement packages/api/src/services/conversation.service.ts
    - Add getConversationsByContact function
    - Include eager loading of messages
    - _Requirements: 5.1, 5.2_
  
  - [ ] 14.2 Create conversation route handler
    - Implement packages/api/src/routes/conversations.ts
    - Return 404 if contact doesn't exist
    - Return conversations with nested messages
    - _Requirements: 5.1, 5.3, 5.4_

- [ ] 15. Wire all routes to main Hono app
  - Update packages/api/src/index.ts
  - Import and register all route handlers
  - Apply tenant middleware to protected routes
  - _Requirements: All API requirements_

## Phase 5: Database Seeding

- [ ] 16. Create seed data script
  - Create packages/api/seeds/initial.ts
  - Insert sample tenant "Acme Corp" with schema
  - Add sample contact "John Doe"
  - Create conversation with sample messages
  - _Requirements: 6.3_

## Phase 6: Frontend Implementation

- [ ] 17. Create API client module
  - Implement packages/web/app/lib/api.ts
  - Add functions for all API endpoints
  - Include error handling and response typing
  - Handle CORS and headers configuration
  - _Requirements: 8.1, 8.2, 8.4_

- [ ] 18. Create tenant signup page
  - [ ] 18.1 Implement signup form component
    - Create packages/web/app/routes/_index.tsx
    - Add form with company name input
    - Style with Tailwind CSS classes
    - _Requirements: 7.1, 7.6_
  
  - [ ] 18.2 Implement form action
    - Add action function to handle POST
    - Call API client createTenant function
    - Redirect to tenant dashboard on success
    - Display errors on failure
    - _Requirements: 7.2, 7.5, 8.2_

- [ ] 19. Create tenant dashboard layout
  - Implement packages/web/app/routes/tenant.$id.tsx
  - Create layout with navigation menu
  - Add outlet for child routes
  - Pass tenant context to child components
  - _Requirements: 7.1_

- [ ] 20. Create contact creation form
  - [ ] 20.1 Implement contact form component
    - Create packages/web/app/routes/tenant.$id.contacts.new.tsx
    - Add form fields: name, email, phone
    - Apply Tailwind styling
    - _Requirements: 7.3, 7.6_
  
  - [ ] 20.2 Implement contact form action
    - Add action to handle form submission
    - Call API client createContact function
    - Redirect to conversation view on success
    - _Requirements: 7.3, 8.2_

- [ ] 21. Create conversation view with messages
  - [ ] 21.1 Implement conversation loader
    - Create packages/web/app/routes/tenant.$id.contacts.$contactId.tsx
    - Add loader to fetch conversations
    - Call API client getConversations function
    - _Requirements: 5.1, 7.4, 8.1_
  
  - [ ] 21.2 Implement conversation display component
    - Display messages in chronological order
    - Style message bubbles with Tailwind
    - Show sender type and timestamp
    - _Requirements: 7.4, 7.6_
  
  - [ ] 21.3 Implement message form
    - Add form to send new messages
    - Create action to handle message submission
    - Update conversation display on success
    - _Requirements: 4.1, 7.4, 8.2_

- [ ] 22. Create contact list page
  - Implement packages/web/app/routes/tenant.$id.contacts.tsx
  - Add loader to fetch all contacts for tenant
  - Display contacts in a styled list/grid
  - Add link to create new contact
  - _Requirements: 7.3_

## Phase 7: Integration Testing

- [ ] 23. Write integration tests for tenant lifecycle
  - Create packages/api/tests/tenant.test.ts
  - Test tenant creation with schema
  - Test duplicate tenant rejection
  - Test schema cleanup in teardown
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 24. Write integration tests for data isolation
  - Create packages/api/tests/isolation.test.ts
  - Test data visibility across different tenants
  - Verify queries are properly scoped
  - Test unauthorized access attempts
  - _Requirements: 1.2, 1.3_

- [ ] 25. Write E2E tests for critical user flows
  - Test complete tenant onboarding flow
  - Test contact creation and conversation flow
  - Test message sending and retrieval
  - Verify frontend-backend integration
  - _Requirements: All user-facing requirements_