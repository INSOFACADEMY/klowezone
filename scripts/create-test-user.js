// Script to create a test user in Supabase Auth for E2E tests
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function createTestUser() {
  console.log('👤 Creating test user for E2E tests...\n')

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase environment variables')
    console.log('Required:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL')
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const testEmail = 'test@klowezone.com'
  const testPassword = 'TestPass123!'

  try {
    // Check if user already exists
    console.log('🔍 Checking if test user exists...')
    const { data: existingUser } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (existingUser?.user) {
      console.log('✅ Test user already exists')
      console.log('📧 Email:', testEmail)
      console.log('🔑 Password:', testPassword)
      return
    }
  } catch (error) {
    // User doesn't exist, continue with creation
  }

  try {
    console.log('📝 Creating new test user...')
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User',
          role: 'member'
        }
      }
    })

    if (error) {
      console.error('❌ Error creating user:', error.message)
      process.exit(1)
    }

    if (data.user && !data.user.email_confirmed_at) {
      console.log('⚠️  User created but needs email confirmation')
      console.log('Please check your email and confirm the account')
      console.log('Then run this script again to verify')
      process.exit(1)
    }

    console.log('✅ Test user created successfully!')
    console.log('📧 Email:', testEmail)
    console.log('🔑 Password:', testPassword)
    console.log('')
    console.log('🔧 Update your test helpers with these credentials')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

createTestUser()


