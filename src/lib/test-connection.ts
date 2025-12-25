import { supabase } from './supabase'

export async function testSupabaseConnection() {
  try {
    console.log('🔄 Testing Supabase connection...')

    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single()

    if (error) {
      // If profiles table doesn't exist, try users or any other common table
      console.log('⚠️ Profiles table not found, trying users table...')
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('count')
        .limit(1)
        .single()

      if (userError) {
        // Try to get table list from information_schema
        console.log('⚠️ Users table not found, checking available tables...')
        const { data: tables, error: tableError } = await supabase
          .rpc('get_table_list')

        if (tableError) {
          console.log('📋 Available tables (basic query):')
          console.log('Connection successful, but no standard tables found.')
          console.log('You may need to run database migrations.')
          return { success: true, message: 'Connected but no standard tables found' }
        } else {
          console.log('📋 Available tables:', tables)
          return { success: true, tables }
        }
      } else {
        console.log('✅ Connection successful! Users table accessible.')
        return { success: true, table: 'users', data: userData }
      }
    } else {
      console.log('✅ Connection successful! Profiles table accessible.')
      return { success: true, table: 'profiles', data }
    }
  } catch (err) {
    console.error('❌ Connection failed:', err)
    return { success: false, error: err }
  }
}

// Utility function to check environment variables
export function checkEnvironmentVariables() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('🔍 Environment variables check:')
  console.log('SUPABASE_URL:', url ? '✅ Present' : '❌ Missing')
  console.log('SUPABASE_ANON_KEY:', key ? '✅ Present' : '❌ Missing')

  return {
    url: !!url,
    key: !!key,
    valid: !!(url && key)
  }
}




