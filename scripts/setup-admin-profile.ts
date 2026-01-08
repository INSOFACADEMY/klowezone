#!/usr/bin/env node

/**
 * @deprecated This script is deprecated.
 * Use `npm run setup:admin` instead for the official admin setup.
 *
 * This script is kept for backward compatibility but will be removed in a future version.
 * Please update your workflows to use the new script.
 */

console.warn('⚠️  DEPRECATED: This script is deprecated.')
console.warn('   Please use `npm run setup:admin` instead.')
console.warn('   This script only handled profile/organization setup.')
console.warn('   The new script handles complete admin setup including users, roles, profiles, and organizations.')
console.warn('   Run with: npm run setup:admin')
console.warn('')

// Exit with error to force users to use the new script
process.exit(1)




