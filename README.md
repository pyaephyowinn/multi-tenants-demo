# Multi-Tenant CRM System

A modern, schema-based multi-tenant CRM application built with TypeScript, PostgreSQL, and React Router v7. Each tenant gets complete data isolation through dedicated PostgreSQL schemas.

## 🏗️ Architecture Overview

This is a **pnpm workspace monorepo** with two main packages:

- **`packages/api/`** - Hono TypeScript backend with PostgreSQL + Knex
- **`packages/web/`** - React Router v7 frontend with SSR and Tailwind CSS

## ✨ Key Features

### 🔐 **Multi-Tenant Architecture**
- **Complete data isolation** - Each company gets its own PostgreSQL schema
- **Dynamic schema creation** - Tenant schemas created automatically on registration
- **Automatic migrations** - Tenant-specific database tables set up instantly
- **Scoped queries** - All database operations are tenant-aware

### 👥 **Contact Management**
- Create and manage contacts with rich metadata (company, position, source)
- Automatic conversation creation for each contact
- Email and phone validation with flexible requirements

### 💬 **Conversation System**
- Thread-based conversations linked to contacts
- Real-time message tracking with timestamps
- Support for different sender types (user, contact, system)
- Message history and conversation status management

### 🎨 **Modern UI/UX**
- **Responsive design** built with Tailwind CSS
- **Server-Side Rendering** with React Router v7
- **Interactive forms** with loading states and error handling
- **Tabbed interface** for tenant selection vs creation
- **Enhanced radio buttons** with clear visual selection indicators

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- pnpm package manager

### 1. Installation
```bash
# Clone the repository
git clone <repo-url>
cd multi-tenants-schema

# Install all dependencies
pnpm install
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb multi_tenant_crm

# Set up environment variables
cp packages/api/.env.example packages/api/.env
# Edit packages/api/.env with your database credentials

# Run migrations
pnpm --filter api db:migrate

# Seed with sample data
pnpm --filter api db:seed
```

### 3. Development
```bash
# Start both API and Web servers
pnpm dev

# Or start individually:
pnpm dev:api  # API server at http://localhost:3000
pnpm dev:web  # Web server at http://localhost:5173
```

## 📊 Database Schema

### Public Schema
```sql
-- Tenant registry
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  schema_name VARCHAR(63) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tenant Schemas (per tenant)
```sql
-- Contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active',
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL, -- 'user', 'contact', 'system'
  sender_id VARCHAR(255),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 Application Flow

### 1. **Landing Page (`/`)**
- **Existing Users**: Select from available tenants with visual radio buttons
- **New Users**: Create new tenant with company registration form
- **Smart Detection**: Automatically shows appropriate interface based on existing data

### 2. **Tenant Creation Flow**
```
User Input (Company Name) 
    ↓
Sanitize Schema Name 
    ↓
Create Tenant Record (public.tenants)
    ↓
Create PostgreSQL Schema 
    ↓
Run Tenant Migrations 
    ↓
Redirect to Dashboard
```

### 3. **Dashboard (`/tenant/:id`)**
- Overview of tenant statistics
- Recent contacts display
- Quick access to create new contacts
- Schema information display

### 4. **Contact Management (`/tenant/:id/contacts`)**
- List all contacts for the tenant
- Search and filter capabilities  
- Create new contacts with rich form
- Access to individual contact conversations

### 5. **Contact Creation (`/tenant/:id/contacts/new`)**
- **Required**: Full name + (email OR phone)
- **Optional**: Company, position, source
- **Auto-creates**: Initial conversation for the contact
- **Validation**: Real-time form validation with error handling

### 6. **Conversation View (`/tenant/:id/contacts/:contactId`)**
- Display contact information and metadata
- Show all messages in chronological order
- Send new messages with real-time updates
- Message threading and status management

## 🛠️ API Endpoints

### Public Endpoints
- `GET /` - API health check and endpoint listing
- `POST /tenants` - Create new tenant with schema
- `GET /tenants` - List all tenants
- `GET /tenants/:id` - Get specific tenant details

### Tenant-Scoped Endpoints (require `X-Tenant-Id` header)
- `GET /contacts` - List tenant contacts
- `POST /contacts` - Create contact (auto-creates conversation)
- `GET /contacts/:id` - Get specific contact
- `POST /messages` - Add message to conversation
- `GET /conversations/contact/:contactId` - Get contact's conversations with messages

## 🏃‍♂️ Available Scripts

### Root Level
```bash
pnpm dev          # Start both API and Web in development
pnpm build        # Build all packages for production
pnpm start        # Start production servers
pnpm typecheck    # Type check all packages
pnpm clean        # Clean all node_modules
```

### API Package
```bash
pnpm --filter api dev           # Start API dev server
pnpm --filter api build         # Build API for production
pnpm --filter api db:migrate    # Run database migrations
pnpm --filter api db:seed       # Seed database with sample data
pnpm --filter api db:rollback   # Rollback last migration
pnpm --filter api db:reset      # Reset database (rollback + migrate + seed)
```

### Web Package
```bash
pnpm --filter web dev           # Start web dev server
pnpm --filter web build         # Build web for production
pnpm --filter web typecheck     # Type check frontend code
```

## 🏛️ Tech Stack

### Backend (`packages/api/`)
- **Framework**: [Hono](https://hono.dev) - Lightweight, fast web framework
- **Database**: PostgreSQL with [Knex.js](https://knexjs.org) query builder
- **Language**: TypeScript with strict mode enabled
- **Architecture**: Multi-tenant with schema isolation

### Frontend (`packages/web/`)
- **Framework**: [React Router v7](https://reactrouter.com) with SSR
- **Styling**: [Tailwind CSS](https://tailwindcss.com) v4
- **Build Tool**: [Vite](https://vitejs.dev) with optimized dev server
- **Language**: TypeScript with route-based type generation

## 🔒 Security Features

- **SQL Injection Prevention**: Parameterized queries and schema name sanitization
- **Data Isolation**: Complete separation between tenants via PostgreSQL schemas
- **Input Validation**: Strict validation on all user inputs
- **Error Handling**: Graceful error handling with transaction rollbacks
- **CORS Configuration**: Proper CORS setup for frontend-backend communication

## 📚 Documentation

- **[Multi-Tenant Architecture Guide](docs/multi-tenant-architecture.md)** - Comprehensive technical documentation covering:
  - Database schema design and tenant lifecycle management
  - Connection management and query scoping
  - Migration strategies and performance considerations
  - Security implementation and troubleshooting guides

## 📁 Project Structure

```
multi-tenants-schema/
├── packages/
│   ├── api/                    # Backend API
│   │   ├── src/
│   │   │   ├── config/        # Database configuration
│   │   │   ├── middleware/    # Tenant context middleware
│   │   │   ├── routes/        # API route handlers
│   │   │   ├── services/      # Business logic services
│   │   │   ├── types/         # TypeScript type definitions
│   │   │   └── utils/         # Database utilities
│   │   ├── migrations/        # Database migrations
│   │   │   └── tenant/       # Tenant-specific migrations
│   │   └── seeds/            # Sample data seeds
│   └── web/                   # Frontend Web App
│       ├── app/
│       │   ├── lib/          # API client and utilities
│       │   └── routes/       # React Router pages
│       └── public/           # Static assets
├── docs/                     # Documentation
│   └── multi-tenant-architecture.md  # Detailed architecture guide
├── .spec/                    # Feature specifications
├── CLAUDE.md                 # Development guide
└── README.md                 # This file
```

## 🧪 Testing

The application includes comprehensive testing strategies:

- **Unit Tests**: Service and utility function testing
- **Integration Tests**: Database isolation and API endpoint testing  
- **End-to-End Tests**: Complete user flow validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using modern web technologies and best practices for multi-tenant applications.**