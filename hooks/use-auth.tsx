"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { subscriptionService } from "@/lib/subscription-service"

interface AuthContextType {
  user: User | null
  userProfile: any | null
  subscriptionStatus: any | null
  loading: boolean
  logout: () => Promise<void>
  refreshSubscriptionStatus: () => Promise<void>
  checkAndRedirect: (router: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  subscriptionStatus: null,
  loading: true,
  logout: async () => {},
  refreshSubscriptionStatus: async () => {},
  checkAndRedirect: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSubscriptionStatus = async () => {
    if (user?.id) {
      try {
        const status = await subscriptionService.getSubscriptionStatus(user.id)
        setSubscriptionStatus(status)
      } catch (error) {
        console.error('Error refreshing subscription status:', error)
      }
    }
  }

  const checkAndRedirect = async (router: any) => {
    if (!user) {
      router.push('/login')
      return
    }

    // Refresh subscription status to get latest data
    await refreshSubscriptionStatus()

    // Check if user has access (subscribed or trial active)
    if (subscriptionStatus?.isSubscribed || subscriptionStatus?.isTrialActive) {
      router.push('/dashboard')
    } else {
      router.push('/subscription')
    }
  }

  useEffect(() => {
    const supabase = createClient()
    const init = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        setUser(data.user ?? null)
        
        if (data.user) {
          // Load user profile and subscription status
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()
          
          setUserProfile(profile || null)
          
          if (profile) {
            const status = await subscriptionService.getSubscriptionStatus(data.user.id)
            setSubscriptionStatus(status)
          }
        }
      } catch (error) {
        console.error("Error getting user:", error)
        setUser(null)
        setUserProfile(null)
        setSubscriptionStatus(null)
      } finally {
        setLoading(false)
      }
    }
    init()

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Load user profile and subscription status
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        setUserProfile(profile || null)
        
        if (profile) {
          const status = await subscriptionService.getSubscriptionStatus(session.user.id)
          setSubscriptionStatus(status)
        }
      } else {
        setUserProfile(null)
        setSubscriptionStatus(null)
      }
      
      setLoading(false)
    })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    setSubscriptionStatus(null)
  }

  return <AuthContext.Provider value={{ 
    user, 
    userProfile, 
    subscriptionStatus, 
    loading, 
    logout, 
    refreshSubscriptionStatus,
    checkAndRedirect 
  }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
