import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  try {
    const supabase = createMiddlewareClient({ req, res })

    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (
      !session &&
      !req.url.includes('/sign-in') &&
      !req.url.includes('/sign-up')
    ) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/sign-in'
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error('❌ Supabase middleware error:', error)
    return res
  }
}

export const config = {
  matcher: [
    '/((?!share|api|_next/static|_next/image|favicon.ico).*)'
  ]
}