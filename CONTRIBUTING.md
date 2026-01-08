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
