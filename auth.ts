process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://qjflshabwwxphbicouoz.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZmxzaGFid3d4cGhiaWNvdW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NTg5MzYsImV4cCI6MjA2MzMzNDkzNn0.Vq8M3wt47btE0vaUCkSinOmBaUeFtinpSbvBHHKStNw';

import 'server-only'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const auth = async ({
  cookieStore
}: {
  cookieStore: ReturnType<typeof cookies>
}) => {
  // Create a Supabase client configured to use cookies
  const supabase = createServerComponentClient({
    cookies: () => cookieStore
  })
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}
