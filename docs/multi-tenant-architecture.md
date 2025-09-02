# Multi-Tenant Architecture Documentation

This document provides an in-depth explanation of the multi-tenant architecture implemented in this CRM system, covering the setup process, schema management, data isolation strategies, and operational workflows.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema Design](#database-schema-design)
3. [Tenant Lifecycle Management](#tenant-lifecycle-management)
4. [Data Isolation Implementation](#data-isolation-implementation)
5. [Migration Strategy](#migration-strategy)
6. [Performance Considerations](#performance-considerations)
7. [Security Model](#security-model)
8. [Troubleshooting Guide](#troubleshooting-guide)

## Architecture Overview

### Multi-Tenancy Strategy: Schema-Based Isolation

Our multi-tenant architecture uses **PostgreSQL schema-based isolation**, which provides:

- **Complete data separation** between tenants
- **Performance optimization** through isolated table spaces
- **Flexibility** in tenant-specific customizations
- **Security** through database-level access control

### Alternative Approaches Considered

| Approach | Pros | Cons | Our Choice |
|----------|------|------|------------|
| **Single Database + Tenant ID** | Simple, cost-effective | Data mixing risk, complex queries | ❌ |
| **Database Per Tenant** | Maximum isolation | Resource intensive, maintenance overhead | ❌ |
| **Schema Per Tenant** | Good isolation, manageable | Moderate complexity | ✅ **Selected** |

## Database Schema Design

### Public Schema Structure

The **public schema** contains global, cross-tenant data:

See the tenant registry implementation in [`packages/api/migrations/20240101000001_create_tenants_table.ts`](../packages/api/migrations/20240101000001_create_tenants_table.ts).

### Tenant Schema Structure

Each tenant gets a **dedicated schema** with identical table structures:

Each tenant schema gets identical table structures defined in the following migration files:

- **Contacts**: [`packages/api/migrations/tenant/20240101000002_create_contacts_table.ts`](../packages/api/migrations/tenant/20240101000002_create_contacts_table.ts)
- **Conversations**: [`packages/api/migrations/tenant/20240101000003_create_conversations_table.ts`](../packages/api/migrations/tenant/20240101000003_create_conversations_table.ts)
- **Messages**: [`packages/api/migrations/tenant/20240101000004_create_messages_table.ts`](../packages/api/migrations/tenant/20240101000004_create_messages_table.ts)

Schema naming: `tenant_<sanitized_name>` (e.g., `tenant_acme_corp`, `tenant_tech_startup`)

## Tenant Lifecycle Management

### 1. Tenant Creation Process

When a new tenant is created, the system follows this atomic process:

See the complete tenant creation implementation in [`packages/api/src/services/tenant.service.ts`](../packages/api/src/services/tenant.service.ts).

### 2. Schema Name Sanitization

To ensure PostgreSQL compatibility, tenant names are sanitized:

Schema name sanitization logic is implemented in [`packages/api/src/utils/database.ts`](../packages/api/src/utils/database.ts).

### 3. Migration Execution Process

Each tenant schema gets the same table structure through dedicated migrations:

Migration execution logic is handled by the [`packages/api/src/services/migration.service.ts`](../packages/api/src/services/migration.service.ts).

### 4. Tenant Deletion Process

When a tenant needs to be removed:

Tenant deletion logic can be found in [`packages/api/src/services/tenant.service.ts`](../packages/api/src/services/tenant.service.ts).

## Data Isolation Implementation

### 1. Connection Management

Each tenant request gets a scoped database connection:

Connection management and `getTenantKnex()` implementation is in [`packages/api/src/utils/database.ts`](../packages/api/src/utils/database.ts).

### 2. Middleware Implementation

All tenant-scoped endpoints require proper context:

Tenant middleware implementation is in [`packages/api/src/middleware/tenant.ts`](../packages/api/src/middleware/tenant.ts).

### 3. Query Scoping

All database operations are automatically scoped to the tenant:

Service layer implementation with tenant-scoped queries:

- **Contact Service**: [`packages/api/src/services/contact.service.ts`](../packages/api/src/services/contact.service.ts)
- **Conversation Service**: [`packages/api/src/services/conversation.service.ts`](../packages/api/src/services/conversation.service.ts)  
- **Message Service**: [`packages/api/src/services/message.service.ts`](../packages/api/src/services/message.service.ts)

## Migration Strategy

### 1. Public Schema Migrations

Located in `migrations/` - affect the shared public schema:

Public schema migration: [`packages/api/migrations/20240101000001_create_tenants_table.ts`](../packages/api/migrations/20240101000001_create_tenants_table.ts)

### 2. Tenant Schema Migrations

Located in `migrations/tenant/` - applied to each tenant schema:

Tenant schema migrations are located in `packages/api/migrations/tenant/`:

- [`20240101000002_create_contacts_table.ts`](../packages/api/migrations/tenant/20240101000002_create_contacts_table.ts)
- [`20240101000003_create_conversations_table.ts`](../packages/api/migrations/tenant/20240101000003_create_conversations_table.ts)
- [`20240101000004_create_messages_table.ts`](../packages/api/migrations/tenant/20240101000004_create_messages_table.ts)

### 3. Migration Execution Order

```bash
# 1. Run public schema migrations (once)
pnpm --filter api db:migrate

# 2. Tenant schema migrations are run automatically when:
#    - New tenant is created (via API)
#    - Existing tenant schemas need updates (manual process)

# 3. Seed data (creates sample tenant with data)
pnpm --filter api db:seed
```

## Performance Considerations

### 1. Connection Pooling Strategy

Connection pooling configuration is defined in [`packages/api/src/config/database.ts`](../packages/api/src/config/database.ts) and managed in [`packages/api/src/utils/database.ts`](../packages/api/src/utils/database.ts).

### 2. Index Strategy

Each tenant schema includes optimized indexes:

```sql
-- Frequently queried columns
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_phone ON contacts(phone); 
CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX idx_conversations_contact_status ON conversations(contact_id, status);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

-- JSONB indexes for metadata queries
CREATE INDEX idx_contacts_metadata ON contacts USING GIN(metadata);

-- Full-text search on message content
CREATE INDEX idx_messages_content ON messages USING GIN(to_tsvector('english', content));
```

### 3. Query Optimization

Query optimization examples are implemented in the service classes:
- [`packages/api/src/services/contact.service.ts`](../packages/api/src/services/contact.service.ts)
- [`packages/api/src/services/conversation.service.ts`](../packages/api/src/services/conversation.service.ts)

## Security Model

### 1. Schema-Level Access Control

```sql
-- Create role per tenant (optional advanced security)
CREATE ROLE tenant_acme_corp;
GRANT USAGE ON SCHEMA tenant_acme_corp TO tenant_acme_corp;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA tenant_acme_corp TO tenant_acme_corp;

-- Revoke access to other schemas
REVOKE ALL ON SCHEMA tenant_other_company FROM tenant_acme_corp;
```

### 2. Application-Level Security

Security implementations:
- **Schema sanitization**: [`packages/api/src/utils/database.ts`](../packages/api/src/utils/database.ts)
- **Tenant validation**: [`packages/api/src/middleware/tenant.ts`](../packages/api/src/middleware/tenant.ts)

### 3. Data Encryption

Data encryption can be implemented as needed using Node.js crypto module.

## Troubleshooting Guide

### Common Issues

#### 1. Schema Creation Failures

**Problem**: `ERROR: schema "tenant_name" already exists`

**Solution**:
```sql
-- Check existing schemas
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%';

-- Clean up orphaned schema
DROP SCHEMA IF EXISTS tenant_problematic_name CASCADE;

-- Re-run tenant creation
```

#### 2. Connection Pool Exhaustion

**Problem**: `Error: Knex: Timeout acquiring a connection`

**Solution**:
Connection cleanup utilities can be implemented in [`packages/api/src/utils/database.ts`](../packages/api/src/utils/database.ts).

#### 3. Migration Conflicts

**Problem**: Migration fails on existing tenant schemas

**Solution**:
```bash
# Check migration status per tenant
pnpm --filter api db:migrate:status

# Rollback problematic migration
pnpm --filter api db:rollback

# Fix migration file and re-run
pnpm --filter api db:migrate
```

#### 4. Query Performance Issues

**Problem**: Slow queries on large tenant datasets

**Solution**:
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM contacts WHERE email LIKE '%@company.com';

-- Add missing indexes
CREATE INDEX idx_contacts_email_pattern ON contacts(email text_pattern_ops);

-- Implement query optimization
```

### Monitoring Queries

```sql
-- Monitor active connections per schema
SELECT 
    schemaname,
    COUNT(*) as active_connections,
    AVG(query_duration) as avg_query_time
FROM pg_stat_activity 
WHERE state = 'active' 
GROUP BY schemaname;

-- Check schema sizes
SELECT 
    schema_name,
    pg_size_pretty(sum(pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(tablename)))::bigint) as size
FROM information_schema.tables 
WHERE schema_name LIKE 'tenant_%'
GROUP BY schema_name
ORDER BY sum(pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(tablename))) DESC;
```

## Best Practices

### 1. Schema Management

- Always use transactions when creating/modifying tenant schemas
- Implement proper cleanup on failure scenarios
- Monitor schema count and sizes regularly
- Use consistent naming conventions

### 2. Performance Optimization

- Implement connection pooling limits per tenant
- Use appropriate indexes for common query patterns  
- Monitor and clean up idle connections
- Implement query caching where appropriate

### 3. Security

- Never trust user input for schema names
- Implement proper tenant-user access validation
- Use parameterized queries to prevent SQL injection
- Monitor for suspicious cross-tenant access attempts

### 4. Maintenance

- Regular backup of public schema (tenant registry)
- Per-tenant backup strategies for large tenants
- Monitor disk space usage per schema
- Implement automated cleanup for deleted tenants

---

This architecture provides a robust, scalable multi-tenant solution that balances isolation, performance, and maintainability while ensuring complete data security between tenants.