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

  // Cache for user data to avoid repeated queries
  const [cachedProfile, setCachedProfile] = useState<any | null>(null)
  const [cachedSubscription, setCachedSubscription] = useState<any | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  const refreshSubscriptionStatus = async () => {
    if (user?.id) {
      try {
        // All users now have free access
        const status = {
          isSubscribed: true,
          isTrialActive: false,
          trialDaysLeft: 0,
          trialEndDate: null,
          subscriptionPlan: 'free',
          subscriptionStatus: 'active'
        }
        setSubscriptionStatus(status)
        setCachedSubscription(status)
        setLastFetchTime(Date.now())
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

    // All users now have free access - redirect to dashboard
    router.push('/dashboard')
  }

  useEffect(() => {
    const supabase = createClient()
    const init = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        setUser(data.user ?? null)
        
        if (data.user) {
          // Check cache first
          const now = Date.now()
          if (cachedProfile && cachedSubscription && (now - lastFetchTime) < CACHE_DURATION) {
            setUserProfile(cachedProfile)
            setSubscriptionStatus(cachedSubscription)
            setLoading(false)
            return
          }

          // Load fresh data if cache expired or missing
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()
          
          setUserProfile(profile || null)
          setCachedProfile(profile || null)
          
          if (profile) {
            // All users now have free access
            const status = {
              isSubscribed: true,
              isTrialActive: false,
              trialDaysLeft: 0,
              trialEndDate: null,
              subscriptionPlan: 'free',
              subscriptionStatus: 'active'
            }
            setSubscriptionStatus(status)
            setCachedSubscription(status)
            setLastFetchTime(Date.now())
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
        // Use cached data if available and fresh
        const now = Date.now()
        if (cachedProfile && cachedSubscription && (now - lastFetchTime) < CACHE_DURATION) {
          setUserProfile(cachedProfile)
          setSubscriptionStatus(cachedSubscription)
          setLoading(false)
          return
        }

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        setUserProfile(profile || null)
        setCachedProfile(profile || null)
        
        if (profile) {
          // All users now have free access
          const status = {
            isSubscribed: true,
            isTrialActive: false,
            trialDaysLeft: 0,
            trialEndDate: null,
            subscriptionPlan: 'free',
            subscriptionStatus: 'active'
          }
          setSubscriptionStatus(status)
          setCachedSubscription(status)
          setLastFetchTime(Date.now())
        }
      } else {
        setUserProfile(null)
        setSubscriptionStatus(null)
        setCachedProfile(null)
        setCachedSubscription(null)
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
