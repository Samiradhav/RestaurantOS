"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ChefHat } from "lucide-react"

// Demo mode flag - set to true for development without Supabase
const DEMO_MODE = true

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(!DEMO_MODE)

  useEffect(() => {
    if (DEMO_MODE) {
      // Skip authentication in demo mode - redirect to dashboard after brief loading
      const timer = setTimeout(() => {
        router.push('/dashboard')
      }, 1500) // 1.5 second loading for better UX

      return () => clearTimeout(timer)
    } else {
      // Original authentication logic (for when Supabase is set up)
      // const { user, loading, checkAndRedirect } = useAuth()
      // if (!loading) {
      //   checkAndRedirect(router)
      // }
    }
  }, [router])

  if (DEMO_MODE && isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <ChefHat className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Loading RestaurantOS...</h1>
          <p className="text-muted-foreground mt-2">Please wait while we prepare your experience</p>
        </motion.div>
      </div>
    )
  }

  return null // Will redirect to dashboard
}