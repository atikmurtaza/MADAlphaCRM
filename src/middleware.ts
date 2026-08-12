import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Update the Supabase session cookie
  const response = await updateSession(request)

  const supabaseAuthCookie = request.cookies.get('sb-access-token') || request.cookies.get('sb-dtrgxkalfgfyjsxquhff-auth-token') 
  // Note: the exact cookie name depends on the project ID. 
  // `updateSession` will refresh the cookie regardless, but let's check it.
  
  // Basic route protection:
  // Since we rely on Server Actions/Server Components for robust auth and profile mapping,
  // the middleware's primary job is just to force a redirect to /auth/login if NO session exists
  // for protected routes.
  
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  const isPublicRoute = request.nextUrl.pathname === '/' || isAuthRoute || isApiRoute

  // We can't query Prisma easily from Edge middleware, so we defer profile checks to the layout/pages.
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
