"use client"

import type React from "react"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ChefHat } from "lucide-react"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

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

  return <>{children}</>
}
