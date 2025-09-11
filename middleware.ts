import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/']
  
  // If it's a public route, allow access
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // For dashboard routes, we'll let the client-side ProtectedRoute component handle auth
  // This middleware just ensures the route structure is correct
  if (pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  // For any other routes, redirect to login
  if (!publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
