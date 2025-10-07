import { createClient } from "@/lib/supabase/client"
import type { UserProfile } from "@/lib/supabase-data-service"

export interface SubscriptionStatus {
  isSubscribed: boolean
  isTrialActive: boolean
  trialDaysLeft: number
  trialEndDate: Date | null
  subscriptionPlan: string | null
  subscriptionStatus: string
}

export class SubscriptionService {
  private supabase = createClient()

  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    // Always return free access for all users
    return {
      isSubscribed: true,
      isTrialActive: false,
      trialDaysLeft: 0,
      trialEndDate: null,
      subscriptionPlan: 'free',
      subscriptionStatus: 'active'
    }
  }

  async hasAccess(userId: string): Promise<boolean> {
    // All users have access now
    return true
  }

  async startTrial(userId: string): Promise<void> {
    // No trial needed - everyone gets free access
    return
  }

  async activateSubscription(
    userId: string,
    planId: string
  ): Promise<void> {
    // No subscription activation needed - everyone gets free access
    return
  }

  async cancelSubscription(userId: string): Promise<void> {
    // No subscription to cancel - everyone has free access
    return
  }

  private async logSubscriptionEvent(
    userId: string,
    eventType: string,
    metadata: any = {}
  ): Promise<void> {
    // Logging no longer needed for free product
    return
  }

  getPlan(planId: string): null {
    // No plans needed for free product
    return null
  }

  getAllPlans(): [] {
    // No plans needed for free product
    return []
  }
}

export const subscriptionService = new SubscriptionService()
