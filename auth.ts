import 'server-only'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// ✅ Optional safety check: Make sure env vars exist
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are missing. Check your .env.local and Vercel settings.')
}

export const auth = async ({
  cookieStore
}: {
  cookieStore: ReturnType<typeof cookies>
}) => {
  // ✅ Create Supabase client with cookie-based auth
  const supabase = createServerComponentClient({
    cookies: () => cookieStore
  })

  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}