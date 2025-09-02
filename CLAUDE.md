# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Quick Start
```bash
# Install all dependencies
pnpm install

# Start both API and Web in development
pnpm dev

# Start individual services
pnpm dev:api  # API at http://localhost:3000
pnpm dev:web  # Web at http://localhost:5173
```

### Build and Production
```bash
# Build all packages
pnpm build

# Build specific package
pnpm build:api
pnpm build:web

# Run production servers
pnpm start
```

### Type Checking and Maintenance
```bash
# Type check all packages
pnpm typecheck

# Clean all node_modules and lockfile
pnpm clean

# Then reinstall
pnpm install
```

### Package-Specific Operations
```bash
# Add dependency to specific package
pnpm --filter api add <package>
pnpm --filter web add <package>

# Add dev dependency
pnpm --filter api add -D <package>

# Run any command in specific package
pnpm --filter api <command>
pnpm --filter web <command>
```

## Architecture Overview

This is a PNPM workspace monorepo with two main packages:

### API Package (`packages/api/`)
- **Framework**: Hono - lightweight web framework
- **Entry**: `src/index.ts` - runs on port 3000
- **Development**: Uses `tsx watch` for hot reload
- **Build**: TypeScript compiler outputs to `dist/`

### Web Package (`packages/web/`)
- **Framework**: React Router v7 with SSR enabled
- **Build Tool**: Vite with TailwindCSS
- **Entry**: `app/root.tsx` and route files in `app/routes/`
- **Development**: Vite dev server on port 5173
- **Production**: Server-side rendering with React Router

### Key Architectural Decisions

1. **Monorepo Structure**: All packages share a single `pnpm-lock.yaml` at the root, ensuring consistent dependencies across the entire project.

2. **TypeScript Configuration**: 
   - API uses `NodeNext` module resolution for modern Node.js
   - Web uses React Router's TypeScript configuration with route type generation

3. **Workspace Commands**: Root `package.json` orchestrates commands across packages using `pnpm -r` (recursive) and `--parallel` flags for concurrent execution.

4. **Development Workflow**: Both packages can run simultaneously with `pnpm dev`, allowing full-stack development with hot reload on both frontend and backend.

## Important Files

- `pnpm-workspace.yaml` - Defines workspace packages location
- `packages/web/react-router.config.ts` - SSR configuration and build settings
- `packages/web/vite.config.ts` - Vite plugins including TailwindCSS and React Router
- `packages/api/tsconfig.json` - Node.js TypeScript configuration with strict mode

## Documentation

Comprehensive PNPM workspace guide available at `docs/monorepo-setup-guide.md` with detailed command references and troubleshooting.