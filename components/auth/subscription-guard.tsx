"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ChefHat } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user, subscriptionStatus, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && user && subscriptionStatus) {
      // User is authenticated but subscription check failed, redirect to subscription
      if (!subscriptionStatus.isSubscribed && !subscriptionStatus.isTrialActive) {
        router.push('/subscription')
      }
    }
    // Don't redirect to login here - let middleware handle authentication
  }, [user, subscriptionStatus, loading, router])

  // During SSR and initial hydration, show minimal loading state
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background">
        {mounted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center min-h-screen"
          >
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <ChefHat className="h-8 w-8 text-primary animate-pulse" />
                </div>
              </div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </motion.div>
        )}
      </div>
    )
  }

  if (!user) {
    return null
  }

  // If user has access (subscribed or trial active), show children
  if (subscriptionStatus?.isSubscribed || subscriptionStatus?.isTrialActive) {
    return <>{children}</>
  }

  // User doesn't have access, redirect to subscription page
  return null
}