import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { subscriptionService } from "@/lib/subscription-service"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user and trying to access protected routes, redirect to login
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/signup") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    request.nextUrl.pathname !== "/"
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // If user exists, check subscription status for protected routes
  if (user) {
    const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard")

    if (isProtectedRoute) {
      try {
        // Check subscription status
        const subscriptionStatus = await subscriptionService.getSubscriptionStatus(user.id)

        // If no access and not already going to subscription page, redirect to subscription
        if (!subscriptionStatus.isSubscribed && !subscriptionStatus.isTrialActive && 
            !request.nextUrl.pathname.startsWith("/subscription")) {
          const url = request.nextUrl.clone()
          url.pathname = "/subscription"
          return NextResponse.redirect(url)
        }
      } catch (error) {
        console.error("Error checking subscription status:", error)
        // On error, redirect to login for safety
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
