# PNPM Workspace Monorepo Setup Guide

## Overview

This document describes the setup and usage of a PNPM workspace monorepo for the multi-tenants-demo project.

## Project Structure

```
multi-tenants-demo/
├── package.json           # Root workspace configuration
├── pnpm-workspace.yaml    # PNPM workspace definition
├── pnpm-lock.yaml        # Single lockfile for entire monorepo
├── docs/                 # Documentation
└── packages/             # Workspace packages
    ├── api/             # Backend API package (Hono)
    │   └── package.json
    └── web/             # Frontend web package (React Router)
        └── package.json
```

## Initial Setup Steps

### 1. Create Workspace Configuration

Create `pnpm-workspace.yaml` in the root:

```yaml
packages:
  - "packages/*"
```

### 2. Configure Root package.json

The root `package.json` manages workspace-wide scripts:

```json
{
  "name": "multi-tenants-demo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel -r dev",
    "build": "pnpm -r build",
    "start": "pnpm --parallel -r start",
    "typecheck": "pnpm -r typecheck",
    "clean": "pnpm -r exec rm -rf node_modules && rm -rf node_modules pnpm-lock.yaml",
    "install:all": "pnpm install",
    "dev:api": "pnpm --filter api dev",
    "dev:web": "pnpm --filter web dev",
    "build:api": "pnpm --filter api build",
    "build:web": "pnpm --filter web build"
  },
  "packageManager": "pnpm@10.13.1"
}
```

### 3. Install Dependencies

```bash
pnpm install
```

This command:

- Installs all dependencies for all packages
- Creates symlinks between workspace packages
- Generates a single `pnpm-lock.yaml` at the root

## Essential PNPM Commands

### Workspace-Wide Operations

#### Running Scripts

```bash
# Run script in all packages sequentially
pnpm -r <script>

# Run script in all packages in parallel
pnpm --parallel -r <script>

# Examples
pnpm -r build              # Build all packages
pnpm --parallel -r dev     # Start all dev servers
```

#### Managing Dependencies

```bash
# Add dependency to root workspace
pnpm add -w <package>

# Add dependency to specific package
pnpm --filter <package-name> add <dependency>

# Add dev dependency to specific package
pnpm --filter <package-name> add -D <dependency>

# Update dependencies in all packages
pnpm -r update

# Update specific dependency across workspace
pnpm -r update <package>
```

### Package-Specific Operations

#### Filter Flag Usage

```bash
# Target single package
pnpm --filter api dev
pnpm --filter web build

# Target package and its dependencies
pnpm --filter "api..." build

# Target package and its dependents
pnpm --filter "...api" build

# Pattern matching
pnpm --filter "./packages/*" test
```

### Dependency Analysis

#### Understanding Dependencies

```bash
# Show why a package is installed
pnpm why <package>
# Example: pnpm why typescript

# List all workspace packages
pnpm list -r --depth 0

# Show dependency tree
pnpm list -r

# Check outdated packages
pnpm outdated -r

# Security audit
pnpm audit
```

### Workspace Maintenance

#### Cleaning

```bash
# Clean all node_modules
pnpm -r exec rm -rf node_modules
rm -rf node_modules pnpm-lock.yaml

# Reinstall everything
pnpm install
```

#### Executing Commands

```bash
# Run command in all packages
pnpm -r exec <command>

# Examples
pnpm -r exec rm -rf dist    # Clean build folders
pnpm -r exec tsc --noEmit   # Type check all packages
```

## Common Workflows

### Adding a New Package

1. Create directory under `packages/`
2. Add `package.json` with name and scripts
3. Run `pnpm install` to link it

### Sharing Dependencies

1. Add shared deps to root `package.json` with `-w` flag
2. Or add to specific packages that need them
3. PNPM will deduplicate automatically

### Cross-Package Dependencies

```json
// In packages/web/package.json
{
  "dependencies": {
    "api": "workspace:*"
  }
}
```

### Running Multiple Dev Servers

```bash
# From root, starts both api and web dev servers
pnpm dev

# Or individually
pnpm dev:api  # Only api
pnpm dev:web  # Only web
```

## Benefits of This Setup

1. **Single Lock File**: One `pnpm-lock.yaml` ensures consistent dependencies
2. **Shared Dependencies**: Packages share common dependencies (deduplicated)
3. **Atomic Installs**: All packages installed/updated together
4. **Workspace Protocol**: Easy cross-package references
5. **Parallel Execution**: Run commands across packages simultaneously
6. **Filtering**: Target specific packages or groups
7. **Disk Space**: PNPM's content-addressable storage saves space

## Troubleshooting

### Package Not Found

- Ensure package name in `package.json` matches filter name
- Run `pnpm install` after adding new packages

### Scripts Not Running

- Check if script exists in target package's `package.json`
- Use `--parallel` for long-running processes (dev servers)

### Dependency Issues

- Use `pnpm why <package>` to understand dependency tree
- Clear cache with `pnpm store prune` if needed

### Build Order

- Use filter with ellipsis for dependency order:
  - `"package..."` builds package and dependencies
  - `"...package"` builds package and dependents

## Quick Reference

| Command                            | Description                        |
| ---------------------------------- | ---------------------------------- |
| `pnpm install`                     | Install all workspace dependencies |
| `pnpm -r dev`                      | Run dev in all packages            |
| `pnpm --filter api add express`    | Add express to api package         |
| `pnpm why typescript`              | Show why typescript is installed   |
| `pnpm list -r --depth 0`           | List all workspace packages        |
| `pnpm outdated -r`                 | Check for outdated packages        |
| `pnpm -r exec rm -rf node_modules` | Clean all node_modules             |
| `pnpm --parallel -r start`         | Start all packages in parallel     |

## Additional Resources

- [PNPM Workspace Documentation](https://pnpm.io/workspaces)
- [PNPM CLI Reference](https://pnpm.io/cli/add)
- [PNPM Filter Documentation](https://pnpm.io/filtering)
