# Contributing to Klowezone

## Development Setup

### Windows Build Issues

**Problem**: On Windows, you might encounter a TypeScript build error like:
```
Debug Failure. Expected ... .tsbuildinfo === ... .tsbuildinfo
```

**Solution**: The build script automatically cleans the `.next` cache directory before building to resolve path separator conflicts between Windows and Unix-style paths in TypeScript's incremental build cache.

The `npm run build` command runs:
```bash
rimraf .next && next build
```

This ensures a clean build environment and prevents caching issues that can occur when switching between operating systems or when cache files become corrupted.

## Admin Setup

The project uses a consolidated admin setup script that handles creating superadmin roles, users, and organizations.

### Running Admin Setup

```bash
# Using npm script (recommended)
npm run setup:admin

# Or run directly with tsx
npx tsx scripts/fix-admin-setup.ts
```

### Environment Variables

The admin setup script supports the following environment variables:

- `ADMIN_EMAIL` (default: `admin@klowezone.com`) - Email for the admin user
- `ADMIN_USER_ID` (optional) - Specific user ID to use (defaults to Supabase Auth user ID)
- `ADMIN_INITIAL_PASSWORD` (optional) - Initial password for the admin user
  - If not provided, a random password will be generated and displayed
- `ADMIN_ORG_SLUG` (optional) - Slug for the default organization
- `ADMIN_ORG_NAME` (optional) - Name for the default organization (default: `KloweZone`)

### What the Script Does

1. Creates or ensures a `superadmin` role exists
2. Creates or ensures an admin user exists in the database with proper authentication
3. Creates or ensures a default organization exists
4. Sets up proper memberships and permissions
5. Configures user profiles and active organization

The script is idempotent - it can be run multiple times safely.

## Code Style

- Use TypeScript for all new code
- Follow the existing patterns for API routes and components
- Run `npm run lint` before committing

## Testing

- Run `npm test` for unit tests
- Run `npm run test:e2e` for end-to-end tests
- Ensure all tests pass before submitting PRs

## Database

- Use Prisma for database operations
- Run migrations with `npx prisma migrate dev`
- Update the schema in `prisma/schema.prisma` when making database changes

