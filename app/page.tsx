"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { motion } from "framer-motion"
import { ChefHat } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect authenticated users to dashboard
        router.push("/dashboard")
      } else {
        // Redirect unauthenticated users to login
        router.push("/login")
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
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
