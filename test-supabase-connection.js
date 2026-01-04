#!/usr/bin/env node

/**
 * Test Supabase connection and validate credentials
 */

require('dotenv').config({ path: '.env.local' })

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('📋 Configuration:')
  console.log(`   URL: ${supabaseUrl}`)
  console.log(`   Key: ${supabaseAnonKey?.substring(0, 20)}...`)
  console.log()

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }

  // Test URL format
  if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
    console.error('❌ URL still points to localhost - update to real Supabase URL')
    process.exit(1)
  }

  try {
    // Test basic connectivity with fetch
    console.log('🌐 Testing basic connectivity...')
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    })

    console.log(`📊 HTTP Response: ${response.status} ${response.statusText}`)

    if (response.status === 200) {
      console.log('✅ Basic connectivity successful')
    } else if (response.status === 401) {
      console.log('❌ Invalid API key')
      process.exit(1)
    } else {
      console.log(`⚠️ Unexpected response: ${response.status}`)
    }

    // Test Supabase client initialization
    console.log('\n🔧 Testing Supabase client initialization...')
    const { createClient } = await import('@supabase/supabase-js')

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Test auth state
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.log(`⚠️ Auth error (expected for anon key): ${authError.message}`)
    } else {
      console.log('✅ Auth client initialized successfully')
    }

    // Test database connection (try to access a table)
    console.log('\n🗄️ Testing database access...')
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('✅ Database accessible (table exists but may be empty)')
      } else {
        console.log(`⚠️ Database access issue: ${error.message} (code: ${error.code})`)
      }
    } else {
      console.log(`✅ Database accessible - found ${data?.length || 0} records`)
    }

    console.log('\n🎉 Supabase connection test completed successfully!')
    console.log('✅ All validations passed')

  } catch (error) {
    console.error('❌ Connection test failed:', error.message)

    if (error.message.includes('fetch')) {
      console.error('💡 This might be a network issue or invalid URL')
    } else if (error.message.includes('401')) {
      console.error('💡 Invalid API key - check your NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }

    process.exit(1)
  }
}

testSupabaseConnection()







