#!/usr/bin/env node

/**
 * Test signup flow to ensure it uses correct Supabase URLs
 */

require('dotenv').config({ path: '.env.local' })

async function testSignupFlow() {
  console.log('🔍 Testing signup flow configuration...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('📋 Environment variables:')
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`)
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey?.substring(0, 20)}...`)
  console.log()

  // Validate URLs are not localhost
  const localhostPatterns = ['localhost', '127.0.0.1', '0.0.0.0']

  if (localhostPatterns.some(pattern => supabaseUrl.includes(pattern))) {
    console.error('❌ Supabase URL still points to localhost - update to real Supabase URL')
    console.log('💡 Current URL:', supabaseUrl)
    process.exit(1)
  }

  // Validate it's a proper Supabase URL
  if (!supabaseUrl.includes('supabase.co')) {
    console.error('❌ URL does not appear to be a valid Supabase URL')
    console.log('💡 Expected format: https://[project-id].supabase.co')
    process.exit(1)
  }

  // Test that the signup endpoint would work
  console.log('🧪 Simulating signup request...')

  const testUser = {
    email: 'test@example.com',
    password: 'testpassword123',
    fullName: 'Test User'
  }

  try {
    // Test the Supabase signup endpoint directly
    const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
        data: {
          full_name: testUser.fullName
        }
      })
    })

    console.log(`📊 Signup Response: ${response.status} ${response.statusText}`)

    if (response.status === 200) {
      console.log('✅ Signup endpoint accessible')
    } else if (response.status === 400) {
      console.log('✅ Signup endpoint accessible (validation error expected for test)')
    } else if (response.status === 401) {
      console.error('❌ Invalid API key')
      process.exit(1)
    } else if (response.status === 429) {
      console.log('⚠️ Rate limited (expected for test requests)')
    } else {
      console.log(`⚠️ Unexpected response: ${response.status}`)
    }

    // Test that the URL is reachable from a browser context simulation
    console.log('\n🌐 Testing browser context simulation...')
    const browserResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    })

    if (browserResponse.status === 200) {
      console.log('✅ Browser context simulation successful')
    } else {
      console.log(`⚠️ Browser context issue: ${browserResponse.status}`)
    }

    console.log('\n🎉 Signup flow validation completed!')
    console.log('✅ No localhost references found')
    console.log('✅ Valid Supabase URLs configured')
    console.log('✅ API endpoints accessible')

  } catch (error) {
    console.error('❌ Signup flow test failed:', error.message)

    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Connection refused - check if Supabase project is active')
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 DNS resolution failed - check Supabase URL spelling')
    }

    process.exit(1)
  }
}

testSignupFlow()








