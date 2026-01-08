// Quick test for security functions
const { isLikelyBrowserRequest, extractIPAddress } = require('./src/lib/security.ts')

// Test isLikelyBrowserRequest with case-insensitive keys
console.log('Testing isLikelyBrowserRequest...')

// Should detect browser headers
console.log('Browser headers (lowercase):', isLikelyBrowserRequest({ 'origin': 'https://example.com' })) // true
console.log('Browser headers (UPPERCASE):', isLikelyBrowserRequest({ 'ORIGIN': 'https://example.com' })) // true
console.log('Browser headers (Mixed):', isLikelyBrowserRequest({ 'Origin': 'https://example.com' })) // true

// Should not detect server headers
console.log('Server headers:', isLikelyBrowserRequest({ 'user-agent': 'curl/7.68.0' })) // false

console.log('\nTesting extractIPAddress...')

// Should extract IPs correctly
console.log('Single IP:', extractIPAddress({ 'x-forwarded-for': '192.168.1.100' })) // '192.168.1.100'
console.log('Multiple IPs:', extractIPAddress({ 'x-forwarded-for': '192.168.1.100, 10.0.0.1' })) // '192.168.1.100'
console.log('Array format:', extractIPAddress({ 'x-forwarded-for': ['192.168.1.100', '10.0.0.1'] })) // '192.168.1.100'
console.log('Case insensitive:', extractIPAddress({ 'X-FORWARDED-FOR': '192.168.1.100' })) // '192.168.1.100'
console.log('Fallback to x-real-ip:', extractIPAddress({ 'x-real-ip': '10.0.0.50' })) // '10.0.0.50'

console.log('\nAll tests completed!')

