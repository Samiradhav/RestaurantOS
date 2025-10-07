export function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
   
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`)
    console.warn('Some features may not work correctly until these are configured.')
    console.warn('Please check your .env.local file.')
    return false
  }

  console.log('✅ All environment variables are set')
  return true
}