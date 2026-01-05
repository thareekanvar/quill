---
description: "Quill PostgreSQL Admin Tool - Development standards, architecture patterns, and coding conventions for the Next.js 16 database administration application"
alwaysApply: true
---

# Quill - PostgreSQL Database Administration Tool

## Project Overview

Quill is a modern, web-based PostgreSQL database administration tool built with Next.js 16 (App Router), React 19, and TypeScript. It provides secure database management, table browsing, SQL console, custom dashboards, and schema management.

## Technology Stack

### Core Framework
- **Next.js**: 16.1.1+ (App Router only)
- **React**: 19.2.3+
- **TypeScript**: 5+ (strict mode enabled)
- **Package Manager**: pnpm (required)

### UI & Styling
- **Tailwind CSS**: 4+ (with PostCSS)
- **shadcn/ui**: Component library (components in `components/ui/`)
- **Radix UI**: Base UI primitives
- **Phosphor Icons**: `@phosphor-icons/react` for icons

### State Management
- **Zustand**: Global state (stores in `lib/stores/`)
- **TanStack Query**: Server state and data fetching (`@tanstack/react-query`)
- **React Hook Form**: Form management with Zod validation

### Database & Utilities
- **PostgreSQL**: `pg` package for database operations
- **CryptoJS**: AES encryption for credential storage
- **IndexedDB**: Local storage via `idb` package
- **Recharts**: Data visualization
- **dnd-kit**: Drag and drop functionality
- **CodeMirror**: SQL editor with syntax highlighting

## Project Structure

```
postadmin/
├── app/                    # Next.js App Router (routes & API)
│   ├── (auth)/            # Auth route group
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard-specific components
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and helpers
│   ├── db/              # IndexedDB & encryption
│   ├── helpers/         # Helper functions
│   ├── postgres/        # PostgreSQL client
│   ├── stores/          # Zustand stores
│   ├── translations/    # i18n (en, fr, de)
│   └── utils/           # Utility functions
└── types/               # TypeScript definitions
```

## Code Style & Conventions

### TypeScript
- **Strict mode**: Always enabled (`strict: true` in tsconfig.json)
- **Path aliases**: Use `@/*` for imports (e.g., `@/components/ui/button`)
- **Type definitions**: All types in `types/` directory, exported from `types/index.ts`
- **Type imports**: Use `import type` for type-only imports
- **Error handling**: Use `error instanceof Error` pattern for type-safe error handling

### React Components
- **Client components**: Use `"use client"` directive at the top for interactive components
- **Server components**: Default to server components when possible (no client-side interactivity)
- **Functional components**: Always use functional components (no class components)
- **Hooks**: Custom hooks in `hooks/` directory, prefixed with `use-`
- **Component organization**: Group related components in subdirectories (e.g., `components/dashboard/sidebar/`)

### API Routes
- **Route handlers**: Use named exports (`export async function GET/POST/PUT/DELETE`)
- **Error handling**: Always wrap in try-catch, return proper HTTP status codes
- **Request validation**: Validate `connectionString` and required parameters
- **Response format**: Use `NextResponse.json()` with consistent error structure
- **Route context**: Use `RouteContext` type for dynamic route parameters
- **Transaction handling**: Support transaction management for mutation operations

Example API route pattern:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import type { RouteContext } from '@/types';

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { paramName } = await context.params;
    const body = await request.json();
    const { connectionString, ...otherParams } = body;

    if (!connectionString) {
      return NextResponse.json(
        { error: 'Connection string is required' },
        { status: 400 }
      );
    }

    // Implementation...

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Operation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Operation failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
```

### State Management

#### Zustand Stores
- **Location**: All stores in `lib/stores/`
- **Persistence**: Use `persist` middleware for stores that need localStorage/sessionStorage
- **Naming**: Store files end with `-store.ts`, hooks start with `use` (e.g., `useAuthStore`)
- **Hydration**: Handle `_hasHydrated` flag for SSR compatibility

Example store pattern:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StateType } from '@/types';

export const useStore = create<StateType>()(
  persist(
    (set, get) => ({
      // State and actions
    }),
    { name: 'store-name' }
  )
);
```

#### TanStack Query
- **Hooks**: Custom query hooks in `hooks/` directory
- **Query keys**: Use consistent query key patterns
- **Error handling**: Handle errors in query hooks, show toast notifications

### Database Operations

#### PostgreSQL Client
- **Location**: `lib/postgres/client.ts`
- **Connection**: Always pass `connectionString` (never store in code)
- **Query safety**: Use parameterized queries, never string concatenation
- **Schema handling**: Support schema parameter (default: 'public')
- **Helper functions**: Use `buildQualifiedTableName`, `buildSafeColumnName` from `lib/helpers/query-helpers`

#### Security Requirements
- **Encryption**: All database credentials encrypted with AES (CryptoJS)
- **Storage**: Credentials stored in IndexedDB (local, encrypted)
- **Password protection**: All mutation operations (INSERT, UPDATE, DELETE) require password confirmation
- **Never commit**: Database credentials must never be committed to version control
- **Connection strings**: Always validate and sanitize connection strings

### Helper Functions
- **Location**: `lib/helpers/` directory
- **Organization**: Group by domain (e.g., `filter-helpers.ts`, `table-helpers.ts`)
- **Exports**: Export from `lib/helpers/index.ts` for convenience
- **Type safety**: All helpers should be fully typed

### Internationalization (i18n)
- **Location**: `lib/translations/` (en.json, fr.json, de.json)
- **Context**: Use `useTranslation()` hook from `contexts/translation-context.tsx`
- **Keys**: Use dot notation for nested keys (e.g., `dashboard.table.name`)
- **Fallback**: Always provide English as fallback

### UI Components

#### shadcn/ui
- **Location**: `components/ui/`
- **Customization**: Customize via `components.json` and Tailwind config
- **Usage**: Import from `@/components/ui/[component-name]`

#### Styling
- **Tailwind CSS**: Use utility classes, prefer composition over custom CSS
- **Theme**: Support dark/light theme via `next-themes`
- **Responsive**: Mobile-first approach with Tailwind breakpoints
- **Icons**: Use Phosphor Icons from `@phosphor-icons/react`

### Forms & Validation
- **React Hook Form**: Use for all forms
- **Zod**: Schema validation with `@hookform/resolvers/zod`
- **Error display**: Use shadcn/ui form components for error states

## Development Guidelines

### File Naming
- **Components**: PascalCase (e.g., `TableViewer.tsx`)
- **Hooks**: kebab-case with `use-` prefix (e.g., `use-postgres-query.ts`)
- **Utilities**: kebab-case (e.g., `query-helpers.ts`)
- **Types**: kebab-case (e.g., `table.ts`, `filters.ts`)
- **Stores**: kebab-case with `-store` suffix (e.g., `auth-store.ts`)

### Import Organization
1. React and Next.js imports
2. Third-party libraries
3. Internal imports (components, hooks, lib, types)
4. Type-only imports last

### Error Handling
- **API routes**: Return structured error responses with appropriate status codes
- **Components**: Use error boundaries and loading states
- **User feedback**: Use `sonner` toast notifications for user-facing errors
- **Logging**: Use `console.error` for debugging (remove in production if needed)

### Performance
- **Code splitting**: Leverage Next.js automatic code splitting
- **Data fetching**: Use TanStack Query for caching and optimization
- **Pagination**: Implement pagination for large datasets (default: 50 items per page)
- **Debouncing**: Use `useDebounce` hook for search/filter inputs

### Testing Considerations
- **Type safety**: TypeScript provides compile-time safety
- **Error scenarios**: Always handle edge cases (missing data, network errors, invalid inputs)
- **User experience**: Provide loading states, error states, and empty states

## Security Checklist

- [ ] Never hardcode database credentials
- [ ] Always encrypt credentials before storage
- [ ] Require password confirmation for mutations
- [ ] Validate and sanitize all user inputs
- [ ] Use parameterized queries (never string concatenation)
- [ ] Handle connection errors gracefully
- [ ] Never expose connection strings in client-side code
- [ ] Use HTTPS in production

## Common Patterns

### Table Data Fetching
```typescript
const { data, isLoading, error } = useTableData(
  connectionString,
  schemaName,
  tableName,
  page,
  limit,
  sortColumn,
  sortOrder,
  filters
);
```

### Filter Building
```typescript
import { buildFilterQuery } from '@/lib/helpers/filter-query-builder';
const filterQuery = buildFilterQuery(filters, schemaName, tableName);
```

### Toast Notifications
```typescript
import { toast } from 'sonner';
toast.success('Operation completed');
toast.error('Operation failed');
```

### Translation Usage
```typescript
import { useTranslation } from '@/contexts/translation-context';
const { t } = useTranslation();
const message = t('dashboard.table.loading');
```

## License

This project is licensed under a **Non-Commercial Open Source License**.
- ✅ Free to use for non-commercial purposes
- ✅ Free to modify
- ❌ Cannot sell or use in commercial products without permission

## Additional Resources

- See `README.md` for project overview and features
- See `CONTRIBUTING.md` for contribution guidelines
- Check `components.json` for shadcn/ui configuration
- Review existing code in `lib/helpers/` for helper function patterns

