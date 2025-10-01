"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check, CreditCard, Star, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { subscriptionService } from "@/lib/subscription-service"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function SubscriptionPage() {
  const { user, subscriptionStatus, refreshSubscriptionStatus } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const plan = subscriptionService.getPlan('monthly')!

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (subscriptionStatus?.isSubscribed || subscriptionStatus?.isTrialActive) {
      router.push('/dashboard')
      return
    }
  }, [user, subscriptionStatus, router])

  const handleSubscribe = async () => {
    if (!user) return

    setLoading(true)

    try {
      // Create subscription through API
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: 'monthly',
          userId: user.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription')
      }

      if (data.success && data.subscription) {
        toast.success('Subscription created! Processing payment...')
        
        // For now, redirect to dashboard (in production, this would redirect to payment page)
        // You can customize this based on your payment flow
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }

    } catch (error: any) {
      console.error('Subscription error:', error)
      toast.error(error.message || 'Failed to create subscription')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push('/login')
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={handleBackToLogin}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Unlock Full Access
          </h1>
          <p className="text-xl text-gray-600">
            Get complete access to all restaurant management features
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <Card className="relative w-full max-w-md border-primary shadow-xl">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">
                <Star className="w-4 h-4 mr-1" />
                PREMIUM ACCESS
              </Badge>
            </div>

            <CardHeader className="text-center pb-8 pt-12">
              <CardTitle className="text-3xl font-bold">{plan.name}</CardTitle>
              <div className="mt-6">
                <span className="text-5xl font-bold text-primary">₹{plan.amount / 100}</span>
                <span className="text-gray-500 text-lg">/{plan.interval}</span>
              </div>
              <p className="text-gray-600 mt-3 text-lg">{plan.description}</p>
            </CardHeader>

            <CardContent className="space-y-6">
              <ul className="space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <Check className="w-6 h-6 text-green-500 mr-4 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                <Button
                  className="w-full text-lg py-6 bg-primary hover:bg-primary/90"
                  onClick={handleSubscribe}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-3"></div>
                      Creating Subscription...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-3" />
                      Subscribe Now - ₹99/month
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              🎉 What You Get After Payment
            </h3>
            <p className="text-gray-600 mb-4">
              Immediate access to all premium features including unlimited menu items, 
              complete order management, staff tracking, and advanced analytics.
            </p>
            <div className="flex justify-center items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-1" />
                Cancel anytime
              </span>
              <span className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-1" />
                Secure payments
              </span>
              <span className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-1" />
                24/7 support
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
