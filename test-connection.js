// Simple Node.js script to test Supabase connection
// Run with: node test-connection.js

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Checking environment variables...')
console.log('SUPABASE_URL:', supabaseUrl ? '✅ Present' : '❌ Missing')
console.log('SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Present' : '❌ Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables. Please check your .env.local file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('🔄 Testing Supabase connection...')

    // Try to get a basic response from Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (error) {
      console.log('⚠️ Profiles table not accessible:', error.message)

      // Try users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .limit(1)

      if (userError) {
        console.log('⚠️ Users table not accessible:', userError.message)
        console.log('ℹ️ Connection established, but tables may not exist yet.')
        console.log('ℹ️ Make sure to run your database migrations.')
      } else {
        console.log('✅ Connection successful! Users table accessible.')
      }
    } else {
      console.log('✅ Connection successful! Profiles table accessible.')
      console.log('📊 Sample data:', data)
    }

  } catch (err) {
    console.error('❌ Connection failed:', err.message)
  }
}

testConnection()











